-- Melody Challenger backend hardening v1
-- Atomic, authenticated settlement functions. Apply before revoking legacy writes.

create or replace function public.mc_level_for_xp(p_total_xp integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select level from public.level_config
    where required_xp <= greatest(p_total_xp, 0)
    order by required_xp desc limit 1
  ), 1);
$$;

revoke all on function public.mc_level_for_xp(integer) from public, anon, authenticated;

create or replace function public.mc_add_xp(
  p_user_id uuid,
  p_amount integer,
  p_source text,
  p_source_id text
) returns table(total_xp integer, current_level integer, level_up boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := current_date;
  v_old_level integer := 1;
  v_new_total integer;
  v_new_level integer;
begin
  if p_amount < 0 or p_amount > 5000 then
    raise exception 'invalid xp amount';
  end if;

  insert into public.user_xp (user_id, total_xp, current_level, xp_today, last_xp_date, updated_at)
  values (p_user_id, p_amount, public.mc_level_for_xp(p_amount), p_amount, v_today, now())
  on conflict (user_id) do update set
    total_xp = coalesce(user_xp.total_xp, 0) + excluded.total_xp,
    xp_today = case when user_xp.last_xp_date = v_today
      then coalesce(user_xp.xp_today, 0) + excluded.xp_today else excluded.xp_today end,
    last_xp_date = v_today,
    updated_at = now()
  returning user_xp.total_xp, coalesce(user_xp.current_level, 1) into v_new_total, v_old_level;

  v_new_level := public.mc_level_for_xp(v_new_total);
  update public.user_xp set current_level = v_new_level where user_id = p_user_id;

  insert into public.xp_logs (user_id, xp_amount, source, source_id)
  values (p_user_id, p_amount, p_source, p_source_id);

  return query select v_new_total, v_new_level, v_new_level > v_old_level;
end;
$$;

revoke all on function public.mc_add_xp(uuid, integer, text, text) from public, anon, authenticated;

create or replace function public.mc_update_streak()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := current_date;
  v_row public.user_streaks%rowtype;
  v_new_streak integer := 1;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  select * into v_row from public.user_streaks where user_id = v_user_id for update;

  if found and v_row.last_activity_date = v_today then
    return jsonb_build_object('currentStreak', v_row.current_streak, 'longestStreak', v_row.longest_streak);
  end if;
  if found and v_row.last_activity_date = v_today - 1 then
    v_new_streak := coalesce(v_row.current_streak, 0) + 1;
  end if;

  insert into public.user_streaks (user_id, current_streak, longest_streak, last_activity_date, updated_at)
  values (v_user_id, v_new_streak, v_new_streak, v_today, now())
  on conflict (user_id) do update set
    current_streak = excluded.current_streak,
    longest_streak = greatest(coalesce(user_streaks.longest_streak, 0), excluded.current_streak),
    last_activity_date = v_today,
    updated_at = now()
  returning * into v_row;

  return jsonb_build_object('currentStreak', v_row.current_streak, 'longestStreak', v_row.longest_streak);
end;
$$;

grant execute on function public.mc_update_streak() to authenticated;
revoke all on function public.mc_update_streak() from public, anon;

create or replace function public.mc_claim_achievements()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_lessons integer;
  v_skills integer;
  v_streak integer;
  v_total_xp integer;
  v_level integer;
  v_metric integer;
  v_achievement public.achievements%rowtype;
  v_unlocked text[] := '{}';
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  select count(*) into v_lessons from public.user_lesson_progress where user_id = v_user_id and status = 'completed';
  select count(*) into v_skills from public.user_skill_progress where user_id = v_user_id and status = 'completed';
  select coalesce(current_streak, 0) into v_streak from public.user_streaks where user_id = v_user_id;
  select coalesce(total_xp, 0), coalesce(current_level, 1) into v_total_xp, v_level from public.user_xp where user_id = v_user_id;
  v_streak := coalesce(v_streak, 0); v_total_xp := coalesce(v_total_xp, 0); v_level := coalesce(v_level, 1);

  for v_achievement in select * from public.achievements where condition_type is not null loop
    v_metric := case v_achievement.condition_type
      when 'lessons_completed' then v_lessons when 'skills_completed' then v_skills
      when 'streak_days' then v_streak when 'total_xp' then v_total_xp
      when 'level' then v_level else null end;
    if v_metric is not null and v_metric >= coalesce(v_achievement.condition_value, 1) then
      insert into public.user_achievements (user_id, achievement_id)
      values (v_user_id, v_achievement.id) on conflict (user_id, achievement_id) do nothing;
      if found then
        v_unlocked := array_append(v_unlocked, v_achievement.id);
        if coalesce(v_achievement.xp_reward, 0) > 0 then
          perform public.mc_add_xp(v_user_id, v_achievement.xp_reward, 'achievement', v_achievement.id);
        end if;
      end if;
    end if;
  end loop;
  return jsonb_build_object('unlockedIds', to_jsonb(v_unlocked));
end;
$$;

grant execute on function public.mc_claim_achievements() to authenticated;
revoke all on function public.mc_claim_achievements() from public, anon;

create or replace function public.mc_complete_lesson(
  p_lesson_id text,
  p_score integer,
  p_stars integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_lesson public.lessons%rowtype;
  v_existing public.user_lesson_progress%rowtype;
  v_threshold numeric;
  v_passed boolean;
  v_first_completion boolean := false;
  v_xp record;
  v_next_lesson_id text;
  v_skill_first_completion boolean := false;
  v_skill_reward integer := 0;
  v_dependent record;
  v_first_lesson_id text;
  v_level_up boolean := false;
  v_total_xp integer;
  v_current_level integer;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if p_score < 0 or p_score > 100 or p_stars < 0 or p_stars > 3 then
    raise exception 'invalid lesson result';
  end if;

  select * into v_lesson from public.lessons where id = p_lesson_id;
  if not found then raise exception 'lesson not found'; end if;

  begin
    v_threshold := coalesce((v_lesson.content->>'passThreshold')::numeric, 0.7);
  exception when others then
    v_threshold := 0.7;
  end;
  v_passed := p_score >= round(v_threshold * 100);

  select * into v_existing from public.user_lesson_progress
  where user_id = v_user_id and lesson_id = p_lesson_id for update;
  v_first_completion := v_passed and (not found or coalesce(v_existing.status, '') <> 'completed');

  insert into public.user_lesson_progress
    (user_id, lesson_id, status, best_score, stars, attempts, last_attempt_at, completed_at)
  values
    (v_user_id, p_lesson_id, case when v_passed then 'completed' else 'unlocked' end,
     p_score, p_stars, 1, now(), case when v_passed then now() else null end)
  on conflict (user_id, lesson_id) do update set
    status = case when user_lesson_progress.status = 'completed' or v_passed then 'completed' else 'unlocked' end,
    best_score = greatest(coalesce(user_lesson_progress.best_score, 0), excluded.best_score),
    stars = greatest(coalesce(user_lesson_progress.stars, 0), excluded.stars),
    attempts = coalesce(user_lesson_progress.attempts, 0) + 1,
    last_attempt_at = now(),
    completed_at = case when v_passed then coalesce(user_lesson_progress.completed_at, now()) else user_lesson_progress.completed_at end;

  if v_first_completion then
    select * into v_xp from public.mc_add_xp(v_user_id, coalesce(v_lesson.xp_reward, 0), 'lesson', p_lesson_id);
    v_level_up := v_xp.level_up; v_total_xp := v_xp.total_xp; v_current_level := v_xp.current_level;
  end if;

  if v_passed then
    select id into v_next_lesson_id from public.lessons
    where skill_id = v_lesson.skill_id and lesson_order > v_lesson.lesson_order
    order by lesson_order limit 1;
    if v_next_lesson_id is not null then
      insert into public.user_lesson_progress (user_id, lesson_id, status)
      values (v_user_id, v_next_lesson_id, 'unlocked')
      on conflict (user_id, lesson_id) do update set
        status = case when user_lesson_progress.status = 'completed' then 'completed' else 'unlocked' end;
    end if;

    if not exists (
      select 1 from public.lessons l
      where l.skill_id = v_lesson.skill_id and not exists (
        select 1 from public.user_lesson_progress p
        where p.user_id = v_user_id and p.lesson_id = l.id and p.status = 'completed'
      )
    ) then
      select coalesce(status, '') <> 'completed' into v_skill_first_completion
      from public.user_skill_progress where user_id = v_user_id and skill_id = v_lesson.skill_id for update;
      v_skill_first_completion := coalesce(v_skill_first_completion, true);
      insert into public.user_skill_progress (user_id, skill_id, status, completed_at)
      values (v_user_id, v_lesson.skill_id, 'completed', now())
      on conflict (user_id, skill_id) do update set status = 'completed', completed_at = coalesce(user_skill_progress.completed_at, now());

      if v_skill_first_completion then
        select coalesce(xp_reward, 0) into v_skill_reward from public.skills where id = v_lesson.skill_id;
        if v_skill_reward > 0 then
          select * into v_xp from public.mc_add_xp(v_user_id, v_skill_reward, 'skill', v_lesson.skill_id);
          v_level_up := v_level_up or v_xp.level_up; v_total_xp := v_xp.total_xp; v_current_level := v_xp.current_level;
        end if;
      end if;

      for v_dependent in select id from public.skills where prerequisite_skill_id = v_lesson.skill_id loop
        insert into public.user_skill_progress (user_id, skill_id, status) values (v_user_id, v_dependent.id, 'unlocked')
        on conflict (user_id, skill_id) do update set status = case when user_skill_progress.status = 'completed' then 'completed' else 'unlocked' end;
        select id into v_first_lesson_id from public.lessons where skill_id = v_dependent.id order by lesson_order limit 1;
        if v_first_lesson_id is not null then
          insert into public.user_lesson_progress (user_id, lesson_id, status) values (v_user_id, v_first_lesson_id, 'unlocked')
          on conflict (user_id, lesson_id) do update set status = case when user_lesson_progress.status = 'completed' then 'completed' else 'unlocked' end;
        end if;
      end loop;
    end if;
  end if;

  return jsonb_build_object(
    'passed', v_passed,
    'firstCompletion', v_first_completion,
    'skillFirstCompletion', v_skill_first_completion,
    'nextLessonId', v_next_lesson_id,
    'totalXp', v_total_xp,
    'currentLevel', v_current_level,
    'levelUp', v_level_up
  );
end;
$$;

grant execute on function public.mc_complete_lesson(text, integer, integer) to authenticated;
revoke all on function public.mc_complete_lesson(text, integer, integer) from public, anon;

create or replace function public.mc_submit_daily_challenge(
  p_score integer,
  p_challenge_type text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := current_date;
  v_existing_score integer;
  v_first boolean := false;
  v_best integer;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if p_score < 0 or p_score > 100 then raise exception 'invalid challenge score'; end if;
  if p_challenge_type not in ('random','quiz','sing','interval','mixed','speed','hard') then
    raise exception 'invalid challenge type';
  end if;

  select score into v_existing_score from public.daily_challenge_scores
  where user_id = v_user_id and challenge_date = v_today for update;
  v_first := not found;

  insert into public.daily_challenge_scores (user_id, challenge_date, score, challenge_type)
  values (v_user_id, v_today, p_score, p_challenge_type)
  on conflict (user_id, challenge_date) do update set score = greatest(coalesce(daily_challenge_scores.score, 0), excluded.score)
  returning score into v_best;

  if v_first then
    perform public.mc_add_xp(v_user_id, 50, 'daily_challenge', v_today::text);
  end if;

  return jsonb_build_object('bestScore', v_best, 'firstCompletion', v_first, 'xpAwarded', case when v_first then 50 else 0 end);
end;
$$;

grant execute on function public.mc_submit_daily_challenge(integer, text) to authenticated;
revoke all on function public.mc_submit_daily_challenge(integer, text) from public, anon;

create or replace function public.mc_submit_game_score(
  p_game_mode text,
  p_score integer,
  p_level integer,
  p_count_game boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.leaderboard%rowtype;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if p_game_mode not in ('quiz','sing') or p_score < 0 or p_score > 1000000 or p_level < 1 or p_level > 10000 then
    raise exception 'invalid game result';
  end if;

  insert into public.leaderboard (user_id, game_mode, best_score, best_level, total_games)
  values (v_user_id, p_game_mode, p_score, p_level, case when p_count_game then 1 else 0 end)
  on conflict (user_id, game_mode) do update set
    best_score = greatest(leaderboard.best_score, excluded.best_score),
    best_level = greatest(leaderboard.best_level, excluded.best_level),
    total_games = leaderboard.total_games + excluded.total_games
  returning * into v_row;

  return jsonb_build_object('bestScore', v_row.best_score, 'bestLevel', v_row.best_level, 'totalGames', v_row.total_games);
end;
$$;

grant execute on function public.mc_submit_game_score(text, integer, integer, boolean) to authenticated;
revoke all on function public.mc_submit_game_score(text, integer, integer, boolean) from public, anon;

create or replace function public.mc_submit_pk_score(
  p_challenge_id uuid,
  p_score integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_challenge public.friend_challenges%rowtype;
  v_winner uuid;
  v_completed boolean := false;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if p_score < 0 or p_score > 100 then raise exception 'invalid pk score'; end if;

  select * into v_challenge from public.friend_challenges where id = p_challenge_id for update;
  if not found then raise exception 'challenge not found'; end if;
  if v_user_id not in (v_challenge.challenger_id, v_challenge.opponent_id) then raise exception 'forbidden'; end if;
  if v_challenge.status not in ('accepted','in_progress') then raise exception 'challenge is not active'; end if;
  if v_challenge.expires_at is not null and v_challenge.expires_at <= now() then raise exception 'challenge expired'; end if;

  if v_user_id = v_challenge.challenger_id then
    if v_challenge.challenger_score is not null then raise exception 'score already submitted'; end if;
    v_challenge.challenger_score := p_score;
  else
    if v_challenge.opponent_score is not null then raise exception 'score already submitted'; end if;
    v_challenge.opponent_score := p_score;
  end if;

  v_completed := v_challenge.challenger_score is not null and v_challenge.opponent_score is not null;
  if v_completed then
    v_winner := case
      when v_challenge.challenger_score > v_challenge.opponent_score then v_challenge.challenger_id
      when v_challenge.opponent_score > v_challenge.challenger_score then v_challenge.opponent_id
      else null end;
  end if;

  update public.friend_challenges set
    challenger_score = v_challenge.challenger_score,
    opponent_score = v_challenge.opponent_score,
    status = case when v_completed then 'completed' else 'in_progress' end,
    winner_id = v_winner,
    completed_at = case when v_completed then now() else null end
  where id = p_challenge_id;

  return jsonb_build_object('completed', v_completed, 'winnerId', v_winner);
end;
$$;

grant execute on function public.mc_submit_pk_score(uuid, integer) to authenticated;
revoke all on function public.mc_submit_pk_score(uuid, integer) from public, anon;

create or replace function public.mc_respond_pk(p_challenge_id uuid, p_accept boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  update public.friend_challenges set status = case when p_accept then 'accepted' else 'declined' end
  where id = p_challenge_id and opponent_id = v_user_id and status = 'pending'
    and (expires_at is null or expires_at > now());
  return found;
end;
$$;
grant execute on function public.mc_respond_pk(uuid, boolean) to authenticated;
revoke all on function public.mc_respond_pk(uuid, boolean) from public, anon;

-- Apply only after all production clients use the RPCs:
-- drop policy if exists "Users can insert own xp" on public.user_xp;
-- drop policy if exists "Users can update own xp" on public.user_xp;
-- drop policy if exists "Users can insert own xp logs" on public.xp_logs;
-- drop policy if exists "Users can insert their own leaderboard entry" on public.leaderboard;
-- drop policy if exists "Users can update their own leaderboard entry" on public.leaderboard;
-- drop policy if exists "Users can insert own daily challenge scores" on public.daily_challenge_scores;
-- drop policy if exists "Users can update own daily challenge scores" on public.daily_challenge_scores;
-- drop policy if exists "Users can update own challenges" on public.friend_challenges;
-- drop policy if exists "Users can insert own achievements" on public.user_achievements;
-- drop policy if exists "Users can insert own streaks" on public.user_streaks;
-- drop policy if exists "Users can update own streaks" on public.user_streaks;

-- Run only after the v3.3 RPC client is live.
-- Removes browser write access to rewards, progress and result tables.

drop policy if exists "Users can insert own xp" on public.user_xp;
drop policy if exists "Users can update own xp" on public.user_xp;
drop policy if exists "Users can insert own xp logs" on public.xp_logs;

drop policy if exists "Users can insert their own leaderboard entry" on public.leaderboard;
drop policy if exists "Users can update their own leaderboard entry" on public.leaderboard;

drop policy if exists "Users can insert own daily challenge scores" on public.daily_challenge_scores;
drop policy if exists "Users can update own daily challenge scores" on public.daily_challenge_scores;

drop policy if exists "Users can update own challenges" on public.friend_challenges;
drop policy if exists "Users can insert own achievements" on public.user_achievements;
drop policy if exists "Users can insert own streaks" on public.user_streaks;
drop policy if exists "Users can update own streaks" on public.user_streaks;

drop policy if exists "Users can insert own lesson progress" on public.user_lesson_progress;
drop policy if exists "Users can update own lesson progress" on public.user_lesson_progress;
drop policy if exists "Users can insert own skill progress" on public.user_skill_progress;
drop policy if exists "Users can update own skill progress" on public.user_skill_progress;

-- Rollback reference (do not execute during normal deployment):
-- create policy "Users can insert own xp" on public.user_xp for insert with check (auth.uid() = user_id);
-- create policy "Users can update own xp" on public.user_xp for update using (auth.uid() = user_id);
-- create policy "Users can insert own xp logs" on public.xp_logs for insert with check (auth.uid() = user_id);
-- create policy "Users can insert their own leaderboard entry" on public.leaderboard for insert with check (auth.uid() = user_id);
-- create policy "Users can update their own leaderboard entry" on public.leaderboard for update using (auth.uid() = user_id);
-- create policy "Users can insert own daily challenge scores" on public.daily_challenge_scores for insert with check (auth.uid() = user_id);
-- create policy "Users can update own daily challenge scores" on public.daily_challenge_scores for update using (auth.uid() = user_id);
-- create policy "Users can update own challenges" on public.friend_challenges for update using (auth.uid() = challenger_id or auth.uid() = opponent_id);
-- create policy "Users can insert own achievements" on public.user_achievements for insert with check (auth.uid() = user_id);
-- create policy "Users can insert own streaks" on public.user_streaks for insert with check (auth.uid() = user_id);
-- create policy "Users can update own streaks" on public.user_streaks for update using (auth.uid() = user_id);
-- create policy "Users can insert own lesson progress" on public.user_lesson_progress for insert with check (auth.uid() = user_id);
-- create policy "Users can update own lesson progress" on public.user_lesson_progress for update using (auth.uid() = user_id);
-- create policy "Users can insert own skill progress" on public.user_skill_progress for insert with check (auth.uid() = user_id);
-- create policy "Users can update own skill progress" on public.user_skill_progress for update using (auth.uid() = user_id);

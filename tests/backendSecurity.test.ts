import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

const protectedClients = [
  'src/pages/LessonPage.tsx',
  'src/pages/DailyChallenge.tsx',
  'src/pages/QuizMode.tsx',
  'src/pages/SingMode.tsx',
  'src/store/useUserStore.ts',
  'src/utils/achievementChecker.ts',
];

describe('backend security architecture', () => {
  it('keeps reward and score writes behind settlement RPCs', () => {
    const protectedTables = ['user_xp', 'xp_logs', 'leaderboard', 'daily_challenge_scores', 'user_achievements', 'user_streaks'];
    for (const path of protectedClients) {
      const source = read(path);
      for (const table of protectedTables) {
        const marker = `.from('${table}')`;
        let offset = source.indexOf(marker);
        while (offset >= 0) {
          const following = source.slice(offset, offset + 320);
          expect(following, `${path} directly writes ${table}`).not.toMatch(/[.](insert|update|upsert)[(]/);
          offset = source.indexOf(marker, offset + marker.length);
        }
      }
    }
  });

  it('limits settlement execution to authenticated users', () => {
    const migration = read('src/lib/backend-hardening-v1.sql');
    const publicFunctions = [
      'mc_complete_lesson', 'mc_submit_daily_challenge', 'mc_submit_game_score',
      'mc_submit_pk_score', 'mc_respond_pk', 'mc_update_streak', 'mc_claim_achievements',
    ];

    for (const functionName of publicFunctions) {
      expect(migration).toContain(`grant execute on function public.${functionName}`);
      expect(migration).toMatch(new RegExp(`revoke all on function public[.]${functionName}[^;]*from public, anon;`));
    }
  });
});

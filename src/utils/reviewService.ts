/**
 * 复习服务
 * 处理复习计划的创建、更新和查询
 */

import { supabase } from '../lib/supabase';
import { calculateNextReview, scoreToQuality } from './spacedRepetition';

/**
 * 添加或更新复习计划
 * 
 * @param userId 用户ID
 * @param lessonId 课程ID
 * @param score 课程得分 (0-100)
 */
export async function updateReviewSchedule(
  userId: string,
  lessonId: string,
  score: number
): Promise<void> {
  try {
    const quality = scoreToQuality(score);
    
    // 查询现有复习计划
    const { data: existing, error: selectError } = await supabase
      .from('user_review_schedule')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (selectError) {
      console.error('[ReviewService] Error fetching existing schedule:', selectError);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (existing) {
      // 更新现有计划
      const result = calculateNextReview(
        {
          lessonId,
          easeFactor: existing.ease_factor,
          intervalDays: existing.interval_days,
          repetitions: existing.repetitions,
          nextReviewDate: new Date(existing.next_review_date),
        },
        quality
      );

      const { error: updateError } = await supabase
        .from('user_review_schedule')
        .update({
          ease_factor: result.easeFactor,
          interval_days: result.intervalDays,
          repetitions: result.repetitions,
          next_review_date: result.nextReviewDate.toISOString().split('T')[0],
          last_review_date: today.toISOString().split('T')[0],
          last_quality: quality,
          total_reviews: existing.total_reviews + 1,
          correct_count: quality >= 3 ? existing.correct_count + 1 : existing.correct_count,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('[ReviewService] Error updating schedule:', updateError);
      } else {
        console.log('[ReviewService] Schedule updated:', { lessonId, quality, nextReview: result.nextReviewDate });
      }
    } else {
      // 创建新计划
      const result = calculateNextReview(
        {
          lessonId,
          easeFactor: 2.5,
          intervalDays: 1,
          repetitions: 0,
          nextReviewDate: today,
        },
        quality
      );

      const { error: insertError } = await supabase
        .from('user_review_schedule')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          ease_factor: result.easeFactor,
          interval_days: result.intervalDays,
          repetitions: result.repetitions,
          next_review_date: result.nextReviewDate.toISOString().split('T')[0],
          last_review_date: today.toISOString().split('T')[0],
          last_quality: quality,
          total_reviews: 1,
          correct_count: quality >= 3 ? 1 : 0,
        });

      if (insertError) {
        console.error('[ReviewService] Error creating schedule:', insertError);
      } else {
        console.log('[ReviewService] Schedule created:', { lessonId, quality, nextReview: result.nextReviewDate });
      }
    }
  } catch (err) {
    console.error('[ReviewService] Error:', err);
  }
}

/**
 * 获取今日待复习数量
 */
export async function getTodayReviewCount(userId: string): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('user_review_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('next_review_date', today.toISOString().split('T')[0]);

    if (error) {
      console.error('[ReviewService] Error getting count:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('[ReviewService] Error:', err);
    return 0;
  }
}

/**
 * 记录答题统计（用于薄弱点分析）
 */
export async function recordQuestionStat(
  userId: string,
  questionType: 'note' | 'interval' | 'chord',
  targetValue: string,
  isCorrect: boolean,
  responseTime?: number
): Promise<void> {
  try {
    // 查询现有统计
    const { data: existing, error: selectError } = await supabase
      .from('user_question_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('question_type', questionType)
      .eq('target_value', targetValue)
      .maybeSingle();

    if (selectError) {
      console.error('[ReviewService] Error fetching question stats:', selectError);
      return;
    }

    if (existing) {
      // 更新统计
      const newAttempts = existing.attempts + 1;
      const newCorrect = isCorrect ? existing.correct + 1 : existing.correct;
      const newAvgTime = responseTime
        ? ((existing.avg_response_time || 0) * existing.attempts + responseTime) / newAttempts
        : existing.avg_response_time;

      await supabase
        .from('user_question_stats')
        .update({
          attempts: newAttempts,
          correct: newCorrect,
          avg_response_time: newAvgTime,
          last_attempt_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // 创建新统计
      await supabase
        .from('user_question_stats')
        .insert({
          user_id: userId,
          question_type: questionType,
          target_value: targetValue,
          attempts: 1,
          correct: isCorrect ? 1 : 0,
          avg_response_time: responseTime || null,
          last_attempt_at: new Date().toISOString(),
        });
    }
  } catch (err) {
    console.error('[ReviewService] Error recording question stat:', err);
  }
}

/**
 * 获取薄弱点分析
 */
export async function getWeakPoints(
  userId: string,
  limit: number = 10
): Promise<Array<{
  questionType: string;
  targetValue: string;
  attempts: number;
  correct: number;
  accuracy: number;
}>> {
  try {
    const { data, error } = await supabase
      .from('user_question_stats')
      .select('*')
      .eq('user_id', userId)
      .gte('attempts', 3) // 至少3次尝试才有统计意义
      .order('correct', { ascending: true })
      .limit(limit * 2); // 多获取一些，后面筛选

    if (error) {
      console.error('[ReviewService] Error getting weak points:', error);
      return [];
    }

    if (!data) return [];

    // 计算正确率并筛选薄弱点（正确率低于70%）
    return data
      .map(item => ({
        questionType: item.question_type,
        targetValue: item.target_value,
        attempts: item.attempts,
        correct: item.correct,
        accuracy: Math.round((item.correct / item.attempts) * 100),
      }))
      .filter(item => item.accuracy < 70)
      .slice(0, limit);
  } catch (err) {
    console.error('[ReviewService] Error:', err);
    return [];
  }
}

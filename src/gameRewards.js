import { useRef, useEffect } from 'react';

// Mốc điểm -> thưởng Robux (cộng thẳng vào Robux tổng). Thường 2-3, 5 là cao, tối đa 10.
export const SCORE_TIERS = [
  { at: 50, rb: 1 },
  { at: 120, rb: 2 },
  { at: 250, rb: 2 },
  { at: 450, rb: 3 },
  { at: 700, rb: 3 },
  { at: 1000, rb: 5 },
  { at: 1600, rb: 5 },
  { at: 2500, rb: 7 },
  { at: 4000, rb: 10 },
];

// Theo dõi điểm và tự thưởng Robux khi vượt từng mốc (mỗi mốc 1 lần/ván).
// score=0 coi như ván mới -> reset. onReward(rb, reason) đến từ GamesApp.
export function useScoreRewards(score, onReward, tiers = SCORE_TIERS) {
  const nextIdx = useRef(0);
  useEffect(() => {
    if (score <= 0) { nextIdx.current = 0; return; }
    while (nextIdx.current < tiers.length && score >= tiers[nextIdx.current].at) {
      const t = tiers[nextIdx.current];
      onReward?.(t.rb, `Đạt ${t.at} điểm`);
      nextIdx.current += 1;
    }
  }, [score, onReward, tiers]);
}

// Thưởng khi qua vòng/màn lớn (game theo cấp). rb tăng dần theo level, chặn 1..10.
export const levelRewardRobux = (level) => Math.max(1, Math.min(10, Math.round(level)));

import { useRef, useEffect } from 'react';

// Robux RẤT HIẾM: chỉ thưởng ở các mốc điểm CAO, số ít (sau còn chia REWARD_DIVISOR ở GamesApp).
// Phần thưởng chính khi chơi là KỸ NĂNG trong game, không phải Robux.
export const SCORE_TIERS = [
  { at: 250, rb: 2 },   // ~1 sau khi giảm
  { at: 600, rb: 2 },   // ~1
  { at: 1200, rb: 3 },  // ~1
  { at: 2500, rb: 5 },  // ~2
  { at: 5000, rb: 7 },  // ~2
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

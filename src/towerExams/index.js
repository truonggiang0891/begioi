import BANK from './bank';

// --- NGÂN HÀNG ĐỀ THÁP QUỶ TOÁN ---
// Thiết kế: MỘT kho dùng chung cho mọi ải. Mỗi lần bé vào ải, app rút ngẫu nhiên
// EXAM_SIZE câu từ kho -> thi lại là đề mới, bé không học vẹt đáp án.
// Khi kho chưa đủ câu, ải sẽ hiện "đang chuẩn bị" thay vì ra bài thi thiếu.
//
// (Sau này muốn phân mức khó: thêm trường `level` cho từng câu trong bank.js
//  rồi lọc theo ải trước khi rút — phần còn lại không phải sửa.)

export const EXAM_SIZE = 30;

export const bankSize = () => BANK.length;

// Kho đã đủ câu để ra một bài thi hoàn chỉnh chưa?
export const isExamReady = () => BANK.length >= EXAM_SIZE;

// Rút ngẫu nhiên EXAM_SIZE câu (không lặp trong cùng một bài).
// LƯU Ý: hàm này trả về mảng MỚI mỗi lần gọi -> chỉ được gọi 1 lần lúc vào ải,
// không gọi trong thân render (xem TowerMathApp).
export const drawExam = () => {
  const pool = [...BANK];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, EXAM_SIZE);
};

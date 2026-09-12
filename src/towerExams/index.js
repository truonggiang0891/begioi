import Z01 from './z01';

// Ngân hàng đề theo từng ải: khoá là "<zoneId>:<tierId>".
// Ải nào chưa có đề thì trả về null -> game hiện thông báo "đang chuẩn bị".
export const EXAM_BANK = {
  'z01:normal': Z01,
};

export const getExam = (zoneId, tierId) => EXAM_BANK[`${zoneId}:${tierId}`] || null;

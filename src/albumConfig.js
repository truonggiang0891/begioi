// --- CẤU HÌNH ALBUM GOOGLE DRIVE ---
// Album của bé đọc trực tiếp ảnh/video từ Google Drive của bố/mẹ,
// không cần backend, không tốn phí. Chỉ cần điền 2 giá trị dưới đây.
//
// CÁCH LẤY (làm 1 lần, ~5 phút):
//  1. Tạo folder mẹ trên Google Drive, ví dụ "Album Bé", bên trong tạo
//     các folder con = từng album (VD: "Sinh nhật 2 tuổi", "Đi biển"...).
//     Bỏ ảnh/video vào các folder con.
//  2. Chuột phải folder mẹ → Chia sẻ → "Bất kỳ ai có đường liên kết"
//     → quyền "Người xem". (Các folder con tự thừa hưởng quyền này.)
//  3. Mở folder mẹ, nhìn thanh địa chỉ:
//     https://drive.google.com/drive/folders/XXXXXXXXXXXX
//     Phần XXXXXXXXXXXX chính là rootFolderId → dán vào dưới.
//  4. Vào https://console.cloud.google.com → tạo project (miễn phí)
//     → "APIs & Services" → bật "Google Drive API"
//     → "Credentials" → "Create credentials" → "API key" → copy vào apiKey.
//     (Nên bấm "Restrict key" → chỉ cho phép "Google Drive API".)

export const ALBUM_CONFIG = {
  // API key từ Google Cloud Console (đã giới hạn cho Google Drive API).
  apiKey: 'AIzaSyBhOVprYGPsI-5T5r0kosvKyGV1dRbsWQg',
  // ID folder mẹ chứa các album (đã chia sẻ "ai có link đều xem").
  rootFolderId: '1DXcGvOF3F2DaM7-Q4_ik7lIZ5kDGNmL7',
};

export const isAlbumConfigured = () =>
  Boolean(ALBUM_CONFIG.apiKey && ALBUM_CONFIG.rootFolderId);

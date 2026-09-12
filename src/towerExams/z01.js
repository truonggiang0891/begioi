// --- ĐỀ THI: 👾 VÙNG ĐẤT QUÁI SỐ — ẢI THƯỜNG ---
// Chép từ bộ đề gốc do phụ huynh cung cấp.
// q  : đề bài dạng chữ (để rỗng nếu đề nằm trong ảnh)
// img: ảnh đề đã cắt từ bản gốc (nằm ở public/tower/z01/)
// type: 'choice' (chọn đáp án) | 'fill' (gõ đáp án)

const Z01 = [
  {
    id: 1, type: 'choice', q: 'Hình trên có mấy con bướm?', img: '/tower/z01/q01.webp',
    options: ['2', '3', '5', '4'], answer: '4',
    explain: 'Trên trời có 4 con bướm màu tím. Mấy con màu vàng cam là chim chứ không phải bướm nhé!',
  },
  {
    id: 2, type: 'choice', q: 'Số nào ở giữa 19 và 21?', img: null,
    options: ['3 chục', 'Hai mươi hai', 'Mười tám', '2 chục'], answer: '2 chục',
    explain: 'Đếm 19, 20, 21 — số ở giữa là 20. Mà 20 chính là 2 chục.',
  },
  {
    id: 3, type: 'fill', q: 'Số ?', img: '/tower/z01/q03.svg',
    options: [], answer: '4',
    explain: '2 ngôi sao cộng thêm 2 ngôi sao là 4 ngôi sao (2 + 2 = 4).',
  },
  {
    id: 4, type: 'fill', q: 'Điền số thích hợp: Chữ T trong hình gồm … khối lập phương.', img: '/tower/z01/q04.svg',
    options: [], answer: '5',
    explain: 'Chữ T có 3 khối nằm ngang ở trên và 2 khối xếp dọc ở dưới, tất cả là 5 khối lập phương.',
  },
  {
    id: 5, type: 'fill', q: 'Số ?', img: '/tower/z01/q05.svg',
    options: [], answer: '9',
    explain: 'Nhìn mẫu: 6 và 3 gộp lại được 9. Tương tự, 2 và 7 gộp lại cũng được 9.',
  },
  {
    id: 6, type: 'choice', q: 'Hình trên có mấy con kiến?', img: '/tower/z01/q06.webp',
    options: ['8', '6', '5', '7'], answer: '7',
    explain: 'Bé đếm lần lượt từng chú kiến trên tổ và hai chú đang khiêng đá, tất cả là 7 con kiến.',
  },
  {
    id: 7, type: 'choice', q: 'Các bạn nhỏ đang đếm số nào?', img: '/tower/z01/q07.webp',
    options: ['Số sáu', 'Số chín', 'Số tám', 'Số bảy'], answer: 'Số chín',
    explain: 'Trên bảng là chữ số 9, lại có 9 chấm tròn và hai bàn tay xoè 9 ngón — đó là số chín.',
  },
  {
    id: 8, type: 'choice', q: 'Chọn đáp án đúng để so sánh hai nhóm:', img: '/tower/z01/q08.webp',
    options: ['>', '=', '<', 'Không so sánh được'], answer: '=',
    explain: 'Bé đếm được bên trái 8 con, bên phải cũng 8 con. Hai bên bằng nhau nên điền dấu =.',
  },
  {
    id: 9, type: 'choice', q: 'Xe nào dài nhất?', img: '/tower/z01/q09.webp',
    options: ['Xe A', 'Xe D', 'Xe C', 'Xe B'], answer: 'Xe C',
    explain: 'So sánh độ dài của bốn xe, chiếc xe tải C kéo dài hơn tất cả nên xe C dài nhất.',
  },
  {
    id: 10, type: 'choice', q: 'Bàn cờ có dạng hình gì?', img: '/tower/z01/q10.svg',
    options: ['Hình vuông', 'Hình tròn', 'Hình tam giác'], answer: 'Hình vuông',
    explain: 'Bàn cờ có 4 cạnh bằng nhau và 4 góc vuông, đó là hình vuông.',
  },
  {
    id: 11, type: 'fill', q: 'Số ?', img: '/tower/z01/q11.svg',
    options: [], answer: '10',
    explain: 'Đếm được 7 cái chai, rồi lấy 7 cộng 3 bằng 10.',
  },
  {
    id: 12, type: 'fill', q: 'Điền số thích hợp: Hình trên có … khối hộp chữ nhật.', img: '/tower/z01/q12.webp',
    options: [], answer: '3',
    explain: 'Khối hộp chữ nhật là những khối dẹt và dài. Trong hình có 3 khối như vậy (khối vuông là khối lập phương, khối tròn là khối trụ nên không đếm).',
  },
  {
    id: 13, type: 'fill', q: '7 − ? = 6.  Số cần điền vào ô trống là:', img: null,
    options: [], answer: '1',
    explain: 'Bé lấy 7 trừ 6 được 1. Thử lại: 7 − 1 = 6, đúng rồi!',
  },
  {
    id: 14, type: 'choice', q: 'Số cần điền vào dấu hỏi chấm gồm:', img: '/tower/z01/q14.svg',
    options: ['2 chục 2 đơn vị', '1 chục 4 đơn vị', '1 chục 8 đơn vị', '2 chục 4 đơn vị'],
    answer: '1 chục 8 đơn vị',
    explain: 'Dãy số đếm thêm 2: 10, 12, 14, 16, rồi đến 18. Số 18 gồm 1 chục và 8 đơn vị.',
  },
  {
    id: 15, type: 'choice', q: 'Điền số thích hợp vào chỗ trống:  1 + 4 > ?', img: null,
    options: ['8', '6', '4', '7'], answer: '4',
    explain: '1 + 4 = 5. Trong các số đã cho, chỉ có 4 bé hơn 5 nên chọn số 4.',
  },
  {
    id: 16, type: 'fill', q: '? + 7 = 9.  Số cần điền vào dấu hỏi chấm là:', img: null,
    options: [], answer: '2',
    explain: 'Bé lấy 9 trừ 7 được 2. Thử lại: 2 + 7 = 9, đúng rồi!',
  },
  {
    id: 17, type: 'fill',
    q: 'Biết: hình chữ nhật đỏ = 2, hình tam giác xanh = 4, hình vuông xanh lá = 1. Vậy hình chữ nhật đỏ + hình tam giác xanh + hình vuông xanh lá = ?',
    img: null, options: [], answer: '7',
    explain: 'Thay mỗi hình bằng số của nó rồi cộng lại: 2 + 4 + 1 = 7.',
  },
  {
    id: 18, type: 'choice', q: 'Có bao nhiêu bạn ở bên tay phải của bạn đeo ba lô?', img: '/tower/z01/q18.webp',
    options: ['2 bạn', '3 bạn', '1 bạn', '4 bạn'], answer: '1 bạn',
    explain: 'Các bạn quay mặt về phía mình, nên tay phải của bạn đeo ba lô ở phía bên trái bức tranh. Bên đó chỉ có 1 bạn thôi.',
  },
  {
    id: 19, type: 'fill', q: 'Bắt đầu từ 10, rồi − 6, rồi + 4, rồi + 1. Số cần điền vào dấu hỏi chấm là …', img: null,
    options: [], answer: '9',
    explain: 'Bé tính lần lượt: 10 − 6 = 4, rồi 4 + 4 = 8, rồi 8 + 1 = 9.',
  },
  {
    id: 20, type: 'fill', q: '3 + ? = 6.  Số cần điền vào ô trống là …', img: null,
    options: [], answer: '3',
    explain: 'Đếm thêm từ 3 lên 6 là 3 bước, nên điền số 3 (3 + 3 = 6).',
  },
  {
    id: 21, type: 'choice', q: 'Phép tính nào dưới đây bé hơn 7?', img: null,
    options: ['1 + 8', '4 + 3', '6 + 2', '5 + 1'], answer: '5 + 1',
    explain: 'Tính thử: 1 + 8 = 9, 4 + 3 = 7, 6 + 2 = 8, còn 5 + 1 = 6. Chỉ có 6 bé hơn 7.',
  },
  {
    id: 22, type: 'fill', q: '3 + ? = 9.  Số cần điền vào ô trống là …', img: null,
    options: [], answer: '6',
    explain: 'Đếm thêm từ 3 lên 9 là 6 bước, nên điền số 6 (3 + 6 = 9).',
  },
  {
    id: 23, type: 'choice', q: '10 gồm:', img: null,
    options: ['5 và 5', '4 và 4', '2 và 2', '3 và 3'], answer: '5 và 5',
    explain: 'Cộng thử từng cặp: 5 + 5 = 10. Còn 4 + 4 = 8, 2 + 2 = 4, 3 + 3 = 6.',
  },
  {
    id: 24, type: 'choice', q: 'Hình tiếp theo điền vào ô trống là:', img: '/tower/z01/q24.webp',
    options: ['Bông tuyết', 'Xe trượt tuyết', 'Chiếc tất sọc đỏ trắng', 'Khăn quàng cổ sọc đỏ trắng'],
    answer: 'Bông tuyết',
    explain: 'Dãy hình lặp lại theo nhóm ba: xe trượt tuyết – khăn quàng – bông tuyết. Sau xe trượt tuyết và khăn quàng thì đến lượt bông tuyết.',
  },
  {
    id: 25, type: 'fill', q: 'Số cần điền vào dấu hỏi chấm là …', img: '/tower/z01/q25.svg',
    options: [], answer: '8',
    explain: 'Mỗi số ở đầu cánh bằng tổng hai số bên trong cạnh nó: 3 + 2 = 5, 3 + 1 = 4. Vậy số còn thiếu bên trong là 9 − 2 = 7, nên dấu ? là 1 + 7 = 8.',
  },
  {
    id: 26, type: 'fill', q: 'Hình trên có … hình tròn.', img: '/tower/z01/q26.svg',
    options: [], answer: '2',
    explain: 'Chú chim có 2 hình tròn: hình tròn vàng làm mình và hình tròn hồng làm đầu.',
  },
  {
    id: 27, type: 'choice', q: 'Khi xếp hàng, Ly đứng đầu hàng, Vũ đứng thứ hai, Hà đứng thứ ba. Nếu Nam đến đứng giữa Vũ và Hà thì Nam đứng thứ mấy?', img: '/tower/z01/q27.webp',
    options: ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ nhất'], answer: 'Thứ ba',
    explain: 'Nam chen vào giữa Vũ (thứ hai) và Hà, nên Nam đứng ngay sau Vũ là thứ ba (Hà lùi xuống thứ tư).',
  },
  {
    id: 28, type: 'choice', q: 'Biết mỗi hàng, mỗi cột đều có đủ 4 quả trứng khác nhau. Hình cần điền vào ô có dấu hỏi chấm là:', img: '/tower/z01/q28.svg',
    options: [
      'Trứng vàng cam vằn xanh',
      'Trứng hồng cam kẻ sọc',
      'Trứng xanh lá chấm bi trắng',
      'Trứng xanh dương vằn vàng',
    ],
    answer: 'Trứng xanh dương vằn vàng',
    explain: 'Mỗi hàng và mỗi cột phải đủ 4 quả khác nhau. Xét hàng 1 và cột của ô dấu ?, quả còn thiếu chính là trứng xanh dương vằn vàng.',
  },
  {
    id: 29, type: 'choice', q: 'Có bao nhiêu số tròn chục nằm giữa 32 và 60?', img: null,
    options: ['3 số', '1 số', '2 số', '4 số'], answer: '2 số',
    explain: 'Các số tròn chục lớn hơn 32 và bé hơn 60 là 40 và 50, vậy có 2 số.',
  },
  {
    id: 30, type: 'choice', q: 'Hình tiếp theo là:', img: '/tower/z01/q30.webp',
    options: ['Con khỉ', 'Con sư tử'], answer: 'Con sư tử',
    explain: 'Dãy lặp lại: sư tử rồi đến khỉ. Hình cuối cùng là khỉ nên tiếp theo phải là sư tử.',
  },
  // --- Bổ sung từ bộ ảnh chụp ngang ---
  {
    id: 31, type: 'fill', q: 'Điền số thích hợp: Trên bàn có … quyển sổ.', img: '/tower/z01/q31.webp',
    options: [], answer: '1',
    explain: 'Trên bàn chỉ có một quyển sổ màu trắng, mấy thứ còn lại là bút và kéo, nên điền số 1.',
  },
  {
    id: 32, type: 'choice', q: 'Bộ phận nào trên cơ thể có số lượng là hai?', img: null,
    options: ['Sợi tóc', 'Lỗ mũi', 'Đầu', 'Ngón tay'], answer: 'Lỗ mũi',
    explain: 'Mỗi bạn chỉ có 1 cái đầu, tóc thì rất nhiều sợi, ngón tay có 10, còn mũi có đúng 2 lỗ mũi.',
  },
  {
    id: 33, type: 'choice', q: 'Xe ô tô có mấy bánh xe?', img: '/tower/z01/q33.webp',
    options: ['1 bánh xe', '2 bánh xe', '4 bánh xe', '3 bánh xe'], answer: '4 bánh xe',
    explain: 'Xe ô tô có 2 bánh phía trước và 2 bánh phía sau, tất cả là 4 bánh xe.',
  },
  {
    id: 34, type: 'fill', q: 'Số ? — điền số còn thiếu vào quả cà chua có dấu hỏi.', img: '/tower/z01/q34.svg',
    options: [], answer: '7',
    explain: 'Các quả cà chua xếp theo thứ tự từ 1 đến 10. Sau số 6 là số 7, nên dấu ? là 7.',
  },
];

export default Z01;

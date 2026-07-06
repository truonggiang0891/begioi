// Bài học vẽ từng bước. Mỗi bước là các nét CẦN THÊM ở bước đó (SVG, khung 300x300).
// Nét không đặt màu stroke để thẻ <g> cha quyết định (xám = đã vẽ, đỏ = bước hiện tại).
export const drawingLessons = [
  {
    id: 'cat',
    name: 'Con Mèo',
    emoji: '🐱',
    finished: '<path d="M203,247 C246,253 257,211 237,201" fill="none" stroke="#e58b3a" stroke-width="13" stroke-linecap="round"/><path d="M96,196 C90,270 210,270 204,196 Z" fill="#f7b267" stroke="#c97b2c" stroke-width="3"/><path d="M96,92 L80,44 L138,80 Z" fill="#f9c07a" stroke="#c97b2c" stroke-width="3"/><path d="M204,92 L220,44 L162,80 Z" fill="#f9c07a" stroke="#c97b2c" stroke-width="3"/><circle cx="150" cy="140" r="70" fill="#f9c07a" stroke="#c97b2c" stroke-width="3"/><path d="M101,84 L92,58 L128,79 Z" fill="#f4a0bb"/><path d="M199,84 L208,58 L172,79 Z" fill="#f4a0bb"/><ellipse cx="150" cy="175" rx="42" ry="34" fill="#fde8cf"/><circle cx="124" cy="135" r="14" fill="#7ecf87" stroke="#3f7a45" stroke-width="2"/><circle cx="176" cy="135" r="14" fill="#7ecf87" stroke="#3f7a45" stroke-width="2"/><circle cx="124" cy="137" r="6" fill="#1a202c"/><circle cx="176" cy="137" r="6" fill="#1a202c"/><path d="M142,160 L158,160 L150,170 Z" fill="#ef7a9b"/><path d="M150,170 Q136,184 123,177 M150,170 Q164,184 177,177" fill="none" stroke="#8a5a2b" stroke-width="3" stroke-linecap="round"/><g stroke="#8a5a2b" stroke-width="2.5" stroke-linecap="round"><line x1="62" y1="150" x2="108" y2="154"/><line x1="60" y1="166" x2="108" y2="166"/><line x1="238" y1="150" x2="192" y2="154"/><line x1="240" y1="166" x2="192" y2="166"/></g>',
    steps: [
      { hint: 'Vẽ một hình tròn to làm đầu mèo', shapes: '<circle cx="150" cy="140" r="70" fill="none"/>' },
      { hint: 'Thêm 2 cái tai hình tam giác', shapes: '<path d="M96,92 L80,44 L138,80 Z" fill="none"/><path d="M204,92 L220,44 L162,80 Z" fill="none"/>' },
      { hint: 'Vẽ 2 con mắt tròn', shapes: '<circle cx="124" cy="135" r="12" fill="none"/><circle cx="176" cy="135" r="12" fill="none"/>' },
      { hint: 'Vẽ cái mũi và miệng cười', shapes: '<path d="M142,160 L158,160 L150,170 Z" fill="none"/><path d="M150,170 Q136,184 123,177 M150,170 Q164,184 177,177" fill="none"/>' },
      { hint: 'Thêm ria mép hai bên má', shapes: '<line x1="62" y1="150" x2="108" y2="154"/><line x1="60" y1="166" x2="108" y2="166"/><line x1="238" y1="150" x2="192" y2="154"/><line x1="240" y1="166" x2="192" y2="166"/>' },
      { hint: 'Vẽ thân và đuôi là xong!', shapes: '<path d="M96,196 C90,268 210,268 204,196" fill="none"/><path d="M204,246 C246,252 256,212 238,202" fill="none"/>' },
    ],
  },
  {
    id: 'house',
    name: 'Ngôi Nhà',
    emoji: '🏠',
    finished: '<rect x="80" y="130" width="140" height="122" fill="#ffe0a3" stroke="#c99a4e" stroke-width="3"/><rect x="186" y="86" width="20" height="34" fill="#cf7a5a" stroke="#a55638" stroke-width="3"/><path d="M66,130 L150,66 L234,130 Z" fill="#e57373" stroke="#b34a4a" stroke-width="3"/><rect x="128" y="186" width="44" height="66" fill="#a5744b" stroke="#7a5230" stroke-width="3"/><circle cx="162" cy="220" r="3.5" fill="#3a2a1a"/><rect x="96" y="150" width="30" height="30" fill="#aee3f5" stroke="#5aa9c4" stroke-width="3"/><rect x="174" y="150" width="30" height="30" fill="#aee3f5" stroke="#5aa9c4" stroke-width="3"/><circle cx="256" cy="54" r="22" fill="#ffd54a" stroke="#e0a92e" stroke-width="3"/>',
    steps: [
      { hint: 'Vẽ một hình vuông làm thân nhà', shapes: '<rect x="80" y="130" width="140" height="122" fill="none"/>' },
      { hint: 'Vẽ mái nhà hình tam giác', shapes: '<path d="M66,130 L150,66 L234,130 Z" fill="none"/>' },
      { hint: 'Vẽ cửa ra vào', shapes: '<rect x="128" y="186" width="44" height="66" fill="none"/>' },
      { hint: 'Thêm 2 ô cửa sổ', shapes: '<rect x="96" y="150" width="30" height="30" fill="none"/><rect x="174" y="150" width="30" height="30" fill="none"/>' },
      { hint: 'Vẽ ống khói và ông mặt trời!', shapes: '<rect x="186" y="86" width="20" height="34" fill="none"/><circle cx="256" cy="54" r="22" fill="none"/>' },
    ],
  },
  {
    id: 'flower',
    name: 'Bông Hoa',
    emoji: '🌸',
    finished: '<path d="M150,186 L150,258" fill="none" stroke="#4c9a4c" stroke-width="6" stroke-linecap="round"/><path d="M150,208 C110,198 106,228 150,220" fill="#6bbf59" stroke="#4c9a4c" stroke-width="2"/><path d="M150,228 C190,218 194,248 150,240" fill="#6bbf59" stroke="#4c9a4c" stroke-width="2"/><ellipse cx="150" cy="62" rx="20" ry="28" fill="#f7a1c4" stroke="#d76a99" stroke-width="2"/><ellipse cx="150" cy="158" rx="20" ry="28" fill="#f7a1c4" stroke="#d76a99" stroke-width="2"/><ellipse cx="102" cy="110" rx="28" ry="20" fill="#f7a1c4" stroke="#d76a99" stroke-width="2"/><ellipse cx="198" cy="110" rx="28" ry="20" fill="#f7a1c4" stroke="#d76a99" stroke-width="2"/><circle cx="150" cy="110" r="24" fill="#ffd54a" stroke="#e0a92e" stroke-width="2"/>',
    steps: [
      { hint: 'Vẽ một hình tròn nhỏ làm nhụy', shapes: '<circle cx="150" cy="110" r="24" fill="none"/>' },
      { hint: 'Vẽ cánh hoa phía trên và dưới', shapes: '<ellipse cx="150" cy="62" rx="20" ry="28" fill="none"/><ellipse cx="150" cy="158" rx="20" ry="28" fill="none"/>' },
      { hint: 'Vẽ cánh hoa bên trái và phải', shapes: '<ellipse cx="102" cy="110" rx="28" ry="20" fill="none"/><ellipse cx="198" cy="110" rx="28" ry="20" fill="none"/>' },
      { hint: 'Vẽ thân cây thẳng xuống', shapes: '<path d="M150,186 L150,258" fill="none"/>' },
      { hint: 'Thêm 2 chiếc lá là xong!', shapes: '<path d="M150,208 C110,198 106,228 150,220" fill="none"/><path d="M150,228 C190,218 194,248 150,240" fill="none"/>' },
    ],
  },
  {
    id: 'sun',
    name: 'Ông Mặt Trời',
    emoji: '☀️',
    finished: '<g stroke="#f6a821" stroke-width="7" stroke-linecap="round"><line x1="150" y1="80" x2="150" y2="48"/><line x1="150" y1="220" x2="150" y2="252"/><line x1="80" y1="150" x2="48" y2="150"/><line x1="220" y1="150" x2="252" y2="150"/><line x1="105" y1="105" x2="82" y2="82"/><line x1="195" y1="105" x2="218" y2="82"/><line x1="105" y1="195" x2="82" y2="218"/><line x1="195" y1="195" x2="218" y2="218"/></g><circle cx="150" cy="150" r="56" fill="#ffd54a" stroke="#e0a92e" stroke-width="3"/><circle cx="130" cy="140" r="7" fill="#5a4a2a"/><circle cx="170" cy="140" r="7" fill="#5a4a2a"/><path d="M120,166 Q150,192 180,166" fill="none" stroke="#5a4a2a" stroke-width="5" stroke-linecap="round"/><circle cx="114" cy="166" r="8" fill="#ffb3c1"/><circle cx="186" cy="166" r="8" fill="#ffb3c1"/>',
    steps: [
      { hint: 'Vẽ một vòng tròn thật to', shapes: '<circle cx="150" cy="150" r="56" fill="none"/>' },
      { hint: 'Vẽ 4 tia nắng thẳng', shapes: '<line x1="150" y1="80" x2="150" y2="48"/><line x1="150" y1="220" x2="150" y2="252"/><line x1="80" y1="150" x2="48" y2="150"/><line x1="220" y1="150" x2="252" y2="150"/>' },
      { hint: 'Vẽ thêm 4 tia nắng chéo', shapes: '<line x1="105" y1="105" x2="82" y2="82"/><line x1="195" y1="105" x2="218" y2="82"/><line x1="105" y1="195" x2="82" y2="218"/><line x1="195" y1="195" x2="218" y2="218"/>' },
      { hint: 'Vẽ 2 con mắt', shapes: '<circle cx="130" cy="140" r="7" fill="none"/><circle cx="170" cy="140" r="7" fill="none"/>' },
      { hint: 'Vẽ miệng cười thật tươi!', shapes: '<path d="M120,166 Q150,192 180,166" fill="none"/>' },
    ],
  },
];

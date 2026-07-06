export const animalEmojis = ['🐳','🐻','🐱','🐶','🐰','🐷','🐸','🐧','🦉','🐟','🐢','🦀','🐭','🦊','🦁','🐯','🐘','🦛','🐵','🐼','🐨','🐑','🐮','🐴','🦌','🦇','🦋','🐞','🐝','🐌'];
export const pokemonEmojis = ['⚡','🌱','🔥','💧','🎤','💤','🐾','👻','🦆','🪙','🌿','🐉','🌸','🥚','🌀','🕳️','🐛','🦇','🥊','🌟','🧚','🦊','🦕','🦥','🦴','🐟','🐍','🍃','🐭','🐊'];
export const animalNames = [
  'Cá voi', 'Gấu', 'Mèo', 'Chó', 'Thỏ', 'Heo', 'Ếch', 'Chim cánh cụt', 'Cú mèo', 'Cá',
  'Rùa', 'Cua', 'Chuột', 'Cáo', 'Sư tử', 'Hổ', 'Voi', 'Hà mã', 'Khỉ', 'Gấu trúc',
  'Gấu túi', 'Cừu', 'Bò', 'Ngựa', 'Hươu', 'Dơi', 'Bướm', 'Bọ rùa', 'Ong', 'Ốc sên'
];
export const pokemonNames = [
  'Pikachu', 'Bulbasaur', 'Charmander', 'Squirtle', 'Jigglypuff', 'Snorlax', 'Eevee', 'Gengar', 'Psyduck', 'Meowth',
  'Chikorita', 'Dragonite', 'Clefairy', 'Togepi', 'Poliwhirl', 'Diglett', 'Caterpie', 'Zubat', 'Hitmonchan', 'Staryu',
  'Sylveon', 'Vulpix', 'Lapras', 'Slowpoke', 'Cubone', 'Magikarp', 'Ekans', 'Leafeon', 'Rattata', 'Totodile'
];

export const colorThemes = {
    nature: ["#2ecc71", "#27ae60", "#3498db", "#2980b9", "#f1c40f", "#f39c12", "#e67e22", "#d35400", "#8e44ad", "#34495e", "#ffffff", "#f3e9d2"],
    candy: ["#ff7597", "#ffb3c6", "#ffc6ff", "#e8c5ff", "#bde0fe", "#a2d2ff", "#ffea00", "#98ece8", "#e1fad2", "#fcd7bc", "#ffffff", "#f3e9d2"],
    magic: ["#a8a2f8", "#6d5dfc", "#4158d0", "#c850c0", "#ffcc70", "#ff416c", "#ff4b2b", "#1a2a6c", "#b21f1f", "#fdbb2d", "#ffffff", "#f3e9d2"]
};

export const coloringSVGs = {
  1: `<svg id="svg-1" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Vòi nước -->
            <path class="colorable" d="M140,80 Q100,40 60,60 M140,80 Q140,30 150,20 M140,80 Q180,40 220,60" stroke="#1a202c" stroke-width="6" fill="none" stroke-linecap="round"/>
            <circle class="colorable" cx="60" cy="80" r="8" fill="#ffffff"/><circle class="colorable" cx="200" cy="80" r="6" fill="#ffffff"/>
            <!-- Thân cá voi -->
            <path class="colorable" d="M340,200 C340,120 240,100 160,140 C110,165 70,170 40,150 C50,200 70,250 140,270 C220,290 310,270 340,200 Z" fill="#ffffff"/>
            <!-- Đuôi -->
            <path class="colorable" d="M40,150 C20,120 15,80 30,60 C45,80 55,110 55,130 C70,110 90,80 105,70 C100,95 80,135 40,150 Z" fill="#ffffff"/>
            <!-- Bụng cá -->
            <path class="colorable" d="M140,270 C190,280 260,270 290,232 C250,240 180,240 140,270 Z" fill="#ffffff"/>
            <!-- Vây -->
            <path class="colorable" d="M200,250 C220,290 250,310 260,310 C260,290 240,260 225,245 Z" fill="#ffffff"/>
            <circle class="colorable" cx="80" cy="120" r="15" fill="#ffffff"/>
            <circle class="colorable" cx="320" cy="100" r="10" fill="#ffffff"/>
            <circle cx="280" cy="170" r="8" fill="#1a202c"/>
        </svg>`,
  2: `<svg id="svg-2" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Thân gấu -->
            <path class="colorable" d="M130,160 C120,320 280,320 270,160 Z" fill="#ffffff"/>
            <!-- Bụng -->
            <path class="colorable" d="M160,200 C150,290 250,290 240,200 Z" fill="#ffffff"/>
            <!-- Chân -->
            <ellipse class="colorable" cx="160" cy="310" rx="25" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="310" rx="25" ry="15" fill="#ffffff"/>
            <!-- Tay -->
            <ellipse class="colorable" cx="120" cy="220" rx="20" ry="35" transform="rotate(20 120 220)" fill="#ffffff"/>
            <ellipse class="colorable" cx="280" cy="220" rx="20" ry="35" transform="rotate(-20 280 220)" fill="#ffffff"/>
            <!-- Tai -->
            <circle class="colorable" cx="130" cy="100" r="35" fill="#ffffff"/>
            <circle class="colorable" cx="270" cy="100" r="35" fill="#ffffff"/>
            <circle class="colorable" cx="130" cy="100" r="20" fill="#ffffff"/>
            <circle class="colorable" cx="270" cy="100" r="20" fill="#ffffff"/>
            <!-- Đầu -->
            <circle class="colorable" cx="200" cy="140" r="80" fill="#ffffff"/>
            <!-- Mõm -->
            <ellipse class="colorable" cx="200" cy="170" rx="35" ry="25" fill="#ffffff"/>
            <circle cx="170" cy="130" r="8" fill="#1a202c"/><circle cx="230" cy="130" r="8" fill="#1a202c"/>
            <circle cx="200" cy="160" r="10" fill="#1a202c"/>
            <path d="M200,170 L200,185 M185,185 Q200,200 215,185" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  3: `<svg id="svg-3" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Đuôi mèo uốn lượn -->
            <path class="colorable" d="M250,290 C350,290 350,150 300,150 C280,150 280,180 300,180 C320,180 310,250 260,250" stroke="#1a202c" stroke-width="20" fill="none" stroke-linecap="round"/>
            <!-- Thân -->
            <path class="colorable" d="M140,160 C120,300 260,300 260,160 Z" fill="#ffffff"/>
            <path class="colorable" d="M160,200 C150,280 230,280 240,200 Z" fill="#ffffff"/>
            <ellipse class="colorable" cx="160" cy="290" rx="20" ry="15" fill="#ffffff"/><ellipse class="colorable" cx="230" cy="290" rx="20" ry="15" fill="#ffffff"/>
            <!-- Tai -->
            <polygon class="colorable" points="110,140 100,50 170,100" fill="#ffffff"/>
            <polygon class="colorable" points="290,140 300,50 230,100" fill="#ffffff"/>
            <polygon class="colorable" points="120,120 115,75 155,105" fill="#ffffff"/>
            <polygon class="colorable" points="280,120 285,75 245,105" fill="#ffffff"/>
            <!-- Đầu -->
            <circle class="colorable" cx="200" cy="150" r="80" fill="#ffffff"/>
            <circle cx="165" cy="140" r="8" fill="#1a202c"/><circle cx="235" cy="140" r="8" fill="#1a202c"/>
            <polygon class="colorable" points="190,170 210,170 200,185" fill="#ffffff"/>
            <path d="M200,185 L200,200 M185,200 Q200,215 215,200" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
            <!-- Râu -->
            <line x1="100" y1="150" x2="140" y2="160" stroke="#1a202c" stroke-width="4" stroke-linecap="round"/>
            <line x1="100" y1="170" x2="140" y2="170" stroke="#1a202c" stroke-width="4" stroke-linecap="round"/>
            <line x1="300" y1="150" x2="260" y2="160" stroke="#1a202c" stroke-width="4" stroke-linecap="round"/>
            <line x1="300" y1="170" x2="260" y2="170" stroke="#1a202c" stroke-width="4" stroke-linecap="round"/>
        </svg>`,
  4: `<svg id="svg-4" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Thân chó -->
            <path class="colorable" d="M130,160 C110,320 290,320 270,160 Z" fill="#ffffff"/>
            <!-- Bụng -->
            <ellipse class="colorable" cx="200" cy="240" rx="50" ry="60" fill="#ffffff"/>
            <!-- Cổ áo -->
            <path class="colorable" d="M140,190 Q200,220 260,190" stroke="#1a202c" stroke-width="12" fill="none" stroke-linecap="round"/>
            <circle class="colorable" cx="200" cy="210" r="15" fill="#ffffff"/>
            <!-- Chân -->
            <ellipse class="colorable" cx="150" cy="310" rx="25" ry="15" fill="#ffffff"/><ellipse class="colorable" cx="250" cy="310" rx="25" ry="15" fill="#ffffff"/>
            <!-- Tai cúp -->
            <ellipse class="colorable" cx="100" cy="140" rx="35" ry="80" transform="rotate(20 100 140)" fill="#ffffff"/>
            <ellipse class="colorable" cx="300" cy="140" rx="35" ry="80" transform="rotate(-20 300 140)" fill="#ffffff"/>
            <!-- Đầu -->
            <circle class="colorable" cx="200" cy="140" r="80" fill="#ffffff"/>
            <!-- Mảng màu mắt -->
            <circle class="colorable" cx="160" cy="120" r="25" fill="#ffffff"/>
            <circle cx="160" cy="120" r="8" fill="#1a202c"/><circle cx="240" cy="120" r="8" fill="#1a202c"/>
            <ellipse class="colorable" cx="200" cy="165" rx="45" ry="30" fill="#ffffff"/>
            <path d="M200,150 Q180,175 200,180 Q220,175 200,150 Z" fill="#1a202c"/>
        </svg>`,
  5: `<svg id="svg-5" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Tai dài -->
            <ellipse class="colorable" cx="150" cy="80" rx="25" ry="80" fill="#ffffff"/>
            <ellipse class="colorable" cx="250" cy="80" rx="25" ry="80" fill="#ffffff"/>
            <ellipse class="colorable" cx="150" cy="80" rx="12" ry="60" fill="#ffffff"/>
            <ellipse class="colorable" cx="250" cy="80" rx="12" ry="60" fill="#ffffff"/>
            <!-- Thân -->
            <path class="colorable" d="M140,200 C120,330 280,330 260,200 Z" fill="#ffffff"/>
            <ellipse class="colorable" cx="200" cy="260" rx="40" ry="50" fill="#ffffff"/>
            <!-- Chân -->
            <ellipse class="colorable" cx="150" cy="320" rx="30" ry="15" fill="#ffffff"/><ellipse class="colorable" cx="250" cy="320" rx="30" ry="15" fill="#ffffff"/>
            <!-- Tay ôm củ cà rốt -->
            <ellipse class="colorable" cx="130" cy="240" rx="15" ry="35" transform="rotate(30 130 240)" fill="#ffffff"/>
            <ellipse class="colorable" cx="270" cy="240" rx="15" ry="35" transform="rotate(-30 270 240)" fill="#ffffff"/>
            <path class="colorable" d="M170,260 L230,220 L240,240 L180,280 Z" fill="#ffffff"/> <!-- Cà rốt -->
            <path class="colorable" d="M230,220 Q250,190 260,210" stroke="#1a202c" stroke-width="4" fill="none"/> <!-- Lá -->
            <!-- Đầu -->
            <circle class="colorable" cx="200" cy="160" r="75" fill="#ffffff"/>
            <circle cx="165" cy="150" r="8" fill="#1a202c"/><circle cx="235" cy="150" r="8" fill="#1a202c"/>
            <path d="M200,175 M185,185 Q200,200 215,185" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
            <rect class="colorable" x="190" y="190" width="20" height="20" fill="#ffffff"/>
            <line x1="200" y1="190" x2="200" y2="210" stroke="#1a202c" stroke-width="4"/>
            <circle cx="200" cy="170" r="6" fill="#1a202c"/>
        </svg>`,
  6: `<svg id="svg-6" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Thân tròn -->
            <circle class="colorable" cx="200" cy="240" r="90" fill="#ffffff"/>
            <ellipse class="colorable" cx="200" cy="250" rx="60" ry="70" fill="#ffffff"/>
            <!-- Đuôi xoắn -->
            <path d="M280,250 C330,220 330,280 300,280 C280,280 290,240 310,250" stroke="#1a202c" stroke-width="6" fill="none" stroke-linecap="round"/>
            <!-- Chân -->
            <ellipse class="colorable" cx="160" cy="320" rx="20" ry="15" fill="#ffffff"/><ellipse class="colorable" cx="240" cy="320" rx="20" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="130" cy="240" rx="15" ry="30" transform="rotate(30 130 240)" fill="#ffffff"/>
            <ellipse class="colorable" cx="270" cy="240" rx="15" ry="30" transform="rotate(-30 270 240)" fill="#ffffff"/>
            <!-- Tai -->
            <polygon class="colorable" points="130,120 90,50 170,80" fill="#ffffff"/>
            <polygon class="colorable" points="270,120 310,50 230,80" fill="#ffffff"/>
            <!-- Đầu -->
            <circle class="colorable" cx="200" cy="150" r="80" fill="#ffffff"/>
            <circle cx="165" cy="130" r="8" fill="#1a202c"/><circle cx="235" cy="130" r="8" fill="#1a202c"/>
            <ellipse class="colorable" cx="200" cy="170" rx="45" ry="30" fill="#ffffff"/>
            <circle cx="185" cy="170" r="6" fill="#1a202c"/><circle cx="215" cy="170" r="6" fill="#1a202c"/>
        </svg>`,
  7: `<svg id="svg-7" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Lá sen -->
            <ellipse class="colorable" cx="200" cy="340" rx="160" ry="40" fill="#ffffff"/>
            <!-- Đùi ếch -->
            <ellipse class="colorable" cx="110" cy="260" rx="40" ry="60" transform="rotate(-30 110 260)" fill="#ffffff"/>
            <ellipse class="colorable" cx="290" cy="260" rx="40" ry="60" transform="rotate(30 290 260)" fill="#ffffff"/>
            <!-- Bàn chân -->
            <path class="colorable" d="M60,320 L90,290 L120,320 Z" fill="#ffffff"/>
            <path class="colorable" d="M340,320 L310,290 L280,320 Z" fill="#ffffff"/>
            <!-- Thân -->
            <ellipse class="colorable" cx="200" cy="240" rx="80" ry="90" fill="#ffffff"/>
            <ellipse class="colorable" cx="200" cy="250" rx="50" ry="70" fill="#ffffff"/>
            <!-- Tay -->
            <ellipse class="colorable" cx="160" cy="260" rx="15" ry="40" fill="#ffffff"/><ellipse class="colorable" cx="240" cy="260" rx="15" ry="40" fill="#ffffff"/>
            <!-- Mắt -->
            <circle class="colorable" cx="150" cy="100" r="35" fill="#ffffff"/>
            <circle class="colorable" cx="250" cy="100" r="35" fill="#ffffff"/>
            <circle class="colorable" cx="150" cy="100" r="20" fill="#ffffff"/>
            <circle class="colorable" cx="250" cy="100" r="20" fill="#ffffff"/>
            <circle cx="150" cy="100" r="8" fill="#1a202c"/><circle cx="250" cy="100" r="8" fill="#1a202c"/>
            <!-- Đầu -->
            <ellipse class="colorable" cx="200" cy="140" rx="90" ry="60" fill="#ffffff"/>
            <path class="colorable" d="M140,160 Q200,200 260,160" fill="#ffffff"/>
        </svg>`,
  8: `<svg id="svg-8" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Cánh -->
            <ellipse class="colorable" cx="100" cy="200" rx="25" ry="90" transform="rotate(25 100 200)" fill="#ffffff"/>
            <ellipse class="colorable" cx="300" cy="200" rx="25" ry="90" transform="rotate(-25 300 200)" fill="#ffffff"/>
            <!-- Bàn chân -->
            <path class="colorable" d="M130,340 L160,310 L190,340 Z" fill="#ffffff"/>
            <path class="colorable" d="M210,340 L240,310 L270,340 Z" fill="#ffffff"/>
            <!-- Thân -->
            <ellipse class="colorable" cx="200" cy="210" rx="100" ry="140" fill="#ffffff"/>
            <!-- Bụng trắng -->
            <ellipse class="colorable" cx="200" cy="230" rx="75" ry="110" fill="#ffffff"/>
            <!-- Mắt -->
            <circle class="colorable" cx="160" cy="140" r="25" fill="#ffffff"/>
            <circle class="colorable" cx="240" cy="140" r="25" fill="#ffffff"/>
            <circle cx="160" cy="140" r="8" fill="#1a202c"/><circle cx="240" cy="140" r="8" fill="#1a202c"/>
            <!-- Mỏ -->
            <polygon class="colorable" points="180,160 220,160 200,195" fill="#ffffff"/>
        </svg>`,
  9: `<svg id="svg-9" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Cành cây -->
            <path class="colorable" d="M20,300 Q200,340 380,280 L380,320 Q200,380 20,340 Z" fill="#ffffff"/>
            <!-- Cánh -->
            <ellipse class="colorable" cx="100" cy="220" rx="30" ry="90" transform="rotate(15 100 220)" fill="#ffffff"/>
            <ellipse class="colorable" cx="300" cy="220" rx="30" ry="90" transform="rotate(-15 300 220)" fill="#ffffff"/>
            <!-- Thân -->
            <ellipse class="colorable" cx="200" cy="200" rx="90" ry="110" fill="#ffffff"/>
            <!-- Bụng -->
            <ellipse class="colorable" cx="200" cy="230" rx="60" ry="70" fill="#ffffff"/>
            <path class="colorable" d="M170,220 Q200,240 230,220 M160,250 Q200,270 240,250" stroke="#1a202c" stroke-width="4" fill="none"/>
            <!-- Móng vuốt bám cành -->
            <ellipse class="colorable" cx="160" cy="305" rx="15" ry="20" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="300" rx="15" ry="20" fill="#ffffff"/>
            <!-- Mắt to -->
            <circle class="colorable" cx="150" cy="130" r="45" fill="#ffffff"/>
            <circle class="colorable" cx="250" cy="130" r="45" fill="#ffffff"/>
            <circle cx="150" cy="130" r="12" fill="#1a202c"/><circle cx="250" cy="130" r="12" fill="#1a202c"/>
            <!-- Mỏ -->
            <polygon class="colorable" points="190,165 210,165 200,200" fill="#ffffff"/>
            <!-- Tai -->
            <polygon class="colorable" points="130,90 100,40 170,80" fill="#ffffff"/>
            <polygon class="colorable" points="270,90 300,40 230,80" fill="#ffffff"/>
        </svg>`,
  10: `<svg id="svg-10" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Bong bóng -->
            <circle class="colorable" cx="80" cy="120" r="15" fill="#ffffff"/><circle class="colorable" cx="60" cy="80" r="10" fill="#ffffff"/><circle class="colorable" cx="100" cy="50" r="20" fill="#ffffff"/>
            <!-- Đuôi -->
            <polygon class="colorable" points="260,200 360,110 350,290" fill="#ffffff"/>
            <!-- Vây trên/dưới -->
            <polygon class="colorable" points="160,120 220,130 190,80" fill="#ffffff"/>
            <polygon class="colorable" points="160,280 220,270 190,320" fill="#ffffff"/>
            <!-- Vây ngực -->
            <path class="colorable" d="M180,200 Q220,180 240,220 Q200,240 180,200 Z" fill="#ffffff"/>
            <!-- Thân cá -->
            <ellipse class="colorable" cx="180" cy="200" rx="110" ry="80" fill="#ffffff"/>
            <!-- Mắt -->
            <circle class="colorable" cx="120" cy="180" r="20" fill="#ffffff"/>
            <circle cx="120" cy="180" r="8" fill="#1a202c"/>
            <!-- Miệng -->
            <path d="M70,210 Q90,230 110,210" stroke="#1a202c" stroke-width="4" fill="none"/>
            <!-- Vảy cá -->
            <path d="M150,170 Q170,190 150,210 M180,160 Q200,180 180,200 M210,180 Q230,200 210,220" stroke="#1a202c" stroke-width="4" fill="none"/>
        </svg>`,
  11: `<svg id="svg-11" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Bốn chân -->
            <ellipse class="colorable" cx="110" cy="280" rx="25" ry="35" transform="rotate(30 110 280)" fill="#ffffff"/>
            <ellipse class="colorable" cx="290" cy="280" rx="25" ry="35" transform="rotate(-30 290 280)" fill="#ffffff"/>
            <ellipse class="colorable" cx="130" cy="150" rx="20" ry="30" transform="rotate(-30 130 150)" fill="#ffffff"/>
            <ellipse class="colorable" cx="270" cy="150" rx="20" ry="30" transform="rotate(30 270 150)" fill="#ffffff"/>
            <!-- Đầu -->
            <ellipse class="colorable" cx="200" cy="110" rx="40" ry="50" fill="#ffffff"/>
            <circle cx="180" cy="100" r="6" fill="#1a202c"/><circle cx="220" cy="100" r="6" fill="#1a202c"/>
            <path d="M190,130 Q200,140 210,130" stroke="#1a202c" stroke-width="4" fill="none"/>
            <!-- Mai rùa -->
            <ellipse class="colorable" cx="200" cy="220" rx="110" ry="130" fill="#ffffff"/>
            <ellipse class="colorable" cx="200" cy="220" rx="70" ry="90" fill="#ffffff"/>
            <!-- Vân mai rùa -->
            <path d="M200,130 L200,160 M200,280 L200,310 M130,220 L100,220 M270,220 L300,220" stroke="#1a202c" stroke-width="4"/>
            <polygon class="colorable" points="200,160 240,190 240,250 200,280 160,250 160,190" fill="#ffffff"/>
        </svg>`,
  12: `<svg id="svg-12" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- 6 Chân nhện -->
            <path class="colorable" d="M120,200 L60,180 L40,240 M110,230 L50,230 L30,290 M130,260 L80,280 L70,340" stroke="#1a202c" stroke-width="10" fill="none" stroke-linejoin="round"/>
            <path class="colorable" d="M280,200 L340,180 L360,240 M290,230 L350,230 L370,290 M270,260 L320,280 L330,340" stroke="#1a202c" stroke-width="10" fill="none" stroke-linejoin="round"/>
            <!-- 2 Càng lớn -->
            <path class="colorable" d="M140,170 C100,100 40,140 80,80 C100,60 140,100 120,130 Z" fill="#ffffff"/>
            <path class="colorable" d="M260,170 C300,100 360,140 320,80 C300,60 260,100 280,130 Z" fill="#ffffff"/>
            <!-- Mắt nhô cao -->
            <line x1="160" y1="160" x2="160" y2="120" stroke="#1a202c" stroke-width="8"/>
            <line x1="240" y1="160" x2="240" y2="120" stroke="#1a202c" stroke-width="8"/>
            <circle class="colorable" cx="160" cy="110" r="15" fill="#ffffff"/><circle class="colorable" cx="240" cy="110" r="15" fill="#ffffff"/>
            <circle cx="160" cy="110" r="6" fill="#1a202c"/><circle cx="240" cy="110" r="6" fill="#1a202c"/>
            <!-- Thân cua -->
            <ellipse class="colorable" cx="200" cy="220" rx="100" ry="70" fill="#ffffff"/>
            <path d="M170,240 Q200,260 230,240" stroke="#1a202c" stroke-width="4" fill="none"/>
        </svg>`,
  13: `<svg id="svg-13" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Đuôi -->
            <path class="colorable" d="M260,280 C340,280 340,360 260,360 C240,360 240,340 260,340 C280,340 280,300 260,300" stroke="#1a202c" stroke-width="8" fill="none" stroke-linecap="round"/>
            <!-- Miếng pho mát -->
            <polygon class="colorable" points="80,340 140,280 180,340" fill="#ffffff"/>
            <circle cx="110" cy="310" r="8" fill="#1a202c" fill-opacity="0.2"/><circle cx="140" cy="320" r="6" fill="#1a202c" fill-opacity="0.2"/>
            <!-- Thân -->
            <path class="colorable" d="M150,180 C130,300 270,300 250,180 Z" fill="#ffffff"/>
            <ellipse class="colorable" cx="200" cy="260" rx="35" ry="45" fill="#ffffff"/>
            <!-- Chân/Tay -->
            <ellipse class="colorable" cx="160" cy="310" rx="20" ry="10" fill="#ffffff"/><ellipse class="colorable" cx="240" cy="310" rx="20" ry="10" fill="#ffffff"/>
            <ellipse class="colorable" cx="140" cy="240" rx="10" ry="25" transform="rotate(30 140 240)" fill="#ffffff"/>
            <ellipse class="colorable" cx="260" cy="240" rx="10" ry="25" transform="rotate(-30 260 240)" fill="#ffffff"/>
            <!-- Tai tròn lớn -->
            <circle class="colorable" cx="120" cy="110" r="50" fill="#ffffff"/>
            <circle class="colorable" cx="280" cy="110" r="50" fill="#ffffff"/>
            <circle class="colorable" cx="120" cy="110" r="30" fill="#ffffff"/>
            <circle class="colorable" cx="280" cy="110" r="30" fill="#ffffff"/>
            <!-- Đầu -->
            <polygon class="colorable" points="200,200 130,130 270,130" fill="#ffffff"/>
            <circle cx="160" cy="140" r="6" fill="#1a202c"/><circle cx="240" cy="140" r="6" fill="#1a202c"/>
            <circle class="colorable" cx="200" cy="200" r="10" fill="#1a202c"/>
            <!-- Râu -->
            <line x1="180" y1="190" x2="130" y2="180" stroke="#1a202c" stroke-width="4"/><line x1="180" y1="200" x2="130" y2="210" stroke="#1a202c" stroke-width="4"/>
            <line x1="220" y1="190" x2="270" y2="180" stroke="#1a202c" stroke-width="4"/><line x1="220" y1="200" x2="270" y2="210" stroke="#1a202c" stroke-width="4"/>
        </svg>`,
  14: `<svg id="svg-14" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Đuôi bồng bềnh -->
            <path class="colorable" d="M240,280 C320,340 380,240 320,160 C280,180 280,240 260,260 Z" fill="#ffffff"/>
            <!-- Thân -->
            <path class="colorable" d="M140,160 C120,320 260,320 240,160 Z" fill="#ffffff"/>
            <path class="colorable" d="M160,200 C150,290 230,290 220,200 Z" fill="#ffffff"/>
            <ellipse class="colorable" cx="160" cy="310" rx="15" ry="10" fill="#ffffff"/><ellipse class="colorable" cx="220" cy="310" rx="15" ry="10" fill="#ffffff"/>
            <!-- Tai nhọn -->
            <polygon class="colorable" points="130,140 100,50 170,100" fill="#ffffff"/>
            <polygon class="colorable" points="270,140 300,50 230,100" fill="#ffffff"/>
            <polygon class="colorable" points="120,115 110,65 150,95" fill="#ffffff"/>
            <polygon class="colorable" points="280,115 290,65 250,95" fill="#ffffff"/>
            <!-- Đầu -->
            <polygon class="colorable" points="200,210 100,120 300,120" fill="#ffffff"/>
            <polygon class="colorable" points="200,210 130,120 270,120" fill="#ffffff"/>
            <circle cx="160" cy="130" r="6" fill="#1a202c"/><circle cx="240" cy="130" r="6" fill="#1a202c"/>
            <circle class="colorable" cx="200" cy="210" r="10" fill="#1a202c"/>
        </svg>`,
  15: `<svg id="svg-15" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Thân -->
            <path class="colorable" d="M140,200 C120,320 280,320 260,200 Z" fill="#ffffff"/>
            <!-- Bụng -->
            <ellipse class="colorable" cx="200" cy="260" rx="40" ry="50" fill="#ffffff"/>
            <!-- Tay/Chân -->
            <ellipse class="colorable" cx="160" cy="320" rx="25" ry="15" fill="#ffffff"/><ellipse class="colorable" cx="240" cy="320" rx="25" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="130" cy="240" rx="20" ry="35" transform="rotate(20 130 240)" fill="#ffffff"/>
            <ellipse class="colorable" cx="270" cy="240" rx="20" ry="35" transform="rotate(-20 270 240)" fill="#ffffff"/>
            <!-- Đuôi -->
            <path d="M260,280 C320,300 340,240 320,200" stroke="#1a202c" stroke-width="8" fill="none"/>
            <circle class="colorable" cx="320" cy="190" r="15" fill="#ffffff"/>
            <!-- Bờm sư tử -->
            <path class="colorable" d="M200,30 L250,60 L310,40 L290,100 L350,130 L290,180 L330,230 L270,230 L260,280 L200,250 L140,280 L130,230 L70,230 L110,180 L50,130 L110,100 L90,40 L150,60 Z" fill="#ffffff"/>
            <!-- Đầu -->
            <circle class="colorable" cx="200" cy="140" r="60" fill="#ffffff"/>
            <circle cx="170" cy="120" r="8" fill="#1a202c"/><circle cx="230" cy="120" r="8" fill="#1a202c"/>
            <polygon class="colorable" points="190,140 210,140 200,160" fill="#ffffff"/>
            <path d="M200,160 Q180,180 160,160 M200,160 Q220,180 240,160" stroke="#1a202c" stroke-width="4" fill="none"/>
        </svg>`,
  16: `<svg id="svg-16" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Đuôi -->
            <path class="colorable" d="M260,280 C340,300 360,200 320,150" stroke="#1a202c" stroke-width="15" fill="none" stroke-linecap="round"/>
            <!-- Thân -->
            <path class="colorable" d="M130,160 C110,320 290,320 270,160 Z" fill="#ffffff"/>
            <!-- Bụng -->
            <ellipse class="colorable" cx="200" cy="250" rx="45" ry="60" fill="#ffffff"/>
            <!-- Tay/Chân -->
            <ellipse class="colorable" cx="150" cy="320" rx="25" ry="15" fill="#ffffff"/><ellipse class="colorable" cx="250" cy="320" rx="25" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="120" cy="230" rx="20" ry="35" transform="rotate(20 120 230)" fill="#ffffff"/>
            <ellipse class="colorable" cx="280" cy="230" rx="20" ry="35" transform="rotate(-20 280 230)" fill="#ffffff"/>
            <!-- Vằn hổ (Thân) -->
            <path d="M125,200 L145,210 M275,200 L255,210 M115,250 L140,255 M285,250 L260,255" stroke="#1a202c" stroke-width="6" stroke-linecap="round"/>
            <!-- Tai -->
            <circle class="colorable" cx="130" cy="90" r="30" fill="#ffffff"/>
            <circle class="colorable" cx="270" cy="90" r="30" fill="#ffffff"/>
            <!-- Đầu -->
            <circle class="colorable" cx="200" cy="140" r="75" fill="#ffffff"/>
            <!-- Vằn hổ (Trán & Má) -->
            <path d="M200,65 L200,90 M180,75 L180,95 M220,75 L220,95" stroke="#1a202c" stroke-width="6" stroke-linecap="round"/>
            <path d="M125,130 L150,140 M275,130 L250,140 M130,160 L155,160 M270,160 L245,160" stroke="#1a202c" stroke-width="6" stroke-linecap="round"/>
            <!-- Mõm -->
            <ellipse class="colorable" cx="200" cy="170" rx="35" ry="25" fill="#ffffff"/>
            <circle cx="165" cy="130" r="8" fill="#1a202c"/><circle cx="235" cy="130" r="8" fill="#1a202c"/>
            <polygon points="190,160 210,160 200,175" fill="#1a202c"/>
            <path d="M200,175 L200,190 M185,190 Q200,205 215,190" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  17: `<svg id="svg-17" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Tai khổng lồ -->
            <ellipse class="colorable" cx="80" cy="160" rx="60" ry="100" transform="rotate(-15 80 160)" fill="#ffffff"/>
            <ellipse class="colorable" cx="320" cy="160" rx="60" ry="100" transform="rotate(15 320 160)" fill="#ffffff"/>
            <ellipse class="colorable" cx="90" cy="160" rx="30" ry="70" transform="rotate(-15 90 160)" fill="#ffffff"/>
            <ellipse class="colorable" cx="310" cy="160" rx="30" ry="70" transform="rotate(15 310 160)" fill="#ffffff"/>
            <!-- Thân -->
            <path class="colorable" d="M120,180 C100,340 300,340 280,180 Z" fill="#ffffff"/>
            <ellipse class="colorable" cx="200" cy="270" rx="60" ry="40" fill="#ffffff"/>
            <!-- Chân to -->
            <path class="colorable" d="M130,280 L130,340 L180,340 L180,280 Z" fill="#ffffff"/>
            <path class="colorable" d="M220,280 L220,340 L270,340 L270,280 Z" fill="#ffffff"/>
            <!-- Móng chân -->
            <circle cx="140" cy="340" r="5" fill="#1a202c"/><circle cx="155" cy="340" r="5" fill="#1a202c"/><circle cx="170" cy="340" r="5" fill="#1a202c"/>
            <circle cx="230" cy="340" r="5" fill="#1a202c"/><circle cx="245" cy="340" r="5" fill="#1a202c"/><circle cx="260" cy="340" r="5" fill="#1a202c"/>
            <!-- Đầu -->
            <circle class="colorable" cx="200" cy="140" r="70" fill="#ffffff"/>
            <circle cx="160" cy="120" r="8" fill="#1a202c"/><circle cx="240" cy="120" r="8" fill="#1a202c"/>
            <!-- Vòi voi -->
            <path class="colorable" d="M170,160 C170,300 280,260 250,200 C230,200 230,230 200,230 C190,230 190,160 230,160 Z" fill="#ffffff"/>
        </svg>`,
  18: `<svg id="svg-18" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Thân mập -->
            <ellipse class="colorable" cx="200" cy="240" rx="110" ry="100" fill="#ffffff"/>
            <ellipse class="colorable" cx="200" cy="260" rx="70" ry="70" fill="#ffffff"/>
            <!-- Chân -->
            <ellipse class="colorable" cx="140" cy="330" rx="25" ry="20" fill="#ffffff"/><ellipse class="colorable" cx="260" cy="330" rx="25" ry="20" fill="#ffffff"/>
            <!-- Tay -->
            <ellipse class="colorable" cx="100" cy="230" rx="20" ry="40" transform="rotate(30 100 230)" fill="#ffffff"/>
            <ellipse class="colorable" cx="300" cy="230" rx="20" ry="40" transform="rotate(-30 300 230)" fill="#ffffff"/>
            <!-- Tai nhỏ -->
            <circle class="colorable" cx="140" cy="80" r="15" fill="#ffffff"/>
            <circle class="colorable" cx="260" cy="80" r="15" fill="#ffffff"/>
            <!-- Đầu -->
            <ellipse class="colorable" cx="200" cy="120" rx="60" ry="50" fill="#ffffff"/>
            <!-- Mõm khổng lồ -->
            <rect class="colorable" x="120" y="120" width="160" height="90" rx="40" fill="#ffffff"/>
            <circle cx="170" cy="100" r="8" fill="#1a202c"/><circle cx="230" cy="100" r="8" fill="#1a202c"/>
            <circle cx="150" cy="150" r="10" fill="#1a202c"/><circle cx="250" cy="150" r="10" fill="#1a202c"/>
            <path d="M160,180 Q200,200 240,180" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  19: `<svg id="svg-19" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Đuôi dài cuộn -->
            <path class="colorable" d="M260,260 C360,260 360,160 310,160 C280,160 280,200 310,200" stroke="#1a202c" stroke-width="12" fill="none" stroke-linecap="round"/>
            <!-- Dây leo -->
            <path d="M20,20 Q100,100 200,40 T380,80" stroke="#48bb78" stroke-width="8" fill="none"/>
            <!-- Tay bám dây -->
            <path class="colorable" d="M140,200 L110,60" stroke="#1a202c" stroke-width="16" stroke-linecap="round"/>
            <path class="colorable" d="M260,200 L290,60" stroke="#1a202c" stroke-width="16" stroke-linecap="round"/>
            <!-- Thân -->
            <path class="colorable" d="M140,160 C120,300 280,300 260,160 Z" fill="#ffffff"/>
            <ellipse class="colorable" cx="200" cy="240" rx="40" ry="50" fill="#ffffff"/>
            <!-- Chân -->
            <ellipse class="colorable" cx="150" cy="300" rx="20" ry="15" fill="#ffffff"/><ellipse class="colorable" cx="250" cy="300" rx="20" ry="15" fill="#ffffff"/>
            <!-- Tai tròn to -->
            <circle class="colorable" cx="110" cy="140" r="30" fill="#ffffff"/>
            <circle class="colorable" cx="290" cy="140" r="30" fill="#ffffff"/>
            <circle class="colorable" cx="110" cy="140" r="15" fill="#ffffff"/>
            <circle class="colorable" cx="290" cy="140" r="15" fill="#ffffff"/>
            <!-- Đầu -->
            <circle class="colorable" cx="200" cy="140" r="70" fill="#ffffff"/>
            <!-- Mặt hình trái tim/mặt khỉ -->
            <path class="colorable" d="M160,110 A35,35 0 1,1 200,130 A35,35 0 1,1 240,110 Q260,180 200,180 Q140,180 160,110 Z" fill="#ffffff"/>
            <circle cx="170" cy="130" r="8" fill="#1a202c"/><circle cx="230" cy="130" r="8" fill="#1a202c"/>
            <path d="M180,160 Q200,170 220,160" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  20: `<svg id="svg-20" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Thân béo -->
            <ellipse class="colorable" cx="200" cy="240" rx="90" ry="100" fill="#ffffff"/>
            <!-- Bụng -->
            <ellipse class="colorable" cx="200" cy="260" rx="60" ry="70" fill="#ffffff"/>
            <!-- Chân đen -->
            <ellipse class="colorable" cx="150" cy="320" rx="25" ry="15" fill="#ffffff"/><ellipse class="colorable" cx="250" cy="320" rx="25" ry="15" fill="#ffffff"/>
            <!-- Tay đen cầm trúc -->
            <ellipse class="colorable" cx="120" cy="240" rx="20" ry="40" transform="rotate(30 120 240)" fill="#ffffff"/>
            <ellipse class="colorable" cx="280" cy="240" rx="20" ry="40" transform="rotate(-30 280 240)" fill="#ffffff"/>
            <!-- Cành trúc -->
            <line x1="80" y1="300" x2="160" y2="180" stroke="#48bb78" stroke-width="12" stroke-linecap="round"/>
            <path d="M130,220 Q100,200 110,180" stroke="#48bb78" stroke-width="8" fill="none" stroke-linecap="round"/>
            <!-- Tai đen -->
            <circle class="colorable" cx="130" cy="90" r="30" fill="#ffffff"/>
            <circle class="colorable" cx="270" cy="90" r="30" fill="#ffffff"/>
            <!-- Đầu -->
            <circle class="colorable" cx="200" cy="140" r="75" fill="#ffffff"/>
            <!-- Vết quầng thâm mắt -->
            <ellipse class="colorable" cx="160" cy="130" rx="25" ry="35" transform="rotate(-30 160 130)" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="130" rx="25" ry="35" transform="rotate(30 240 130)" fill="#ffffff"/>
            <circle cx="160" cy="130" r="6" fill="#1a202c"/><circle cx="240" cy="130" r="6" fill="#1a202c"/>
            <!-- Mũi và miệng -->
            <ellipse class="colorable" cx="200" cy="165" rx="15" ry="10" fill="#1a202c"/>
            <path d="M185,180 Q200,195 215,180" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  21: `<svg id="svg-21" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Gốc cây/Cành cây -->
            <path class="colorable" d="M40,300 Q200,340 360,260 L360,300 Q200,380 40,340 Z" fill="#ffffff"/>
            <!-- Thân -->
            <path class="colorable" d="M140,160 C140,300 260,300 260,160 Z" fill="#ffffff"/>
            <path class="colorable" d="M160,200 C160,280 240,280 240,200 Z" fill="#ffffff"/>
            <!-- Chân bám cành -->
            <ellipse class="colorable" cx="160" cy="290" rx="20" ry="25" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="280" rx="20" ry="25" fill="#ffffff"/>
            <!-- Tay ôm cành -->
            <ellipse class="colorable" cx="130" cy="240" rx="15" ry="30" transform="rotate(30 130 240)" fill="#ffffff"/>
            <ellipse class="colorable" cx="270" cy="230" rx="15" ry="30" transform="rotate(-30 270 230)" fill="#ffffff"/>
            <!-- Tai siêu to khổng lồ (Giống ảnh mẫu) -->
            <circle class="colorable" cx="100" cy="120" r="50" fill="#ffffff"/>
            <circle class="colorable" cx="300" cy="120" r="50" fill="#ffffff"/>
            <circle class="colorable" cx="100" cy="120" r="25" fill="#ffffff"/> <!-- Lõi tai -->
            <circle class="colorable" cx="300" cy="120" r="25" fill="#ffffff"/>
            <!-- Đầu tròn dẹt -->
            <ellipse class="colorable" cx="200" cy="150" rx="100" ry="85" fill="#ffffff"/>
            <!-- Mắt chấm nhỏ -->
            <circle cx="150" cy="140" r="10" fill="#1a202c"/>
            <circle cx="250" cy="140" r="10" fill="#1a202c"/>
            <!-- Mũi to hình oval đứng -->
            <ellipse class="colorable" cx="200" cy="170" rx="25" ry="40" fill="#ffffff"/>
            <!-- Miệng mỉm cười xíu xiu -->
            <path d="M190,220 Q200,230 210,220" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  22: `<svg id="svg-22" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Bốn chân gầy -->
            <rect class="colorable" x="140" y="280" width="15" height="50" rx="5" fill="#ffffff"/>
            <rect class="colorable" x="170" y="300" width="15" height="50" rx="5" fill="#ffffff"/>
            <rect class="colorable" x="220" y="300" width="15" height="50" rx="5" fill="#ffffff"/>
            <rect class="colorable" x="250" y="280" width="15" height="50" rx="5" fill="#ffffff"/>
            <!-- Thân bồng bềnh -->
            <path class="colorable" d="M100,220 A50,50 0 0,1 150,150 A60,60 0 0,1 250,150 A50,50 0 0,1 300,220 A50,50 0 0,1 280,300 A60,60 0 0,1 120,300 A50,50 0 0,1 100,220 Z" fill="#ffffff"/>
            <!-- Đầu -->
            <ellipse class="colorable" cx="130" cy="130" rx="40" ry="30" fill="#ffffff"/>
            <ellipse class="colorable" cx="130" cy="130" rx="15" ry="10" transform="rotate(-20 130 130)" fill="#ffffff"/> <!-- Tai -->
            <ellipse class="colorable" cx="90" cy="130" rx="15" ry="10" transform="rotate(20 90 130)" fill="#ffffff"/>
            <circle cx="115" cy="125" r="6" fill="#1a202c"/><circle cx="145" cy="125" r="6" fill="#1a202c"/>
            <path d="M125,145 Q130,155 135,145" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
            <!-- Lông xù trên đầu -->
            <path class="colorable" d="M100,110 A20,20 0 0,1 120,90 A25,25 0 0,1 160,110 A20,20 0 0,1 100,110 Z" fill="#ffffff"/>
        </svg>`,
  23: `<svg id="svg-23" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Thân vuông vức béo -->
            <rect class="colorable" x="100" y="180" width="200" height="120" rx="40" fill="#ffffff"/>
            <!-- Chân -->
            <rect class="colorable" x="120" y="280" width="30" height="40" rx="10" fill="#ffffff"/>
            <rect class="colorable" x="250" y="280" width="30" height="40" rx="10" fill="#ffffff"/>
            <!-- Đốm bò sữa -->
            <path class="colorable" d="M100,200 Q130,180 150,220 Q120,260 100,240 Z" fill="#ffffff"/>
            <path class="colorable" d="M250,280 Q280,240 300,260 Q300,300 280,300 Z" fill="#ffffff"/>
            <path class="colorable" d="M180,240 Q220,200 240,240 Q200,280 180,240 Z" fill="#ffffff"/>
            <!-- Bầu sữa -->
            <path class="colorable" d="M180,300 Q200,330 220,300 Z" fill="#ffffff"/>
            <line x1="190" y1="315" x2="190" y2="325" stroke="#1a202c" stroke-width="4"/><line x1="210" y1="315" x2="210" y2="325" stroke="#1a202c" stroke-width="4"/>
            <!-- Sừng -->
            <ellipse class="colorable" cx="150" cy="70" rx="15" ry="30" transform="rotate(-30 150 70)" fill="#ffffff"/>
            <ellipse class="colorable" cx="250" cy="70" rx="15" ry="30" transform="rotate(30 250 70)" fill="#ffffff"/>
            <!-- Tai -->
            <ellipse class="colorable" cx="110" cy="110" rx="25" ry="15" transform="rotate(-20 110 110)" fill="#ffffff"/>
            <ellipse class="colorable" cx="290" cy="110" rx="25" ry="15" transform="rotate(20 290 110)" fill="#ffffff"/>
            <!-- Đầu -->
            <rect class="colorable" x="140" y="80" width="120" height="120" rx="40" fill="#ffffff"/>
            <ellipse class="colorable" cx="200" cy="170" rx="55" ry="35" fill="#ffffff"/>
            <circle cx="170" cy="120" r="8" fill="#1a202c"/><circle cx="230" cy="120" r="8" fill="#1a202c"/>
            <circle cx="170" cy="170" r="6" fill="#1a202c"/><circle cx="230" cy="170" r="6" fill="#1a202c"/>
        </svg>`,
  24: `<svg id="svg-24" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Thân -->
            <ellipse class="colorable" cx="200" cy="240" rx="90" ry="70" fill="#ffffff"/>
            <!-- Đuôi -->
            <path class="colorable" d="M280,240 Q340,200 320,280 C300,320 280,260 280,240" fill="#ffffff"/>
            <!-- Chân -->
            <rect class="colorable" x="130" y="280" width="20" height="60" rx="10" fill="#ffffff"/>
            <rect class="colorable" x="170" y="290" width="20" height="50" rx="10" fill="#ffffff"/>
            <rect class="colorable" x="220" y="290" width="20" height="50" rx="10" fill="#ffffff"/>
            <rect class="colorable" x="250" y="280" width="20" height="60" rx="10" fill="#ffffff"/>
            <!-- Cổ -->
            <path class="colorable" d="M120,220 L160,130 L200,150 L180,240 Z" fill="#ffffff"/>
            <!-- Bờm ngựa -->
            <path class="colorable" d="M160,130 Q180,90 200,120 Q220,150 200,180 Q180,160 160,130" fill="#ffffff"/>
            <!-- Đầu -->
            <ellipse class="colorable" cx="140" cy="110" rx="50" ry="35" transform="rotate(-30 140 110)" fill="#ffffff"/>
            <!-- Tai -->
            <polygon class="colorable" points="160,80 140,40 180,60" fill="#ffffff"/>
            <circle cx="130" cy="100" r="6" fill="#1a202c"/>
            <circle cx="100" cy="80" r="4" fill="#1a202c"/>
            <path d="M80,90 Q100,110 110,100" stroke="#1a202c" stroke-width="4" fill="none"/>
        </svg>`,
  25: `<svg id="svg-25" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Gạc hươu hùng vĩ -->
            <path class="colorable" d="M170,110 L140,50 L100,70 M140,50 L120,20" stroke="#1a202c" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path class="colorable" d="M230,110 L260,50 L300,70 M260,50 L280,20" stroke="#1a202c" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <!-- Tai -->
            <ellipse class="colorable" cx="110" cy="130" rx="35" ry="15" transform="rotate(-20 110 130)" fill="#ffffff"/>
            <ellipse class="colorable" cx="290" cy="130" rx="35" ry="15" transform="rotate(20 290 130)" fill="#ffffff"/>
            <!-- Thân -->
            <path class="colorable" d="M140,180 C120,300 280,300 260,180 Z" fill="#ffffff"/>
            <ellipse class="colorable" cx="200" cy="250" rx="40" ry="50" fill="#ffffff"/>
            <!-- Đốm hươu -->
            <circle class="colorable" cx="160" cy="220" r="8" fill="#ffffff"/><circle class="colorable" cx="240" cy="220" r="8" fill="#ffffff"/>
            <circle class="colorable" cx="180" cy="270" r="8" fill="#ffffff"/><circle class="colorable" cx="220" cy="270" r="8" fill="#ffffff"/>
            <!-- Chân -->
            <rect class="colorable" x="150" y="290" width="15" height="50" rx="5" fill="#ffffff"/>
            <rect class="colorable" x="235" y="290" width="15" height="50" rx="5" fill="#ffffff"/>
            <!-- Đầu -->
            <ellipse class="colorable" cx="200" cy="150" rx="60" ry="70" fill="#ffffff"/>
            <circle cx="170" cy="130" r="8" fill="#1a202c"/><circle cx="230" cy="130" r="8" fill="#1a202c"/>
            <ellipse class="colorable" cx="200" cy="190" rx="20" ry="15" fill="#1a202c"/>
        </svg>`,
  26: `<svg id="svg-26" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Cánh dơi dang rộng -->
            <path class="colorable" d="M150,180 Q80,80 20,140 Q60,220 80,180 Q100,260 160,220 Z" fill="#ffffff"/>
            <path class="colorable" d="M250,180 Q320,80 380,140 Q340,220 320,180 Q300,260 240,220 Z" fill="#ffffff"/>
            <!-- Thân dơi -->
            <ellipse class="colorable" cx="200" cy="240" rx="50" ry="70" fill="#ffffff"/>
            <!-- Chân treo ngược -->
            <line x1="180" y1="310" x2="180" y2="350" stroke="#1a202c" stroke-width="6"/>
            <line x1="220" y1="310" x2="220" y2="350" stroke="#1a202c" stroke-width="6"/>
            <!-- Tai nhọn -->
            <polygon class="colorable" points="160,130 140,50 190,100" fill="#ffffff"/>
            <polygon class="colorable" points="240,130 260,50 210,100" fill="#ffffff"/>
            <!-- Đầu -->
            <circle class="colorable" cx="200" cy="150" r="55" fill="#ffffff"/>
            <circle cx="175" cy="140" r="8" fill="#1a202c"/><circle cx="225" cy="140" r="8" fill="#1a202c"/>
            <!-- Răng nanh -->
            <polygon points="190,170 195,185 200,170" fill="#ffffff" stroke="#1a202c" stroke-width="2"/>
            <polygon points="210,170 205,185 200,170" fill="#ffffff" stroke="#1a202c" stroke-width="2"/>
        </svg>`,
  27: `<svg id="svg-27" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Cánh trên -->
            <ellipse class="colorable" cx="120" cy="140" rx="80" ry="90" transform="rotate(-30 120 140)" fill="#ffffff"/>
            <ellipse class="colorable" cx="280" cy="140" rx="80" ry="90" transform="rotate(30 280 140)" fill="#ffffff"/>
            <!-- Cánh dưới -->
            <ellipse class="colorable" cx="140" cy="270" rx="60" ry="70" transform="rotate(30 140 270)" fill="#ffffff"/>
            <ellipse class="colorable" cx="260" cy="270" rx="60" ry="70" transform="rotate(-30 260 270)" fill="#ffffff"/>
            <!-- Hoa văn cánh -->
            <circle class="colorable" cx="120" cy="140" r="30" fill="#ffffff"/>
            <circle class="colorable" cx="280" cy="140" r="30" fill="#ffffff"/>
            <circle class="colorable" cx="140" cy="270" r="20" fill="#ffffff"/>
            <circle class="colorable" cx="260" cy="270" r="20" fill="#ffffff"/>
            <!-- Râu -->
            <path d="M190,70 Q160,30 140,50 M210,70 Q240,30 260,50" stroke="#1a202c" stroke-width="6" fill="none" stroke-linecap="round"/>
            <!-- Thân (Con tằm) -->
            <rect class="colorable" x="180" y="100" width="40" height="180" rx="20" fill="#ffffff"/>
            <!-- Đầu -->
            <circle class="colorable" cx="200" cy="80" r="25" fill="#ffffff"/>
            <circle cx="190" cy="75" r="4" fill="#1a202c"/><circle cx="210" cy="75" r="4" fill="#1a202c"/>
            <path d="M195,85 Q200,90 205,85" stroke="#1a202c" stroke-width="2" fill="none"/>
        </svg>`,
  28: `<svg id="svg-28" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- 6 Chân -->
            <path d="M100,160 L50,140 M100,220 L40,220 M100,280 L60,320" stroke="#1a202c" stroke-width="8" stroke-linecap="round"/>
            <path d="M300,160 L350,140 M300,220 L360,220 M300,280 L340,320" stroke="#1a202c" stroke-width="8" stroke-linecap="round"/>
            <!-- Thân / Vỏ -->
            <circle class="colorable" cx="200" cy="220" r="120" fill="#ffffff"/>
            <!-- Vạch chia vỏ -->
            <line x1="200" y1="100" x2="200" y2="340" stroke="#1a202c" stroke-width="8"/>
            <!-- Đốm đen -->
            <circle class="colorable" cx="140" cy="180" r="25" fill="#ffffff"/>
            <circle class="colorable" cx="260" cy="180" r="25" fill="#ffffff"/>
            <circle class="colorable" cx="120" cy="260" r="20" fill="#ffffff"/>
            <circle class="colorable" cx="280" cy="260" r="20" fill="#ffffff"/>
            <circle class="colorable" cx="180" cy="300" r="15" fill="#ffffff"/>
            <circle class="colorable" cx="220" cy="300" r="15" fill="#ffffff"/>
            <!-- Râu -->
            <path d="M180,60 Q150,30 140,50 M220,60 Q250,30 260,50" stroke="#1a202c" stroke-width="6" fill="none" stroke-linecap="round"/>
            <!-- Đầu -->
            <circle class="colorable" cx="200" cy="80" r="40" fill="#ffffff"/>
            <circle cx="185" cy="70" r="6" fill="#1a202c"/><circle cx="215" cy="70" r="6" fill="#1a202c"/>
        </svg>`,
  29: `<svg id="svg-29" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Cánh ong -->
            <ellipse class="colorable" cx="160" cy="110" rx="40" ry="80" transform="rotate(-45 160 110)" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="110" rx="40" ry="80" transform="rotate(45 240 110)" fill="#ffffff"/>
            <!-- Ngòi ong -->
            <polygon points="280,220 340,220 310,250" fill="#1a202c"/>
            <!-- Thân ong (dạng sọc) -->
            <ellipse class="colorable" cx="200" cy="220" rx="100" ry="70" fill="#ffffff"/>
            <path class="colorable" d="M140,165 Q200,200 260,165 L275,190 Q200,230 125,190 Z" fill="#ffffff"/>
            <path class="colorable" d="M115,220 Q200,260 285,220 L290,245 Q200,285 110,245 Z" fill="#ffffff"/>
            <!-- Râu ong -->
            <path d="M90,160 Q70,120 80,110 M110,150 Q130,110 120,100" stroke="#1a202c" stroke-width="6" fill="none" stroke-linecap="round"/>
            <!-- Đầu -->
            <circle class="colorable" cx="100" cy="200" r="50" fill="#ffffff"/>
            <circle cx="85" cy="190" r="8" fill="#1a202c"/><circle cx="115" cy="190" r="8" fill="#1a202c"/>
            <path d="M90,220 Q100,230 110,220" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  30: `<svg id="svg-30" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Thân mềm trườn -->
            <path class="colorable" d="M60,260 L320,260 C350,260 350,300 320,300 L60,300 C30,300 30,260 60,260 Z" fill="#ffffff"/>
            <path class="colorable" d="M120,260 L60,180 L100,160 L140,260 Z" fill="#ffffff"/>
            <!-- Râu ốc sên -->
            <path d="M85,160 L50,110 M115,160 L150,110" stroke="#1a202c" stroke-width="6" fill="none" stroke-linecap="round"/>
            <circle class="colorable" cx="50" cy="110" r="10" fill="#ffffff"/><circle class="colorable" cx="150" cy="110" r="10" fill="#ffffff"/>
            <circle cx="50" cy="110" r="4" fill="#1a202c"/><circle cx="150" cy="110" r="4" fill="#1a202c"/>
            <!-- Đầu -->
            <circle class="colorable" cx="100" cy="180" r="40" fill="#ffffff"/>
            <path d="M85,190 Q100,205 115,190" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
            <!-- Vỏ ốc cuộn tròn -->
            <circle class="colorable" cx="220" cy="170" r="100" fill="#ffffff"/>
            <path d="M220,70 A100,100 0 0,1 320,170 A100,100 0 0,1 220,270 A80,80 0 0,1 140,190 A60,60 0 0,1 200,130 A40,40 0 0,1 240,170 A20,20 0 0,1 220,190" stroke="#1a202c" stroke-width="8" fill="none" stroke-linecap="round"/>
        </svg>`,
  31: `<svg id="svg-31" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Tail -->
            <path class="colorable" d="M260,260 L320,260 L300,200 L360,200 L340,140 L280,160 Z" fill="#ffffff" stroke="#1a202c" stroke-width="4" stroke-linejoin="round"/>
            <!-- Body -->
            <ellipse class="colorable" cx="200" cy="240" rx="70" ry="80" fill="#ffffff"/>
            <!-- Ears -->
            <path class="colorable" d="M140,120 L80,40 L110,130 Z" fill="#ffffff"/>
            <polygon points="90,55 80,40 100,60" fill="#1a202c"/>
            <path class="colorable" d="M260,120 L320,40 L290,130 Z" fill="#ffffff"/>
            <polygon points="310,55 320,40 300,60" fill="#1a202c"/>
            <!-- Feet -->
            <ellipse class="colorable" cx="160" cy="310" rx="20" ry="10" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="310" rx="20" ry="10" fill="#ffffff"/>
            <!-- Arms -->
            <ellipse class="colorable" cx="150" cy="240" rx="15" ry="30" transform="rotate(30 150 240)" fill="#ffffff"/>
            <ellipse class="colorable" cx="250" cy="240" rx="15" ry="30" transform="rotate(-30 250 240)" fill="#ffffff"/>
            <!-- Head -->
            <ellipse class="colorable" cx="200" cy="150" rx="75" ry="65" fill="#ffffff"/>
            <!-- Cheeks -->
            <circle class="colorable" cx="140" cy="170" r="15" fill="#ffffff"/>
            <circle class="colorable" cx="260" cy="170" r="15" fill="#ffffff"/>
            <!-- Face -->
            <circle cx="165" cy="140" r="6" fill="#1a202c"/>
            <circle cx="235" cy="140" r="6" fill="#1a202c"/>
            <circle cx="200" cy="155" r="3" fill="#1a202c"/>
            <path d="M185,165 Q200,175 200,165 Q200,175 215,165" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  32: `<svg id="svg-32" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Bulb -->
            <path class="colorable" d="M130,160 C100,80 200,40 200,100 C200,40 300,80 270,160 C290,120 330,150 270,200 C200,220 130,200 130,160 Z" fill="#ffffff"/>
            <!-- Vines/Leaves on bulb -->
            <path d="M200,100 L200,180 M160,110 L180,150 M240,110 L220,150" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
            <!-- Body -->
            <ellipse class="colorable" cx="200" cy="240" rx="90" ry="60" fill="#ffffff"/>
            <!-- Legs -->
            <ellipse class="colorable" cx="140" cy="290" rx="20" ry="25" fill="#ffffff"/>
            <ellipse class="colorable" cx="260" cy="290" rx="20" ry="25" fill="#ffffff"/>
            <ellipse class="colorable" cx="110" cy="250" rx="20" ry="25" transform="rotate(30 110 250)" fill="#ffffff"/>
            <ellipse class="colorable" cx="290" cy="250" rx="20" ry="25" transform="rotate(-30 290 250)" fill="#ffffff"/>
            <!-- Head -->
            <path class="colorable" d="M130,180 C130,120 270,120 270,180 C290,220 240,240 200,240 C160,240 110,220 130,180 Z" fill="#ffffff"/>
            <!-- Spots -->
            <polygon class="colorable" points="140,150 160,140 150,160" fill="#ffffff"/>
            <polygon class="colorable" points="250,150 270,160 260,140" fill="#ffffff"/>
            <polygon class="colorable" points="200,130 220,130 210,145" fill="#ffffff"/>
            <!-- Face -->
            <ellipse class="colorable" cx="160" cy="180" rx="10" ry="15" transform="rotate(15 160 180)" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="180" rx="10" ry="15" transform="rotate(-15 240 180)" fill="#ffffff"/>
            <path d="M185,210 Q200,205 215,210" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  33: `<svg id="svg-33" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Tail -->
            <path class="colorable" d="M260,260 Q320,280 340,200 Q320,240 280,240 Z" fill="#ffffff"/>
            <!-- Flame -->
            <path class="colorable" d="M340,200 Q360,160 340,140 Q320,180 340,200 Z" fill="#ffffff"/>
            <path class="colorable" d="M340,200 Q320,170 330,150 Q330,180 340,200 Z" fill="#ffffff"/>
            <!-- Body -->
            <ellipse class="colorable" cx="200" cy="240" rx="60" ry="70" fill="#ffffff"/>
            <!-- Belly -->
            <ellipse class="colorable" cx="200" cy="250" rx="40" ry="50" fill="#ffffff"/>
            <!-- Feet -->
            <ellipse class="colorable" cx="160" cy="310" rx="25" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="310" rx="25" ry="15" fill="#ffffff"/>
            <!-- Arms -->
            <ellipse class="colorable" cx="140" cy="220" rx="15" ry="30" transform="rotate(45 140 220)" fill="#ffffff"/>
            <ellipse class="colorable" cx="260" cy="220" rx="15" ry="30" transform="rotate(-45 260 220)" fill="#ffffff"/>
            <!-- Head -->
            <ellipse class="colorable" cx="200" cy="140" rx="65" ry="60" fill="#ffffff"/>
            <!-- Face -->
            <ellipse cx="165" cy="140" rx="6" ry="10" fill="#1a202c"/>
            <ellipse cx="235" cy="140" rx="6" ry="10" fill="#1a202c"/>
            <path d="M185,170 Q200,185 215,170" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  34: `<svg id="svg-34" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Tail -->
            <path class="colorable" d="M260,260 C320,280 350,220 310,180 C280,150 250,200 280,220 C300,230 320,210 310,190" stroke="#1a202c" stroke-width="4" fill="#ffffff"/>
            <!-- Shell Back -->
            <ellipse class="colorable" cx="210" cy="230" rx="75" ry="85" fill="#ffffff"/>
            <!-- Shell Front (Belly) -->
            <ellipse class="colorable" cx="190" cy="240" rx="60" ry="70" fill="#ffffff"/>
            <!-- Shell lines -->
            <path d="M160,180 L160,300 M220,180 L220,300 M130,240 L250,240" stroke="#1a202c" stroke-width="4" fill="none"/>
            <!-- Feet -->
            <ellipse class="colorable" cx="150" cy="310" rx="20" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="230" cy="310" rx="20" ry="15" fill="#ffffff"/>
            <!-- Arms -->
            <ellipse class="colorable" cx="130" cy="220" rx="15" ry="30" transform="rotate(30 130 220)" fill="#ffffff"/>
            <ellipse class="colorable" cx="250" cy="220" rx="15" ry="30" transform="rotate(-30 250 220)" fill="#ffffff"/>
            <!-- Head -->
            <circle class="colorable" cx="190" cy="130" r="60" fill="#ffffff"/>
            <!-- Face -->
            <ellipse cx="160" cy="130" rx="8" ry="12" fill="#1a202c"/>
            <ellipse cx="220" cy="130" rx="8" ry="12" fill="#1a202c"/>
            <path d="M180,160 Q190,170 200,160" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  35: `<svg id="svg-35" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Body -->
            <circle class="colorable" cx="200" cy="200" r="100" fill="#ffffff"/>
            <!-- Ears -->
            <polygon class="colorable" points="130,120 100,50 170,100" fill="#ffffff"/>
            <polygon class="colorable" points="135,115 115,65 160,100" fill="#ffffff"/>
            <polygon class="colorable" points="270,120 300,50 230,100" fill="#ffffff"/>
            <polygon class="colorable" points="265,115 285,65 240,100" fill="#ffffff"/>
            <!-- Arms/Legs -->
            <ellipse class="colorable" cx="120" cy="230" rx="15" ry="25" transform="rotate(45 120 230)" fill="#ffffff"/>
            <ellipse class="colorable" cx="280" cy="230" rx="15" ry="25" transform="rotate(-45 280 230)" fill="#ffffff"/>
            <ellipse class="colorable" cx="150" cy="300" rx="25" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="250" cy="300" rx="25" ry="15" fill="#ffffff"/>
            <!-- Hair curl -->
            <path class="colorable" d="M180,100 C160,60 220,60 240,100 C250,130 200,150 180,130" stroke="#1a202c" stroke-width="4" fill="#ffffff"/>
            <!-- Eyes -->
            <circle class="colorable" cx="150" cy="180" r="25" fill="#ffffff"/>
            <circle class="colorable" cx="250" cy="180" r="25" fill="#ffffff"/>
            <circle class="colorable" cx="155" cy="175" r="15" fill="#ffffff"/>
            <circle class="colorable" cx="245" cy="175" r="15" fill="#ffffff"/>
            <circle cx="160" cy="170" r="5" fill="#ffffff"/>
            <circle cx="240" cy="170" r="5" fill="#ffffff"/>
            <!-- Mouth -->
            <path d="M190,210 Q200,230 210,210" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  36: `<svg id="svg-36" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Body -->
            <ellipse class="colorable" cx="200" cy="240" rx="120" ry="110" fill="#ffffff"/>
            <!-- Belly -->
            <ellipse class="colorable" cx="200" cy="260" rx="90" ry="80" fill="#ffffff"/>
            <!-- Feet -->
            <ellipse class="colorable" cx="120" cy="340" rx="35" ry="25" fill="#ffffff"/>
            <circle class="colorable" cx="120" cy="340" r="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="280" cy="340" rx="35" ry="25" fill="#ffffff"/>
            <circle class="colorable" cx="280" cy="340" r="15" fill="#ffffff"/>
            <!-- Arms -->
            <ellipse class="colorable" cx="80" cy="250" rx="20" ry="40" transform="rotate(20 80 250)" fill="#ffffff"/>
            <ellipse class="colorable" cx="320" cy="250" rx="20" ry="40" transform="rotate(-20 320 250)" fill="#ffffff"/>
            <!-- Head -->
            <path class="colorable" d="M120,160 Q120,60 200,60 Q280,60 280,160 Z" fill="#ffffff"/>
            <!-- Face Area -->
            <path class="colorable" d="M140,160 Q140,90 200,90 Q260,90 260,160 Q200,190 140,160 Z" fill="#ffffff"/>
            <!-- Ears -->
            <polygon class="colorable" points="130,100 110,40 160,70" fill="#ffffff"/>
            <polygon class="colorable" points="270,100 290,40 240,70" fill="#ffffff"/>
            <!-- Eyes (sleeping) -->
            <path d="M150,130 Q165,120 180,130" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
            <path d="M220,130 Q235,120 250,130" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
            <!-- Mouth -->
            <path d="M190,150 L210,150" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  37: `<svg id="svg-37" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Tail -->
            <path class="colorable" d="M240,260 C320,320 380,240 340,180 C300,140 260,200 250,230" fill="#ffffff"/>
            <path class="colorable" d="M340,180 C320,160 280,190 270,210 Z" fill="#ffffff"/>
            <!-- Body -->
            <ellipse class="colorable" cx="200" cy="240" rx="60" ry="70" fill="#ffffff"/>
            <!-- Fluffy Collar -->
            <path class="colorable" d="M120,180 Q160,240 200,240 Q240,240 280,180 Q250,140 200,150 Q150,140 120,180 Z" fill="#ffffff"/>
            <!-- Feet -->
            <ellipse class="colorable" cx="160" cy="310" rx="20" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="310" rx="20" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="150" cy="260" rx="15" ry="25" fill="#ffffff"/>
            <ellipse class="colorable" cx="250" cy="260" rx="15" ry="25" fill="#ffffff"/>
            <!-- Ears -->
            <ellipse class="colorable" cx="100" cy="90" rx="20" ry="60" transform="rotate(-40 100 90)" fill="#ffffff"/>
            <ellipse class="colorable" cx="100" cy="90" rx="10" ry="40" transform="rotate(-40 100 90)" fill="#ffffff"/>
            <ellipse class="colorable" cx="300" cy="90" rx="20" ry="60" transform="rotate(40 300 90)" fill="#ffffff"/>
            <ellipse class="colorable" cx="300" cy="90" rx="10" ry="40" transform="rotate(40 300 90)" fill="#ffffff"/>
            <!-- Head -->
            <circle class="colorable" cx="200" cy="130" r="60" fill="#ffffff"/>
            <!-- Face -->
            <ellipse cx="170" cy="130" rx="6" ry="10" fill="#1a202c"/>
            <ellipse cx="230" cy="130" rx="6" ry="10" fill="#1a202c"/>
            <circle cx="200" cy="145" r="3" fill="#1a202c"/>
            <path d="M190,155 Q200,165 210,155" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  38: `<svg id="svg-38" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Back Spikes -->
            <polygon class="colorable" points="160,100 130,40 200,80" fill="#ffffff"/>
            <polygon class="colorable" points="240,100 270,40 200,80" fill="#ffffff"/>
            <polygon class="colorable" points="120,150 60,120 120,200" fill="#ffffff"/>
            <polygon class="colorable" points="280,150 340,120 280,200" fill="#ffffff"/>
            <!-- Body -->
            <circle class="colorable" cx="200" cy="200" r="100" fill="#ffffff"/>
            <!-- Arms/Legs -->
            <ellipse class="colorable" cx="100" cy="220" rx="20" ry="30" transform="rotate(45 100 220)" fill="#ffffff"/>
            <ellipse class="colorable" cx="300" cy="220" rx="20" ry="30" transform="rotate(-45 300 220)" fill="#ffffff"/>
            <ellipse class="colorable" cx="150" cy="300" rx="30" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="250" cy="300" rx="30" ry="15" fill="#ffffff"/>
            <!-- Eyes (evil) -->
            <path class="colorable" d="M140,150 L180,160 L140,180 Z" fill="#ffffff"/>
            <path class="colorable" d="M260,150 L220,160 L260,180 Z" fill="#ffffff"/>
            <!-- Smile -->
            <path class="colorable" d="M130,220 C160,260 240,260 270,220 C240,240 160,240 130,220 Z" fill="#ffffff"/>
            <path d="M150,225 L150,240 M180,232 L180,245 M220,232 L220,245 M250,225 L250,240" stroke="#1a202c" stroke-width="4" fill="none"/>
        </svg>`,
  39: `<svg id="svg-39" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Body -->
            <ellipse class="colorable" cx="200" cy="260" rx="80" ry="90" fill="#ffffff"/>
            <!-- Feet -->
            <ellipse class="colorable" cx="160" cy="350" rx="25" ry="10" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="350" rx="25" ry="10" fill="#ffffff"/>
            <!-- Head -->
            <circle class="colorable" cx="200" cy="140" r="70" fill="#ffffff"/>
            <!-- Hair -->
            <path d="M190,70 L195,40 M210,70 L215,45 M200,70 L200,35" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
            <!-- Eyes -->
            <circle cx="160" cy="120" r="10" fill="#1a202c"/>
            <circle cx="160" cy="120" r="3" fill="#ffffff"/>
            <circle cx="240" cy="120" r="10" fill="#1a202c"/>
            <circle cx="240" cy="120" r="3" fill="#ffffff"/>
            <!-- Beak -->
            <ellipse class="colorable" cx="200" cy="160" rx="40" ry="25" fill="#ffffff"/>
            <path d="M170,160 Q200,170 230,160" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
            <circle cx="190" cy="150" r="2" fill="#1a202c"/><circle cx="210" cy="150" r="2" fill="#1a202c"/>
            <!-- Arms holding head -->
            <ellipse class="colorable" cx="120" cy="160" rx="15" ry="40" transform="rotate(30 120 160)" fill="#ffffff"/>
            <ellipse class="colorable" cx="280" cy="160" rx="15" ry="40" transform="rotate(-30 280 160)" fill="#ffffff"/>
        </svg>`,
  40: `<svg id="svg-40" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Tail -->
            <path class="colorable" d="M240,280 C300,280 320,200 280,180 C260,170 260,190 270,200" stroke="#1a202c" stroke-width="10" fill="none" stroke-linecap="round"/>
            <!-- Body -->
            <ellipse class="colorable" cx="200" cy="250" rx="50" ry="70" fill="#ffffff"/>
            <ellipse class="colorable" cx="200" cy="260" rx="35" ry="50" fill="#ffffff"/>
            <!-- Legs -->
            <ellipse class="colorable" cx="160" cy="320" rx="15" ry="25" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="320" rx="15" ry="25" fill="#ffffff"/>
            <!-- Arms -->
            <ellipse class="colorable" cx="140" cy="240" rx="10" ry="30" transform="rotate(40 140 240)" fill="#ffffff"/>
            <ellipse class="colorable" cx="260" cy="240" rx="10" ry="30" transform="rotate(-40 260 240)" fill="#ffffff"/>
            <!-- Head -->
            <ellipse class="colorable" cx="200" cy="140" rx="80" ry="60" fill="#ffffff"/>
            <!-- Ears -->
            <polygon class="colorable" points="140,90 110,40 170,80" fill="#ffffff"/>
            <polygon class="colorable" points="260,90 290,40 230,80" fill="#ffffff"/>
            <!-- Coin -->
            <ellipse class="colorable" cx="200" cy="90" rx="15" ry="25" fill="#ffffff"/>
            <line x1="195" y1="75" x2="195" y2="105" stroke="#1a202c" stroke-width="2"/>
            <line x1="205" y1="75" x2="205" y2="105" stroke="#1a202c" stroke-width="2"/>
            <!-- Eyes -->
            <ellipse class="colorable" cx="165" cy="130" rx="10" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="235" cy="130" rx="10" ry="15" fill="#ffffff"/>
            <circle cx="165" cy="130" r="4" fill="#1a202c"/><circle cx="235" cy="130" r="4" fill="#1a202c"/>
            <!-- Whiskers -->
            <line x1="120" y1="130" x2="80" y2="120" stroke="#1a202c" stroke-width="4" stroke-linecap="round"/>
            <line x1="120" y1="150" x2="80" y2="160" stroke="#1a202c" stroke-width="4" stroke-linecap="round"/>
            <line x1="280" y1="130" x2="320" y2="120" stroke="#1a202c" stroke-width="4" stroke-linecap="round"/>
            <line x1="280" y1="150" x2="320" y2="160" stroke="#1a202c" stroke-width="4" stroke-linecap="round"/>
            <!-- Mouth -->
            <path d="M185,160 Q200,175 215,160" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  41: `<svg id="svg-41" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Leaves -->
            <path class="colorable" d="M200,160 C180,60 120,40 100,80 C120,120 160,140 200,160 Z" fill="#ffffff"/>
            <path class="colorable" d="M200,160 C220,60 280,40 300,80 C280,120 240,140 200,160 Z" fill="#ffffff"/>
            <path class="colorable" d="M200,160 C190,80 160,20 200,20 C240,20 210,80 200,160 Z" fill="#ffffff"/>
            <path class="colorable" d="M200,160 C150,100 60,100 40,160 C100,180 150,170 200,160 Z" fill="#ffffff"/>
            <path class="colorable" d="M200,160 C250,100 340,100 360,160 C300,180 250,170 200,160 Z" fill="#ffffff"/>
            <!-- Body -->
            <circle class="colorable" cx="200" cy="240" r="70" fill="#ffffff"/>
            <!-- Feet -->
            <ellipse class="colorable" cx="160" cy="310" rx="25" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="310" rx="25" ry="15" fill="#ffffff"/>
            <!-- Face -->
            <circle cx="170" cy="230" r="6" fill="#1a202c"/>
            <circle cx="230" cy="230" r="6" fill="#1a202c"/>
            <circle cx="172" cy="228" r="2" fill="#ffffff"/>
            <circle cx="232" cy="228" r="2" fill="#ffffff"/>
            <path d="M190,250 Q200,260 210,250" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  42: `<svg id="svg-42" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Wings -->
            <path class="colorable" d="M150,180 Q100,120 60,140 Q100,160 80,200 Q120,190 150,180 Z" fill="#ffffff"/>
            <path class="colorable" d="M250,180 Q300,120 340,140 Q300,160 320,200 Q280,190 250,180 Z" fill="#ffffff"/>
            <!-- Tail -->
            <path class="colorable" d="M260,280 Q340,320 360,260 Q300,240 280,240 Z" fill="#ffffff"/>
            <!-- Body -->
            <ellipse class="colorable" cx="200" cy="240" rx="80" ry="100" fill="#ffffff"/>
            <ellipse class="colorable" cx="200" cy="250" rx="55" ry="75" fill="#ffffff"/>
            <!-- Belly lines -->
            <path d="M150,220 Q200,240 250,220 M145,250 Q200,270 255,250 M155,280 Q200,300 245,280" stroke="#1a202c" stroke-width="4" fill="none"/>
            <!-- Legs -->
            <ellipse class="colorable" cx="150" cy="330" rx="30" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="250" cy="330" rx="30" ry="15" fill="#ffffff"/>
            <!-- Arms -->
            <ellipse class="colorable" cx="130" cy="220" rx="15" ry="35" transform="rotate(40 130 220)" fill="#ffffff"/>
            <ellipse class="colorable" cx="270" cy="220" rx="15" ry="35" transform="rotate(-40 270 220)" fill="#ffffff"/>
            <!-- Antennas -->
            <path d="M190,80 Q170,40 150,60 M210,80 Q230,40 250,60" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
            <!-- Horn -->
            <polygon class="colorable" points="195,80 205,80 200,60" fill="#ffffff"/>
            <!-- Head -->
            <ellipse class="colorable" cx="200" cy="130" rx="50" ry="50" fill="#ffffff"/>
            <!-- Face -->
            <circle cx="175" cy="120" r="6" fill="#1a202c"/>
            <circle cx="225" cy="120" r="6" fill="#1a202c"/>
            <ellipse class="colorable" cx="200" cy="150" rx="30" ry="20" fill="#ffffff"/>
            <circle cx="190" cy="145" r="2" fill="#1a202c"/><circle cx="210" cy="145" r="2" fill="#1a202c"/>
        </svg>`,
  43: `<svg id="svg-43" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Wings Top -->
            <path class="colorable" d="M180,180 C100,60 20,80 40,160 C60,220 160,200 180,180 Z" fill="#ffffff"/>
            <path class="colorable" d="M220,180 C300,60 380,80 360,160 C340,220 240,200 220,180 Z" fill="#ffffff"/>
            <!-- Wings Bottom -->
            <path class="colorable" d="M180,220 C100,280 60,340 100,360 C140,380 180,280 180,220 Z" fill="#ffffff"/>
            <path class="colorable" d="M220,220 C300,280 340,340 300,360 C260,380 220,280 220,220 Z" fill="#ffffff"/>
            <!-- Wing Details -->
            <circle class="colorable" cx="90" cy="150" r="20" fill="#ffffff"/>
            <circle class="colorable" cx="310" cy="150" r="20" fill="#ffffff"/>
            <circle class="colorable" cx="130" cy="320" r="15" fill="#ffffff"/>
            <circle class="colorable" cx="270" cy="320" r="15" fill="#ffffff"/>
            <!-- Body -->
            <ellipse class="colorable" cx="200" cy="220" rx="35" ry="60" fill="#ffffff"/>
            <!-- Arms/Legs -->
            <ellipse class="colorable" cx="180" cy="200" rx="10" ry="20" transform="rotate(30 180 200)" fill="#ffffff"/>
            <ellipse class="colorable" cx="220" cy="200" rx="10" ry="20" transform="rotate(-30 220 200)" fill="#ffffff"/>
            <ellipse class="colorable" cx="185" cy="270" rx="8" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="215" cy="270" rx="8" ry="15" fill="#ffffff"/>
            <!-- Antennas -->
            <path d="M180,80 Q160,40 140,60 M220,80 Q240,40 260,60" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
            <!-- Head -->
            <circle class="colorable" cx="200" cy="120" r="45" fill="#ffffff"/>
            <!-- Big Eyes -->
            <ellipse class="colorable" cx="170" cy="120" rx="20" ry="25" fill="#ffffff"/>
            <ellipse class="colorable" cx="230" cy="120" rx="20" ry="25" fill="#ffffff"/>
            <circle cx="170" cy="120" r="5" fill="#1a202c"/><circle cx="230" cy="120" r="5" fill="#1a202c"/>
            <path d="M195,145 Q200,150 205,145" stroke="#1a202c" stroke-width="3" fill="none" stroke-linecap="round"/>
        </svg>`,
  44: `<svg id="svg-44" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Body/Head -->
            <circle class="colorable" cx="200" cy="180" r="70" fill="#ffffff"/>
            <!-- Spikes on head -->
            <polygon class="colorable" points="160,120 150,70 180,110" fill="#ffffff"/>
            <polygon class="colorable" points="200,110 200,60 220,110" fill="#ffffff"/>
            <polygon class="colorable" points="240,120 250,70 220,110" fill="#ffffff"/>
            <!-- Shell -->
            <path class="colorable" d="M130,200 L150,170 L170,210 L200,170 L230,210 L250,170 L270,200 C280,280 260,320 200,320 C140,320 120,280 130,200 Z" fill="#ffffff"/>
            <!-- Shell patterns -->
            <polygon class="colorable" points="160,260 180,240 200,260 180,280" fill="#ffffff"/>
            <polygon class="colorable" points="230,240 250,260 230,280" fill="#ffffff"/>
            <polygon class="colorable" points="150,290 170,300 150,310" fill="#ffffff"/>
            <!-- Arms/Legs -->
            <ellipse class="colorable" cx="120" cy="220" rx="15" ry="25" transform="rotate(45 120 220)" fill="#ffffff"/>
            <ellipse class="colorable" cx="280" cy="220" rx="15" ry="25" transform="rotate(-45 280 220)" fill="#ffffff"/>
            <ellipse class="colorable" cx="160" cy="320" rx="20" ry="10" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="320" rx="20" ry="10" fill="#ffffff"/>
            <!-- Face -->
            <circle cx="170" cy="160" r="6" fill="#1a202c"/>
            <circle cx="230" cy="160" r="6" fill="#1a202c"/>
            <path d="M195,175 Q200,185 205,175" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  45: `<svg id="svg-45" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Tail -->
            <path class="colorable" d="M260,260 C340,300 380,220 340,160 C320,130 300,160 320,180" fill="#ffffff"/>
            <!-- Tail fin -->
            <path class="colorable" d="M340,160 C360,120 310,120 320,180" fill="#ffffff"/>
            <!-- Body -->
            <circle class="colorable" cx="200" cy="220" r="90" fill="#ffffff"/>
            <!-- Belly -->
            <circle class="colorable" cx="200" cy="230" r="60" fill="#ffffff"/>
            <!-- Swirl on Belly -->
            <path d="M200,230 Q230,230 230,200 Q230,170 180,180 Q150,190 160,230 Q170,270 220,260 Q260,250 250,210" stroke="#1a202c" stroke-width="6" fill="none" stroke-linecap="round"/>
            <!-- Feet -->
            <ellipse class="colorable" cx="150" cy="310" rx="25" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="250" cy="310" rx="25" ry="15" fill="#ffffff"/>
            <!-- Lips -->
            <ellipse class="colorable" cx="200" cy="150" rx="20" ry="10" fill="#ffffff"/>
            <!-- Eyes -->
            <ellipse class="colorable" cx="140" cy="120" rx="15" ry="20" fill="#ffffff"/>
            <ellipse class="colorable" cx="260" cy="120" rx="15" ry="20" fill="#ffffff"/>
            <circle cx="145" cy="120" r="6" fill="#1a202c"/>
            <circle cx="255" cy="120" r="6" fill="#1a202c"/>
        </svg>`,
  46: `<svg id="svg-46" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Dirt base -->
            <ellipse class="colorable" cx="200" cy="320" rx="140" ry="40" fill="#ffffff"/>
            <path class="colorable" d="M120,330 C100,360 160,380 200,370 C240,360 300,380 280,330 Z" fill="#ffffff"/>
            <!-- Rocks -->
            <polygon class="colorable" points="80,310 100,280 120,320" fill="#ffffff"/>
            <polygon class="colorable" points="320,310 300,290 280,320" fill="#ffffff"/>
            <circle class="colorable" cx="140" cy="340" r="15" fill="#ffffff"/>
            <circle class="colorable" cx="260" cy="340" r="15" fill="#ffffff"/>
            <!-- Body -->
            <path class="colorable" d="M130,310 L130,160 C130,100 270,100 270,160 L270,310 Z" fill="#ffffff"/>
            <!-- Big Pink Nose -->
            <ellipse class="colorable" cx="200" cy="180" rx="30" ry="20" fill="#ffffff"/>
            <!-- Eyes -->
            <ellipse cx="160" cy="150" rx="5" ry="15" fill="#1a202c"/>
            <ellipse cx="240" cy="150" rx="5" ry="15" fill="#1a202c"/>
            <circle cx="160" cy="142" r="2" fill="#ffffff"/><circle cx="240" cy="142" r="2" fill="#ffffff"/>
        </svg>`,
  47: `<svg id="svg-47" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Body Segments (from back to front) -->
            <circle class="colorable" cx="300" cy="260" r="30" fill="#ffffff"/>
            <circle class="colorable" cx="250" cy="270" r="35" fill="#ffffff"/>
            <circle class="colorable" cx="190" cy="260" r="40" fill="#ffffff"/>
            <circle class="colorable" cx="140" cy="220" r="45" fill="#ffffff"/>
            <!-- Underbelly -->
            <path class="colorable" d="M100,240 C140,260 170,300 210,300 C240,300 270,290 300,280 C270,300 220,310 180,310 C140,310 110,270 100,240 Z" fill="#ffffff"/>
            <!-- Feet -->
            <ellipse class="colorable" cx="130" cy="260" rx="10" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="190" cy="300" rx="10" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="300" rx="10" ry="15" fill="#ffffff"/>
            <!-- Tail spike -->
            <path class="colorable" d="M320,240 L350,220 L330,260 Z" fill="#ffffff"/>
            <!-- Antenna (Y shape) -->
            <path class="colorable" d="M140,110 L140,50 L110,30 M140,50 L170,30" stroke="#1a202c" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <!-- Head -->
            <circle class="colorable" cx="140" cy="150" r="50" fill="#ffffff"/>
            <!-- Big Eyes -->
            <circle class="colorable" cx="110" cy="150" r="20" fill="#ffffff"/>
            <circle class="colorable" cx="170" cy="150" r="20" fill="#ffffff"/>
            <circle cx="110" cy="150" r="10" fill="#1a202c"/>
            <circle cx="170" cy="150" r="10" fill="#1a202c"/>
            <circle cx="113" cy="147" r="4" fill="#ffffff"/><circle cx="173" cy="147" r="4" fill="#ffffff"/>
            <!-- Mouth -->
            <path d="M130,180 Q140,190 150,180" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  48: `<svg id="svg-48" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Wings Left -->
            <path class="colorable" d="M150,200 L40,120 L40,200 L100,260 L80,320 L160,250 Z" fill="#ffffff" stroke="#1a202c" stroke-width="4" stroke-linejoin="round"/>
            <!-- Wings Right -->
            <path class="colorable" d="M250,200 L360,120 L360,200 L300,260 L320,320 L240,250 Z" fill="#ffffff" stroke="#1a202c" stroke-width="4" stroke-linejoin="round"/>
            <!-- Wing supports -->
            <line x1="150" y1="200" x2="40" y2="200" stroke="#1a202c" stroke-width="4"/>
            <line x1="150" y1="200" x2="100" y2="260" stroke="#1a202c" stroke-width="4"/>
            <line x1="250" y1="200" x2="360" y2="200" stroke="#1a202c" stroke-width="4"/>
            <line x1="250" y1="200" x2="300" y2="260" stroke="#1a202c" stroke-width="4"/>
            <!-- Ears -->
            <polygon class="colorable" points="160,130 110,40 180,100" fill="#ffffff"/>
            <polygon class="colorable" points="240,130 290,40 220,100" fill="#ffffff"/>
            <polygon class="colorable" points="155,120 125,60 170,95" fill="#ffffff"/>
            <polygon class="colorable" points="245,120 275,60 230,95" fill="#ffffff"/>
            <!-- Legs (Tail extensions) -->
            <line x1="180" y1="260" x2="160" y2="300" stroke="#1a202c" stroke-width="6"/>
            <line x1="220" y1="260" x2="240" y2="300" stroke="#1a202c" stroke-width="6"/>
            <!-- Body/Head -->
            <circle class="colorable" cx="200" cy="180" r="60" fill="#ffffff"/>
            <!-- Big Mouth (No eyes) -->
            <path class="colorable" d="M160,180 Q200,240 240,180 Q200,160 160,180 Z" fill="#ffffff"/>
            <!-- Fangs -->
            <polygon points="170,180 175,195 180,180" fill="#ffffff" stroke="#1a202c" stroke-width="2"/>
            <polygon points="220,180 225,195 230,180" fill="#ffffff" stroke="#1a202c" stroke-width="2"/>
        </svg>`,
  49: `<svg id="svg-49" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Tail (Black with eyes) -->
            <path class="colorable" d="M260,260 L320,240 L300,280 L340,300 L260,320 Z" fill="#ffffff" stroke="#1a202c" stroke-width="4"/>
            <!-- Tail eyes -->
            <circle cx="310" cy="270" r="3" fill="#1a202c"/><circle cx="320" cy="275" r="3" fill="#1a202c"/>
            <path d="M312,275 Q315,280 318,278" stroke="#1a202c" stroke-width="2" fill="none"/>
            <!-- Body Blob -->
            <path class="colorable" d="M130,280 C110,340 290,340 270,280 C290,160 250,80 200,80 C150,80 110,160 130,280 Z" fill="#ffffff"/>
            <!-- Legs -->
            <ellipse class="colorable" cx="150" cy="330" rx="20" ry="10" fill="#ffffff"/>
            <ellipse class="colorable" cx="250" cy="330" rx="20" ry="10" fill="#ffffff"/>
            <ellipse class="colorable" cx="120" cy="320" rx="20" ry="10" fill="#ffffff"/>
            <ellipse class="colorable" cx="280" cy="320" rx="20" ry="10" fill="#ffffff"/>
            <!-- Arms (Salute) -->
            <ellipse class="colorable" cx="120" cy="200" rx="15" ry="35" transform="rotate(-40 120 200)" fill="#ffffff"/>
            <ellipse class="colorable" cx="280" cy="200" rx="15" ry="35" transform="rotate(40 280 200)" fill="#ffffff"/>
            <!-- Eyes (Squinting) -->
            <path d="M150,140 L180,150 L150,160 M250,140 L220,150 L250,160" stroke="#1a202c" stroke-width="4" fill="none" stroke-linejoin="round"/>
            <!-- Mouth (Zigzag) -->
            <path d="M180,180 L190,170 L200,180 L210,170 L220,180" stroke="#1a202c" stroke-width="4" fill="none" stroke-linejoin="round"/>
        </svg>`,
  50: `<svg id="svg-50" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Long floating tail -->
            <path class="colorable" d="M230,270 C280,360 380,300 320,200 C300,150 280,180 340,160" stroke="#1a202c" stroke-width="8" fill="none" stroke-linecap="round"/>
            <ellipse class="colorable" cx="340" cy="160" rx="15" ry="25" transform="rotate(30 340 160)" fill="#ffffff"/>
            <!-- Body -->
            <ellipse class="colorable" cx="200" cy="230" rx="35" ry="50" fill="#ffffff"/>
            <!-- Big Legs -->
            <ellipse class="colorable" cx="160" cy="280" rx="20" ry="35" transform="rotate(30 160 280)" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="280" rx="20" ry="35" transform="rotate(-30 240 280)" fill="#ffffff"/>
            <ellipse class="colorable" cx="150" cy="310" rx="25" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="250" cy="310" rx="25" ry="15" fill="#ffffff"/>
            <!-- Tiny Arms -->
            <ellipse class="colorable" cx="170" cy="220" rx="8" ry="20" transform="rotate(-45 170 220)" fill="#ffffff"/>
            <ellipse class="colorable" cx="230" cy="220" rx="8" ry="20" transform="rotate(45 230 220)" fill="#ffffff"/>
            <!-- Ears -->
            <polygon class="colorable" points="140,110 110,60 170,80" fill="#ffffff"/>
            <polygon class="colorable" points="260,110 290,60 230,80" fill="#ffffff"/>
            <!-- Head -->
            <ellipse class="colorable" cx="200" cy="130" rx="60" ry="55" fill="#ffffff"/>
            <!-- Big innocent eyes -->
            <ellipse class="colorable" cx="165" cy="130" rx="15" ry="20" fill="#ffffff"/>
            <ellipse class="colorable" cx="235" cy="130" rx="15" ry="20" fill="#ffffff"/>
            <circle cx="168" cy="128" r="8" fill="#1a202c"/><circle cx="232" cy="128" r="8" fill="#1a202c"/>
            <circle cx="169" cy="125" r="3" fill="#ffffff"/><circle cx="231" cy="125" r="3" fill="#ffffff"/>
            <!-- Tiny muzzle -->
            <path d="M195,155 Q200,160 205,155" stroke="#1a202c" stroke-width="3" fill="none" stroke-linecap="round"/>
        </svg>`,
  51: `<svg id="svg-51" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Wings -->
            <path class="colorable" d="M120,200 C80,180 60,220 80,240 C60,260 80,300 120,260 Z" fill="#ffffff"/>
            <path class="colorable" d="M280,200 C320,180 340,220 320,240 C340,260 320,300 280,260 Z" fill="#ffffff"/>
            <!-- Body -->
            <ellipse class="colorable" cx="200" cy="240" rx="90" ry="85" fill="#ffffff"/>
            <!-- Ears -->
            <polygon class="colorable" points="130,170 80,70 170,120" fill="#ffffff"/>
            <polygon points="120,110 80,70 110,130" fill="#1a202c"/> <!-- Ear tip -->
            <polygon class="colorable" points="270,170 320,70 230,120" fill="#ffffff"/>
            <polygon points="280,110 320,70 290,130" fill="#1a202c"/>
            <!-- Arms -->
            <ellipse class="colorable" cx="120" cy="240" rx="20" ry="35" transform="rotate(45 120 240)" fill="#ffffff"/>
            <ellipse class="colorable" cx="280" cy="240" rx="20" ry="35" transform="rotate(-45 280 240)" fill="#ffffff"/>
            <!-- Legs -->
            <ellipse class="colorable" cx="160" cy="320" rx="25" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="320" rx="25" ry="15" fill="#ffffff"/>
            <!-- Curl -->
            <path class="colorable" d="M180,130 C160,80 240,80 240,120 C240,150 200,160 190,140" stroke="#1a202c" stroke-width="6" fill="#ffffff"/>
            <!-- Face -->
            <ellipse cx="165" cy="180" rx="6" ry="12" fill="#1a202c"/>
            <ellipse cx="235" cy="180" rx="6" ry="12" fill="#1a202c"/>
            <circle cx="165" cy="175" r="3" fill="#ffffff"/><circle cx="235" cy="175" r="3" fill="#ffffff"/>
            <!-- Cheeks -->
            <circle class="colorable" cx="130" cy="200" r="15" fill="#ffffff"/>
            <circle class="colorable" cx="270" cy="200" r="15" fill="#ffffff"/>
            <!-- Mouth -->
            <path d="M190,200 L210,200" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
            <polygon points="195,200 200,210 205,200" fill="#ffffff" stroke="#1a202c" stroke-width="2"/>
        </svg>`,
  52: `<svg id="svg-52" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- 6 Tails -->
            <path class="colorable" d="M220,260 C300,320 380,260 320,160 C280,140 250,180 240,240" stroke="#1a202c" stroke-width="4" fill="#ffffff"/>
            <path class="colorable" d="M220,260 C280,340 340,300 340,220 C320,180 280,200 260,250" stroke="#1a202c" stroke-width="4" fill="#ffffff"/>
            <path class="colorable" d="M200,260 C220,360 280,340 300,280 C320,220 280,220 250,260" stroke="#1a202c" stroke-width="4" fill="#ffffff"/>
            <path class="colorable" d="M180,260 C100,320 20,260 80,160 C120,140 150,180 160,240" stroke="#1a202c" stroke-width="4" fill="#ffffff"/>
            <path class="colorable" d="M180,260 C120,340 60,300 60,220 C80,180 120,200 140,250" stroke="#1a202c" stroke-width="4" fill="#ffffff"/>
            <path class="colorable" d="M200,260 C180,360 120,340 100,280 C80,220 120,220 150,260" stroke="#1a202c" stroke-width="4" fill="#ffffff"/>
            <!-- Body -->
            <path class="colorable" d="M140,200 C120,300 280,300 260,200 Z" fill="#ffffff"/>
            <ellipse class="colorable" cx="200" cy="260" rx="35" ry="40" fill="#ffffff"/>
            <!-- Legs -->
            <ellipse class="colorable" cx="150" cy="300" rx="20" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="250" cy="300" rx="20" ry="15" fill="#ffffff"/>
            <!-- Head -->
            <circle class="colorable" cx="200" cy="150" r="60" fill="#ffffff"/>
            <!-- Ears -->
            <polygon class="colorable" points="160,110 120,50 180,90" fill="#ffffff"/>
            <polygon class="colorable" points="150,100 130,60 165,85" fill="#ffffff"/>
            <polygon class="colorable" points="240,110 280,50 220,90" fill="#ffffff"/>
            <polygon class="colorable" points="250,100 270,60 235,85" fill="#ffffff"/>
            <!-- Head Fluff -->
            <path class="colorable" d="M180,110 C160,60 200,40 210,80 C230,40 260,70 220,110 C210,140 190,140 180,110 Z" fill="#ffffff" stroke="#1a202c" stroke-width="4"/>
            <!-- Face -->
            <ellipse cx="170" cy="160" rx="6" ry="10" fill="#1a202c"/>
            <ellipse cx="230" cy="160" rx="6" ry="10" fill="#1a202c"/>
            <circle cx="200" cy="175" r="4" fill="#1a202c"/>
        </svg>`,
  53: `<svg id="svg-53" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Shell -->
            <path class="colorable" d="M220,240 C280,240 320,200 300,160 C270,110 190,160 220,240" fill="#ffffff"/>
            <path class="colorable" d="M300,160 L290,140 M280,150 L270,120 M260,180 L230,160" stroke="#1a202c" stroke-width="6" fill="none" stroke-linecap="round"/>
            <!-- Body -->
            <path class="colorable" d="M260,280 C260,340 160,360 120,320 C100,300 120,250 160,250 L160,120 C160,80 200,80 200,120 L200,250 C230,250 260,260 260,280 Z" fill="#ffffff"/>
            <!-- Belly -->
            <path class="colorable" d="M160,250 C120,250 110,290 120,310 C140,340 220,340 240,300 C250,280 230,250 160,250 Z" fill="#ffffff"/>
            <!-- Flippers -->
            <path class="colorable" d="M140,290 C80,300 40,340 60,360 C80,380 140,320 160,310" fill="#ffffff"/>
            <path class="colorable" d="M240,290 C300,300 340,340 320,360 C300,380 240,320 220,310" fill="#ffffff"/>
            <!-- Head -->
            <ellipse class="colorable" cx="180" cy="120" rx="35" ry="30" fill="#ffffff"/>
            <!-- Horn -->
            <polygon class="colorable" points="175,90 185,90 180,60" fill="#ffffff"/>
            <!-- Ears -->
            <path class="colorable" d="M150,110 C130,90 110,130 140,130" stroke="#1a202c" stroke-width="6" fill="none" stroke-linecap="round"/>
            <path class="colorable" d="M210,110 C230,90 250,130 220,130" stroke="#1a202c" stroke-width="6" fill="none" stroke-linecap="round"/>
            <!-- Face -->
            <ellipse cx="165" cy="120" rx="4" ry="8" fill="#1a202c"/>
            <ellipse cx="195" cy="120" rx="4" ry="8" fill="#1a202c"/>
            <path d="M175,135 Q180,140 185,135" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  54: `<svg id="svg-54" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Tail -->
            <path class="colorable" d="M260,260 C360,280 380,180 340,140 C320,120 300,160 320,180" stroke="#1a202c" stroke-width="25" fill="none" stroke-linecap="round"/>
            <path class="colorable" d="M340,140 C320,120 300,160 320,180" stroke="#ffffff" stroke-width="20" fill="none" stroke-linecap="round"/>
            <!-- Body -->
            <ellipse class="colorable" cx="200" cy="240" rx="110" ry="70" fill="#ffffff"/>
            <ellipse class="colorable" cx="200" cy="260" rx="70" ry="40" fill="#ffffff"/>
            <!-- Legs -->
            <ellipse class="colorable" cx="120" cy="300" rx="20" ry="25" fill="#ffffff"/>
            <ellipse class="colorable" cx="260" cy="300" rx="20" ry="25" fill="#ffffff"/>
            <ellipse class="colorable" cx="160" cy="310" rx="20" ry="25" fill="#ffffff"/>
            <ellipse class="colorable" cx="220" cy="310" rx="20" ry="25" fill="#ffffff"/>
            <!-- Head -->
            <ellipse class="colorable" cx="140" cy="160" rx="60" ry="50" fill="#ffffff"/>
            <!-- Ears -->
            <ellipse class="colorable" cx="100" cy="120" rx="15" ry="10" transform="rotate(-30 100 120)" fill="#ffffff"/>
            <ellipse class="colorable" cx="180" cy="120" rx="15" ry="10" transform="rotate(30 180 120)" fill="#ffffff"/>
            <!-- Muzzle -->
            <ellipse class="colorable" cx="120" cy="180" rx="40" ry="25" fill="#ffffff"/>
            <!-- Face -->
            <circle cx="120" cy="140" r="4" fill="#1a202c"/>
            <circle cx="160" cy="140" r="4" fill="#1a202c"/>
            <circle cx="100" cy="175" r="2" fill="#1a202c"/>
            <circle cx="130" cy="175" r="2" fill="#1a202c"/>
            <path d="M100,190 Q120,205 140,190" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  55: `<svg id="svg-55" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Body -->
            <ellipse class="colorable" cx="200" cy="260" rx="55" ry="70" fill="#ffffff"/>
            <ellipse class="colorable" cx="200" cy="270" rx="35" ry="50" fill="#ffffff"/>
            <!-- Tail -->
            <path class="colorable" d="M240,300 C280,340 320,300 300,270 C280,240 260,280 240,300" fill="#ffffff"/>
            <!-- Feet -->
            <ellipse class="colorable" cx="160" cy="330" rx="20" ry="15" fill="#ffffff"/>
            <polygon points="145,335 155,335 150,345" fill="#ffffff" stroke="#1a202c" stroke-width="2"/>
            <ellipse class="colorable" cx="240" cy="330" rx="20" ry="15" fill="#ffffff"/>
            <polygon points="225,335 235,335 230,345" fill="#ffffff" stroke="#1a202c" stroke-width="2"/>
            <!-- Arms -->
            <ellipse class="colorable" cx="150" cy="250" rx="12" ry="25" transform="rotate(30 150 250)" fill="#ffffff"/>
            <ellipse class="colorable" cx="250" cy="250" rx="12" ry="25" transform="rotate(-30 250 250)" fill="#ffffff"/>
            <!-- Bone -->
            <path class="colorable" d="M220,230 L290,190" stroke="#1a202c" stroke-width="12" stroke-linecap="round"/>
            <circle class="colorable" cx="220" cy="225" r="10" fill="#ffffff"/>
            <circle class="colorable" cx="215" cy="235" r="10" fill="#ffffff"/>
            <circle class="colorable" cx="295" cy="185" r="10" fill="#ffffff"/>
            <circle class="colorable" cx="290" cy="195" r="10" fill="#ffffff"/>
            <!-- Head -->
            <circle class="colorable" cx="200" cy="140" r="50" fill="#ffffff"/>
            <!-- Skull Helmet -->
            <path class="colorable" d="M140,150 C140,70 260,70 260,150 C260,180 230,210 200,210 C170,210 140,180 140,150 Z" fill="#ffffff"/>
            <path class="colorable" d="M160,180 L180,210 L220,210 L240,180 Z" fill="#ffffff"/>
            <polygon class="colorable" points="150,110 120,60 180,90" fill="#ffffff"/>
            <polygon class="colorable" points="250,110 280,60 220,90" fill="#ffffff"/>
            <!-- Eye Holes -->
            <ellipse cx="170" cy="150" rx="15" ry="20" fill="#1a202c"/>
            <ellipse cx="230" cy="150" rx="15" ry="20" fill="#1a202c"/>
            <circle cx="170" cy="150" r="4" fill="#ffffff"/>
            <circle cx="230" cy="150" r="4" fill="#ffffff"/>
            <ellipse cx="200" cy="185" rx="5" ry="8" fill="#1a202c"/>
            <!-- Cracks -->
            <path d="M190,90 L200,110 L180,120" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  56: `<svg id="svg-56" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Tail Fin -->
            <path class="colorable" d="M260,200 L350,130 L320,200 L350,270 Z" fill="#ffffff"/>
            <!-- Top Fin -->
            <path class="colorable" d="M180,130 L160,50 L200,90 L220,50 L240,90 L260,50 L240,120 Z" fill="#ffffff"/>
            <!-- Bottom Fin -->
            <polygon class="colorable" points="180,270 200,340 240,260" fill="#ffffff"/>
            <!-- Body -->
            <ellipse class="colorable" cx="200" cy="200" rx="80" ry="70" fill="#ffffff"/>
            <!-- Pectoral Fin -->
            <polygon class="colorable" points="200,220 240,260 250,210" fill="#ffffff"/>
            <!-- Big Eye -->
            <circle class="colorable" cx="150" cy="170" r="25" fill="#ffffff"/>
            <circle cx="150" cy="170" r="8" fill="#1a202c"/>
            <circle cx="145" cy="165" r="3" fill="#ffffff"/>
            <!-- Lips -->
            <ellipse class="colorable" cx="110" cy="220" rx="20" ry="30" transform="rotate(-30 110 220)" fill="#ffffff"/>
            <ellipse cx="110" cy="220" rx="10" ry="20" transform="rotate(-30 110 220)" fill="#1a202c"/>
            <!-- Whiskers -->
            <path d="M130,240 C140,280 120,320 80,340" stroke="#1a202c" stroke-width="8" fill="none" stroke-linecap="round"/>
            <path d="M140,150 C120,110 80,100 60,80" stroke="#1a202c" stroke-width="8" fill="none" stroke-linecap="round"/>
            <!-- Scales -->
            <path d="M220,160 Q240,180 220,200 M240,170 Q260,190 240,210 M200,180 Q220,200 200,220" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  57: `<svg id="svg-57" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Coiled Body -->
            <path class="colorable" d="M170,220 C100,220 100,320 180,340 C260,360 340,320 280,240 C240,180 160,260 220,280 C260,290 280,260 260,240" stroke="#1a202c" stroke-width="40" fill="none" stroke-linecap="round"/>
            <path d="M150,225 C90,240 110,310 180,325 C230,335 290,310 265,260" stroke="#ffffff" stroke-width="20" fill="none" stroke-linecap="round"/>
            <!-- Neck -->
            <path class="colorable" d="M190,140 L190,240 L230,240 L230,140 Z" fill="#ffffff"/>
            <path class="colorable" d="M195,150 L195,240 L215,240 L215,150 Z" fill="#ffffff"/>
            <!-- Head -->
            <ellipse class="colorable" cx="210" cy="110" rx="55" ry="50" fill="#ffffff"/>
            <!-- Snout -->
            <ellipse class="colorable" cx="180" cy="130" rx="30" ry="25" fill="#ffffff"/>
            <!-- Forehead circle -->
            <circle class="colorable" cx="210" cy="75" r="15" fill="#ffffff"/>
            <!-- Side Fins -->
            <path class="colorable" d="M250,110 L310,90 L260,130 Z" fill="#ffffff"/>
            <path class="colorable" d="M170,110 L110,90 L160,130 Z" fill="#ffffff"/>
            <!-- Eyes -->
            <ellipse cx="190" cy="110" rx="10" ry="15" fill="#1a202c"/>
            <ellipse cx="230" cy="110" rx="10" ry="15" fill="#1a202c"/>
            <circle cx="192" cy="105" r="4" fill="#ffffff"/>
            <circle cx="232" cy="105" r="4" fill="#ffffff"/>
        </svg>`,
  58: `<svg id="svg-58" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Leaf -->
            <path class="colorable" d="M200,120 C200,40 280,20 340,60 C300,80 260,140 200,120 Z" fill="#ffffff"/>
            <path d="M200,120 C240,100 280,80 320,60" stroke="#1a202c" stroke-width="4" fill="none"/>
            <!-- Body -->
            <path class="colorable" d="M150,220 C120,300 260,320 250,220 Z" fill="#ffffff"/>
            <!-- Legs -->
            <ellipse class="colorable" cx="140" cy="310" rx="20" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="310" rx="20" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="170" cy="320" rx="20" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="210" cy="320" rx="20" ry="15" fill="#ffffff"/>
            <line x1="140" y1="315" x2="140" y2="325" stroke="#1a202c" stroke-width="3"/>
            <line x1="240" y1="315" x2="240" y2="325" stroke="#1a202c" stroke-width="3"/>
            <!-- Buds -->
            <circle class="colorable" cx="150" cy="210" r="12" fill="#ffffff"/>
            <circle class="colorable" cx="180" cy="220" r="12" fill="#ffffff"/>
            <circle class="colorable" cx="210" cy="220" r="12" fill="#ffffff"/>
            <circle class="colorable" cx="240" cy="210" r="12" fill="#ffffff"/>
            <!-- Head -->
            <ellipse class="colorable" cx="200" cy="150" rx="60" ry="50" fill="#ffffff"/>
            <!-- Eyes -->
            <ellipse class="colorable" cx="170" cy="150" rx="15" ry="20" fill="#ffffff"/>
            <ellipse class="colorable" cx="230" cy="150" rx="15" ry="20" fill="#ffffff"/>
            <ellipse cx="170" cy="150" rx="8" ry="12" fill="#1a202c"/>
            <ellipse cx="230" cy="150" rx="8" ry="12" fill="#1a202c"/>
            <circle cx="172" cy="145" r="4" fill="#ffffff"/>
            <circle cx="232" cy="145" r="4" fill="#ffffff"/>
            <!-- Mouth -->
            <path d="M185,180 Q200,195 215,180" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`,
  59: `<svg id="svg-59" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Fire -->
            <path class="colorable" d="M120,240 L40,160 L140,180 L100,80 L180,140 L220,60 L240,140 Z" fill="#ffffff"/>
            <path class="colorable" d="M140,240 L80,180 L150,190 L120,120 L180,160 L210,90 L220,160 Z" fill="#ffffff"/>
            <!-- Back Body -->
            <path class="colorable" d="M150,220 C120,280 180,340 250,300 C280,280 300,240 280,180 C260,120 200,120 180,180 Z" fill="#ffffff"/>
            <!-- Belly & Snout -->
            <path class="colorable" d="M220,150 L320,150 C360,150 360,190 320,190 L270,190 C280,240 260,300 200,300 C160,300 160,250 180,220 C190,200 200,170 220,150 Z" fill="#ffffff"/>
            <!-- Arms/Legs -->
            <ellipse class="colorable" cx="240" cy="220" rx="10" ry="25" transform="rotate(-30 240 220)" fill="#ffffff"/>
            <ellipse class="colorable" cx="190" cy="310" rx="20" ry="12" fill="#ffffff"/>
            <ellipse class="colorable" cx="250" cy="290" rx="20" ry="12" transform="rotate(-20 250 290)" fill="#ffffff"/>
            <!-- Eyes -->
            <path d="M260,160 L280,170 M300,160 L280,170" stroke="#1a202c" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
  60: `<svg id="svg-60" class="artwork-svg w-full h-full object-contain" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect class="colorable" x="10" y="10" width="380" height="380" fill="#ffffff" rx="16"/>
            <!-- Tail -->
            <path class="colorable" d="M240,280 C320,320 360,300 360,260 C360,220 300,240 260,240" fill="#ffffff"/>
            <polygon class="colorable" points="320,280 340,240 360,270" fill="#ffffff"/>
            <!-- Body -->
            <ellipse class="colorable" cx="200" cy="250" rx="50" ry="60" fill="#ffffff"/>
            <!-- Chest V -->
            <path class="colorable" d="M170,210 L200,260 L230,210 Z" fill="#ffffff"/>
            <!-- Legs -->
            <ellipse class="colorable" cx="160" cy="320" rx="25" ry="15" fill="#ffffff"/>
            <ellipse class="colorable" cx="240" cy="320" rx="25" ry="15" fill="#ffffff"/>
            <line x1="145" y1="320" x2="145" y2="335" stroke="#1a202c" stroke-width="3"/>
            <line x1="160" y1="325" x2="160" y2="335" stroke="#1a202c" stroke-width="3"/>
            <line x1="240" y1="325" x2="240" y2="335" stroke="#1a202c" stroke-width="3"/>
            <line x1="255" y1="320" x2="255" y2="335" stroke="#1a202c" stroke-width="3"/>
            <!-- Arms -->
            <ellipse class="colorable" cx="140" cy="240" rx="15" ry="25" transform="rotate(40 140 240)" fill="#ffffff"/>
            <ellipse class="colorable" cx="260" cy="240" rx="15" ry="25" transform="rotate(-40 260 240)" fill="#ffffff"/>
            <!-- Spikes -->
            <polygon class="colorable" points="200,100 180,60 220,80" fill="#ffffff"/>
            <polygon class="colorable" points="160,120 120,90 170,100" fill="#ffffff"/>
            <polygon class="colorable" points="240,120 280,90 230,100" fill="#ffffff"/>
            <!-- Head -->
            <ellipse class="colorable" cx="200" cy="150" rx="65" ry="55" fill="#ffffff"/>
            <!-- Jaw -->
            <path class="colorable" d="M150,170 C150,220 250,220 250,170 Z" fill="#ffffff"/>
            <polygon points="170,170 175,185 180,170" fill="#ffffff" stroke="#1a202c" stroke-width="2"/>
            <polygon points="220,170 225,185 230,170" fill="#ffffff" stroke="#1a202c" stroke-width="2"/>
            <!-- Eyes -->
            <circle class="colorable" cx="170" cy="130" r="15" fill="#ffffff"/>
            <circle class="colorable" cx="230" cy="130" r="15" fill="#ffffff"/>
            <circle cx="170" cy="130" r="6" fill="#1a202c"/>
            <circle cx="230" cy="130" r="6" fill="#1a202c"/>
            <path d="M150,110 A30,30 0 0,0 150,150" stroke="#1a202c" stroke-width="4" fill="none"/>
            <path d="M250,110 A30,30 0 0,1 250,150" stroke="#1a202c" stroke-width="4" fill="none"/>
        </svg>`,
};

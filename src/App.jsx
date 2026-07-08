import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ColoringApp from './ColoringApp';
import DrawingApp from './DrawingApp';
import GamesApp from './GamesApp';
import AlbumApp from './AlbumApp';
import { Play, CheckCircle, XCircle, Clock, Smartphone, Star, BookOpen, RotateCcw, StopCircle, BarChart, AlertTriangle, UserRound, ShieldCheck, Settings, Save, LogOut, LockKeyhole, Volume2, PencilLine, ChevronDown, ChevronLeft, ChevronRight, Minus, Plus, Brush, Gamepad2, Gem, Home, Camera } from 'lucide-react';

// --- ÂM THANH (Dùng Web Audio API để không cần file ngoài) ---
const SOUND_BASE_VOLUME = 0.23;
const DEFAULT_SOUND_VOLUME_PERCENT = 100;
const MAX_SOUND_VOLUME_PERCENT = 250;
const CORRECT_NEXT_DELAY_MS = 650;

const getSoundGain = (volumePercent = DEFAULT_SOUND_VOLUME_PERCENT) => {
  const parsedPercent = Number(volumePercent);
  const safePercent = Number.isFinite(parsedPercent)
    ? Math.min(Math.max(Math.round(parsedPercent), 0), MAX_SOUND_VOLUME_PERCENT)
    : DEFAULT_SOUND_VOLUME_PERCENT;

  return SOUND_BASE_VOLUME * (safePercent / 100);
};

const playSound = (type, volumePercent) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const soundGain = getSoundGain(volumePercent);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // Đô
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // Mi
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // Sol
      gain.gain.setValueAtTime(soundGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(soundGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {
    console.log("Audio not supported");
  }
};

// --- HẰNG SỐ ---
const MAX_TIME = 90 * 60; // 90 phút (giây)
const MIN_TIME = 0;
const ADMIN_PIN = 'Truonggiang1@';
const SETTINGS_KEY = 'math_settings';
const USER_NAME_KEY = 'math_userName';
const USER_AVATAR_KEY = 'math_userAvatar';
const STAGED_LEARNING_KEY = 'math_stagedLearningEnabled';
const STAGED_PROGRESS_KEY = 'math_stagedProgress';
const STAGED_REMEMBER_TARGET_KEY = 'math_stagedRememberTarget';
const STAGED_STAGES_KEY = 'math_stagedStages';
const SESSION_HISTORY_KEY = 'math_sessionHistory';
const CURRENT_SESSION_STARTED_AT_KEY = 'math_currentSessionStartedAt';
const END_SESSION_GUARD_KEY = 'math_endSessionGuard';
const READING_PROGRESS_KEY = 'reading_progress';
const READING_HISTORY_KEY = 'reading_history';
const ROBUX_BALANCE_KEY = 'math_robuxBalance';
const ROBUX_UNLOCKED_COLORING_KEY = 'coloring_unlockedLevels';
const COLORING_TIME_LEFT_KEY = 'coloring_timeLeftSec';
const DRAWING_TIME_LEFT_KEY = 'drawing_timeLeftSec';
const GAME_TIME_LEFT_KEY = 'game_timeLeftSec';
const MAX_SESSION_HISTORY = 30;
const AVATAR_SIZE = 160;
const DEFAULT_ROBUX_CORRECT_REWARD = 1;
const ROBUX_WRONG_PENALTY = 4;
const DEFAULT_COLORING_TIME_EXCHANGE_COST = 5;
const DEFAULT_DRAWING_TIME_EXCHANGE_COST = 5;
const DEFAULT_GAME_TIME_EXCHANGE_COST = 5;
const COLORING_TIME_EXCHANGE_SECONDS = 60;
const MIN_COLORING_PURCHASE_MINUTES = 1;
const MAX_COLORING_PURCHASE_MINUTES = 180;
const COLORING_PURCHASE_STEP_MINUTES = 10; // mặc định + mỗi lần bấm đổi 10 phút
const DEFAULT_COLORING_PURCHASE_MINUTES = 10;
const MAX_COLORING_TIME_LEFT = 24 * 60 * 60;
const LEARNING_SESSION_WINDOW_MS = 60 * 60 * 1000;
const END_SESSION_WINDOW_MS = 60 * 60 * 1000;
const END_SESSION_FREE_LIMIT = 5;
const END_SESSION_PENALTY_SEC = 5 * 60;
const DEFAULT_COLORING_UNLOCK_COST = 5;
const MIN_ROBUX_REWARD = 1;
const MAX_ROBUX_REWARD = 100;
const MIN_TIME_EXCHANGE_COST = 0;
const MAX_TIME_EXCHANGE_COST = 999;
const MIN_COLORING_UNLOCK_COST = 1;
const MAX_COLORING_UNLOCK_COST = 999;
const COLORING_LEVEL_IDS = [
  ...Array.from({ length: 60 }, (_, index) => index + 1),
  ...Array.from({ length: 3 }, (_, index) => 101 + index),
  ...Array.from({ length: 23 }, (_, index) => 201 + index),
  ...Array.from({ length: 51 }, (_, index) => 301 + index),
];
const ACCEPTED_AVATAR_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALL_ADDITION_TABLES = Array.from({ length: 10 }, (_, index) => index + 1);
const LESSON_TYPES = [
  { id: 'add', label: 'Cộng', tableLabel: 'Bảng cộng' },
  { id: 'subtract', label: 'Trừ', tableLabel: 'Bảng trừ' },
  { id: 'multiply', label: 'Nhân', tableLabel: 'Bảng nhân' },
  { id: 'divide', label: 'Chia', tableLabel: 'Bảng chia' },
  { id: 'custom', label: 'Tự nhập câu hỏi', tableLabel: 'Câu hỏi tự nhập' },
];
const LESSON_TYPE_IDS = new Set(LESSON_TYPES.map(type => type.id));
const DEFAULT_LESSON_TYPE = 'add';
const LEARNING_MODES = [
  { id: 'quiz', label: 'Học trắc nghiệm' },
  { id: 'flashcard', label: 'Học bằng Flashcard' },
];
const LEARNING_MODE_IDS = new Set(LEARNING_MODES.map(mode => mode.id));
const DEFAULT_LEARNING_MODE = 'quiz';
const DEFAULT_SETTINGS = {
  timeLimit: 9,
  rewardSec: 30,
  penaltySec: 60,
  robuxReward: DEFAULT_ROBUX_CORRECT_REWARD,
  coloringUnlockCost: DEFAULT_COLORING_UNLOCK_COST,
  coloringTimeExchangeCost: DEFAULT_COLORING_TIME_EXCHANGE_COST,
  drawingTimeExchangeCost: DEFAULT_DRAWING_TIME_EXCHANGE_COST,
  gameTimeExchangeCost: DEFAULT_GAME_TIME_EXCHANGE_COST,
  soundVolumePercent: DEFAULT_SOUND_VOLUME_PERCENT,
  learningMode: DEFAULT_LEARNING_MODE,
  lessonType: DEFAULT_LESSON_TYPE,
  lessonTypes: [DEFAULT_LESSON_TYPE],
  customQuestionsText: '',
  selectedTables: ALL_ADDITION_TABLES,
};
const DEFAULT_STAGED_STAGE_GROUPS = [
  { id: 'stage-1', name: 'Chặng 1', bValues: [0, 1, 2, 3] },
  { id: 'stage-2', name: 'Chặng 2', bValues: [4, 5, 6] },
  { id: 'stage-3', name: 'Chặng 3', bValues: [7, 8, 9] },
];
const STAGED_RANDOM_LABEL = 'Random';
const DEFAULT_STAGED_REMEMBER_TARGET = 8;
const MIN_STAGED_REMEMBER_TARGET = 1;
const MAX_STAGED_REMEMBER_TARGET = 20;
const MAX_STAGED_STAGE_NAME_LENGTH = 24;
const STAGED_RECENT_LIMIT = 3;
const READING_LESSONS = [
  {
    id: "mr-saiyan-tap-1",
    title: "Tập 1: Cậu Bé Mang Dòng Máu Saiyan",
    subtitle: "Cậu Bé Mang Dòng Máu Saiyan",
    shortTitle: "Tập 1",
    lines: [
      "Tập 1: Cậu Bé Mang Dòng Máu Saiyan",
      "Siro sống cùng mẹ Phương, bố Giang và em gái Simi trong một ngôi nhà nhỏ có giàn hoa giấy trước sân. Buổi sáng nào, Siro cũng chạy vèo vèo ra cổng, đeo cặp màu xanh, rồi gọi bạn bè:",
      "“Bun ơi! Phúc Hưng ơi! Đi học thôi!”",
      "Bun thông minh, lúc nào cũng mang theo kính lúp. Phúc Hưng khỏe và vui tính. Bơ, Kem, Mimi, Gạo và Minh Trí thường chạy theo sau, cười ríu rít.",
      "Siro là một cậu bé đặc biệt. Cậu có chiếc đuôi nâu mềm, thường được quấn gọn trong thắt lưng. Bố Giang nói:",
      "“Gia đình mình là người Saiyan sống ở Trái Đất. Sức mạnh không phải để làm người khác sợ. Sức mạnh là để bảo vệ.”",
      "Siro gật đầu, nhưng thật ra cậu vẫn chưa hiểu hết. Cậu chỉ biết mình chạy nhanh hơn bạn một chút, nhảy cao hơn bạn một chút, và đôi khi làm quả bóng bay xa tới mức... mất hút sau mái nhà.",
      "Chiều hôm ấy, cả nhóm chơi ở sân ven sông. Gió thổi ào ào. Nước lấp lánh. Bỗng từ chiếc xe thí nghiệm gần đó vang lên tiếng:",
      "Choang! Rầm! Bíp bíp bíp!",
      "Cánh cửa xe bật tung. Một con rô-bốt đen cao lớn bước ra. Mắt nó đỏ lừ. Hai tay kêu lạch cạch. Trên ngực nó có ký hiệu hình hạt giống đen.",
      "“Ta là Rô-bốt Đen. Ta cần năng lượng của sân chơi này!” nó nói bằng giọng rè rè.",
      { type: 'image', src: "/reading/mr-saiyan/tap-01-hinh-01.webp", alt: "Rô-bốt Đen xuất hiện." },
      "Những chiếc đèn đường vụt tắt. Xích đu ngừng đung đưa. Quả bóng của Gạo bị hút lên không trung, xoay vù vù.",
      "Simi đang ngồi vẽ bên gốc cây. Cô bé ôm quyển vở, sợ đến mắt tròn xoe.",
      "Siro chạy tới chắn trước em.",
      "“Không được làm hại Simi! Không được làm hại bạn của tôi!”",
      "Trong ngực Siro nóng rực. Một luồng sáng vàng nhạt lóe lên quanh người cậu.",
      { type: 'image', src: "/reading/mr-saiyan/tap-01-hinh-02.webp", alt: "Siro đối mặt với Rô-bốt Đen." },
      "Siro hạ thấp người. Chân trái bước lên trước. Hai nắm tay siết chặt. Ánh mắt cậu từ bối rối chuyển thành kiên định.",
      "Rô-bốt Đen giơ tay phải. Một tia điện tím phụt ra xẹt xẹt.",
      { type: 'image', src: "/reading/mr-saiyan/tap-01-hinh-03.webp", alt: "Trận chiến giữa Siro và Rô-bốt Đen." },
      "Siro lao đi vút! Cậu nghiêng người sang trái, tia điện sượt qua vai làm áo cậu bay phấp phới. Cậu đặt chân lên thành cầu trượt, bật mạnh, xoay người trên không rồi tung Cước Gió Xoáy.",
      "Vù vù!",
      "Luồng gió tròn đánh vào tay rô-bốt. Kim loại rung lên coong coong, nhưng Rô-bốt Đen chỉ lùi một bước.",
      "“Sức yếu quá,” nó rè rè.",
      "Nó đấm xuống đất. Ầm! Mặt sân nứt rạn. Đá vụn bay lạo xạo. Siro bị hất văng, lăn hai vòng trên cỏ.",
      "Bun hét lên: “Siro, nó hút năng lượng ở viên đá trên ngực!”",
      "Minh Trí nhặt chiếc gương nhỏ trong hộp thí nghiệm bị rơi, ném cho Siro. “Phản chiếu ánh sáng đi!”",
      "Rô-bốt Đen không để Siro kịp thở. Nó xoay người, quật cánh tay kim loại vào vai cậu một cú nặng như búa. Rầm! Siro lăn qua bãi cỏ, miệng đầy bụi, tai ù đi. Cậu cố chống tay dậy nhưng đầu gối run lẩy bẩy. Một tia điện tím lại phóng tới, nổ ngay trước mặt làm cậu bị hất ngược. Trong một khoảnh khắc, mắt Siro tối sầm. Cậu nghe tiếng Simi gọi xa xa như vọng qua một bức tường dày.",
      "Khi tiếng gọi của Simi chạm vào tim, hơi thở Siro đổi khác. Ban đầu chỉ là một đốm vàng nhỏ ở ngực, rồi lan ra vai, xuống hai cánh tay và quấn quanh nắm đấm. Tóc đen của cậu dựng lên từng lọn, không đổi màu nhưng sáng viền vàng ở mép tóc. Đôi mắt đang hoảng sợ trở nên trong và chắc. Đây chưa phải Super Saiyan; nó là sức mạnh Saiyan đầu tiên, thô sơ, ấm nóng, bừng lên từ ý muốn che chở.",
      { type: 'image', src: "/reading/mr-saiyan/tap-01-hinh-04.webp", alt: "Siro thức tỉnh Sức Mạnh Saiyan Thức Tỉnh." },
      "Siro nhận ra mình nghe tiếng bánh răng của Rô-bốt Đen rõ hơn, thấy đường điện tím bay chậm hơn một chút. Cậu lách vai né tia điện, chân phải đạp mạnh xuống đất, rồi lao tới theo đường thấp. Tay trái giữ chiếc gương, tay phải kéo ánh sáng vào nắm đấm. Cú Đấm Sấm Sét không chỉ mạnh hơn, mà còn chính xác hơn: nó đánh trúng đúng viên đá đen, làm nguồn sức của rô-bốt vỡ tan trong tiếng choang sáng rực.",
      "Sức mạnh Saiyan đầu tiên khác với Siro bình thường ở từng chi tiết nhỏ. Hào quang chỉ là lớp vàng mỏng quanh da, tóc đen dựng nhẹ, mắt sáng hơn, cơ thể còn đau nhưng khí tức đã ấm và chắc. Trong lòng Siro vẫn sợ, nhưng nỗi sợ ấy được cậu nắm lại như nắm một viên đá nhỏ trong tay. Tốc độ mới giúp cậu nhìn thấy khe hở giữa hai tia điện; sức mạnh mới giúp cú đấm không văng loạn mà đi đúng hướng. Rô-bốt Đen tăng vòng quay, hai tay xoay vù vù, định đập Siro xuống lần nữa. Siro bước chéo sang trái, cúi thấp người, dùng Cước Gió Xoáy hất bụi che cảm biến, rồi bật lên bằng chân phải. Cú Đấm Sấm Sét đánh thẳng vào viên đá đen. Ánh vàng nổ bùm trong lồng ngực máy, các khớp sắt rơi leng keng, và Rô-bốt Đen gục xuống, mất hết năng lượng xấu.",
      "Bố Giang đến nơi, đặt tay lên vai Siro.",
      { type: 'image', src: "/reading/mr-saiyan/tap-01-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "“Con đã làm đúng. Con không đánh để khoe. Con đánh để bảo vệ.”",
      "Mẹ Phương ôm Simi. Simi chạy tới ôm chầm lấy anh trai.",
      "“Anh Siro là người hùng của em!”",
      "Siro đỏ mặt. Cậu nhìn mảnh bụi đen còn lấp lánh trên cỏ. Nó tan đi, nhưng để lại một vệt sáng tối rất nhỏ bay lên trời.",
      "Ở một nơi xa, có giọng nói thì thầm:",
      "“Một mảnh hạt đã tỉnh. Cậu bé Saiyan cũng đã tỉnh.”",
    ],
  },
  {
    id: "mr-saiyan-tap-2",
    title: "Tập 2: Đêm Trăng Rằm Và Khỉ Đột Khổng Lồ",
    subtitle: "Đêm Trăng Rằm Và Khỉ Đột Khổng Lồ",
    shortTitle: "Tập 2",
    lines: [
      "Tập 2: Đêm Trăng Rằm Và Khỉ Đột Khổng Lồ",
      "Sau chuyện Rô-bốt Đen, Siro luyện tập với bố Giang mỗi sáng. Bố dạy cậu hít thở.",
      "“Hít vào như gió mát. Thở ra như mây trôi.”",
      "Siro làm theo, nhưng thỉnh thoảng vẫn nóng vội. Khi đá vào bao cát, cậu hay dùng quá nhiều sức làm bao cát bay bụp vào hàng rào.",
      "Một tối trăng rằm, cả xóm tổ chức hội đèn bên bờ sông. Simi cầm lồng đèn hình ngôi sao. Bun mang kính thiên văn. Kem và Bơ phát bánh. Mimi hát líu lo.",
      "Trăng tròn vàng óng treo trên trời. Ánh trăng rơi xuống mặt sông lấp lánh.",
      "Siro nhìn trăng, bỗng thấy tim đập thình thịch. Chiếc đuôi sau lưng cậu giật nhẹ.",
      "Bố Giang lập tức đặt tay che mắt Siro.",
      "“Đừng nhìn lâu, con.”",
      "Nhưng trên ngọn đồi xa, một bóng người cười khẩy. Hắn là Ra-đít, kẻ săn năng lượng hoang dã. Hắn giơ chiếc máy chiếu trăng giả lên.",
      { type: 'image', src: "/reading/mr-saiyan/tap-02-hinh-01.webp", alt: "Ra-đít xuất hiện." },
      "Vùm!",
      "Một vầng trăng thứ hai hiện ra, to hơn, tím hơn, lạnh hơn.",
      "Ánh sáng tím chiếu thẳng vào Siro.",
      "Người Siro nóng bừng. Cánh tay phồng lên. Bàn chân lớn dần. Tiếng gầm thoát ra khỏi cổ họng:",
      "GRAOOO!",
      "Siro biến thành Khỉ Đột Khổng Lồ.",
      "Mặt đất rung ầm ầm dưới mỗi bước chân. Cây cối nghiêng ngả. Mọi người chạy tán loạn.",
      "Simi đứng sững, nước mắt long lanh.",
      "“Anh Siro... anh có nghe em không?”",
      { type: 'image', src: "/reading/mr-saiyan/tap-02-hinh-02.webp", alt: "Siro đối mặt với Ra-đít." },
      "Ra-đít bay xuống, cười to.",
      "“Tốt lắm! Hãy phá đi! Ta sẽ thu năng lượng hỗn loạn của ngươi!”",
      { type: 'image', src: "/reading/mr-saiyan/tap-02-hinh-03.webp", alt: "Trận chiến giữa Siro và Ra-đít." },
      "Siro khổng lồ gầm vang. Cậu vung tay trái. Gió quét ào ào, thổi tung những chiếc lồng đèn lên cao. Ra-đít né sang phải, để lại vệt tím loang loáng.",
      "Bố Giang lao tới bằng tốc độ cực nhanh. Ông nhảy lên vai Siro, gọi lớn:",
      "“Siro! Nhớ hơi thở!”",
      "Siro khổng lồ lắc mạnh. Bố Giang bị hất văng, nhưng ông xoay người đáp xuống cột đèn, không bị thương.",
      "Ra-đít tung Chùm Dây Tím, những vòng năng lượng quấn quanh cổ tay khổng lồ của Siro. Siro giật mạnh. Rầm rầm! Đất nứt từng đường dài.",
      "Siro mất kiểm soát. Cậu giơ chân sắp giẫm vào khu bán bánh nơi mẹ Phương đang giúp trẻ nhỏ chạy ra.",
      "Simi hét lên:",
      "“Anh Siro đã hứa đưa em về nhà mà!”",
      "Trong đôi mắt đỏ của Khỉ Đột, một chấm sáng nhỏ hiện ra.",
      "Siro khựng lại. Bàn chân khổng lồ dừng cách mái lều chỉ một chút. Gió thổi phành phạch.",
      "Mẹ Phương ôm Simi, nói thật to:",
      "“Siro ơi, con không phải cơn giận. Con là người bảo vệ!”",
      "Trong dạng Khỉ Đột Khổng Lồ, Siro bị chính sức mạnh của mình kéo đi. Ra-đít quăng xích tím liên tục, siết vào cổ tay và cổ chân khổng lồ của cậu. Mỗi lần Siro giật ra, dây xích lại nổ xẹt xẹt, làm cậu gầm đau đớn. Cậu va lưng vào sườn đồi, đất đá đổ xuống rào rào. Có lúc đôi mắt đỏ của cậu mờ đi, thân hình khổng lồ quỳ sụp, như một ngọn núi sắp đổ.",
      "Ánh trăng giả tiếp tục ép bản năng hoang dã dâng lên, nhưng tiếng Simi làm một phần Siro thức dậy bên trong. Hơi thở khổng lồ đang gấp gáp bỗng chậm lại: phà... phà... Lông nâu trên vai cậu bớt xù dựng. Đôi mắt đỏ còn dữ nhưng ở giữa có một chấm sáng hiền. Khác với lúc mới biến hình, Siro bắt đầu điều khiển được hướng nhìn, bàn tay và bước chân.",
      { type: 'image', src: "/reading/mr-saiyan/tap-02-hinh-04.webp", alt: "Siro thức tỉnh Khỉ Đột Khổng Lồ." },
      "Siro không còn quét tay lung tung. Cậu nhắm mắt để tránh mặt trăng giả, dùng tai nghe tiếng máy chiếu rè rè trên đồi. Khi Ra-đít lao tới từ bên phải, Khỉ Đột Siro xoay thân chậm mà chắc, dùng đuôi tạo vòng bụi che mắt hắn. Bàn Tay Núi Đá được tung ra như một quyết định tỉnh táo: tảng đá bay thẳng vào máy chiếu, phá nguồn trăng giả và cắt đứt âm mưu của Ra-đít.",
      "Oozaru không chỉ làm Siro to hơn; nó làm mọi cảm giác trong cậu lớn gấp nhiều lần. Hào quang không sáng thành lửa mà nén thành sức nặng quanh thân khổng lồ. Mái tóc đen của cậu như biến vào bờm lông nâu xù lên sau gáy, mắt đỏ rực, cơ thể cao như ngọn đồi, khí tức phả ra phà phà làm cỏ rạp xuống. So với sức mạnh Saiyan đầu tiên, hình thái này mạnh hơn dữ dội nhưng khó nghe lời trái tim hơn; khả năng mới của nó là sức bật, sức nắm và tiếng gầm làm rung cả mặt đất. Khi Siro giữ được một tia bình tĩnh, tốc độ của thân hình lớn trở nên chắc chắn: một bước đã chặn được cả sườn đồi, một cái vung tay tạo gió ầm ầm. Ra-đít tưởng cậu vẫn mất trí nên phóng xích vào mắt. Siro nghiêng đầu né, quấn xích vào cổ tay, kéo giật ngược rồi dùng Bàn Tay Núi Đá ném tảng đá vào máy trăng giả. Ánh trăng đen tắt phụt, xích tím rã ra, Ra-đít ngã lăn và phải bỏ chạy trong đám bụi.",
      "Siro tỉnh dậy trên ghế dài. Mẹ Phương lau trán cho cậu. Bố Giang ngồi cạnh, nghiêm mà hiền.",
      { type: 'image', src: "/reading/mr-saiyan/tap-02-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "“Con đã suýt mất kiểm soát,” bố nói. “Nhưng con cũng đã tự kéo mình trở lại.”",
      "Siro cúi đầu. “Con xin lỗi. Con sợ chính mình.”",
      "Simi đặt chiếc lồng đèn ngôi sao vào tay anh.",
      "“Em không sợ anh. Vì anh đã dừng lại.”",
      "Siro ôm em, lòng ấm lên. Trên ngọn đồi, mảnh máy chiếu vỡ lóe ra một chấm đen nhỏ rồi bay mất.",
    ],
  },
  {
    id: "mr-saiyan-tap-3",
    title: "Tập 3: Hào Quang Vàng Chưa Hoàn Chỉnh",
    subtitle: "Hào Quang Vàng Chưa Hoàn Chỉnh",
    shortTitle: "Tập 3",
    lines: [
      "Tập 3: Hào Quang Vàng Chưa Hoàn Chỉnh",
      "Siro muốn mạnh hơn thật nhanh. Sau đêm trăng rằm, cậu sợ mình lại làm ai đó bị thương. Vì vậy sáng nào cậu cũng chạy quanh đồi, chống đẩy, nhảy cao và đấm vào bao cát.",
      "“Nhanh nữa! Mạnh nữa!” Siro tự nhủ.",
      "Bố Giang lắc đầu. “Nhanh không phải lúc nào cũng tốt. Con cần chắc.”",
      "Siro nghe, nhưng trong lòng vẫn nóng như lửa.",
      "Một hôm, trường tổ chức chuyến tham quan rừng tre. Bun mang sổ ghi chép. Mimi vẽ những thân tre xanh. Gạo đem cơm nắm. Cả nhóm cười nói rộn ràng.",
      "Bỗng mặt đất rung rầm rầm.",
      "Một chiến binh khổng lồ rơi từ trời xuống. Ầm! Bụi tung mù mịt. Hắn là Na-pa, kẻ thích thử sức với người mạnh.",
      { type: 'image', src: "/reading/mr-saiyan/tap-03-hinh-01.webp", alt: "Na-pa xuất hiện." },
      "“Ta nghe nói Trái Đất có cậu bé Saiyan. Ra đây!”",
      "Cô giáo đưa các bạn lùi lại. Siro bước lên, tay nắm chặt.",
      "“Tôi ở đây. Nhưng không được làm hại trường của tôi!”",
      "Na-pa cười lớn. “Vậy hãy chứng minh đi!”",
      "Hắn giậm chân. Từng cột đất bật lên rào rào, lao về phía nhóm bạn.",
      "Siro phóng tới, hai tay dang ra. Hào quang vàng nhạt lại bùng lên, nhưng lần này mạnh hơn, nóng hơn. Tóc đen của cậu dựng cao, mắt sáng trắng trong chớp mắt.",
      "Bun reo lên: “Siro, cậu phát sáng kìa!”",
      "Siro không kịp vui. Na-pa đã lao đến.",
      { type: 'image', src: "/reading/mr-saiyan/tap-03-hinh-02.webp", alt: "Siro đối mặt với Na-pa." },
      "Siro đứng chân phải trước, chân trái sau, vai hơi nghiêng. Hai nắm tay đặt ngang hông. Hào quang vàng bùng lên phừng phực, nhưng rung lắc như ngọn nến trong gió.",
      "Na-pa đấm thẳng bằng tay phải. Nắm đấm to như tảng đá.",
      { type: 'image', src: "/reading/mr-saiyan/tap-03-hinh-03.webp", alt: "Trận chiến giữa Siro và Na-pa." },
      "Siro nghiêng đầu né trong gang tấc. Gió từ cú đấm thổi tóc cậu bay vù. Cậu xoay người, dùng cùi chỏ trái chặn tay Na-pa, rồi đá móc chân phải vào sườn hắn.",
      "Bốp!",
      "Na-pa chỉ nhếch mép. Hắn túm lấy chân Siro, xoay một vòng rồi ném cậu vào bụi tre.",
      "Rầm! Lạo xạo!",
      "Thân tre rung lên. Lá rơi như mưa.",
      "Siro bật dậy, tức giận. “Tôi sẽ thắng ngay!”",
      "Cậu gồng mạnh. Hào quang vàng phồng lớn. Mắt cậu mất tròng đen. Siro lao đi vun vút, để lại vệt sáng vàng đỏ phía sau.",
      "“Chưởng Sao Băng!”",
      "Cậu bắn hàng chục quả cầu sáng từ hai tay. Chúng bay vèo vèo về phía Na-pa.",
      "Na-pa khoanh tay, chịu đòn. Bùm! Bùm! Bùm! Khói phủ kín. Khi khói tan, hắn vẫn đứng đó, chỉ có vài vết xước.",
      "“Mạnh đấy. Nhưng rối quá.”",
      "Na-pa bất ngờ biến mất. Hắn xuất hiện sau lưng Siro, đập hai tay xuống.",
      "ẦM!",
      "Siro rơi xuống đất, tạo một hố nhỏ. Hào quang vàng tắt phụt. Cậu thở dốc, người đau nhức.",
      "Phúc Hưng hét: “Siro, đừng chỉ đánh mạnh! Nhìn chân hắn!”",
      "Siro ngước lên. Cậu thấy mỗi lần Na-pa lao tới, chân trái hắn giẫm sâu hơn. Đó là hướng hắn lấy đà.",
      "Na-pa giơ tay, gom năng lượng xanh lục. “Một đòn nữa là xong.”",
      "Cột sáng xanh phóng tới xẹt xẹt.",
      "Na-pa đánh Siro tơi bời bằng những cú đấm nặng và đều. Cú đầu tiên làm cậu bay vào bụi tre. Cú thứ hai quật cậu xuống hố đất. Cú thứ ba đập vào vai khiến cả cánh tay phải tê rần. Siro cố bùng hào quang lớn hơn, nhưng càng gồng, hơi thở càng rối. Ánh vàng quanh người cậu nhấp nháy như ngọn đèn sắp tắt. Cậu nằm dưới hố, mắt hoa lên, nghe lá tre rơi lạo xạo trên mặt.",
      "Siro không thức tỉnh bằng cách gào to hơn. Cậu thức tỉnh khi biết thu sức lại. Hào quang vàng đỏ đang phồng loạn dần co vào sát cơ thể. Tóc đen dựng cao hơn, vài ngọn tóc ánh đỏ như than hồng. Tròng mắt sáng trắng, khiến cậu nhìn thấy dấu chân trái của Na-pa in sâu trên đất. Siêu Saiyan Giả Định khác sức mạnh đầu tiên ở chỗ mạnh hơn nhiều, nhưng chưa ổn định; nếu nóng vội, nó sẽ kéo cậu đi như cơn gió xoáy.",
      { type: 'image', src: "/reading/mr-saiyan/tap-03-hinh-04.webp", alt: "Siro thức tỉnh Siêu Saiyan Giả Định." },
      "Sau khi bình tĩnh, tốc độ của Siro không còn lao bừa. Cậu chờ đúng lúc chân trái Na-pa giẫm xuống, trượt người sát mặt đất rồi quét chân. Na-pa mất thăng bằng trong một nhịp rất nhỏ, nhưng với hình thái mới, một nhịp ấy đủ dài. Siro bật lên, nắm tay phải sáng rực, dùng Cú Đấm Sấm Sét đánh vào giữa áo giáp. Đòn đánh không phá hủy rừng tre; nó chỉ đẩy Na-pa ra khỏi vòng nguy hiểm và làm hắn phải công nhận Siro đã biết suy nghĩ khi chiến đấu.",
      "Siêu Saiyan Giả Định bùng lên theo từng nhịp thở ngắn. Đầu tiên hào quang vàng đỏ rung quanh vai. Rồi tóc đen dựng cao, vài sợi cháy viền đỏ, đôi mắt trắng sáng khiến thế giới như chậm lại. Cơ thể Siro nóng rực, khí tức phập phồng chưa đều, khác với Oozaru nặng nề và khác với sức mạnh đầu tiên còn nhỏ bé: trạng thái này nhanh, sắc và khó giữ bình tĩnh hơn. Trong lòng Siro vẫn muốn lao vào ngay, nhưng cậu nhớ lời bố Giang: người bảo vệ phải biết chờ đúng lúc. Na-pa gầm lên, tung ba cú đấm liên tiếp như búa sắt. Siro dùng bước thấp né cú thứ nhất, xoay vai tránh cú thứ hai, lấy khuỷu tay chặn cú thứ ba rồi phản công bằng Cước Gió Xoáy. Khi Na-pa loạng choạng, Siro dồn ánh vàng vào tay phải, tung Cú Đấm Sấm Sét vào giáp ngực. Giáp nứt choang, Na-pa bị đẩy khỏi rừng tre và thua vì không bắt kịp một Siro đã biết nghĩ.",
      "Trên đường về, Siro đi chậm bên bố Giang.",
      { type: 'image', src: "/reading/mr-saiyan/tap-03-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "“Con tưởng càng gồng mạnh càng tốt,” Siro nói.",
      "Bố mỉm cười. “Gồng mạnh mà không nghĩ thì giống chạy trong sương mù. Con đã học cách nhìn.”",
      "Mimi đưa Siro bức tranh rừng tre. Trong tranh, Siro không đứng to nhất. Cậu đứng trước các bạn, hai tay bảo vệ mọi người.",
      "Siro cười. “Bức tranh này đẹp hơn thắng trận.”",
    ],
  },
  {
    id: "mr-saiyan-tap-4",
    title: "Tập 4: Giới Vương Quyền Đỏ Rực",
    subtitle: "Giới Vương Quyền Đỏ Rực",
    shortTitle: "Tập 4",
    lines: [
      "Tập 4: Giới Vương Quyền Đỏ Rực",
      "Một mảnh sao băng rơi xuống ngoại ô thành phố. Nó không nằm yên như đá thường. Nó nhúc nhích, rung rung, rồi mọc ra hai cánh tay bằng đá cháy.",
      "Rắc! Rầm!",
      "Quái Vật Sao Băng thức dậy. Trên ngực nó cắm một mảnh hạt đen, khiến lửa của nó chuyển màu đỏ sẫm.",
      { type: 'image', src: "/reading/mr-saiyan/tap-04-hinh-01.webp", alt: "Quái Vật Sao Băng xuất hiện." },
      "Bố Giang đưa Siro đến vùng cánh đồng vắng.",
      "“Con cần học một kỹ thuật nguy hiểm,” bố nói. “Tên là Kaioken - Giới Vương Quyền. Nó làm sức mạnh tăng vọt, nhưng cơ thể sẽ rất mệt. Chỉ dùng khi thật cần.”",
      "Siro nhìn con quái vật đang tiến về phía trạm điện. Nếu trạm điện nổ, cả thành phố sẽ chìm trong bóng tối.",
      "“Con hiểu. Con sẽ cẩn thận.”",
      "Bố đặt tay lên vai cậu. “Cẩn thận không phải là sợ. Cẩn thận là biết mình đang làm gì.”",
      "Quái Vật Sao Băng gầm lên. Lửa bắn phụt phụt. Mặt đất cháy thành từng vệt đỏ.",
      "Siro bước ra. “Dừng lại!”",
      "Con quái vật không nghe. Nó vung tay đá lửa xuống.",
      "ẦM!",
      { type: 'image', src: "/reading/mr-saiyan/tap-04-hinh-02.webp", alt: "Siro đối mặt với Quái Vật Sao Băng." },
      "Siro đứng thẳng, hai chân tách rộng bằng vai. Cậu đặt hai nắm tay sát hông, hít một hơi dài. Hào quang đỏ mỏng bao quanh cậu như dải lụa lửa.",
      "“Kaioken!”",
      { type: 'image', src: "/reading/mr-saiyan/tap-04-hinh-03.webp", alt: "Trận chiến giữa Siro và Quái Vật Sao Băng." },
      "Ánh đỏ bùng lên nóng rực. Siro lao đi nhanh hơn trước rất nhiều. Cậu lướt sát mặt đất, để lại vệt đỏ vun vút. Cánh tay phải của quái vật đập xuống, Siro nghiêng người né, trượt qua khe giữa hai tảng đá lửa.",
      "Cậu bật lên, đầu gối phải thúc vào cằm quái vật.",
      "Bốp!",
      "Đá lửa vỡ lạo xạo. Quái vật lùi lại. Siro xoay người trên không, đá thêm một cú bằng chân trái.",
      "“Cước Gió Xoáy Đỏ!”",
      "Luồng gió đỏ xoáy vù vù, thổi tắt một mảng lửa trên vai quái vật.",
      "Nhưng Kaioken làm tim Siro đập quá nhanh. Cậu đáp xuống, thở hổn hển.",
      "Bố Giang gọi: “Đủ rồi! Giảm sức!”",
      "Siro nhìn trạm điện phía xa. Quái vật đang chuẩn bị phóng lửa vào đó. Cậu cắn răng.",
      "“Con phải nhanh hơn!”",
      "“Kaioken nhân hai!”",
      "Hào quang đỏ dày lên. Không khí quanh Siro rung ù ù. Cậu phóng đi, chặn trước trạm điện và giơ hai tay.",
      "Quái Vật Sao Băng bắn Cầu Lửa Đen.",
      "Siro tạo Khiên Ánh Sáng Saiyan. Tấm khiên vàng đỏ hiện ra trước mặt cậu. Cầu lửa va vào khiên:",
      "BÙM! ẦM ẦM!",
      "Sức ép đẩy Siro trượt lùi, hai chân cày thành rãnh dài trên đất. Cánh tay cậu run bần bật. Hào quang đỏ bắt đầu chập chờn.",
      "“Mệt quá...” Siro thì thầm.",
      "Cầu lửa nứt khiên. Từng vệt sáng đen bò lan xẹt xẹt.",
      "Quái Vật Sao Băng ép Siro lùi từng bước. Lửa đen quất vào khiên, làm cánh tay cậu nóng rát. Kaioken khiến tim cậu đập thình thịch quá nhanh, cổ họng khô, chân nặng như đeo đá. Khi Cầu Lửa Đen nổ vào Khiên Ánh Sáng, Siro bị đẩy trượt dài, hai gót chân cày đất thành rãnh. Cậu khuỵu xuống, mắt tối đi vài nhịp, tưởng như chỉ cần thêm một cú nữa là ngất hẳn.",
      "Kaioken không đổi màu tóc, nhưng đổi toàn bộ cảm giác trong cơ thể Siro. Hào quang đỏ quấn quanh da như lửa, từng nhịp thở nóng lên, từng cơ bắp căng ra rồi đau nhói. Khác với hào quang vàng còn bản năng, Kaioken là sức mạnh vay mượn trong thời gian ngắn: nhanh hơn, mạnh hơn, nhưng cái giá là mệt khủng khiếp. Khi Siro học cách hạ bớt ngọn lửa đỏ, cậu mới thật sự bắt đầu làm chủ nó.",
      { type: 'image', src: "/reading/mr-saiyan/tap-04-hinh-04.webp", alt: "Siro thức tỉnh Kaioken." },
      "Siro không thắng bằng cách đốt Kaioken mãi. Cậu nghiêng Khiên Ánh Sáng sang trái, biến lực đẩy thẳng thành đường trượt. Cầu Lửa Đen bị kéo lệch lên trời và nổ xa thành phố. Khi quái vật mở ngực để bắn đòn cuối, Siro bật Kaioken đúng một nhịp, lao sát đất như tia đỏ, tránh cánh tay đá bằng cách nghiêng vai, rồi tung Cú Đấm Sấm Sét Đỏ vào mảnh hạt đen. Đó là chiến thắng của thời điểm, không phải của sức mạnh liều lĩnh.",
      "Kaioken biến hình theo cách rất khác: tóc không đổi màu, mắt không đổi màu, nhưng từng mạch sáng đỏ chạy dưới da như dòng lửa. Hào quang đỏ ban đầu phồng lớn, sau đó Siro ép nó bám sát cơ thể để không lãng phí. Cơ bắp căng lên, hơi thở nóng, khí tức đỏ rực và gấp gáp. So với Siêu Saiyan Giả Định, Kaioken không hoang dã bằng, nhưng nó đòi hỏi kỷ luật hơn vì mỗi giây đều làm cơ thể mệt thêm. Khi Quái Vật Sao Băng bổ Cầu Lửa Đen xuống, Siro không đỡ thẳng. Cậu dùng tốc độ đỏ lao nghiêng qua mép lửa, đặt Khiên Ánh Sáng Saiyan lệch góc để đòn trượt lên trời, rồi bật Kaioken trong đúng một nhịp. Cú Đấm Sấm Sét Đỏ đi từ thấp lên cao, đánh vào mảnh hạt đen giữa ngực quái vật. Lửa đen phụt tắt, thân đá nứt rắc rắc, và quái vật tan thành bụi sao an toàn.",
      "Bố Giang cõng Siro về nhà. Cậu mệt đến mức mắt díp lại.",
      { type: 'image', src: "/reading/mr-saiyan/tap-04-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "“Con có làm sai không bố?” Siro hỏi.",
      "“Con có suýt lạm dụng sức mạnh,” bố nói. “Nhưng con đã biết dừng và biết đổi cách. Đó là trưởng thành.”",
      "Simi đặt lên bàn một cốc nước cam.",
      "“Anh hùng cũng phải uống nước cam nha!”",
      "Siro bật cười. Ngoài cửa sổ, một vệt đen nhỏ bay qua bầu trời đêm, hướng về phương Bắc lạnh giá.",
    ],
  },
  {
    id: "mr-saiyan-tap-5",
    title: "Tập 5: Phi Za Từ Hành Tinh Lạnh",
    subtitle: "Phi Za Từ Hành Tinh Lạnh",
    shortTitle: "Tập 5",
    lines: [
      "Tập 5: Phi Za Từ Hành Tinh Lạnh",
      "Một buổi sáng, bầu trời thành phố bỗng tối lại. Không phải vì mưa. Một chiếc phi thuyền khổng lồ lơ lửng trên mây, tỏa ra hơi lạnh trắng xóa.",
      "Trên màn hình lớn ở quảng trường, một gương mặt lạ hiện lên. Da hắn trắng tím, mắt sắc như dao băng.",
      "“Ta là Phi Za của Hành Tinh Lạnh. Trái Đất sẽ trở thành viên ngọc băng trong bộ sưu tập của ta.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-05-hinh-01.webp", alt: "Phi Za xuất hiện." },
      "Từ phi thuyền, những quả cầu băng rơi xuống ào ào. Đường phố đóng băng. Công viên phủ tuyết. Dòng sông kêu rắc rắc khi mặt nước đông cứng.",
      "Simi ôm chặt mẹ Phương. “Mẹ ơi, lạnh quá.”",
      "Mẹ Phương khoác áo cho con. “Siro sẽ đến. Nhưng chúng ta cũng phải giúp nhau.”",
      "Trong sân sau, Siro đang luyện Kaioken thì nghe còi báo động. Cậu phóng ra, nhìn thành phố trắng xóa.",
      "Bố Giang nói: “Phi Za không chỉ mạnh. Hắn kiêu ngạo và rất thông minh. Đừng để hắn chọc tức.”",
      "Siro gật đầu. Nhưng khi thấy trường học bị băng bao quanh, cậu đã lao đi ngay.",
      "“Tôi sẽ phá hết băng của hắn!”",
      { type: 'image', src: "/reading/mr-saiyan/tap-05-hinh-02.webp", alt: "Siro đối mặt với Phi Za." },
      "Siro bay lên quảng trường trung tâm. Gió lạnh quất vào mặt vù vù. Cậu đứng trên nóc tòa nhà, hai nắm tay siết chặt, hơi thở trắng bay ra từng làn.",
      "Phi Za xuất hiện từ luồng sáng băng. Hắn nhỏ hơn Siro tưởng, nhưng khí lạnh quanh hắn làm kính cửa sổ nứt tách tách.",
      { type: 'image', src: "/reading/mr-saiyan/tap-05-hinh-03.webp", alt: "Trận chiến giữa Siro và Phi Za." },
      "“Cậu bé Saiyan,” Phi Za cười mỏng. “Ngươi sáng quá. Ta sẽ dập tắt.”",
      "Siro bật Kaioken. Hào quang đỏ bùng lên, làm băng dưới chân tan xèo xèo.",
      "“Kaioken!”",
      "Cậu lao tới vút bay, tay phải đấm thẳng. Phi Za chỉ nghiêng đầu. Cú đấm sượt qua, tạo tiếng gió vun vút. Phi Za dùng đuôi quật vào bụng Siro.",
      "Bốp!",
      "Siro bị đánh bật xuống đường, trượt dài trên băng.",
      "Cậu bật dậy, tung Chưởng Sao Băng Đỏ. Hàng chục chùm sáng đỏ vàng bay vèo vèo. Phi Za xoay một ngón tay. Một bức tường băng mọc lên. Choang choang! Chưởng của Siro vỡ thành tia sáng nhỏ.",
      "“Đòn nóng nảy,” Phi Za nói. “Dễ đoán.”",
      "Hắn vung tay. Những mũi băng nhọn lao tới. Siro xoay người né trái, né phải, rồi dùng khuỷu tay chặn một mũi băng. Rắc! Mũi băng vỡ, nhưng mảnh vụn cứa rách tay áo cậu.",
      "Siro tăng sức:",
      "“Kaioken nhân hai!”",
      "Hào quang đỏ cháy mạnh. Cậu lao vòng quanh Phi Za, để lại vòng sáng đỏ. Từ bốn phía, Siro tung liên tiếp ba cú: đấm phải, đá trái, đấm móc từ dưới lên.",
      "Ầm! Bốp! Rầm!",
      "Phi Za lùi vài bước. Một vết nứt hiện trên giáp vai của hắn.",
      "Siro mừng quá. “Được rồi!”",
      "Nhưng Phi Za cười lạnh. Hắn búng tay.",
      "Phi Za đánh Siro bằng sự lạnh lùng đáng sợ. Hắn không cần tung nhiều sức, chỉ dùng đuôi quật vào bụng, đá vào vai và bắn băng vào những chỗ Siro buộc phải che chắn. Cơ thể Siro tím tái vì lạnh. Kaioken đỏ bị hơi băng ép nhỏ lại, lúc sáng lúc tắt. Khi Phi Za đánh lén từ sau lưng, Siro rơi xuống sân trường, nằm im vài giây trên nền băng nứt. Cậu nghe tiếng bạn bè sau cửa kính mà không nhấc nổi cánh tay.",
      "Siro không có hình thái mới rực rỡ trong tập này; điều mới là cách cậu biến Kaioken thành sức mạnh bảo vệ. Hào quang đỏ vốn bùng nhọn quanh cơ thể dần trải rộng ra như chiếc khăn ấm. Tóc đen ướt sương lạnh, mắt vẫn mệt, nhưng ánh nhìn không còn chỉ hướng vào Phi Za. Nó hướng về lớp học, về bạn bè, về những người đang run trong giá rét. Kaioken Bảo Vệ khác Kaioken thường ở chỗ nó không tăng đòn đánh, mà mở rộng vòng che chở.",
      { type: 'image', src: "/reading/mr-saiyan/tap-05-hinh-04.webp", alt: "Siro thức tỉnh Kaioken Bảo Vệ." },
      "Khi tia băng đổ xuống, Siro quỳ một gối, tay trái cắm xuống đất để giữ trụ, tay phải dựng vòng chắn. Cậu không cố đẩy băng ngược lại; cậu để băng trượt qua mái vòm đỏ vàng rồi rơi sang hai bên thành bụi tuyết. Phi Za càng tức giận càng bắn mạnh, nhưng vòng chắn của Siro càng ổn định vì cậu đã ngừng nghĩ đến thắng thua. Nhờ vậy, các bạn nhỏ được cứu ra ngoài, còn Phi Za không lấy được năng lượng sợ hãi mà hắn muốn.",
      "Trong tập này, Siro không có mái tóc mới hay đôi mắt mới; sự tiến hóa nằm ở cách dùng Kaioken. Hào quang đỏ không nhọn như lưỡi dao nữa mà trải ra thành vòm ấm. Tóc đen ướt sương, mắt vẫn mệt, cơ thể run vì lạnh, nhưng khí tức được cậu ép thành vòng bảo hộ đều đặn. Khác với Kaioken tấn công, Kaioken Bảo Vệ làm Siro chậm lại một chút để đứng vững hơn, mạnh ở sức chịu đựng chứ không phải cú đấm. Phi Za bắn mưa băng vèo vèo, từng mũi lao vào cửa lớp. Siro kéo vòm đỏ vàng xuống sát mặt đất, tay trái giữ trụ, tay phải xoay Khiên Ánh Sáng thành mái nghiêng. Băng trượt khỏi mái vòm rồi vỡ lách tách hai bên. Khi Phi Za mất kiên nhẫn lao tới, Siro dùng Cước Gió Xoáy đẩy hắn lùi khỏi trường. Phi Za không bị hạ hẳn, nhưng âm mưu hút nỗi sợ thất bại vì không làm hại được ai.",
      "Đêm đó, thành phố vẫn còn lạnh. Nhưng trong trường học, các bạn cùng nhau phát chăn, pha sữa nóng và lau băng trên cửa.",
      { type: 'image', src: "/reading/mr-saiyan/tap-05-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "Phúc Hưng vỗ vai Siro. “Cậu không thắng Phi Za, nhưng cậu cứu cả trường.”",
      "Siro nhìn bàn tay run run của mình. “Mình cần mạnh hơn. Nhưng lần sau, mình cũng cần bình tĩnh hơn.”",
      "Trên tầng mây, Phi Za nhìn viên băng nhỏ chứa mảnh hạt đen.",
      "“Ngày mai, ta sẽ cho cậu thấy thế nào là lạnh thật sự.”",
    ],
  },
  {
    id: "mr-saiyan-tap-6",
    title: "Tập 6: Super Saiyan Thức Tỉnh",
    subtitle: "Super Saiyan Thức Tỉnh",
    shortTitle: "Tập 6",
    lines: [
      "Tập 6: Super Saiyan Thức Tỉnh",
      "Ngày hôm sau, Phi Za quay lại. Lần này hắn không tấn công lẻ tẻ. Hắn thả xuống thành phố một cỗ máy hình bông tuyết, gọi là Trái Tim Băng.",
      { type: 'image', src: "/reading/mr-saiyan/tap-06-hinh-01.webp", alt: "Phi Za xuất hiện." },
      "Trái Tim Băng hút hơi ấm từ nhà cửa, cây cối và cả tiếng cười. Hoa trong công viên cụp xuống. Chim nép vào mái hiên. Dòng sông đông cứng từ bờ này sang bờ kia.",
      "Bun phát hiện một điều quan trọng.",
      "“Nếu phá lõi băng ở quảng trường, thành phố sẽ ấm lại. Nhưng Phi Za chắc chắn canh ở đó.”",
      "Siro đứng lên. Cậu đã nghỉ sau trận trước, nhưng cơ thể vẫn đau.",
      "Mẹ Phương buộc lại khăn quàng cho cậu.",
      "“Đừng để giận dữ điều khiển con.”",
      "Siro hỏi nhỏ: “Nếu con rất giận thì sao mẹ?”",
      "Mẹ chạm nhẹ vào ngực cậu. “Hãy hỏi trái tim con đang muốn phá hủy, hay muốn bảo vệ.”",
      "Siro bay về phía quảng trường. Mây đen cuộn trên đầu. Phi Za đang chờ, ung dung như đang ngắm một món đồ chơi.",
      "“Đến rồi à, cậu bé thất bại?”",
      "Siro không đáp. Cậu nhìn Trái Tim Băng đang hút hơi ấm khỏi thành phố. Cậu nghĩ đến Simi, mẹ, bố và các bạn.",
      "“Tôi đến để kết thúc chuyện này.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-06-hinh-02.webp", alt: "Siro đối mặt với Phi Za." },
      "Siro đứng giữa quảng trường, chân trái đặt trước, hai tay nâng ngang ngực. Cậu bật Kaioken. Hào quang đỏ cháy phừng phực, làm băng quanh giày tan ra.",
      "Phi Za giơ một ngón tay, bắn tia băng mảnh như kim.",
      { type: 'image', src: "/reading/mr-saiyan/tap-06-hinh-03.webp", alt: "Trận chiến giữa Siro và Phi Za." },
      "Siro nghiêng người né, rồi lao lên không trung. Cậu xoay nửa vòng, đá xuống bằng gót chân phải.",
      "“Cước Gió Xoáy Đỏ!”",
      "Phi Za chặn bằng cổ tay. Ầm! Sóng gió thổi tung tuyết. Hắn đẩy ngược, làm Siro bật lên cao.",
      "Phi Za xuất hiện phía trên Siro nhanh đến mức chỉ còn vệt trắng. Hắn chắp hai tay, đập xuống.",
      "RẦM!",
      "Siro rơi xuyên qua mái băng của đài phun nước. Nước đóng băng vỡ choang.",
      "Siro bật dậy, bắn Chưởng Sao Băng Đỏ liên tiếp. Phi Za luồn qua các chùm sáng, nhẹ như chiếc lá. Hắn tung đuôi quật vào cổ tay Siro, rồi đá vào ngực cậu.",
      "Bốp! Bốp!",
      "Siro bay ngược, đập vào cột băng. Hào quang đỏ tắt. Cơ thể cậu nặng như đá.",
      "Phi Za nâng tay. Trái Tim Băng mở ra, hút năng lượng của những người đang trú trong nhà. Ánh sáng ấm áp từ cửa sổ mờ dần.",
      "Simi, trong nhà, cố thắp một chiếc đèn nhỏ. Ngọn đèn lập lòe rồi tắt.",
      "Mẹ Phương ôm con. “Hãy gửi lời yêu thương cho anh.”",
      "Simi nhắm mắt. “Anh Siro ơi, em tin anh.”",
      "Phi Za lần này đánh Siro đến kiệt sức thật sự. Cú đá của hắn làm cậu đâm vào cột băng, lưng đau nhói, hơi thở bật ra trắng xóa. Những mũi băng cắt qua áo, làm vai và tay cậu tê buốt. Kaioken tắt phụt, để lại cảm giác rã rời như sau một cơn sốt. Siro cố đứng nhưng đầu gối trượt trên mặt băng. Trái Tim Băng vẫn hút hơi ấm thành phố, còn cậu nằm đó, nhỏ bé giữa quảng trường lạnh.",
      "Khoảnh khắc biến thành Super Saiyan 1 đến từ một sự lựa chọn trong tim. Siro có giận, nhưng cậu không để cơn giận đốt cháy mọi thứ. Cậu biến nó thành lời hứa. Hào quang vàng bật lên từ bàn chân, quấn quanh người thành cột sáng. Tóc đen dựng từng lọn rồi chuyển dần sang vàng rực, như có nắng chảy qua từng sợi tóc. Đôi mắt đổi sang xanh lá, trong và sắc. Cơ thể nhẹ hơn, hơi thở sâu hơn, khí tức không còn đỏ đau như Kaioken mà sáng, mạnh và bền hơn.",
      { type: 'image', src: "/reading/mr-saiyan/tap-06-hinh-04.webp", alt: "Siro thức tỉnh Super Saiyan 1." },
      "Sau thức tỉnh, Siro thấy từng tia băng của Phi Za bay chậm lại. Cậu né bằng những bước ngắn, không thừa động tác: nghiêng cổ, xoay vai, chạm mũi chân rồi đổi hướng. Khi Phi Za giơ tường băng, Siro không đấm vỡ bừa bãi. Cậu gọi Sóng Rồng Ánh Sáng, để rồng vàng bay vòng quanh Trái Tim Băng, kéo lõi đen ra khỏi máy. Phi Za bị đẩy lùi không chỉ bởi sức mạnh gấp bội, mà bởi một nguồn sáng ấm áp hắn không thể đóng băng.",
      "Super Saiyan 1 mở ra như mặt trời mọc trong băng giá. Hào quang vàng bật từ chân, leo lên đầu gối, vai, rồi phủ kín cơ thể. Tóc đen chuyển từng lọn sang vàng rực, đôi mắt xanh lá mở sáng, cơ thể bớt nặng, khí tức trở nên bền và sâu. Khác với Kaioken đỏ làm đau từng cơ bắp, SSJ1 không phải sức vay mượn trong vài giây; nó là ngọn lửa ổn định từ lời hứa bảo vệ. Siro đứng dậy, cảm xúc giận dữ được gấp lại thành lòng thương. Phi Za dựng ba tường băng liên tiếp. Siro lao đi vun vút, đấm vỡ tường thứ nhất bằng tay trái, xoay người đá tan tường thứ hai, rồi dùng Chưởng Sao Băng vàng xuyên qua tường thứ ba để mở đường. Khi Phi Za ôm Trái Tim Băng tháo chạy, Siro gọi Sóng Rồng Ánh Sáng cuộn quanh hắn, tách lõi đen khỏi máy. Phi Za rơi xuống tuyết, mất quyền điều khiển băng và phải rút lui.",
      "Khi Siro về nhà, Simi chạy ra ôm cậu.",
      { type: 'image', src: "/reading/mr-saiyan/tap-06-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "“Tóc anh vàng như nắng!”",
      "Siro cười mệt. “Nắng này cần ăn cơm nóng.”",
      "Bố Giang nhìn con trai, ánh mắt vừa tự hào vừa lo lắng.",
      "“Super Saiyan là cánh cửa lớn. Nhưng càng mạnh, con càng phải nhớ mình là ai.”",
      "Siro gật đầu. Ngoài trời, giọt nước cuối cùng rơi khỏi cành cây, long lanh như tiếng cười trở lại.",
    ],
  },
  {
    id: "mr-saiyan-tap-7",
    title: "Tập 7: Xen Và Trò Chơi Hấp Thụ Năng Lượng",
    subtitle: "Xen Và Trò Chơi Hấp Thụ Năng Lượng",
    shortTitle: "Tập 7",
    lines: [
      "Tập 7: Xen Và Trò Chơi Hấp Thụ Năng Lượng",
      "Sau khi Phi Za rút lui, thành phố đang sửa lại đường dây điện thì một điều lạ xảy ra. Đèn vừa bật lại đã tắt. Điện thoại hết pin. Xe buýt điện đứng im. Ngay cả đèn lồng của Simi cũng chỉ sáng lờ mờ.",
      "Bun kiểm tra máy đo tự chế. Kim đồng hồ quay vù vù.",
      "“Có thứ gì đó đang hút năng lượng từ khắp nơi!”",
      "Trên nóc nhà máy điện, một sinh vật xanh đốm đen đứng nhìn thành phố. Hắn tên là Xen. Đuôi hắn cắm vào ống dẫn điện, hút ánh sáng thành từng dòng xanh.",
      { type: 'image', src: "/reading/mr-saiyan/tap-07-hinh-01.webp", alt: "Xen xuất hiện." },
      "“Chưa đủ,” Xen thì thầm. “Ta cần trở nên hoàn hảo.”",
      "Siro bay đến cùng Bun và Minh Trí dưới mặt đất. Bố Giang dặn qua bộ đàm:",
      "“Xen càng hút nhiều càng mạnh. Con phải cắt nguồn hút, không chỉ đánh hắn.”",
      "Siro đáp: “Con hiểu.”",
      "Nhưng Xen đã nhìn thấy cậu. Hắn mỉm cười.",
      "“Siro, năng lượng Super Saiyan của ngươi chắc ngon lắm.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-07-hinh-02.webp", alt: "Siro đối mặt với Xen." },
      "Siro biến thành Super Saiyan 1. Tóc vàng dựng sáng, hào quang tỏa ầm ầm khiến khói trên mái nhà tản ra. Cậu đứng trên anten, chân trái trước, tay phải nắm chặt.",
      "Xen lao tới, đôi cánh rung vè vè. Hắn vung móng vuốt. Siro nghiêng người né, nắm lấy cổ tay hắn bằng tay trái rồi đấm tay phải vào bụng.",
      { type: 'image', src: "/reading/mr-saiyan/tap-07-hinh-03.webp", alt: "Trận chiến giữa Siro và Xen." },
      "Bốp!",
      "Xen cong người, nhưng đuôi hắn bắn ra từ phía sau, quấn lấy cánh tay Siro.",
      "“Hút!”",
      "Siro thấy sức mình bị kéo ra như nước chảy khỏi bình. Hào quang vàng yếu đi.",
      "Cậu dùng đầu gối phải thúc lên, buộc Xen buông tay, rồi lộn vòng ra sau. Trên không, Siro chắp hai tay:",
      "“Chưởng Sao Băng!”",
      "Mưa sáng vàng rơi xuống vèo vèo. Xen bay lách qua, nhanh như bóng. Một vài chùm trúng cánh hắn, nổ bùm bùm, nhưng hắn vẫn cười.",
      "“Ngươi đánh ta thì tốt. Ta sẽ học cách đánh của ngươi.”",
      "Xen bỗng bắt chước Cú Đấm Sấm Sét. Nắm tay hắn phát sáng xanh, lao thẳng tới.",
      "Siro giơ tay đỡ.",
      "ẦM!",
      "Sóng xung kích làm kính nhà máy rung rầm rầm. Siro lùi ba bước.",
      "Dưới đất, Bun hét qua bộ đàm: “Siro! Đuôi hắn nối với ba ống dẫn. Cắt ống bên trái trước!”",
      "Gạo và Phúc Hưng kéo dây cảnh báo, giúp công nhân rời khỏi khu nguy hiểm. Mimi và Kem dẫn các em nhỏ ra xa. Bơ dùng loa hô: “Mọi người tắt thiết bị không cần thiết!”",
      "Siro nhìn thấy mọi người đang giúp. Tim cậu ấm lên.",
      "Cậu lao về ống bên trái. Xen chắn lại, đá thẳng vào mặt cậu. Siro cúi thấp, cú đá sượt qua tóc. Cậu xoay người, dùng chân trái đá móc vào đuôi Xen.",
      "Bốp!",
      "Đuôi lệch khỏi ống dẫn. Dòng năng lượng giảm.",
      "Xen làm Siro thua theo cách đáng sợ hơn: hắn lấy chính sức của cậu. Đuôi hút năng lượng quấn vào cánh tay, kéo hào quang vàng thành từng sợi. Siro choáng váng, cú đấm yếu dần, mắt xanh mờ đi. Khi quả cầu xanh đen ép xuống, cậu quỳ hẳn trên mái nhà, đầu gối làm nền bê tông nứt ra. Sét điện của nhà máy giật quanh người, còn Xen cười vì càng đánh lâu hắn càng mạnh.",
      "SSJ2 bùng lên khi Siro nhận ra sức mạnh không chỉ đến từ một mình cậu. Hào quang vàng quanh SSJ1 vốn như lửa mặt trời, còn SSJ2 sắc hơn, gọn hơn và có tia sét sống động. Tóc vàng nhọn lên từng mảng, dựng cao và cứng hơn. Mắt xanh sáng sâu hơn. Tia sét vàng chạy từ vai xuống cổ tay, xẹt xẹt, như nhắc Siro rằng mỗi chuyển động phải nhanh, dứt khoát và chính xác.",
      { type: 'image', src: "/reading/mr-saiyan/tap-07-hinh-04.webp", alt: "Siro thức tỉnh Super Saiyan 2." },
      "Từ lúc ấy, Siro không còn đuổi theo Xen trong hoảng hốt. Cậu xuất hiện giữa các ống dẫn như một tia chớp, dùng tay trái khóa đuôi hút năng lượng, tay phải biến thành Lưỡi Sét Saiyan. Đòn chém không chém vào người Xen mà cắt đúng đường hút cuối cùng. Khi Xen mất nguồn, Siro dùng Sóng Rồng Ánh Sáng kéo mảnh hạt đen ra khỏi ngực hắn. Chiến thắng của SSJ2 là tốc độ cộng với sự phối hợp của bạn bè.",
      "SSJ2 khác SSJ1 ngay từ âm thanh. Hào quang vàng không chỉ cháy sáng mà còn có tia sét xẹt xẹt nhảy qua vai và cổ tay. Tóc vàng nhọn hơn, mắt xanh sâu hơn, cơ thể Siro như nhẹ đi nhưng mỗi cú siết tay lại chắc hơn. Khí tức sắc, nhanh, có cảm giác như một cơn bão được gói vào người nhỏ bé. Trong lòng Siro không còn cô độc vì cậu nghe tiếng Bun, Gạo và các bạn gọi hướng đi của Xen. Xen hấp thụ thêm năng lượng, phóng đuôi tới cổ tay Siro. Cậu dùng tốc độ SSJ2 biến mất thành vệt vàng, xuất hiện sau lưng Xen, tay trái khóa đuôi, tay phải tung Lưỡi Sét Saiyan cắt đường hút. Xen gào lên, tạo quả cầu xanh đen cuối cùng. Siro xoay người, ném Chưởng Sao Băng vào bốn góc quả cầu, rồi bồi Sóng Rồng Ánh Sáng vào hạt đen. Xen mất nguồn hút, teo lại và ngã quỵ trên mái nhà máy.",
      "Tối hôm ấy, cả nhóm ngồi dưới đèn đường vừa sáng lại. Simi chia kẹo cho mọi người.",
      { type: 'image', src: "/reading/mr-saiyan/tap-07-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "Siro nói: “Nếu không có các cậu, mình thua rồi.”",
      "Bun chỉnh kính. “Vậy lần sau nhớ nghe bộ đàm sớm hơn.”",
      "Cả nhóm cười vang.",
      "Trên nóc nhà xa, một cái bóng nhìn về phía họ. Nó nhặt mảnh vỏ đen còn sót lại và thì thầm:",
      "“Tia sét này sẽ còn hữu ích.”",
    ],
  },
  {
    id: "mr-saiyan-tap-8",
    title: "Tập 8: Cơn Bão Tia Sét Của SSJ2",
    subtitle: "Cơn Bão Tia Sét Của SSJ2",
    shortTitle: "Tập 8",
    lines: [
      "Tập 8: Cơn Bão Tia Sét Của SSJ2",
      "Tưởng Xen đã bỏ đi, nhưng một mảnh dữ liệu của hắn rơi vào nhà máy cũ. Mảnh dữ liệu ấy chui vào hàng trăm linh kiện, dây điện và tấm thép, tạo thành Xen Mắc.",
      { type: 'image', src: "/reading/mr-saiyan/tap-08-hinh-01.webp", alt: "Xen Mắc xuất hiện." },
      "Xen Mắc không cần ăn hay ngủ. Hắn chỉ cần sấm sét. Và đêm đó, một cơn bão lớn kéo đến.",
      "Ầm ầm! Đùng đoàng!",
      "Tia chớp rạch ngang bầu trời. Tháp truyền hình cao nhất thành phố phát sáng xanh đen. Xen Mắc cắm dây hút vào cột thu lôi, kéo sét từ mây xuống.",
      "“Năng lượng bão thuộc về ta,” hắn nói bằng giọng kim loại.",
      "Nếu tháp nổ, sóng xung kích sẽ làm kính vỡ khắp thành phố. Siro lập tức bay lên, nhưng bố Giang giữ vai cậu.",
      "“SSJ2 rất nhanh, nhưng sét cũng rất nguy hiểm. Con phải điều khiển, không để nó điều khiển con.”",
      "Siro gật đầu. Cậu nhớ cảm giác tia sét chạy quanh người. Vừa mạnh mẽ, vừa khó giữ.",
      "“Con sẽ bình tĩnh.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-08-hinh-02.webp", alt: "Siro đối mặt với Xen Mắc." },
      "Mưa rơi rào rào. Siro đứng trên mép mái nhà, tóc vàng ướt lấp lánh. Cậu gồng lên. Xẹt xẹt! SSJ2 bùng nổ, tia điện vàng xoay quanh cánh tay.",
      "Xen Mắc mở cánh kim loại. Hàng chục dây điện phóng ra như rắn thép.",
      { type: 'image', src: "/reading/mr-saiyan/tap-08-hinh-03.webp", alt: "Trận chiến giữa Siro và Xen Mắc." },
      "Siro lao lên vút, né dây thứ nhất bằng cách nghiêng vai phải. Dây thứ hai quật ngang, cậu lộn vòng qua trên. Dây thứ ba lao tới mặt, cậu dùng khuỷu tay trái chặn lại.",
      "Coong!",
      "Tia điện xanh truyền qua dây, làm cánh tay cậu tê rần.",
      "Xen Mắc bắn Mưa Kim Sét. Những mũi kim sáng xanh rơi xuống vèo vèo. Siro bay vòng tròn quanh tháp, tạo vệt sáng vàng. Cậu dùng Chưởng Sao Băng bắn ngược lên, từng quả cầu vàng va vào kim sét:",
      "Bùm! Bùm! Bùm!",
      "Mây sáng rực trong đêm.",
      "Nhưng Xen Mắc càng hút sét càng nhanh. Hắn bắt đầu đoán đường bay của Siro. Một dây thép quấn lấy cổ chân cậu.",
      "“Bắt được.”",
      "Xen Mắc kéo mạnh. Siro bị quật vào thân tháp.",
      "Rầm!",
      "Kim loại móp vào. Siro rơi xuống anten phụ, thở dốc. Tia sét vàng quanh người cậu nhảy loạn. Càng tức, sét càng rối.",
      "Xen Mắc gom một quả cầu sét khổng lồ trên đỉnh tháp.",
      "“Thành phố sẽ sáng trong một giây. Rồi tối mãi.”",
      "Dưới mặt đất, bạn bè Siro đang trú trong xe cứu hộ. Bun nhìn bản đồ gió.",
      "“Siro! Bão xoay theo vòng trái. Nếu cậu bay ngược vòng bão, sét sẽ rối hơn. Bay cùng vòng bão đi!”",
      "Trong cơn bão, SSJ2 của Siro suýt phản lại cậu. Xen Mắc quật dây thép vào tháp truyền hình, kéo theo luồng điện xanh làm cánh tay Siro tê cứng. Cậu bị ném vào thân tháp, lưng va mạnh rầm, hơi thở nghẹn lại. Tia sét quanh người cậu nhảy loạn, đánh xuống mái nhà và làm cậu sợ mình sẽ gây nguy hiểm. Khi quả cầu sét khổng lồ hình thành, Siro nằm trên anten phụ, mưa tạt vào mặt, gần như không phân biệt nổi trời đất.",
      "Sự khác biệt của SSJ2 Bình Tâm không nằm ở tóc dài hơn hay hào quang to hơn. Nó nằm ở trật tự. Những tia sét vàng ban đầu phóng lung tung quanh Siro, sau đó dần chạy thành vòng đều quanh vai, cổ tay và mắt cá chân. Tóc vàng vẫn nhọn, mắt xanh vẫn sáng, nhưng khí tức bớt nổ lách tách. Bên trong, Siro không cố thắng cơn bão; cậu học cách thở cùng nó.",
      { type: 'image', src: "/reading/mr-saiyan/tap-08-hinh-04.webp", alt: "Siro thức tỉnh SSJ2 Bình Tâm." },
      "Sau khi điều khiển được sét, Siro bay cùng chiều gió bão, tạo Vòng Sét Bình Tâm quanh tháp. Cậu dẫn dòng điện xanh khỏi Xen Mắc, đưa nó vào các cột thu lôi an toàn. Khi robot mất nguồn, Siro xoay người trên không, đá gót chân vào dây hút chính rồi dùng Lưỡi Sét Saiyan cắt đứt nó. Mưa vẫn rơi, sấm vẫn nổ, nhưng trận chiến đã đổi chủ: cơn bão không còn là vũ khí của Xen Mắc mà trở thành dòng chảy Siro biết dẫn đường.",
      "SSJ2 Bình Tâm không làm Siro có hình dáng mới quá lạ, nhưng thay đổi cách mọi thứ vận hành. Hào quang vàng giữ sát người, tia sét chạy theo vòng tròn đều thay vì bổ lung tung. Tóc vẫn vàng nhọn, mắt xanh sáng, cơ thể đứng thẳng hơn giữa gió, khí tức gọn như tiếng trống đều. So với SSJ2 vừa thức tỉnh, trạng thái này ít dữ hơn nhưng bền hơn, nhanh hơn trong các động tác nhỏ và có khả năng dẫn sét an toàn cho người xung quanh. Xen Mắc kéo sét từ tháp xuống thành cây roi xanh khổng lồ. Siro bay lên theo đường xoắn ốc, né từng roi bằng vai, hông và gót chân. Cậu đặt Vòng Sét Bình Tâm quanh tháp, dẫn điện về cột thu lôi, rồi dùng Lưỡi Sét Saiyan cắt dây hút chính. Xen Mắc mất nguồn, thân máy giật cạch cạch, quả cầu sét tan thành mưa sáng, và trận bão không còn nghe lời hắn.",
      "Khi bão tan, Siro đáp xuống bên các bạn. Tóc cậu trở lại màu đen, bốc khói nhẹ.",
      { type: 'image', src: "/reading/mr-saiyan/tap-08-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "Kem đưa cho cậu khăn. “Tóc cậu như vừa rang bắp.”",
      "Siro cười phá lên. “May mà chưa thành bắp nổ.”",
      "Bố Giang nhìn bầu trời trong dần. “Con đã học được điều khó: mạnh mà không loạn.”",
      "Xa xa, một mảnh hạt đen vụn bị dòng nước mưa cuốn xuống cống, trôi về nơi tối hơn.",
    ],
  },
  {
    id: "mr-saiyan-tap-9",
    title: "Tập 9: Bu Và Viên Kẹo Năng Lượng",
    subtitle: "Bu Và Viên Kẹo Năng Lượng",
    shortTitle: "Tập 9",
    lines: [
      "Tập 9: Bu Và Viên Kẹo Năng Lượng",
      "Sáng chủ nhật, công viên mở hội kẹo. Có kẹo bông trắng xốp, kẹo táo đỏ bóng, bánh quy hình sao và nước cam mát lạnh. Simi nhảy chân sáo, kéo tay Siro.",
      "“Anh ơi, mình ăn kẹo bông nhé!”",
      "Siro cười. “Mỗi người một cây thôi nha.”",
      "Nhưng giữa hội kẹo, một chiếc xe lạ lăn tới. Bánh xe kêu lộc cộc, ống khói phun mùi đường thơm ngọt. Trên xe có một sinh vật tròn hồng tên là Bu.",
      { type: 'image', src: "/reading/mr-saiyan/tap-09-hinh-01.webp", alt: "Bu xuất hiện." },
      "Bu cười khúc khích. “Bu thích kẹo! Bu biến mọi thứ thành kẹo!”",
      "Trên trán Bu dính một mảnh hạt đen nhỏ như hạt mè. Nó làm nụ cười của Bu lúc vui lúc đáng sợ.",
      "Bu chỉ tay vào chiếc đèn công viên.",
      "Bụp!",
      "Ánh sáng trong đèn biến thành viên kẹo vàng.",
      "Bu chỉ tay vào chiếc loa.",
      "Bụp!",
      "Âm nhạc biến thành kẹo xanh.",
      "Mọi người hoảng hốt chạy đi. Bu càng cười lớn. “Năng lượng thành kẹo! Ngon ngon!”",
      "Siro bước lên. “Bu, dừng lại. Mọi người cần ánh sáng và âm nhạc.”",
      "Bu nghiêng đầu. “Nhưng Bu thích.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-09-hinh-02.webp", alt: "Siro đối mặt với Bu." },
      "Siro biến thành SSJ2. Tóc vàng nhọn, sét vàng chạy xẹt xẹt quanh người. Cậu đứng chắn trước Simi và các bạn, hai tay mở rộng.",
      "Bu phồng má, thổi ra bong bóng hồng. Bong bóng bay lơ lửng, rồi nổ bụp bụp, biến ghế đá thành kẹo nâu.",
      { type: 'image', src: "/reading/mr-saiyan/tap-09-hinh-03.webp", alt: "Trận chiến giữa Siro và Bu." },
      "Siro lao tới vút, tay phải đấm nhẹ vào bụng Bu để đẩy ra xa.",
      "Bộp!",
      "Bụng Bu lún vào như bột mềm, rồi bật lại. Siro bị hất ngược, xoay vòng trên không.",
      "“Ơ?” Siro ngạc nhiên.",
      "Bu cười. “Đánh Bu nhột!”",
      "Bu duỗi tay dài ngoằng, quấn quanh cánh tay Siro. Siro dùng khuỷu tay trái chặn, xoay người để gỡ ra, nhưng tay Bu mềm như dây kẹo. Cậu bị kéo xuống đất.",
      "Rầm!",
      "Siro bật dậy, tung Lưỡi Sét Saiyan. Tia sét vàng chém qua tay Bu, nhưng tay Bu lại dính liền như cũ.",
      "“Bu không hư!” Bu reo.",
      "Rồi Bu tức lên vì một viên kẹo bị rơi. Mảnh hạt đen trên trán sáng tối. Bu há miệng, hút năng lượng từ cả công viên. Những quả bóng bay xẹp xuống. Cỏ úa màu. Mặt Simi tái đi vì mệt.",
      "Siro nổi giận. Cậu gồng SSJ2 mạnh hơn. Sét vàng nổ đùng đoàng. Cậu lao vào, đấm liên tiếp: tay phải, tay trái, đầu gối, đá xoáy.",
      "Bốp! Bốp! Ầm!",
      "Bu bị đẩy lùi, nhưng mỗi cú đánh lại làm Bu bật như cao su. Bu phồng to hơn, rồi đập hai tay xuống.",
      "ẦM!",
      "Siro bị hất bay vào quầy kẹo bông. Đường trắng tung lên như mây. Hào quang SSJ2 tắt dần. Cậu thở gấp.",
      "Bu giơ tay về phía Simi.",
      "“Kẹo sáng nhỏ nhỏ!”",
      "Siro thấy tia hồng lao tới em gái. Cậu không kịp nghĩ. Cậu bật dậy, chắn trước Simi. Tia hồng đánh trúng vai cậu. Một phần áo biến thành kẹo đường, cứng lại.",
      "Siro đau buốt, ngã quỵ.",
      "Simi khóc. “Anh ơi, Bu đâu có muốn xấu. Bạn ấy bị hạt đen làm đau.”",
      "Siro nhìn Bu. Bu đang ôm đầu, lúc cười lúc khóc.",
      "“Bu đói... Bu buồn... Bu muốn kẹo...”",
      "Bu không đánh đau theo kiểu nắm đấm cứng, nhưng mỗi cú bật của cơ thể mềm lại làm Siro kiệt sức. Siro đấm vào bụng Bu, lực bật ngược khiến cậu bay xoay vòng. Cánh tay dài của Bu quấn lấy người cậu như kẹo dẻo, kéo cậu đập xuống nền công viên. Khi Siro chắn tia biến kẹo cho Simi, vai cậu cứng lại, đau buốt và nặng trĩu. Cậu ngã xuống giữa kẹo bông vương đầy áo, mắt nhòe đi vì vừa đau vừa lo cho em.",
      "SSJ3 thức tỉnh như một dòng thác vàng. Tóc vàng của Siro không chỉ dựng lên mà mọc dài, chảy xuống tận chân thành từng dải sáng. Lông mày biến mất, làm gương mặt cậu trông nghiêm hơn, xa lạ hơn các trạng thái trước. Hào quang vàng dày và nặng, thổi kẹo, lá và bụi bay vòng quanh. Nhưng khác với SSJ2 sắc như sét, SSJ3 giống một biển sức mạnh khổng lồ: nếu dùng bừa, nó sẽ làm cậu mệt rất nhanh.",
      { type: 'image', src: "/reading/mr-saiyan/tap-09-hinh-04.webp", alt: "Siro thức tỉnh Super Saiyan 3." },
      "Siro dùng hình thái mới theo cách dịu nhất có thể. Cậu không tung đấm liên hoàn vào Bu. Cậu né tia kẹo bằng một bước nhanh đến mức chỉ còn tóc vàng loang loáng, rồi đặt hai ngón tay sáng lên mảnh hạt đen trên trán bạn ấy. Ánh Sáng Bạn Bè lan ra ấm như nắng, làm hạt đen nứt mà không làm Bu đau. Trận thắng này cho thấy SSJ3 không chỉ mạnh hơn, mà còn đủ sâu để Siro dùng sức lớn thật mềm.",
      "SSJ3 đến theo từng lớp rất rõ. Hào quang vàng dày lên trước, ép không khí kêu ù ù. Tóc vàng mọc dài xuống tận chân, lông mày biến mất, đôi mắt xanh trở nên nghiêm và sâu. Cơ thể Siro không phình to, nhưng khí tức nặng như biển, khiến mặt đất rung nhẹ dưới chân. Khác với SSJ2 nhanh như sét, SSJ3 mạnh như dòng thác lớn; nó cho Siro sức bứt phá khổng lồ nhưng cũng rút sức rất nhanh. Cảm xúc trong lòng Siro dâng lên rất mạnh: vừa thương Simi, vừa lo cho Bu, vừa sợ mình dùng quá tay. Siro tự nhắc: Bu không phải món đồ xấu, trong bạn ấy còn phần hiền. Bu bắn tia kẹo hồng liên tiếp. Siro né bằng một vệt tóc vàng loang loáng, dùng Cước Gió Xoáy đẩy trẻ em khỏi vùng nguy hiểm, rồi áp sát. Ánh Sáng Bạn Bè chạm vào hạt đen trên trán Bu, Sóng Rồng Ánh Sáng bao quanh nhẹ nhàng, làm hạt đen rơi tách. Bu ngồi phịch xuống, hết bị điều khiển và bật khóc xin lỗi.",
      "Bu dùng phép biến những viên kẹo năng lượng trở lại thành đèn, loa và ghế đá. Công viên sáng lên. Nhạc vui vang lại.",
      { type: 'image', src: "/reading/mr-saiyan/tap-09-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "Bu cúi đầu. “Bu ăn kẹo thường thôi.”",
      "Simi đưa Bu một cây kẹo bông nhỏ. “Ăn chậm nhé.”",
      "Bu cắn một miếng, cười tít mắt. “Ngon hơn năng lượng!”",
      "Siro ngồi xuống ghế, tóc trở lại màu đen. Cậu mệt rã rời, nhưng lòng nhẹ như mây.",
    ],
  },
  {
    id: "mr-saiyan-tap-10",
    title: "Tập 10: Mái Tóc Vàng Dài Đến Chân",
    subtitle: "Mái Tóc Vàng Dài Đến Chân",
    shortTitle: "Tập 10",
    lines: [
      "Tập 10: Mái Tóc Vàng Dài Đến Chân",
      "Sau hội kẹo, Bu trở thành bạn của Siro. Bu thích chơi xích đu, thích ăn bánh chuối của mẹ Phương và thích nghe Simi kể chuyện.",
      "Nhưng mảnh hạt đen đã từng bám vào Bu không biến mất hoàn toàn. Một phần bóng tối chui vào chiếc máy làm kẹo cũ trong nhà máy bỏ hoang. Đêm xuống, nó tụ lại thành Bu Đen.",
      { type: 'image', src: "/reading/mr-saiyan/tap-10-hinh-01.webp", alt: "Bu Đen xuất hiện." },
      "Bu Đen không ngây ngô. Nó lặng lẽ, nhanh nhẹn và thích lấy năng lượng vui vẻ của trẻ em để làm kẹo đen.",
      "Sáng hôm sau, nhiều bạn nhỏ trong thành phố bỗng buồn ngủ. Tiếng cười ở sân trường ít hẳn. Simi ôm gấu bông, nói:",
      "“Em thấy trong người xám xám.”",
      "Bu run lên. “Không phải Bu. Bu hứa.”",
      "Siro đặt tay lên vai Bu. “Mình tin bạn.”",
      "Bun phát hiện năng lượng bị kéo về nhà máy bánh kẹo cũ. Siro bay đến cùng Bu. Bên trong, máy móc chạy rầm rầm dù không ai bật. Trên băng chuyền là những viên kẹo đen lấp lánh.",
      "Bu Đen bước ra, cười nhỏ.",
      "“Ta là phần buồn giận mà Bu bỏ lại. Ta sẽ làm cả thành phố im lặng.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-10-hinh-02.webp", alt: "Siro đối mặt với Bu Đen." },
      "Siro biến thành SSJ3 ngay từ đầu. Tóc vàng dài tung bay, hào quang mạnh đến mức các viên kẹo đen rung lách cách. Cậu đứng chân phải trước, hai tay mở rộng.",
      "“Bu Đen, trả tiếng cười lại.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-10-hinh-03.webp", alt: "Trận chiến giữa Siro và Bu Đen." },
      "Bu Đen lao tới nhanh bất ngờ. Nó uốn người như khói, tránh cú đấm phải của Siro, rồi đấm một cú vào sườn cậu.",
      "Bốp!",
      "Siro lùi lại. Cậu xoay người đá chân trái. Bu Đen mềm ra, cú đá xuyên qua rồi nó biến thành sợi dây đen quấn lấy cổ tay Siro.",
      "Bu hét: “Siro, cẩn thận! Nó biết cách của Bu!”",
      "Siro gồng mạnh, kéo đứt dây. Cậu bắn Chưởng Sao Băng. Những chùm vàng bay vun vút, nổ tung quanh nhà máy.",
      "Nhưng Bu Đen núp sau máy kẹo, biến đòn nổ thành kẹo đen rơi lộp bộp.",
      "“Sức mạnh lớn. Hao nhanh,” Bu Đen nói.",
      "Siro cảm thấy đúng như vậy. SSJ3 làm cơ thể cậu mệt rất nhanh. Mỗi hơi thở nặng như mang đá.",
      "Bu Đen nhận ra. Nó đánh nhanh hơn: chưởng trái, đá phải, dây đen từ sau lưng, rồi tia kẹo đen từ trần nhà.",
      "Siro né sang trái, xoay người trên không, dùng khuỷu tay chặn tia thứ nhất. Tia thứ hai đánh vào vai. Bùm! Cậu rơi xuống sàn.",
      "Tóc vàng dài phủ quanh người. Hào quang yếu đi.",
      "Bu Đen mở cỗ máy lớn nhất. Nó hút tiếng cười còn lại từ thành phố qua những viên kẹo đen. Siro nghe tiếng Simi trong bộ đàm nhỏ:",
      "“Anh ơi... em muốn cười mà không cười được.”",
      "Siro cố đứng, nhưng chân run.",
      "“SSJ3 mạnh thật... nhưng mình dùng quá nhiều.”",
      "Bu Đen kéo Siro vào một trận đánh tiêu hao. Mỗi lần Siro bùng SSJ3 thật lớn, nhà máy rung lên nhưng hơi thở cậu nặng thêm. Bu Đen luồn qua đòn đánh như khói, rồi phản công bằng dây đen từ sau lưng, từ trần nhà, từ băng chuyền. Siro bị quật vào sàn, tóc vàng dài phủ ngang mặt, hai tay run vì cạn sức. Cỗ máy hút tiếng cười khởi động rầm rầm, còn cậu mệt đến mức chỉ chống được một khuỷu tay.",
      "Lần này, Siro không thức tỉnh hình thái mới hoàn toàn; cậu thức tỉnh một cách dùng SSJ3 mới. Hào quang vàng vốn tràn khắp cơ thể dần co lại, không còn phung phí thành cơn bão lớn. Ánh sáng tập trung ở hai bàn tay và đôi chân, như bốn ngọn đèn nhỏ nhưng chắc. Mái tóc vàng vẫn dài đến chân, nhưng bớt tung loạn. Khí tức của Siro không còn ầm ầm như thác, mà chảy thành dòng thẳng.",
      { type: 'image', src: "/reading/mr-saiyan/tap-10-hinh-04.webp", alt: "Siro thức tỉnh SSJ3 Kiểm Soát." },
      "Nhờ tiết kiệm sức, Siro đọc được nhịp tấn công của Bu Đen. Cậu né dây đen bằng những bước ngắn, chỉ cắt sợi nào thật cần cắt. Khi Bu Đen lao tới che máy, Siro không húc thẳng mà đá nhẹ xuống sàn tạo vòng gió, đẩy hắn lệch nửa bước. Khoảnh khắc đó đủ để Bu tạo bong bóng hồng, còn Siro dùng Sóng Rồng Ánh Sáng - Nụ Cười Trở Về làm kẹo đen hóa thành ánh sáng. Cậu thắng bằng sự chính xác, không phải bằng việc đốt cạn sức mình.",
      "SSJ3 tiết kiệm năng lượng là bài học khó hơn việc biến hình. Hào quang vàng không còn phun rộng như thác mà thu vào bốn điểm: hai bàn tay, hai bàn chân. Mái tóc vàng dài vẫn bay phấp phới, đôi mắt xanh tập trung hơn, cơ thể bớt run vì không còn đốt sức quá nhanh. Khí tức chuyển từ tiếng ầm ầm sang dòng chảy đều. So với SSJ3 đầu tiên, hình thái này không mạnh bùng nổ hơn, nhưng chiến đấu lâu hơn và chính xác hơn. Bu Đen phóng dây kẹo đen như lưới. Siro không xé hết, chỉ lách qua mắt lưới rộng nhất, dùng Cước Gió Xoáy làm lệch thân Bu Đen nửa bước. Cậu tung Chưởng Sao Băng thành nhiều tia nhỏ, cắt từng nút dây điều khiển, rồi dồn ánh sáng vào Sóng Rồng Ánh Sáng - Nụ Cười Trở Về. Lõi đen trong máy kẹo vỡ vụn, Bu Đen tan thành khói ngọt, còn Bu hiền được trả lại nụ cười.",
      "Chiều đó, Bu giúp dọn nhà máy cũ. Các bạn nhỏ đến vẽ hoa lên tường. Nhà máy sẽ thành xưởng bánh vui vẻ.",
      { type: 'image', src: "/reading/mr-saiyan/tap-10-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "Siro ăn một chiếc bánh quy hình sao. “Mạnh quá mà hết sức nhanh thì nguy hiểm thật.”",
      "Bun cười. “Vậy từ nay dùng đầu trước, dùng tóc dài sau.”",
      "Siro bật cười. Bu cũng cười. Tiếng cười lan trong xưởng, ấm như nắng.",
    ],
  },
  {
    id: "mr-saiyan-tap-11",
    title: "Tập 11: Bóng Trăng Và Khỉ Đột Vàng",
    subtitle: "Bóng Trăng Và Khỉ Đột Vàng",
    shortTitle: "Tập 11",
    lines: [
      "Tập 11: Bóng Trăng Và Khỉ Đột Vàng",
      "Khi thành phố vui trở lại, một người lạ xuất hiện ở đài thiên văn cũ. Hắn mặc áo xanh đen, nói năng như thầy pháp và luôn cho rằng mình đúng. Hắn tên là Za-mát.",
      { type: 'image', src: "/reading/mr-saiyan/tap-11-hinh-01.webp", alt: "Za-mát xuất hiện." },
      "Za-mát nhặt những mảnh hạt đen đã bay về từ các trận trước. Hắn ghép chúng vào một quả cầu ánh sáng.",
      "“Sức mạnh hoang dã của Saiyan cần bị chứng minh là nguy hiểm,” hắn nói. “Ta sẽ kéo nó ra.”",
      "Đêm đó, trên bầu trời xuất hiện một mặt trăng giả màu vàng đen. Ánh sáng của nó mạnh hơn trăng thật rất nhiều.",
      "Bố Giang nhìn lên, mặt tái đi.",
      "“Siro, đừng nhìn!”",
      "Nhưng ánh trăng giả đã tràn qua cửa sổ. Chiếc đuôi của Siro nóng rực. Cậu ôm đầu, cố quay đi.",
      "“Con... không muốn biến đổi.”",
      "Za-mát hiện trên màn hình đài thiên văn. “Nếu ngươi thật sự là người bảo vệ, hãy chứng minh ngươi làm chủ được con thú trong mình.”",
      "Siro nghiến răng. Hào quang vàng và ánh trăng giả xoáy vào nhau. Cậu biến lớn, lớn hơn Oozaru trước đây. Lông cậu chuyển thành vàng óng, mắt đỏ rực.",
      "Khỉ Đột Vàng gầm lên.",
      "GRAOOO!",
      "Tiếng gầm làm mây vỡ ra từng mảng. Mặt đất rung ầm ầm.",
      { type: 'image', src: "/reading/mr-saiyan/tap-11-hinh-02.webp", alt: "Siro đối mặt với Za-mát." },
      "Khỉ Đột Vàng Siro đứng giữa bãi đất rộng ngoài thành phố. Hai bàn tay khổng lồ siết chặt. Mỗi hơi thở thổi thành luồng gió nóng phà phà.",
      "Za-mát bay trên cao, tạo những vòng xích ánh trăng.",
      { type: 'image', src: "/reading/mr-saiyan/tap-11-hinh-03.webp", alt: "Trận chiến giữa Siro và Za-mát." },
      "“Phá đi. Hãy để mọi người thấy ngươi đáng sợ.”",
      "Siro trong dạng khổng lồ gầm lên, vung tay phải. Gió quét qua bãi đất, làm đá bay rào rào. Za-mát né lên, phóng xích xuống. Xích quấn quanh cổ tay Siro.",
      "Xẹt xẹt!",
      "Khỉ Đột Vàng giật mạnh, kéo Za-mát xuống gần mặt đất. Hắn xoay người, bắn Chưởng Trăng Đen vào ngực Siro.",
      "BÙM!",
      "Siro lùi hai bước, mỗi bước tạo hố lớn. Cơn đau làm bản năng của cậu bùng lên. Cậu há miệng, gom năng lượng vàng thành quả cầu sáng.",
      "Bố Giang hét từ xa: “Siro! Đó là hướng thành phố!”",
      "Quả cầu trong miệng Khỉ Đột Vàng run lên. Nếu bắn ra, nó sẽ phá cả khu nhà.",
      "Simi chạy ra khỏi xe cứu hộ, ôm chiếc khăn đỏ của Siro.",
      "“Anh ơi! Anh không làm đau nhà mình đâu!”",
      "Mẹ Phương giữ Simi lại, nhưng cũng gọi:",
      "“Siro, con có trái tim lớn hơn cơn giận!”",
      "Khỉ Đột Vàng run bần bật. Quả cầu sáng chập chờn. Za-mát cười lớn.",
      "“Bắn đi! Hãy chứng minh ta đúng!”",
      "Trong tâm trí mờ mịt, Siro thấy một cánh cửa. Phía sau cửa là căn bếp ấm, mẹ Phương cười, bố Giang rót nước, Simi ngồi vẽ, bạn bè gọi nhau í ới.",
      "Cậu không muốn mất điều đó.",
      "Khỉ Đột Vàng nghiến răng, ngẩng đầu lên trời. Quả cầu năng lượng bắn thẳng lên cao.",
      "ẦM VANG!",
      "Mây vàng nổ tung như pháo sáng. Thành phố an toàn.",
      "Nhưng việc đổi hướng làm Siro kiệt sức. Za-mát lao xuống, dùng xích trói cả hai tay cậu. Khỉ Đột Vàng quỳ xuống, gầm đau đớn.",
      "Za-mát chĩa tay vào Simi. “Nếu ngươi không phá thành phố, ta sẽ bắt nguồn yếu mềm của ngươi.”",
      "Khỉ Đột Vàng đột ngột im lặng.",
      "Siro nghe tiếng tim mình. Thình thịch. Thình thịch.",
      "Khỉ Đột Vàng mạnh đến mức chính Siro cũng sợ. Za-mát trói hai tay khổng lồ bằng xích trăng đen, mỗi sợi xích siết vào lông vàng và nổ xẹt xẹt. Chưởng Trăng Đen đánh trúng ngực làm cậu lùi từng bước, đầu óc mờ đi vì bản năng gào thét. Có lúc miệng cậu đã gom quả cầu năng lượng hướng về thành phố. Siro bên trong như bị nhốt sau một tấm kính, nhìn chính mình sắp làm điều không thể tha thứ.",
      "Hình thái Khỉ Đột Vàng khác Oozaru thường ở mọi điểm. Thân hình vẫn khổng lồ, nhưng lông chuyển vàng óng như lửa mặt trời. Sức mạnh không chỉ gấp lên, mà nặng và dữ hơn rất nhiều. Mắt đỏ, hơi thở nóng, mỗi bước chân làm đất rung. Nhưng khi Siro nghe Simi, trong đôi mắt đỏ ấy xuất hiện một tia sáng nhỏ. Tia sáng đó là phần người hùng đang cố nắm dây cương của bản năng.",
      { type: 'image', src: "/reading/mr-saiyan/tap-11-hinh-04.webp", alt: "Siro thức tỉnh Khỉ Đột Vàng." },
      "Sau khi kéo được trái tim trở lại, Siro đổi hướng quả cầu năng lượng lên trời. Đó là chiến thắng đầu tiên trước chính mình. Rồi cậu nghe tiếng máy trăng giả trong gió, dùng tiếng gầm đã được điều khiển thành sóng âm đánh lên bầu trời. Mặt trăng giả nứt từng đường vàng đen rồi vỡ tan. Za-mát thua không phải vì Siro phá nhiều hơn, mà vì cậu mạnh đến mức có thể không phá thứ mình yêu thương.",
      "Khỉ Đột Vàng khác Oozaru thường như mặt trời khác một ngọn đuốc. Lông khổng lồ chuyển vàng óng, hào quang vàng phủ quanh thân như lớp lửa dày, mắt đỏ sáng hơn, hơi thở nóng hơn, cơ thể mỗi lúc một nặng sức. Tóc không còn là mái tóc của cậu bé mà hòa vào bờm lông vàng dựng lên sau gáy. Khí tức làm đá nhỏ bay lạo xạo quanh chân. So với Oozaru nâu, hình thái này nhanh hơn trong những cú vồ, mạnh hơn trong từng bước, nhưng cảm xúc cũng dễ bùng nổ hơn. Za-mát cười và phóng trăng giả to hơn. Siro nghe tiếng Simi gọi, chậm lại một nhịp, dùng đuôi quét bụi che mắt địch, rồi lấy hai tay ôm tảng đá lớn chắn trước bạn bè. Khi Za-mát lao vào, Siro gầm ầm vang, đập Bàn Tay Mặt Trời xuống đất, làm máy trăng giả bật khỏi hố. Ánh trăng tắt, đội quân bóng trăng tan rã, còn Za-mát hoảng sợ lùi xa.",
      "Bố Giang ôm Siro dậy. “Con đã chạm vào sức mạnh rất nguy hiểm. Nhưng con cũng đã giữ được trái tim.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-11-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "Siro yếu ớt hỏi: “Con có làm mọi người sợ không?”",
      "Simi lắc đầu. “Em chỉ sợ anh đau.”",
      "Siro nhắm mắt, nước mắt chảy ra một giọt nhỏ.",
      "Trên đỉnh đài thiên văn, Za-mát nhặt một mảnh trăng giả còn sáng. Hắn chưa thua hẳn.",
      "“Nếu con thú không thắng, ta sẽ ép nó thành người chiến binh tối thượng.”",
    ],
  },
  {
    id: "mr-saiyan-tap-12",
    title: "Tập 12: Super Saiyan 4 Xuất Hiện",
    subtitle: "Super Saiyan 4 Xuất Hiện",
    shortTitle: "Tập 12",
    lines: [
      "Tập 12: Super Saiyan 4 Xuất Hiện",
      "Za-mát không bỏ cuộc. Hắn dựng quanh thành phố bảy mảnh trăng giả nhỏ. Chúng không đủ biến Siro thành Khỉ Đột Vàng hoàn toàn, nhưng làm sức mạnh trong người cậu rung lên dữ dội.",
      { type: 'image', src: "/reading/mr-saiyan/tap-12-hinh-01.webp", alt: "Za-mát xuất hiện." },
      "Siro sốt cao. Hào quang lúc vàng, lúc đỏ, lúc tắt phụt. Bố Giang đưa cậu đến thung lũng đá xa thành phố để tránh nguy hiểm cho mọi người.",
      "“Con không thể chạy khỏi bản năng mãi,” bố nói. “Con phải nhìn thẳng vào nó.”",
      "Siro ngồi giữa thung lũng, hai tay đặt trên đầu gối. Mẹ Phương và Simi đứng sau vòng an toàn. Bạn bè ở trạm quan sát, sẵn sàng liên lạc.",
      "Za-mát xuất hiện cùng Đội Quân Trăng Đen.",
      "“Hôm nay, ta sẽ chứng minh Saiyan chỉ là sức mạnh hoang dã.”",
      "Những chiến binh bóng tối lao xuống như mưa.",
      "Siro mở mắt. “Không. Hôm nay tôi sẽ chứng minh trái tim có thể dẫn sức mạnh.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-12-hinh-02.webp", alt: "Siro đối mặt với Za-mát." },
      "Siro bật SSJ3. Tóc vàng dài tung bay, nhưng sức mạnh trong người cậu rung loạn vì các mảnh trăng giả. Hào quang phồng lên rồi xẹp xuống.",
      "Chiến binh Trăng Đen thứ nhất chém kiếm ánh trăng từ bên phải. Siro nghiêng người né, dùng khuỷu tay trái chặn cổ tay hắn. Chiến binh thứ hai lao từ sau lưng. Siro xoay người, đá gót chân phải vào ngực hắn.",
      { type: 'image', src: "/reading/mr-saiyan/tap-12-hinh-03.webp", alt: "Trận chiến giữa Siro và Za-mát." },
      "Bốp! Rầm!",
      "Nhưng số lượng quá đông. Ba kẻ khác phóng xích trói chân Siro. Một kẻ bắn Chưởng Trăng Đen vào vai cậu.",
      "Bùm!",
      "Siro rơi xuống đất. SSJ3 tắt. Ánh trăng giả rọi vào đuôi cậu. Cơ thể cậu lại lớn dần.",
      "“Không...” Siro cố giữ.",
      "Khỉ Đột Vàng bùng lên lần nữa. Tiếng gầm làm thung lũng rung ầm ầm. Đội Quân Trăng Đen reo hò, tưởng đã thắng.",
      "Za-mát cười. “Phá đi!”",
      "Khỉ Đột Vàng vung tay, đánh bay cả hàng quân. Nhưng cậu vẫn cố tránh chỗ mẹ, Simi và các bạn. Mỗi lần bản năng muốn phá, tiếng Simi lại vang lên:",
      "“Anh Siro, hít thở!”",
      "Khỉ Đột Vàng thở mạnh. Gió cuộn thành vòng.",
      "Bố Giang bay lên trước mặt cậu, rất nhỏ so với thân hình khổng lồ.",
      "“Siro, con không cần đẩy con thú ra ngoài. Hãy nắm tay nó.”",
      "Trong tâm trí, Siro thấy mình đứng trước một Khỉ Đột Vàng khổng lồ. Nó gầm vang, nhưng trong mắt nó cũng có nỗi sợ.",
      "Siro bước tới. “Cậu là sức mạnh của mình. Nhưng mình là trái tim.”",
      "Cậu đặt tay lên bàn tay khổng lồ ấy.",
      "Bên ngoài, Khỉ Đột Vàng ngừng gầm. Hào quang vàng xoáy lại, nén dần vào thân thể. Lông vàng biến thành luồng sáng. Cơ thể khổng lồ thu nhỏ, nhưng không trở về bình thường.",
      "Đội Quân Trăng Đen khiến Siro kiệt sức bằng số đông. Kiếm ánh trăng chém tới từ trước, xích quấn chân từ sau, chưởng đen đánh vào vai liên tiếp. SSJ3 tắt phụt, còn ánh trăng giả kéo Khỉ Đột Vàng trồi lên lần nữa. Siro gầm lên, vừa đau vừa sợ. Cậu đánh bay được nhiều kẻ, nhưng càng đánh, bản năng càng muốn phá nát cả thung lũng. Nếu mất kiểm soát thêm một chút, gia đình và bạn bè sẽ phải chạy khỏi chính cậu.",
      "Super Saiyan 4 xuất hiện khi Siro không còn chống lại bản năng như kẻ thù. Trong tâm trí, cậu đặt tay lên bàn tay Khỉ Đột Vàng. Bên ngoài, thân hình khổng lồ thu nhỏ dần. Lông vàng nén thành ánh sáng, rồi lớp lông đỏ mọc trên thân và cánh tay. Tóc trở lại đen nhưng dài, dày và hoang dã hơn. Mắt có viền đỏ, đuôi vung chắc sau lưng. Khác với SSJ3 tiêu hao nhanh, SSJ4 giữ sức mạnh khổng lồ trong một cơ thể làm chủ được.",
      { type: 'image', src: "/reading/mr-saiyan/tap-12-hinh-04.webp", alt: "Siro thức tỉnh Super Saiyan 4." },
      "Siro sau khi đạt SSJ4 không còn né tránh luống cuống. Cậu bắt kiếm bằng tay trái, kéo xích của đối thủ để đổi hướng, rồi đẩy từng chiến binh ra xa mà không làm họ bị thương nặng. Khi Za-mát chém Lưỡi Liềm Trăng xuống, Siro cắm chân vào đá, đỡ bằng hai tay rồi đấm xuyên qua nó bằng Quyền Trái Đất. Cú đấm đổi hướng ở phút cuối, đánh trúng mảnh hạt đen trên gậy Za-mát. Sức mạnh hoang dã đã trở thành sức mạnh biết dừng.",
      "Super Saiyan 4 là lúc Siro biến sức mạnh hoang dã thành sức mạnh biết nghe lời. Hào quang vàng của Khỉ Đột Vàng co vào, thân khổng lồ thu nhỏ từng lớp, lông đỏ mọc trên ngực và tay, tóc trở lại màu đen nhưng dài và dày hơn. Mắt có viền đỏ, đuôi vung chắc, cơ thể gọn hơn mà vẫn chứa sức nặng khổng lồ. Khí tức đỏ vàng không nổ loạn nữa, nó cuộn thành vòng quanh chân như dòng gió mạnh. Khác với SSJ3 dễ cạn sức và Khỉ Đột Vàng dễ mất trí, SSJ4 vừa mạnh, vừa bền, vừa giữ được trái tim. Za-mát chém Lưỡi Liềm Trăng xuống đầu Siro. Cậu đứng yên, tay trái bắt mép lưỡi liềm, tay phải xoay Quyền Trái Đất. Cú đấm đi theo đường cong, không đánh vào người Za-mát mà đánh trúng hạt đen sau gáy. Hạt vỡ choang, xiềng bóng tối đứt, Za-mát ngã quỵ và đội quân của hắn buông vũ khí.",
      "Za-mát được đội cứu hộ đưa đi. Trước khi rời khỏi, hắn nhìn Siro rất lâu.",
      { type: 'image', src: "/reading/mr-saiyan/tap-12-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "“Có lẽ ta đã sai về trái tim.”",
      "Siro mỉm cười. “Sai rồi sửa được.”",
      "Simi chạy tới ôm anh, nhưng dừng lại vì lớp lông đỏ.",
      "“Anh ơi, hình thái này ôm có ngứa không?”",
      "Siro bật cười. “Thử xem.”",
      "Cả nhóm cười vang giữa thung lũng. Trên bầu trời, các mảnh trăng giả tan hết, để lại trăng thật dịu dàng.",
    ],
  },
  {
    id: "mr-saiyan-tap-13",
    title: "Tập 13: Bê-ru Và Bài Học Của Thần",
    subtitle: "Bê-ru Và Bài Học Của Thần",
    shortTitle: "Tập 13",
    lines: [
      "Tập 13: Bê-ru Và Bài Học Của Thần",
      "Sau trận Za-mát, Siro nghĩ mình đã rất mạnh. SSJ4 giúp cậu chạy nhanh như gió, nhảy cao qua núi và đẩy được những tảng đá lớn. Nhưng chính vì vậy, cậu bắt đầu hơi tự tin quá.",
      "Một buổi chiều, Siro tập đấm trên đồi. Mỗi cú đấm tạo tiếng ầm ầm. Đá vụn bay lạo xạo.",
      "“Nếu kẻ xấu nào tới, con xử lý được hết!” Siro nói.",
      "Bố Giang khoanh tay. “Câu đó nghe không giống người bảo vệ.”",
      "Siro đỏ mặt. “Con chỉ nói vậy thôi mà.”",
      "Đúng lúc ấy, bầu trời mở ra một cánh cửa sao. Một vị khách lạ bước xuống. Ông thanh mảnh, mắt sắc, áo choàng xanh tím phấp phới. Trên đầu ngón tay ông là quả cầu tím nhỏ, nhưng nó làm không khí rung ù ù.",
      "“Ta là Bê-ru,” ông nói. “Ta nghe Trái Đất có cậu bé mạnh. Ta đến thử xem cậu có xứng đáng giữ sức mạnh ấy không.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-13-hinh-01.webp", alt: "Bê-ru xuất hiện." },
      "Siro bước lên. “Nếu ông định hại Trái Đất, tôi sẽ ngăn ông.”",
      "Bê-ru ngáp. “Tốt. Nhưng nếu ngươi chỉ biết gồng và đấm, ngươi sẽ thua trong ba hơi thở.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-13-hinh-02.webp", alt: "Siro đối mặt với Bê-ru." },
      "Siro biến thành SSJ4. Hào quang đỏ vàng bùng lên. Cậu hạ thấp người, chân phải trước, nắm tay phải đặt sát hông. Ánh mắt kiên định.",
      "Bê-ru đứng thẳng, một tay để sau lưng.",
      { type: 'image', src: "/reading/mr-saiyan/tap-13-hinh-03.webp", alt: "Trận chiến giữa Siro và Bê-ru." },
      "Siro lao tới vút bay. Cậu tung Quyền Trái Đất. Nắm đấm đỏ vàng xé gió vun vút.",
      "Bê-ru chỉ nghiêng người nửa bước. Cú đấm trượt qua. Ông gõ nhẹ một ngón tay vào trán Siro.",
      "Cốc!",
      "Siro bay ngược, rơi xuống bãi cỏ.",
      "“Một hơi thở,” Bê-ru nói.",
      "Siro bật dậy, hơi quê. Cậu lao vòng sang trái, giả vờ đấm, rồi xoay người đá chân phải. Bê-ru cúi đầu né, dùng cùi chỏ chạm nhẹ vào đầu gối Siro.",
      "Bốp!",
      "Cả chân Siro tê rần. Cậu mất thăng bằng.",
      "“Hai hơi thở.”",
      "Siro tức lên. Hào quang bùng lớn hơn. Cậu bắn Chưởng Sao Băng khắp bầu trời. Hàng trăm chùm sáng vàng đỏ bay vèo vèo.",
      "Bê-ru đi giữa mưa chưởng như đi trong mưa phùn. Ông xoay cổ tay, từng chùm sáng lệch sang hai bên, nổ xa khỏi đồi.",
      "“Ba hơi thở.”",
      "Bê-ru xuất hiện trước mặt Siro, đặt lòng bàn tay lên ngực cậu. Một lực vô hình đẩy Siro xuống đất.",
      "Rầm!",
      "Siro không bị thương nặng, nhưng cậu không đứng lên nổi. Sức mạnh của Bê-ru không ồn ào. Nó sâu và yên như biển đêm.",
      "Bê-ru nói: “Ngươi có sức mạnh. Nhưng trong lòng ngươi đang ầm ầm. Thần lực không vào được một chiếc bình đang lắc.”",
      "Bê-ru đánh Siro ngã mà gần như không cần dùng sức. Một cái gõ nhẹ vào trán làm cậu bay lăn trên cỏ. Một cú chạm vào đầu gối khiến chân cậu tê rần. Khi Bê-ru đặt tay lên ngực, Siro bị ép xuống đất như có cả bầu trời đè lên. SSJ4 tắt dần, hơi thở nghẹn lại. Cậu không bị thương nặng như những trận trước, nhưng cảm giác thất bại còn sâu hơn: mọi sức mạnh ồn ào của cậu đều không chạm được vào vị thần.",
      "Super Saiyan God không đến bằng tiếng nổ. Nó đến bằng sự yên lặng. Hào quang đỏ xuất hiện mỏng như ánh bình minh, rồi thấm vào cơ thể thay vì bùng ra ngoài. Tóc Siro chuyển đỏ, mắt cũng đỏ, cơ thể trông thon gọn hơn chứ không đồ sộ hơn. Khác với SSJ4 đỏ vàng hoang dã, SSG nhẹ, sâu và yên; khí tức như ngọn lửa nhỏ nhưng không tắt trong gió.",
      { type: 'image', src: "/reading/mr-saiyan/tap-13-hinh-04.webp", alt: "Siro thức tỉnh Super Saiyan God." },
      "Khi thử lại, Siro không lao thẳng như trước. Cậu bước một bước thật nhẹ, rồi biến mất như tia lửa. Mỗi cú đánh đều ngắn và đúng chỗ: một đấm vào khoảng trống, một xoay vai để tránh phản đòn, một chạm vào bên sườn làm Bê-ru lùi nửa bước. Chỉ một nửa bước ấy là chiến thắng của bài học. Siro hiểu rằng hình thái Thần không làm cậu to hơn, mà làm cậu chính xác, bình tĩnh và khiêm nhường hơn.",
      "Super Saiyan God làm Siro khác đi bằng sự yên. Hào quang đỏ mỏng như lụa sáng, tóc đỏ gọn, mắt đỏ trong, cơ thể thon nhẹ chứ không đồ sộ. Khí tức gần như không ồn, chỉ ấm đều quanh da. So với SSJ4, SSG không dựa vào sức nặng hoang dã mà dựa vào cảm nhận tinh tế: Siro nghe được nhịp gió, nhịp cỏ, cả khoảng trống trước khi Bê-ru ra đòn. Trong lòng cậu bớt muốn chứng minh mình mạnh. Bê-ru chạm ngón tay xuống, tạo vòng hủy diệt tím. Siro bước nghiêng đúng một nửa bàn chân, để vòng tím trượt qua áo, rồi đặt hai ngón tay đỏ lên mép năng lượng làm nó tản ra như khói. Cậu phản công bằng Cú Đấm Lửa Thần rất ngắn, dừng trước ngực Bê-ru một tấc. Bê-ru lùi nửa bước, mỉm cười nhận thua bài học, vì Siro đã thắng sự nóng nảy của chính mình.",
      "Bê-ru ngồi ăn bánh chuối mẹ Phương làm. Ông nhai chậm, mắt sáng lên.",
      { type: 'image', src: "/reading/mr-saiyan/tap-13-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "“Trái Đất có món này thì đáng bảo vệ đấy.”",
      "Simi thì thầm với Siro: “Vị thần này thích bánh hơn đánh nhau.”",
      "Siro cười khẽ. Bê-ru giả vờ không nghe, nhưng lấy thêm một miếng.",
      "Trước khi đi, Bê-ru nói: “Hạt đen đang lớn. Sức mạnh Thần sẽ cần thiết. Nhưng nhớ, càng mạnh càng phải hiền.”",
    ],
  },
  {
    id: "mr-saiyan-tap-14",
    title: "Tập 14: Ngọn Lửa Đỏ Của Super Saiyan God",
    subtitle: "Ngọn Lửa Đỏ Của Super Saiyan God",
    shortTitle: "Tập 14",
    lines: [
      "Tập 14: Ngọn Lửa Đỏ Của Super Saiyan God",
      "Bê-ru vừa rời đi thì bầu trời báo động. Một thiên thạch khổng lồ đang lao về phía thành phố biển. Nó không phải đá thường. Bên trong nó có mảnh hạt đen lớn, biến nó thành Quái Vật Sao Băng Đỏ.",
      { type: 'image', src: "/reading/mr-saiyan/tap-14-hinh-01.webp", alt: "Quái Vật Sao Băng Đỏ xuất hiện." },
      "Nếu nó rơi xuống, sóng lớn sẽ đánh vào bờ. Nhà cửa, trường học và khu chợ cá sẽ gặp nguy hiểm.",
      "Siro đứng trên vách đá nhìn ra biển. Gió mặn thổi ào ào. Sóng đập vào đá ầm ầm.",
      "Bun nói qua máy tính bảng: “Thiên thạch quá lớn. Nếu phá nổ trên trời, mảnh vỡ vẫn rơi xuống thành phố.”",
      "Minh Trí thêm: “Phải đẩy nó lệch ra biển xa, rồi làm nguội lõi.”",
      "Siro gật đầu. “Vậy mình không phá. Mình dẫn nó đi.”",
      "Bố Giang nhìn con trai. “Đây là trận chiến bảo vệ, không phải trận chiến khoe sức.”",
      "Siro biến thành Super Saiyan God. Tóc đỏ, mắt đỏ, hào quang ấm và yên.",
      "“Con hiểu.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-14-hinh-02.webp", alt: "Siro đối mặt với Quái Vật Sao Băng Đỏ." },
      "Siro bay lên trời. Cậu không để lại tiếng nổ lớn như SSJ4. Hào quang đỏ kéo thành vệt sáng mỏng, vun vút xuyên qua mây.",
      "Quái Vật Sao Băng Đỏ mở mắt trong khối đá. Nó gầm:",
      { type: 'image', src: "/reading/mr-saiyan/tap-14-hinh-03.webp", alt: "Trận chiến giữa Siro và Quái Vật Sao Băng Đỏ." },
      "“Rơi! Đốt! Nghiền!”",
      "Từ thân nó, các mảnh đá lửa bắn ra như mưa. Siro nghiêng người né mảnh đầu tiên. Mảnh thứ hai lao tới từ dưới. Cậu xoay người trên không, dùng khuỷu tay phải chặn.",
      "Ầm!",
      "Đá vỡ thành tia lửa. Mảnh thứ ba hướng về bờ biển. Siro phóng theo, dùng lòng bàn tay trái đẩy nhẹ nhưng đúng góc, làm nó rơi xuống vùng nước trống.",
      "Xèo!",
      "Hơi nước bốc lên trắng xóa.",
      "Quái vật lao nhanh hơn. Siro bay trước mặt nó, hai tay đưa ra.",
      "“Khiên Lửa Thần!”",
      "Một tấm khiên đỏ trong suốt hiện lên. Thiên thạch va vào khiên:",
      "ẦM ẦM ẦM!",
      "Siro bị đẩy lùi trên bầu trời. Mây tách làm hai. Cả cơ thể cậu run lên, nhưng SSG tự chữa lành những vết xước nhỏ trên tay.",
      "Dưới biển, tàu cá vẫn chưa kịp đi xa. Nếu Siro đẩy thiên thạch lệch xuống đó, tàu sẽ gặp nguy.",
      "Bun hét: “Siro, hướng bắc có vùng biển trống!”",
      "Siro nghiêng khiên sang phải để đổi hướng. Thiên thạch rít lên, trượt dần về phía bắc. Nhưng Quái Vật Sao Băng Đỏ thò cánh tay đá ra, túm lấy Siro.",
      "Rắc!",
      "Cánh tay đá siết quanh người cậu. Hào quang đỏ bị ép mờ đi.",
      "“Nóng! Nghiền!”",
      "Siro bị kéo sát vào lõi đỏ đen. Sức nóng làm hơi thở cậu khô lại. Cậu cố gỡ tay đá, nhưng nếu tung chưởng mạnh, thiên thạch sẽ vỡ ngay trên thành phố.",
      "Đây là lúc cậu gần như không có đường nào.",
      "Trên bờ, Simi cùng các bạn đứng trong khu an toàn. Simi ôm vỏ sò và nói qua bộ đàm:",
      "“Anh ơi, biển cũng là nhà của mình. Đừng để biển đau nhé.”",
      "Quái Vật Sao Băng Đỏ siết Siro trong cánh tay đá nóng rực. Càng vùng vẫy, cậu càng bị kéo sát vào lõi đỏ đen. Hơi nóng làm mắt cay, cổ họng khô, áo cháy xém ở mép. Nếu dùng chưởng mạnh, thiên thạch có thể vỡ trên thành phố; nếu không làm gì, nó sẽ rơi xuống biển gần tàu cá. Siro bị mắc kẹt giữa hai lựa chọn khó, đau đến mức hai tay gần như mất cảm giác.",
      "SSG trong trận này bộc lộ khả năng khác trước. Hào quang đỏ không chỉ giúp Siro nhanh và nhẹ, mà còn có thể làm dịu vết nứt năng lượng. Khi cậu đặt tay lên đá, ánh đỏ trở nên mềm như lửa trong bếp nhà, không đốt mà sưởi. Những vết xước nhỏ trên tay cậu tự lành chậm, đủ để cậu tiếp tục giữ thiên thạch. Hình thái Thần lúc này giống một người chữa lành hơn một chiến binh.",
      { type: 'image', src: "/reading/mr-saiyan/tap-14-hinh-04.webp", alt: "Siro thức tỉnh Super Saiyan God." },
      "Siro đưa Ngọn Lửa Chữa Lành vào lõi thiên thạch, làm mảnh hạt đen yếu đi và khiến cánh tay đá nới lỏng. Ngay khi thoát ra, cậu không bay xa mà xoay lên phía trên thiên thạch, chọn góc đấm thật chuẩn. Cú Đấm Lửa Thần đánh chéo, đổi hướng rơi ra vùng biển trống. Sau đó, Sóng Rồng Ánh Sáng đỏ bao quanh khối đá, làm nó vỡ thành những viên đá nhỏ mát lạnh thay vì nổ tung. Siro thắng bằng cách cứu cả thành phố lẫn biển.",
      "SSG chữa lành và bảo hộ không đổi màu tóc hay mắt so với SSG trước đó, nhưng đổi mục đích của năng lượng Thần. Hào quang đỏ mềm hơn, ôm quanh cơ thể như lớp chăn ấm. Tóc đỏ bớt dựng, mắt đỏ dịu hơn, khí tức không ép ra ngoài mà thấm vào đá nứt và vết xước trên tay. Cơ thể Siro vẫn đau, nhưng các vết rát nhỏ khép lại chậm để cậu tiếp tục giữ thiên thạch. Cảm xúc trong lòng cậu cũng đổi khác: thay vì muốn thắng thật nhanh, Siro chỉ nghĩ làm sao để không ai bị thương. Khác với SSG chiến đấu, dạng này mạnh ở khả năng cứu hộ và điều chỉnh sức mạnh. Quái Vật Sao Băng Đỏ siết cậu bằng tay đá nóng. Siro thở sâu, đưa Ngọn Lửa Chữa Lành vào khớp đá, làm nó dịu đi rồi nới lỏng. Cậu bay vòng lên trên, chọn góc không làm đá rơi vào thành phố, tung Cú Đấm Lửa Thần chéo xuống. Thiên thạch đổi hướng vút ra biển, Sóng Rồng Ánh Sáng Đỏ bao quanh và tách nó thành mưa sao mát lạnh. Quái vật mất lõi, vỡ thành đá hiền.",
      "Người dân bãi biển reo vui. Những viên đá nhỏ từ thiên thạch được gom lại làm bờ kè mới cho bãi biển.",
      { type: 'image', src: "/reading/mr-saiyan/tap-14-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "Siro đáp xuống cát, mệt nhưng cười.",
      "Simi đưa cho anh một vỏ sò. “Phần thưởng của người bảo vệ biển.”",
      "Siro áp vỏ sò lên tai. Tiếng sóng rì rào như nói cảm ơn.",
      "Ở rất xa, dưới lòng đất, một rễ cây đen nhỏ dài thêm một chút.",
    ],
  },
  {
    id: "mr-saiyan-tap-15",
    title: "Tập 15: Bờ-lách Và Bầu Trời Đen",
    subtitle: "Bờ-lách Và Bầu Trời Đen",
    shortTitle: "Tập 15",
    lines: [
      "Tập 15: Bờ-lách Và Bầu Trời Đen",
      "Một buổi chiều, bầu trời thành phố bỗng đen lại ở giữa ban ngày. Không phải mây mưa. Đó là một vết xoáy bóng tối. Từ trong vết xoáy, một cậu bé bước ra.",
      "Cậu ta có dáng giống Siro. Tóc gai đen. Đôi mắt sắc. Nhưng trang phục đen tím, nụ cười lạnh, và quanh người là hào quang hồng đen.",
      "“Ta là Bờ-lách,” cậu ta nói. “Ta là phiên bản mạnh hơn của ngươi. Không cần gia đình. Không cần bạn bè.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-15-hinh-01.webp", alt: "Bờ-lách xuất hiện." },
      "Siro đứng trên mái nhà đối diện, lòng chấn động. Nhìn Bờ-lách giống như nhìn cái bóng của chính mình.",
      "Bun nói qua bộ đàm: “Cậu ấy sinh ra từ năng lượng hạt đen phản chiếu sức mạnh của cậu!”",
      "Bờ-lách giơ tay. Bóng tối tràn xuống đường phố, làm mọi người buồn bã và sợ hãi. Các cửa sổ mờ đi. Tiếng còi xe cũng nhỏ lại.",
      "“Trái Đất yếu vì có quá nhiều tình cảm,” Bờ-lách nói. “Ta sẽ cắt hết.”",
      "Siro nắm tay. “Tình cảm không làm tôi yếu.”",
      "Bờ-lách mỉm cười. “Vậy chứng minh đi.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-15-hinh-02.webp", alt: "Siro đối mặt với Bờ-lách." },
      "Siro biến thành Super Saiyan God. Tóc đỏ, mắt đỏ, hào quang dịu. Cậu đứng ở mép mái nhà, hai chân vững, tay phải mở ra.",
      "Bờ-lách cũng bùng hào quang hồng đen. Hắn lao tới vút, nhanh ngang Siro. Hai nắm đấm va nhau.",
      { type: 'image', src: "/reading/mr-saiyan/tap-15-hinh-03.webp", alt: "Trận chiến giữa Siro và Bờ-lách." },
      "ẦM!",
      "Sóng khí thổi bật ăng-ten và làm mây đen xoáy mạnh.",
      "Siro lùi nửa bước. Bờ-lách cười. “Ngươi chậm vì còn lo cho mọi người bên dưới.”",
      "Hắn phóng Lưỡi Kiếm Bóng Tối từ tay phải. Thanh kiếm dài, hồng đen, rít lên xẹt xẹt. Siro nghiêng người né, nhưng lưỡi kiếm cắt qua mái nhà phía sau, làm gạch rơi xuống đường.",
      "Siro lao xuống, đỡ gạch bằng hai tay rồi đặt nhẹ xuống đất. Bờ-lách xuất hiện sau lưng, đá vào vai cậu.",
      "Rầm!",
      "Siro bị đánh xuyên qua biển quảng cáo. Cậu rơi xuống đường, bụi bay mù.",
      "Bờ-lách đáp xuống. “Thấy chưa? Bảo vệ làm ngươi chậm.”",
      "Bờ-lách không chỉ đánh vào cơ thể Siro, mà đánh vào tim cậu. Dây bóng tối kéo Siro lên giữa vết xoáy, siết tay chân đến tê cứng. Những hình ảnh giả hiện ra: mẹ buồn, bố thất vọng, Simi khóc, bạn bè quay lưng. Siro biết chúng không thật, nhưng tim vẫn đau như bị bóp chặt. Hào quang SSG đỏ mờ dần. Cậu rơi vào bóng tối vài giây, không nghe tiếng phố, không thấy bầu trời.",
      "Super Saiyan Blue sinh ra khi năng lượng Thần đỏ hòa với sức mạnh Super Saiyan. Trước hết, ánh đỏ quanh Siro co lại thành một lõi sáng trong ngực. Sau đó màu xanh lam lan ra như nước mát, phủ lên tóc, mắt và hào quang. Tóc chuyển xanh, mắt xanh sâu, khí tức không nóng như SSJ1 và không ồn như SSJ2. Khác với SSG nhẹ như lửa, SSB ổn định hơn, mạnh hơn và bình tĩnh hơn giữa cảm xúc.",
      { type: 'image', src: "/reading/mr-saiyan/tap-15-hinh-04.webp", alt: "Siro thức tỉnh Super Saiyan Blue." },
      "Siro xé dây bóng tối bằng hai tay, nhưng không để cơn giận kéo mình vào đánh bừa. Khi Bờ-lách chém kiếm hồng đen, cậu dựng Khiên Ánh Sáng Saiyan Xanh. Kiếm nứt trong tiếng choang. Siro đá vào cổ tay đối thủ để làm rơi vũ khí, rồi gọi Sóng Rồng Xanh cuốn vết xoáy đen trên trời. Ánh nắng không chỉ phá bóng tối; nó cũng chứng minh rằng Siro khác Bờ-lách vì cậu chọn được tình yêu thay cho cô độc.",
      "Super Saiyan Blue bắt đầu bằng sự hòa trộn. Lõi đỏ của SSG co vào tim, rồi ánh xanh lam lan ra từ ngực đến tóc, mắt và hào quang. Tóc xanh dựng gọn, mắt xanh sâu như bầu trời sau mưa, cơ thể nhẹ nhưng chắc, khí tức mát và đều. So với SSG đỏ yên lặng, SSB có thêm sức tấn công của Super Saiyan nhưng vẫn giữ bình tĩnh của năng lượng Thần. Siro thấy trong lòng còn đau vì những ảo ảnh, nhưng cậu không để nỗi đau điều khiển. Bờ-lách lao tới bằng kiếm hồng đen, tốc độ như bóng đêm xé gió. Siro dùng Bước Chớp Xanh né sang phải, dựng Khiên Ánh Sáng Saiyan Xanh bằng tay trái, rồi đá xoay vào cổ tay hắn. Kiếm văng choang, bóng tối nứt ra. Sóng Rồng Xanh cuốn qua bầu trời, phá vết xoáy đen. Bờ-lách bị đẩy khỏi tầng mây, mất áo giáp bóng tối và phải rút lui trong ánh nắng.",
      "Ánh nắng trở lại. Người dân mở cửa sổ. Chim lại hót.",
      { type: 'image', src: "/reading/mr-saiyan/tap-15-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "Siro nhìn cái bóng của mình trên đường. Nó bình thường, nhỏ và hiền.",
      "Bố Giang nói: “Con vừa gặp một kẻ giống con bên ngoài, nhưng khác con bên trong.”",
      "Siro gật đầu. “Con sẽ nhớ. Mình là ai không do khuôn mặt quyết định.”",
    ],
  },
  {
    id: "mr-saiyan-tap-16",
    title: "Tập 16: Super Saiyan Blue Và Trận Chiến Không Trung",
    subtitle: "Super Saiyan Blue Và Trận Chiến Không Trung",
    shortTitle: "Tập 16",
    lines: [
      "Tập 16: Super Saiyan Blue Và Trận Chiến Không Trung",
      "Bờ-lách không chịu thua. Hắn học cách điều khiển bóng tối thành hàng trăm lưỡi kiếm bay. Lần này, hắn không đứng dưới đất. Hắn kéo trận chiến lên trời, nơi Siro phải vừa bay vừa bảo vệ máy bay, chim trời và các tòa nhà bên dưới.",
      { type: 'image', src: "/reading/mr-saiyan/tap-16-hinh-01.webp", alt: "Bờ-lách xuất hiện." },
      "Buổi sáng, khi cả nhóm đang thả diều ở bãi cỏ, bầu trời mở ra những vết cắt đen.",
      "Xoẹt! Xoẹt!",
      "Những lưỡi kiếm bóng tối rơi xuống như mưa. Siro bật SSB ngay lập tức, tóc xanh lam sáng rực.",
      "“Mọi người xuống hầm trú an toàn!”",
      "Bờ-lách xuất hiện trên mây. “Lên đây, Siro. Nếu ngươi không lên, kiếm của ta sẽ rơi xuống.”",
      "Siro nhìn lên. Trận chiến không trung rất nguy hiểm. Cậu phải theo Bờ-lách, nhưng không thể quên mặt đất.",
      "Minh Trí mở bản đồ bay trên máy tính. Bun chỉnh bộ đàm. Bơ, Kem, Mimi, Gạo và Phúc Hưng đưa người dân vào nơi an toàn. Simi nắm tay mẹ Phương, nhìn lên trời.",
      "“Anh ơi, tụi em ở dưới này giúp anh.”",
      "Siro mỉm cười. “Anh nghe rõ.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-16-hinh-02.webp", alt: "Siro đối mặt với Bờ-lách." },
      "Siro bay lên xuyên qua mây. Hào quang xanh lam để lại vệt sáng mát mắt. Cậu dừng giữa bầu trời, chân hơi co, hai tay nắm trước ngực.",
      "Bờ-lách giơ hai tay. Hàng chục lưỡi kiếm bóng tối xếp thành vòng.",
      { type: 'image', src: "/reading/mr-saiyan/tap-16-hinh-03.webp", alt: "Trận chiến giữa Siro và Bờ-lách." },
      "“Vũ Điệu Kiếm Đen.”",
      "Kiếm lao tới vun vút. Siro nghiêng người né hai thanh đầu. Thanh thứ ba bay ngang mặt, cậu dùng cổ tay phải gạt lệch. Thanh thứ tư từ dưới đâm lên, cậu xoay người trên không, đá bằng gót chân trái.",
      "Choang!",
      "Kiếm vỡ thành khói.",
      "Bờ-lách tự mình lao tới, cầm thanh kiếm dài nhất. Hắn chém từ trên xuống. Siro dựng Khiên Ánh Sáng Saiyan Xanh.",
      "ẦM!",
      "Sóng xung kích đẩy mây tản ra. Bên dưới, một chiếc máy bay nhỏ rung lắc. Bun hét:",
      "“Siro, hướng tây có máy bay! Đừng đẩy sóng về đó!”",
      "Siro đổi góc khiên, đẩy lực nổ lên cao. Bờ-lách lợi dụng khoảnh khắc ấy, đá vào bụng Siro.",
      "Bốp!",
      "Siro rơi xuống xuyên qua tầng mây. Hắn kịp dừng lại trước khi chạm mái nhà, nhưng hàng chục lưỡi kiếm đã lao theo.",
      "Phúc Hưng hét từ dưới: “Bọn mình đã sơ tán đường số ba! Cậu có thể dẫn kiếm xuống đó!”",
      "Siro hiểu ngay. Cậu bay thấp theo con đường trống. Kiếm đen đuổi sau lưng vèo vèo, cắt gió lạnh buốt. Siro bay sát mặt đường, nghiêng trái qua cột đèn, lộn vòng qua cầu vượt, rồi bất ngờ bay thẳng lên.",
      "Những lưỡi kiếm không kịp đổi hướng, đâm vào lớp khiên năng lượng mà Bun bật từ thiết bị cũ của Xen Mắc.",
      "Choang choang choang!",
      "Kiếm vỡ.",
      "Trên bầu trời, Bờ-lách ép Siro đến giới hạn bằng Kiếm Đêm Khổng Lồ. Thanh kiếm đè xuống, nặng như cả tầng mây đen. Hai tay Siro run lên, hào quang xanh bị ép thành những tia mỏng. Cậu bị đá vào bụng, rơi xuyên qua mây, rồi phải bay ngược lên ngay để chắn tiếp cho mặt đất. Mỗi lần cậu nhìn xuống nơi gia đình trú ẩn, Bờ-lách lại tận dụng khoảnh khắc ấy để đánh thêm một đòn.",
      "SSB Trời Quang không phải một màu xanh mới, mà là SSB được Siro làm trong hơn. Hào quang xanh lam vốn cháy quanh người chuyển thành lớp ánh sáng trong như nước. Tóc xanh vẫn dựng, mắt xanh vẫn sáng, nhưng cơ thể cậu nhẹ hơn khi bay. Hơi thở hòa với gió, các chuyển động ít tốn sức hơn. Khác với SSB lần đầu dùng để phá bóng tối, trạng thái này giúp Siro chiến đấu lâu trong không trung mà không mất bình tĩnh.",
      { type: 'image', src: "/reading/mr-saiyan/tap-16-hinh-04.webp", alt: "Siro thức tỉnh SSB Trời Quang." },
      "Siro trượt Kiếm Đêm sang bên thay vì đỡ cứng. Cậu bay dọc thân kiếm, dùng tốc độ mới để xoay ba vòng trên không. Cước Xanh Lốc Trời tạo thành vòng gió xanh, bẻ vụn lưỡi kiếm thành những mảnh sáng an toàn. Khi áp sát Bờ-lách, Siro khóa cổ tay hắn bằng tay trái, tay phải gọi Sóng Rồng Xanh - Trời Quang. Rồng xanh cuốn mây đen vào một điểm, mở lại bầu trời. Lần này Siro thắng bằng khả năng bay đúng hướng giữa rất nhiều thứ phải lo.",
      "SSB Trời Quang là SSB được làm trong đến tận hơi thở. Hào quang xanh lam trở nên mỏng và sáng, tóc xanh vẫn dựng nhưng ít bốc lửa hơn, đôi mắt xanh nhìn xa hơn qua mây. Cơ thể Siro nhẹ đi, khí tức hòa với gió nên mỗi lần bay không còn tốn sức như trước. Khác với SSB đầu tiên dùng để phá bóng tối trên mặt đất, trạng thái này mạnh ở tốc độ không trung, khả năng đổi hướng và giữ sức bền khi phải bảo vệ cả thành phố phía dưới. Bờ-lách phóng Kiếm Đêm thành mười mảnh lao xuống như mưa. Siro bay vèo vèo giữa các mảnh kiếm, dùng Cước Xanh Lốc Trời đẩy năm mảnh lên cao, Khiên Xanh chặn ba mảnh, rồi Chưởng Sao Băng Xanh bắn lệch hai mảnh cuối. Khi Bờ-lách lao vào đòn chót, Siro vòng ra sau, khóa cổ tay hắn và tung Sóng Rồng Xanh - Trời Quang. Mây đen bị cuộn sạch, Bờ-lách rơi xuống bãi cỏ, không còn sức gọi kiếm.",
      "Khi Siro đáp xuống bãi cỏ, chiếc diều của Simi vẫn còn bay. Nó có hình ngôi sao vàng.",
      { type: 'image', src: "/reading/mr-saiyan/tap-16-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "Simi đưa dây diều cho anh. “Anh giữ thử đi.”",
      "Siro cầm dây. Diều bay cao, nhưng vẫn nối với mặt đất bằng một sợi dây nhỏ.",
      "Bố Giang nói: “Người hùng cũng vậy. Bay cao, nhưng đừng quên điều giữ mình đúng hướng.”",
      "Siro nhìn bầu trời trong xanh và gật đầu.",
    ],
  },
  {
    id: "mr-saiyan-tap-17",
    title: "Tập 17: Mô-rô Kẻ Hút Năng Lượng Trái Đất",
    subtitle: "Mô-rô Kẻ Hút Năng Lượng Trái Đất",
    shortTitle: "Tập 17",
    lines: [
      "Tập 17: Mô-rô Kẻ Hút Năng Lượng Trái Đất",
      "Mùa hè năm ấy, cây cối bỗng héo nhanh. Nước sông thấp xuống. Đất trong vườn nhà Siro nứt thành những đường nhỏ. Không chỉ thành phố, nhiều nơi trên Trái Đất cũng mất dần sức sống.",
      "Bun đặt máy đo lên đất. Kim đồng hồ tụt xuống.",
      "“Năng lượng của hành tinh đang bị hút.”",
      "Ở một vùng núi xa, Mô-rô đứng giữa vòng tròn đen. Hắn có cặp sừng cong và đôi mắt sâu. Hai bàn tay hắn kéo những dòng sáng xanh từ lòng đất lên.",
      { type: 'image', src: "/reading/mr-saiyan/tap-17-hinh-01.webp", alt: "Mô-rô xuất hiện." },
      "“Trái Đất giàu sức sống,” hắn nói. “Ta sẽ uống cạn.”",
      "Mảnh hạt đen lớn nằm trong cây gậy của Mô-rô. Mỗi lần hắn hút năng lượng, rễ đen dưới lòng đất lại dài thêm.",
      "Siro bay đến. Cậu thử biến thành SSB, nhưng vừa bùng hào quang xanh, Mô-rô đã hút mất một phần.",
      "“Năng lượng càng lớn, ta càng thích,” Mô-rô cười.",
      "Bố Giang nói qua bộ đàm: “Đừng đổ thêm nước vào chiếc bình bị thủng. Con phải tìm cách chiến đấu mà không phô năng lượng ra ngoài.”",
      "Siro nhìn cánh rừng đang héo. Cậu siết tay. “Con sẽ lắng nghe Trái Đất.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-17-hinh-02.webp", alt: "Siro đối mặt với Mô-rô." },
      "Siro đứng trên mỏm đá, tóc trở lại đen. Cậu không biến hình. Hai tay buông nhẹ. Hai chân mở vừa phải. Gió thổi áo xanh cam phấp phới.",
      "Mô-rô vung gậy. Hàng chục rễ đen phóng lên từ đất rào rào.",
      { type: 'image', src: "/reading/mr-saiyan/tap-17-hinh-03.webp", alt: "Trận chiến giữa Siro và Mô-rô." },
      "Siro nhảy sang phải tránh rễ thứ nhất. Rễ thứ hai quét ngang. Cậu cúi thấp. Rễ thứ ba đâm từ sau lưng. Cậu cảm thấy luồng gió đổi trước khi nhìn thấy, liền nghiêng vai né.",
      "“Không dùng sức mạnh à?” Mô-rô cười. “Vậy ngươi càng dễ thua.”",
      "Hắn phóng quả cầu hút năng lượng. Siro bay lên, nhưng quả cầu đuổi theo. Cậu xoay người, lộn vòng qua vách đá rồi đáp xuống rừng.",
      "Mô-rô đập gậy. Cả khu rừng rung ầm ầm. Năng lượng xanh bị kéo ra khỏi lá cây. Siro cảm thấy chân mình nặng hơn.",
      "Cậu bật SSB trong khoảnh khắc để lao tới. Nhưng Mô-rô mở bàn tay.",
      "“Hút!”",
      "Hào quang xanh của Siro bị kéo thành sợi dài. Cậu đau nhói, rơi xuống đất.",
      "Rầm!",
      "Mô-rô bước tới, hút tiếp. Tóc xanh của Siro tắt dần, trở lại đen. Cậu không đứng nổi.",
      "“Sức mạnh của ngươi sẽ nuôi ta. Năng lượng Trái Đất cũng vậy.”",
      "Siro áp lòng bàn tay xuống đất. Đất khô, nhưng sâu bên dưới vẫn còn nhịp rung rất nhỏ. Thình... thình...",
      "Mô-rô hút SSB của Siro như hút nước khỏi dòng suối. Tóc xanh tắt dần, hào quang bị kéo thành sợi, cơ thể cậu lạnh và nặng. Siro rơi xuống nền đất khô, lưng đập mạnh, bụi bốc lên mù. Rễ đen quất vào vai và chân, để lại cảm giác đau rát. Cậu cố bật dậy nhưng bàn tay chỉ cào vào đất nứt. Trong vài giây, Siro gần như ngất đi, chỉ còn nghe nhịp rất nhỏ từ dưới lòng đất.",
      "Bản Năng Vô Cực - Điềm Báo đến khi Siro ngừng ép cơ thể phải mạnh hơn. Tóc vẫn đen nhưng dựng nhẹ, mắt chuyển bạc như phản chiếu ánh trăng. Hào quang bạc mỏng phủ quanh người như sương, khác hoàn toàn với xanh lam của SSB hay vàng của Super Saiyan. Nó không bùng nổ; nó lắng nghe. Cảm xúc của Siro cũng lặng xuống, không trống rỗng mà rộng ra để nghe Trái Đất thở.",
      { type: 'image', src: "/reading/mr-saiyan/tap-17-hinh-04.webp", alt: "Siro thức tỉnh Bản Năng Vô Cực Điềm Báo." },
      "Sau khi thức tỉnh UI Sign, Siro né đòn trước cả khi kịp nghĩ. Rễ đen vừa nhúc nhích, vai cậu đã nghiêng. Quả cầu xanh vừa đổi hướng, chân cậu đã bước chéo. Nhưng đòn đánh của cậu chưa đủ mạnh, nên Siro chọn cách thắng khác: dùng Bước Chớp Bạc đặt các viên đá khóa quanh vòng tròn hút năng lượng. Mô-rô mất nguồn hút, còn năng lượng xanh chảy ngược về đất. Đó là chiến thắng của sự lắng nghe, không phải của cú đấm cuối.",
      "UI Sign khác mọi hình thái trước vì nó không bắt đầu bằng việc gồng mạnh. Hào quang bạc mỏng hiện quanh vai như sương, tóc đen dựng nhẹ, mắt bạc mở ra, cơ thể tự thả lỏng sau khi đã kiệt sức. Khí tức của Siro gần như biến mất khỏi cảm giác của Mô-rô, vì nó hòa vào nhịp Trái Đất. So với SSB xanh mạnh và ổn định, UI Sign chưa đánh thật nặng nhưng né nhanh đến mức ý nghĩ cũng không đuổi kịp. Trong lòng Siro không trống rỗng; cậu lắng nghe tiếng đất khô kêu cứu. Mô-rô phóng rễ đen từ bốn phía. Vai Siro nghiêng trước khi mắt nhìn thấy rễ, chân trái bước chéo, tay phải đặt viên đá khóa thứ nhất. Cứ mỗi lần né, cậu lại đặt thêm một viên đá. Khi vòng khóa đủ bảy điểm, Siro chạm tay xuống đất. Năng lượng bị hút chảy ngược, rễ đen rụng rào rào, Mô-rô khụy xuống vì không còn nguồn để nuốt.",
      "Mưa nhỏ rơi xuống rừng. Những chiếc lá héo không xanh lại ngay, nhưng giọt nước đọng trên cành như lời hứa.",
      { type: 'image', src: "/reading/mr-saiyan/tap-17-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "Siro ngồi cạnh một mầm cây.",
      "Simi hỏi: “Anh có nghe cây nói không?”",
      "Siro cười. “Không bằng lời. Nhưng anh nghe cây đang cố sống.”",
      "Bố Giang nhìn về đường chân trời. “Mô-rô chưa xong. Và rễ đen đã ở rất sâu.”",
    ],
  },
  {
    id: "mr-saiyan-tap-18",
    title: "Tập 18: Đôi Mắt Bạc Và Bản Năng Vô Cực",
    subtitle: "Đôi Mắt Bạc Và Bản Năng Vô Cực",
    shortTitle: "Tập 18",
    lines: [
      "Tập 18: Đôi Mắt Bạc Và Bản Năng Vô Cực",
      "Mô-rô trở lại nhanh hơn mọi người nghĩ. Hắn cắm bảy cột hút năng lượng quanh một hố sâu dẫn xuống lòng đất. Bảy bóng quái vật canh giữ bảy cột. Mỗi bóng có hình dạng khác nhau: chim đen, bò đá, rắn khói, cá sét, người cây, nhện lửa và khổng lồ đất.",
      { type: 'image', src: "/reading/mr-saiyan/tap-18-hinh-01.webp", alt: "Mô-rô xuất hiện." },
      "Rễ đen dưới lòng đất nối các cột lại. Nếu chúng chạm tới lõi hành tinh, Trái Đất sẽ kiệt sức.",
      "Siro cùng bố Giang và các bạn lập kế hoạch. Mỗi người phụ trách tìm điểm yếu của một cột. Bu dùng bong bóng giữ các mảnh đá rơi. Bun và Minh Trí điều khiển thiết bị. Những người khác giúp sơ tán dân.",
      "Siro nói: “Mình sẽ giữ Mô-rô và bảy bóng quái vật.”",
      "Bố Giang hỏi: “Con chắc chứ?”",
      "Siro nhìn đôi tay. UI Sign giúp cậu né rất nhanh, nhưng tấn công chưa đủ mạnh.",
      "“Con chưa chắc thắng. Nhưng con chắc mình sẽ không bỏ mọi người.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-18-hinh-02.webp", alt: "Siro đối mặt với Mô-rô." },
      "Siro bước vào thung lũng hố sâu. Tóc đen dựng, mắt bạc, hào quang bạc mỏng hiện ra. Cậu đứng thả lỏng, tay mở, hơi thở nhẹ.",
      "Mô-rô giơ gậy. “Lần trước ngươi chạy giỏi. Lần này xem ngươi chạy khỏi cả bầu trời thế nào.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-18-hinh-03.webp", alt: "Trận chiến giữa Siro và Mô-rô." },
      "Bảy bóng quái vật cùng lao tới.",
      "Chim đen bổ xuống từ trên. Siro nghiêng vai phải. Móng vuốt sượt qua. Rắn khói quất ngang chân. Cậu bật nhẹ lên. Nhện lửa phun lưới từ bên trái. Cậu xoay người trên không, luồn qua một mắt lưới.",
      "Vút! Vèo! Xẹt!",
      "Siro chỉ còn những vệt bạc.",
      "Nhưng né bảy kẻ cùng lúc rất khó. Bò đá húc từ phía trước, khổng lồ đất đập từ trên xuống. Siro tránh được cú húc nhưng vai bị bàn tay đất quệt trúng.",
      "Rầm!",
      "Cậu rơi xuống mép hố. UI Sign chập chờn.",
      "Mô-rô hút năng lượng từ các cột, tạo áo giáp rễ đen quanh người. Hắn lao tới nhanh hơn trước, tung cú đấm phải. Siro né. Cú đấm trái đến ngay sau. Siro chặn bằng cẳng tay.",
      "Ầm!",
      "Cánh tay cậu tê buốt. Mô-rô đá vào bụng. Siro bị đẩy sát hố sâu.",
      "“Né tránh không cứu được hành tinh,” Mô-rô cười.",
      "Qua bộ đàm, Bun báo: “Cột một đã khóa!”",
      "Phúc Hưng: “Cột hai xong!”",
      "Mimi: “Cột ba an toàn!”",
      "Từng tiếng bạn bè vang lên. Nhưng Mô-rô vẫn còn bốn cột, đủ để tạo quả cầu hút khổng lồ. Hắn nâng quả cầu đen xanh lên trời.",
      "Bảy bóng quái vật dồn Siro đến mép hố sâu. UI Sign giúp cậu né được nhiều đòn, nhưng mỗi lần né xong lại có một đòn khác chờ sẵn. Bò đá húc từ trước, khổng lồ đất đập từ trên, rắn khói quấn từ sau. Vai Siro bị quệt trúng, cậu rơi xuống mép hố, một chân trượt khỏi bờ đá. Khi quả cầu hút khổng lồ ép xuống, cậu chống hai tay mà vẫn bị đẩy thấp dần. Tâm trí càng hoảng, cơ thể càng chậm.",
      "MUI xuất hiện khi Siro thả nỗi sợ xuống. Hào quang bạc mỏng của UI Sign bùng thành vầng sáng tròn, mượt và yên. Tóc đen chuyển bạc từng lọn, rồi sáng lên như ánh sao. Đôi mắt bạc không căng thẳng, không giận dữ, chỉ trong veo. Khác với UI Sign chỉ né rất giỏi, Bản Năng Vô Cực Hoàn Thiện cho phép cả phòng thủ và tấn công cùng tự nhiên như một dòng nước.",
      { type: 'image', src: "/reading/mr-saiyan/tap-18-hinh-04.webp", alt: "Siro thức tỉnh Bản Năng Vô Cực Hoàn Thiện." },
      "Siro không còn chạy khỏi bảy bóng quái vật. Cậu đi xuyên giữa chúng. Một ngón tay chạm vào mắt xích năng lượng, một cú đá nhẹ làm bóng sét lệch hướng, một lòng bàn tay đẩy bóng đất va vào cột hút của chính nó. Vũ Điệu Ánh Bạc trông mềm mại, nhưng mỗi chạm đều phá đúng điểm yếu. Khi Mô-rô lộ mảnh hạt đen, Sóng Vô Cực Ánh Bạc bay ra, đánh vỡ nguồn điều khiển mà không ném hắn xuống hố. Siro thắng bằng sự yên tĩnh hoàn chỉnh.",
      "MUI là bước hoàn thiện của sự lắng nghe. Hào quang bạc không còn mỏng như sương mà thành vòng sáng mịn quanh toàn thân. Tóc chuyển bạc từng lọn, mắt bạc trong, cơ thể đứng thẳng nhưng mềm, khí tức yên như mặt hồ dưới trăng. Khác với UI Sign chỉ phòng thủ thật nhanh, MUI cho Siro vừa né vừa phản công tự nhiên. Sức mạnh không còn nổ ầm; nó đi đúng điểm yếu. Mô-rô mở bảy bóng quái vật vây kín, tưởng Siro sẽ bị ép xuống hố. Nhưng Siro bước xuyên qua đòn đầu như một vệt sáng bạc, dùng một ngón tay đẩy móng đá lệch, một cú gót chân hất bóng sét vào cột hút, một lòng bàn tay làm rễ đen tự quấn vào nhau. Vũ Điệu Ánh Bạc kết thúc bằng Sóng Vô Cực Ánh Bạc, luồng sáng bay thẳng vào lõi điều khiển. Lõi đen vỡ, các bóng quái vật tan thành bụi sao, Mô-rô nằm bệt xuống đất và không hút nổi thêm giọt năng lượng nào.",
      "Mô-rô bị đưa tới một hành tinh khô cằn để dùng phép thuật phục hồi đất thay vì hút đất. Trước khi đi, hắn trao cho Siro mảnh bản đồ rễ đen.",
      { type: 'image', src: "/reading/mr-saiyan/tap-18-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "“Kẻ thật sự đứng sau đã dùng ta,” Mô-rô nói. “Rễ cây đang hướng về một hạt giống dưới thành phố của ngươi.”",
      "Siro nhìn bản đồ. Ở trung tâm là biểu tượng hạt đen từng xuất hiện trên Rô-bốt Đen.",
      "Mọi chuyện từ đầu đều nối với nhau.",
    ],
  },
  {
    id: "mr-saiyan-tap-19",
    title: "Tập 19: True UI Và Trái Tim Saiyan",
    subtitle: "True UI Và Trái Tim Saiyan",
    shortTitle: "Tập 19",
    lines: [
      "Tập 19: True UI Và Trái Tim Saiyan",
      "Khi cả nhóm chuẩn bị tìm hạt giống dưới thành phố, một chiến binh mới rơi xuống sa mạc đá. Hắn tên là Ga-gô. Hắn nhanh, mạnh và luôn muốn chứng minh mình là số một.",
      { type: 'image', src: "/reading/mr-saiyan/tap-19-hinh-01.webp", alt: "Ga-gô xuất hiện." },
      "Vua Bóng Tối đã hứa với Ga-gô:",
      "“Nếu đánh bại Siro, ngươi sẽ là chiến binh mạnh nhất vũ trụ.”",
      "Ga-gô không quan tâm Trái Đất. Hắn chỉ muốn thắng.",
      "Hắn gửi lời thách đấu: “Siro, đến sa mạc. Nếu ngươi không đến, ta sẽ đánh vỡ ngọn núi chứa nguồn nước của thành phố.”",
      "Siro buộc phải đi.",
      "Trước lúc rời nhà, Simi đưa cậu một vòng tay bằng sợi chỉ xanh.",
      "“Để anh nhớ mình là Siro, không chỉ là người có tóc bạc.”",
      "Siro đeo vòng tay. “Anh hứa.”",
      "Ga-gô chờ giữa sa mạc, hai nắm tay bốc năng lượng cam.",
      "“Ta muốn đánh với Bản Năng Vô Cực Hoàn Thiện.”",
      "Siro lắc đầu. “Tôi đến để bảo vệ nguồn nước, không để làm trò chứng minh.”",
      "Ga-gô cười lớn. “Vậy ta sẽ ép ngươi.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-19-hinh-02.webp", alt: "Siro đối mặt với Ga-gô." },
      "Ga-gô lao tới trước. Nắm tay phải của hắn xé gió vun vút. Siro chuyển MUI, tóc bạc sáng, mắt bạc, cơ thể tự nghiêng sang trái.",
      "Cú đấm trượt qua. Siro dùng lòng bàn tay đẩy khuỷu tay Ga-gô, rồi đá nhẹ vào hông hắn.",
      { type: 'image', src: "/reading/mr-saiyan/tap-19-hinh-03.webp", alt: "Trận chiến giữa Siro và Ga-gô." },
      "Bốp!",
      "Ga-gô lùi lại, cười khoái chí. Hắn tăng tốc. Hai người biến thành hai vệt bạc và cam, lao qua các cột đá.",
      "Ầm! Rầm! Bùm!",
      "Ga-gô đấm phải. Siro né. Ga-gô đá trái. Siro lộn vòng. Siro phản đòn bằng khuỷu tay, Ga-gô chặn bằng đầu gối. Sóng khí lan ra làm cát xoáy thành cột.",
      "MUI của Siro rất hoàn hảo, nhưng quá yên. Ga-gô bắt đầu chọc giận:",
      "“Ngươi có sợ mất gia đình không? Có sợ mình không cứu được em gái không?”",
      "Siro cố bỏ ngoài tai. Cậu muốn giữ tâm trí trống rỗng. Nhưng hình ảnh Simi hiện lên. Tim cậu rung.",
      "MUI chập chờn.",
      "Ga-gô thấy vậy, tung Quyền Phá Núi vào vách đá chứa nguồn nước.",
      "Siro lao tới chặn. ẦM! Cú đấm đánh cậu xuyên qua hai cột đá. Tóc bạc tắt. Cậu rơi xuống cát.",
      "Ga-gô bước tới. “Cảm xúc làm ngươi yếu.”",
      "Ga-gô đánh vào điểm mà MUI của Siro chưa hiểu: cảm xúc. Mỗi câu chọc giận làm hình ảnh Simi và gia đình hiện lên trong đầu cậu. Siro càng cố xua đi, tóc bạc càng mờ. Ga-gô tung Quyền Phá Núi, Siro lao vào chặn và bị đánh xuyên qua hai cột đá. Rầm! Rầm! Cát phủ lên người cậu. MUI tắt hẳn. Cậu nằm trên sa mạc, đau đến mức không thể đứng ngay, còn nguồn nước phía sau đang gặp nguy.",
      "True UI bắt đầu khi Siro nhìn vòng tay xanh của Simi. Cậu không đẩy tình yêu ra khỏi tim nữa. Tóc vẫn đen, vì cậu trở về với bản ngã Saiyan thật của mình. Đôi mắt bạc mở ra, hào quang bạc hòa những tia xanh và vàng ấm. Khác với MUI yên như mặt hồ, True UI có nhịp tim, có cảm xúc, có nụ cười và cả nỗi lo. Nhưng tất cả được Siro hiểu và dẫn đường.",
      { type: 'image', src: "/reading/mr-saiyan/tap-19-hinh-04.webp", alt: "Siro thức tỉnh True UI." },
      "Sau khi thức tỉnh, Siro không lạnh lùng né Ga-gô. Cậu vừa né vừa nói, từng bước làm đối thủ chậm lại. Cú đấm cam lao tới, Siro nghiêng vai, dùng cổ tay dẫn lực qua bên. Cú đá trái đến, cậu xoay người, chạm gót chân vào vai Ga-gô để dừng hướng tấn công. Quyền Trái Tim Saiyan không đấm vào người để hạ gục, mà dừng trước ngực rồi xuyên sóng năng lượng phá dấu ấn bóng tối sau lưng. Siro thắng bằng cách cứu đối thủ khỏi điều khiển.",
      "True UI làm Siro trở về với chính mình thay vì bay xa khỏi cảm xúc. Hào quang bạc hòa tia xanh và vàng ấm, tóc giữ màu đen, mắt bạc sáng, cơ thể còn đau sau cú đánh của Ga-gô nhưng không run nữa. Khí tức có nhịp tim rõ ràng, lúc mạnh như trống trận, lúc dịu như lời mẹ Phương. Khác với MUI yên tuyệt đối, True UI cho phép Siro dùng tình yêu, lo lắng và quyết tâm làm la bàn chiến đấu. Ga-gô lao tới bằng Quyền Phá Núi, mặt đất nứt rầm rầm. Siro không lùi. Cậu nghiêng vai để cú đấm trượt qua, chạm cổ tay dẫn lực xuống cát, rồi xoay người đá nhẹ vào gối làm Ga-gô mất thăng bằng. Ga-gô càng tức càng đánh nhanh, nhưng Siro vừa né vừa tiến, từng bước thu ngắn khoảng cách. Quyền Trái Tim Saiyan dừng trước ngực đối thủ rồi bắn luồng sáng xuyên qua dấu ấn bóng tối sau lưng. Dấu ấn vỡ, Ga-gô khuỵu xuống, tỉnh lại và thua mà không bị tổn thương nặng.",
      "Ga-gô chỉ xuống đất. “Vua Bóng Tối đang đánh thức Cây Vũ Trụ dưới thành phố. Hắn dùng năng lượng của mọi trận chiến để nuôi nó.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-19-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "Mặt đất ở phía chân trời rung ầm ầm. Một thân cây đen khổng lồ đâm lên giữa thành phố, xuyên qua mây.",
      "Siro nhìn về nhà. “Trận cuối đã bắt đầu.”",
      "Ga-gô đứng cạnh cậu. “Lần này, ta sẽ chiến đấu để bảo vệ.”",
    ],
  },
  {
    id: "mr-saiyan-tap-20",
    title: "Tập 20: Cây Vũ Trụ Và Lời Hứa Bảo Vệ Trái Đất",
    subtitle: "Cây Vũ Trụ Và Lời Hứa Bảo Vệ Trái Đất",
    shortTitle: "Tập 20",
    lines: [
      "Tập 20: Cây Vũ Trụ Và Lời Hứa Bảo Vệ Trái Đất",
      "Cây Vũ Trụ Đen mọc lên giữa thành phố. Thân cây to như ngọn núi. Cành cây xuyên qua mây. Rễ đen bò dưới đường, quấn quanh nhà cửa, công viên và bờ sông.",
      "Mỗi chiếc lá đen hút một chút ánh sáng. Bầu trời tối dần. Cây cối nhỏ cúi xuống. Người dân thấy mệt.",
      "Trên cành cao nhất, Vua Bóng Tối xuất hiện. Áo giáp hắn đen tím, vương miện sắc như sừng. Trong tay hắn là lõi hạt giống đã thu năng lượng từ mọi trận chiến.",
      { type: 'image', src: "/reading/mr-saiyan/tap-20-hinh-01.webp", alt: "Vua Bóng Tối xuất hiện." },
      "“Cảm ơn ngươi, Siro,” hắn nói. “Mỗi lần ngươi mạnh lên, cây của ta cũng lớn lên.”",
      "Siro đứng trên mái nhà cùng bố Giang, Ga-gô, Bu và những người từng là đối thủ. Phi Za từ xa gửi thiết bị đóng băng rễ. Xen điều khiển các đường điện để không bị cây hút. Za-mát dùng phép phá mặt trăng đen trên cành. Mô-rô dùng kiến thức về đất để chỉ điểm rễ yếu.",
      "Bun nói trong bộ đàm: “Đây không phải trận của một người. Tất cả chúng ta phải cùng làm.”",
      "Siro nhìn gia đình và bạn bè.",
      "“Mọi người bảo vệ mặt đất. Mình sẽ lên ngọn cây.”",
      "Mẹ Phương ôm cậu. “Dù con mạnh đến đâu, hãy trở về là Siro.”",
      "Bố Giang đặt tay lên vai con. “Kỷ luật.”",
      "Simi giơ nắm tay nhỏ. “Lời hứa.”",
      "Siro mỉm cười. “Con sẽ trở về.”",
      { type: 'image', src: "/reading/mr-saiyan/tap-20-hinh-02.webp", alt: "Siro đối mặt với Vua Bóng Tối." },
      "Siro biến thành True UI, lao lên thân cây. Vệt sáng bạc xanh bay vun vút giữa các cành đen. Vua Bóng Tối vung tay. Hàng ngàn gai năng lượng phóng xuống vèo vèo.",
      "Siro nghiêng đầu né gai thứ nhất, xoay vai qua gai thứ hai, đặt chân lên gai thứ ba để bật cao. Cậu lộn vòng, dùng Bước Chớp Bạc xuyên qua mưa gai.",
      { type: 'image', src: "/reading/mr-saiyan/tap-20-hinh-03.webp", alt: "Trận chiến giữa Siro và Vua Bóng Tối." },
      "Vua Bóng Tối xuất hiện trước mặt, tung cú đấm bọc bóng đen. Siro dùng tay trái gạt ra, tay phải đấm vào ngực hắn.",
      "ẦM!",
      "Vua Bóng Tối chỉ lùi nửa bước. Cây Vũ Trụ bơm thêm năng lượng cho hắn.",
      "“Ngươi không thể thắng một kẻ có cả hành tinh làm thức ăn.”",
      "Hắn đá ngang. Siro cúi thấp, nhưng một rễ cây từ sau quấn lấy cổ chân. Vua Bóng Tối đấm xuống.",
      "RẦM!",
      "Siro rơi xuyên qua ba cành cây, đập vào thân lớn. True UI chập chờn.",
      "Dưới đất, mọi người chiến đấu cùng rễ cây. Bố Giang chặn một rễ đang hướng vào trường học. Bu thổi bong bóng nâng trẻ nhỏ khỏi nơi nguy hiểm. Ga-gô đẩy một cành cây khỏi bệnh viện. Bạn bè Siro vận hành các cột ánh sáng.",
      "Vua Bóng Tối khiến Siro thua nhiều lần trong cùng một trận. True UI bị rễ cây kéo khỏi không trung. MUI đánh nứt áo giáp hắn nhưng bị Cây Vũ Trụ vá lại ngay. Rồi chính năng lượng bạc của Siro bị hút mất, làm tóc bạc tắt như đèn trong gió. Cậu rơi xuống cành cây đen, đau nhói khắp người, mắt hoa lên. Khi cố hấp thụ năng lượng xanh vàng từ mọi người, cơ thể cậu lại gần quá tải, như một chiếc bình nhỏ nhận cả dòng sông lớn.",
      "Sức Mạnh Cây Vũ Trụ không phải chỉ là SSB mạnh hơn. Tóc Siro vẫn xanh lam nhưng có ánh vàng kim chạy trong từng ngọn tóc. Hào quang xanh không bao quanh một mình cậu nữa; nó nối với những chấm sáng từ gia đình, bạn bè, người dân, cây cối, sông biển. Cơ thể đau vì năng lượng quá lớn, nhưng khi Siro ngừng giữ tất cả cho riêng mình, dòng sáng bắt đầu chảy qua cậu như một con sông. Khác biệt lớn nhất của hình thái này là sức mạnh chung, không phải sức mạnh cá nhân.",
      { type: 'image', src: "/reading/mr-saiyan/tap-20-hinh-04.webp", alt: "Siro thức tỉnh Sức Mạnh Cây Vũ Trụ." },
      "Siro bay vào Quả Cầu Hủy Diệt Đen, không húc bằng cơ bắp mà mở đường bằng ánh sáng xanh vàng. Bóng tối tách sang hai bên như mây bị gió thổi. Cậu nắm tay phải, trong nắm tay hiện hình Trái Đất nhỏ với biển xanh và mây trắng. Quyền Trái Đất đánh vào ngực Vua Bóng Tối, nhưng không nổ phá hủy. Ánh sáng lan theo rễ, theo thân, theo từng chiếc lá, thanh lọc Cây Vũ Trụ Đen thành Cây Ánh Sáng. Siro chiến thắng vì cậu để cả Trái Đất cùng chiến đấu qua mình.",
      "Sức Mạnh Cây Vũ Trụ là trạng thái khác biệt nhất vì Siro không còn chiến đấu một mình. Hào quang xanh lam của SSB mở ra, hòa vàng kim từ Cây Vũ Trụ. Tóc xanh có viền vàng, mắt xanh ánh bạc, cơ thể đau vì quá tải nhưng khí tức được dòng sáng chung nâng đỡ. So với SSB, MUI hay True UI, hình thái này không chỉ tăng tốc độ và sức mạnh cá nhân; nó cho Siro khả năng dẫn năng lượng của gia đình, bạn bè, sông, cây và bầu trời qua mình mà không giữ hết trong tim. Khi Vua Bóng Tối ném Quả Cầu Hủy Diệt Đen, Siro bay thẳng vào tâm cầu, dùng Khiên Cây Vũ Trụ mở đường xanh vàng. Rễ đen quấn tay chân cậu, nhưng từng lời gọi của Simi, bố Giang, mẹ Phương và bạn bè sáng lên như sao nhỏ. Siro xoay người, gom tất cả thành Quyền Trái Đất. Cú đấm chạm ngực Vua Bóng Tối, ánh sáng lan theo rễ, áo giáp đen nứt răng rắc, Cây Vũ Trụ Đen hóa thành Cây Ánh Sáng, và kẻ thù cuối cùng tan thành bóng mỏng bay khỏi bầu trời.",
      "Vài ngày sau, thành phố xây một công viên quanh Cây Ánh Sáng. Cây không hút năng lượng nữa. Nó tỏa bóng mát, làm đất màu mỡ và nở hoa vàng mỗi khi trẻ em cười.",
      { type: 'image', src: "/reading/mr-saiyan/tap-20-hinh-05.webp", alt: "Siro trở về bên gia đình và bạn bè." },
      "Siro ngồi dưới gốc cây cùng gia đình và bạn bè. Bu ăn bánh chuối. Ga-gô tập đá bóng với Phúc Hưng. Xen sửa đèn công viên. Za-mát dùng phép tạo đom đóm. Mô-rô trồng cây con. Phi Za gửi một hộp kem lạnh kèm mảnh giấy: “Đừng hiểu lầm. Ta chỉ gửi vì hộp quá đầy.”",
      "Simi tựa đầu vào vai anh.",
      "“Anh còn bảo vệ Trái Đất nữa không?”",
      "Siro nhìn bầu trời xanh, nhìn mọi người đang cười và đặt tay lên thân cây ấm.",
      "“Còn chứ. Nhưng anh hiểu rồi. Bảo vệ Trái Đất không phải việc của một người. Mỗi người nhặt một mẩu rác, giúp một người bạn, chăm một cái cây, nói một lời tử tế... đều là người hùng.”",
      "Bố Giang mỉm cười. Mẹ Phương ôm hai anh em.",
      "Gió thổi lá cây xào xạc. Trên cao, một ngôi sao lóe sáng.",
      "Siro đứng lên, nắm tay hướng về bầu trời.",
      "“Mình là Mr. Saiyan. Mình hứa sẽ luôn bảo vệ Trái Đất!”",
      "Phụ Lục: Prompt Minh Họa",
      "Phần này dành cho người lớn muốn tạo lại hoặc chỉnh sửa tranh minh họa. Ảnh 1 và Ảnh 4 giữ nguyên bộ ảnh đẹp đã có; Ảnh 2, Ảnh 3 và Ảnh 5 là các cảnh minh họa độc lập được tạo mới theo nội dung từng tập.",
    ],
  },
  {
    id: 'nhat-ky-siro-tap-1',
    title: "Tập 1: Quái Vật Bóng Tối Dưới Gầm Giường",
    subtitle: "Quái Vật Bóng Tối Dưới Gầm Giường",
    shortTitle: 'Tập 1',
    lines: [
      "Tập 1: Quái Vật Bóng Tối Dưới Gầm Giường",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-01-hinh-01.webp", alt: "Tập 1: Quái Vật Bóng Tối Dưới Gầm Giường - minh họa 1" },
      "Nội dung truyện: Vào một đêm mưa dông, khu phố bất ngờ mất điện. Căn phòng của hai anh em chìm trong bóng tối. Bé Simi 3 tuổi mếu máo khóc khi thấy một cái bóng đen ngòm, có hai mắt đỏ rực đang từ từ trườn ra từ dưới gầm giường. Đó là Quái vật Bóng Tối! Nó phình to ra mỗi khi Simi thút thít. Siro lúc đầu cũng giật mình và định la lên bỏ chạy. Quái vật dồn hai anh em vào góc tường, vươn những cái xúc tu đen ngòm ra.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-01-hinh-02.webp", alt: "Tập 1: Quái Vật Bóng Tối Dưới Gầm Giường - minh họa 2" },
      "Đúng lúc đó, Siro nhớ lại lời Bố Giang từng dạy: \"Bóng tối chỉ là nơi ánh sáng chưa chiếu tới. Khi con bình tĩnh, con sẽ là người mạnh nhất.\" Siro hít một hơi thật sâu, dỗ dành: \"Simi nín đi, anh hai ở đây!\". Cậu bé nhanh trí với tay lấy chiếc đèn pin siêu sáng mà bố đã trang bị sẵn ở đầu giường. \"Tách!\" – Siro bật đèn, chiếu thẳng vào Quái vật. Bị ánh sáng dội vào, Quái vật Bóng Tối xì hơi như một quả bóng thủng, thu nhỏ lại bằng củ khoai tây và lủi mất tăm. Bố Giang bước vào phòng với nụ cười tự hào, khen ngợi Siro đã biết dũng cảm bảo vệ em gái.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-01-hinh-03.webp", alt: "Tập 1: Quái Vật Bóng Tối Dưới Gầm Giường - minh họa 3" },
    ],
  },
  {
    id: 'nhat-ky-siro-tap-2',
    title: "Tập 2: Đội Quân Đồ Chơi Nổi Loạn",
    subtitle: "Đội Quân Đồ Chơi Nổi Loạn",
    shortTitle: 'Tập 2',
    lines: [
      "Tập 2: Đội Quân Đồ Chơi Nổi Loạn",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-02-hinh-01.webp", alt: "Tập 2: Đội Quân Đồ Chơi Nổi Loạn - minh họa 1" },
      "Nội dung truyện: Siro có một thói quen xấu là chơi xong không bao giờ dọn dẹp. Một buổi chiều, căn phòng khách bỗng biến thành \"Vương quốc Đồ chơi\" khổng lồ. Thủ lĩnh Robot Gỉ Sét do tức giận vì bị vứt lăn lóc đã kêu gọi các mảnh ghép Lego, xe đua và gấu bông nổi loạn. Chúng bay lượn tứ tung, tạo thành một cơn lốc đồ chơi nhốt Siro vào giữa. Siro cố gắng dùng gối để gạt chúng ra nhưng càng đánh, đội quân Lego càng siết chặt vòng vây, chèn lên chân khiến cậu không thể nhúc nhích.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-02-hinh-02.webp", alt: "Tập 2: Đội Quân Đồ Chơi Nổi Loạn - minh họa 2" },
      "Tưởng chừng đã kẹt cứng, Siro nghe thấy tiếng Mẹ Phương văng vẳng: \"Đồ vật cũng có cảm xúc, nếu con yêu thương và xếp chúng gọn gàng, chúng sẽ là bạn của con.\" Siro hạ chiếc gối xuống, không chống trả nữa. Cậu dang tay ra và nói to: \"Tớ xin lỗi! Từ nay tớ sẽ cất các cậu cẩn thận!\". Lời xin lỗi chân thành như một phép thuật. Cơn lốc dừng lại. Thủ lĩnh Robot Gỉ Sét hạ vũ khí. Siro cùng Simi cẩn thận nhặt từng mảnh Lego, lau sạch Robot và xếp chúng lên giá. Căn phòng gọn gàng trở lại, và các món đồ chơi lại mỉm cười với hai anh em.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-02-hinh-03.webp", alt: "Tập 2: Đội Quân Đồ Chơi Nổi Loạn - minh họa 3" },
    ],
  },
  {
    id: 'nhat-ky-siro-tap-3',
    title: "Tập 3: Bí Mật Khu Rừng Kẹo Ngọt",
    subtitle: "Bí Mật Khu Rừng Kẹo Ngọt",
    shortTitle: 'Tập 3',
    lines: [
      "Tập 3: Bí Mật Khu Rừng Kẹo Ngọt",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-03-hinh-01.webp", alt: "Tập 3: Bí Mật Khu Rừng Kẹo Ngọt - minh họa 1" },
      "Nội dung truyện: Cuối tuần, Siro cùng Bun và Bơ chơi ở công viên. Bỗng nhiên, một con đường trải đầy kẹo mút cầu vồng hiện ra, dẫn đến một ngôi nhà làm bằng bánh quy. Tại đó, Phù thủy Hảo Ngọt với nụ cười giả lả đang vẫy tay: \"Lại đây các cháu, ở đây có sô-cô-la ăn không bao giờ hết!\". Bun và Bơ bị mê hoặc, nuốt nước bọt và bước tới. Phù thủy giăng sẵn một cái lưới làm bằng kẹo dẻo siêu dính, chuẩn bị tóm gọn hai bạn.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-03-hinh-02.webp", alt: "Tập 3: Bí Mật Khu Rừng Kẹo Ngọt - minh họa 2" },
      "Siro nhớ ngay đến nguyên tắc an toàn: \"Tuyệt đối không nhận đồ của người lạ!\". Cậu lao ra, kéo áo Bun và Bơ lại ngay khi chiếc lưới kẹo dẻo ập xuống. Bị vồ hụt, Phù thủy tức giận bắn ra những tia kẹo bông gòn nhằm trói chặt bộ ba. Siro quan sát thấy đài phun nước của công viên ở gần đó. \"Các cậu, dùng súng nước!\" – Siro hét lên. Ba cậu bé rút súng nước đồ chơi ra, hút nước và bắn liên thanh vào Phù thủy. Kẹo bông gặp nước liền tan chảy hết. Phù thủy trượt ngã trên bãi nước đường và chuồn mất. Cả ba thở phào, hứa với nhau sẽ luôn cảnh giác với người lạ.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-03-hinh-03.webp", alt: "Tập 3: Bí Mật Khu Rừng Kẹo Ngọt - minh họa 3" },
    ],
  },
  {
    id: 'nhat-ky-siro-tap-4',
    title: "Tập 4: Sinh Vật Lạ Ở Sân Chơi",
    subtitle: "Sinh Vật Lạ Ở Sân Chơi",
    shortTitle: 'Tập 4',
    lines: [
      "Tập 4: Sinh Vật Lạ Ở Sân Chơi",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-04-hinh-01.webp", alt: "Tập 4: Sinh Vật Lạ Ở Sân Chơi - minh họa 1" },
      "Nội dung truyện: Tại sân chơi khu phố, một chiếc phi thuyền nhỏ xíu rơi xuống bãi cát. Từ trong đó bò ra Sinh vật Mùn Cưa – một con quái vật nhầy nhụa chuyên hút năng lượng từ các trò chơi, khiến xích đu gãy rụng và cầu trượt bị nứt. Siro và bạn thân Phúc Hưng lấy những chiếc nắp thùng rác làm khiên chắn để ngăn nó lại, nhưng con quái vật quá nhanh. Nó ném những quả bóng mùn cưa làm Phúc Hưng ngã nhào, vòng vây thu hẹp lại.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-04-hinh-02.webp", alt: "Tập 4: Sinh Vật Lạ Ở Sân Chơi - minh họa 2" },
      "Simi đang nấp sau gốc cây bỗng chỉ tay: \"Anh Siro ơi, nó sợ vòi tưới cây kìa!\". Nhờ sự quan sát của em gái, Siro nhận ra sinh vật này luôn né tránh khu vực cỏ ướt. Siro hiểu rằng sức trẻ em không thể khống chế được nó. Cậu rút chiếc còi khẩn cấp thổi vang và hét lớn: \"Bố Giang ơi, giúp chúng con!\". Bố Giang chạy tới kịp thời, dùng vòi rồng xịt nước áp suất cao bao vây quái vật, dồn nó vào một chiếc xô nhựa có nắp đậy. Siro học được rằng, dũng cảm không có nghĩa là tự mình làm tất cả, mà là biết nhờ sự trợ giúp của người lớn đúng lúc.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-04-hinh-03.webp", alt: "Tập 4: Sinh Vật Lạ Ở Sân Chơi - minh họa 3" },
    ],
  },
  {
    id: 'nhat-ky-siro-tap-5',
    title: "Tập 5: Cứu Nguy Trong Thư Viện Phép Thuật",
    subtitle: "Cứu Nguy Trong Thư Viện Phép Thuật",
    shortTitle: 'Tập 5',
    lines: [
      "Tập 5: Cứu Nguy Trong Thư Viện Phép Thuật",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-05-hinh-01.webp", alt: "Tập 5: Cứu Nguy Trong Thư Viện Phép Thuật - minh họa 1" },
      "Nội dung truyện: Siro, Kem và Mimi rủ nhau khám phá khu thư viện cổ của trường. Khi mở một cuốn sách khổng lồ, cả ba bị hút vào một không gian toàn giấy. Bầy Yêu tinh Chữ Cái bay lượn xung quanh, dùng những cục tẩy ma thuật xóa dần cánh cửa thoát hiểm. Trót mang tính nóng vội, Siro cầm một cây bút chì khổng lồ lao theo đập bọn yêu tinh. Nhưng cậu càng chạy, bầy yêu tinh càng nhả ra những sợi tơ mực đen trói chặt chân cậu lại. Siro ngã khuỵu, cánh cửa chỉ còn lại một nét vẽ mong manh.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-05-hinh-02.webp", alt: "Tập 5: Cứu Nguy Trong Thư Viện Phép Thuật - minh họa 2" },
      "Trong lúc rối bời, giọng nói dịu dàng của Mẹ Phương lại hiện về: \"Khi con rối trí, hãy dừng lại một nhịp và hít thở.\" Siro nhắm mắt lại, ngừng giãy giụa. Cậu quan sát thấy bọn yêu tinh chỉ sợ những từ ngữ có ý nghĩa. Cậu gọi Kem và Mimi: \"Đừng chạy nữa! Hãy cùng tớ xếp các khối chữ cái rải rác dưới đất!\". Ba bạn phối hợp nhịp nhàng, xếp thành chữ \"MỞ RA\". Một luồng ánh sáng vàng rực lóe lên từ các chữ cái, đánh tan sợi tơ mực và vẽ lại cánh cửa một cách hoàn hảo. Cả ba nắm tay nhau bước qua cửa, an toàn trở về.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-05-hinh-03.webp", alt: "Tập 5: Cứu Nguy Trong Thư Viện Phép Thuật - minh họa 3" },
    ],
  },
  {
    id: 'nhat-ky-siro-tap-6',
    title: "Tập 6: Cuộc Đua Xe Đạp Và Tên Cướp Lốp Xe",
    subtitle: "Cuộc Đua Xe Đạp Và Tên Cướp Lốp Xe",
    shortTitle: 'Tập 6',
    lines: [
      "Tập 6: Cuộc Đua Xe Đạp Và Tên Cướp Lốp Xe",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-06-hinh-01.webp", alt: "Tập 6: Cuộc Đua Xe Đạp Và Tên Cướp Lốp Xe - minh họa 1" },
      "Nội dung truyện: Một buổi chiều lộng gió, Siro, Minh Trí và Gạo tổ chức đua xe đạp quanh khu phố. Không ai biết Băng đảng Đinh Tặc Cá Lóc (những con cá lóc đột biến đi xe ván trượt) đang phục kích để cướp lốp xe. Chúng phóng ra những quả dứa đầy gai nhọn. Xẹt! Xe của Siro cán phải gai, cậu bị mất lái và văng khỏi xe, trượt dài trên đường. Bọn Đinh Tặc nhe răng cười đắc ý, lao tới định cướp chiếc xe.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-06-hinh-02.webp", alt: "Tập 6: Cuộc Đua Xe Đạp Và Tên Cướp Lốp Xe - minh họa 2" },
      "Nhờ có mũ bảo hiểm và đệm lót đầu gối, cùi chỏ mà Bố Giang ép mặc trước khi đi, Siro không hề bị trầy xước. Nhận thấy không thể dùng sức đánh lại băng đảng này, Siro nháy mắt ra hiệu cho Minh Trí và Gạo. Ba bạn lập tức tháo gương chiếu hậu trên xe đạp ra. Dưới ánh nắng chói chang, ba chiếc gương được chĩa thẳng, phản chiếu ánh sáng mặt trời làm lóa mắt bọn Đinh Tặc. Bọn chúng chói mắt, đâm sầm vào nhau và ngã lăn quay vào bụi râm bụt. Siro và các bạn nhanh chóng dắt xe chạy thoát, thầm cảm ơn những món đồ bảo hộ an toàn.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-06-hinh-03.webp", alt: "Tập 6: Cuộc Đua Xe Đạp Và Tên Cướp Lốp Xe - minh họa 3" },
    ],
  },
  {
    id: 'nhat-ky-siro-tap-7',
    title: "Tập 7: Cơn Lốc Đồ Ăn Vặt",
    subtitle: "Cơn Lốc Đồ Ăn Vặt",
    shortTitle: 'Tập 7',
    lines: [
      "Tập 7: Cơn Lốc Đồ Ăn Vặt",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-07-hinh-01.webp", alt: "Tập 7: Cơn Lốc Đồ Ăn Vặt - minh họa 1" },
      "Nội dung truyện: Giờ ra chơi, sân trường bỗng tối sầm vì sự xuất hiện của Quái thú Kẹo Bông. Nó thở ra những luồng khí bắp rang bơ và vòi rồng nước ngọt có gas, biến những bông hoa thành kẹo mút và làm học sinh lờ đờ, buồn ngủ. Simi vô tình đi lạc vào giữa sân và bị lớp si-rô dâu tây dính chặt chân không thể chạy được. Quái thú giơ cái tay dính ngáp khổng lồ chuẩn bị ụp xuống người Simi.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-07-hinh-02.webp", alt: "Tập 7: Cơn Lốc Đồ Ăn Vặt - minh họa 2" },
      "Siro lao tới lấy thân mình che cho em gái. Cậu nhớ lại lời Bố Giang: \"Đồ ăn vặt chỉ làm người ta chậm chạp, còn sức mạnh thật sự đến từ sự khỏe mạnh và không khí trong lành.\" Không thể đánh lại bằng tay chân vì mọi thứ đều dính chặt, Siro nhìn thấy chiếc quạt máy công nghiệp khổng lồ của bác lao công trường. Cậu gọi các bạn: \"Mọi người ơi, cùng tớ đẩy chiếc quạt này!\". Bằng sức mạnh đồng đội khỏe khoắn, các bạn bật quạt lên số to nhất. Luồng gió mạnh mẽ thổi tung lớp đường dính của Quái thú, làm nó bay lả tả thành những mảnh đường khô vô hại. Simi được cứu, và mọi người hiểu rằng không nên nạp quá nhiều đồ ăn vặt vào cơ thể.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-07-hinh-03.webp", alt: "Tập 7: Cơn Lốc Đồ Ăn Vặt - minh họa 3" },
    ],
  },
  {
    id: 'nhat-ky-siro-tap-8',
    title: "Tập 8: Lạc Vào Mê Cung Bong Bóng",
    subtitle: "Lạc Vào Mê Cung Bong Bóng",
    shortTitle: 'Tập 8',
    lines: [
      "Tập 8: Lạc Vào Mê Cung Bong Bóng",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-08-hinh-01.webp", alt: "Tập 8: Lạc Vào Mê Cung Bong Bóng - minh họa 1" },
      "Nội dung truyện: Trong chuyến đi công viên giải trí, mải mê đuổi theo một quả bóng bay, Siro đi lạc vào Mê cung Bong bóng. Xung quanh toàn là những bức tường trong suốt. Tên Hề Bong Bóng Lừa Phỉnh xuất hiện, hắn thổi ra những chiếc bong bóng ảo ảnh chiếu hình ảnh sai lệch của bố mẹ để dụ Siro đi sâu hơn vào mê cung, hòng giữ cậu bé lại làm khán giả vĩnh viễn cho hắn. Siro chạy theo những ảo ảnh, mệt nhoài và suýt bật khóc vì sợ hãi.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-08-hinh-02.webp", alt: "Tập 8: Lạc Vào Mê Cung Bong Bóng - minh họa 2" },
      "Bỗng nhiên, cậu tự cấu nhẹ vào tay mình để trấn tĩnh. \"Khi bị lạc, tuyệt đối không chạy lung tung\" – quy tắc an toàn số một bật lên trong đầu. Cậu đứng im tại chỗ, phớt lờ những bong bóng ảo ảnh đang lởn vởn. Cậu đưa tay lên cổ, cầm lấy chiếc còi mà Bố Giang đeo cho trước khi đi, thổi ba tiếng dài thật to: Tuýt! Tuýt! Tuýt! Tiếng còi vang dội làm vỡ vụn các bong bóng lừa phỉnh của tên Hề. Nghe thấy ám hiệu, các chú bảo vệ công viên cùng bố mẹ đã tìm được đúng vị trí và phá vỡ mê cung, ôm chầm lấy Siro.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-08-hinh-03.webp", alt: "Tập 8: Lạc Vào Mê Cung Bong Bóng - minh họa 3" },
    ],
  },
  {
    id: 'nhat-ky-siro-tap-9',
    title: "Tập 9: Cuộc Chiến Trên Đảo Giấy",
    subtitle: "Cuộc Chiến Trên Đảo Giấy",
    shortTitle: 'Tập 9',
    lines: [
      "Tập 9: Cuộc Chiến Trên Đảo Giấy",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-09-hinh-01.webp", alt: "Tập 9: Cuộc Chiến Trên Đảo Giấy - minh họa 1" },
      "Nội dung truyện: Tại phòng mỹ thuật, một sự cố kỳ lạ đưa Siro, Bơ và Phúc Hưng đến Đảo Giấy. Nơi đây đang bị Vua Kéo Sắc tàn phá. Ông ta tức giận đi khắp nơi, dùng lưỡi kéo khổng lồ cắt nát nhà cửa, cây cối làm bằng giấy. Bơ và Phúc Hưng vội nhặt những tấm bìa cứng làm khiên và kiếm để đánh trả, nhưng lưỡi kéo của Vua Kéo quá bén, cắt nát mọi vũ khí của các bạn. Nhóm Siro bị dồn đến bờ vực của hòn đảo, không còn đường lui.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-09-hinh-02.webp", alt: "Tập 9: Cuộc Chiến Trên Đảo Giấy - minh họa 2" },
      "Siro nhận thấy mỗi lần Vua Kéo cắt đồ vật, ông ta lại thở dài buồn bã. Siro chợt hiểu ra điều gì đó. Cậu bảo các bạn hạ vũ khí xuống. Cậu bước lên trước, cầm một tờ giấy màu xanh lên và nói: \"Ngài Vua Kéo, ngài cắt giấy rất giỏi, nhưng ngài có biết gấp giấy không?\". Vua Kéo sững lại. Siro kiên nhẫn dùng tay gấp tờ giấy thành một chú hạc vô cùng xinh đẹp và tặng cho ông ta. Vua Kéo xúc động rơi nước mắt. Hóa ra ông ta tàn phá chỉ vì không biết tạo ra cái đẹp và cảm thấy cô đơn. Bằng cách dùng lời nói và nghệ thuật thay vì vũ lực, Siro đã biến một kẻ thù thành người bạn nghệ sĩ tuyệt vời của Đảo Giấy.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-09-hinh-03.webp", alt: "Tập 9: Cuộc Chiến Trên Đảo Giấy - minh họa 3" },
    ],
  },
  {
    id: 'nhat-ky-siro-tap-10',
    title: "Tập 10: Trận Chiến Bảo Vệ Ngôi Nhà Mơ Ước",
    subtitle: "Trận Chiến Bảo Vệ Ngôi Nhà Mơ Ước",
    shortTitle: 'Tập 10',
    lines: [
      "Tập 10: Trận Chiến Bảo Vệ Ngôi Nhà Mơ Ước",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-10-hinh-01.webp", alt: "Tập 10: Trận Chiến Bảo Vệ Ngôi Nhà Mơ Ước - minh họa 1" },
      "Nội dung truyện: Đêm Chủ Nhật, một đám sương mù xám xịt mang tên Quái vật Lười Biếng bao trùm lấy ngôi nhà của Siro. Kẻ thù này không có hình thù rõ ràng, nó len lỏi qua khe cửa, khiến Bố Giang, Mẹ Phương và bé Simi chìm vào giấc ngủ mê mệt không thể đánh thức. Nó muốn biến cả gia đình thành những người lười biếng vĩnh viễn. Làn sương mù bắt đầu cuộn lấy Siro. Mắt cậu díu lại, tay chân nặng trĩu. Cậu chỉ muốn ngã xuống thảm và ngủ một giấc thật dài.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-10-hinh-02.webp", alt: "Tập 10: Trận Chiến Bảo Vệ Ngôi Nhà Mơ Ước - minh họa 2" },
      "Nhưng tình yêu thương gia đình đã níu cậu lại. Siro tát nhẹ vào má mình để giữ bình tĩnh (bài học Tập 1, Tập 8), quan sát kỹ làn sương (bài học Tập 4) và nhận ra sương mù rất ghét âm thanh lớn và không khí lưu thông. Siro dồn toàn bộ sức lực còn sót lại, bò tới tủ kéo, vặn tối đa âm lượng chiếc đồng hồ báo thức của bố: Reng! Reng! Reng! Sau đó, cậu lao đến mở toang tất cả các cửa sổ trong nhà, đón ánh bình minh và gió sớm ùa vào.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-10-hinh-03.webp", alt: "Tập 10: Trận Chiến Bảo Vệ Ngôi Nhà Mơ Ước - minh họa 3" },
      "Ánh sáng mặt trời và gió làm Quái vật Lười Biếng rú lên, tan biến vào hư không. Bố mẹ và Simi bừng tỉnh. Các bạn bè trong xóm cũng vừa đạp xe tới rủ đi học. Nhìn thấy khung cảnh, Bố Giang và Mẹ Phương ôm chặt lấy Siro. Bằng sự dũng cảm, mưu trí và tình yêu thương, Siro đã thực sự trở thành người hùng nhỏ tuổi của gia đình.",
    ],
  },
  {
    id: 'nhat-ky-siro-tap-11',
    title: "Tập 11: Chuyến Xe Buýt Nhảy Nhót",
    subtitle: "Chuyến Xe Buýt Nhảy Nhót",
    shortTitle: 'Tập 11',
    lines: [
      "Tập 11: Chuyến Xe Buýt Nhảy Nhót",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-11-hinh-01.webp", alt: "Tập 11: Chuyến Xe Buýt Nhảy Nhót - minh họa 1" },
      "Nội dung truyện: Trên chuyến xe buýt đưa học sinh đi dã ngoại, một con Yêu tinh Tăng Động tàng hình đã lẻn lên xe. Nó rắc thứ bột \"ngứa ngáy\" nhấp nháy màu vàng lên ghế ngồi, khiến Bun, Bơ và các bạn khác không thể ngồi yên. Các bạn thi nhau đứng lên, chạy dọc hành lang xe và trêu đùa nhau. Yêu tinh cười sằng sặc, khiến chiếc xe buýt bắt đầu tròng trành, chao đảo mỗi khi bác tài xế rẽ vào khúc cua. Siro cũng dính một ít bột, chân cậu buồn bực chỉ muốn nhảy cẫng lên.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-11-hinh-02.webp", alt: "Tập 11: Chuyến Xe Buýt Nhảy Nhót - minh họa 2" },
      "Ngay lúc chiếc xe chuẩn bị phanh gấp để tránh một chú chó trên đường, Siro nhớ lại lời Bố Giang: \"Khi xe đang chạy, chỗ ngồi của con chính là lá chắn an toàn nhất.\" Siro hít một hơi thật sâu để cưỡng lại cơn buồn bực ở chân. Cậu ngồi phịch xuống ghế và nhanh tay kéo dây an toàn cài \"Cạch!\" một tiếng. Âm thanh đó tạo ra một vòng sóng âm ma thuật đánh tan lớp bột ngứa trên người cậu. Siro vội hét lớn: \"Các cậu ơi, xe phanh gấp! Trở về ghế và thắt dây an toàn mau!\". Nghe tiếng gọi dứt khoát của Siro, Bun và Bơ bừng tỉnh, vội vàng bám vào ghế và cài dây. Khi tất cả các bạn đều đã thắt dây an toàn, Yêu tinh Tăng Động mất đi sức mạnh, thu nhỏ lại thành một hạt bụi và bị thổi bay qua cửa sổ. Chuyến xe lại lăn bánh an toàn.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-11-hinh-03.webp", alt: "Tập 11: Chuyến Xe Buýt Nhảy Nhót - minh họa 3" },
    ],
  },
  {
    id: 'nhat-ky-siro-tap-12',
    title: "Tập 12: Kẻ Cắp Hơi Ấm Trong Lều Trại",
    subtitle: "Kẻ Cắp Hơi Ấm Trong Lều Trại",
    shortTitle: 'Tập 12',
    lines: [
      "Tập 12: Kẻ Cắp Hơi Ấm Trong Lều Trại",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-12-hinh-01.webp", alt: "Tập 12: Kẻ Cắp Hơi Ấm Trong Lều Trại - minh họa 1" },
      "Nội dung truyện: Cuối tuần, Bố Giang dựng một chiếc lều nhỏ ngoài sân vườn để Siro và Simi trải nghiệm cắm trại. Khi bố vừa vào nhà lấy thêm nước uống, một bầy Muỗi Khổng Lồ (to bằng những quả cầu lông) từ bụi rậm bay ra. Chúng bị thu hút bởi ánh đèn pin và hơi ấm trong lều. Bầy muỗi vo ve đinh tai nhức óc, lao vào lều định đốt hai anh em. Simi hoảng sợ vơ lấy chiếc gối định đập muỗi, nhưng bầy muỗi bay rất nhanh, chúng lượn vòng quanh tạo thành một vòng vây xám xịt.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-12-hinh-02.webp", alt: "Tập 12: Kẻ Cắp Hơi Ấm Trong Lều Trại - minh họa 2" },
      "Siro biết rằng vung tay đánh đuổi chỉ làm tốn sức mà không thể chống lại số lượng quá đông. Cậu nhớ lại Bố Giang đã dặn phải luôn kéo khóa lều cẩn thận. Siro bình tĩnh bảo: \"Simi, nấp sau lưng anh!\". Cậu nhanh tay với lấy chiếc đèn xông tinh dầu đuổi muỗi sả chanh mà bố để sẵn góc lều, bật công tắc lên. Mùi hương sả chanh lan tỏa khiến bầy muỗi khựng lại, lảo đảo. Tận dụng cơ hội đó, Siro lao tới cửa lều, nhanh tay kéo \"Rẹt!\" sợi khóa kéo đóng kín bưng lại. Bầy muỗi bị chặn bên ngoài, đập đầu vào lớp lưới chống muỗi rồi chán nản bay đi. Bố Giang quay ra, mỉm cười tự hào vì Siro đã biết cách sử dụng đồ dùng an toàn để bảo vệ em gái.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-12-hinh-03.webp", alt: "Tập 12: Kẻ Cắp Hơi Ấm Trong Lều Trại - minh họa 3" },
    ],
  },
  {
    id: 'nhat-ky-siro-tap-13',
    title: "Tập 13: Màn Ảo Thuật Biến Mất Ở Siêu Thị",
    subtitle: "Màn Ảo Thuật Biến Mất Ở Siêu Thị",
    shortTitle: 'Tập 13',
    lines: [
      "Tập 13: Màn Ảo Thuật Biến Mất Ở Siêu Thị",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-13-hinh-01.webp", alt: "Tập 13: Màn Ảo Thuật Biến Mất Ở Siêu Thị - minh họa 1" },
      "Nội dung truyện: Trong một lần đi siêu thị đông đúc cùng Mẹ Phương, Siro vô tình nhìn thấy một chiếc xe ô tô đồ chơi tự động bay lơ lửng, tỏa ra ánh sáng lấp lánh bảy màu. Đó là cái bẫy của Phù thủy Lấp Lánh – kẻ thích dụ dỗ những đứa trẻ tò mò tách khỏi bố mẹ. Chiếc ô tô bay chầm chậm, dẫn Siro rẽ qua hết quầy bánh kẹo đến khu vực nhà kho tối tăm vắng vẻ. Xung quanh đột nhiên im ắng, chiếc xe đồ chơi biến mất, thay vào đó là Phù thủy Lấp Lánh đang nhếch mép cười, quăng ra một chiếc lưới tàng hình định bắt cậu đi.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-13-hinh-02.webp", alt: "Tập 13: Màn Ảo Thuật Biến Mất Ở Siêu Thị - minh họa 2" },
      "Siro giật mình quay lại và nhận ra mình không còn thấy Mẹ Phương đâu nữa. Cơn hoảng loạn ùa đến, nhưng cậu cắn chặt môi để không khóc. Nhớ lời mẹ dạy: \"Nếu con bị lạc, đừng chạy lung tung tìm mẹ, hãy đứng yên hoặc nhờ các cô chú mặc đồng phục siêu thị.\" Siro liền lùi lại một bước né chiếc lưới, kiên quyết quay lưng đi, không thèm nhìn Phù thủy nữa. Cậu chạy ngược ra chỗ có ánh sáng, đi thẳng đến quầy thu ngân và nói to: \"Cô ơi, cháu bị lạc mẹ, cô gọi loa giúp cháu với ạ!\". Khi Siro tìm được người giúp đỡ chính đáng, phép thuật của Phù thủy Lấp Lánh tan vỡ, mụ bực tức biến thành một làn khói rồi biến mất. Mẹ Phương hớt hải chạy đến từ quầy thu ngân, ôm chầm lấy Siro. Cậu hứa sẽ luôn nắm chặt tay mẹ ở nơi đông người.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-13-hinh-03.webp", alt: "Tập 13: Màn Ảo Thuật Biến Mất Ở Siêu Thị - minh họa 3" },
    ],
  },
  {
    id: 'nhat-ky-siro-tap-14',
    title: "Tập 14: Cuộc Nổi Loạn Của Vương Quốc Màn Hình",
    subtitle: "Cuộc Nổi Loạn Của Vương Quốc Màn Hình",
    shortTitle: 'Tập 14',
    lines: [
      "Tập 14: Cuộc Nổi Loạn Của Vương Quốc Màn Hình",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-14-hinh-01.webp", alt: "Tập 14: Cuộc Nổi Loạn Của Vương Quốc Màn Hình - minh họa 1" },
      "Nội dung truyện: Kỳ nghỉ hè, Siro rủ Phúc Hưng và Bơ sang nhà chơi. Nhưng thay vì chơi đồ chơi, cả ba lại cắm mặt vào xem hoạt hình và chơi game trên máy tính bảng nhiều giờ liền. Đột nhiên, Ngài Tivi Thôi Miên hiện ra từ trong màn hình. Hắn phóng ra những tia sáng xanh lè cuốn lấy mắt của Phúc Hưng và Bơ, khiến hai bạn biến thành \"zombie\", mắt đờ đẫn, tay cứ bấm máy liên tục không thể dừng lại. Ngài Tivi vươn những sợi dây cáp điện ra, chuẩn bị trói Siro lại để ép cậu dán mắt vào màn hình mãi mãi.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-14-hinh-02.webp", alt: "Tập 14: Cuộc Nổi Loạn Của Vương Quốc Màn Hình - minh họa 2" },
      "Siro cảm thấy mắt mình khô khốc và mỏi nhừ. Cậu lắc mạnh đầu để tỉnh táo. Bố Giang từng nói: \"Cửa sổ và ánh sáng mặt trời là khắc tinh của mọi màn hình điện tử.\" Cậu né tránh những sợi dây cáp đang quẫy đạp, lộn vòng qua ghế sofa và vớ lấy chiếc điều khiển tivi. \"Các cậu, hãy nhắm mắt lại!\" – Siro hét lớn. Cậu dùng hết sức bấm mạnh vào nút Nguồn màu đỏ trên điều khiển. \"Phụt!\". Màn hình tivi tắt ngấm, Ngài Tivi Thôi Miên kêu lên oai oán rồi biến mất. Cùng lúc đó, Siro kéo toang rèm cửa sổ. Ánh nắng rực rỡ và gió mát ùa vào phòng. Phúc Hưng và Bơ chớp chớp mắt, tỉnh lại khỏi cơn thôi miên. Cả ba quyết định cất hết thiết bị điện tử đi và chạy ra sân đá bóng.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-14-hinh-03.webp", alt: "Tập 14: Cuộc Nổi Loạn Của Vương Quốc Màn Hình - minh họa 3" },
    ],
  },
  {
    id: 'nhat-ky-siro-tap-15',
    title: "Tập 15: Trận Lụt Bong Bóng Trơn Trượt",
    subtitle: "Trận Lụt Bong Bóng Trơn Trượt",
    shortTitle: 'Tập 15',
    lines: [
      "Tập 15: Trận Lụt Bong Bóng Trơn Trượt",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-15-hinh-01.webp", alt: "Tập 15: Trận Lụt Bong Bóng Trơn Trượt - minh họa 1" },
      "Nội dung truyện: Đến giờ đi tắm, Siro và Simi nghịch ngợm bơm hết nửa chai sữa tắm ra bồn và xả nước lênh láng mà không khóa vòi. Sự lãng phí đó đã tạo ra Thủy Quái Bọt Biển. Nó phình to lấp kín cả phòng tắm, nhả ra những bãi bọt xà phòng trơn tuột văng khắp sàn nhà. Simi định bước ra ngoài nhưng giẫm phải bọt, suýt ngã đập đầu. Thủy Quái cười ùng ục, liên tục vươn những cánh tay bọt biển ra hòng đẩy ngã hai anh em.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-15-hinh-02.webp", alt: "Tập 15: Trận Lụt Bong Bóng Trơn Trượt - minh họa 2" },
      "Siro biết nếu bước đi vội vàng trên sàn đầy xà phòng, chắc chắn sẽ trượt ngã rất nguy hiểm. Cậu vớ lấy giỏ đồ giặt, rút ra những chiếc khăn tắm khô. Siro trải từng chiếc khăn xuống sàn tạo thành một \"cây cầu\" an toàn, không bị trơn trượt. \"Simi, dẫm lên khăn rồi bước từ từ ra ngoài cửa nhé!\" – cậu dặn em gái. Khi Simi đã ra khỏi phòng tắm an toàn, Siro bước vững vàng trên lớp khăn, tiến thẳng đến bồn tắm. Cậu vặn chặt vòi nước lại và lấy vòi sen xịt nước sạch vào Thủy Quái. Không còn nguồn cung cấp xà phòng và nước chảy tràn, Thủy Quái xẹp lép ngay lập tức rồi trôi tuột xuống nắp cống. Mẹ Phương bước vào, khen ngợi Siro đã nhanh trí xử lý tình huống trơn trượt an toàn, và hai anh em học được bài học lớn về việc tiết kiệm xà phòng, giữ cho sàn nhà luôn khô ráo.",
      { type: 'image', src: "/reading/nhat-ky-siro/tap-15-hinh-03.webp", alt: "Tập 15: Trận Lụt Bong Bóng Trơn Trượt - minh họa 3" },
    ],
  },
  {
    id: 'bo-oi-charmander-tap-1',
    title: 'Bố Ơi, Charmander Đến Đây - Tập 1',
    subtitle: 'Ngọn Lửa Nhỏ Quả Cảm',
    image: '/reading/bo-oi-charmander/tap-1.webp',
    lines: [
      'Tập 1: Ngọn Lửa Nhỏ Quả Cảm',
      'Ngày xửa ngày xưa, trong một khu rừng xanh mát, có hai bố con khủng long lửa sống với nhau vô cùng hạnh phúc.',
      'Người bố vô cùng to lớn, mạnh mẽ, và yêu thương cậu con trai bé nhỏ Charmander vô bờ bến.',
      'Mỗi buổi tối, bố luôn ôm Charmander vào lòng, sưởi ấm cậu bằng ngọn lửa êm dịu ở đuôi và thì thầm: "Con trai của bố, dù có chuyện gì xảy ra, bố cũng sẽ luôn ở bên và bảo vệ con!"',
      'Nhưng rồi một ngày, Binh Đoàn Bóng Đêm ập đến.',
      'Tên Thủ Lĩnh Bóng Đêm muốn cướp đi ngọn lửa ánh sáng của rừng xanh, nên đã dùng phép thuật xấu xa bắt cóc bố đi.',
      'Charmander bé nhỏ tỉnh dậy không thấy bố đâu, cậu bật khóc.',
      'Nhưng nhớ lại lời bố dặn phải luôn dũng cảm, Charmander lau nước mắt.',
      'Ngọn lửa nhỏ xíu ở chóp đuôi cậu cháy sáng lên.',
      'Ở hình thái Charmander, cậu có vóc dáng nhỏ bé, nhanh nhẹn, và sức mạnh là tuyệt chiêu "Đốm Lửa Nhỏ" (Ember).',
      'Nó chỉ như một tia lửa nhỏ xíu, nhưng mang đầy tình yêu thương.',
      '"Bố ơi, hãy đợi con! Con sẽ đi tìm bố!"',
      'Charmander gõ gõ hai chiếc chân nhỏ xíu xuống đất và bắt đầu hành trình.',
    ],
  },
  {
    id: 'bo-oi-charmander-tap-2',
    title: 'Bố Ơi, Charmander Đến Đây - Tập 2',
    subtitle: 'Móng Vuốt Sắc Nhọn',
    image: '/reading/bo-oi-charmander/tap-2.webp',
    lines: [
      'Tập 2: Móng Vuốt Sắc Nhọn',
      'Charmander đi mãi, đi mãi cho đến khi lạc vào Hẻm Núi Đá Tối Tăm.',
      'Đột nhiên, "Rầm! Rầm!", một con Quái Vật Đá khổng lồ của Binh Đoàn Bóng Đêm chặn đường.',
      'Quái Vật Đá vung cánh tay to như tảng núi đập xuống.',
      'Charmander nhanh nhẹn né tránh và phun "Đốm Lửa Nhỏ".',
      'Nhưng... xèo xèo... đốm lửa quá nhỏ, chạm vào lớp đá cứng ngắc của quái vật liền tắt ngấm.',
      'Quái Vật Đá cười lớn, dồn ép Charmander vào góc tường.',
      'Ngay lúc tưởng chừng như gục ngã, Charmander nhắm mắt lại.',
      'Cậu nhớ đến cái ôm ấm áp của bố. Cậu muốn cứu bố!',
      'Trái tim Charmander đập mạnh, một nguồn sức mạnh bùng nổ từ bên trong.',
      'BÙM! Một ánh sáng chói lóa phát ra.',
      'Charmander bé nhỏ đã lớn phổng lên, lớp da chuyển sang màu đỏ rực, mọc ra một chiếc sừng dũng mãnh và đôi tay có móng vuốt vô cùng sắc bén.',
      'Cậu đã tiến hóa thành Charmeleon!',
      'Ở hình thái này, ngọn lửa ở đuôi cháy hừng hực.',
      'Charmeleon hét lớn, sử dụng sức mạnh mới: "Móng Vuốt Lửa" (Fire Fang).',
      'Đôi móng vuốt của cậu bùng cháy, vung lên cào một nhát thật mạnh, cắt đôi cả tảng đá khổng lồ của quái vật.',
      'Quái Vật Đá sợ hãi bỏ chạy. Charmeleon tự tin bước tiếp.',
    ],
  },
  {
    id: 'bo-oi-charmander-tap-3',
    title: 'Bố Ơi, Charmander Đến Đây - Tập 3',
    subtitle: 'Đôi Cánh Rồng Vút Bay',
    image: '/reading/bo-oi-charmander/tap-3.webp',
    lines: [
      'Tập 3: Đôi Cánh Rồng Vút Bay',
      'Cuối cùng, Charmeleon cũng đến được Lâu Đài Bóng Đêm nằm trên một đỉnh núi cao ngất trời.',
      'Nhìn lên đỉnh tháp cao nhất, cậu thấy bố mình đang bị nhốt trong một chiếc lồng sắt lạnh lẽo.',
      'Tên Thủ Lĩnh Bóng Đêm xuất hiện, bay lơ lửng trên không trung.',
      'Hắn tung ra những luồng gió đen hất văng Charmeleon xuống đất.',
      'Charmeleon cố gắng phóng lên, nhưng cậu không biết bay. Khoảng cách quá cao!',
      'Tên thủ lĩnh cười nhạo: "Ngươi không bao giờ cứu được bố đâu vì ngươi không có cánh!"',
      'Charmeleon nhìn lên chiếc lồng. Bố đang nhìn xuống, ánh mắt đầy hi vọng và yêu thương.',
      '"Mình không thể bỏ cuộc! Mình muốn bay đến bên bố!"',
      'Sự quyết tâm mãnh liệt và tình yêu thương vô hạn đã đánh thức sức mạnh tiềm ẩn cuối cùng.',
      'Ngọn lửa ở đuôi Charmeleon bùng lên cao như một cột đuốc.',
      'VÚT! Charmeleon biến đổi hoàn toàn.',
      'Cơ thể cậu to lớn khổng lồ, mọc ra một đôi cánh rồng vô cùng oai vệ.',
      'Cậu đã tiến hóa thành Charizard!',
      'Sức mạnh lúc này là vô địch.',
      'Cậu sở hữu kỹ năng "Bay Lượn" (Fly) vút nhanh như một cơn lốc, và tuyệt chiêu "Bão Lửa" (Flamethrower).',
      'Charizard đập cánh, bay vút lên bầu trời, phun ra một cơn bão lửa rực rỡ thổi bay mọi đòn tấn công của Thủ Lĩnh Bóng Đêm, đánh đuổi hắn chạy mất dép.',
    ],
  },
  {
    id: 'bo-oi-charmander-tap-4',
    title: 'Bố Ơi, Charmander Đến Đây - Tập 4',
    subtitle: 'Lửa Xanh Yêu Thương',
    image: '/reading/bo-oi-charmander/tap-4.webp',
    lines: [
      'Tập 4: Lửa Xanh Yêu Thương',
      'Tưởng như mọi chuyện đã xong, nhưng Thủ Lĩnh Bóng Đêm tức giận.',
      'Hắn hút toàn bộ bóng tối để biến thành một con quái vật siêu khổng lồ, che khuất cả mặt trời.',
      'Hắn dùng sợi xích đen trói chặt đôi cánh của Charizard.',
      'Lúc này, từ trong chiếc lồng sắt, bố ném xuống một viên đá lấp lánh màu cầu vồng.',
      'Đó là "Đá Yêu Thương" mà bố đã giữ gìn.',
      'Charizard bắt lấy viên đá. Tình yêu của bố hòa quyện cùng trái tim quả cảm của Charizard.',
      'CHOÁNG! Một luồng sáng kỳ diệu bao trùm.',
      'Charizard thay đổi hình thái một lần nữa, trở thành Mega Charizard X!',
      'Lúc này, toàn thân cậu khoác lên một lớp áo giáp màu đen cực ngầu.',
      'Ngọn lửa phát ra không còn là màu cam, mà là màu xanh lam rực rỡ - ngọn lửa nóng nhất nhưng cũng ấm áp nhất.',
      'Sức mạnh tối thượng của Mega Charizard X là "Vuốt Rồng Lửa Xanh".',
      'Cậu vung cánh tay cưa đứt sợi xích đen dễ dàng như cắt giấy.',
      'Rồi cậu tung một cú đấm rực lửa xanh bay thẳng vào tên quái vật khổng lồ.',
      'Mọi bóng tối tan biến, ánh sáng mặt trời trở lại khu rừng.',
      'Charizard bay đến, dùng ngọn lửa ấm áp nung chảy chiếc lồng sắt.',
      'Bố bước ra, ôm chầm lấy Charizard to lớn.',
      'Dù Charizard giờ đã là một chú rồng khổng lồ, nhưng trong vòng tay bố, cậu vẫn luôn là đứa con bé nhỏ đáng yêu nhất.',
      'Hai bố con cùng nhau đập cánh, bay về ngôi nhà ấm áp của mình trong niềm vui hân hoan.',
    ],
  },
  {
    id: 'bo-oi-charmander-tap-5',
    title: 'Bố Ơi, Charmander Đến Đây - Tập 5',
    subtitle: 'Thung Lũng Bóng Ma và Hỏa Cầu Rực Rỡ',
    image: '/reading/bo-oi-charmander/tap-5.webp',
    lines: [
      'Tập 5: Thung Lũng Bóng Ma và Hỏa Cầu Rực Rỡ',
      'Sau khi đánh bại Binh đoàn Bóng đêm, Charizard và bố tận hưởng những ngày bình yên.',
      'Nhưng sự bình yên không kéo dài lâu. Một kẻ thù mới, thâm độc hơn, xuất hiện.',
      'Hắn là "Kẻ Thâu Tóm Ký Ức" (Memory Collector).',
      'Hắn muốn xóa đi tất cả những ký ức hạnh phúc, đặc biệt là tình yêu của bố con Charizard.',
      'Hắn tin rằng nếu không có tình yêu, ngọn lửa của chúng sẽ tắt vĩnh viễn.',
      'Hắn dùng một chiếc gương ma thuật bắt bố vào một chiều không gian khác, nơi chỉ có nỗi buồn.',
      'Charizard, dù mạnh mẽ đến đâu, cũng không thể bay xuyên qua chiếc gương. Cậu tuyệt vọng.',
      'Thủ lĩnh Kẻ Thâu Tóm ra lệnh cho "Quái Thú Gương Bóng Tối" tấn công.',
      'Con quái vật này không có hình dạng cố định, nó biến thành một bản sao đen tối của chính Charizard.',
      'Khi Charizard phun "Bão Lửa" (Flamethrower), con quái vật cũng phun ra một ngọn lửa đen ngòm, chặn đứng đòn tấn công.',
      'Càng chiến đấu, Charizard càng kiệt sức.',
      'Mỗi khi cậu tấn công, con quái vật lại phản chiếu lại đòn đánh với sức mạnh gấp đôi.',
      'Charizard bị dồn ép vào vách đá sắc nhọn.',
      'Con quái vật tụ lại một hỏa cầu đen khổng lồ, phóng thẳng vào Charizard.',
      'BÙM! Charizard gục ngã, đôi cánh rồng kiêu hãnh gãy lìa, ngọn lửa đuôi lụi tàn.',
      '"Kẻ Thâu Tóm Ký Ức" cười lớn, chuẩn bị xóa đi ký ức cuối cùng về bố.',
      'Nhưng trong bóng tối mịt mù, một tia sáng xuất hiện trong tâm trí Charizard.',
      'Đó là hình ảnh bố sưởi ấm cậu bằng ngọn lửa đuôi êm dịu khi cậu còn bé.',
      '"Tình yêu của bố là sức mạnh, con không được quên!"',
      'Trái tim Charizard đập mạnh một nhịp.',
      'Một nguồn năng lượng từ chính những ký ức yêu thương sâu đậm nhất bùng nổ.',
      'AO! AO! AAO! Khắp cơ thể Charizard phát ra một ánh sáng vàng rực rỡ, chói lòa hơn cả mặt trời.',
      'Khi ánh sáng tan đi, một hình thái mới xuất hiện: Mega Charizard Y!',
      'Cơ thể cậu thon gọn hơn, sắc sảo hơn, với màu cam truyền thống nhưng rực rỡ hơn bao giờ hết.',
      'Cặp sừng trên đầu vươn dài đầy uy lực.',
      'Đôi cánh rồng biến dạng, trở nên sắc nhọn và mọc thêm những gai nhọn dọc sống lưng.',
      'Ở hình thái này, ngọn lửa đuôi bùng phát thành một vầng hào quang rực rỡ bao quanh cậu.',
      'Sức mạnh mới của Mega Charizard Y là "Hỏa Cầu Rực Rỡ" (Searing Fireball).',
      'Cậu tập trung toàn bộ năng lượng yêu thương vào một điểm trước miệng.',
      'Một hỏa cầu khổng lồ, màu vàng óng, rực cháy như một mặt trời nhỏ, được hình thành.',
      'Mega Charizard Y vỗ đôi cánh sắc nhọn, phóng hỏa cầu đi.',
      'Nó bay xuyên qua ngọn lửa đen của Quái Thú Gương, xuyên qua cơ thể nó và đâm sầm vào chiếc gương ma thuật.',
      'CHOÁNG! XÈO XÈO! Chiếc gương vỡ tan, giải thoát cho bố.',
      'Quái Thú Gương tan biến. Mega Charizard Y đã chứng minh rằng tình yêu không bao giờ bị xóa nhòa.',
    ],
  },
  {
    id: 'bo-oi-charmander-tap-6',
    title: 'Bố Ơi, Charmander Đến Đây - Tập 6',
    subtitle: 'Cỗ Máy Quên Lãng và Bão Lửa Hủy Diệt',
    image: '/reading/bo-oi-charmander/tap-6.webp',
    lines: [
      'Tập 6: Cỗ Máy Quên Lãng và Bão Lửa Hủy Diệt',
      'Giải cứu được bố, nhưng Kẻ Thâu Tóm Ký Ức không bỏ cuộc.',
      'Hắn trốn vào "Thung Lũng Quên Lãng" và chế tạo ra một cỗ máy khủng khiếp nhất: "Cỗ Máy Quên Lãng Giga" (Giga Eraser).',
      'Cỗ máy này khổng lồ như một ngọn núi, với hàng ngàn cánh tay máy và một cái miệng hút chân không.',
      'Nó tung ra những "Sóng Quên Lãng" (Oblivion Waves).',
      'Charizard và bố tấn công cỗ máy.',
      'Tuy nhiên, mỗi khi Sóng Quên Lãng chạm vào họ, ngọn lửa đuôi của họ lại nhỏ đi một chút, và ánh mắt họ trở nên mơ màng.',
      'Charizard dùng "Móng Vuốt Lửa" (Fire Fang) cào vào vỏ thép cứng ngắc của cỗ máy, nhưng chỉ tạo ra những tiếng KENG KENG vô dụng.',
      'Cỗ máy vung một cánh tay khổng lồ, hất văng cả hai bố con xuống đất.',
      'Kẻ Thâu Tóm cười lớn: "Ngươi không bao giờ thắng được ta, vì ta có thể làm cho ngươi quên mất bố ngươi, quên mất tại sao ngươi chiến đấu!"',
      'Hắn kích hoạt Sóng Quên Lãng cực đại.',
      'Một luồng sóng đen ngòm bao trùm lấy Charizard.',
      'Cậu ngã xuống, ánh mắt trống rỗng. Ngọn lửa đuôi sắp tắt.',
      'Cậu không nhớ bố là ai, không nhớ tại sao mình lại ở đây.',
      'Bố đau đớn nhìn con trai, dùng chút sức lực cuối cùng bò đến bên Charizard và ôm chặt lấy cậu.',
      'Ngọn lửa của bố bùng lên một lần nữa, truyền chút ấm áp cuối cùng sang cho con.',
      '"Đừng bỏ cuộc, con trai của bố!"',
      'Sức ấm của bố đã xuyên qua bóng tối của Sóng Quên Lãng.',
      'Một ký ức nhỏ xíu nhưng vô cùng mạnh mẽ bùng cháy.',
      '"Mình... mình là con trai của bố. Mình phải bảo vệ bố!"',
      'Sự quyết tâm mãnh liệt và tình yêu thương vô hạn đã kích hoạt một nguồn năng lượng chưa từng có.',
      'VÚT! VÚT! Cơ thể Charizard không chỉ biến đổi, nó phồng to lên!',
      'Khổng lồ lên! To lớn hơn cả Cỗ Máy Quên Lãng.',
      'Cậu đã biến thành Gigantamax Charizard!',
      'Toàn thân cậu giờ đây là một thực thể được tạo thành từ những ngọn lửa bùng cháy dữ dội.',
      'Toàn bộ đôi cánh và dọc sống lưng là những ngọn lửa khổng lồ, rực rỡ, che khuất cả bầu trời.',
      'Ngọn lửa đuôi cao như một cột đuốc sừng sững.',
      'Tuyệt chiêu tối thượng của Gigantamax Charizard là "Bão Lửa Hủy Diệt G-Max" (G-Max Wildfire).',
      'Cậu tập trung toàn bộ ngọn lửa khổng lồ từ cơ thể lại, tạo thành một con rồng lửa khổng lồ gấp trăm lần.',
      'Con rồng lửa rầm rộ xông thẳng vào Cỗ Máy Quên Lãng.',
      'Tuyệt chiêu này thiêu rụi mọi bóng tối, mọi sóng quên lãng, và làm tan chảy cả cỗ máy thép khổng lồ.',
      'Kẻ Thâu Tóm Ký Ức bị ngọn lửa thiêu cháy, tan biến vĩnh viễn.',
      'Gigantamax Charizard khổng lồ cúi xuống, ánh mắt ấm áp đầy yêu thương, dùng ngọn lửa ấm áp của mình để hồi phục sức khỏe cho bố.',
      'Hai bố con cùng nhau đập cánh rồng khổng lồ, bay về ngôi nhà ấm áp của mình trong niềm vui chiến thắng và tình yêu vĩnh cửu.',
    ],
  },
  {
    id: 'dino-sam-tap-1',
    title: 'Dino Sấm - Tập 1',
    subtitle: 'Chiếc La Bàn Lấp Lánh',
    lines: [
      'Tập 1: Chiếc La Bàn Lấp Lánh',
      'Dino Sấm là một chú khủng long nhỏ nhưng rất dũng cảm.',
      'Bạn thân của Dino là Mít Mắt Tròn và bé Na Nắng.',
      'Một sáng nọ, Dino tìm thấy một chiếc la bàn phát sáng bên Suối Kẹo Ngọt.',
      'Mít reo lên: “Đây là la bàn của Cụ Rùa Sao!”',
      'Cụ Rùa Sao nhìn la bàn rồi nói: “Rừng Cầu Vồng đang gặp nguy hiểm.”',
      'Bốn viên Sao Dũng Cảm đã bị Hắc Nanh lấy mất.',
      'Hắc Nanh có đôi mắt đỏ và chiếc áo choàng đen như đêm.',
      'Dino Sấm nắm chặt tay và nói: “Cháu sẽ tìm lại các viên sao!”',
      'Chiếc la bàn sáng lên.',
      'Chuyến phiêu lưu đầu tiên bắt đầu.',
    ],
  },
  {
    id: 'dino-sam-tap-2',
    title: 'Dino Sấm - Tập 2',
    subtitle: 'Khu Rừng Thì Thầm',
    lines: [
      'Tập 2: Khu Rừng Thì Thầm',
      'Dino Sấm, Mít Mắt Tròn và bé Na Nắng đi vào Khu Rừng Thì Thầm.',
      'Ở đây, cây cối biết nói, nhưng hôm nay khu rừng im lặng lạ thường.',
      'Bỗng một tiếng gầm vang lên sau thân cây lớn.',
      'Mù Gai xuất hiện với chiếc áo choàng đen và đôi tay đầy gai nhọn.',
      'Mù Gai quát: “Không ai được lấy Sao Lá Xanh!”',
      'Hắn tung gai về phía bé Na.',
      'Dino Sấm lao tới che chắn cho bạn.',
      'Chiếc la bàn sáng màu xanh.',
      'Dino Sấm biến thành dạng Lá Xanh.',
      'Trên lưng cậu mọc ra những chiếc lá lớn như tấm khiên.',
      'Dino xoay người và chắn hết gai nhọn.',
      'Cậu nói: “Sức mạnh là để bảo vệ bạn bè.”',
      'Mù Gai lùi lại.',
      'Viên Sao Lá Xanh bay ra khỏi bụi gai và trở về với Dino.',
    ],
  },
  {
    id: 'dino-sam-tap-3',
    title: 'Dino Sấm - Tập 3',
    subtitle: 'Núi Lửa Ù Ù',
    lines: [
      'Tập 3: Núi Lửa Ù Ù',
      'Cả nhóm đi đến Núi Lửa Ù Ù.',
      'Mặt đất nóng ran và khói bay lên từng đợt.',
      'Trên đỉnh núi, Quỷ Khói Than đang giữ viên Sao Lửa Đỏ.',
      'Hắn cười khàn khàn: “Muốn lấy sao thì phải vượt qua khói của ta!”',
      'Quỷ Khói Than phun ra những vòng khói đen.',
      'Khói làm mọi người không nhìn thấy đường.',
      'Dino Sấm hít một hơi thật sâu.',
      'Chiếc la bàn sáng đỏ rực.',
      'Dino biến thành dạng Lửa Đỏ.',
      'Đôi chân cậu mạnh hơn và trái tim cậu sáng như ngọn đuốc.',
      'Dino nhảy qua khe núi.',
      'Cậu đập mạnh chân xuống đất.',
      'Luồng sáng đỏ thổi tan khói đen.',
      'Quỷ Khói Than hoảng sợ bỏ chạy.',
      'Viên Sao Lửa Đỏ rơi xuống tay Dino Sấm.',
    ],
  },
  {
    id: 'dino-sam-tap-4',
    title: 'Dino Sấm - Tập 4',
    subtitle: 'Hồ Nước Không Đáy',
    lines: [
      'Tập 4: Hồ Nước Không Đáy',
      'Sau núi lửa, cả nhóm đến Hồ Nước Không Đáy.',
      'Mặt hồ yên lặng như một chiếc gương lớn.',
      'Bỗng dưới nước vang lên tiếng cười lạnh.',
      'Thủy Quái Răng Lạnh trồi lên.',
      'Hắn có hàm răng sắc và chiếc đuôi dài như roi.',
      'Thủy Quái gầm lên: “Sao Sóng Bạc là của ta!”',
      'Hắn tạo ra những cơn sóng lớn.',
      'Bé Na suýt bị cuốn đi.',
      'Dino Sấm nhảy xuống nước.',
      'Chiếc la bàn sáng màu bạc.',
      'Dino biến thành dạng Sóng Bạc.',
      'Thân cậu nhẹ và nhanh như dòng nước.',
      'Dino lướt qua từng con sóng.',
      'Cậu xoay tròn tạo thành vòng nước sáng.',
      'Vòng nước cuốn Thủy Quái ra xa bờ.',
      'Viên Sao Sóng Bạc nổi lên lấp lánh dưới ánh mặt trời.',
    ],
  },
  {
    id: 'dino-sam-tap-5',
    title: 'Dino Sấm - Tập 5',
    subtitle: 'Thung Lũng Sấm Chớp',
    lines: [
      'Tập 5: Thung Lũng Sấm Chớp',
      'Ba viên sao đã trở về.',
      'Chỉ còn viên cuối cùng ở Thung Lũng Sấm Chớp.',
      'Nơi đó luôn có tiếng ù ù trên bầu trời.',
      'Kẻ canh giữ là Lôi Dực Hắc Ám.',
      'Hắn có đôi cánh đen và tiếng hét làm đá nứt ra.',
      'Lôi Dực hét lớn: “Không ai thắng được tốc độ của ta!”',
      'Hắn lao xuống nhanh như bóng tối.',
      'Dino Sấm không kịp tránh.',
      'Chiếc la bàn bỗng sáng vàng rực.',
      'Dino biến thành dạng Sấm Vàng.',
      'Đôi mắt cậu sáng lên.',
      'Bước chân cậu nhanh như tia chớp.',
      'Dino chạy quanh Lôi Dực và tạo thành vòng sáng.',
      'Ánh sáng làm đôi cánh đen yếu dần.',
      'Lôi Dực bỏ chạy vào mây xám.',
      'Viên Sao Sấm Vàng trở về.',
    ],
  },
  {
    id: 'dino-sam-tap-6',
    title: 'Dino Sấm - Tập 6',
    subtitle: 'Đối Đầu Hắc Nanh',
    lines: [
      'Tập 6: Đối Đầu Hắc Nanh',
      'Bốn viên Sao Dũng Cảm đã đủ.',
      'Nhưng Hắc Nanh xuất hiện giữa Rừng Cầu Vồng.',
      'Hắn cao lớn, có đôi mắt đỏ và chiếc áo choàng đen như đêm.',
      'Hắc Nanh gầm lên: “Ta sẽ lấy hết ánh sáng!”',
      'Bóng tối phủ xuống khu rừng.',
      'Dino Sấm đứng trước bạn bè và không run sợ.',
      'Cậu dùng Lá Xanh để bảo vệ mọi người.',
      'Cậu dùng Lửa Đỏ để tiến lên.',
      'Cậu dùng Sóng Bạc để né bóng tối.',
      'Cậu dùng Sấm Vàng để thắp sáng bầu trời.',
      'Bốn viên sao bay quanh Dino Sấm.',
      'Ánh sáng cầu vồng bừng lên rực rỡ.',
      'Hắc Nanh hét lớn rồi tan thành làn khói đen.',
      'Rừng Cầu Vồng sáng trở lại.',
      'Bé Na cười thật tươi: “Dino Sấm giỏi quá!”',
      'Dino lắc đầu và nói: “Chúng ta cùng dũng cảm.”',
      'Từ đó, Dino Sấm trở thành người bạn nhỏ của cả Rừng Cầu Vồng.',
    ],
  },
  {
    id: 'be-di-hoc',
    title: 'Bé Đi Học',
    subtitle: 'Câu ngắn, dễ đọc',
    lines: [
      'Sáng nay bé dậy sớm.',
      'Bé rửa mặt thật sạch.',
      'Bé mặc áo mới và đeo cặp.',
      'Bé chào ông bà, chào ba mẹ.',
      'Bé vui vẻ đi học.',
    ],
  },
  {
    id: 'buoi-sang',
    title: 'Buổi Sáng Của Em',
    subtitle: 'Luyện đọc từng câu',
    lines: [
      'Mặt trời lên cao.',
      'Ánh nắng vàng trên sân.',
      'Em mở cửa sổ.',
      'Em hít thở thật sâu.',
      'Một ngày mới bắt đầu.',
    ],
  },
  {
    id: 'gia-dinh-em',
    title: 'Gia Đình Em',
    subtitle: 'Đọc chậm và rõ',
    lines: [
      'Gia đình em rất vui.',
      'Ông kể chuyện cho em nghe.',
      'Bà dạy em nói lời hay.',
      'Ba mẹ luôn yêu thương em.',
      'Em yêu gia đình của em.',
    ],
  },
  {
    id: 'chiec-cap-moi',
    title: 'Chiếc Cặp Mới',
    subtitle: 'Luyện đọc rõ tiếng',
    lines: [
      'Em có một chiếc cặp mới.',
      'Cặp màu xanh rất đẹp.',
      'Trong cặp có sách và vở.',
      'Em giữ cặp luôn sạch sẽ.',
      'Em mang cặp đến lớp mỗi ngày.',
    ],
  },
  {
    id: 'cay-but-chi',
    title: 'Cây Bút Chì',
    subtitle: 'Câu dài hơn một chút',
    lines: [
      'Cây bút chì nằm trên bàn.',
      'Em dùng bút để viết chữ.',
      'Em viết từng nét thật ngay ngắn.',
      'Khi viết sai, em sửa lại từ từ.',
      'Mỗi ngày em viết đẹp hơn.',
    ],
  },
];

const READING_SERIES = [
  {
    id: 'mr-saiyan',
    title: "Mr. Saiyan Người Hùng Trái Đất",
    description: 'Truyện người hùng Trái Đất',
    lessonIds: [
      'mr-saiyan-tap-1',
      'mr-saiyan-tap-2',
      'mr-saiyan-tap-3',
      'mr-saiyan-tap-4',
      'mr-saiyan-tap-5',
      'mr-saiyan-tap-6',
      'mr-saiyan-tap-7',
      'mr-saiyan-tap-8',
      'mr-saiyan-tap-9',
      'mr-saiyan-tap-10',
      'mr-saiyan-tap-11',
      'mr-saiyan-tap-12',
      'mr-saiyan-tap-13',
      'mr-saiyan-tap-14',
      'mr-saiyan-tap-15',
      'mr-saiyan-tap-16',
      'mr-saiyan-tap-17',
      'mr-saiyan-tap-18',
      'mr-saiyan-tap-19',
      'mr-saiyan-tap-20',
    ],
  },
  {
    id: 'nhat-ky-siro',
    title: 'Nhật Ký Phiêu Lưu Của Siro và Các Bạn',
    description: 'Bộ truyện phiêu lưu của Siro và các bạn',
    lessonIds: [
      'nhat-ky-siro-tap-1',
      'nhat-ky-siro-tap-2',
      'nhat-ky-siro-tap-3',
      'nhat-ky-siro-tap-4',
      'nhat-ky-siro-tap-5',
      'nhat-ky-siro-tap-6',
      'nhat-ky-siro-tap-7',
      'nhat-ky-siro-tap-8',
      'nhat-ky-siro-tap-9',
      'nhat-ky-siro-tap-10',
      'nhat-ky-siro-tap-11',
      'nhat-ky-siro-tap-12',
      'nhat-ky-siro-tap-13',
      'nhat-ky-siro-tap-14',
      'nhat-ky-siro-tap-15',

    ],
  },
  {
    id: 'bo-oi-charmander',
    title: 'Bố Ơi, Charmander Đến Đây',
    description: 'Bộ truyện khủng long lửa',
    lessonIds: [
      'bo-oi-charmander-tap-1',
      'bo-oi-charmander-tap-2',
      'bo-oi-charmander-tap-3',
      'bo-oi-charmander-tap-4',
      'bo-oi-charmander-tap-5',
      'bo-oi-charmander-tap-6',
    ],
  },
  {
    id: 'dino-sam',
    title: 'Dino Sấm',
    description: 'Bộ truyện phiêu lưu',
    lessonIds: [
      'dino-sam-tap-1',
      'dino-sam-tap-2',
      'dino-sam-tap-3',
      'dino-sam-tap-4',
      'dino-sam-tap-5',
      'dino-sam-tap-6',
    ],
  },
];

const READING_SERIES_BY_READING_ID = READING_SERIES.reduce((items, series) => {
  series.lessonIds.forEach((readingId, index) => {
    items[readingId] = {
      seriesId: series.id,
      seriesTitle: series.title,
      episodeNumber: index + 1,
    };
  });

  return items;
}, {});

const formatReadingLabel = (title = '') => String(title).replace(/\s+-\s+/g, ' ');

const clampNumber = (value, fallback, min, max) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), min), max);
};

const normalizeReadingProgress = (progress) => {
  if (!progress || typeof progress !== 'object' || Array.isArray(progress)) return {};

  return Object.entries(progress).reduce((items, [readingId, value]) => {
    const scrollTop = clampNumber(
      typeof value === 'number' ? value : value?.scrollTop,
      0,
      0,
      300000
    );
    const completed = typeof value === 'object' && !Array.isArray(value)
      ? !!value.completed
      : false;

    if (typeof readingId === 'string' && readingId.trim()) {
      items[readingId] = { scrollTop, completed };
    }

    return items;
  }, {});
};

const loadReadingProgress = () => {
  try {
    const savedProgress = localStorage.getItem(READING_PROGRESS_KEY);
    return savedProgress ? normalizeReadingProgress(JSON.parse(savedProgress)) : {};
  } catch {
    return {};
  }
};

const normalizeReadingHistory = (history) => {
  if (!Array.isArray(history)) return [];

  return history
    .map((entry) => {
      const completedTitles = Array.isArray(entry.completedTitles)
        ? entry.completedTitles
          .map(title => String(title || '').slice(0, 90))
          .filter(Boolean)
          .slice(0, READING_LESSONS.length)
        : [];

      return {
        id: Number(entry.id || entry.startedAt || entry.endedAt),
        startedAt: Number(entry.startedAt || entry.id || entry.endedAt),
        endedAt: Number(entry.endedAt),
        studentName: String(entry.studentName || 'bé').slice(0, 28),
        completedCount: clampNumber(entry.completedCount, 0, 0, READING_LESSONS.length),
        totalCount: clampNumber(entry.totalCount, READING_LESSONS.length, 1, READING_LESSONS.length),
        completedTitles,
        inProgressTitle: String(entry.inProgressTitle || 'Không có').slice(0, 90),
        durationSec: clampNumber(entry.durationSec, 0, 0, 24 * 60 * 60),
      };
    })
    .filter((entry) => Number.isFinite(entry.id) && Number.isFinite(entry.endedAt))
    .sort((a, b) => b.endedAt - a.endedAt)
    .slice(0, MAX_SESSION_HISTORY);
};

const loadReadingHistory = () => {
  try {
    const savedHistory = localStorage.getItem(READING_HISTORY_KEY);
    return savedHistory ? normalizeReadingHistory(JSON.parse(savedHistory)) : [];
  } catch {
    return [];
  }
};

const padTwo = (value) => String(value).padStart(2, '0');

const formatDateTime = (timestamp) => {
  if (!timestamp) return 'Chưa có dữ liệu';

  const date = new Date(timestamp);
  return `${padTwo(date.getHours())}:${padTwo(date.getMinutes())}:${padTwo(date.getSeconds())} ngày ${padTwo(date.getDate())}/${padTwo(date.getMonth() + 1)}/${date.getFullYear()}`;
};

const normalizeSessionHistory = (history) => {
  if (!Array.isArray(history)) return [];

  return history
    .map((entry) => ({
      id: Number(entry.id || entry.startedAt || entry.endedAt),
      startedAt: Number(entry.startedAt || entry.id || entry.endedAt),
      endedAt: Number(entry.endedAt),
      correctTotal: clampNumber(entry.correctTotal, 0, 0, 9999),
      wrongTotal: clampNumber(entry.wrongTotal, 0, 0, 9999),
      timeoutTotal: clampNumber(entry.timeoutTotal, 0, 0, 9999),
      reviewCount: clampNumber(entry.reviewCount, 0, 0, 9999),
      screenTime: clampNumber(entry.screenTime, 0, MIN_TIME, MAX_TIME),
      durationSec: clampNumber(entry.durationSec, 0, 0, 24 * 60 * 60),
      studentName: String(entry.studentName || 'bé').slice(0, 28),
      lessonLabel: String(entry.lessonLabel || '').slice(0, 60),
    }))
    .filter((entry) => Number.isFinite(entry.id) && Number.isFinite(entry.endedAt))
    .sort((a, b) => b.endedAt - a.endedAt)
    .slice(0, MAX_SESSION_HISTORY);
};

const loadSessionHistory = () => {
  try {
    const savedHistory = localStorage.getItem(SESSION_HISTORY_KEY);
    return savedHistory ? normalizeSessionHistory(JSON.parse(savedHistory)) : [];
  } catch {
    return [];
  }
};

const loadCurrentSessionStartedAt = () => {
  try {
    const startedAt = Number(localStorage.getItem(CURRENT_SESSION_STARTED_AT_KEY));
    return Number.isFinite(startedAt) && startedAt > 0 ? startedAt : null;
  } catch {
    return null;
  }
};

const isLearningSessionExpired = (startedAt, now = Date.now()) => (
  Number.isFinite(Number(startedAt))
  && Number(startedAt) > 0
  && now - Number(startedAt) >= LEARNING_SESSION_WINDOW_MS
);

const saveCurrentSessionStartedAt = (startedAt) => {
  try {
    if (startedAt) {
      localStorage.setItem(CURRENT_SESSION_STARTED_AT_KEY, String(startedAt));
    } else {
      localStorage.removeItem(CURRENT_SESSION_STARTED_AT_KEY);
    }
  } catch {
    console.log("Cannot save current session start");
  }
};

const createEndSessionGuard = (now = Date.now()) => ({
  windowStartedAt: now,
  count: 0,
});

const normalizeEndSessionGuard = (guard, now = Date.now()) => {
  if (!guard || typeof guard !== 'object' || Array.isArray(guard)) {
    return createEndSessionGuard(now);
  }

  const windowStartedAt = Number(guard.windowStartedAt);
  const isWindowValid = Number.isFinite(windowStartedAt)
    && windowStartedAt > 0
    && now - windowStartedAt < END_SESSION_WINDOW_MS;

  if (!isWindowValid) {
    return createEndSessionGuard(now);
  }

  return {
    windowStartedAt,
    count: clampNumber(guard.count, 0, 0, 999),
  };
};

const loadEndSessionGuard = () => {
  try {
    const savedGuard = localStorage.getItem(END_SESSION_GUARD_KEY);
    return savedGuard ? normalizeEndSessionGuard(JSON.parse(savedGuard)) : createEndSessionGuard();
  } catch {
    return createEndSessionGuard();
  }
};

const saveEndSessionGuard = (guard) => {
  try {
    localStorage.setItem(END_SESSION_GUARD_KEY, JSON.stringify(guard));
  } catch {
    console.log("Cannot save end session guard");
  }
};

const normalizeRobuxBalance = (value) => clampNumber(value, 0, 0, 999999);

const loadRobuxBalance = () => {
  try {
    return normalizeRobuxBalance(localStorage.getItem(ROBUX_BALANCE_KEY));
  } catch {
    return 0;
  }
};

const normalizeColoringTimeLeft = (value) => clampNumber(value, 0, 0, MAX_COLORING_TIME_LEFT);

const loadColoringTimeLeft = () => {
  try {
    return normalizeColoringTimeLeft(localStorage.getItem(COLORING_TIME_LEFT_KEY));
  } catch {
    return 0;
  }
};

const loadDrawingTimeLeft = () => {
  try {
    return normalizeColoringTimeLeft(localStorage.getItem(DRAWING_TIME_LEFT_KEY));
  } catch {
    return 0;
  }
};

const loadGameTimeLeft = () => {
  try {
    return normalizeColoringTimeLeft(localStorage.getItem(GAME_TIME_LEFT_KEY));
  } catch {
    return 0;
  }
};

const normalizeUnlockedColoringLevels = (levels) => {
  if (!Array.isArray(levels)) return [];

  const validLevelIds = new Set(COLORING_LEVEL_IDS);
  return Array.from(new Set(levels
    .map(level => Number(level))
    .filter(level => Number.isInteger(level) && validLevelIds.has(level))
  )).sort((a, b) => a - b);
};

const loadUnlockedColoringLevels = () => {
  try {
    const savedLevels = localStorage.getItem(ROBUX_UNLOCKED_COLORING_KEY);
    return savedLevels ? normalizeUnlockedColoringLevels(JSON.parse(savedLevels)) : [];
  } catch {
    return [];
  }
};

const normalizeSelectedTables = (tables) => {
  if (!Array.isArray(tables)) return ALL_ADDITION_TABLES;

  const uniqueTables = Array.from(new Set(tables
    .map(table => Number(table))
    .filter(table => Number.isInteger(table) && table >= 1 && table <= 10)
  )).sort((a, b) => a - b);

  return uniqueTables.length > 0 ? uniqueTables : ALL_ADDITION_TABLES;
};

const normalizeLessonType = (lessonType) => (
  LESSON_TYPE_IDS.has(lessonType) ? lessonType : DEFAULT_LESSON_TYPE
);

const getValidLessonTypes = (lessonTypes) => {
  const rawLessonTypes = Array.isArray(lessonTypes) ? lessonTypes : [lessonTypes];
  const selectedIds = new Set(rawLessonTypes.filter(type => LESSON_TYPE_IDS.has(type)));
  return LESSON_TYPES
    .map(type => type.id)
    .filter(id => selectedIds.has(id));
};

const normalizeLessonTypes = (settings = {}) => {
  const validLessonTypes = getValidLessonTypes(
    Array.isArray(settings.lessonTypes) ? settings.lessonTypes : [settings.lessonType]
  );

  return validLessonTypes.length > 0 ? validLessonTypes : [DEFAULT_LESSON_TYPE];
};

const normalizeLearningMode = (learningMode) => (
  LEARNING_MODE_IDS.has(learningMode) ? learningMode : DEFAULT_LEARNING_MODE
);

const normalizeCustomQuestionsText = (text) => String(text || '').slice(0, 3000);

const normalizeSettings = (settings = {}) => {
  const lessonTypes = normalizeLessonTypes(settings);

  return {
    timeLimit: clampNumber(settings.timeLimit, DEFAULT_SETTINGS.timeLimit, 3, 60),
    rewardSec: clampNumber(settings.rewardSec, DEFAULT_SETTINGS.rewardSec, 5, 600),
    penaltySec: clampNumber(settings.penaltySec, DEFAULT_SETTINGS.penaltySec, 5, 600),
    robuxReward: clampNumber(settings.robuxReward, DEFAULT_SETTINGS.robuxReward, MIN_ROBUX_REWARD, MAX_ROBUX_REWARD),
    coloringUnlockCost: clampNumber(
      settings.coloringUnlockCost,
      DEFAULT_SETTINGS.coloringUnlockCost,
      MIN_COLORING_UNLOCK_COST,
      MAX_COLORING_UNLOCK_COST
    ),
    coloringTimeExchangeCost: clampNumber(
      settings.coloringTimeExchangeCost,
      DEFAULT_SETTINGS.coloringTimeExchangeCost,
      MIN_TIME_EXCHANGE_COST,
      MAX_TIME_EXCHANGE_COST
    ),
    drawingTimeExchangeCost: clampNumber(
      settings.drawingTimeExchangeCost,
      DEFAULT_SETTINGS.drawingTimeExchangeCost,
      MIN_TIME_EXCHANGE_COST,
      MAX_TIME_EXCHANGE_COST
    ),
    gameTimeExchangeCost: clampNumber(
      settings.gameTimeExchangeCost,
      DEFAULT_SETTINGS.gameTimeExchangeCost,
      MIN_TIME_EXCHANGE_COST,
      MAX_TIME_EXCHANGE_COST
    ),
    soundVolumePercent: clampNumber(settings.soundVolumePercent, DEFAULT_SETTINGS.soundVolumePercent, 0, MAX_SOUND_VOLUME_PERCENT),
    learningMode: normalizeLearningMode(settings.learningMode),
    lessonType: lessonTypes[0],
    lessonTypes,
    customQuestionsText: normalizeCustomQuestionsText(settings.customQuestionsText),
    selectedTables: normalizeSelectedTables(settings.selectedTables),
  };
};

const getLessonConfigKey = (settings = {}) => {
  const normalizedSettings = normalizeSettings(settings);

  return JSON.stringify({
    lessonTypes: normalizedSettings.lessonTypes,
    customQuestionsText: normalizedSettings.customQuestionsText,
    selectedTables: normalizedSettings.selectedTables,
  });
};

const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    return savedSettings ? normalizeSettings(JSON.parse(savedSettings)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const loadStagedLearningEnabled = () => (
  localStorage.getItem(STAGED_LEARNING_KEY) === 'true'
);

const loadStagedRememberTarget = () => clampNumber(
  localStorage.getItem(STAGED_REMEMBER_TARGET_KEY),
  DEFAULT_STAGED_REMEMBER_TARGET,
  MIN_STAGED_REMEMBER_TARGET,
  MAX_STAGED_REMEMBER_TARGET
);

const getGeneratedQuestionPool = (settings = DEFAULT_SETTINGS) => (
  generateInitialPool(settings).filter(question => question.lessonType !== 'custom')
);

const normalizeStageName = (name, fallback) => {
  const normalizedName = String(name || '').trim().slice(0, MAX_STAGED_STAGE_NAME_LENGTH);
  return normalizedName || fallback;
};

const buildDefaultStagedStages = (settings = DEFAULT_SETTINGS) => {
  const generatedPool = getGeneratedQuestionPool(settings);

  return DEFAULT_STAGED_STAGE_GROUPS
    .map((stage, index) => ({
      id: stage.id,
      name: stage.name || `Chặng ${index + 1}`,
      questionIds: generatedPool
        .filter(question => stage.bValues.includes(question.b))
        .map(question => question.id),
    }))
    .filter(stage => stage.questionIds.length > 0);
};

const normalizeStagedStages = (stages, settings = DEFAULT_SETTINGS, options = {}) => {
  const { keepEmpty = false, fallbackToDefault = true } = options;
  const generatedPool = getGeneratedQuestionPool(settings);
  const generatedQuestionIds = new Set(generatedPool.map(question => question.id));
  const sourceStages = Array.isArray(stages) ? stages : [];
  const rawStages = sourceStages.length > 0
    ? sourceStages
    : fallbackToDefault
      ? buildDefaultStagedStages(settings)
      : [];
  const seenStageIds = new Set();
  const seenQuestionIds = new Set();

  return rawStages
    .map((stage, index) => {
      const fallbackId = `stage-${index + 1}`;
      const rawId = typeof stage?.id === 'string' && stage.id.trim()
        ? stage.id.trim()
        : fallbackId;
      const id = seenStageIds.has(rawId) ? `${rawId}-${index + 1}` : rawId;
      const fallbackName = `Chặng ${index + 1}`;
      const rawQuestionIds = Array.isArray(stage?.questionIds)
        ? stage.questionIds
        : Number.isInteger(stage?.min) && Number.isInteger(stage?.max)
          ? generatedPool
            .filter(question => question.b >= stage.min && question.b <= stage.max)
            .map(question => question.id)
          : [];
      const questionIds = [];

      seenStageIds.add(id);

      rawQuestionIds.forEach((questionId) => {
        if (
          typeof questionId === 'string'
          && generatedQuestionIds.has(questionId)
          && !seenQuestionIds.has(questionId)
        ) {
          seenQuestionIds.add(questionId);
          questionIds.push(questionId);
        }
      });

      return {
        id,
        name: keepEmpty
          ? String(stage?.name || '').slice(0, MAX_STAGED_STAGE_NAME_LENGTH)
          : normalizeStageName(stage?.name, fallbackName),
        questionIds,
      };
    })
    .filter(stage => keepEmpty || stage.questionIds.length > 0);
};

const loadStagedStages = (settings = DEFAULT_SETTINGS) => {
  try {
    const savedStages = localStorage.getItem(STAGED_STAGES_KEY);
    const normalizedStages = savedStages
      ? normalizeStagedStages(JSON.parse(savedStages), settings, { fallbackToDefault: false })
      : [];

    return normalizedStages.length > 0 ? normalizedStages : buildDefaultStagedStages(settings);
  } catch {
    return buildDefaultStagedStages(settings);
  }
};

const getStagedStagesConfigKey = (stages, settings = DEFAULT_SETTINGS) => (
  JSON.stringify(normalizeStagedStages(stages, settings, { fallbackToDefault: false }))
);

const normalizeStagedProgress = (progress) => {
  if (!progress || typeof progress !== 'object' || Array.isArray(progress)) return {};

  return Object.fromEntries(
    Object.entries(progress)
      .filter(([questionId]) => typeof questionId === 'string' && questionId.length > 0)
      .map(([questionId, correctCount]) => [
        questionId,
        clampNumber(correctCount, 0, 0, MAX_STAGED_REMEMBER_TARGET),
      ])
  );
};

const loadStagedProgress = () => {
  try {
    const savedProgress = localStorage.getItem(STAGED_PROGRESS_KEY);
    return savedProgress ? normalizeStagedProgress(JSON.parse(savedProgress)) : {};
  } catch {
    return {};
  }
};

const getStagedLearningStatus = (
  pool,
  progress,
  rememberTarget = DEFAULT_STAGED_REMEMBER_TARGET,
  stages = []
) => {
  const generatedPool = pool.filter(question => question.lessonType !== 'custom');
  const poolById = new Map(generatedPool.map(question => [question.id, question]));
  const rawStages = Array.isArray(stages) && stages.length > 0
    ? stages
    : DEFAULT_STAGED_STAGE_GROUPS.map((stage, index) => ({
      id: stage.id,
      name: stage.name || `Chặng ${index + 1}`,
      questionIds: generatedPool
        .filter(question => stage.bValues.includes(question.b))
        .map(question => question.id),
    }));
  const seenQuestionIds = new Set();
  const stageEntries = rawStages
    .map((stage, index) => {
      const questionIds = Array.isArray(stage?.questionIds) ? stage.questionIds : [];
      const stagePool = questionIds
        .filter(questionId => {
          if (seenQuestionIds.has(questionId)) return false;
          seenQuestionIds.add(questionId);
          return true;
        })
        .map(questionId => poolById.get(questionId))
        .filter(Boolean);

      return {
        id: stage?.id || `stage-${index + 1}`,
        name: normalizeStageName(stage?.name, `Chặng ${index + 1}`),
        questionIds: stagePool.map(question => question.id),
        stagePool,
      };
    })
    .filter(stage => stage.stagePool.length > 0);
  const eligiblePool = stageEntries.flatMap(stage => stage.stagePool);

  if (eligiblePool.length === 0) {
    return {
      eligiblePool,
      currentPool: pool,
      currentStage: null,
      label: STAGED_RANDOM_LABEL,
      isRandom: true,
    };
  }

  for (const stage of stageEntries) {
    const stagePool = stage.stagePool;
    const rememberedCount = stagePool.filter(
      question => (progress[question.id] || 0) >= rememberTarget
    ).length;
    const pendingStagePool = stagePool.filter(
      question => (progress[question.id] || 0) < rememberTarget
    );

    if (stagePool.length > 0 && rememberedCount < stagePool.length) {
      return {
        eligiblePool,
        currentPool: pendingStagePool,
        currentStage: stage,
        label: stage.name,
        isRandom: false,
        rememberedCount,
        totalCount: stagePool.length,
      };
    }
  }

  return {
    eligiblePool,
    currentPool: eligiblePool,
    currentStage: null,
    label: STAGED_RANDOM_LABEL,
    isRandom: true,
    rememberedCount: eligiblePool.length,
    totalCount: eligiblePool.length,
  };
};

const resizeAvatarFile = (file) => new Promise((resolve, reject) => {
  if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
    reject(new Error('Unsupported avatar type'));
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Cannot read avatar'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('Cannot load avatar'));
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Cannot resize avatar'));
        return;
      }

      const scale = Math.max(AVATAR_SIZE / image.width, AVATAR_SIZE / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      const x = (AVATAR_SIZE - width) / 2;
      const y = (AVATAR_SIZE - height) / 2;

      context.drawImage(image, x, y, width, height);
      resolve(canvas.toDataURL('image/webp', 0.82));
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});

const getLessonType = (lessonType) => (
  LESSON_TYPES.find(type => type.id === normalizeLessonType(lessonType)) || LESSON_TYPES[0]
);

const getLessonTypes = (settings = {}) => (
  normalizeLessonTypes(settings).map(type => getLessonType(type))
);

const getLessonLabel = (settings = {}) => (
  getLessonTypes(settings).map(type => type.label).join(' + ')
);

const makeQuestion = ({ lessonType, table, b, questionText, answerText, ans }) => {
  const normalizedLessonType = normalizeLessonType(lessonType);

  return {
    id: `${normalizedLessonType}:${table}:${b}`,
    lessonType: normalizedLessonType,
    table,
    a: table,
    b,
    ans,
    questionText,
    answerText,
  };
};

const parseCustomQuestions = (text) => normalizeCustomQuestionsText(text)
  .split(/\r?\n/)
  .map((line, index) => {
    const normalizedLine = line
      .replace(/[×xX*]/g, '×')
      .replace(/[÷:]/g, '÷')
      .replace(/\s+/g, ' ')
      .trim();
    const match = normalizedLine.match(/^(.+?)\s*=\s*(-?\d+)$/);
    if (!match) return null;

    const leftSide = match[1].replace(/\?+$/, '').trim();
    const ans = Number(match[2]);
    if (!leftSide || !Number.isInteger(ans)) return null;

    return {
      id: `custom:${index}:${leftSide}:${ans}`,
      lessonType: 'custom',
      table: 0,
      a: 0,
      b: index,
      ans,
      questionText: `${leftSide} = ?`,
      answerText: `${leftSide} = ${ans}`,
    };
  })
  .filter(Boolean);

const generateInitialPool = (settings = DEFAULT_SETTINGS) => {
  const normalizedSettings = normalizeSettings(settings);
  const pool = [];

  if (normalizedSettings.lessonTypes.includes('custom')) {
    pool.push(...parseCustomQuestions(normalizedSettings.customQuestionsText));
  }

  const generatedLessonTypes = normalizedSettings.lessonTypes.filter(type => type !== 'custom');
  generatedLessonTypes.forEach((lessonType) => {
    normalizedSettings.selectedTables.forEach((table) => {
      for (let b = 0; b <= 9; b++) {
        if (lessonType === 'subtract') {
          const minuend = table + b;
          pool.push(makeQuestion({
            lessonType: 'subtract',
            table,
            b,
            ans: b,
            questionText: `${minuend} - ${table} = ?`,
            answerText: `${minuend} - ${table} = ${b}`,
          }));
        } else if (lessonType === 'multiply') {
          const ans = table * b;
          pool.push(makeQuestion({
            lessonType: 'multiply',
            table,
            b,
            ans,
            questionText: `${table} × ${b} = ?`,
            answerText: `${table} × ${b} = ${ans}`,
          }));
        } else if (lessonType === 'divide') {
          const dividend = table * b;
          pool.push(makeQuestion({
            lessonType: 'divide',
            table,
            b,
            ans: b,
            questionText: `${dividend} ÷ ${table} = ?`,
            answerText: `${dividend} ÷ ${table} = ${b}`,
          }));
        } else {
          const ans = table + b;
          pool.push(makeQuestion({
            lessonType: 'add',
            table,
            b,
            ans,
            questionText: `${table} + ${b} = ?`,
            answerText: `${table} + ${b} = ${ans}`,
          }));
        }
      }
    });
  });

  return pool;
};

const getQuestionKey = (question) => {
  if (question?.id) return question.id;
  if (Number.isInteger(question?.a) && Number.isInteger(question?.b)) {
    return `add:${question.a}:${question.b}`;
  }
  return '';
};

const createAnswerOptions = (correctAns) => {
  const options = new Set([correctAns]);
  let distance = 1;
  const minOption = correctAns >= 0 ? 0 : correctAns - 12;

  while (options.size < 4 && distance < 12) {
    const bigger = correctAns + distance;
    const smaller = correctAns - distance;

    if (bigger >= minOption) options.add(bigger);
    if (options.size < 4 && smaller >= minOption) options.add(smaller);
    distance += 1;
  }

  return Array.from(options).sort(() => Math.random() - 0.5);
};

const buildPlayableQuestion = (question, flags = {}) => ({
  ...question,
  options: createAnswerOptions(question.ans),
  isReview: !!flags.isReview,
  isUnseen: !!flags.isUnseen,
});

const stripQuestionForStorage = (question, correctCount = 0) => {
  if (!question) return null;

  const storedQuestion = { ...question };
  delete storedQuestion.options;
  delete storedQuestion.isReview;
  delete storedQuestion.isUnseen;
  delete storedQuestion.correctCount;

  return {
    ...storedQuestion,
    correctCount: clampNumber(correctCount, 0, 0, 2),
  };
};

export default function App() {
  // --- STATE ---
  const initialSettings = useMemo(() => loadSettings(), []);
  const initialSessionStartedAt = useMemo(() => loadCurrentSessionStartedAt(), []);
  const initialSessionExpired = useMemo(
    () => isLearningSessionExpired(initialSessionStartedAt),
    [initialSessionStartedAt]
  );
  const [screenTime, setScreenTime] = useState(() => {
    const savedTime = localStorage.getItem('math_screenTime');
    return savedTime ? parseInt(savedTime, 10) : 0;
  });
  const [reviewList, setReviewList] = useState(() => {
    const savedReview = localStorage.getItem('math_reviewList');
    return savedReview ? JSON.parse(savedReview) : [];
  });
  const [unseenList, setUnseenList] = useState(() => {
    const savedUnseen = localStorage.getItem('math_unseenList');
    return savedUnseen ? JSON.parse(savedUnseen) : generateInitialPool(initialSettings);
  });
  const [correctTotal, setCorrectTotal] = useState(() => {
    const savedCorrect = localStorage.getItem('math_correctTotal');
    return !initialSessionExpired && savedCorrect ? parseInt(savedCorrect, 10) : 0;
  });
  const [wrongTotal, setWrongTotal] = useState(() => {
    const savedWrong = localStorage.getItem('math_wrongTotal');
    return !initialSessionExpired && savedWrong ? parseInt(savedWrong, 10) : 0;
  });
  const [timeoutTotal, setTimeoutTotal] = useState(() => {
    const savedTimeout = localStorage.getItem('math_timeoutTotal');
    return !initialSessionExpired && savedTimeout ? parseInt(savedTimeout, 10) : 0;
  });
  const [sessionHistory, setSessionHistory] = useState(() => loadSessionHistory());
  const [endSessionGuard, setEndSessionGuard] = useState(() => loadEndSessionGuard());
  const [userName, setUserName] = useState(() => localStorage.getItem(USER_NAME_KEY) || '');
  const [draftUserName, setDraftUserName] = useState(() => localStorage.getItem(USER_NAME_KEY) || '');
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem(USER_AVATAR_KEY) || '');
  const [draftUserAvatar, setDraftUserAvatar] = useState(() => localStorage.getItem(USER_AVATAR_KEY) || '');
  const [stagedLearningEnabled, setStagedLearningEnabled] = useState(() => loadStagedLearningEnabled());
  const [draftStagedLearningEnabled, setDraftStagedLearningEnabled] = useState(() => loadStagedLearningEnabled());
  const [stagedRememberTarget, setStagedRememberTarget] = useState(() => loadStagedRememberTarget());
  const [draftStagedRememberTarget, setDraftStagedRememberTarget] = useState(() => loadStagedRememberTarget());
  const [stagedStages, setStagedStages] = useState(() => loadStagedStages(initialSettings));
  const [draftStagedStages, setDraftStagedStages] = useState(() => loadStagedStages(initialSettings));
  const [stagedProgress, setStagedProgress] = useState(() => loadStagedProgress());
  const [stageNotice, setStageNotice] = useState('');
  const [settings, setSettings] = useState(initialSettings);
  const [draftSettings, setDraftSettings] = useState(initialSettings);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserNameForm, setShowUserNameForm] = useState(false);
  const [showAccountButtons, setShowAccountButtons] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showAdminSettingsPanel, setShowAdminSettingsPanel] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState('math');
  const [showReadingPanel, setShowReadingPanel] = useState(false);
  const [expandedReadingSeriesId, setExpandedReadingSeriesId] = useState(null);
  const [selectedReadingId, setSelectedReadingId] = useState(null);
  const [readingProgress, setReadingProgress] = useState(() => loadReadingProgress());
  const [readingHistory, setReadingHistory] = useState(() => loadReadingHistory());
  const [readingSummary, setReadingSummary] = useState(null);
  const [showColoringPanel, setShowColoringPanel] = useState(false);
  const [showColoringAccessPanel, setShowColoringAccessPanel] = useState(false);
  const [robuxBalance, setRobuxBalance] = useState(() => loadRobuxBalance());
  const [coloringTimeLeftSec, setColoringTimeLeftSec] = useState(() => loadColoringTimeLeft());
  const [coloringPurchaseMinutes, setColoringPurchaseMinutes] = useState(DEFAULT_COLORING_PURCHASE_MINUTES);
  const [unlockedColoringLevels, setUnlockedColoringLevels] = useState(() => loadUnlockedColoringLevels());
  const [showDrawingPanel, setShowDrawingPanel] = useState(false);
  const [showDrawingAccessPanel, setShowDrawingAccessPanel] = useState(false);
  const [showGamesPanel, setShowGamesPanel] = useState(false);
  const [showAlbumPanel, setShowAlbumPanel] = useState(false);
  const [showGameAccessPanel, setShowGameAccessPanel] = useState(false);
  const [gameTimeLeftSec, setGameTimeLeftSec] = useState(() => loadGameTimeLeft());
  const [gamePurchaseMinutes, setGamePurchaseMinutes] = useState(DEFAULT_COLORING_PURCHASE_MINUTES);
  const [drawingTimeLeftSec, setDrawingTimeLeftSec] = useState(() => loadDrawingTimeLeft());
  const [drawingPurchaseMinutes, setDrawingPurchaseMinutes] = useState(DEFAULT_COLORING_PURCHASE_MINUTES);

  const [currentQ, setCurrentQ] = useState(null);
  const [pausedQuestion, setPausedQuestion] = useState(null);
  const [timer, setTimer] = useState(settings.timeLimit);
  const [gameState, setGameState] = useState('idle'); // idle, playing, wrong_paused, timeout_paused, celebrating, congrats, summary
  const [practiceMode, setPracticeMode] = useState('normal'); // normal, review
  const [rewardMode, setRewardMode] = useState('screenTime'); // screenTime, robux
  const [selectedAns, setSelectedAns] = useState(null);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const [showParentConfirm, setShowParentConfirm] = useState(false);
  const [summaryStats, setSummaryStats] = useState(null);
  
  const timerRef = useRef(null);
  const nextQuestionTimeoutRef = useRef(null);
  const congratsTimeoutRef = useRef(null);
  const sessionStartedAtRef = useRef(initialSessionExpired ? null : initialSessionStartedAt);
  const hasShownCongratsThisSessionRef = useRef(false);
  const readingContentRef = useRef(null);
  const readingSaveTimeoutRef = useRef(null);
  const readingSessionStartedAtRef = useRef(null);
  const stageNoticeTimeoutRef = useRef(null);
  const stageRecentQuestionKeysRef = useRef([]);
  const activePoolRef = useRef([]);
  const activeReviewListRef = useRef([]);
  const activeUnseenListRef = useRef([]);
  const coloringUnlockInFlightRef = useRef(new Set());
  const displayName = userName.trim() || 'bé';
  const fullActivePool = useMemo(() => generateInitialPool(settings), [settings]);
  const stagedLearningStatus = useMemo(
    () => getStagedLearningStatus(fullActivePool, stagedProgress, stagedRememberTarget, stagedStages),
    [fullActivePool, stagedProgress, stagedRememberTarget, stagedStages]
  );
  const isStagedLearningActive = stagedLearningEnabled && stagedLearningStatus.eligiblePool.length > 0;
  const activePool = useMemo(
    () => (isStagedLearningActive ? stagedLearningStatus.currentPool : fullActivePool),
    [fullActivePool, isStagedLearningActive, stagedLearningStatus.currentPool]
  );
  const stageLabel = isStagedLearningActive
    ? stagedLearningStatus.isRandom
      ? stagedLearningStatus.label
      : `${stagedLearningStatus.label} ${stagedLearningStatus.rememberedCount}/${stagedLearningStatus.totalCount}`
    : '';
  const activeReviewList = useMemo(
    () => {
      const reviewByKey = new Map(reviewList.map(question => [getQuestionKey(question), question]));
      return activePool
        .filter(question => reviewByKey.has(question.id))
        .map(question => ({
          ...question,
          correctCount: clampNumber(reviewByKey.get(question.id)?.correctCount, 0, 0, 2),
        }));
    },
    [activePool, reviewList]
  );
  const activeUnseenList = useMemo(
    () => {
      const unseenKeys = new Set(unseenList.map(getQuestionKey));
      return activePool.filter(question => unseenKeys.has(question.id));
    },
    [activePool, unseenList]
  );
  const currentLessonLabel = getLessonLabel(settings);
  const isFlashcardMode = settings.learningMode === 'flashcard';
  const selectedReading = READING_LESSONS.find(reading => reading.id === selectedReadingId) || null;
  const selectedReadingSeriesMeta = selectedReadingId
    ? READING_SERIES_BY_READING_ID[selectedReadingId] || null
    : null;
  const readingCatalogItems = useMemo(() => {
    const addedSeries = new Set();

    return READING_LESSONS.reduce((items, reading) => {
      const seriesMeta = READING_SERIES_BY_READING_ID[reading.id];

      if (seriesMeta) {
        if (!addedSeries.has(seriesMeta.seriesId)) {
          const series = READING_SERIES.find(item => item.id === seriesMeta.seriesId);
          const lessons = series?.lessonIds
            .map(readingId => READING_LESSONS.find(item => item.id === readingId))
            .filter(Boolean) || [];

          items.push({
            type: 'series',
            id: seriesMeta.seriesId,
            title: series?.title || seriesMeta.seriesTitle,
            description: series?.description || 'Bộ truyện',
            lessons,
          });
          addedSeries.add(seriesMeta.seriesId);
        }

        return items;
      }

      return items;
    }, []);
  }, []);
  const selectedReadingSeriesLessons = selectedReadingSeriesMeta
    ? READING_SERIES.find(series => series.id === selectedReadingSeriesMeta.seriesId)?.lessonIds
      .map(readingId => READING_LESSONS.find(reading => reading.id === readingId))
      .filter(Boolean) || []
    : [];
  const selectedReadingSeriesIndex = selectedReadingId && selectedReadingSeriesLessons.length > 0
    ? selectedReadingSeriesLessons.findIndex(reading => reading.id === selectedReadingId)
    : -1;
  const hasReadingSeriesNavigation = selectedReadingSeriesLessons.length > 1;
  const selectedReadingScrollTop = selectedReadingId
    ? readingProgress[selectedReadingId]?.scrollTop || 0
    : 0;
  const selectedReadingCompleted = selectedReadingId
    ? !!readingProgress[selectedReadingId]?.completed
    : false;
  const previousReading = hasReadingSeriesNavigation && selectedReadingSeriesIndex > 0
    ? selectedReadingSeriesLessons[selectedReadingSeriesIndex - 1]
    : null;
  const nextReading = hasReadingSeriesNavigation
    && selectedReadingSeriesIndex >= 0
    && selectedReadingSeriesIndex < selectedReadingSeriesLessons.length - 1
    ? selectedReadingSeriesLessons[selectedReadingSeriesIndex + 1]
    : null;
  const readingCounterLabel = hasReadingSeriesNavigation
    ? `${selectedReadingSeriesIndex + 1}/${selectedReadingSeriesLessons.length}`
    : '1/1';
  const coloringTimeExchangeCost = clampNumber(
    settings.coloringTimeExchangeCost,
    DEFAULT_SETTINGS.coloringTimeExchangeCost,
    MIN_TIME_EXCHANGE_COST,
    MAX_TIME_EXCHANGE_COST
  );
  const maxAffordableColoringMinutes = coloringTimeExchangeCost > 0
    ? Math.max(
        MIN_COLORING_PURCHASE_MINUTES,
        Math.floor(robuxBalance / coloringTimeExchangeCost)
      )
    : MAX_COLORING_PURCHASE_MINUTES;
  const maxAllowedColoringPurchaseMinutes = Math.max(
    MIN_COLORING_PURCHASE_MINUTES,
    Math.min(
      MAX_COLORING_PURCHASE_MINUTES,
      Math.floor((MAX_COLORING_TIME_LEFT - coloringTimeLeftSec) / COLORING_TIME_EXCHANGE_SECONDS)
    )
  );
  const maxSelectableColoringMinutes = Math.min(maxAllowedColoringPurchaseMinutes, maxAffordableColoringMinutes);
  // Mua theo bậc 10 phút; nếu Robux không đủ 10 phút thì lấy đúng số phút mua được.
  const minColoringPurchaseMinutes = Math.min(DEFAULT_COLORING_PURCHASE_MINUTES, maxSelectableColoringMinutes);
  const safeColoringPurchaseMinutes = clampNumber(
    coloringPurchaseMinutes,
    minColoringPurchaseMinutes,
    minColoringPurchaseMinutes,
    maxSelectableColoringMinutes
  );
  const coloringPurchaseCost = safeColoringPurchaseMinutes * coloringTimeExchangeCost;
  const canBuySelectedColoringTime = robuxBalance >= coloringPurchaseCost;
  const drawingTimeExchangeCost = clampNumber(
    settings.drawingTimeExchangeCost,
    DEFAULT_SETTINGS.drawingTimeExchangeCost,
    MIN_TIME_EXCHANGE_COST,
    MAX_TIME_EXCHANGE_COST
  );
  const maxAffordableDrawingMinutes = drawingTimeExchangeCost > 0
    ? Math.max(
        MIN_COLORING_PURCHASE_MINUTES,
        Math.floor(robuxBalance / drawingTimeExchangeCost)
      )
    : MAX_COLORING_PURCHASE_MINUTES;
  const maxAllowedDrawingPurchaseMinutes = Math.max(
    MIN_COLORING_PURCHASE_MINUTES,
    Math.min(
      MAX_COLORING_PURCHASE_MINUTES,
      Math.floor((MAX_COLORING_TIME_LEFT - drawingTimeLeftSec) / COLORING_TIME_EXCHANGE_SECONDS)
    )
  );
  const maxSelectableDrawingMinutes = Math.min(maxAllowedDrawingPurchaseMinutes, maxAffordableDrawingMinutes);
  const minDrawingPurchaseMinutes = Math.min(DEFAULT_COLORING_PURCHASE_MINUTES, maxSelectableDrawingMinutes);
  const safeDrawingPurchaseMinutes = clampNumber(
    drawingPurchaseMinutes,
    minDrawingPurchaseMinutes,
    minDrawingPurchaseMinutes,
    maxSelectableDrawingMinutes
  );
  const drawingPurchaseCost = safeDrawingPurchaseMinutes * drawingTimeExchangeCost;
  const canBuySelectedDrawingTime = robuxBalance >= drawingPurchaseCost;
  const gameTimeExchangeCost = clampNumber(
    settings.gameTimeExchangeCost,
    DEFAULT_SETTINGS.gameTimeExchangeCost,
    MIN_TIME_EXCHANGE_COST,
    MAX_TIME_EXCHANGE_COST
  );
  const maxAffordableGameMinutes = gameTimeExchangeCost > 0
    ? Math.max(
        MIN_COLORING_PURCHASE_MINUTES,
        Math.floor(robuxBalance / gameTimeExchangeCost)
      )
    : MAX_COLORING_PURCHASE_MINUTES;
  const maxAllowedGamePurchaseMinutes = Math.max(
    MIN_COLORING_PURCHASE_MINUTES,
    Math.min(
      MAX_COLORING_PURCHASE_MINUTES,
      Math.floor((MAX_COLORING_TIME_LEFT - gameTimeLeftSec) / COLORING_TIME_EXCHANGE_SECONDS)
    )
  );
  const maxSelectableGameMinutes = Math.min(maxAllowedGamePurchaseMinutes, maxAffordableGameMinutes);
  const minGamePurchaseMinutes = Math.min(DEFAULT_COLORING_PURCHASE_MINUTES, maxSelectableGameMinutes);
  const safeGamePurchaseMinutes = clampNumber(
    gamePurchaseMinutes,
    minGamePurchaseMinutes,
    minGamePurchaseMinutes,
    maxSelectableGameMinutes
  );
  const gamePurchaseCost = safeGamePurchaseMinutes * gameTimeExchangeCost;
  const canBuySelectedGameTime = robuxBalance >= gamePurchaseCost;
  const draftLessonTypes = useMemo(
    () => getValidLessonTypes(
      Array.isArray(draftSettings.lessonTypes) ? draftSettings.lessonTypes : [draftSettings.lessonType]
    ),
    [draftSettings.lessonType, draftSettings.lessonTypes]
  );
  const draftGeneratedLessonTypes = useMemo(
    () => draftLessonTypes
      .filter(type => type !== 'custom')
      .map(type => getLessonType(type)),
    [draftLessonTypes]
  );
  const draftTableLabel = draftGeneratedLessonTypes.length === 1
    ? draftGeneratedLessonTypes[0].tableLabel
    : 'Bảng luyện tập';
  const draftCustomQuestions = useMemo(
    () => parseCustomQuestions(draftSettings.customQuestionsText),
    [draftSettings.customQuestionsText]
  );
  const draftGeneratedQuestionPool = useMemo(
    () => getGeneratedQuestionPool(draftSettings),
    [draftSettings]
  );
  const draftVisibleStagedStages = useMemo(() => {
    const normalizedStages = normalizeStagedStages(draftStagedStages, draftSettings, {
      keepEmpty: true,
      fallbackToDefault: false,
    });

    return normalizedStages.length > 0 ? normalizedStages : buildDefaultStagedStages(draftSettings);
  }, [draftSettings, draftStagedStages]);
  const draftStageQuestionIdSet = useMemo(
    () => new Set(draftVisibleStagedStages.flatMap(stage => stage.questionIds)),
    [draftVisibleStagedStages]
  );
  const draftStageQuestionGroups = useMemo(
    () => draftGeneratedLessonTypes
      .map(type => ({
        ...type,
        questions: draftGeneratedQuestionPool.filter(question => question.lessonType === type.id),
      }))
      .filter(type => type.questions.length > 0),
    [draftGeneratedLessonTypes, draftGeneratedQuestionPool]
  );

  const saveReadingPosition = useCallback((readingId, scrollTop) => {
    if (!readingId) return;

    const nextScrollTop = clampNumber(scrollTop, 0, 0, 300000);
    setReadingProgress(prev => {
      const currentScrollTop = prev[readingId]?.scrollTop || 0;
      if (Math.abs(currentScrollTop - nextScrollTop) < 2) return prev;

      return {
        ...prev,
        [readingId]: {
          ...prev[readingId],
          scrollTop: nextScrollTop,
        },
      };
    });
  }, []);

  const rememberCurrentReadingPosition = useCallback(() => {
    if (!selectedReadingId || !readingContentRef.current) return;

    if (readingSaveTimeoutRef.current) {
      clearTimeout(readingSaveTimeoutRef.current);
      readingSaveTimeoutRef.current = null;
    }

    saveReadingPosition(selectedReadingId, readingContentRef.current.scrollTop);
  }, [saveReadingPosition, selectedReadingId]);

  const handleReadingScroll = useCallback((event) => {
    if (!selectedReadingId) return;

    const readingId = selectedReadingId;
    const scrollTop = event.currentTarget.scrollTop;

    if (readingSaveTimeoutRef.current) {
      clearTimeout(readingSaveTimeoutRef.current);
    }

    readingSaveTimeoutRef.current = setTimeout(() => {
      saveReadingPosition(readingId, scrollTop);
    }, 120);
  }, [saveReadingPosition, selectedReadingId]);

  const goToReading = useCallback((readingId) => {
    if (!readingId) return;

    rememberCurrentReadingPosition();
    setSelectedReadingId(readingId);
  }, [rememberCurrentReadingPosition]);

  const completeCurrentReading = useCallback(() => {
    if (!selectedReadingId) return;

    if (readingSaveTimeoutRef.current) {
      clearTimeout(readingSaveTimeoutRef.current);
      readingSaveTimeoutRef.current = null;
    }

    setReadingProgress(prev => ({
      ...prev,
      [selectedReadingId]: {
        ...prev[selectedReadingId],
        scrollTop: 0,
        completed: true,
      },
    }));

    if (hasReadingSeriesNavigation && nextReading) {
      setSelectedReadingId(nextReading.id);
    } else {
      setSelectedReadingId(null);
      setExpandedReadingSeriesId(selectedReadingSeriesMeta?.seriesId || null);
    }
  }, [hasReadingSeriesNavigation, nextReading, selectedReadingId, selectedReadingSeriesMeta]);

  const buildReadingSummary = useCallback((progressSnapshot = readingProgress) => {
    const endedAt = Date.now();
    const startedAt = readingSessionStartedAtRef.current || endedAt;
    const completedReadings = READING_LESSONS.filter(reading => progressSnapshot[reading.id]?.completed);
    const selectedIsCompleted = selectedReadingId
      ? !!progressSnapshot[selectedReadingId]?.completed
      : false;
    const inProgressReading = selectedReadingId && !selectedIsCompleted
      ? READING_LESSONS.find(reading => reading.id === selectedReadingId)
      : READING_LESSONS.find(reading => {
        const progress = progressSnapshot[reading.id];
        return progress?.scrollTop > 0 && !progress.completed;
      });
    return {
      id: endedAt,
      startedAt,
      studentName: displayName,
      studentAvatar: userAvatar,
      completedCount: completedReadings.length,
      totalCount: READING_LESSONS.length,
      completedTitles: completedReadings.map(reading => formatReadingLabel(reading.title)),
      inProgressTitle: inProgressReading ? formatReadingLabel(inProgressReading.title) : 'Không có',
      durationSec: Math.max(0, Math.round((endedAt - startedAt) / 1000)),
      endedAt,
    };
  }, [displayName, readingProgress, selectedReadingId, userAvatar]);

  const handleEndReadingSession = useCallback(() => {
    rememberCurrentReadingPosition();
    const nextSummary = buildReadingSummary();
    setReadingSummary(nextSummary);
    setReadingHistory(prev => normalizeReadingHistory([nextSummary, ...prev]));
  }, [buildReadingSummary, rememberCurrentReadingPosition]);

  const continueReadingAfterSummary = () => {
    setReadingSummary(null);
    readingSessionStartedAtRef.current = Date.now();
  };

  const restartReadingFromStart = () => {
    const firstReading = READING_LESSONS[0];

    setReadingProgress({});
    setReadingSummary(null);
    setSelectedReadingId(firstReading?.id || null);
    setExpandedReadingSeriesId(null);
    readingSessionStartedAtRef.current = Date.now();
  };

  const toggleUserNameForm = () => {
    const shouldOpen = !showUserNameForm;
    setShowUserNameForm(shouldOpen);
    setAvatarError('');

    if (shouldOpen) {
      setDraftUserName(userName);
      setDraftUserAvatar(userAvatar);
      setIsAdmin(false);
      setShowAdminLogin(false);
      setAdminError('');
      setSettingsError('');
      setSettingsSaved(false);
      setShowAdminSettingsPanel(false);
      rememberCurrentReadingPosition();
      setReadingSummary(null);
      readingSessionStartedAtRef.current = null;
      setShowHistoryPanel(false);
      setShowReadingPanel(false);
      setSelectedReadingId(null);
      setExpandedReadingSeriesId(null);
      setShowColoringPanel(false);
      setShowColoringAccessPanel(false);
    }
  };

  const saveUserName = (event) => {
    event.preventDefault();

    const nextName = draftUserName.trim().slice(0, 28);
    setUserName(nextName);
    setDraftUserName(nextName);
    setUserAvatar(draftUserAvatar);
    setShowUserNameForm(false);
    setAvatarError('');
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const avatar = await resizeAvatarFile(file);
      setDraftUserAvatar(avatar);
      setAvatarError('');
    } catch {
      setAvatarError('Ảnh cần là jpg, jpeg, png hoặc webp');
    } finally {
      event.target.value = '';
    }
  };

  const closeAdminPanel = () => {
    setIsAdmin(false);
    setShowAdminLogin(false);
    setAdminPin('');
    setAdminError('');
    setSettingsError('');
    setSettingsSaved(false);
    setShowAdminSettingsPanel(false);
  };

  const toggleReadingPanel = () => {
    if (showReadingPanel) {
      rememberCurrentReadingPosition();
      setReadingSummary(null);
      readingSessionStartedAtRef.current = null;
    } else {
      readingSessionStartedAtRef.current = Date.now();
      setExpandedReadingSeriesId(null);
    }

    setShowReadingPanel(prev => {
      const shouldOpen = !prev;
      if (!shouldOpen) {
        setSelectedReadingId(null);
        setExpandedReadingSeriesId(null);
      }
      return shouldOpen;
    });
    setShowUserNameForm(false);
    setShowAdminLogin(false);
    setAdminError('');
    setAvatarError('');
    setShowHistoryPanel(false);
    setShowParentConfirm(false);
    setShowColoringPanel(false);
    setShowColoringAccessPanel(false);
  };

  const handleAdminLogin = (event) => {
    event.preventDefault();

    if (adminPin.trim() !== ADMIN_PIN) {
      setAdminError('Mã Admin chưa đúng');
      setSettingsSaved(false);
      return;
    }

    setIsAdmin(true);
    setDraftSettings(settings);
    setDraftStagedLearningEnabled(stagedLearningEnabled);
    setDraftStagedRememberTarget(stagedRememberTarget);
    setDraftStagedStages(stagedStages);
    setShowUserNameForm(false);
    setAvatarError('');
    setShowAdminLogin(false);
    setAdminPin('');
    setAdminError('');
    setSettingsError('');
    setSettingsSaved(false);
    setShowColoringAccessPanel(false);
  };

  const updateDraftSetting = (key, value) => {
    setDraftSettings(prev => ({ ...prev, [key]: value }));
    setSettingsError('');
    setSettingsSaved(false);
  };

  const adjustDraftNumberSetting = (key, delta, fallback, min, max) => {
    const currentValue = clampNumber(draftSettings[key], fallback, min, max);
    updateDraftSetting(key, clampNumber(currentValue + delta, fallback, min, max));
  };

  const toggleDraftLessonType = (lessonType) => {
    if (!LESSON_TYPE_IDS.has(lessonType)) return;

    setDraftSettings(prev => {
      const currentLessonTypes = getValidLessonTypes(
        Array.isArray(prev.lessonTypes) ? prev.lessonTypes : [prev.lessonType]
      );
      const nextLessonTypes = currentLessonTypes.includes(lessonType)
        ? currentLessonTypes.filter(type => type !== lessonType)
        : LESSON_TYPES
          .map(type => type.id)
          .filter(type => type === lessonType || currentLessonTypes.includes(type));

      return {
        ...prev,
        lessonType: nextLessonTypes[0] || '',
        lessonTypes: nextLessonTypes,
      };
    });
    setSettingsError('');
    setSettingsSaved(false);
  };

  const toggleDraftTable = (table) => {
    setDraftSettings(prev => {
      const selectedTables = prev.selectedTables?.includes(table)
        ? prev.selectedTables.filter(item => item !== table)
        : [...(prev.selectedTables || []), table].sort((a, b) => a - b);

      return { ...prev, selectedTables };
    });
    setSettingsError('');
    setSettingsSaved(false);
  };

  const setAllDraftTables = (selected) => {
    setDraftSettings(prev => ({
      ...prev,
      selectedTables: selected ? ALL_ADDITION_TABLES : [],
    }));
    setSettingsError('');
    setSettingsSaved(false);
  };

  const resetDraftStagedStages = () => {
    setDraftStagedStages(buildDefaultStagedStages(draftSettings));
    setSettingsError('');
    setSettingsSaved(false);
  };

  const addDraftStagedStage = () => {
    const currentStages = draftVisibleStagedStages.length > 0
      ? draftVisibleStagedStages
      : buildDefaultStagedStages(draftSettings);
    const usedQuestionIds = new Set(currentStages.flatMap(stage => stage.questionIds));
    const nextQuestionIds = draftGeneratedQuestionPool
      .filter(question => !usedQuestionIds.has(question.id))
      .slice(0, 4)
      .map(question => question.id);

    setDraftStagedStages([
      ...currentStages,
      {
        id: `stage-${Date.now()}`,
        name: `Chặng ${currentStages.length + 1}`,
        questionIds: nextQuestionIds,
      },
    ]);
    setSettingsError('');
    setSettingsSaved(false);
  };

  const removeDraftStagedStage = (stageId) => {
    if (draftVisibleStagedStages.length <= 1) return;

    setDraftStagedStages(draftVisibleStagedStages.filter(stage => stage.id !== stageId));
    setSettingsError('');
    setSettingsSaved(false);
  };

  const updateDraftStagedStageName = (stageId, name) => {
    setDraftStagedStages(draftVisibleStagedStages.map(stage => (
      stage.id === stageId
        ? { ...stage, name: String(name || '').slice(0, MAX_STAGED_STAGE_NAME_LENGTH) }
        : stage
    )));
    setSettingsError('');
    setSettingsSaved(false);
  };

  const toggleDraftStagedQuestion = (stageId, questionId) => {
    const targetStage = draftVisibleStagedStages.find(stage => stage.id === stageId);
    const isSelectedInTargetStage = targetStage?.questionIds.includes(questionId);

    setDraftStagedStages(draftVisibleStagedStages.map(stage => {
      const questionIdsWithoutCurrent = stage.questionIds.filter(id => id !== questionId);

      if (stage.id !== stageId) {
        return { ...stage, questionIds: questionIdsWithoutCurrent };
      }

      return {
        ...stage,
        questionIds: isSelectedInTargetStage
          ? questionIdsWithoutCurrent
          : [...questionIdsWithoutCurrent, questionId],
      };
    }));
    setSettingsError('');
    setSettingsSaved(false);
  };

  const saveAdminSettings = (event) => {
    event.preventDefault();
    const nextLessonTypes = getValidLessonTypes(
      Array.isArray(draftSettings.lessonTypes) ? draftSettings.lessonTypes : [draftSettings.lessonType]
    );
    const hasCustomLesson = nextLessonTypes.includes('custom');
    const hasGeneratedLessons = nextLessonTypes.some(type => type !== 'custom');

    if (nextLessonTypes.length === 0) {
      setSettingsError('Vui lòng chọn ít nhất một loại bài học');
      setSettingsSaved(false);
      return;
    }

    if (hasCustomLesson && draftCustomQuestions.length === 0) {
      setSettingsError('Vui lòng nhập ít nhất một câu hỏi hợp lệ');
      setSettingsSaved(false);
      return;
    }

    if (hasGeneratedLessons && (!draftSettings.selectedTables || draftSettings.selectedTables.length === 0)) {
      setSettingsError('Vui lòng chọn ít nhất một bảng luyện tập');
      setSettingsSaved(false);
      return;
    }

    const nextSettings = normalizeSettings({
      ...draftSettings,
      lessonType: nextLessonTypes[0],
      lessonTypes: nextLessonTypes,
    });
    const normalizedDraftStages = normalizeStagedStages(draftStagedStages, nextSettings, {
      fallbackToDefault: false,
    });
    const nextStagedStages = hasGeneratedLessons
      ? normalizedDraftStages.length > 0
        ? normalizedDraftStages
        : buildDefaultStagedStages(nextSettings)
      : [];

    if (draftStagedLearningEnabled && hasGeneratedLessons && nextStagedStages.length === 0) {
      setSettingsError('Vui lòng chọn ít nhất một câu cho học theo chặng');
      setSettingsSaved(false);
      return;
    }

    const lessonChanged = getLessonConfigKey(settings) !== getLessonConfigKey(nextSettings);
    const learningModeChanged = settings.learningMode !== nextSettings.learningMode;
    const stagedModeChanged = stagedLearningEnabled !== draftStagedLearningEnabled;
    const stagedTargetChanged = stagedRememberTarget !== draftStagedRememberTarget;
    const stagedStagesChanged = getStagedStagesConfigKey(stagedStages, nextSettings)
      !== getStagedStagesConfigKey(nextStagedStages, nextSettings);
    setSettings(nextSettings);
    setDraftSettings(nextSettings);
    setStagedLearningEnabled(draftStagedLearningEnabled);
    setStagedRememberTarget(draftStagedRememberTarget);
    setStagedStages(nextStagedStages);
    setDraftStagedStages(nextStagedStages);

    if (lessonChanged) {
      clearInterval(timerRef.current);
      clearPendingTransitions();
      stageRecentQuestionKeysRef.current = [];
      sessionStartedAtRef.current = null;
      setReviewList([]);
      setUnseenList(generateInitialPool(nextSettings));
      setCorrectTotal(0);
      setWrongTotal(0);
      setTimeoutTotal(0);
      setCurrentQ(null);
      setPausedQuestion(null);
      setSelectedAns(null);
      setShowFlashcardAnswer(false);
      setSummaryStats(null);
      setPracticeMode('normal');
      setGameState('idle');
      setTimer(nextSettings.timeLimit);
    } else {
      setTimer(prev => Math.min(prev, nextSettings.timeLimit));
      if (learningModeChanged || stagedModeChanged || stagedTargetChanged || stagedStagesChanged) {
        clearInterval(timerRef.current);
        clearPendingTransitions();
        stageRecentQuestionKeysRef.current = [];
        sessionStartedAtRef.current = null;
        setUnseenList(generateInitialPool(nextSettings));
        setCurrentQ(null);
        setPausedQuestion(null);
        setSelectedAns(null);
        setShowFlashcardAnswer(false);
        setSummaryStats(null);
        setGameState('idle');
      }
    }

    setSettingsError('');
    setSettingsSaved(true);
  };

  // --- LƯU DỮ LIỆU ---
  useEffect(() => {
    if (initialSessionExpired) {
      saveCurrentSessionStartedAt(null);
    }
  }, [initialSessionExpired]);

  useEffect(() => {
    try {
      localStorage.setItem('math_screenTime', screenTime.toString());
      localStorage.setItem('math_reviewList', JSON.stringify(reviewList));
      localStorage.setItem('math_correctTotal', correctTotal.toString());
      localStorage.setItem('math_unseenList', JSON.stringify(unseenList));
      localStorage.setItem('math_wrongTotal', wrongTotal.toString());
      localStorage.setItem('math_timeoutTotal', timeoutTotal.toString());
      localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(sessionHistory));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      localStorage.setItem(USER_NAME_KEY, userName);
      localStorage.setItem(USER_AVATAR_KEY, userAvatar);
      localStorage.setItem(STAGED_LEARNING_KEY, stagedLearningEnabled.toString());
      localStorage.setItem(STAGED_REMEMBER_TARGET_KEY, stagedRememberTarget.toString());
      localStorage.setItem(STAGED_STAGES_KEY, JSON.stringify(stagedStages));
      localStorage.setItem(STAGED_PROGRESS_KEY, JSON.stringify(stagedProgress));
    } catch {
      console.log("Cannot save data");
    }
  }, [
    screenTime,
    reviewList,
    correctTotal,
    unseenList,
    wrongTotal,
    timeoutTotal,
    sessionHistory,
    settings,
    userName,
    userAvatar,
    stagedLearningEnabled,
    stagedRememberTarget,
    stagedStages,
    stagedProgress,
  ]);

  useEffect(() => {
    try {
      localStorage.setItem(ROBUX_BALANCE_KEY, String(robuxBalance));
    } catch {
      console.log("Cannot save Robux balance");
    }
  }, [robuxBalance]);

  useEffect(() => {
    try {
      localStorage.setItem(COLORING_TIME_LEFT_KEY, String(coloringTimeLeftSec));
    } catch {
      console.log("Cannot save coloring time");
    }
  }, [coloringTimeLeftSec]);

  useEffect(() => {
    try {
      localStorage.setItem(ROBUX_UNLOCKED_COLORING_KEY, JSON.stringify(unlockedColoringLevels));
    } catch {
      console.log("Cannot save unlocked coloring levels");
    }
  }, [unlockedColoringLevels]);

  useEffect(() => {
    if (!showColoringPanel || coloringTimeExchangeCost <= 0) return undefined;

    const intervalId = setInterval(() => {
      setColoringTimeLeftSec(prev => normalizeColoringTimeLeft(prev - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [showColoringPanel, coloringTimeExchangeCost]);

  useEffect(() => {
    try {
      localStorage.setItem(DRAWING_TIME_LEFT_KEY, JSON.stringify(drawingTimeLeftSec));
    } catch {
      console.log('Cannot save drawing time');
    }
  }, [drawingTimeLeftSec]);

  useEffect(() => {
    if (!showDrawingPanel || drawingTimeExchangeCost <= 0) return undefined;

    const intervalId = setInterval(() => {
      setDrawingTimeLeftSec(prev => normalizeColoringTimeLeft(prev - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [showDrawingPanel, drawingTimeExchangeCost]);

  useEffect(() => {
    if (showDrawingPanel && drawingTimeLeftSec <= 0 && drawingTimeExchangeCost > 0) {
      setShowDrawingPanel(false);
      setShowDrawingAccessPanel(true);
    }
  }, [drawingTimeLeftSec, showDrawingPanel, drawingTimeExchangeCost]);

  useEffect(() => {
    if (showColoringPanel && coloringTimeLeftSec <= 0 && coloringTimeExchangeCost > 0) {
      setShowColoringPanel(false);
      setShowColoringAccessPanel(true);
    }
  }, [coloringTimeLeftSec, showColoringPanel, coloringTimeExchangeCost]);

  useEffect(() => {
    try {
      localStorage.setItem(GAME_TIME_LEFT_KEY, String(gameTimeLeftSec));
    } catch {
      console.log('Cannot save game time');
    }
  }, [gameTimeLeftSec]);

  useEffect(() => {
    if (!showGamesPanel || gameTimeExchangeCost <= 0) return undefined;

    const intervalId = setInterval(() => {
      setGameTimeLeftSec(prev => normalizeColoringTimeLeft(prev - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [showGamesPanel, gameTimeExchangeCost]);

  useEffect(() => {
    if (showGamesPanel && gameTimeLeftSec <= 0 && gameTimeExchangeCost > 0) {
      setShowGamesPanel(false);
      setShowGameAccessPanel(true);
    }
  }, [gameTimeLeftSec, showGamesPanel, gameTimeExchangeCost]);

  useEffect(() => {
    try {
      localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(readingProgress));
    } catch {
      console.log("Cannot save reading progress");
    }
  }, [readingProgress]);

  useEffect(() => {
    try {
      localStorage.setItem(READING_HISTORY_KEY, JSON.stringify(readingHistory));
    } catch {
      console.log("Cannot save reading history");
    }
  }, [readingHistory]);

  useEffect(() => {
    if (!selectedReadingId || !readingContentRef.current) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      const container = readingContentRef.current;
      if (!container) return;

      const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
      container.scrollTop = Math.min(selectedReadingScrollTop, maxScrollTop);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [selectedReadingId, selectedReadingScrollTop]);

  useEffect(() => () => {
    if (readingSaveTimeoutRef.current) {
      clearTimeout(readingSaveTimeoutRef.current);
    }
    clearTimeout(stageNoticeTimeoutRef.current);
  }, []);

  useEffect(() => {
    activePoolRef.current = activePool;
    activeReviewListRef.current = activeReviewList;
    activeUnseenListRef.current = activeUnseenList;
  }, [activePool, activeReviewList, activeUnseenList]);

  const markStagedQuestionCorrect = useCallback((question) => {
    if (!stagedLearningEnabled || !question?.id || question.lessonType === 'custom') return;

    const nextProgress = {
      ...stagedProgress,
      [question.id]: Math.min(
        stagedRememberTarget,
        (stagedProgress[question.id] || 0) + 1
      ),
    };
    const previousStatus = getStagedLearningStatus(fullActivePool, stagedProgress, stagedRememberTarget, stagedStages);
    const nextStatus = getStagedLearningStatus(fullActivePool, nextProgress, stagedRememberTarget, stagedStages);

    setStagedProgress(nextProgress);

    if (
      isStagedLearningActive
      && previousStatus.label
      && nextStatus.label
      && previousStatus.label !== nextStatus.label
    ) {
      setStageNotice(nextStatus.label === STAGED_RANDOM_LABEL
        ? 'Đã mở chế độ Random!'
        : 'Mở chặng mới rồi!');
      clearTimeout(stageNoticeTimeoutRef.current);
      stageNoticeTimeoutRef.current = setTimeout(() => {
        setStageNotice('');
        stageNoticeTimeoutRef.current = null;
      }, 2200);
    }
  }, [fullActivePool, isStagedLearningActive, stagedLearningEnabled, stagedProgress, stagedRememberTarget, stagedStages]);

  // --- LOGIC SINH CÂU HỎI ---
  const generateQuestion = useCallback((options = {}) => {
    let selectedQuestion;
    let isReview = false;
    let isUnseen = false;

    const questionOptions = options || {};
    const selectedPracticeMode = questionOptions.practiceMode || practiceMode;
    const isNewLearningSession = !sessionStartedAtRef.current;
    let sessionActivePool = questionOptions.activePool;
    let sessionActiveReviewList = questionOptions.activeReviewList;
    let sessionActiveUnseenList = questionOptions.activeUnseenList;

    if (isNewLearningSession && stagedLearningEnabled) {
      const resetStagedStatus = getStagedLearningStatus(
        fullActivePool,
        {},
        stagedRememberTarget,
        stagedStages
      );

      if (resetStagedStatus.eligiblePool.length > 0) {
        sessionActivePool = resetStagedStatus.currentPool;

        const reviewByKey = new Map(reviewList.map(question => [getQuestionKey(question), question]));
        sessionActiveReviewList = sessionActivePool
          .filter(question => reviewByKey.has(question.id))
          .map(question => ({
            ...question,
            correctCount: clampNumber(reviewByKey.get(question.id)?.correctCount, 0, 0, 2),
          }));

        const unseenKeys = new Set(unseenList.map(getQuestionKey));
        sessionActiveUnseenList = sessionActivePool.filter(question => unseenKeys.has(question.id));

        setStagedProgress({});
        stageRecentQuestionKeysRef.current = [];
      }
    }

    const playablePool = sessionActivePool || activePoolRef.current;
    const reviewQuestions = sessionActiveReviewList || activeReviewListRef.current;
    const unseenQuestions = selectedPracticeMode === 'review'
      ? []
      : sessionActiveUnseenList || activeUnseenListRef.current;
    const recentQuestionKeys = new Set(stageRecentQuestionKeysRef.current);
    const avoidRecentQuestions = (questions) => {
      if (!isStagedLearningActive || questions.length <= 1) return questions;
      const filteredQuestions = questions.filter(
        question => !recentQuestionKeys.has(getQuestionKey(question))
      );
      return filteredQuestions.length > 0 ? filteredQuestions : questions;
    };
    const selectablePool = avoidRecentQuestions(playablePool);
    const selectableReviewQuestions = avoidRecentQuestions(reviewQuestions);
    const selectableUnseenQuestions = avoidRecentQuestions(unseenQuestions);
    
    const canPullReview = selectableReviewQuestions.length > 0;
    const canPullUnseen = selectableUnseenQuestions.length > 0;

    if (selectedPracticeMode === 'review' && !canPullReview) {
      setCurrentQ(null);
      setPracticeMode('normal');
      if (hasShownCongratsThisSessionRef.current) {
        setGameState('idle');
      } else {
        hasShownCongratsThisSessionRef.current = true;
        setGameState('congrats');
      }
      return;
    }

    if (playablePool.length === 0) {
      setCurrentQ(null);
      setGameState('idle');
      return;
    }

    if (!sessionStartedAtRef.current) {
      const startedAt = Date.now();
      sessionStartedAtRef.current = startedAt;
      saveCurrentSessionStartedAt(startedAt);
    }
    
    if (!canPullReview && !canPullUnseen) {
      // Chế độ chơi tự do (khi bé đã thuộc hết các câu trong bài được chọn)
      const randomIndex = Math.floor(Math.random() * selectablePool.length);
      selectedQuestion = selectablePool[randomIndex];
    } else if (canPullReview && (!canPullUnseen || Math.random() < 0.6)) {
      // Ưu tiên ôn tập (tỉ lệ 60%)
      const randomIndex = Math.floor(Math.random() * selectableReviewQuestions.length);
      selectedQuestion = selectableReviewQuestions[randomIndex];
      isReview = true;
    } else {
      // Bốc ngẫu nhiên 1 câu chưa làm
      const randomIndex = Math.floor(Math.random() * selectableUnseenQuestions.length);
      selectedQuestion = selectableUnseenQuestions[randomIndex];
      isUnseen = true;
    }

    const selectedQuestionKey = getQuestionKey(selectedQuestion);
    if (selectedQuestionKey) {
      stageRecentQuestionKeysRef.current = [
        selectedQuestionKey,
        ...stageRecentQuestionKeysRef.current.filter(key => key !== selectedQuestionKey),
      ].slice(0, STAGED_RECENT_LIMIT);
    }

    setCurrentQ(buildPlayableQuestion(selectedQuestion, { isReview, isUnseen }));
    setTimer(settings.timeLimit);
    setSelectedAns(null);
    setShowFlashcardAnswer(false);
    setGameState('playing');
  }, [
    fullActivePool,
    isStagedLearningActive,
    practiceMode,
    reviewList,
    settings.timeLimit,
    stagedLearningEnabled,
    stagedRememberTarget,
    stagedStages,
    unseenList,
  ]);

  // --- XỬ LÝ TRẢ LỜI ---
  function updateScreenTime(amount) {
    setScreenTime(prev => {
      let newTime = prev + amount;
      if (newTime < MIN_TIME) newTime = MIN_TIME;
      if (newTime > MAX_TIME) newTime = MAX_TIME;
      return newTime;
    });
  }

  function updateRobux(amount) {
    setRobuxBalance(prev => normalizeRobuxBalance(prev + amount));
  }

  function applyLearningReward(isCorrect) {
    if (rewardMode === 'robux') {
      updateRobux(isCorrect ? settings.robuxReward : -ROBUX_WRONG_PENALTY);
      return;
    }

    updateScreenTime(isCorrect ? settings.rewardSec : -settings.penaltySec);
  }

  function addToReview(question) {
    const questionKey = getQuestionKey(question);
    const questionForReview = stripQuestionForStorage(question, 0);
    if (!questionKey || !questionForReview) return;

    setReviewList(prev => {
      const exists = prev.find(item => getQuestionKey(item) === questionKey);
      if (exists) {
        return prev.map(item => (
          getQuestionKey(item) === questionKey
            ? { ...questionForReview, correctCount: 0 }
            : item
        ));
      }

      return [...prev, questionForReview];
    });
  }

  function handleTimeout() {
    if (!currentQ) return;

    playSound('wrong', settings.soundVolumePercent);
    setGameState('timeout_paused');
    applyLearningReward(false);
    setTimeoutTotal(prev => prev + 1);
    if (currentQ?.isUnseen) {
      // Loại khỏi danh sách chưa làm
      const currentKey = getQuestionKey(currentQ);
      setUnseenList(prev => prev.filter(q => getQuestionKey(q) !== currentKey));
    }
    addToReview(currentQ);
  }

  const clearPendingTransitions = useCallback(() => {
    clearTimeout(nextQuestionTimeoutRef.current);
    clearTimeout(congratsTimeoutRef.current);
    nextQuestionTimeoutRef.current = null;
    congratsTimeoutRef.current = null;
  }, []);

  const queueCongrats = () => {
    if (hasShownCongratsThisSessionRef.current) return;
    hasShownCongratsThisSessionRef.current = true;
    clearTimeout(congratsTimeoutRef.current);
    congratsTimeoutRef.current = setTimeout(() => {
      setGameState('congrats');
      congratsTimeoutRef.current = null;
    }, 1600);
  };

  // --- TIMER ---
  useEffect(() => {
    if (gameState === 'playing' && !isFlashcardMode) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, currentQ, isFlashcardMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswerClick = (option) => {
    if (gameState !== 'playing') return;
    clearInterval(timerRef.current);
    setSelectedAns(option);
    const currentKey = getQuestionKey(currentQ);
    
    if (option === currentQ.ans) {
      // ĐÚNG
      playSound('correct', settings.soundVolumePercent);
      setGameState('celebrating');
      setCorrectTotal(prev => prev + 1);
      markStagedQuestionCorrect(currentQ);
      applyLearningReward(true);
      
      if (currentQ.isUnseen) {
        setUnseenList(prev => {
          const newList = prev.filter(q => getQuestionKey(q) !== currentKey);
          // Kiểm tra điều kiện thắng
          const remainingKeys = new Set(newList.map(getQuestionKey));
          const remainingSelectedUnseen = activePool.filter(question => remainingKeys.has(question.id));
          if (!isStagedLearningActive && remainingSelectedUnseen.length === 0 && activeReviewList.length === 0) {
            queueCongrats();
          }
          return newList;
        });
      } else if (currentQ.isReview) {
        handleReviewSuccess(currentQ);
      }
      
      // Chuyển nhanh sang câu tiếp theo sau khi bé thấy phản hồi đúng.
      clearTimeout(nextQuestionTimeoutRef.current);
      nextQuestionTimeoutRef.current = setTimeout(() => {
        generateQuestion();
        nextQuestionTimeoutRef.current = null;
      }, CORRECT_NEXT_DELAY_MS);
      
    } else {
      // SAI
      playSound('wrong', settings.soundVolumePercent);
      setGameState('wrong_paused');
      applyLearningReward(false);
      setWrongTotal(prev => prev + 1);
      if (currentQ.isUnseen) {
        // Loại khỏi danh sách chưa làm
        setUnseenList(prev => prev.filter(q => getQuestionKey(q) !== currentKey));
      }
      addToReview(currentQ);
    }
  };

  const goToNextFlashcard = () => {
    clearTimeout(nextQuestionTimeoutRef.current);
    nextQuestionTimeoutRef.current = setTimeout(() => {
      generateQuestion();
      nextQuestionTimeoutRef.current = null;
    }, 260);
  };

  const handleFlashcardRemembered = () => {
    if (!isFlashcardMode || gameState !== 'playing' || !currentQ || !showFlashcardAnswer) return;

    const currentKey = getQuestionKey(currentQ);
    playSound('correct', settings.soundVolumePercent);
    setCorrectTotal(prev => prev + 1);
    markStagedQuestionCorrect(currentQ);
    applyLearningReward(true);
    setShowFlashcardAnswer(false);

    if (currentQ.isUnseen) {
      setUnseenList(prev => {
        const newList = prev.filter(q => getQuestionKey(q) !== currentKey);
        const remainingKeys = new Set(newList.map(getQuestionKey));
        const remainingSelectedUnseen = activePool.filter(question => remainingKeys.has(question.id));
        if (!isStagedLearningActive && remainingSelectedUnseen.length === 0 && activeReviewList.length === 0) {
          queueCongrats();
        }
        return newList;
      });
    } else if (currentQ.isReview) {
      handleReviewSuccess(currentQ);
    }

    goToNextFlashcard();
  };

  const handleFlashcardNeedsReview = () => {
    if (!isFlashcardMode || gameState !== 'playing' || !currentQ || !showFlashcardAnswer) return;

    const currentKey = getQuestionKey(currentQ);
    setWrongTotal(prev => prev + 1);
    if (rewardMode === 'robux') {
      playSound('wrong', settings.soundVolumePercent);
      applyLearningReward(false);
    }
    setShowFlashcardAnswer(false);

    if (currentQ.isUnseen) {
      setUnseenList(prev => prev.filter(q => getQuestionKey(q) !== currentKey));
    }
    addToReview(currentQ);
    goToNextFlashcard();
  };

  const handleReviewSuccess = (question) => {
    if (!question?.isReview) return;
    const questionKey = getQuestionKey(question);
    
    setReviewList(prev => {
      const newList = prev.map(item => {
        if (getQuestionKey(item) === questionKey) {
          return { ...item, correctCount: clampNumber((item.correctCount || 0) + 1, 1, 0, 2) };
        }
        return item;
      }).filter(item => item.correctCount < 2); // Loại bỏ nếu đúng 2 lần liên tiếp
      
      // Kiểm tra nếu cả hai danh sách đều đã rỗng
      const remainingKeys = new Set(newList.map(getQuestionKey));
      const remainingSelectedReview = activePool.filter(item => remainingKeys.has(item.id));
      if (
        !isStagedLearningActive
        && remainingSelectedReview.length === 0
        && (practiceMode === 'review' || activeUnseenList.length === 0)
      ) {
        queueCongrats();
      }
      
      return newList;
    });
  };

  const handleEndSession = useCallback(() => {
    clearInterval(timerRef.current);
    clearPendingTransitions();
    rememberCurrentReadingPosition();
    const endedAt = Date.now();
    const unfinishedQuestion = gameState === 'playing' && currentQ
      ? {
          question: currentQ,
          timer: Math.max(1, timer),
          practiceMode,
          rewardMode,
          showFlashcardAnswer,
        }
      : null;
    let nextScreenTime = screenTime;
    let endSessionNotice = '';
    let endSessionPenaltyApplied = false;
    let endSessionAttemptCount = 0;

    if (unfinishedQuestion) {
      const currentGuard = normalizeEndSessionGuard(endSessionGuard, endedAt);
      const nextGuard = {
        windowStartedAt: currentGuard.windowStartedAt,
        count: currentGuard.count + 1,
      };
      const freeAttemptsLeft = Math.max(0, END_SESSION_FREE_LIMIT - nextGuard.count);

      endSessionAttemptCount = nextGuard.count;
      setEndSessionGuard(nextGuard);
      saveEndSessionGuard(nextGuard);

      if (nextGuard.count > END_SESSION_FREE_LIMIT) {
        nextScreenTime = clampNumber(screenTime - END_SESSION_PENALTY_SEC, MIN_TIME, MIN_TIME, MAX_TIME);
        endSessionPenaltyApplied = true;
        setScreenTime(nextScreenTime);
        endSessionNotice = `Con đã bấm kết thúc phiên ${nextGuard.count} lần trong 1 giờ. Giờ xem điện thoại: ${formatTime(screenTime)} - ${formatTime(END_SESSION_PENALTY_SEC)} = ${formatTime(nextScreenTime)}.`;
      } else if (freeAttemptsLeft === 0) {
        endSessionNotice = `Con đã dùng đủ ${END_SESSION_FREE_LIMIT}/${END_SESSION_FREE_LIMIT} lượt kết thúc miễn phí trong 1 giờ. Lần sau sẽ bị trừ ${formatTime(END_SESSION_PENALTY_SEC)}.`;
      } else {
        endSessionNotice = `Con đã dùng ${nextGuard.count}/${END_SESSION_FREE_LIMIT} lượt kết thúc miễn phí trong 1 giờ. Còn ${freeAttemptsLeft} lượt.`;
      }
    }

    setPausedQuestion(unfinishedQuestion);
    setShowParentConfirm(false);
    setShowHistoryPanel(false);
    setReadingSummary(null);
    readingSessionStartedAtRef.current = null;
    setShowReadingPanel(false);
    setSelectedReadingId(null);
    setExpandedReadingSeriesId(null);
    setShowColoringPanel(false);
    setShowColoringAccessPanel(false);
    setShowFlashcardAnswer(false);
    const startedAt = sessionStartedAtRef.current || endedAt;
    const nextSummary = {
      correctTotal,
      wrongTotal,
      timeoutTotal,
      reviewCount: activeReviewList.length,
      screenTime: nextScreenTime,
      robuxBalance,
      rewardMode,
      endSessionNotice,
      endSessionPenaltyApplied,
      endSessionAttemptCount,
      startedAt,
      durationSec: Math.max(0, Math.round((endedAt - startedAt) / 1000)),
      endedAt,
      studentName: displayName,
      studentAvatar: userAvatar,
    };

    setSummaryStats(nextSummary);
    setSessionHistory(prev => normalizeSessionHistory([
      {
        ...nextSummary,
        id: startedAt,
        startedAt,
        lessonLabel: currentLessonLabel,
      },
      ...prev.filter(entry => entry.id !== startedAt),
    ]));
    setGameState('summary');
  }, [
    activeReviewList.length,
    clearPendingTransitions,
    correctTotal,
    currentQ,
    currentLessonLabel,
    displayName,
    endSessionGuard,
    gameState,
    practiceMode,
    rememberCurrentReadingPosition,
    rewardMode,
    robuxBalance,
    screenTime,
    showFlashcardAnswer,
    timer,
    timeoutTotal,
    userAvatar,
    wrongTotal,
  ]);

  const resetExpiredLearningSession = () => {
    clearInterval(timerRef.current);
    clearPendingTransitions();
    sessionStartedAtRef.current = null;
    hasShownCongratsThisSessionRef.current = false;
    saveCurrentSessionStartedAt(null);
    setCorrectTotal(0);
    setWrongTotal(0);
    setTimeoutTotal(0);
    setStagedProgress({});
    stageRecentQuestionKeysRef.current = [];
    setCurrentQ(null);
    setPausedQuestion(null);
    setSelectedAns(null);
    setSummaryStats(null);
    setShowFlashcardAnswer(false);
    setPracticeMode('normal');
  };

  const handleGoHomeFromSummary = () => {
    clearInterval(timerRef.current);
    clearPendingTransitions();
    setSummaryStats(null);
    setPausedQuestion(null);
    setCurrentQ(null);
    setSelectedAns(null);
    setShowFlashcardAnswer(false);
    setShowParentConfirm(false);
    setPracticeMode('normal');
    setGameState('idle');
  };

  const handleContinueLearning = () => {
    const summaryStartedAt = summaryStats?.startedAt || sessionStartedAtRef.current;
    if (isLearningSessionExpired(summaryStartedAt)) {
      resetExpiredLearningSession();
      generateQuestion({ practiceMode: 'normal' });
      return;
    }

    clearInterval(timerRef.current);
    clearPendingTransitions();
    setSummaryStats(null);
    setSelectedAns(null);

    if (pausedQuestion?.question) {
      setPracticeMode(pausedQuestion.practiceMode || 'normal');
      setRewardMode(pausedQuestion.rewardMode || rewardMode);
      setCurrentQ(pausedQuestion.question);
      setTimer(pausedQuestion.timer || settings.timeLimit);
      setShowFlashcardAnswer(!!pausedQuestion.showFlashcardAnswer);
      setPausedQuestion(null);
      setGameState('playing');
      return;
    }

    setPracticeMode('normal');
    setShowFlashcardAnswer(false);
    generateQuestion({ practiceMode: 'normal' });
  };

  const startPracticeSession = (nextRewardMode = 'screenTime') => {
    clearInterval(timerRef.current);
    clearPendingTransitions();
    if (isLearningSessionExpired(sessionStartedAtRef.current)) {
      resetExpiredLearningSession();
    }
    if (!sessionStartedAtRef.current) {
      hasShownCongratsThisSessionRef.current = false;
    }
    setPausedQuestion(null);
    setSummaryStats(null);
    setSelectedAns(null);
    setShowFlashcardAnswer(false);
    setShowParentConfirm(false);
    setShowUserNameForm(false);
    setShowAdminLogin(false);
    setAdminError('');
    setAvatarError('');
    rememberCurrentReadingPosition();
    setReadingSummary(null);
    readingSessionStartedAtRef.current = null;
    setShowReadingPanel(false);
    setSelectedReadingId(null);
    setExpandedReadingSeriesId(null);
    setShowColoringPanel(false);
    setShowColoringAccessPanel(false);
    setShowHistoryPanel(false);
    setPracticeMode('normal');
    setRewardMode(nextRewardMode);
    generateQuestion({ practiceMode: 'normal' });
  };

  const toggleRobuxMode = () => {
    setRewardMode(prev => (prev === 'robux' ? 'screenTime' : 'robux'));
    setShowUserNameForm(false);
    setShowAdminLogin(false);
    setAdminError('');
    setAvatarError('');
    setShowParentConfirm(false);
    rememberCurrentReadingPosition();
    setReadingSummary(null);
    readingSessionStartedAtRef.current = null;
    setShowReadingPanel(false);
    setSelectedReadingId(null);
    setExpandedReadingSeriesId(null);
    setShowColoringPanel(false);
    setShowColoringAccessPanel(false);
    setShowHistoryPanel(false);
  };

  const handleColoringMenuClick = () => {
    if (showColoringPanel) {
      setShowColoringPanel(false);
      setShowColoringAccessPanel(false);
      return;
    }

    setShowUserNameForm(false);
    setShowAdminLogin(false);
    setAdminError('');
    setAvatarError('');
    setShowParentConfirm(false);
    rememberCurrentReadingPosition();
    setReadingSummary(null);
    readingSessionStartedAtRef.current = null;
    setShowReadingPanel(false);
    setSelectedReadingId(null);
    setExpandedReadingSeriesId(null);
    setShowHistoryPanel(false);
    setShowDrawingPanel(false);
    setShowDrawingAccessPanel(false);

    if (coloringTimeLeftSec > 0 || coloringTimeExchangeCost <= 0) {
      setShowColoringAccessPanel(false);
      setShowColoringPanel(true);
      return;
    }

    setShowColoringPanel(false);
    setColoringPurchaseMinutes(DEFAULT_COLORING_PURCHASE_MINUTES);
    setShowColoringAccessPanel(true);
  };

  const handleBuyColoringTime = () => {
    if (!canBuySelectedColoringTime) return;

    setRobuxBalance(prev => normalizeRobuxBalance(prev - coloringPurchaseCost));
    setColoringTimeLeftSec(prev => (
      normalizeColoringTimeLeft(prev + safeColoringPurchaseMinutes * COLORING_TIME_EXCHANGE_SECONDS)
    ));
    setColoringPurchaseMinutes(DEFAULT_COLORING_PURCHASE_MINUTES);
    setShowColoringAccessPanel(false);
    setShowColoringPanel(true);
  };

  const handleDrawingMenuClick = () => {
    if (showDrawingPanel) {
      setShowDrawingPanel(false);
      setShowDrawingAccessPanel(false);
      return;
    }

    setShowUserNameForm(false);
    setShowAdminLogin(false);
    setAdminError('');
    setAvatarError('');
    setShowParentConfirm(false);
    setShowColoringPanel(false);
    setShowColoringAccessPanel(false);
    rememberCurrentReadingPosition();
    setReadingSummary(null);
    readingSessionStartedAtRef.current = null;
    setShowReadingPanel(false);
    setSelectedReadingId(null);
    setExpandedReadingSeriesId(null);
    setShowHistoryPanel(false);

    if (drawingTimeLeftSec > 0 || drawingTimeExchangeCost <= 0) {
      setShowDrawingAccessPanel(false);
      setShowDrawingPanel(true);
      return;
    }

    setShowDrawingPanel(false);
    setDrawingPurchaseMinutes(DEFAULT_COLORING_PURCHASE_MINUTES);
    setShowDrawingAccessPanel(true);
  };

  const handleBuyDrawingTime = () => {
    if (!canBuySelectedDrawingTime) return;

    setRobuxBalance(prev => normalizeRobuxBalance(prev - drawingPurchaseCost));
    setDrawingTimeLeftSec(prev => (
      normalizeColoringTimeLeft(prev + safeDrawingPurchaseMinutes * COLORING_TIME_EXCHANGE_SECONDS)
    ));
    setDrawingPurchaseMinutes(DEFAULT_COLORING_PURCHASE_MINUTES);
    setShowDrawingAccessPanel(false);
    setShowDrawingPanel(true);
  };

  const handleGamesMenuClick = () => {
    if (showGamesPanel) {
      setShowGamesPanel(false);
      setShowGameAccessPanel(false);
      return;
    }

    setShowUserNameForm(false);
    setShowAdminLogin(false);
    setAdminError('');
    setAvatarError('');
    setShowParentConfirm(false);
    setShowColoringPanel(false);
    setShowColoringAccessPanel(false);
    setShowDrawingPanel(false);
    setShowDrawingAccessPanel(false);
    rememberCurrentReadingPosition();
    setReadingSummary(null);
    readingSessionStartedAtRef.current = null;
    setShowReadingPanel(false);
    setSelectedReadingId(null);
    setExpandedReadingSeriesId(null);
    setShowHistoryPanel(false);

    if (gameTimeLeftSec > 0 || gameTimeExchangeCost <= 0) {
      setShowGameAccessPanel(false);
      setShowGamesPanel(true);
      return;
    }

    setShowGamesPanel(false);
    setGamePurchaseMinutes(DEFAULT_COLORING_PURCHASE_MINUTES);
    setShowGameAccessPanel(true);
  };

  const handleAlbumMenuClick = () => {
    if (showAlbumPanel) {
      setShowAlbumPanel(false);
      return;
    }

    setShowUserNameForm(false);
    setShowAdminLogin(false);
    setAdminError('');
    setAvatarError('');
    setShowParentConfirm(false);
    setShowColoringPanel(false);
    setShowColoringAccessPanel(false);
    setShowDrawingPanel(false);
    setShowDrawingAccessPanel(false);
    setShowGamesPanel(false);
    setShowGameAccessPanel(false);
    rememberCurrentReadingPosition();
    setReadingSummary(null);
    readingSessionStartedAtRef.current = null;
    setShowReadingPanel(false);
    setSelectedReadingId(null);
    setExpandedReadingSeriesId(null);
    setShowHistoryPanel(false);
    setShowAlbumPanel(true);
  };

  const handleBuyGameTime = () => {
    if (!canBuySelectedGameTime) return;

    setRobuxBalance(prev => normalizeRobuxBalance(prev - gamePurchaseCost));
    setGameTimeLeftSec(prev => (
      normalizeColoringTimeLeft(prev + safeGamePurchaseMinutes * COLORING_TIME_EXCHANGE_SECONDS)
    ));
    setGamePurchaseMinutes(DEFAULT_COLORING_PURCHASE_MINUTES);
    setShowGameAccessPanel(false);
    setShowGamesPanel(true);
  };

  const handleReviewPractice = () => {
    if (activeReviewList.length === 0) return;

    clearInterval(timerRef.current);
    clearPendingTransitions();
    setPausedQuestion(null);
    setPracticeMode('review');
    setRewardMode('screenTime');
    setSummaryStats(null);
    setShowFlashcardAnswer(false);
    generateQuestion({
      activePool,
      activeReviewList,
      activeUnseenList: [],
      practiceMode: 'review',
    });
  };

  const handleRestartLearning = () => {
    const freshPool = generateInitialPool(settings);

    clearInterval(timerRef.current);
    clearPendingTransitions();
    stageRecentQuestionKeysRef.current = [];
    hasShownCongratsThisSessionRef.current = false;
    sessionStartedAtRef.current = null;
    saveCurrentSessionStartedAt(null);
    const freshEndSessionGuard = createEndSessionGuard();
    setEndSessionGuard(freshEndSessionGuard);
    saveEndSessionGuard(freshEndSessionGuard);
    setScreenTime(0);
    setReviewList([]);
    setUnseenList(freshPool);
    setCorrectTotal(0);
    setWrongTotal(0);
    setTimeoutTotal(0);
    setStagedProgress({});
    setCurrentQ(null);
    setPausedQuestion(null);
    setSelectedAns(null);
    setShowFlashcardAnswer(false);
    setSummaryStats(null);
    setPracticeMode('normal');
    setRewardMode('screenTime');
    setTimer(settings.timeLimit);
    generateQuestion({
      activePool: freshPool,
      activeReviewList: [],
      activeUnseenList: freshPool,
      practiceMode: 'normal',
    });
  };

  const handleUnlockColoringLevel = useCallback((levelId) => {
    const normalizedLevelId = Number(levelId);
    if (!COLORING_LEVEL_IDS.includes(normalizedLevelId)) return false;
    if (
      unlockedColoringLevels.includes(normalizedLevelId)
      || coloringUnlockInFlightRef.current.has(normalizedLevelId)
    ) {
      return true;
    }
    if (robuxBalance < settings.coloringUnlockCost) return false;

    coloringUnlockInFlightRef.current.add(normalizedLevelId);
    setRobuxBalance(prev => {
      if (prev < settings.coloringUnlockCost) {
        coloringUnlockInFlightRef.current.delete(normalizedLevelId);
        return prev;
      }

      return normalizeRobuxBalance(prev - settings.coloringUnlockCost);
    });
    setUnlockedColoringLevels(prev => normalizeUnlockedColoringLevels([...prev, normalizedLevelId]));
    return true;
  }, [robuxBalance, settings.coloringUnlockCost, unlockedColoringLevels]);

  const resetAllData = () => {
    setSummaryStats(null);
    localStorage.removeItem('math_screenTime');
    localStorage.removeItem('math_reviewList');
    localStorage.removeItem('math_correctTotal');
    localStorage.removeItem('math_unseenList');
    localStorage.removeItem('math_wrongTotal');
    localStorage.removeItem('math_timeoutTotal');
    localStorage.removeItem(STAGED_PROGRESS_KEY);
    localStorage.removeItem(STAGED_STAGES_KEY);
    localStorage.removeItem(SESSION_HISTORY_KEY);
    localStorage.removeItem(CURRENT_SESSION_STARTED_AT_KEY);
    localStorage.removeItem(END_SESSION_GUARD_KEY);
    localStorage.removeItem(READING_PROGRESS_KEY);
    localStorage.removeItem(READING_HISTORY_KEY);
    localStorage.removeItem(ROBUX_BALANCE_KEY);
    localStorage.removeItem(ROBUX_UNLOCKED_COLORING_KEY);
    localStorage.removeItem(COLORING_TIME_LEFT_KEY);
    window.location.reload();
  };

  // --- ĐỊNH DẠNG ---
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0 && s === 0) return "0 phút";
    let str = "";
    if (m > 0) str += `${m} phút `;
    if (s > 0) str += `${s} giây`;
    return str.trim();
  };
  const formatDuration = (seconds = 0) => {
    const totalSeconds = Math.max(0, Math.round(Number(seconds) || 0));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const parts = [];

    if (h > 0) parts.push(`${h} giờ`);
    if (m > 0) parts.push(`${m} phút`);
    if (s > 0 || parts.length === 0) parts.push(`${s} giây`);

    return parts.join(' ');
  };
  const formatClockTime = (seconds = 0) => {
    const totalSeconds = Math.max(0, Math.round(Number(seconds) || 0));
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };
  const visibleSummary = summaryStats || {
    correctTotal,
    wrongTotal,
    timeoutTotal,
    reviewCount: activeReviewList.length,
    screenTime,
    robuxBalance,
    rewardMode,
    endSessionNotice: '',
    endSessionPenaltyApplied: false,
    endSessionAttemptCount: 0,
    startedAt: sessionStartedAtRef.current,
    durationSec: 0,
    endedAt: null,
    studentName: displayName,
    studentAvatar: userAvatar,
  };
  const isSummary = gameState === 'summary';
  const isFeedbackPaused = gameState === 'wrong_paused' || gameState === 'timeout_paused';
  const isCelebrating = gameState === 'celebrating';
  const canScrollPage = showUserNameForm || showAdminLogin || isAdmin || showParentConfirm;

  // --- RENDER COMPONENT ---
  return (
    <div className={`app-shell bg-sky-100 font-sans flex flex-col items-center ${
      isSummary ? 'app-shell--summary' : canScrollPage ? 'app-shell--scroll' : 'app-shell--main'
    }`}>
      {/* ROLE LOGIN */}
      {!isSummary && (
      <div className="w-full max-w-lg shrink-0 bg-white rounded-2xl md:rounded-3xl shadow-lg border-4 border-white mb-4 p-1.5 md:p-2">
        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
          <button
            type="button"
            onClick={toggleReadingPanel}
            className={`flex min-w-0 items-center justify-center gap-0.5 md:gap-2 rounded-xl md:rounded-2xl py-2 px-0.5 md:px-2 font-extrabold text-[13px] sm:text-base md:text-xl transition-all ${
              showReadingPanel
                ? 'bg-emerald-500 text-white shadow-[0_4px_0_rgb(5,150,105)]'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-2 border-emerald-100'
            }`}
          >
            <BookOpen size={16} className="shrink-0 md:w-5 md:h-5" /> <span className="truncate">Tập đọc</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveHistoryTab('math');
              setShowHistoryPanel(prev => !prev);
              setShowUserNameForm(false);
              setShowAdminLogin(false);
              setAdminError('');
              setAvatarError('');
              setShowParentConfirm(false);
              rememberCurrentReadingPosition();
              setReadingSummary(null);
              readingSessionStartedAtRef.current = null;
              setShowReadingPanel(false);
              setSelectedReadingId(null);
              setExpandedReadingSeriesId(null);
              setShowColoringPanel(false);
              setShowColoringAccessPanel(false);
            }}
            className={`flex min-w-0 items-center justify-center gap-0.5 md:gap-2 rounded-xl md:rounded-2xl py-2 px-0.5 md:px-2 font-extrabold text-[13px] sm:text-base md:text-xl transition-all ${
              showHistoryPanel
                ? 'bg-sky-500 text-white shadow-[0_4px_0_rgb(2,132,199)]'
                : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border-2 border-sky-100'
            }`}
          >
            <BarChart size={16} className="shrink-0 md:w-5 md:h-5" /> <span className="truncate">Lịch sử</span>
          </button>

          <button
            type="button"
            onClick={handleDrawingMenuClick}
            className={`flex min-w-0 items-center justify-center gap-0.5 md:gap-2 rounded-xl md:rounded-2xl py-2 px-0.5 md:px-2 text-[13px] font-extrabold transition-all sm:text-base md:text-xl ${
              showDrawingPanel || showDrawingAccessPanel
                ? 'bg-pink-500 text-white shadow-[0_4px_0_rgb(190,24,93)]'
                : 'border-2 border-pink-100 bg-pink-50 text-pink-700 hover:bg-pink-100'
            }`}
          >
            <Brush size={16} className="shrink-0 md:h-5 md:w-5" /> <span className="truncate">Học vẽ</span>
          </button>
        </div>

        <div className="mt-1.5 grid grid-cols-3 gap-1.5 md:mt-2 md:gap-2">
          <button
            type="button"
            onClick={handleColoringMenuClick}
            className={`flex min-w-0 items-center justify-center gap-0.5 md:gap-2 rounded-xl md:rounded-2xl py-2 px-0.5 md:px-2 text-[13px] font-extrabold transition-all sm:text-base md:text-xl ${
              showColoringPanel || showColoringAccessPanel
                ? 'bg-amber-500 text-white shadow-[0_4px_0_rgb(217,119,6)]'
                : 'border-2 border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <PencilLine size={16} className="shrink-0 md:h-5 md:w-5" /> <span className="truncate">Tô màu</span>
          </button>

          <button
            type="button"
            onClick={handleGamesMenuClick}
            className={`flex min-w-0 items-center justify-center gap-0.5 md:gap-2 rounded-xl md:rounded-2xl py-2 px-0.5 md:px-2 text-[13px] font-extrabold transition-all sm:text-base md:text-xl ${
              showGamesPanel || showGameAccessPanel
                ? 'bg-orange-500 text-white shadow-[0_4px_0_rgb(194,65,12)]'
                : 'border-2 border-orange-100 bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}
          >
            <Gamepad2 size={16} className="shrink-0 md:h-5 md:w-5" /> <span className="truncate">Game</span>
          </button>

          <button
            type="button"
            onClick={toggleRobuxMode}
            className={`flex min-w-0 items-center justify-center gap-0.5 md:gap-2 rounded-xl md:rounded-2xl py-2 px-0.5 md:px-2 text-[13px] font-extrabold transition-all sm:text-base md:text-xl ${
              rewardMode === 'robux'
                ? 'bg-yellow-400 text-yellow-950 shadow-[0_4px_0_rgb(202,138,4)]'
                : 'border-2 border-yellow-100 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
            }`}
          >
            <Gem size={16} className="shrink-0 md:h-5 md:w-5" /> <span className="truncate">{rewardMode === 'robux' ? 'Tắt Robux' : 'Kiếm Robux'}</span>
          </button>
        </div>

        <div className="mt-1.5 md:mt-2">
          <button
            type="button"
            onClick={handleAlbumMenuClick}
            className={`flex w-full min-w-0 items-center justify-center gap-1 md:gap-2 rounded-xl md:rounded-2xl py-2 px-2 text-[13px] font-extrabold transition-all sm:text-base md:text-xl ${
              showAlbumPanel
                ? 'bg-violet-500 text-white shadow-[0_4px_0_rgb(109,40,217)]'
                : 'border-2 border-violet-100 bg-violet-50 text-violet-700 hover:bg-violet-100'
            }`}
          >
            <Camera size={16} className="shrink-0 md:h-5 md:w-5" /> <span className="truncate">Album của bé</span>
          </button>
        </div>

        {showAccountButtons && (
          <div className="mt-1.5 grid grid-cols-2 gap-1.5 md:mt-2 md:gap-2">
            <button
              type="button"
              onClick={toggleUserNameForm}
              className={`flex min-w-0 items-center justify-center gap-0.5 md:gap-2 rounded-xl md:rounded-2xl py-2 px-0.5 md:px-2 font-extrabold text-[13px] sm:text-base md:text-xl transition-all ${
                showUserNameForm
                  ? 'bg-blue-500 text-white shadow-[0_4px_0_rgb(29,78,216)]'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-2 border-blue-100'
              }`}
            >
              <UserRound size={16} className="shrink-0 md:w-5 md:h-5" /> <span className="truncate">Người dùng</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isAdmin) return;
                setShowUserNameForm(false);
                setAvatarError('');
                setShowAdminLogin(prev => !prev);
                setAdminError('');
                setSettingsSaved(false);
                setShowHistoryPanel(false);
                rememberCurrentReadingPosition();
                setReadingSummary(null);
                readingSessionStartedAtRef.current = null;
                setShowReadingPanel(false);
                setSelectedReadingId(null);
                setExpandedReadingSeriesId(null);
                setShowColoringPanel(false);
                setShowColoringAccessPanel(false);
              }}
              className={`flex min-w-0 items-center justify-center gap-0.5 md:gap-2 rounded-xl md:rounded-2xl py-2 px-0.5 md:px-2 font-extrabold text-[13px] sm:text-base md:text-xl transition-all ${
                isAdmin
                  ? 'bg-purple-500 text-white shadow-[0_4px_0_rgb(126,34,206)]'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-2 border-purple-100'
              }`}
            >
              <ShieldCheck size={16} className="shrink-0 md:w-5 md:h-5" /> <span className="truncate">Admin</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowAccountButtons(prev => !prev)}
          aria-label={showAccountButtons ? 'Thu gọn nút Người dùng và Admin' : 'Hiện nút Người dùng và Admin'}
          className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-xl bg-slate-100 py-1 text-[11px] font-bold text-slate-500 transition hover:bg-slate-200 md:mt-2 md:text-xs"
        >
          <ChevronDown size={15} className={`transition-transform ${showAccountButtons ? 'rotate-180' : ''}`} />
          <span>{showAccountButtons ? 'Thu gọn' : 'Người dùng · Admin'}</span>
        </button>

        {showUserNameForm && (
          <form onSubmit={saveUserName} className="mt-2 rounded-xl border-2 border-blue-100 bg-blue-50 p-2">
            <div className="flex items-center gap-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-blue-100 shadow-sm">
                {draftUserAvatar ? (
                  <img src={draftUserAvatar} alt="Ảnh đại diện xem trước" className="h-full w-full object-cover" />
                ) : (
                  <UserRound size={22} className="text-blue-500" />
                )}
              </div>
              <input
                type="text"
                value={draftUserName}
                onChange={(event) => setDraftUserName(event.target.value.slice(0, 28))}
                placeholder="Nhập tên"
                aria-label="Người dùng"
                className="min-w-0 flex-1 rounded-xl border-2 border-blue-100 bg-white py-2 px-3 text-base font-bold text-blue-900 outline-none focus:border-blue-400"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1 rounded-xl bg-blue-500 px-3 py-2 text-sm md:text-base font-extrabold text-white shadow-[0_3px_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none transition-all"
              >
                <Save size={18} /> Lưu
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 pl-[52px]">
              <label className="cursor-pointer rounded-lg bg-white px-3 py-2 text-xs md:text-sm font-extrabold text-blue-700 border-2 border-blue-100 hover:border-blue-300 transition-colors">
                Tải ảnh đại diện
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="sr-only"
                />
              </label>
              {draftUserAvatar && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftUserAvatar('');
                    setAvatarError('');
                  }}
                  className="rounded-lg bg-white/80 px-3 py-2 text-xs md:text-sm font-bold text-gray-500 hover:text-red-500 transition-colors"
                >
                  Xóa ảnh
                </button>
              )}
              {avatarError && (
                <div className="text-xs font-bold text-red-500">{avatarError}</div>
              )}
            </div>

          </form>
        )}

        {!isAdmin && showAdminLogin && (
          <form onSubmit={handleAdminLogin} className="mt-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="relative flex-1">
                <LockKeyhole size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                <input
                  type="password"
                  value={adminPin}
                  onChange={(event) => {
                    setAdminPin(event.target.value);
                    setAdminError('');
                  }}
                  placeholder="Mã Admin"
                  aria-label="Mã Admin"
                  className="w-full rounded-xl border-2 border-purple-100 bg-purple-50 py-2 pl-10 pr-3 text-base font-bold text-purple-900 outline-none focus:border-purple-400"
                />
              </label>
              <button
                type="submit"
                className="rounded-xl bg-purple-500 px-5 py-2 text-sm md:text-base font-extrabold text-white shadow-[0_3px_0_rgb(126,34,206)] active:translate-y-1 active:shadow-none transition-all"
              >
                Đăng nhập
              </button>
            </div>
            {adminError && (
              <div className="mt-2 text-center text-sm font-bold text-red-500">{adminError}</div>
            )}
          </form>
        )}
      </div>
      )}

      {isAdmin && (
        <div className="w-full max-w-lg bg-white rounded-2xl md:rounded-3xl shadow-xl border-4 border-white mb-2 md:mb-4 p-3 md:p-5">
          <div className="flex items-center gap-2 text-purple-700 font-black text-lg md:text-xl mb-3">
            <Settings size={22} className="md:w-6 md:h-6" /> Cài đặt Admin
          </div>

          <form onSubmit={saveAdminSettings} className="space-y-4 md:space-y-5">
            <div className="rounded-xl border-2 border-slate-100 bg-slate-50 p-2">
              <button
                type="button"
                onClick={() => setShowAdminSettingsPanel(prev => !prev)}
                aria-expanded={showAdminSettingsPanel}
                className="flex w-full items-center justify-between gap-3 rounded-lg bg-white px-3 py-3 text-left text-sm md:text-base font-extrabold text-slate-800 border-2 border-slate-100 hover:border-slate-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Settings size={18} className="text-slate-500" /> Thiết lập
                </span>
                <ChevronDown
                  size={20}
                  className={`text-slate-400 transition-transform ${showAdminSettingsPanel ? 'rotate-180' : ''}`}
                />
              </button>

              {showAdminSettingsPanel && (
                <div className="space-y-4 pt-3">
                  <label className="block">
                    <span className="flex items-center gap-2 text-sm md:text-base font-extrabold text-gray-700 mb-2">
                      <Clock size={18} className="text-blue-500" /> Thời gian đếm ngược mỗi câu
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('timeLimit', -1, DEFAULT_SETTINGS.timeLimit, 3, 60)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700 transition hover:bg-blue-200"
                        aria-label="Giảm thời gian đếm ngược"
                      >
                        <Minus size={18} />
                      </button>
                      <input
                        type="range"
                        min="3"
                        max="60"
                        value={clampNumber(draftSettings.timeLimit, DEFAULT_SETTINGS.timeLimit, 3, 60)}
                        onChange={(event) => updateDraftSetting('timeLimit', event.target.value)}
                        className="min-w-0 flex-1 accent-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('timeLimit', 1, DEFAULT_SETTINGS.timeLimit, 3, 60)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700 transition hover:bg-blue-200"
                        aria-label="Tăng thời gian đếm ngược"
                      >
                        <Plus size={18} />
                      </button>
                      <div className="flex items-center rounded-xl border-2 border-blue-100 bg-blue-50 overflow-hidden">
                        <input
                          type="number"
                          min="3"
                          max="60"
                          value={draftSettings.timeLimit}
                          onChange={(event) => updateDraftSetting('timeLimit', event.target.value)}
                          className="w-16 bg-transparent px-2 py-2 text-right text-lg font-black text-blue-700 outline-none"
                          aria-label="Thời gian đếm ngược mỗi câu"
                        />
                        <span className="pr-3 text-sm font-bold text-blue-500">giây</span>
                      </div>
                    </div>
                  </label>

                  <label className="block">
                    <span className="flex items-center gap-2 text-sm md:text-base font-extrabold text-gray-700 mb-2">
                      <Smartphone size={18} className="text-green-500" /> Thời gian xem điện thoại mỗi câu đúng
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('rewardSec', -5, DEFAULT_SETTINGS.rewardSec, 5, 600)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-100 text-green-700 transition hover:bg-green-200"
                        aria-label="Giảm thời gian thưởng"
                      >
                        <Minus size={18} />
                      </button>
                      <input
                        type="range"
                        min="5"
                        max="600"
                        step="5"
                        value={clampNumber(draftSettings.rewardSec, DEFAULT_SETTINGS.rewardSec, 5, 600)}
                        onChange={(event) => updateDraftSetting('rewardSec', event.target.value)}
                        className="min-w-0 flex-1 accent-green-500"
                      />
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('rewardSec', 5, DEFAULT_SETTINGS.rewardSec, 5, 600)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-100 text-green-700 transition hover:bg-green-200"
                        aria-label="Tăng thời gian thưởng"
                      >
                        <Plus size={18} />
                      </button>
                      <div className="flex items-center rounded-xl border-2 border-green-100 bg-green-50 overflow-hidden">
                        <input
                          type="number"
                          min="5"
                          max="600"
                          step="5"
                          value={draftSettings.rewardSec}
                          onChange={(event) => updateDraftSetting('rewardSec', event.target.value)}
                          className="w-20 bg-transparent px-2 py-2 text-right text-lg font-black text-green-700 outline-none"
                          aria-label="Thời gian xem điện thoại mỗi câu đúng"
                        />
                        <span className="pr-3 text-sm font-bold text-green-500">giây</span>
                      </div>
                    </div>
                  </label>

                  <label className="block">
                    <span className="flex items-center gap-2 text-sm md:text-base font-extrabold text-gray-700 mb-2">
                      <XCircle size={18} className="text-red-500" /> Thời gian bị trừ khi trả lời sai
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('penaltySec', -5, DEFAULT_SETTINGS.penaltySec, 5, 600)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-100 text-red-700 transition hover:bg-red-200"
                        aria-label="Giảm thời gian phạt"
                      >
                        <Minus size={18} />
                      </button>
                      <input
                        type="range"
                        min="5"
                        max="600"
                        step="5"
                        value={clampNumber(draftSettings.penaltySec, DEFAULT_SETTINGS.penaltySec, 5, 600)}
                        onChange={(event) => updateDraftSetting('penaltySec', event.target.value)}
                        className="min-w-0 flex-1 accent-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('penaltySec', 5, DEFAULT_SETTINGS.penaltySec, 5, 600)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-100 text-red-700 transition hover:bg-red-200"
                        aria-label="Tăng thời gian phạt"
                      >
                        <Plus size={18} />
                      </button>
                      <div className="flex items-center rounded-xl border-2 border-red-100 bg-red-50 overflow-hidden">
                        <input
                          type="number"
                          min="5"
                          max="600"
                          step="5"
                          value={draftSettings.penaltySec}
                          onChange={(event) => updateDraftSetting('penaltySec', event.target.value)}
                          className="w-20 bg-transparent px-2 py-2 text-right text-lg font-black text-red-700 outline-none"
                          aria-label="Thời gian bị trừ khi trả lời sai"
                        />
                        <span className="pr-3 text-sm font-bold text-red-500">giây</span>
                      </div>
                    </div>
                  </label>

                  <label className="block">
                    <span className="flex items-center gap-2 text-sm md:text-base font-extrabold text-gray-700 mb-2">
                      <Gem size={18} className="text-yellow-500" /> Robux thưởng mỗi câu đúng
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('robuxReward', -1, DEFAULT_SETTINGS.robuxReward, MIN_ROBUX_REWARD, MAX_ROBUX_REWARD)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-yellow-100 text-yellow-700 transition hover:bg-yellow-200"
                        aria-label="Giảm Robux thưởng"
                      >
                        <Minus size={18} />
                      </button>
                      <input
                        type="range"
                        min={MIN_ROBUX_REWARD}
                        max={MAX_ROBUX_REWARD}
                        value={clampNumber(draftSettings.robuxReward, DEFAULT_SETTINGS.robuxReward, MIN_ROBUX_REWARD, MAX_ROBUX_REWARD)}
                        onChange={(event) => updateDraftSetting('robuxReward', event.target.value)}
                        className="min-w-0 flex-1 accent-yellow-500"
                      />
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('robuxReward', 1, DEFAULT_SETTINGS.robuxReward, MIN_ROBUX_REWARD, MAX_ROBUX_REWARD)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-yellow-100 text-yellow-700 transition hover:bg-yellow-200"
                        aria-label="Tăng Robux thưởng"
                      >
                        <Plus size={18} />
                      </button>
                      <div className="flex items-center rounded-xl border-2 border-yellow-100 bg-yellow-50 overflow-hidden">
                        <input
                          type="number"
                          min={MIN_ROBUX_REWARD}
                          max={MAX_ROBUX_REWARD}
                          value={draftSettings.robuxReward}
                          onChange={(event) => updateDraftSetting('robuxReward', event.target.value)}
                          className="w-20 bg-transparent px-2 py-2 text-right text-lg font-black text-yellow-700 outline-none"
                          aria-label="Robux thưởng mỗi câu đúng"
                        />
                        <span className="pr-3 text-sm font-bold text-yellow-500">Robux</span>
                      </div>
                    </div>
                  </label>

                  <label className="block">
                    <span className="flex items-center gap-2 text-sm md:text-base font-extrabold text-gray-700 mb-2">
                      <LockKeyhole size={18} className="text-amber-500" /> Giá mở khóa mỗi ảnh tô màu
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('coloringUnlockCost', -1, DEFAULT_SETTINGS.coloringUnlockCost, MIN_COLORING_UNLOCK_COST, MAX_COLORING_UNLOCK_COST)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 transition hover:bg-amber-200"
                        aria-label="Giảm giá mở khóa ảnh"
                      >
                        <Minus size={18} />
                      </button>
                      <input
                        type="range"
                        min={MIN_COLORING_UNLOCK_COST}
                        max={MAX_COLORING_UNLOCK_COST}
                        value={clampNumber(draftSettings.coloringUnlockCost, DEFAULT_SETTINGS.coloringUnlockCost, MIN_COLORING_UNLOCK_COST, MAX_COLORING_UNLOCK_COST)}
                        onChange={(event) => updateDraftSetting('coloringUnlockCost', event.target.value)}
                        className="min-w-0 flex-1 accent-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('coloringUnlockCost', 1, DEFAULT_SETTINGS.coloringUnlockCost, MIN_COLORING_UNLOCK_COST, MAX_COLORING_UNLOCK_COST)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 transition hover:bg-amber-200"
                        aria-label="Tăng giá mở khóa ảnh"
                      >
                        <Plus size={18} />
                      </button>
                      <div className="flex items-center rounded-xl border-2 border-amber-100 bg-amber-50 overflow-hidden">
                        <input
                          type="number"
                          min={MIN_COLORING_UNLOCK_COST}
                          max={MAX_COLORING_UNLOCK_COST}
                          value={draftSettings.coloringUnlockCost}
                          onChange={(event) => updateDraftSetting('coloringUnlockCost', event.target.value)}
                          className="w-20 bg-transparent px-2 py-2 text-right text-lg font-black text-amber-700 outline-none"
                          aria-label="Giá mở khóa mỗi ảnh tô màu"
                        />
                        <span className="pr-3 text-sm font-bold text-amber-500">Robux</span>
                      </div>
                    </div>
                  </label>

                  <label className="block">
                    <span className="flex items-center gap-2 text-sm md:text-base font-extrabold text-gray-700 mb-2">
                      <PencilLine size={18} className="text-amber-500" /> Robux đổi 1 phút tô màu
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('coloringTimeExchangeCost', -1, DEFAULT_SETTINGS.coloringTimeExchangeCost, MIN_TIME_EXCHANGE_COST, MAX_TIME_EXCHANGE_COST)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 transition hover:bg-amber-200"
                        aria-label="Giảm Robux đổi thời gian tô màu"
                      >
                        <Minus size={18} />
                      </button>
                      <input
                        type="range"
                        min={MIN_TIME_EXCHANGE_COST}
                        max={MAX_TIME_EXCHANGE_COST}
                        value={clampNumber(draftSettings.coloringTimeExchangeCost, DEFAULT_SETTINGS.coloringTimeExchangeCost, MIN_TIME_EXCHANGE_COST, MAX_TIME_EXCHANGE_COST)}
                        onChange={(event) => updateDraftSetting('coloringTimeExchangeCost', event.target.value)}
                        className="min-w-0 flex-1 accent-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('coloringTimeExchangeCost', 1, DEFAULT_SETTINGS.coloringTimeExchangeCost, MIN_TIME_EXCHANGE_COST, MAX_TIME_EXCHANGE_COST)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 transition hover:bg-amber-200"
                        aria-label="Tăng Robux đổi thời gian tô màu"
                      >
                        <Plus size={18} />
                      </button>
                      <div className="flex items-center rounded-xl border-2 border-amber-100 bg-amber-50 overflow-hidden">
                        <input
                          type="number"
                          min={MIN_TIME_EXCHANGE_COST}
                          max={MAX_TIME_EXCHANGE_COST}
                          value={draftSettings.coloringTimeExchangeCost}
                          onChange={(event) => updateDraftSetting('coloringTimeExchangeCost', event.target.value)}
                          className="w-20 bg-transparent px-2 py-2 text-right text-lg font-black text-amber-700 outline-none"
                          aria-label="Robux đổi 1 phút tô màu"
                        />
                        <span className="pr-3 text-sm font-bold text-amber-500">Robux</span>
                      </div>
                    </div>
                  </label>

                  <label className="block">
                    <span className="flex items-center gap-2 text-sm md:text-base font-extrabold text-gray-700 mb-2">
                      <Brush size={18} className="text-pink-500" /> Robux đổi 1 phút học vẽ
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('drawingTimeExchangeCost', -1, DEFAULT_SETTINGS.drawingTimeExchangeCost, MIN_TIME_EXCHANGE_COST, MAX_TIME_EXCHANGE_COST)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pink-100 text-pink-700 transition hover:bg-pink-200"
                        aria-label="Giảm Robux đổi thời gian học vẽ"
                      >
                        <Minus size={18} />
                      </button>
                      <input
                        type="range"
                        min={MIN_TIME_EXCHANGE_COST}
                        max={MAX_TIME_EXCHANGE_COST}
                        value={clampNumber(draftSettings.drawingTimeExchangeCost, DEFAULT_SETTINGS.drawingTimeExchangeCost, MIN_TIME_EXCHANGE_COST, MAX_TIME_EXCHANGE_COST)}
                        onChange={(event) => updateDraftSetting('drawingTimeExchangeCost', event.target.value)}
                        className="min-w-0 flex-1 accent-pink-500"
                      />
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('drawingTimeExchangeCost', 1, DEFAULT_SETTINGS.drawingTimeExchangeCost, MIN_TIME_EXCHANGE_COST, MAX_TIME_EXCHANGE_COST)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pink-100 text-pink-700 transition hover:bg-pink-200"
                        aria-label="Tăng Robux đổi thời gian học vẽ"
                      >
                        <Plus size={18} />
                      </button>
                      <div className="flex items-center rounded-xl border-2 border-pink-100 bg-pink-50 overflow-hidden">
                        <input
                          type="number"
                          min={MIN_TIME_EXCHANGE_COST}
                          max={MAX_TIME_EXCHANGE_COST}
                          value={draftSettings.drawingTimeExchangeCost}
                          onChange={(event) => updateDraftSetting('drawingTimeExchangeCost', event.target.value)}
                          className="w-20 bg-transparent px-2 py-2 text-right text-lg font-black text-pink-700 outline-none"
                          aria-label="Robux đổi 1 phút học vẽ"
                        />
                        <span className="pr-3 text-sm font-bold text-pink-500">Robux</span>
                      </div>
                    </div>
                  </label>

                  <label className="block">
                    <span className="flex items-center gap-2 text-sm md:text-base font-extrabold text-gray-700 mb-2">
                      <Gamepad2 size={18} className="text-orange-500" /> Robux đổi 1 phút trò chơi
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('gameTimeExchangeCost', -1, DEFAULT_SETTINGS.gameTimeExchangeCost, MIN_TIME_EXCHANGE_COST, MAX_TIME_EXCHANGE_COST)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-700 transition hover:bg-orange-200"
                        aria-label="Giảm Robux đổi thời gian trò chơi"
                      >
                        <Minus size={18} />
                      </button>
                      <input
                        type="range"
                        min={MIN_TIME_EXCHANGE_COST}
                        max={MAX_TIME_EXCHANGE_COST}
                        value={clampNumber(draftSettings.gameTimeExchangeCost, DEFAULT_SETTINGS.gameTimeExchangeCost, MIN_TIME_EXCHANGE_COST, MAX_TIME_EXCHANGE_COST)}
                        onChange={(event) => updateDraftSetting('gameTimeExchangeCost', event.target.value)}
                        className="min-w-0 flex-1 accent-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('gameTimeExchangeCost', 1, DEFAULT_SETTINGS.gameTimeExchangeCost, MIN_TIME_EXCHANGE_COST, MAX_TIME_EXCHANGE_COST)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-700 transition hover:bg-orange-200"
                        aria-label="Tăng Robux đổi thời gian trò chơi"
                      >
                        <Plus size={18} />
                      </button>
                      <div className="flex items-center rounded-xl border-2 border-orange-100 bg-orange-50 overflow-hidden">
                        <input
                          type="number"
                          min={MIN_TIME_EXCHANGE_COST}
                          max={MAX_TIME_EXCHANGE_COST}
                          value={draftSettings.gameTimeExchangeCost}
                          onChange={(event) => updateDraftSetting('gameTimeExchangeCost', event.target.value)}
                          className="w-20 bg-transparent px-2 py-2 text-right text-lg font-black text-orange-700 outline-none"
                          aria-label="Robux đổi 1 phút trò chơi"
                        />
                        <span className="pr-3 text-sm font-bold text-orange-500">Robux</span>
                      </div>
                    </div>
                  </label>

                  <label className="block">
                    <span className="flex items-center gap-2 text-sm md:text-base font-extrabold text-gray-700 mb-2">
                      <Volume2 size={18} className="text-purple-500" /> Âm lượng âm thanh
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('soundVolumePercent', -5, DEFAULT_SETTINGS.soundVolumePercent, 0, MAX_SOUND_VOLUME_PERCENT)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-purple-100 text-purple-700 transition hover:bg-purple-200"
                        aria-label="Giảm âm lượng"
                      >
                        <Minus size={18} />
                      </button>
                      <input
                        type="range"
                        min="0"
                        max={MAX_SOUND_VOLUME_PERCENT}
                        step="5"
                        value={clampNumber(draftSettings.soundVolumePercent, DEFAULT_SETTINGS.soundVolumePercent, 0, MAX_SOUND_VOLUME_PERCENT)}
                        onChange={(event) => updateDraftSetting('soundVolumePercent', event.target.value)}
                        className="min-w-0 flex-1 accent-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => adjustDraftNumberSetting('soundVolumePercent', 5, DEFAULT_SETTINGS.soundVolumePercent, 0, MAX_SOUND_VOLUME_PERCENT)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-purple-100 text-purple-700 transition hover:bg-purple-200"
                        aria-label="Tăng âm lượng"
                      >
                        <Plus size={18} />
                      </button>
                      <div className="flex items-center rounded-xl border-2 border-purple-100 bg-purple-50 overflow-hidden">
                        <input
                          type="number"
                          min="0"
                          max={MAX_SOUND_VOLUME_PERCENT}
                          step="5"
                          value={draftSettings.soundVolumePercent}
                          onChange={(event) => updateDraftSetting('soundVolumePercent', event.target.value)}
                          className="w-20 bg-transparent px-2 py-2 text-right text-lg font-black text-purple-700 outline-none"
                          aria-label="Âm lượng âm thanh"
                        />
                        <span className="pr-3 text-sm font-bold text-purple-500">%</span>
                      </div>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="rounded-xl border-2 border-cyan-100 bg-cyan-50 p-3">
              <div className="flex items-center gap-2 text-sm md:text-base font-extrabold text-cyan-800 mb-3">
                <BookOpen size={18} className="text-cyan-500" /> Chế độ học
              </div>

              <div className="grid grid-cols-2 gap-2">
                {LEARNING_MODES.map((mode) => {
                  const isSelected = normalizeLearningMode(draftSettings.learningMode) === mode.id;

                  return (
                    <label
                      key={mode.id}
                      className={`flex min-h-11 items-center justify-center rounded-lg border-2 px-2 py-2 text-center text-sm md:text-base font-extrabold transition-colors ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500 text-white shadow-[0_3px_0_rgb(14,116,144)]'
                          : 'border-cyan-100 bg-white text-cyan-700 hover:border-cyan-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="learningMode"
                        value={mode.id}
                        checked={isSelected}
                        onChange={() => updateDraftSetting('learningMode', mode.id)}
                        className="sr-only"
                      />
                      {mode.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border-2 border-indigo-100 bg-indigo-50 p-3">
              <div className="flex items-center gap-2 text-sm md:text-base font-extrabold text-indigo-800 mb-3">
                <PencilLine size={18} className="text-indigo-500" /> Quản lý bài học
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LESSON_TYPES.map((type) => {
                  const isSelected = draftLessonTypes.includes(type.id);

                  return (
                    <label
                      key={type.id}
                      className={`flex min-h-11 items-center justify-center rounded-lg border-2 px-3 py-2 text-center text-sm md:text-base font-extrabold transition-colors ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500 text-white shadow-[0_3px_0_rgb(67,56,202)]'
                          : 'border-indigo-100 bg-white text-indigo-700 hover:border-indigo-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="lessonTypes"
                        value={type.id}
                        checked={isSelected}
                        onChange={() => toggleDraftLessonType(type.id)}
                        className="sr-only"
                      />
                      {type.label}
                    </label>
                  );
                })}
              </div>

              {draftLessonTypes.includes('custom') && (
                <div className="mt-3">
                  <label className="block text-xs md:text-sm font-bold text-indigo-700 mb-2">
                    Nhập mỗi câu trên một dòng, ví dụ: 2 + 3 = 5
                  </label>
                  <textarea
                    value={draftSettings.customQuestionsText}
                    onChange={(event) => updateDraftSetting('customQuestionsText', event.target.value)}
                    rows={5}
                    maxLength={3000}
                    placeholder={`2 + 3 = 5\n10 - 4 = 6\n3 × 4 = 12\n12 ÷ 3 = 4`}
                    className="w-full resize-y rounded-xl border-2 border-indigo-100 bg-white p-3 text-sm md:text-base font-bold text-gray-700 outline-none focus:border-indigo-400"
                    aria-label="Câu hỏi tự nhập"
                  />
                  <div className="mt-2 text-xs md:text-sm font-bold text-indigo-700">
                    Đã nhận: {draftCustomQuestions.length} câu hỏi hợp lệ
                  </div>
                </div>
              )}
            </div>

            {draftGeneratedLessonTypes.length > 0 && (
              <div className="rounded-xl border-2 border-amber-100 bg-amber-50 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm md:text-base font-extrabold text-amber-800">
                    <BookOpen size={18} className="text-amber-500" /> {draftTableLabel}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAllDraftTables(true)}
                      className="rounded-lg bg-white px-3 py-2 text-xs md:text-sm font-extrabold text-amber-700 border-2 border-amber-100 hover:border-amber-300 transition-colors"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllDraftTables(false)}
                      className="rounded-lg bg-white px-3 py-2 text-xs md:text-sm font-extrabold text-gray-600 border-2 border-amber-100 hover:border-amber-300 transition-colors"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {ALL_ADDITION_TABLES.map((table) => (
                    <label
                      key={table}
                      className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm md:text-base font-bold text-gray-700 border-2 border-amber-100"
                    >
                      <input
                        type="checkbox"
                        checked={draftSettings.selectedTables?.includes(table) || false}
                        onChange={() => toggleDraftTable(table)}
                        className="h-4 w-4 accent-amber-500"
                      />
                      {draftGeneratedLessonTypes.length === 1 ? `${draftTableLabel} ${table}` : `Bảng ${table}`}
                    </label>
                  ))}
                </div>

                <div className="mt-2 text-xs md:text-sm font-bold text-amber-700">
                  Đang chọn: {(draftSettings.selectedTables || []).length}/10 bảng cho {draftGeneratedLessonTypes.map(type => type.label).join(', ')}
                </div>
              </div>
            )}

            {draftGeneratedLessonTypes.length > 0 && (
              <div className="rounded-xl border-2 border-blue-100 bg-blue-50 p-3">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 border-2 border-blue-100">
                  <span className="min-w-0">
                    <span className="block text-sm md:text-base font-extrabold text-blue-800">Học theo chặng</span>
                    <span className="block text-[11px] md:text-xs font-bold text-blue-500">
                      {draftVisibleStagedStages.length} chặng • {draftStageQuestionIdSet.size} câu cố định
                    </span>
                  </span>
                  <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                    draftStagedLearningEnabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={draftStagedLearningEnabled}
                      onChange={(event) => {
                        setDraftStagedLearningEnabled(event.target.checked);
                        setSettingsError('');
                        setSettingsSaved(false);
                      }}
                      className="sr-only"
                    />
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      draftStagedLearningEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </span>
                </label>

                {draftStagedLearningEnabled && (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-col gap-2 rounded-xl bg-white px-3 py-2 border-2 border-blue-100 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs md:text-sm font-extrabold text-blue-700">Số lần đúng để qua câu</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDraftStagedRememberTarget(value => Math.max(MIN_STAGED_REMEMBER_TARGET, value - 1));
                            setSettingsError('');
                            setSettingsSaved(false);
                          }}
                          disabled={draftStagedRememberTarget <= MIN_STAGED_REMEMBER_TARGET}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-blue-100 bg-white text-blue-600 shadow-sm disabled:opacity-40"
                          aria-label="Giảm số lần đúng"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="min-w-12 rounded-lg bg-blue-50 px-2 py-1 text-center text-base font-black text-blue-700 shadow-sm">
                          {draftStagedRememberTarget}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDraftStagedRememberTarget(value => Math.min(MAX_STAGED_REMEMBER_TARGET, value + 1));
                            setSettingsError('');
                            setSettingsSaved(false);
                          }}
                          disabled={draftStagedRememberTarget >= MAX_STAGED_REMEMBER_TARGET}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-blue-100 bg-white text-blue-600 shadow-sm disabled:opacity-40"
                          aria-label="Tăng số lần đúng"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={addDraftStagedStage}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2 text-xs md:text-sm font-extrabold text-white shadow-[0_3px_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none transition-all"
                      >
                        <Plus size={16} /> Thêm chặng
                      </button>
                      <button
                        type="button"
                        onClick={resetDraftStagedStages}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs md:text-sm font-extrabold text-blue-700 border-2 border-blue-100 hover:border-blue-300 transition-colors"
                      >
                        <RotateCcw size={15} /> Chia mặc định
                      </button>
                    </div>

                    <div className="space-y-3">
                      {draftVisibleStagedStages.map((stage, stageIndex) => (
                        <div key={stage.id} className="rounded-xl border-2 border-blue-100 bg-white p-2.5">
                          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <input
                                type="text"
                                value={stage.name}
                                onChange={(event) => updateDraftStagedStageName(stage.id, event.target.value)}
                                placeholder={`Chặng ${stageIndex + 1}`}
                                className="min-w-0 flex-1 rounded-lg border-2 border-blue-100 bg-blue-50 px-3 py-2 text-sm md:text-base font-black text-blue-800 outline-none focus:border-blue-400"
                                aria-label={`Tên chặng ${stageIndex + 1}`}
                              />
                              <span className="shrink-0 rounded-lg bg-blue-50 px-2 py-1 text-xs md:text-sm font-black text-blue-700">
                                {stage.questionIds.length} câu
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDraftStagedStage(stage.id)}
                              disabled={draftVisibleStagedStages.length <= 1}
                              className="flex items-center justify-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-xs md:text-sm font-extrabold text-rose-600 border-2 border-rose-100 disabled:opacity-40"
                            >
                              <Minus size={15} /> Xóa
                            </button>
                          </div>

                          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                            {draftStageQuestionGroups.map(group => (
                              <div key={`${stage.id}-${group.id}`} className="rounded-lg bg-blue-50 p-2">
                                <div className="mb-1.5 text-xs md:text-sm font-extrabold text-blue-700">
                                  {group.label}
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                                  {group.questions.map(question => {
                                    const isSelected = stage.questionIds.includes(question.id);
                                    const isUsedElsewhere = draftStageQuestionIdSet.has(question.id) && !isSelected;
                                    const questionLabel = question.questionText.replace(/\s*=\s*\?$/, '');

                                    return (
                                      <button
                                        key={`${stage.id}-${question.id}`}
                                        type="button"
                                        onClick={() => toggleDraftStagedQuestion(stage.id, question.id)}
                                        title={isUsedElsewhere ? 'Chuyển câu này vào chặng này' : undefined}
                                        className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg border-2 px-2 py-1.5 text-center text-xs md:text-sm font-black transition-colors active:translate-y-0.5 ${
                                          isSelected
                                            ? 'border-blue-500 bg-blue-500 text-white shadow-[0_2px_0_rgb(29,78,216)]'
                                            : isUsedElsewhere
                                              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400 hover:bg-amber-100'
                                              : 'border-blue-100 bg-white text-blue-700 hover:border-blue-300 hover:bg-blue-50'
                                        }`}
                                      >
                                        <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
                                          isSelected
                                            ? 'border-white bg-white text-blue-500'
                                            : isUsedElsewhere
                                              ? 'border-amber-400 bg-white text-amber-500'
                                              : 'border-blue-200 bg-white text-transparent'
                                        }`}>
                                          {isSelected ? <CheckCircle size={12} /> : <Plus size={10} />}
                                        </span>
                                        <span>{questionLabel}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-3 text-base font-extrabold text-white shadow-[0_4px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none transition-all"
              >
                <Save size={19} /> Lưu cài đặt
              </button>
              <button
                type="button"
                onClick={closeAdminPanel}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-5 py-3 text-base font-extrabold text-gray-700 hover:bg-gray-200 transition-all"
              >
                <LogOut size={19} /> Đóng Admin
              </button>
            </div>

            {settingsSaved && (
              <div className="text-center text-sm md:text-base font-extrabold text-green-600">
                Đã lưu cài đặt
              </div>
            )}
            {settingsError && (
              <div className="text-center text-sm md:text-base font-extrabold text-red-500">
                {settingsError}
              </div>
            )}
          </form>
        </div>
      )}

      {/* HEADER */}
      {!isSummary && (
      <div className="w-full max-w-lg shrink-0 bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border-4 border-white mb-4">
        <div className="bg-blue-500 text-white text-center py-1.5 md:py-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, #fff 10%, transparent 10%)', backgroundSize: '20px 20px' }}></div>
          <div className="relative z-10 flex items-center justify-center gap-2 px-3">
            <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-white/20">
              {userAvatar ? (
                <img src={userAvatar} alt="Ảnh đại diện" className="h-full w-full object-cover" />
              ) : (
                <UserRound size={24} className="text-white" />
              )}
            </div>
            <h1 className="min-w-0 text-lg sm:text-2xl md:text-4xl font-extrabold leading-tight drop-shadow-md break-words">
              Xin chào {displayName}
            </h1>
          </div>
        </div>
        
        {/* STATS */}
        <div className="p-1.5 md:p-4 grid grid-cols-3 gap-1.5 md:gap-3 bg-white">
          <div className="flex flex-col items-center justify-center p-1 md:p-2 bg-green-100 rounded-xl md:rounded-2xl border-2 border-green-200">
            <div className="flex items-center gap-1 text-green-700 font-bold text-[11px] sm:text-xs md:text-base">
              <CheckCircle size={16} className="md:w-5 md:h-5" /> Đã đúng
            </div>
            <div className="text-lg sm:text-2xl md:text-3xl font-black text-green-600">{correctTotal}</div>
          </div>
          
          <div className="flex flex-col items-center justify-center p-1 md:p-2 bg-amber-100 rounded-xl md:rounded-2xl border-2 border-amber-200">
            <div className="flex items-center gap-1 text-amber-700 font-bold text-[11px] sm:text-xs md:text-base">
              <BookOpen size={16} className="md:w-5 md:h-5" /> Cần ôn
            </div>
            <div className="text-lg sm:text-2xl md:text-3xl font-black text-amber-600">{activeReviewList.length}</div>
          </div>

          <div className="flex flex-col items-center justify-center p-1 md:p-2 bg-blue-100 rounded-xl md:rounded-2xl border-2 border-blue-200">
            <div className="flex items-center gap-1 text-blue-700 font-bold text-[11px] sm:text-xs md:text-base">
              <Star size={16} className="md:w-5 md:h-5" /> Chưa làm
            </div>
            <div className="text-lg sm:text-2xl md:text-3xl font-black text-blue-600">{activeUnseenList.length}</div>
          </div>
          
          <div className="relative col-span-2 flex flex-col items-center justify-center p-1.5 md:p-2 bg-purple-100 rounded-xl md:rounded-2xl border-2 border-purple-200">
            {!isSummary && isStagedLearningActive && gameState !== 'idle' && (
              <div className="absolute right-2 top-1 text-[9px] font-semibold text-gray-400 md:right-3 md:top-2 md:text-[11px]">
                {stageLabel}
              </div>
            )}
            <div className="flex items-center gap-1 md:gap-2 text-purple-700 font-bold text-sm md:text-lg">
              <Smartphone size={20} className="md:w-6 md:h-6 animate-pulse" /> Giờ xem điện thoại
            </div>
            <div className="text-lg md:text-3xl font-black text-purple-600 text-center">
              {formatTime(screenTime)} <span className="text-lg md:text-xl text-purple-400">/ 90p</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-1.5 md:p-2 bg-yellow-100 rounded-xl md:rounded-2xl border-2 border-yellow-200">
            <div className="flex items-center gap-1 text-yellow-700 font-bold text-[11px] sm:text-xs md:text-base">
              <Gem size={16} className="md:w-5 md:h-5" /> Robux
            </div>
            <div className="text-lg sm:text-2xl md:text-3xl font-black text-yellow-600">{robuxBalance}</div>
          </div>
        </div>
      </div>
      )}

      {/* MAIN GAME AREA */}
      <div className={`w-full max-w-lg bg-white rounded-2xl md:rounded-3xl shadow-xl border-4 border-white relative flex flex-col justify-center ${
        isSummary
          ? 'p-2 md:p-4'
          : `${isFeedbackPaused ? 'min-h-[300px]' : 'min-h-[240px]'} md:min-h-[390px] p-2.5 md:p-6`
      }`}>
        {stageNotice && (
          <div className="absolute left-1/2 top-10 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-green-200 bg-white px-4 py-1.5 text-sm font-black text-green-600 shadow-lg animate-bounce-in md:top-14 md:text-lg">
            {stageNotice}
          </div>
        )}
        
        {gameState === 'idle' ? (
          <div className="text-center">
            <div className="text-5xl md:text-8xl mb-2 md:mb-6">🚀</div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-700 mb-3 md:mb-8">Bé đã sẵn sàng chưa?</h2>
            <div className="grid gap-2 md:gap-3">
              <button
                onClick={() => startPracticeSession(rewardMode)}
                className="bg-green-500 hover:bg-green-600 active:transform active:scale-95 text-white text-xl md:text-3xl font-extrabold py-3 px-8 md:py-5 md:px-10 rounded-full shadow-[0_5px_0_rgb(21,128,61)] md:shadow-[0_8px_0_rgb(21,128,61)] transition-all flex items-center justify-center mx-auto gap-2 md:gap-3 w-full"
              >
                <Play fill="white" className="w-6 h-6 md:w-8 md:h-8" /> BẮT ĐẦU
              </button>
              <button
                type="button"
                onClick={toggleRobuxMode}
                className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-2.5 text-base font-extrabold transition-all active:translate-y-1 active:shadow-none md:text-2xl ${
                  rewardMode === 'robux'
                    ? 'bg-yellow-400 text-yellow-950 shadow-[0_4px_0_rgb(202,138,4)]'
                    : 'bg-yellow-50 text-yellow-700 shadow-[0_4px_0_rgb(250,204,21)]'
                }`}
              >
                <Gem size={21} className="fill-yellow-100 text-yellow-700 md:h-6 md:w-6" />
                {rewardMode === 'robux' ? 'Tắt Robux' : 'Kiếm Robux'}
              </button>
              {activeReviewList.length > 0 && (
                <button
                  type="button"
                  onClick={handleReviewPractice}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-2.5 text-base md:text-2xl font-extrabold text-white shadow-[0_4px_0_rgb(180,83,9)] active:translate-y-1 active:shadow-none transition-all"
                >
                  <BookOpen size={21} className="md:w-6 md:h-6" />
                  Ôn câu sai
                </button>
              )}
            </div>
          </div>
        ) : gameState === 'congrats' ? (
          <div className="text-center animate-bounce-in">
            <div className="text-6xl md:text-8xl mb-4 md:mb-6">🎉🏆🎉</div>
            <h2 className="text-2xl md:text-3xl font-black text-green-500 mb-3 md:mb-4 uppercase drop-shadow-sm">
              Chúc mừng bé!
            </h2>
            <p className="text-base md:text-xl font-bold text-gray-600 mb-6 md:mb-8">
              Bé đã hoàn thành bài {currentLessonLabel.toLowerCase()} và không còn câu nào cần ôn nữa! Tuyệt vời quá!
            </p>
            <button 
              onClick={generateQuestion}
              className="bg-blue-500 hover:bg-blue-600 active:transform active:scale-95 text-white text-xl md:text-2xl font-bold py-3 px-6 md:py-4 md:px-8 rounded-full shadow-[0_4px_0_rgb(29,78,216)] md:shadow-[0_6px_0_rgb(29,78,216)] transition-all mx-auto"
            >
              Chơi tiếp kiếm điểm 📱
            </button>
          </div>
        ) : gameState === 'summary' ? (
          <div className="text-center animate-bounce-in">
            <div className="rounded-2xl bg-white px-1.5 py-1.5 md:p-3">
              <BarChart className="w-10 h-10 md:w-14 md:h-14 text-blue-500 mx-auto mb-1 md:mb-2" />
              <h2 className="text-2xl md:text-4xl font-black text-blue-700 mb-2 md:mb-4 uppercase leading-tight">Tổng Kết Kết Quả</h2>

              <div className="mb-2 md:mb-4 flex items-center justify-center gap-3 rounded-xl border-2 border-blue-100 bg-blue-50 px-3 py-2 md:px-4 md:py-3">
                <div className="flex h-11 w-11 md:h-14 md:w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-blue-200">
                  {visibleSummary.studentAvatar ? (
                    <img src={visibleSummary.studentAvatar} alt="Ảnh đại diện" className="h-full w-full object-cover" />
                  ) : (
                    <UserRound size={26} className="text-blue-600" />
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-sm md:text-base font-bold text-blue-500">Tên bé</div>
                  <div className="truncate text-xl md:text-3xl font-black text-blue-800">{visibleSummary.studentName}</div>
                </div>
              </div>

              {visibleSummary.endSessionNotice && (
                <div className={`mb-2 rounded-xl border-2 px-3 py-2 text-center text-xs font-black md:mb-3 md:text-base ${
                  visibleSummary.endSessionPenaltyApplied
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                }`}>
                  {visibleSummary.endSessionNotice}
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5 md:gap-3 text-left">
                <div className="rounded-xl border-2 border-green-100 bg-green-50 px-3 py-2 md:p-3">
                  <div className="flex items-center gap-1.5 text-sm md:text-lg font-extrabold text-gray-700">
                    <CheckCircle size={18} className="md:w-6 md:h-6 text-green-500"/> Câu đúng
                  </div>
                  <div className="text-right text-3xl md:text-5xl font-black text-green-600 leading-none">{visibleSummary.correctTotal}</div>
                </div>

                <div className="rounded-xl border-2 border-red-100 bg-red-50 px-3 py-2 md:p-3">
                  <div className="flex items-center gap-1.5 text-sm md:text-lg font-extrabold text-gray-700">
                    <XCircle size={18} className="md:w-6 md:h-6 text-red-500"/> Câu sai
                  </div>
                  <div className="text-right text-3xl md:text-5xl font-black text-red-600 leading-none">{visibleSummary.wrongTotal}</div>
                </div>

                <div className="rounded-xl border-2 border-orange-100 bg-orange-50 px-3 py-2 md:p-3">
                  <div className="flex items-center gap-1.5 text-sm md:text-lg font-extrabold text-gray-700">
                    <Clock size={18} className="md:w-6 md:h-6 text-orange-500"/> Hết giờ
                  </div>
                  <div className="text-right text-3xl md:text-5xl font-black text-orange-600 leading-none">{visibleSummary.timeoutTotal}</div>
                </div>

                <div className="rounded-xl border-2 border-amber-100 bg-amber-50 px-3 py-2 md:p-3">
                  <div className="flex items-center gap-1.5 text-sm md:text-lg font-extrabold text-gray-700">
                    <BookOpen size={18} className="md:w-6 md:h-6 text-amber-500"/> Cần ôn
                  </div>
                  <div className="text-right text-3xl md:text-5xl font-black text-amber-600 leading-none">{visibleSummary.reviewCount}</div>
                </div>

                <div className="rounded-xl border-2 border-purple-100 bg-purple-50 px-3 py-2 md:p-3">
                  <div className="flex items-center gap-1.5 text-sm md:text-lg font-extrabold text-gray-700">
                    <Smartphone size={18} className="md:w-6 md:h-6 text-purple-500"/> Giờ xem điện thoại
                  </div>
                  <div className="text-right text-2xl md:text-3xl font-black text-purple-600 leading-tight">{formatTime(visibleSummary.screenTime)}</div>
                </div>

                <div className="rounded-xl border-2 border-yellow-100 bg-yellow-50 px-3 py-2 md:p-3">
                  <div className="flex items-center gap-1.5 text-sm md:text-lg font-extrabold text-gray-700">
                    <Gem size={18} className="md:w-6 md:h-6 text-yellow-500"/> Robux
                  </div>
                  <div className="text-right text-2xl md:text-3xl font-black text-yellow-600 leading-tight">{visibleSummary.robuxBalance}</div>
                </div>

                <div className="rounded-xl border-2 border-sky-100 bg-sky-50 px-3 py-2 md:p-3">
                  <div className="flex items-center gap-1.5 text-sm md:text-lg font-extrabold text-gray-700">
                    <Clock size={18} className="md:w-6 md:h-6 text-sky-500"/> Hoàn thành
                  </div>
                  <div className="text-right text-2xl md:text-3xl font-black text-sky-600 leading-tight">{formatDuration(visibleSummary.durationSec)}</div>
                </div>

                <div className="col-span-2 rounded-xl border-2 border-rose-100 bg-rose-50 px-3 py-2 md:p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex shrink-0 items-center gap-1.5 text-sm md:text-lg font-extrabold text-gray-700">
                      <StopCircle size={18} className="md:w-6 md:h-6 text-rose-500"/> Kết thúc lúc
                    </div>
                    <div className="min-w-0 text-right text-sm md:text-lg font-black text-rose-600 leading-tight">{formatDateTime(visibleSummary.endedAt)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2.5 md:mt-4 grid gap-2 md:gap-3">
              <button
                type="button"
                onClick={handleContinueLearning}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-green-500 px-5 py-2.5 md:px-6 md:py-3.5 text-lg md:text-3xl font-extrabold text-white shadow-[0_4px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none transition-all"
              >
                <Play fill="white" size={22} className="md:w-6 md:h-6" />
                Tiếp tục học
              </button>
              <div className={`grid gap-2 ${visibleSummary.reviewCount > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {visibleSummary.reviewCount > 0 && (
                  <button
                    type="button"
                    onClick={handleReviewPractice}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-amber-500 px-2 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_0_rgb(180,83,9)] transition-all active:translate-y-1 active:shadow-none md:px-3 md:py-3.5 md:text-2xl"
                  >
                    <BookOpen size={18} className="shrink-0 md:w-6 md:h-6" />
                    <span className="truncate">Ôn câu sai</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGoHomeFromSummary}
                  className="flex items-center justify-center gap-1.5 rounded-full bg-slate-500 px-2 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_0_rgb(71,85,105)] transition-all active:translate-y-1 active:shadow-none md:px-3 md:py-3.5 md:text-2xl"
                >
                  <Home size={18} className="shrink-0 md:w-6 md:h-6" />
                  <span className="truncate">Trang chủ</span>
                </button>
                <button
                  type="button"
                  onClick={handleRestartLearning}
                  className="flex w-full items-center justify-center rounded-full bg-blue-500 px-2 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_rgb(29,78,216)] transition-all active:translate-y-1 active:shadow-none hover:bg-blue-600 md:px-3 md:py-3.5 md:text-2xl md:shadow-[0_6px_0_rgb(29,78,216)]"
                >
                  <span className="truncate">Học lại</span>
                </button>
              </div>
            </div>
          </div>
        ) : isFlashcardMode && gameState === 'playing' ? (
          <div className="flex min-h-[270px] flex-col justify-center text-center md:min-h-[390px]">
            <div className="mb-2 flex justify-center md:mb-4">
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700 md:text-base">
                <BookOpen size={16} className="md:h-5 md:w-5" />
                Flashcard
              </div>
            </div>

            <div className="rounded-2xl border-2 border-blue-100 bg-blue-50 px-3 py-5 shadow-inner md:px-6 md:py-8">
              <div className={`font-black text-blue-900 drop-shadow-sm leading-tight ${
                currentQ?.lessonType === 'custom'
                  ? 'text-3xl sm:text-4xl md:text-6xl'
                  : 'text-5xl sm:text-6xl md:text-8xl'
              }`}>
                {currentQ?.questionText}
              </div>
            </div>

            <div className="mt-3 flex min-h-[120px] flex-col justify-center md:mt-5 md:min-h-[150px]">
              {showFlashcardAnswer ? (
                <div className="grid gap-2 md:gap-3">
                  <div className="rounded-2xl border-2 border-green-100 bg-green-50 px-3 py-3 md:px-6 md:py-5">
                    <div className="text-xs font-extrabold text-green-600 md:text-base">Đáp án</div>
                    <div className="text-3xl font-black leading-tight text-green-600 md:text-5xl">
                      {currentQ?.answerText}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <button
                      type="button"
                      onClick={handleFlashcardRemembered}
                      className="flex items-center justify-center gap-1.5 rounded-2xl bg-green-500 px-3 py-3 text-base font-extrabold text-white shadow-[0_4px_0_rgb(21,128,61)] transition-all active:translate-y-1 active:shadow-none md:text-2xl"
                    >
                      <CheckCircle size={20} className="md:h-6 md:w-6" />
                      Đã nhớ
                    </button>
                    <button
                      type="button"
                      onClick={handleFlashcardNeedsReview}
                      className="flex items-center justify-center gap-1.5 rounded-2xl bg-amber-500 px-3 py-3 text-base font-extrabold text-white shadow-[0_4px_0_rgb(180,83,9)] transition-all active:translate-y-1 active:shadow-none md:text-2xl"
                    >
                      <BookOpen size={20} className="md:h-6 md:w-6" />
                      Cần ôn
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowFlashcardAnswer(true)}
                  className="mx-auto flex w-full items-center justify-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-xl font-extrabold text-white shadow-[0_5px_0_rgb(29,78,216)] transition-all active:translate-y-1 active:shadow-none md:py-5 md:text-3xl"
                >
                  <Star size={24} className="fill-yellow-300 text-yellow-300 md:h-8 md:w-8" />
                  Xem đáp án
                </button>
              )}
            </div>

            <div className="mt-3 border-t-2 border-gray-100 pt-2.5 md:mt-5 md:pt-5">
              <button
                type="button"
                onClick={handleEndSession}
                className="mx-auto flex items-center gap-2 text-white bg-rose-500 hover:bg-rose-600 shadow-[0_3px_0_rgb(190,18,60)] md:shadow-[0_5px_0_rgb(190,18,60)] active:translate-y-1 active:shadow-none font-extrabold text-sm md:text-lg transition-all py-2 px-4 md:py-3 md:px-8 rounded-full"
              >
                <StopCircle size={22} className="md:w-6 md:h-6" /> Kết thúc phiên học
              </button>
            </div>
          </div>
        ) : (
          <>
            {rewardMode === 'robux' && (
              <div className="absolute left-3 top-2 z-10 flex items-center gap-1 rounded-full border-2 border-yellow-100 bg-yellow-50 px-2 py-0.5 text-[11px] font-black text-yellow-700 shadow-sm md:left-4 md:top-3 md:text-sm">
                <Gem size={13} className="fill-yellow-100 md:h-4 md:w-4" />
                Kiếm Robux
              </div>
            )}
            <div className="absolute top-2 right-3 md:top-3 md:right-4 z-10 flex items-center gap-1 text-[11px] md:text-sm font-semibold text-gray-400">
              <Clock size={13} className="md:w-4 md:h-4 text-gray-300" />
              <span>{timer} giây</span>
            </div>

            {/* QUESTION */}
            <div className="text-center my-2 md:my-6 pt-1 md:pt-2">
              <div className="flex h-9 md:h-12 items-center justify-center">
                {isCelebrating && (
                  <div className="inline-flex max-w-full items-center justify-center gap-1.5 md:gap-2 rounded-full border-2 border-green-200 bg-white px-3 py-1.5 md:px-5 md:py-2 text-sm md:text-xl font-black text-green-600 shadow-sm animate-bounce-in">
                    <Star size={18} className="shrink-0 fill-yellow-300 text-yellow-400 md:w-6 md:h-6" />
                    <span className="whitespace-nowrap">
                      {rewardMode === 'robux'
                        ? `+${settings.robuxReward} Robux`
                        : `+ ${formatTime(settings.rewardSec)} xem điện thoại`}
                    </span>
                  </div>
                )}
              </div>
              <div className={`font-black text-blue-900 drop-shadow-sm leading-tight ${
                currentQ?.lessonType === 'custom'
                  ? 'text-3xl sm:text-4xl md:text-6xl'
                  : 'text-4xl sm:text-6xl md:text-8xl'
              }`}>
                {currentQ?.questionText}
              </div>
            </div>

            {/* ANSWERS GRID */}
            <div className="grid grid-cols-2 gap-2.5 md:gap-4 mt-2 md:mt-8">
              {currentQ?.options.map((opt, idx) => {
                let btnColor = "bg-sky-400 hover:bg-sky-500 shadow-[0_6px_0_rgb(2,132,199)] md:shadow-[0_8px_0_rgb(2,132,199)]";
                let textColor = "text-white";
                
                // Trạng thái khi đã chọn hoặc hết giờ
                if (isFeedbackPaused) {
                  if (opt === currentQ.ans) {
                    btnColor = "bg-green-500 shadow-[0_6px_0_rgb(21,128,61)] md:shadow-[0_8px_0_rgb(21,128,61)] animate-pulse";
                  } else if (opt === selectedAns) {
                    btnColor = "bg-red-500 shadow-[0_6px_0_rgb(185,28,28)] md:shadow-[0_8px_0_rgb(185,28,28)] opacity-60";
                  } else {
                    btnColor = "bg-gray-300 shadow-[0_6px_0_rgb(156,163,175)] md:shadow-[0_8px_0_rgb(156,163,175)] opacity-50";
                  }
                } else if (isCelebrating) {
                  if (opt === currentQ.ans) {
                    btnColor = "bg-green-400 shadow-[0_6px_0_rgb(22,163,74)] md:shadow-[0_8px_0_rgb(22,163,74)] transform scale-105";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isFeedbackPaused}
                    onClick={() => handleAnswerClick(opt)}
                    className={`${btnColor} ${textColor} text-3xl md:text-5xl font-black py-3.5 md:py-8 rounded-2xl md:rounded-3xl transition-all active:translate-y-2 active:shadow-[0_0px_0_rgb(2,132,199)] flex justify-center items-center`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* PHẢN HỒI KHI SAI / HẾT GIỜ */}
            {isFeedbackPaused && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center overflow-hidden rounded-2xl md:rounded-3xl p-2.5 md:p-6 text-center border-4 md:border-8 border-red-100">
                <div className="flex min-h-0 w-full flex-col items-center justify-center gap-2 md:gap-4">
                  <h3 className="flex items-center justify-center gap-2 text-xl md:text-3xl font-black text-red-600 leading-tight">
                    <XCircle size={22} className="md:w-8 md:h-8 shrink-0" />
                    {gameState === 'timeout_paused' ? 'Hết giờ mất rồi!' : 'Chưa đúng rồi nhé!'}
                  </h3>
                  <div className="w-full rounded-xl md:rounded-2xl bg-gray-100 px-3 py-2 md:px-8 md:py-4">
                    <div className="text-sm md:text-2xl font-bold text-gray-600">Đáp án đúng:</div>
                    <div className="mt-0.5 text-3xl sm:text-4xl md:text-6xl font-black text-green-500 leading-tight">
                      {currentQ?.answerText}
                    </div>
                  </div>
                  <div className="text-red-500 font-bold text-sm md:text-lg">
                    {rewardMode === 'robux'
                      ? `- ${ROBUX_WRONG_PENALTY} Robux`
                      : `- ${formatTime(settings.penaltySec)} xem điện thoại 😢`}
                  </div>
                  <div className="flex w-full flex-col gap-2 md:gap-3">
                    <button
                      onClick={generateQuestion}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-lg md:text-3xl font-extrabold py-2.5 px-6 md:py-4 md:px-12 rounded-full shadow-[0_4px_0_rgb(29,78,216)] md:shadow-[0_8px_0_rgb(29,78,216)] active:translate-y-2 active:shadow-none transition-all w-full"
                    >
                      Tiếp tục nhé!
                    </button>
                    <button
                      onClick={handleEndSession}
                      className="flex items-center justify-center gap-2 md:gap-3 text-white bg-rose-500 hover:bg-rose-600 shadow-[0_3px_0_rgb(190,18,60)] md:shadow-[0_5px_0_rgb(190,18,60)] active:translate-y-1 active:shadow-none font-extrabold text-base md:text-lg transition-all py-2 px-4 md:py-3 md:px-8 rounded-full w-full"
                    >
                      <StopCircle size={20} className="md:w-6 md:h-6" /> Kết thúc phiên học
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* NÚT KẾT THÚC BUỔI HỌC */}
            {!isFeedbackPaused && (
              <div className="mt-3 md:mt-8 pt-2.5 md:pt-5 border-t-2 border-gray-100 flex justify-center">
                <button
                  onClick={handleEndSession}
                  className="flex items-center gap-2 md:gap-3 text-white bg-rose-500 hover:bg-rose-600 shadow-[0_3px_0_rgb(190,18,60)] md:shadow-[0_5px_0_rgb(190,18,60)] active:translate-y-1 active:shadow-none font-extrabold text-sm md:text-lg transition-all py-2 px-4 md:py-3 md:px-8 rounded-full"
                >
                  <StopCircle size={22} className="md:w-6 md:h-6" /> Kết thúc phiên học
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* NÚT RESET ẨN BÊN DƯỚI DÀNH CHO PHỤ HUYNH */}
      {!isSummary && (
      <div className="mt-2 md:mt-6">
         {!showParentConfirm ? (
           <button 
              onClick={() => setShowParentConfirm(true)}
              className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-xs md:text-sm font-medium transition-colors"
           >
             <RotateCcw size={14} className="md:w-4 md:h-4" /> Làm lại từ đầu (Dành cho Ba Mẹ)
           </button>
         ) : (
           <div className="bg-red-50 border border-red-200 rounded-lg p-2 md:p-3 flex flex-col items-center">
             <div className="text-red-600 text-xs md:text-sm font-bold flex items-center gap-1 md:gap-2 mb-2 text-center">
               <AlertTriangle size={14} className="md:w-4 md:h-4" /> Phụ huynh chắc chắn xóa sạch dữ liệu?
             </div>
             <div className="flex gap-3 md:gap-4">
                <button onClick={resetAllData} className="bg-red-500 hover:bg-red-600 text-white text-xs md:text-sm font-bold py-1 px-3 md:px-4 rounded">Xóa</button>
                <button onClick={() => setShowParentConfirm(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs md:text-sm font-bold py-1 px-3 md:px-4 rounded">Hủy</button>
             </div>
           </div>
         )}
      </div>
      )}

      {!isSummary && showColoringAccessPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 text-center">
          <div className="w-full max-w-sm rounded-2xl border-4 border-white bg-white p-5 shadow-2xl">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-600">
              <LockKeyhole size={30} />
            </div>
            <h2 className="text-xl font-black text-slate-800">Tô màu đang khóa</h2>
            <p className="mt-2 text-sm font-bold text-slate-500">
              Đổi {coloringTimeExchangeCost} Robux cho mỗi phút sử dụng tô màu.
            </p>
            {coloringTimeLeftSec > 0 && (
              <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
                Còn lại: {formatClockTime(coloringTimeLeftSec)}
              </div>
            )}
            <div className="mt-4 rounded-2xl border-2 border-yellow-100 bg-yellow-50 p-3">
              <div className="mb-2 text-xs font-black uppercase text-yellow-700">Chọn thời gian mua</div>
              <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
                <button
                  type="button"
                  onClick={() => setColoringPurchaseMinutes(
                    clampNumber(
                      safeColoringPurchaseMinutes - COLORING_PURCHASE_STEP_MINUTES,
                      minColoringPurchaseMinutes,
                      minColoringPurchaseMinutes,
                      maxSelectableColoringMinutes
                    )
                  )}
                  disabled={safeColoringPurchaseMinutes <= minColoringPurchaseMinutes}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white text-yellow-700 shadow-sm transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:shadow-none"
                  aria-label="Giảm thời gian tô màu muốn mua"
                >
                  <Minus size={20} />
                </button>
                <div className="rounded-xl bg-white px-3 py-2">
                  <div className="text-3xl font-black leading-none text-yellow-700">
                    {safeColoringPurchaseMinutes}
                  </div>
                  <div className="text-xs font-black text-yellow-500">phút</div>
                </div>
                <button
                  type="button"
                  onClick={() => setColoringPurchaseMinutes(
                    clampNumber(
                      safeColoringPurchaseMinutes + COLORING_PURCHASE_STEP_MINUTES,
                      minColoringPurchaseMinutes,
                      minColoringPurchaseMinutes,
                      maxSelectableColoringMinutes
                    )
                  )}
                  disabled={safeColoringPurchaseMinutes >= maxSelectableColoringMinutes}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white text-yellow-700 shadow-sm transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:shadow-none"
                  aria-label="Tăng thời gian tô màu muốn mua"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="mt-2 text-sm font-black text-yellow-800">
                Cần: {coloringPurchaseCost} Robux
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-yellow-50 px-3 py-2 text-sm font-black text-yellow-700">
              Robux hiện có: {robuxBalance}
            </div>
            <button
              type="button"
              onClick={handleBuyColoringTime}
              disabled={!canBuySelectedColoringTime}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 px-5 py-3 text-base font-black text-yellow-950 shadow-[0_4px_0_rgb(202,138,4)] transition active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              <Gem size={19} className="fill-yellow-100" />
              Đổi {coloringPurchaseCost} Robux lấy {safeColoringPurchaseMinutes} phút
            </button>
            {!canBuySelectedColoringTime && (
              <div className="mt-2 text-xs font-bold text-rose-500">
                Bé cần kiếm thêm Robux để mở mục tô màu.
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowColoringAccessPanel(false)}
              className="mt-3 w-full rounded-full bg-slate-100 px-5 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-200"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {!isSummary && showDrawingAccessPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 text-center">
          <div className="w-full max-w-sm rounded-2xl border-4 border-white bg-white p-5 shadow-2xl">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-pink-100 text-pink-600">
              <LockKeyhole size={30} />
            </div>
            <h2 className="text-xl font-black text-slate-800">Học vẽ đang khóa</h2>
            <p className="mt-2 text-sm font-bold text-slate-500">
              Đổi {drawingTimeExchangeCost} Robux cho mỗi phút học vẽ.
            </p>
            {drawingTimeLeftSec > 0 && (
              <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
                Còn lại: {formatClockTime(drawingTimeLeftSec)}
              </div>
            )}
            <div className="mt-4 rounded-2xl border-2 border-yellow-100 bg-yellow-50 p-3">
              <div className="mb-2 text-xs font-black uppercase text-yellow-700">Chọn thời gian mua</div>
              <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDrawingPurchaseMinutes(
                    clampNumber(safeDrawingPurchaseMinutes - COLORING_PURCHASE_STEP_MINUTES, minDrawingPurchaseMinutes, minDrawingPurchaseMinutes, maxSelectableDrawingMinutes)
                  )}
                  disabled={safeDrawingPurchaseMinutes <= minDrawingPurchaseMinutes}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white text-yellow-700 shadow-sm transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:shadow-none"
                  aria-label="Giảm thời gian học vẽ muốn mua"
                >
                  <Minus size={20} />
                </button>
                <div className="rounded-xl bg-white px-3 py-2">
                  <div className="text-3xl font-black leading-none text-yellow-700">
                    {safeDrawingPurchaseMinutes}
                  </div>
                  <div className="text-xs font-black text-yellow-500">phút</div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawingPurchaseMinutes(
                    clampNumber(safeDrawingPurchaseMinutes + COLORING_PURCHASE_STEP_MINUTES, minDrawingPurchaseMinutes, minDrawingPurchaseMinutes, maxSelectableDrawingMinutes)
                  )}
                  disabled={safeDrawingPurchaseMinutes >= maxSelectableDrawingMinutes}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white text-yellow-700 shadow-sm transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:shadow-none"
                  aria-label="Tăng thời gian học vẽ muốn mua"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="mt-2 text-sm font-black text-yellow-800">
                Cần: {drawingPurchaseCost} Robux
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-yellow-50 px-3 py-2 text-sm font-black text-yellow-700">
              Robux hiện có: {robuxBalance}
            </div>
            <button
              type="button"
              onClick={handleBuyDrawingTime}
              disabled={!canBuySelectedDrawingTime}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 px-5 py-3 text-base font-black text-yellow-950 shadow-[0_4px_0_rgb(202,138,4)] transition active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              <Gem size={19} className="fill-yellow-100" />
              Đổi {drawingPurchaseCost} Robux lấy {safeDrawingPurchaseMinutes} phút
            </button>
            {!canBuySelectedDrawingTime && (
              <div className="mt-2 text-xs font-bold text-rose-500">
                Bé cần kiếm thêm Robux để mở mục học vẽ.
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowDrawingAccessPanel(false)}
              className="mt-3 w-full rounded-full bg-slate-100 px-5 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-200"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {!isSummary && showGameAccessPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 text-center">
          <div className="w-full max-w-sm rounded-2xl border-4 border-white bg-white p-5 shadow-2xl">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-orange-100 text-orange-600">
              <Gamepad2 size={30} />
            </div>
            <h2 className="text-xl font-black text-slate-800">Game đang khóa</h2>
            <p className="mt-2 text-sm font-bold text-slate-500">
              Đổi {gameTimeExchangeCost} Robux cho mỗi phút chơi game.
            </p>
            {gameTimeLeftSec > 0 && (
              <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
                Còn lại: {formatClockTime(gameTimeLeftSec)}
              </div>
            )}
            <div className="mt-4 rounded-2xl border-2 border-yellow-100 bg-yellow-50 p-3">
              <div className="mb-2 text-xs font-black uppercase text-yellow-700">Chọn thời gian mua</div>
              <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGamePurchaseMinutes(
                    clampNumber(safeGamePurchaseMinutes - COLORING_PURCHASE_STEP_MINUTES, minGamePurchaseMinutes, minGamePurchaseMinutes, maxSelectableGameMinutes)
                  )}
                  disabled={safeGamePurchaseMinutes <= minGamePurchaseMinutes}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white text-yellow-700 shadow-sm transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:shadow-none"
                  aria-label="Giảm thời gian chơi game muốn mua"
                >
                  <Minus size={20} />
                </button>
                <div className="rounded-xl bg-white px-3 py-2">
                  <div className="text-3xl font-black leading-none text-yellow-700">
                    {safeGamePurchaseMinutes}
                  </div>
                  <div className="text-xs font-black text-yellow-500">phút</div>
                </div>
                <button
                  type="button"
                  onClick={() => setGamePurchaseMinutes(
                    clampNumber(safeGamePurchaseMinutes + COLORING_PURCHASE_STEP_MINUTES, minGamePurchaseMinutes, minGamePurchaseMinutes, maxSelectableGameMinutes)
                  )}
                  disabled={safeGamePurchaseMinutes >= maxSelectableGameMinutes}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white text-yellow-700 shadow-sm transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:shadow-none"
                  aria-label="Tăng thời gian chơi game muốn mua"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="mt-2 text-sm font-black text-yellow-800">
                Cần: {gamePurchaseCost} Robux
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-yellow-50 px-3 py-2 text-sm font-black text-yellow-700">
              Robux hiện có: {robuxBalance}
            </div>
            <button
              type="button"
              onClick={handleBuyGameTime}
              disabled={!canBuySelectedGameTime}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 px-5 py-3 text-base font-black text-yellow-950 shadow-[0_4px_0_rgb(202,138,4)] transition active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              <Gem size={19} className="fill-yellow-100" />
              Đổi {gamePurchaseCost} Robux lấy {safeGamePurchaseMinutes} phút
            </button>
            {!canBuySelectedGameTime && (
              <div className="mt-2 text-xs font-bold text-rose-500">
                Bé cần kiếm thêm Robux để mở khu vui chơi.
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowGameAccessPanel(false)}
              className="mt-3 w-full rounded-full bg-slate-100 px-5 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-200"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {!isSummary && showColoringPanel && (
        <ColoringApp
          onBack={() => setShowColoringPanel(false)}
          robuxBalance={robuxBalance}
          unlockCost={settings.coloringUnlockCost}
          coloringTimeLeftSec={coloringTimeLeftSec}
          unlimitedTime={coloringTimeExchangeCost <= 0}
          unlockedLevels={unlockedColoringLevels}
          onUnlockLevel={handleUnlockColoringLevel}
        />
      )}

      {!isSummary && showDrawingPanel && (
        <DrawingApp
          onBack={() => setShowDrawingPanel(false)}
          robuxBalance={robuxBalance}
          drawingTimeLeftSec={drawingTimeLeftSec}
          unlimitedTime={drawingTimeExchangeCost <= 0}
        />
      )}

      {!isSummary && showGamesPanel && (
        <GamesApp
          onBack={() => setShowGamesPanel(false)}
          timeLeftSec={gameTimeLeftSec}
          unlimitedTime={gameTimeExchangeCost <= 0}
        />
      )}

      {!isSummary && showAlbumPanel && (
        <AlbumApp onBack={() => setShowAlbumPanel(false)} />
      )}

      {!isSummary && showReadingPanel && (
        <div className="fixed inset-0 z-50 bg-white">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tập đọc"
            className="flex h-full w-full flex-col bg-white"
          >
            <div className={`flex shrink-0 items-center justify-between gap-1.5 border-b px-2.5 py-0.5 md:px-6 md:py-1.5 ${
              selectedReading && selectedReadingCompleted && !readingSummary
                ? 'border-emerald-800 bg-emerald-900 text-white'
                : 'border-emerald-100 bg-white'
            }`}>
              <div className={`flex min-w-0 items-center gap-1.5 text-lg font-semibold md:text-3xl ${
                selectedReading && selectedReadingCompleted && !readingSummary ? 'text-white' : 'text-emerald-800'
              }`}>
                <BookOpen size={20} className={`shrink-0 md:h-8 md:w-8 ${
                  selectedReading && selectedReadingCompleted && !readingSummary ? 'text-emerald-100' : 'text-emerald-500'
                }`} />
                <span className="truncate">
                  {readingSummary
                    ? 'Tổng kết tập đọc'
                    : selectedReading
                      ? selectedReading.title
                      : 'Tập đọc'}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {selectedReading && !readingSummary && (
                  <button
                    type="button"
                    onClick={() => {
                      rememberCurrentReadingPosition();
                      setSelectedReadingId(null);
                      setExpandedReadingSeriesId(selectedReadingSeriesMeta?.seriesId || null);
                    }}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors md:px-4 md:text-base ${
                      selectedReading && selectedReadingCompleted
                        ? 'bg-white/15 text-white hover:bg-white/25'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Trở lại
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    rememberCurrentReadingPosition();
                    setReadingSummary(null);
                    readingSessionStartedAtRef.current = null;
                    setShowReadingPanel(false);
                    setSelectedReadingId(null);
                    setExpandedReadingSeriesId(null);
                  }}
                  aria-label="Đóng tập đọc"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors md:h-10 md:w-10 ${
                    selectedReading && selectedReadingCompleted
                      ? 'bg-white/15 text-white hover:bg-white/25'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  }`}
                >
                  <XCircle size={18} />
                </button>
              </div>
            </div>

            {readingSummary ? (
              <div className="flex min-h-0 flex-1 flex-col bg-emerald-50/70 px-3 py-2 md:px-8 md:py-3">
                <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border-[3px] border-emerald-100/80 bg-white p-3 md:p-5">
                  <div className="text-center">
                    <BarChart size={30} className="mx-auto text-blue-500 md:h-10 md:w-10" />
                    <h2 className="mt-1 text-xl font-black text-blue-700 md:text-3xl">TỔNG KẾT KẾT QUẢ</h2>
                    <div className="text-sm font-extrabold text-emerald-700 md:text-base">Tổng kết tập đọc</div>
                  </div>

                  <div className="mt-2 flex items-center justify-center gap-3 rounded-xl border-2 border-blue-100 bg-blue-50 px-3 py-2">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-blue-100">
                      {readingSummary.studentAvatar ? (
                        <img src={readingSummary.studentAvatar} alt="Ảnh đại diện" className="h-full w-full object-cover" />
                      ) : (
                        <UserRound size={23} className="text-blue-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-blue-500">Tên bé</div>
                      <div className="truncate text-lg font-black text-blue-800 md:text-2xl">{readingSummary.studentName}</div>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border-2 border-emerald-100 bg-emerald-50 px-3 py-2">
                      <div className="flex items-center gap-1 text-sm font-black text-emerald-700">
                        <CheckCircle size={17} /> Đã đọc
                      </div>
                      <div className="text-right text-2xl font-black text-emerald-600">{readingSummary.completedCount} tập</div>
                    </div>
                    <div className="rounded-xl border-2 border-sky-100 bg-sky-50 px-3 py-2">
                      <div className="flex items-center gap-1 text-sm font-black text-sky-700">
                        <Clock size={17} /> Thời gian
                      </div>
                      <div className="text-right text-lg font-black text-sky-600">{formatDuration(readingSummary.durationSec)}</div>
                    </div>
                    <div className="col-span-2 rounded-xl border-2 border-purple-100 bg-purple-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-sm font-black text-purple-700">
                          <BookOpen size={17} /> Tiến độ
                        </div>
                        <div className="text-lg font-black text-purple-600">
                          {readingSummary.completedCount}/{readingSummary.totalCount} bài đọc
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 space-y-2 text-sm md:text-base">
                    <div className="rounded-xl bg-emerald-50 px-3 py-2">
                      <div className="font-black text-emerald-700">Hoàn thành:</div>
                      <div className="max-h-16 overflow-y-auto font-semibold text-slate-700">
                        {readingSummary.completedTitles.length > 0
                          ? readingSummary.completedTitles.join(', ')
                          : 'Chưa có tập nào'}
                      </div>
                    </div>
                    <div className="rounded-xl bg-amber-50 px-3 py-2">
                      <div className="font-black text-amber-700">Đang đọc dở:</div>
                      <div className="font-semibold text-slate-700">{readingSummary.inProgressTitle}</div>
                    </div>
                    <div className="rounded-xl bg-rose-50 px-3 py-2">
                      <div className="font-black text-rose-700">Kết thúc lúc:</div>
                      <div className="font-semibold text-slate-700">{formatDateTime(readingSummary.endedAt)}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-1.5 grid shrink-0 grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={continueReadingAfterSummary}
                    className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-green-500 px-3 text-sm font-black text-white shadow-[0_3px_0_rgb(22,101,52)] active:translate-y-1 active:shadow-none"
                  >
                    <Play size={18} /> Tiếp tục học
                  </button>
                  <button
                    type="button"
                    onClick={restartReadingFromStart}
                    className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-500 px-3 text-sm font-black text-white shadow-[0_3px_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none"
                  >
                    <RotateCcw size={18} /> Học lại từ đầu
                  </button>
                </div>
              </div>
            ) : selectedReading ? (
              <div className="flex min-h-0 flex-1 flex-col bg-emerald-50/70 px-3 py-1.5 md:px-8 md:py-3">
                <div
                  ref={readingContentRef}
                  onScroll={handleReadingScroll}
                  className="min-h-0 flex-1 overflow-y-auto rounded-2xl border-[3px] border-emerald-100/80 bg-white px-2 py-2 md:px-5 md:py-5"
                >
                  {selectedReading.image && (
                    <figure className="mb-2 overflow-hidden rounded-xl border-2 border-emerald-100 bg-emerald-50 shadow-sm">
                      <img
                        src={selectedReading.image}
                        alt={`Minh họa ${selectedReading.title}`}
                        className="aspect-[3/2] w-full object-cover"
                        loading="lazy"
                      />
                    </figure>
                  )}
                  <div className="space-y-2 text-left text-xl font-normal leading-snug text-slate-800 md:space-y-2.5 md:text-3xl md:leading-snug">
                    {selectedReading.lines.map((item, index) => {
                      if (item && typeof item === 'object' && item.type === 'image') {
                        return (
                          <figure
                            key={`${selectedReading.id}-${index}`}
                            className="overflow-hidden rounded-xl border-2 border-emerald-100 bg-emerald-50 shadow-sm"
                          >
                            <img
                              src={item.src}
                              alt={item.alt || `Minh họa ${selectedReading.title}`}
                              className="max-h-[68dvh] w-full bg-emerald-50 object-contain"
                              loading="lazy"
                            />
                          </figure>
                        );
                      }

                      const line = String(item || '');

                      return (
                        <p
                          key={`${selectedReading.id}-${index}`}
                          className={index === 0 ? `rounded-lg border-l-4 py-1 pl-2 pr-1 font-semibold ${
                            selectedReadingCompleted
                              ? 'border-emerald-950 bg-emerald-800 text-white'
                              : 'border-emerald-400 bg-emerald-50/80 text-emerald-800'
                          }` : undefined}
                        >
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-1 shrink-0 rounded-xl bg-white/95 px-1.5 py-1 shadow-sm md:mt-3 md:px-4">
                  <div className="grid grid-cols-[2rem_auto_2rem_minmax(0,1fr)_minmax(0,0.86fr)] items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Tập trước"
                      onClick={() => goToReading(previousReading?.id)}
                      disabled={!previousReading}
                      className={`flex h-8 items-center justify-center rounded-lg text-[11px] font-bold transition-colors md:text-base ${
                        previousReading
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-50 text-gray-300'
                      }`}
                    >
                      <ChevronLeft size={18} className="shrink-0" />
                    </button>
                    <div className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 md:text-sm">
                      {readingCounterLabel}
                    </div>
                    <button
                      type="button"
                      aria-label="Tập sau"
                      onClick={() => goToReading(nextReading?.id)}
                      disabled={!nextReading}
                      className={`flex h-8 items-center justify-center rounded-lg text-[11px] font-bold transition-colors md:text-base ${
                        nextReading
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-gray-50 text-gray-300'
                      }`}
                    >
                      <ChevronRight size={18} className="shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={completeCurrentReading}
                      className={`flex min-h-8 items-center justify-center gap-1 rounded-lg px-1.5 text-[11px] font-bold text-white transition-colors md:text-base ${
                        selectedReadingCompleted
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      <CheckCircle size={16} className="shrink-0" />
                      <span className="truncate">Hoàn thành</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleEndReadingSession}
                      className="flex min-h-8 items-center justify-center gap-1 rounded-lg bg-rose-500 px-1.5 text-[11px] font-bold text-white transition-colors hover:bg-rose-600 md:text-base"
                    >
                      <StopCircle size={16} className="shrink-0" />
                      <span className="truncate">Kết thúc</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="reading-catalog-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-scroll overscroll-contain bg-emerald-50/60 px-3 py-2 pr-1.5 md:px-8 md:py-4">
                {readingCatalogItems.map((item) => {
                  if (item.type === 'series') {
                    const completedCount = item.lessons.filter(reading => readingProgress[reading.id]?.completed).length;
                    const hasProgress = item.lessons.some(reading => readingProgress[reading.id]?.scrollTop > 0);
                    const isCompleted = completedCount === item.lessons.length && item.lessons.length > 0;
                    const isExpanded = expandedReadingSeriesId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`overflow-hidden rounded-xl border-[3px] shadow-sm transition-colors ${
                          isCompleted
                            ? 'border-emerald-500 bg-emerald-100 text-emerald-900'
                            : 'border-emerald-300 bg-white'
                        }`}
                      >
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => {
                            setSelectedReadingId(null);
                            setExpandedReadingSeriesId(prev => (prev === item.id ? null : item.id));
                          }}
                          className={`w-full px-3 py-2.5 text-left transition-colors md:px-4 md:py-3 ${
                            isCompleted ? 'hover:bg-emerald-200' : 'hover:bg-emerald-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1 pr-1">
                              <div className={`break-words text-base font-black leading-tight md:text-lg ${
                                isCompleted ? 'text-emerald-950' : 'text-emerald-800'
                              }`}>
                                {item.title}
                              </div>
                              <div className={`mt-0.5 text-xs font-extrabold md:text-sm ${
                                isCompleted ? 'text-emerald-700' : 'text-emerald-600'
                              }`}>
                                {completedCount}/{item.lessons.length} tập đã đọc{hasProgress && !isCompleted ? ' • có tập đang đọc dở' : ''}
                              </div>
                            </div>
                            <div className={`mt-0.5 flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black md:px-3 md:text-sm ${
                              isCompleted
                                ? 'border border-emerald-300 bg-white text-emerald-800'
                                : 'border border-emerald-100 bg-emerald-50 text-emerald-700'
                            }`}>
                              <span>{isExpanded ? 'Thu gọn' : 'Xem tập'}</span>
                              <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className={`reading-series-scroll max-h-[38dvh] space-y-2 overflow-y-scroll overscroll-contain border-t px-2.5 py-2.5 pr-1.5 md:max-h-[28rem] ${
                            isCompleted ? 'border-emerald-300 bg-emerald-50/80' : 'border-emerald-200 bg-emerald-50/70'
                          }`}>
                            {item.lessons.map((reading, index) => {
                              const episodeCompleted = !!readingProgress[reading.id]?.completed;
                              const episodeInProgress = readingProgress[reading.id]?.scrollTop > 0 && !episodeCompleted;

                              return (
                                <button
                                  key={reading.id}
                                  type="button"
                                  onClick={() => setSelectedReadingId(reading.id)}
                                  className={`w-full rounded-lg border-2 px-3 py-2 text-left transition-colors ${
                                    episodeCompleted
                                      ? 'border-emerald-500 bg-emerald-100 text-emerald-950 hover:bg-emerald-200'
                                      : 'border-emerald-200 bg-white hover:bg-emerald-50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className={`text-sm font-black leading-snug md:text-base ${
                                        episodeCompleted ? 'text-emerald-950' : 'text-emerald-800'
                                      }`}>
                                        Tập {index + 1}: {reading.subtitle || reading.title}
                                      </div>
                                      {episodeCompleted ? (
                                        <div className="mt-0.5 text-[11px] font-extrabold text-emerald-700 md:text-xs">
                                          Đã đọc xong
                                        </div>
                                      ) : episodeInProgress && (
                                        <div className="mt-0.5 text-[11px] font-extrabold text-emerald-500 md:text-xs">
                                          Đang đọc dở
                                        </div>
                                      )}
                                    </div>
                                    <div className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black md:text-xs ${
                                      episodeCompleted
                                        ? 'border border-emerald-200 bg-white text-emerald-700'
                                        : 'bg-emerald-50 text-emerald-700'
                                    }`}>
                                      {episodeCompleted ? 'Đọc lại' : episodeInProgress ? 'Đọc tiếp' : 'Đọc'}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  const reading = item.reading;
                  const readingNumber = READING_LESSONS.findIndex(lesson => lesson.id === reading.id) + 1;
                  const isCompleted = !!readingProgress[reading.id]?.completed;
                  const isInProgress = readingProgress[reading.id]?.scrollTop > 0 && !isCompleted;

                  return (
                    <button
                      key={reading.id}
                      type="button"
                      onClick={() => {
                        setExpandedReadingSeriesId(null);
                        setSelectedReadingId(reading.id);
                      }}
                      className={`rounded-xl border-[3px] px-3 py-2.5 text-left shadow-sm transition-colors md:px-4 md:py-3 ${
                        isCompleted
                          ? 'border-emerald-500 bg-emerald-100 text-emerald-950 hover:bg-emerald-200'
                          : 'border-emerald-300 bg-white hover:bg-emerald-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`truncate text-base font-black md:text-lg ${
                            isCompleted ? 'text-emerald-950' : 'text-emerald-800'
                          }`}>
                            Bài {readingNumber}: {reading.title}
                          </div>
                          {isCompleted ? (
                            <div className="mt-0.5 text-xs font-extrabold text-emerald-700 md:text-sm">
                              Đã đọc xong
                            </div>
                          ) : isInProgress && (
                            <div className="mt-0.5 text-xs font-extrabold text-emerald-500 md:text-sm">
                              Đang đọc dở
                            </div>
                          )}
                        </div>
                        <div className={`shrink-0 rounded-full px-3 py-1 text-xs font-black md:text-sm ${
                          isCompleted
                            ? 'border border-emerald-200 bg-white text-emerald-700'
                            : 'bg-white text-emerald-600'
                        }`}>
                          {isCompleted ? 'Đọc lại' : isInProgress ? 'Đọc tiếp' : 'Đọc'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {!isSummary && showHistoryPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-3">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Lịch sử buổi học"
            className="flex h-[94dvh] max-h-[94dvh] w-full max-w-lg flex-col rounded-2xl border-4 border-white bg-white p-3 shadow-2xl md:rounded-3xl md:p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-lg font-black text-blue-800 md:text-xl">
                  <BarChart size={22} className="shrink-0 text-blue-500" />
                  <span className="truncate">Lịch sử buổi học</span>
                </div>
                <div className="mt-0.5 text-xs font-bold text-gray-500 md:text-sm">
                  Toán {sessionHistory.length}/{MAX_SESSION_HISTORY} • Tập đọc {readingHistory.length}/{MAX_SESSION_HISTORY}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryPanel(false)}
                aria-label="Đóng lịch sử"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
              >
                <XCircle size={22} />
              </button>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setActiveHistoryTab('math')}
                className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-black transition-colors md:text-sm ${
                  activeHistoryTab === 'math'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white text-blue-700 hover:bg-blue-50'
                }`}
              >
                <BarChart size={17} className="shrink-0" />
                <span>Lịch sử học toán</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveHistoryTab('reading')}
                className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-black transition-colors md:text-sm ${
                  activeHistoryTab === 'reading'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-white text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <BookOpen size={17} className="shrink-0" />
                <span>Lịch sử tập đọc</span>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {activeHistoryTab === 'math' && (
                sessionHistory.length > 0 ? (
                  <section className="space-y-2">
                    {sessionHistory.map((entry, index) => (
                      <div key={`math-${entry.id}`} className="rounded-xl border-2 border-blue-100 bg-blue-50 p-2.5 md:p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-black text-blue-800 md:text-base">
                              Phiên {index + 1}: {entry.studentName}
                              {entry.lessonLabel ? <span className="text-xs text-blue-500 md:text-sm"> - {entry.lessonLabel}</span> : null}
                            </div>
                            <div className="mt-0.5 text-[11px] font-bold text-gray-500 md:text-xs">{formatDateTime(entry.endedAt)}</div>
                          </div>
                          <div className="shrink-0 rounded-full bg-white px-2 py-1 text-right text-xs font-black text-purple-600 md:text-sm">
                            {formatTime(entry.screenTime)} xem
                          </div>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-1.5 text-center text-[11px] font-extrabold md:grid-cols-5 md:text-xs">
                          <div className="rounded-lg bg-green-50 px-1.5 py-1.5 text-green-700">Đúng {entry.correctTotal}</div>
                          <div className="rounded-lg bg-red-50 px-1.5 py-1.5 text-red-700">Sai {entry.wrongTotal}</div>
                          <div className="rounded-lg bg-orange-50 px-1.5 py-1.5 text-orange-700">Hết giờ {entry.timeoutTotal}</div>
                          <div className="rounded-lg bg-amber-50 px-1.5 py-1.5 text-amber-700">Cần ôn {entry.reviewCount}</div>
                          <div className="col-span-2 rounded-lg bg-sky-50 px-1.5 py-1.5 text-sky-700 md:col-span-1">Hoàn thành {formatDuration(entry.durationSec)}</div>
                        </div>
                      </div>
                    ))}
                  </section>
                ) : (
                  <div className="rounded-xl border-2 border-blue-100 bg-blue-50 px-4 py-8 text-center text-sm font-extrabold text-gray-500 md:text-base">
                    Chưa có lịch sử học toán nào được lưu.
                  </div>
                )
              )}

              {activeHistoryTab === 'reading' && (
                readingHistory.length > 0 ? (
                  <section className="space-y-2">
                    {readingHistory.map((entry, index) => (
                      <div key={`reading-${entry.id}`} className="rounded-xl border-2 border-emerald-100 bg-emerald-50 p-2.5 md:p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-black text-emerald-800 md:text-base">
                              Phiên đọc {index + 1}: {entry.studentName}
                            </div>
                            <div className="mt-0.5 text-[11px] font-bold text-gray-500 md:text-xs">{formatDateTime(entry.endedAt)}</div>
                          </div>
                          <div className="shrink-0 rounded-full bg-white px-2 py-1 text-right text-xs font-black text-emerald-700 md:text-sm">
                            {entry.completedCount}/{entry.totalCount} bài
                          </div>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] font-extrabold md:text-xs">
                          <div className="rounded-lg bg-green-50 px-1.5 py-1.5 text-center text-green-700">Đã đọc {entry.completedCount}</div>
                          <div className="rounded-lg bg-sky-50 px-1.5 py-1.5 text-center text-sky-700">Hoàn thành {formatDuration(entry.durationSec)}</div>
                          <div className="col-span-2 rounded-lg bg-amber-50 px-2 py-1.5 text-amber-700">
                            Đang đọc dở: {entry.inProgressTitle}
                          </div>
                          <div className="col-span-2 rounded-lg bg-white/80 px-2 py-1.5 text-emerald-800">
                            Hoàn thành: {entry.completedTitles.length > 0 ? entry.completedTitles.join(', ') : 'Chưa có tập nào'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </section>
                ) : (
                  <div className="rounded-xl border-2 border-emerald-100 bg-emerald-50 px-4 py-8 text-center text-sm font-extrabold text-gray-500 md:text-base">
                    Chưa có lịch sử tập đọc nào được lưu.
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-in {
          0% { transform: scale(0.1); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}} />
    </div>
  );
}

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, CheckCircle, XCircle, Clock, Smartphone, Star, BookOpen, RotateCcw, StopCircle, BarChart, AlertTriangle, UserRound, ShieldCheck, Settings, Save, LogOut, LockKeyhole, Volume2, PencilLine, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

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
const SESSION_HISTORY_KEY = 'math_sessionHistory';
const READING_PROGRESS_KEY = 'reading_progress';
const MAX_SESSION_HISTORY = 30;
const AVATAR_SIZE = 160;
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
  soundVolumePercent: DEFAULT_SOUND_VOLUME_PERCENT,
  learningMode: DEFAULT_LEARNING_MODE,
  lessonType: DEFAULT_LESSON_TYPE,
  lessonTypes: [DEFAULT_LESSON_TYPE],
  customQuestionsText: '',
  selectedTables: ALL_ADDITION_TABLES,
};
const READING_LESSONS = [
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
    return savedCorrect ? parseInt(savedCorrect, 10) : 0;
  });
  const [wrongTotal, setWrongTotal] = useState(() => {
    const savedWrong = localStorage.getItem('math_wrongTotal');
    return savedWrong ? parseInt(savedWrong, 10) : 0;
  });
  const [timeoutTotal, setTimeoutTotal] = useState(() => {
    const savedTimeout = localStorage.getItem('math_timeoutTotal');
    return savedTimeout ? parseInt(savedTimeout, 10) : 0;
  });
  const [sessionHistory, setSessionHistory] = useState(() => loadSessionHistory());
  const [userName, setUserName] = useState(() => localStorage.getItem(USER_NAME_KEY) || '');
  const [draftUserName, setDraftUserName] = useState(() => localStorage.getItem(USER_NAME_KEY) || '');
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem(USER_AVATAR_KEY) || '');
  const [draftUserAvatar, setDraftUserAvatar] = useState(() => localStorage.getItem(USER_AVATAR_KEY) || '');
  const [settings, setSettings] = useState(initialSettings);
  const [draftSettings, setDraftSettings] = useState(initialSettings);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserNameForm, setShowUserNameForm] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showAdminSettingsPanel, setShowAdminSettingsPanel] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showReadingPanel, setShowReadingPanel] = useState(false);
  const [selectedReadingId, setSelectedReadingId] = useState(null);
  const [readingProgress, setReadingProgress] = useState(() => loadReadingProgress());
  
  const [currentQ, setCurrentQ] = useState(null);
  const [timer, setTimer] = useState(settings.timeLimit);
  const [gameState, setGameState] = useState('idle'); // idle, playing, wrong_paused, timeout_paused, celebrating, congrats, summary
  const [practiceMode, setPracticeMode] = useState('normal'); // normal, review
  const [selectedAns, setSelectedAns] = useState(null);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const [showParentConfirm, setShowParentConfirm] = useState(false);
  const [summaryStats, setSummaryStats] = useState(null);
  
  const timerRef = useRef(null);
  const nextQuestionTimeoutRef = useRef(null);
  const congratsTimeoutRef = useRef(null);
  const sessionStartedAtRef = useRef(null);
  const readingContentRef = useRef(null);
  const readingSaveTimeoutRef = useRef(null);
  const displayName = userName.trim() || 'bé';
  const activePool = useMemo(() => generateInitialPool(settings), [settings]);
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
  const selectedReadingIndex = selectedReadingId
    ? READING_LESSONS.findIndex(reading => reading.id === selectedReadingId)
    : -1;
  const selectedReadingScrollTop = selectedReadingId
    ? readingProgress[selectedReadingId]?.scrollTop || 0
    : 0;
  const selectedReadingCompleted = selectedReadingId
    ? !!readingProgress[selectedReadingId]?.completed
    : false;
  const previousReading = selectedReadingIndex > 0 ? READING_LESSONS[selectedReadingIndex - 1] : null;
  const nextReading = selectedReadingIndex >= 0 && selectedReadingIndex < READING_LESSONS.length - 1
    ? READING_LESSONS[selectedReadingIndex + 1]
    : null;
  const draftLessonTypes = getValidLessonTypes(
    Array.isArray(draftSettings.lessonTypes) ? draftSettings.lessonTypes : [draftSettings.lessonType]
  );
  const draftGeneratedLessonTypes = draftLessonTypes
    .filter(type => type !== 'custom')
    .map(type => getLessonType(type));
  const draftTableLabel = draftGeneratedLessonTypes.length === 1
    ? draftGeneratedLessonTypes[0].tableLabel
    : 'Bảng luyện tập';
  const draftCustomQuestions = useMemo(
    () => parseCustomQuestions(draftSettings.customQuestionsText),
    [draftSettings.customQuestionsText]
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

    if (nextReading) {
      setSelectedReadingId(nextReading.id);
    } else {
      setSelectedReadingId(null);
    }
  }, [nextReading, selectedReadingId]);

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
      setShowHistoryPanel(false);
      setShowReadingPanel(false);
      setSelectedReadingId(null);
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
    }

    setShowReadingPanel(prev => {
      const shouldOpen = !prev;
      if (!shouldOpen) {
        setSelectedReadingId(null);
      }
      return shouldOpen;
    });
    setShowUserNameForm(false);
    setShowAdminLogin(false);
    setAdminError('');
    setAvatarError('');
    setShowHistoryPanel(false);
    setShowParentConfirm(false);
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
    setShowUserNameForm(false);
    setAvatarError('');
    setShowAdminLogin(false);
    setAdminPin('');
    setAdminError('');
    setSettingsError('');
    setSettingsSaved(false);
  };

  const updateDraftSetting = (key, value) => {
    setDraftSettings(prev => ({ ...prev, [key]: value }));
    setSettingsError('');
    setSettingsSaved(false);
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
    const lessonChanged = getLessonConfigKey(settings) !== getLessonConfigKey(nextSettings);
    const learningModeChanged = settings.learningMode !== nextSettings.learningMode;
    setSettings(nextSettings);
    setDraftSettings(nextSettings);

    if (lessonChanged) {
      clearInterval(timerRef.current);
      clearPendingTransitions();
      sessionStartedAtRef.current = null;
      setReviewList([]);
      setUnseenList(generateInitialPool(nextSettings));
      setCorrectTotal(0);
      setWrongTotal(0);
      setTimeoutTotal(0);
      setCurrentQ(null);
      setSelectedAns(null);
      setShowFlashcardAnswer(false);
      setSummaryStats(null);
      setPracticeMode('normal');
      setGameState('idle');
      setTimer(nextSettings.timeLimit);
    } else {
      setTimer(prev => Math.min(prev, nextSettings.timeLimit));
      if (learningModeChanged) {
        clearInterval(timerRef.current);
        clearPendingTransitions();
        setCurrentQ(null);
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
    } catch {
      console.log("Cannot save data");
    }
  }, [screenTime, reviewList, correctTotal, unseenList, wrongTotal, timeoutTotal, sessionHistory, settings, userName, userAvatar]);

  useEffect(() => {
    try {
      localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(readingProgress));
    } catch {
      console.log("Cannot save reading progress");
    }
  }, [readingProgress]);

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
  }, []);

  // --- LOGIC SINH CÂU HỎI ---
  const generateQuestion = useCallback((options = {}) => {
    let selectedQuestion;
    let isReview = false;
    let isUnseen = false;

    const questionOptions = options || {};
    const selectedPracticeMode = questionOptions.practiceMode || practiceMode;
    const playablePool = questionOptions.activePool || activePool;
    const reviewQuestions = questionOptions.activeReviewList || activeReviewList;
    const unseenQuestions = selectedPracticeMode === 'review'
      ? []
      : questionOptions.activeUnseenList || activeUnseenList;
    
    const canPullReview = reviewQuestions.length > 0;
    const canPullUnseen = unseenQuestions.length > 0;

    if (selectedPracticeMode === 'review' && !canPullReview) {
      setCurrentQ(null);
      setPracticeMode('normal');
      setGameState('congrats');
      return;
    }

    if (playablePool.length === 0) {
      setCurrentQ(null);
      setGameState('idle');
      return;
    }

    if (!sessionStartedAtRef.current) {
      sessionStartedAtRef.current = Date.now();
    }
    
    if (!canPullReview && !canPullUnseen) {
      // Chế độ chơi tự do (khi bé đã thuộc hết các câu trong bài được chọn)
      const randomIndex = Math.floor(Math.random() * playablePool.length);
      selectedQuestion = playablePool[randomIndex];
    } else if (canPullReview && (!canPullUnseen || Math.random() < 0.6)) {
      // Ưu tiên ôn tập (tỉ lệ 60%)
      const randomIndex = Math.floor(Math.random() * reviewQuestions.length);
      selectedQuestion = reviewQuestions[randomIndex];
      isReview = true;
    } else {
      // Bốc ngẫu nhiên 1 câu chưa làm
      const randomIndex = Math.floor(Math.random() * unseenQuestions.length);
      selectedQuestion = unseenQuestions[randomIndex];
      isUnseen = true;
    }

    setCurrentQ(buildPlayableQuestion(selectedQuestion, { isReview, isUnseen }));
    setTimer(settings.timeLimit);
    setSelectedAns(null);
    setShowFlashcardAnswer(false);
    setGameState('playing');
  }, [activePool, activeReviewList, activeUnseenList, practiceMode, settings.timeLimit]);

  // --- XỬ LÝ TRẢ LỜI ---
  function updateScreenTime(amount) {
    setScreenTime(prev => {
      let newTime = prev + amount;
      if (newTime < MIN_TIME) newTime = MIN_TIME;
      if (newTime > MAX_TIME) newTime = MAX_TIME;
      return newTime;
    });
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
    updateScreenTime(-settings.penaltySec);
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
      updateScreenTime(settings.rewardSec);
      
      if (currentQ.isUnseen) {
        setUnseenList(prev => {
          const newList = prev.filter(q => getQuestionKey(q) !== currentKey);
          // Kiểm tra điều kiện thắng
          const remainingKeys = new Set(newList.map(getQuestionKey));
          const remainingSelectedUnseen = activePool.filter(question => remainingKeys.has(question.id));
          if (remainingSelectedUnseen.length === 0 && activeReviewList.length === 0) {
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
      updateScreenTime(-settings.penaltySec);
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
    updateScreenTime(settings.rewardSec);
    setShowFlashcardAnswer(false);

    if (currentQ.isUnseen) {
      setUnseenList(prev => {
        const newList = prev.filter(q => getQuestionKey(q) !== currentKey);
        const remainingKeys = new Set(newList.map(getQuestionKey));
        const remainingSelectedUnseen = activePool.filter(question => remainingKeys.has(question.id));
        if (remainingSelectedUnseen.length === 0 && activeReviewList.length === 0) {
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
      if (remainingSelectedReview.length === 0 && (practiceMode === 'review' || activeUnseenList.length === 0)) {
        queueCongrats();
      }
      
      return newList;
    });
  };

  const handleEndSession = useCallback(() => {
    clearInterval(timerRef.current);
    clearPendingTransitions();
    rememberCurrentReadingPosition();
    setShowParentConfirm(false);
    setShowHistoryPanel(false);
    setShowReadingPanel(false);
    setSelectedReadingId(null);
    setShowFlashcardAnswer(false);
    const endedAt = Date.now();
    const startedAt = sessionStartedAtRef.current || endedAt;
    const nextSummary = {
      correctTotal,
      wrongTotal,
      timeoutTotal,
      reviewCount: activeReviewList.length,
      screenTime,
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
    currentLessonLabel,
    displayName,
    rememberCurrentReadingPosition,
    screenTime,
    timeoutTotal,
    userAvatar,
    wrongTotal,
  ]);

  const handleContinueLearning = () => {
    clearInterval(timerRef.current);
    clearPendingTransitions();
    setPracticeMode('normal');
    setSummaryStats(null);
    setShowFlashcardAnswer(false);
    generateQuestion({ practiceMode: 'normal' });
  };

  const handleReviewPractice = () => {
    if (activeReviewList.length === 0) return;

    clearInterval(timerRef.current);
    clearPendingTransitions();
    setPracticeMode('review');
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
    sessionStartedAtRef.current = null;
    setScreenTime(0);
    setReviewList([]);
    setUnseenList(freshPool);
    setCorrectTotal(0);
    setWrongTotal(0);
    setTimeoutTotal(0);
    setCurrentQ(null);
    setSelectedAns(null);
    setShowFlashcardAnswer(false);
    setSummaryStats(null);
    setPracticeMode('normal');
    setTimer(settings.timeLimit);
    generateQuestion({
      activePool: freshPool,
      activeReviewList: [],
      activeUnseenList: freshPool,
      practiceMode: 'normal',
    });
  };

  const resetAllData = () => {
    setSummaryStats(null);
    localStorage.removeItem('math_screenTime');
    localStorage.removeItem('math_reviewList');
    localStorage.removeItem('math_correctTotal');
    localStorage.removeItem('math_unseenList');
    localStorage.removeItem('math_wrongTotal');
    localStorage.removeItem('math_timeoutTotal');
    localStorage.removeItem(SESSION_HISTORY_KEY);
    localStorage.removeItem(READING_PROGRESS_KEY);
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
  const visibleSummary = summaryStats || {
    correctTotal,
    wrongTotal,
    timeoutTotal,
    reviewCount: activeReviewList.length,
    screenTime,
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
      <div className="w-full max-w-lg bg-white rounded-2xl md:rounded-3xl shadow-lg border-4 border-white mb-4 p-1.5 md:p-2">
        <div className="grid grid-cols-4 gap-1.5 md:gap-2">
          <button
            type="button"
            onClick={toggleUserNameForm}
            className={`flex min-w-0 items-center justify-center gap-1 md:gap-2 rounded-xl md:rounded-2xl py-2 px-1 md:px-2 font-extrabold text-[11px] sm:text-xs md:text-base transition-all ${
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
              setShowReadingPanel(false);
              setSelectedReadingId(null);
            }}
            className={`flex min-w-0 items-center justify-center gap-1 md:gap-2 rounded-xl md:rounded-2xl py-2 px-1 md:px-2 font-extrabold text-[11px] sm:text-xs md:text-base transition-all ${
              isAdmin
                ? 'bg-purple-500 text-white shadow-[0_4px_0_rgb(126,34,206)]'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-2 border-purple-100'
            }`}
          >
            <ShieldCheck size={16} className="shrink-0 md:w-5 md:h-5" /> <span className="truncate">Admin</span>
          </button>

          <button
            type="button"
            onClick={toggleReadingPanel}
            className={`flex min-w-0 items-center justify-center gap-1 md:gap-2 rounded-xl md:rounded-2xl py-2 px-1 md:px-2 font-extrabold text-[11px] sm:text-xs md:text-base transition-all ${
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
              setShowHistoryPanel(prev => !prev);
              setShowUserNameForm(false);
              setShowAdminLogin(false);
              setAdminError('');
              setAvatarError('');
              setShowParentConfirm(false);
              rememberCurrentReadingPosition();
              setShowReadingPanel(false);
              setSelectedReadingId(null);
            }}
            className={`flex min-w-0 items-center justify-center gap-1 md:gap-2 rounded-xl md:rounded-2xl py-2 px-1 md:px-2 font-extrabold text-[11px] sm:text-xs md:text-base transition-all ${
              showHistoryPanel
                ? 'bg-sky-500 text-white shadow-[0_4px_0_rgb(2,132,199)]'
                : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border-2 border-sky-100'
            }`}
          >
            <BarChart size={16} className="shrink-0 md:w-5 md:h-5" /> <span className="truncate">Lịch sử</span>
          </button>
        </div>

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
                      <input
                        type="range"
                        min="3"
                        max="60"
                        value={clampNumber(draftSettings.timeLimit, DEFAULT_SETTINGS.timeLimit, 3, 60)}
                        onChange={(event) => updateDraftSetting('timeLimit', event.target.value)}
                        className="flex-1 accent-blue-500"
                      />
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
                      <input
                        type="range"
                        min="5"
                        max="600"
                        step="5"
                        value={clampNumber(draftSettings.rewardSec, DEFAULT_SETTINGS.rewardSec, 5, 600)}
                        onChange={(event) => updateDraftSetting('rewardSec', event.target.value)}
                        className="flex-1 accent-green-500"
                      />
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
                      <input
                        type="range"
                        min="5"
                        max="600"
                        step="5"
                        value={clampNumber(draftSettings.penaltySec, DEFAULT_SETTINGS.penaltySec, 5, 600)}
                        onChange={(event) => updateDraftSetting('penaltySec', event.target.value)}
                        className="flex-1 accent-red-500"
                      />
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
                      <Volume2 size={18} className="text-purple-500" /> Âm lượng âm thanh
                    </span>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max={MAX_SOUND_VOLUME_PERCENT}
                        step="5"
                        value={clampNumber(draftSettings.soundVolumePercent, DEFAULT_SETTINGS.soundVolumePercent, 0, MAX_SOUND_VOLUME_PERCENT)}
                        onChange={(event) => updateDraftSetting('soundVolumePercent', event.target.value)}
                        className="flex-1 accent-purple-500"
                      />
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
      <div className="w-full max-w-lg bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border-4 border-white mb-4">
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
          
          <div className="col-span-3 flex flex-col items-center justify-center p-1.5 md:p-2 bg-purple-100 rounded-xl md:rounded-2xl border-2 border-purple-200">
            <div className="flex items-center gap-1 md:gap-2 text-purple-700 font-bold text-sm md:text-lg">
              <Smartphone size={20} className="md:w-6 md:h-6 animate-pulse" /> Giờ xem điện thoại
            </div>
            <div className="text-lg md:text-3xl font-black text-purple-600 text-center">
              {formatTime(screenTime)} <span className="text-lg md:text-xl text-purple-400">/ 90p</span>
            </div>
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
        
        {gameState === 'idle' ? (
          <div className="text-center">
            <div className="text-5xl md:text-8xl mb-2 md:mb-6">🚀</div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-700 mb-3 md:mb-8">Bé đã sẵn sàng chưa?</h2>
            <div className="grid gap-2 md:gap-3">
              <button
                onClick={() => {
                  setPracticeMode('normal');
                  generateQuestion({ practiceMode: 'normal' });
                }}
                className="bg-green-500 hover:bg-green-600 active:transform active:scale-95 text-white text-xl md:text-3xl font-extrabold py-3 px-8 md:py-5 md:px-10 rounded-full shadow-[0_5px_0_rgb(21,128,61)] md:shadow-[0_8px_0_rgb(21,128,61)] transition-all flex items-center justify-center mx-auto gap-2 md:gap-3 w-full"
              >
                <Play fill="white" className="w-6 h-6 md:w-8 md:h-8" /> BẮT ĐẦU
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
              <div className={`grid gap-2 ${visibleSummary.reviewCount > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {visibleSummary.reviewCount > 0 && (
                  <button
                    type="button"
                    onClick={handleReviewPractice}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-amber-500 px-3 py-2.5 md:py-3.5 text-base md:text-2xl font-extrabold text-white shadow-[0_4px_0_rgb(180,83,9)] active:translate-y-1 active:shadow-none transition-all"
                  >
                    <BookOpen size={20} className="md:w-6 md:h-6" />
                    Ôn câu sai
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRestartLearning}
                  className="bg-blue-500 hover:bg-blue-600 active:transform active:scale-95 text-white text-base md:text-3xl font-bold py-2.5 px-3 md:py-3.5 md:px-10 rounded-full shadow-[0_4px_0_rgb(29,78,216)] md:shadow-[0_6px_0_rgb(29,78,216)] transition-all mx-auto w-full"
                >
                  Học lại từ đầu
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
                    <span className="whitespace-nowrap">+ {formatTime(settings.rewardSec)} xem điện thoại</span>
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
                    - {formatTime(settings.penaltySec)} xem điện thoại 😢
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

      {!isSummary && showReadingPanel && (
        <div className="fixed inset-0 z-50 bg-white">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tập đọc"
            className="flex h-full w-full flex-col bg-white"
          >
            <div className="flex shrink-0 items-center justify-between gap-1.5 border-b border-emerald-100 bg-white px-2.5 py-0.5 md:px-6 md:py-1.5">
              <div className="flex min-w-0 items-center gap-1.5 text-lg font-semibold text-emerald-800 md:text-3xl">
                <BookOpen size={20} className="shrink-0 text-emerald-500 md:h-8 md:w-8" />
                <span className="truncate">{selectedReading ? selectedReading.title : 'Tập đọc'}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {selectedReading && (
                  <button
                    type="button"
                    onClick={() => {
                      rememberCurrentReadingPosition();
                      setSelectedReadingId(null);
                    }}
                    className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100 md:px-4 md:text-base"
                  >
                    Trở lại
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    rememberCurrentReadingPosition();
                    setShowReadingPanel(false);
                    setSelectedReadingId(null);
                  }}
                  aria-label="Đóng tập đọc"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 md:h-10 md:w-10"
                >
                  <XCircle size={18} />
                </button>
              </div>
            </div>

            {selectedReading ? (
              <div className="flex min-h-0 flex-1 flex-col bg-emerald-50/70 px-3 py-1.5 md:px-8 md:py-3">
                <div
                  ref={readingContentRef}
                  onScroll={handleReadingScroll}
                  className="min-h-0 flex-1 overflow-y-auto rounded-2xl border-[3px] border-emerald-100/80 bg-white px-2 py-2 md:px-5 md:py-5"
                >
                  <div className="space-y-2 text-left text-xl font-normal leading-snug text-slate-800 md:space-y-2.5 md:text-3xl md:leading-snug">
                    {selectedReading.lines.map((line, index) => (
                      <p
                        key={`${selectedReading.id}-${index}`}
                        className={index === 0 ? 'rounded-lg border-l-4 border-emerald-400 bg-emerald-50/80 py-1 pl-2 pr-1 font-semibold text-emerald-800' : undefined}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="mt-1 shrink-0 rounded-xl bg-white/95 px-1.5 py-1 shadow-sm md:mt-3 md:px-4">
                  <div className="grid grid-cols-[0.82fr_auto_0.82fr_0.98fr] items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => goToReading(previousReading?.id)}
                      disabled={!previousReading}
                      className={`flex min-h-8 items-center justify-center gap-1 rounded-lg px-1.5 text-[11px] font-bold transition-colors md:text-base ${
                        previousReading
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-50 text-gray-300'
                      }`}
                    >
                      <ChevronLeft size={18} className="shrink-0" />
                      <span className="truncate">Tập trước</span>
                    </button>
                    <div className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 md:text-sm">
                      {selectedReadingIndex + 1}/{READING_LESSONS.length}
                    </div>
                    <button
                      type="button"
                      onClick={() => goToReading(nextReading?.id)}
                      disabled={!nextReading}
                      className={`flex min-h-8 items-center justify-center gap-1 rounded-lg px-1.5 text-[11px] font-bold transition-colors md:text-base ${
                        nextReading
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-gray-50 text-gray-300'
                      }`}
                    >
                      <span className="truncate">Tập sau</span>
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
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto bg-emerald-50/60 px-3 py-3 md:px-8 md:py-5">
                {READING_LESSONS.map((reading, index) => (
                  <button
                    key={reading.id}
                    type="button"
                    onClick={() => setSelectedReadingId(reading.id)}
                    className="rounded-xl bg-white p-3 text-left shadow-sm transition-colors hover:bg-emerald-100 md:p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-black text-emerald-800 md:text-lg">
                          Bài {index + 1}: {reading.title}
                        </div>
                        {readingProgress[reading.id]?.completed ? (
                          <div className="mt-0.5 text-xs font-extrabold text-green-600 md:text-sm">
                            Đã đọc
                          </div>
                        ) : readingProgress[reading.id]?.scrollTop > 0 && (
                          <div className="mt-0.5 text-xs font-extrabold text-emerald-500 md:text-sm">
                            Đang đọc dở
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-600 md:text-sm">
                        {readingProgress[reading.id]?.completed
                          ? 'Đọc lại'
                          : readingProgress[reading.id]?.scrollTop > 0
                            ? 'Đọc tiếp'
                            : 'Đọc'}
                      </div>
                    </div>
                  </button>
                ))}
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
            className="flex max-h-[86dvh] w-full max-w-lg flex-col rounded-2xl border-4 border-white bg-white p-3 shadow-2xl md:rounded-3xl md:p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-lg font-black text-blue-800 md:text-xl">
                  <BarChart size={22} className="shrink-0 text-blue-500" />
                  <span className="truncate">Lịch sử buổi học</span>
                </div>
                <div className="mt-0.5 text-xs font-bold text-gray-500 md:text-sm">
                  Lưu {sessionHistory.length}/{MAX_SESSION_HISTORY} phiên gần nhất
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

            {sessionHistory.length === 0 ? (
              <div className="rounded-xl border-2 border-blue-100 bg-blue-50 px-4 py-8 text-center text-sm font-extrabold text-gray-500 md:text-base">
                Chưa có buổi học nào được lưu.
              </div>
            ) : (
              <div className="grid max-h-[68dvh] gap-2 overflow-y-auto pr-1">
                {sessionHistory.map((entry, index) => (
                  <div key={entry.id} className="rounded-xl border-2 border-blue-100 bg-blue-50 p-2.5 md:p-3">
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
              </div>
            )}
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

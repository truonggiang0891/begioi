import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, CheckCircle, XCircle, Clock, Smartphone, Star, BookOpen, RotateCcw, StopCircle, BarChart, AlertTriangle } from 'lucide-react';

// --- ÂM THANH (Dùng Web Audio API để không cần file ngoài) ---
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // Đô
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // Mi
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // Sol
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
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
const REWARD_SEC = 30; // Thưởng 30 giây
const PENALTY_SEC = 60; // Phạt 1 phút (60 giây)
const TIME_LIMIT = 9; // 9 giây mỗi câu

// Tạo mốc 100 câu hỏi cố định theo bảng cộng 1 đến 10 (cộng từ 0 đến 9)
const generateInitialPool = () => {
  const pool = [];
  for (let a = 1; a <= 10; a++) {
    for (let b = 0; b <= 9; b++) {
      pool.push({ a, b });
    }
  }
  return pool;
};

export default function App() {
  // --- STATE ---
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
    return savedUnseen ? JSON.parse(savedUnseen) : generateInitialPool();
  });
  const [correctTotal, setCorrectTotal] = useState(() => {
    const savedCorrect = localStorage.getItem('math_correctTotal');
    return savedCorrect ? parseInt(savedCorrect, 10) : 0;
  });
  const [wrongTotal, setWrongTotal] = useState(() => {
    const savedWrong = localStorage.getItem('math_wrongTotal');
    return savedWrong ? parseInt(savedWrong, 10) : 0;
  });
  
  const [currentQ, setCurrentQ] = useState(null);
  const [timer, setTimer] = useState(TIME_LIMIT);
  const [gameState, setGameState] = useState('idle'); // idle, playing, wrong_paused, timeout_paused, celebrating, congrats, summary
  const [selectedAns, setSelectedAns] = useState(null);
  const [showParentConfirm, setShowParentConfirm] = useState(false);
  
  const timerRef = useRef(null);

  // --- LƯU DỮ LIỆU ---
  useEffect(() => {
    localStorage.setItem('math_screenTime', screenTime.toString());
    localStorage.setItem('math_reviewList', JSON.stringify(reviewList));
    localStorage.setItem('math_correctTotal', correctTotal.toString());
    localStorage.setItem('math_unseenList', JSON.stringify(unseenList));
    localStorage.setItem('math_wrongTotal', wrongTotal.toString());
  }, [screenTime, reviewList, correctTotal, unseenList, wrongTotal]);

  // --- LOGIC SINH CÂU HỎI ---
  const generateQuestion = useCallback(() => {
    let a, b, isReview = false, isUnseen = false;
    
    const canPullReview = reviewList.length > 0;
    const canPullUnseen = unseenList.length > 0;
    
    if (!canPullReview && !canPullUnseen) {
      // Chế độ chơi tự do (khi bé đã thuộc hết 100 câu)
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10); // 0-9
    } else if (canPullReview && (!canPullUnseen || Math.random() < 0.6)) {
      // Ưu tiên ôn tập (tỉ lệ 60%)
      const randomIndex = Math.floor(Math.random() * reviewList.length);
      a = reviewList[randomIndex].a;
      b = reviewList[randomIndex].b;
      isReview = true;
    } else {
      // Bốc ngẫu nhiên 1 câu chưa làm
      const randomIndex = Math.floor(Math.random() * unseenList.length);
      a = unseenList[randomIndex].a;
      b = unseenList[randomIndex].b;
      isUnseen = true;
    }
    
    const correctAns = a + b;
    let options = new Set([correctAns]);
    
    // Tạo 3 đáp án sai gần giống
    while (options.size < 4) {
      const diff = Math.floor(Math.random() * 5) - 2; // -2 đến +2
      let wrongAns = correctAns + diff;
      if (wrongAns <= 0) wrongAns = correctAns + Math.floor(Math.random() * 4) + 1;
      if (wrongAns !== correctAns) options.add(wrongAns);
    }
    
    // Trộn đáp án
    const shuffledOptions = Array.from(options).sort(() => Math.random() - 0.5);
    
    setCurrentQ({ a, b, ans: correctAns, options: shuffledOptions, isReview, isUnseen });
    setTimer(TIME_LIMIT);
    setSelectedAns(null);
    setGameState('playing');
  }, [reviewList, unseenList]);

  // --- XỬ LÝ TRẢ LỜI ---
  function updateScreenTime(amount) {
    setScreenTime(prev => {
      let newTime = prev + amount;
      if (newTime < MIN_TIME) newTime = MIN_TIME;
      if (newTime > MAX_TIME) newTime = MAX_TIME;
      return newTime;
    });
  }

  function addToReview(a, b) {
    setReviewList(prev => {
      const exists = prev.find(item => item.a === a && item.b === b);
      if (exists) {
        // Nếu đã có, reset số lần đúng liên tiếp về 0
        return prev.map(item => item.a === a && item.b === b ? { ...item, correctCount: 0 } : item);
      } else {
        return [...prev, { a, b, correctCount: 0 }];
      }
    });
  }

  function handleTimeout() {
    playSound('wrong');
    setGameState('timeout_paused');
    updateScreenTime(-PENALTY_SEC);
    setWrongTotal(prev => prev + 1);
    if (currentQ?.isUnseen) {
      // Loại khỏi danh sách chưa làm
      setUnseenList(prev => prev.filter(q => !(q.a === currentQ.a && q.b === currentQ.b)));
    }
    addToReview(currentQ.a, currentQ.b);
  }

  // --- TIMER ---
  useEffect(() => {
    if (gameState === 'playing') {
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
  }, [gameState, currentQ]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswerClick = (option) => {
    if (gameState !== 'playing') return;
    clearInterval(timerRef.current);
    setSelectedAns(option);
    
    if (option === currentQ.ans) {
      // ĐÚNG
      playSound('correct');
      setGameState('celebrating');
      setCorrectTotal(prev => prev + 1);
      updateScreenTime(REWARD_SEC);
      
      if (currentQ.isUnseen) {
        setUnseenList(prev => {
          const newList = prev.filter(q => !(q.a === currentQ.a && q.b === currentQ.b));
          // Kiểm tra điều kiện thắng
          if (newList.length === 0 && reviewList.length === 0) {
            setTimeout(() => setGameState('congrats'), 1600);
          }
          return newList;
        });
      } else if (currentQ.isReview) {
        handleReviewSuccess(currentQ.a, currentQ.b);
      }
      
      // Chuyển câu sau 1.5s
      setTimeout(() => {
        generateQuestion();
      }, 1500);
      
    } else {
      // SAI
      playSound('wrong');
      setGameState('wrong_paused');
      updateScreenTime(-PENALTY_SEC);
      setWrongTotal(prev => prev + 1);
      if (currentQ.isUnseen) {
        // Loại khỏi danh sách chưa làm
        setUnseenList(prev => prev.filter(q => !(q.a === currentQ.a && q.b === currentQ.b)));
      }
      addToReview(currentQ.a, currentQ.b);
    }
  };

  const handleReviewSuccess = (a, b) => {
    if (!currentQ.isReview) return;
    
    setReviewList(prev => {
      const newList = prev.map(item => {
        if (item.a === a && item.b === b) {
          return { ...item, correctCount: item.correctCount + 1 };
        }
        return item;
      }).filter(item => item.correctCount < 2); // Loại bỏ nếu đúng 2 lần liên tiếp
      
      // Kiểm tra nếu cả hai danh sách đều đã rỗng
      if (newList.length === 0 && unseenList.length === 0) {
        setTimeout(() => setGameState('congrats'), 1600);
      }
      
      return newList;
    });
  };

  const handleEndSession = () => {
    clearInterval(timerRef.current);
    setGameState('summary');
  };

  const resetAllData = () => {
    localStorage.removeItem('math_screenTime');
    localStorage.removeItem('math_reviewList');
    localStorage.removeItem('math_correctTotal');
    localStorage.removeItem('math_unseenList');
    localStorage.removeItem('math_wrongTotal');
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

  // --- RENDER COMPONENT ---
  return (
    <div className="min-h-screen bg-sky-100 font-sans flex flex-col items-center py-4 px-3 md:py-6 md:px-4">
      {/* HEADER */}
      <div className="w-full max-w-lg bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border-4 border-white mb-4 md:mb-6">
        <div className="bg-blue-500 text-white text-center py-3 md:py-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, #fff 10%, transparent 10%)', backgroundSize: '20px 20px' }}></div>
          <h1 className="text-2xl md:text-4xl font-extrabold uppercase tracking-wide relative z-10 drop-shadow-md">
            Bé Học Bảng Cộng
          </h1>
        </div>
        
        {/* STATS */}
        <div className="p-3 md:p-4 grid grid-cols-3 gap-2 md:gap-3 bg-white">
          <div className="flex flex-col items-center justify-center p-2 bg-green-100 rounded-xl md:rounded-2xl border-2 border-green-200">
            <div className="flex items-center gap-1 text-green-700 font-bold text-[11px] sm:text-xs md:text-base">
              <CheckCircle size={16} className="md:w-5 md:h-5" /> Đã đúng
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-green-600">{correctTotal}</div>
          </div>
          
          <div className="flex flex-col items-center justify-center p-2 bg-amber-100 rounded-xl md:rounded-2xl border-2 border-amber-200">
            <div className="flex items-center gap-1 text-amber-700 font-bold text-[11px] sm:text-xs md:text-base">
              <BookOpen size={16} className="md:w-5 md:h-5" /> Cần ôn
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-amber-600">{reviewList.length}</div>
          </div>

          <div className="flex flex-col items-center justify-center p-2 bg-blue-100 rounded-xl md:rounded-2xl border-2 border-blue-200">
            <div className="flex items-center gap-1 text-blue-700 font-bold text-[11px] sm:text-xs md:text-base">
              <Star size={16} className="md:w-5 md:h-5" /> Chưa làm
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-blue-600">{unseenList.length}</div>
          </div>
          
          <div className="col-span-3 flex flex-col items-center justify-center p-2 md:p-3 bg-purple-100 rounded-xl md:rounded-2xl border-2 border-purple-200 mt-1">
            <div className="flex items-center gap-1 md:gap-2 text-purple-700 font-bold text-sm md:text-lg mb-1">
              <Smartphone size={20} className="md:w-6 md:h-6 animate-pulse" /> Giờ xem điện thoại
            </div>
            <div className="text-2xl md:text-3xl font-black text-purple-600 text-center">
              {formatTime(screenTime)} <span className="text-lg md:text-xl text-purple-400">/ 90p</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GAME AREA */}
      <div className="w-full max-w-lg bg-white rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 border-4 border-white relative min-h-[350px] md:min-h-[400px] flex flex-col justify-center">
        
        {gameState === 'idle' ? (
          <div className="text-center">
            <div className="text-6xl md:text-8xl mb-4 md:mb-6">🚀</div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-700 mb-6 md:mb-8">Bé đã sẵn sàng chưa?</h2>
            <button 
              onClick={generateQuestion}
              className="bg-green-500 hover:bg-green-600 active:transform active:scale-95 text-white text-2xl md:text-3xl font-extrabold py-4 px-8 md:py-5 md:px-10 rounded-full shadow-[0_6px_0_rgb(21,128,61)] md:shadow-[0_8px_0_rgb(21,128,61)] transition-all flex items-center justify-center mx-auto gap-2 md:gap-3"
            >
              <Play fill="white" className="w-6 h-6 md:w-8 md:h-8" /> BẮT ĐẦU
            </button>
          </div>
        ) : gameState === 'congrats' ? (
          <div className="text-center animate-bounce-in">
            <div className="text-6xl md:text-8xl mb-4 md:mb-6">🎉🏆🎉</div>
            <h2 className="text-2xl md:text-3xl font-black text-green-500 mb-3 md:mb-4 uppercase drop-shadow-sm">
              Chúc mừng bé!
            </h2>
            <p className="text-base md:text-xl font-bold text-gray-600 mb-6 md:mb-8">
              Bé đã thuộc hết bảng cộng và không còn câu nào cần ôn nữa! Tuyệt vời quá!
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
            <BarChart className="w-12 h-12 md:w-16 md:h-16 text-blue-500 mx-auto mb-3 md:mb-4" />
            <h2 className="text-2xl md:text-3xl font-black text-blue-700 mb-4 md:mb-6 uppercase">Tổng Kết Buổi Học</h2>
            
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8 text-left bg-blue-50 p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-blue-200">
              <div className="font-bold text-gray-700 text-xs sm:text-sm md:text-lg flex items-center gap-1 md:gap-2">
                <CheckCircle size={16} className="md:w-5 md:h-5 text-green-500"/> Câu đúng:
              </div>
              <div className="font-black text-lg md:text-2xl text-green-600 text-right">{correctTotal}</div>
              
              <div className="font-bold text-gray-700 text-xs sm:text-sm md:text-lg flex items-center gap-1 md:gap-2">
                <XCircle size={16} className="md:w-5 md:h-5 text-red-500"/> Câu sai:
              </div>
              <div className="font-black text-lg md:text-2xl text-red-600 text-right">{wrongTotal}</div>
              
              <div className="font-bold text-gray-700 text-xs sm:text-sm md:text-lg flex items-center gap-1 md:gap-2">
                <BookOpen size={16} className="md:w-5 md:h-5 text-amber-500"/> Cần ôn:
              </div>
              <div className="font-black text-lg md:text-2xl text-amber-600 text-right">{reviewList.length}</div>
              
              <div className="font-bold text-gray-700 text-xs sm:text-sm md:text-lg flex items-center gap-1 md:gap-2">
                <Smartphone size={16} className="md:w-5 md:h-5 text-purple-500"/> Giờ xem:
              </div>
              <div className="font-black text-base md:text-xl text-purple-600 text-right">{formatTime(screenTime)}</div>
            </div>

            <button 
              onClick={generateQuestion}
              className="bg-green-500 hover:bg-green-600 active:transform active:scale-95 text-white text-xl md:text-2xl font-bold py-3 px-8 md:py-4 md:px-10 rounded-full shadow-[0_4px_0_rgb(21,128,61)] md:shadow-[0_6px_0_rgb(21,128,61)] transition-all mx-auto w-full"
            >
              Làm lại (Học tiếp)
            </button>
          </div>
        ) : (
          <>
            {/* TIMER BAR */}
            <div className="absolute top-0 left-0 w-full h-2 md:h-3 bg-gray-100 rounded-t-2xl md:rounded-t-3xl overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-linear ${timer > 4 ? 'bg-green-400' : timer > 2 ? 'bg-yellow-400' : 'bg-red-500'}`}
                style={{ width: `${(timer / TIME_LIMIT) * 100}%` }}
              ></div>
            </div>

            <div className="text-center mb-2 mt-1 md:mt-2 flex justify-center items-center gap-1 md:gap-2">
              <Clock size={20} className={`md:w-6 md:h-6 ${timer <= 3 ? 'text-red-500 animate-bounce' : 'text-gray-400'}`} />
              <span className={`text-base md:text-xl font-bold ${timer <= 3 ? 'text-red-500' : 'text-gray-500'}`}>
                Còn lại: {timer} giây
              </span>
            </div>

            {/* QUESTION */}
            <div className="text-center my-4 md:my-6">
              <div className="text-5xl sm:text-6xl md:text-8xl font-black text-blue-900 drop-shadow-sm tracking-widest">
                {currentQ?.a} + {currentQ?.b} = ?
              </div>
            </div>

            {/* ANSWERS GRID */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-8">
              {currentQ?.options.map((opt, idx) => {
                let btnColor = "bg-sky-400 hover:bg-sky-500 shadow-[0_6px_0_rgb(2,132,199)] md:shadow-[0_8px_0_rgb(2,132,199)]";
                let textColor = "text-white";
                
                // Trạng thái khi đã chọn hoặc hết giờ
                if (gameState === 'wrong_paused' || gameState === 'timeout_paused') {
                  if (opt === currentQ.ans) {
                    btnColor = "bg-green-500 shadow-[0_6px_0_rgb(21,128,61)] md:shadow-[0_8px_0_rgb(21,128,61)] animate-pulse";
                  } else if (opt === selectedAns) {
                    btnColor = "bg-red-500 shadow-[0_6px_0_rgb(185,28,28)] md:shadow-[0_8px_0_rgb(185,28,28)] opacity-60";
                  } else {
                    btnColor = "bg-gray-300 shadow-[0_6px_0_rgb(156,163,175)] md:shadow-[0_8px_0_rgb(156,163,175)] opacity-50";
                  }
                } else if (gameState === 'celebrating') {
                  if (opt === currentQ.ans) {
                    btnColor = "bg-green-400 shadow-[0_6px_0_rgb(22,163,74)] md:shadow-[0_8px_0_rgb(22,163,74)] transform scale-105";
                  } else {
                    btnColor = "bg-gray-200 shadow-[0_6px_0_rgb(209,213,219)] md:shadow-[0_8px_0_rgb(209,213,219)] opacity-30 text-gray-400";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={gameState !== 'playing'}
                    onClick={() => handleAnswerClick(opt)}
                    className={`${btnColor} ${textColor} text-4xl md:text-5xl font-black py-5 md:py-8 rounded-2xl md:rounded-3xl transition-all active:translate-y-2 active:shadow-[0_0px_0_rgb(2,132,199)] flex justify-center items-center`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* PHẢN HỒI KHI SAI / HẾT GIỜ */}
            {(gameState === 'wrong_paused' || gameState === 'timeout_paused') && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl md:rounded-3xl p-4 md:p-6 text-center border-4 md:border-8 border-red-100">
                <XCircle className="w-16 h-16 md:w-20 md:h-20 text-red-500 mb-3 md:mb-4" />
                <h3 className="text-2xl md:text-3xl font-black text-red-600 mb-2">
                  {gameState === 'timeout_paused' ? 'Hết giờ mất rồi!' : 'Chưa đúng rồi nhé!'}
                </h3>
                <div className="text-2xl md:text-4xl font-bold text-gray-700 my-4 md:my-6 bg-gray-100 py-3 px-6 md:py-4 md:px-8 rounded-xl md:rounded-2xl w-full">
                  Đáp án là: <span className="text-green-500 text-5xl md:text-6xl font-black block mt-2">{currentQ.ans}</span>
                </div>
                <div className="text-red-500 font-bold text-base md:text-lg mb-4 md:mb-6">- 1 phút điện thoại 😢</div>
                <button
                  onClick={generateQuestion}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xl md:text-3xl font-extrabold py-3 px-8 md:py-4 md:px-12 rounded-full shadow-[0_4px_0_rgb(29,78,216)] md:shadow-[0_8px_0_rgb(29,78,216)] active:translate-y-2 active:shadow-none transition-all w-full"
                >
                  Tiếp tục nhé!
                </button>
              </div>
            )}

            {/* HIỆU ỨNG KHI ĐÚNG */}
            {gameState === 'celebrating' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                <div className="animate-bounce text-[80px] md:text-[120px] drop-shadow-2xl flex relative">
                  ⭐
                  <div className="absolute -top-6 -left-6 md:-top-10 md:-left-10 text-4xl md:text-6xl animate-ping opacity-70">✨</div>
                  <div className="absolute top-6 -right-6 md:top-10 md:-right-10 text-3xl md:text-5xl animate-ping opacity-70 delay-100">✨</div>
                  <div className="absolute -bottom-3 left-1/2 text-2xl md:text-4xl animate-ping opacity-70 delay-200">✨</div>
                </div>
                <div className="absolute top-1/4 md:top-1/4 text-lg md:text-3xl font-black text-green-500 bg-white/95 px-4 py-2 md:px-6 md:py-2 rounded-full shadow-lg border-2 border-green-200 animate-pulse text-center">
                  + 30 giây xem điện thoại 🎉
                </div>
              </div>
            )}

            {/* NÚT KẾT THÚC BUỔI HỌC */}
            <div className="mt-6 md:mt-8 pt-4 md:pt-5 border-t-2 border-gray-100 flex justify-center">
              <button 
                onClick={handleEndSession}
                className="flex items-center gap-2 md:gap-3 text-white bg-rose-500 hover:bg-rose-600 shadow-[0_5px_0_rgb(190,18,60)] active:translate-y-1 active:shadow-none font-extrabold text-base md:text-lg transition-all py-3 px-6 md:py-3 md:px-8 rounded-full"
              >
                <StopCircle size={22} className="md:w-6 md:h-6" /> Kết thúc phiên học
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* NÚT RESET ẨN BÊN DƯỚI DÀNH CHO PHỤ HUYNH */}
      <div className="mt-6 md:mt-10">
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

import Fireworks from './Fireworks';

// Màn kết thúc dùng chung cho các game (pháo hoa khi lập kỷ lục + hộp chúc mừng).
// Dùng: <GameOverModal over={over} newRecord={newRecord} emoji="🤖" loseTitle="Hết mạng rồi!" onRestart={restart}>
//         <>Nội dung dòng phụ (điểm, đợt...)</>
//       </GameOverModal>
export default function GameOverModal({ over, newRecord, emoji = '🎮', loseTitle = 'Hết lượt rồi!', onRestart, children }) {
  if (!over) return null;
  return (
    <>
      {newRecord && <Fireworks />}
      <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
        <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
          <div className="text-4xl">{newRecord ? '🏆' : emoji}</div>
          <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : loseTitle}</h2>
          <p className="text-sm font-bold text-slate-500">{children}</p>
          <button
            type="button"
            onClick={onRestart}
            className="mt-1 rounded-full bg-gradient-to-b from-orange-400 to-orange-500 px-7 py-3 text-lg font-black text-white shadow-[0_4px_0_rgb(234,88,12)] transition active:translate-y-0.5"
          >
            Chơi lại 🔁
          </button>
        </div>
      </div>
    </>
  );
}

import { useState, useRef, useMemo } from 'react';
import { Clock, Gem, Undo2, RotateCcw, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { drawingLessons } from './DrawingData';

const DRAW_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#111827'];
const VIEWBOX = 300;

const shapesUpTo = (steps, index) => steps.slice(0, index).map(step => step.shapes).join('');

const emojiFont = { fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif' };

export default function DrawingApp({ onBack, robuxBalance = 0, drawingTimeLeftSec = 0, unlimitedTime = false }) {
    const [selectedLessonId, setSelectedLessonId] = useState(null);
    const [stepIndex, setStepIndex] = useState(0);
    const [mode, setMode] = useState('guide'); // 'guide' | 'draw'
    const [strokes, setStrokes] = useState([]);
    const [currentStroke, setCurrentStroke] = useState(null);
    const [activeColor, setActiveColor] = useState(DRAW_COLORS[0]);
    const drawingRef = useRef(false);
    const currentStrokeRef = useRef(null);
    const svgRef = useRef(null);

    const lesson = useMemo(() => drawingLessons.find(item => item.id === selectedLessonId) || null, [selectedLessonId]);
    const timeLabel = unlimitedTime
        ? '∞'
        : `${Math.floor(Math.max(0, drawingTimeLeftSec) / 60)}:${String(Math.max(0, drawingTimeLeftSec) % 60).padStart(2, '0')}`;
    const isLastStep = lesson && stepIndex >= lesson.steps.length - 1;

    const openLesson = (id) => {
        setSelectedLessonId(id);
        setStepIndex(0);
        setMode('guide');
        setStrokes([]);
        setCurrentStroke(null);
    };
    const backToGallery = () => setSelectedLessonId(null);

    const pointFromEvent = (event) => {
        const svg = svgRef.current;
        if (!svg) return null;
        const rect = svg.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * VIEWBOX;
        const y = ((event.clientY - rect.top) / rect.height) * VIEWBOX;
        return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
    };
    const handlePointerDown = (event) => {
        event.preventDefault();
        const point = pointFromEvent(event);
        if (!point) return;
        drawingRef.current = true;
        const stroke = { color: activeColor, points: [point] };
        currentStrokeRef.current = stroke;
        setCurrentStroke({ ...stroke, points: [...stroke.points] });
        try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* ignore */ }
    };
    const handlePointerMove = (event) => {
        if (!drawingRef.current) return;
        const point = pointFromEvent(event);
        if (!point) return;
        const stroke = currentStrokeRef.current;
        stroke.points.push(point);
        setCurrentStroke({ color: stroke.color, points: [...stroke.points] });
    };
    const handlePointerUp = () => {
        if (!drawingRef.current) return;
        drawingRef.current = false;
        const stroke = currentStrokeRef.current;
        if (stroke && stroke.points.length > 0) {
            setStrokes(prev => [...prev, stroke]);
        }
        currentStrokeRef.current = null;
        setCurrentStroke(null);
    };
    const undoStroke = () => setStrokes(prev => prev.slice(0, -1));
    const clearStrokes = () => { setStrokes([]); setCurrentStroke(null); };
    const strokeToPoints = (stroke) => stroke.points.map(point => point.join(',')).join(' ');

    return (
        <div className="fixed inset-0 z-50 flex h-[100dvh] w-full items-stretch justify-center overflow-hidden bg-white md:items-center md:bg-[#333a42]">
            <div className="relative flex h-full min-h-0 w-full max-w-[460px] flex-col bg-white shadow-[0_15px_35px_rgba(0,0,0,0.5)] md:h-[92vh] md:max-h-[860px] md:max-w-[520px] md:rounded-[28px] md:border-[6px] md:border-[#1a202c]">
                <header className="shrink-0 border-b border-[#e2e8f0] bg-[#f8fafc]">
                    <div className="flex h-12 items-center justify-between gap-1.5 px-2.5 py-1">
                        <button
                            type="button"
                            onClick={lesson ? backToGallery : onBack}
                            className="h-9 shrink-0 rounded-lg bg-[#e2e8f0] px-3 text-sm font-black text-[#4a5568] transition hover:bg-[#cbd5e0]"
                        >
                            {lesson ? 'Bài khác' : 'Trở lại'}
                        </button>
                        <h1 className="m-0 min-w-0 flex-1 truncate text-center text-base font-black text-[#2d3748]">
                            {lesson ? lesson.name : 'Học Vẽ Từng Bước'}
                        </h1>
                        <div className="flex shrink-0 items-center gap-1">
                            <div className="flex h-9 items-center gap-1 rounded-full bg-emerald-100 px-2 text-xs font-black text-emerald-700">
                                <Clock size={14} />{timeLabel}
                            </div>
                            <div className="flex h-9 items-center gap-1 rounded-full bg-yellow-100 px-2 text-xs font-black text-yellow-700">
                                <Gem size={14} className="fill-yellow-200" />{robuxBalance}
                            </div>
                        </div>
                    </div>
                </header>

                {!lesson && (
                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                        <p className="mb-3 text-center text-sm font-bold text-slate-500">Chọn hình bé muốn tập vẽ nhé!</p>
                        <div className="grid grid-cols-2 gap-3">
                            {drawingLessons.map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => openLesson(item.id)}
                                    className="flex flex-col items-center gap-1 rounded-2xl border-2 border-pink-100 bg-pink-50 p-4 shadow-sm transition hover:bg-pink-100"
                                >
                                    <span className="text-4xl" style={emojiFont}>{item.emoji}</span>
                                    <span className="text-sm font-black text-pink-700">{item.name}</span>
                                    <span className="text-[11px] font-bold text-pink-400">{item.steps.length} bước</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {lesson && (
                    <div className="flex min-h-0 flex-1 flex-col justify-evenly gap-1">
                        <div className="grid shrink-0 grid-cols-2 gap-1.5 px-2.5 py-1.5">
                            <button
                                type="button"
                                onClick={() => setMode('guide')}
                                className={`h-11 rounded-full text-sm font-black transition ${mode === 'guide' ? 'bg-[#3182ce] text-white shadow' : 'bg-[#e2e8f0] text-[#4a5568]'}`}
                            >
                                Xem hướng dẫn
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('draw')}
                                className={`h-11 rounded-full text-sm font-black transition ${mode === 'draw' ? 'bg-[#3182ce] text-white shadow' : 'bg-[#e2e8f0] text-[#4a5568]'}`}
                            >
                                Vẽ theo
                            </button>
                        </div>

                        <div className="relative flex min-h-0 shrink items-center justify-center overflow-hidden bg-[#f1f5f9] px-2 py-1">
                            {mode === 'guide' ? (
                                <svg viewBox="0 0 300 300" className="h-auto w-full max-w-full max-h-[48vh]" style={{ aspectRatio: '1 / 1' }} xmlns="http://www.w3.org/2000/svg">
                                    <rect x="4" y="4" width="292" height="292" rx="16" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
                                    <g stroke="#cbd5e1" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: shapesUpTo(lesson.steps, stepIndex) }} />
                                    <g stroke="#ef4444" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: lesson.steps[stepIndex].shapes }} />
                                </svg>
                            ) : (
                                <svg
                                    ref={svgRef}
                                    viewBox="0 0 300 300"
                                    className="h-auto w-full max-w-full max-h-[48vh] touch-none"
                                    style={{ aspectRatio: '1 / 1' }}
                                    xmlns="http://www.w3.org/2000/svg"
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerLeave={handlePointerUp}
                                >
                                    <rect x="4" y="4" width="292" height="292" rx="16" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
                                    <g opacity="0.72" dangerouslySetInnerHTML={{ __html: lesson.finished || '' }} />
                                    {strokes.map((stroke, index) => (
                                        <polyline key={index} points={strokeToPoints(stroke)} stroke={stroke.color} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                    ))}
                                    {currentStroke && (
                                        <polyline points={strokeToPoints(currentStroke)} stroke={currentStroke.color} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                    )}
                                </svg>
                            )}
                        </div>

                        {mode === 'guide' ? (
                            <div className="shrink-0 border-t border-[#e2e8f0] bg-white px-3 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-2">
                                <div className="mb-2 rounded-xl bg-pink-50 px-3 py-2 text-center text-sm font-black text-pink-700">
                                    Bước {stepIndex + 1}: {lesson.steps[stepIndex].hint}
                                </div>
                                <div className="mb-2 flex items-center justify-center gap-1.5">
                                    {lesson.steps.map((_, index) => (
                                        <span key={index} className={`h-2.5 rounded-full transition-all ${index === stepIndex ? 'w-5 bg-[#3182ce]' : 'w-2.5 bg-slate-300'}`} />
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setStepIndex(index => Math.max(0, index - 1))}
                                        disabled={stepIndex === 0}
                                        className="flex h-11 flex-1 items-center justify-center gap-1 rounded-full bg-[#c5d0de] text-sm font-black text-slate-700 transition disabled:opacity-40"
                                    >
                                        <ChevronLeft size={18} />Bước trước
                                    </button>
                                    {isLastStep ? (
                                        <button
                                            type="button"
                                            onClick={() => setMode('draw')}
                                            className="flex h-11 flex-1 items-center justify-center gap-1 rounded-full bg-emerald-500 text-sm font-black text-white shadow-[0_4px_0_rgb(16,152,96)] transition active:translate-y-0.5"
                                        >
                                            <Check size={18} />Vẽ thử nào!
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setStepIndex(index => Math.min(lesson.steps.length - 1, index + 1))}
                                            className="flex h-11 flex-1 items-center justify-center gap-1 rounded-full bg-[#3182ce] text-sm font-black text-white shadow-[0_4px_0_rgb(37,99,181)] transition active:translate-y-0.5"
                                        >
                                            Bước tiếp<ChevronRight size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="shrink-0 border-t border-[#e2e8f0] bg-white px-3 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-2">
                                <div className="mb-2 flex items-center justify-center gap-2">
                                    {DRAW_COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setActiveColor(color)}
                                            style={{ backgroundColor: color }}
                                            className={`h-12 w-12 rounded-full border-2 shadow transition ${activeColor === color ? 'scale-110 border-[#1a202c]' : 'border-white'}`}
                                            aria-label={`Chọn màu ${color}`}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={undoStroke}
                                        disabled={strokes.length === 0}
                                        className="flex h-11 flex-1 items-center justify-center gap-1 rounded-full bg-[#c5d0de] text-sm font-black text-slate-700 transition disabled:opacity-40"
                                    >
                                        <Undo2 size={18} />Hoàn tác
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearStrokes}
                                        className="flex h-11 flex-1 items-center justify-center gap-1 rounded-full bg-[#f9a8a8] text-sm font-black text-rose-700 transition hover:bg-[#f78888]"
                                    >
                                        <RotateCcw size={18} />Xóa hết
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

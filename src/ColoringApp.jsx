import { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Redo2, Undo2 } from 'lucide-react';
import { animalEmojis, pokemonEmojis, colorThemes, coloringSVGs } from './ColoringData';

const EMPTY_FILL_VALUES = new Set(['', '#ffffff', '#fff', 'white', 'none']);

let sharedAudioContext = null;

const getAudioContext = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
        sharedAudioContext = new AudioContext();
    }

    if (sharedAudioContext.state === 'suspended') {
        void sharedAudioContext.resume();
    }

    return sharedAudioContext;
};

const playTone = (ctx, frequency, start, duration, volume = 0.08, type = 'sine') => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
};

const playPopSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    playTone(ctx, 460, now, 0.06, 0.045, 'triangle');
    playTone(ctx, 820, now + 0.035, 0.09, 0.075, 'sine');
};

const playTadaSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        playTone(ctx, frequency, now + index * 0.08, 0.16, 0.075, 'sine');
    });

    for (let burst = 0; burst < 5; burst += 1) {
        const duration = 0.075;
        const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let index = 0; index < data.length; index += 1) {
            data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
        }

        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        const start = now + 0.28 + burst * 0.055;

        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(start);
    }
};

const normalizeFill = (fill) => (fill || '').trim().toLowerCase();
const isFilledColor = (fill) => !EMPTY_FILL_VALUES.has(normalizeFill(fill));

export default function ColoringApp({ onBack }) {
    const [currentCategory, setCurrentCategory] = useState('animal');
    const [currentLevel, setCurrentLevel] = useState(1);
    const [activeTheme, setActiveTheme] = useState('nature');
    const [activeColor, setActiveColor] = useState(colorThemes.nature[0]);
    const [progress, setProgress] = useState(0);
    const [historyStatus, setHistoryStatus] = useState({ canUndo: false, canRedo: false });
    const svgContainerRef = useRef(null);
    const currentLevelRef = useRef(currentLevel);
    const undoStacksRef = useRef({});
    const redoStacksRef = useRef({});
    const progressByLevelRef = useRef({});

    const syncHistoryStatus = useCallback((level = currentLevelRef.current) => {
        const nextStatus = {
            canUndo: (undoStacksRef.current[level]?.length || 0) > 0,
            canRedo: (redoStacksRef.current[level]?.length || 0) > 0,
        };

        setHistoryStatus(previous => (
            previous.canUndo === nextStatus.canUndo && previous.canRedo === nextStatus.canRedo
                ? previous
                : nextStatus
        ));
    }, []);

    const getCurrentSvgContainer = useCallback((level = currentLevelRef.current) => {
        if (!svgContainerRef.current) return null;
        return svgContainerRef.current.querySelector(`[data-id="${level}"]`);
    }, []);

    const prepareColoringElements = useCallback(() => {
        if (!svgContainerRef.current) return;

        svgContainerRef.current.querySelectorAll('.svg-wrapper').forEach(wrapper => {
            wrapper.querySelectorAll('.colorable').forEach((element, index) => {
                const initialFill = element.getAttribute('fill') || '#ffffff';
                const tagName = element.tagName.toLowerCase();

                element.dataset.colorIndex = String(index);
                element.dataset.initialFill = initialFill;
                element.dataset.progressIgnore = normalizeFill(initialFill) === 'none' || tagName === 'line'
                    ? 'true'
                    : 'false';
            });
        });
    }, []);

    const updateProgress = useCallback((level = currentLevelRef.current, options = {}) => {
        const currentSvgContainer = getCurrentSvgContainer(level);
        if (!currentSvgContainer) return 0;

        const colorableElements = Array.from(currentSvgContainer.querySelectorAll('.colorable'))
            .filter(element => element.dataset.progressIgnore !== 'true');

        if (colorableElements.length === 0) {
            setProgress(0);
            progressByLevelRef.current[level] = 0;
            return 0;
        }

        const colored = colorableElements.filter(element => isFilledColor(element.getAttribute('fill'))).length;
        const nextProgress = Math.round((colored / colorableElements.length) * 100);
        const previousProgress = progressByLevelRef.current[level] || 0;

        progressByLevelRef.current[level] = nextProgress;
        if (level === currentLevelRef.current) {
            setProgress(nextProgress);
        }

        if (options.celebrate && nextProgress === 100 && previousProgress < 100) {
            playTadaSound();
        }

        return nextProgress;
    }, [getCurrentSvgContainer]);

    useEffect(() => {
        if (!svgContainerRef.current) return;

        const html = Object.entries(coloringSVGs)
            .map(([id, svg]) => (
                `<div data-id="${id}" class="svg-wrapper w-full h-full max-w-full max-h-full flex items-center justify-center ${parseInt(id, 10) === currentLevelRef.current ? 'block' : 'hidden'}">${svg}</div>`
            ))
            .join('');

        svgContainerRef.current.innerHTML = html;
        prepareColoringElements();
        setTimeout(() => updateProgress(), 50);
    }, [prepareColoringElements, updateProgress]);

    useEffect(() => {
        if (!svgContainerRef.current) return;

        const wrappers = svgContainerRef.current.querySelectorAll('.svg-wrapper');
        wrappers.forEach(wrapper => {
            if (parseInt(wrapper.getAttribute('data-id'), 10) === currentLevel) {
                wrapper.classList.remove('hidden');
                wrapper.classList.add('block');
            } else {
                wrapper.classList.remove('block');
                wrapper.classList.add('hidden');
            }
        });

        setTimeout(() => updateProgress(currentLevel), 50);
    }, [currentLevel, updateProgress]);

    const pushHistoryEntry = (entry) => {
        const level = entry.level;
        undoStacksRef.current[level] = [...(undoStacksRef.current[level] || []), entry];
        redoStacksRef.current[level] = [];
        syncHistoryStatus(level);
    };

    const applyHistoryEntry = (entry, direction) => {
        const currentSvgContainer = getCurrentSvgContainer(entry.level);
        if (!currentSvgContainer) return;

        const colorableElements = currentSvgContainer.querySelectorAll('.colorable');
        const changes = entry.type === 'batch' ? entry.changes : [entry];

        changes.forEach(change => {
            const element = colorableElements[change.index];
            if (!element) return;
            element.setAttribute('fill', direction === 'undo' ? change.before : change.after);
        });
    };

    const undo = () => {
        const level = currentLevelRef.current;
        const undoStack = undoStacksRef.current[level] || [];
        const entry = undoStack[undoStack.length - 1];
        if (!entry) return;

        undoStacksRef.current[level] = undoStack.slice(0, -1);
        redoStacksRef.current[level] = [...(redoStacksRef.current[level] || []), entry];
        applyHistoryEntry(entry, 'undo');
        updateProgress(level);
        syncHistoryStatus(level);
    };

    const redo = () => {
        const level = currentLevelRef.current;
        const redoStack = redoStacksRef.current[level] || [];
        const entry = redoStack[redoStack.length - 1];
        if (!entry) return;

        redoStacksRef.current[level] = redoStack.slice(0, -1);
        undoStacksRef.current[level] = [...(undoStacksRef.current[level] || []), entry];
        applyHistoryEntry(entry, 'redo');
        updateProgress(level, { celebrate: true });
        syncHistoryStatus(level);
    };

    const handleCategorySwitch = (category) => {
        const nextLevel = category === 'animal' ? 1 : 31;
        currentLevelRef.current = nextLevel;
        setCurrentCategory(category);
        setCurrentLevel(nextLevel);
        syncHistoryStatus(nextLevel);
    };

    const handleLevelSelect = (id, event) => {
        currentLevelRef.current = id;
        setCurrentLevel(id);
        syncHistoryStatus(id);
        if (event?.currentTarget && typeof event.currentTarget.scrollIntoView === 'function') {
            event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    };

    const handleSvgClick = (event) => {
        const target = event.target;
        const className = target?.getAttribute?.('class') || '';
        if (!className.includes('colorable') || !activeColor) return;

        const previousFill = target.getAttribute('fill') || target.dataset.initialFill || '#ffffff';
        if (normalizeFill(previousFill) === normalizeFill(activeColor)) return;

        const index = Number(target.dataset.colorIndex);
        if (!Number.isFinite(index)) return;

        target.setAttribute('fill', activeColor);
        pushHistoryEntry({
            type: 'fill',
            level: currentLevelRef.current,
            index,
            before: previousFill,
            after: activeColor,
        });
        playPopSound();
        updateProgress(currentLevelRef.current, { celebrate: true });
    };

    const clearCanvas = () => {
        const level = currentLevelRef.current;
        const currentSvgContainer = getCurrentSvgContainer(level);
        if (!currentSvgContainer) return;

        const changes = [];
        currentSvgContainer.querySelectorAll('.colorable').forEach(element => {
            const before = element.getAttribute('fill') || element.dataset.initialFill || '#ffffff';
            const after = element.dataset.initialFill || '#ffffff';
            const index = Number(element.dataset.colorIndex);

            if (Number.isFinite(index) && normalizeFill(before) !== normalizeFill(after)) {
                changes.push({ index, before, after });
                element.setAttribute('fill', after);
            }
        });

        if (changes.length > 0) {
            pushHistoryEntry({ type: 'batch', level, changes });
        }

        updateProgress(level);
    };

    const list = currentCategory === 'animal' ? animalEmojis : pokemonEmojis;
    const startIndex = currentCategory === 'animal' ? 1 : 31;
    const { canUndo, canRedo } = historyStatus;

    return (
        <div className="fixed inset-0 z-50 flex h-[100dvh] w-full items-stretch justify-center overflow-hidden bg-white md:items-center md:bg-[#333a42]">
            <div className="relative flex h-full min-h-0 w-full max-w-[430px] flex-col bg-white shadow-[0_15px_35px_rgba(0,0,0,0.5)] md:h-[85vh] md:max-h-[765px] md:rounded-[32px] md:border-8 md:border-[#1a202c]">
                <header className="shrink-0 border-b border-[#e2e8f0] bg-[#f8fafc] text-center">
                    <div className="flex h-9 items-center justify-between gap-2 px-3 pt-1">
                        <button
                            type="button"
                            onClick={onBack}
                            className="h-7 shrink-0 rounded-lg bg-[#e2e8f0] px-2 text-xs font-black text-[#4a5568] transition hover:bg-[#cbd5e0]"
                        >
                            Trở lại
                        </button>
                        <h1 className="m-0 min-w-0 flex-1 truncate text-sm font-black text-[#2d3748]">Bé Tập Phối Màu</h1>
                        <div className="w-[58px] shrink-0" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 px-3 py-1">
                        <button
                            type="button"
                            className={`min-h-8 rounded-full border-none px-2 text-xs font-black transition-all ${currentCategory === 'animal' ? 'bg-[#3182ce] text-white shadow-[0_3px_6px_rgba(49,130,206,0.3)]' : 'bg-[#e2e8f0] text-[#4a5568]'}`}
                            onClick={() => handleCategorySwitch('animal')}
                        >
                            Động Vật (30)
                        </button>
                        <button
                            type="button"
                            className={`min-h-8 rounded-full border-none px-2 text-xs font-black transition-all ${currentCategory === 'pokemon' ? 'bg-[#3182ce] text-white shadow-[0_3px_6px_rgba(49,130,206,0.3)]' : 'bg-[#e2e8f0] text-[#4a5568]'}`}
                            onClick={() => handleCategorySwitch('pokemon')}
                        >
                            Pokemon (30)
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto px-3 pb-2 pt-1 scroll-smooth scrollbar-none">
                        {list.map((emoji, index) => {
                            const id = startIndex + index;
                            return (
                                <button
                                    type="button"
                                    key={id}
                                    onClick={(event) => handleLevelSelect(id, event)}
                                    className={`flex h-10 min-w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent bg-[#edf2f7] text-xl text-gray-900 shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition-all ${id === currentLevel ? 'scale-110 border-[#3182ce] bg-[#ebf8ff] shadow-[0_4px_8px_rgba(49,130,206,0.2)]' : ''}`}
                                >
                                    <span style={{ fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif' }}>
                                        {emoji || '?'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </header>

                <div
                    className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#f1f5f9] p-1.5"
                    ref={svgContainerRef}
                    onClick={handleSvgClick}
                />

                <div className="flex shrink-0 flex-col gap-2 border-t border-[#e2e8f0] bg-white px-3 py-2">
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5">
                        {Object.keys(colorThemes).map(theme => (
                            <button
                                type="button"
                                key={theme}
                                onClick={() => {
                                    setActiveTheme(theme);
                                    setActiveColor(colorThemes[theme][0]);
                                }}
                                className={`min-h-8 rounded-lg border-none px-1 text-xs font-black capitalize transition-colors ${activeTheme === theme ? 'bg-[#2d3748] text-white' : 'bg-[#edf2f7] text-[#718096]'}`}
                            >
                                {theme}
                            </button>
                        ))}
                        <label
                            className="relative grid h-8 w-10 cursor-pointer place-items-center rounded-lg border-2 border-[#dbe4ee] bg-white shadow-sm"
                            title="Chọn màu tự do"
                            aria-label="Chọn màu tự do"
                        >
                            <input
                                type="color"
                                value={activeColor}
                                onChange={(event) => setActiveColor(event.target.value)}
                                className="h-6 w-7 cursor-pointer rounded-md border-0 bg-transparent p-0"
                                aria-label="Chọn màu tự do"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-10 justify-items-center gap-1.5">
                        {colorThemes[activeTheme].map((color, index) => (
                            <button
                                type="button"
                                key={`${activeTheme}-${index}`}
                                onClick={() => setActiveColor(color)}
                                style={{ backgroundColor: color }}
                                className={`h-8 w-8 cursor-pointer rounded-full border-[3px] shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition-transform md:h-9 md:w-9 ${normalizeFill(activeColor) === normalizeFill(color) ? 'scale-110 border-[#1a202c]' : 'border-white'}`}
                                aria-label={`Chọn màu ${index + 1}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-[#f8fafc] px-2.5 py-1.5 text-xs font-black text-[#718096]">
                        <span>Tiến độ</span>
                        <div className="mx-2.5 h-2 flex-1 overflow-hidden rounded-full bg-[#e2e8f0]">
                            <div className="h-full bg-[#48bb78] transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                        <span>{progress}%</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                        <button
                            type="button"
                            onClick={undo}
                            disabled={!canUndo}
                            className="flex min-h-8 items-center justify-center gap-1 rounded-lg bg-[#edf2f7] px-2 text-xs font-black text-[#334155] transition disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Undo2 size={15} /> Hoàn tác
                        </button>
                        <button
                            type="button"
                            onClick={redo}
                            disabled={!canRedo}
                            className="flex min-h-8 items-center justify-center gap-1 rounded-lg bg-[#edf2f7] px-2 text-xs font-black text-[#334155] transition disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Redo2 size={15} /> Làm lại
                        </button>
                        <button
                            type="button"
                            onClick={clearCanvas}
                            className="flex min-h-8 items-center justify-center gap-1 rounded-lg bg-[#fed7d7] px-2 text-xs font-black text-[#c53030]"
                        >
                            <RotateCcw size={15} /> Vẽ lại
                        </button>
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }

                .artwork-svg {
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                    object-fit: contain;
                    display: block;
                    animation: fadeIn 0.25s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.96); }
                    to { opacity: 1; transform: scale(1); }
                }

                .colorable {
                    cursor: pointer;
                    stroke: #1a202c;
                    stroke-width: 4px;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    transition: fill 0.18s ease;
                }
            `}} />
        </div>
    );
}

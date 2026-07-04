import { useState, useEffect, useRef, useCallback } from 'react';
import { animalEmojis, pokemonEmojis, colorThemes, coloringSVGs } from './ColoringData';

export default function ColoringApp({ onBack }) {
    const [currentCategory, setCurrentCategory] = useState('animal');
    const [currentLevel, setCurrentLevel] = useState(1);
    const [activeTheme, setActiveTheme] = useState('nature');
    const [activeColor, setActiveColor] = useState(colorThemes.nature[0]);
    const [progress, setProgress] = useState(0);
    const svgContainerRef = useRef(null);
    const currentLevelRef = useRef(currentLevel);

    useEffect(() => {
        currentLevelRef.current = currentLevel;
    }, [currentLevel]);

    const updateProgress = useCallback((level = currentLevelRef.current) => {
        if (!svgContainerRef.current) return;
        const currentSvgContainer = svgContainerRef.current.querySelector(`[data-id="${level}"]`);
        if (!currentSvgContainer) return;

        const colorableElements = currentSvgContainer.querySelectorAll('.colorable');
        if (colorableElements.length === 0) {
            setProgress(0);
            return;
        }

        let colored = 0;
        colorableElements.forEach(el => {
            const fill = (el.getAttribute('fill') || '').trim().toLowerCase();
            if (fill && fill !== '#ffffff' && fill !== '#fff' && fill !== 'white' && fill !== 'none') {
                colored++;
            }
        });
        setProgress(Math.round((colored / colorableElements.length) * 100));
    }, []);

    // Inject SVGs ONCE on mount
    useEffect(() => {
        if (!svgContainerRef.current) return;
        let html = '';
        for (const [id, svg] of Object.entries(coloringSVGs)) {
            html += `<div data-id="${id}" class="svg-wrapper w-full h-full max-w-full max-h-full flex items-center justify-center ${parseInt(id, 10) === currentLevelRef.current ? 'block' : 'hidden'}">${svg}</div>`;
        }
        svgContainerRef.current.innerHTML = html;
        setTimeout(() => updateProgress(), 50);
    }, [updateProgress]);

    // Toggle visibility when level changes
    useEffect(() => {
        if (!svgContainerRef.current) return;
        const wrappers = svgContainerRef.current.querySelectorAll('.svg-wrapper');
        wrappers.forEach(w => {
            if (parseInt(w.getAttribute('data-id'), 10) === currentLevel) {
                w.classList.remove('hidden');
                w.classList.add('block');
            } else {
                w.classList.remove('block');
                w.classList.add('hidden');
            }
        });
        setTimeout(() => updateProgress(currentLevel), 50);
    }, [currentLevel, updateProgress]);

    const handleCategorySwitch = (category) => {
        setCurrentCategory(category);
        const firstId = category === 'animal' ? 1 : 31;
        setCurrentLevel(firstId);
    };

    const handleLevelSelect = (id, e) => {
        setCurrentLevel(id);
        if (e && e.currentTarget && typeof e.currentTarget.scrollIntoView === 'function') {
            e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    };

    const handleSvgClick = (e) => {
        const target = e.target;
        const className = target.getAttribute('class') || '';
        if (className.includes('colorable')) {
            if (activeColor) {
                target.setAttribute('fill', activeColor);
                updateProgress();
            }
        }
    };

    const clearCanvas = () => {
        if (!svgContainerRef.current) return;
        const currentSvgContainer = svgContainerRef.current.querySelector(`[data-id="${currentLevel}"]`);
        if (!currentSvgContainer) return;
        
        currentSvgContainer.querySelectorAll('.colorable').forEach(el => {
            el.setAttribute('fill', '#ffffff');
        });
        updateProgress();
    };

    const saveArtwork = () => {
        if (!svgContainerRef.current) return;
        const currentSvgContainer = svgContainerRef.current.querySelector(`[data-id="${currentLevel}"]`);
        if (!currentSvgContainer) return;
        
        const svgElement = currentSvgContainer.querySelector('svg');
        if (!svgElement) return;

        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svgElement);
        
        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 800;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 800, 800);
            
            const a = document.createElement('a');
            a.download = `be-to-mau-${currentCategory}-${currentLevel}.png`;
            a.href = canvas.toDataURL('image/png');
            a.click();
        };
    };

    const list = currentCategory === 'animal' ? animalEmojis : pokemonEmojis;
    const startIndex = currentCategory === 'animal' ? 1 : 31;

    return (
        <div className="flex justify-center items-center min-h-screen bg-[#333a42] p-0 m-0 w-full fixed inset-0 overflow-hidden z-50">
            <div className="bg-white w-full h-full max-w-[430px] max-h-[765px] flex flex-col relative shadow-[0_15px_35px_rgba(0,0,0,0.5)] md:rounded-[32px] md:border-8 md:border-[#1a202c] md:h-[85vh] md:w-[calc(85vh*9/16)]">
                {/* 1. Header */}
                <header className="pt-3 bg-[#f8fafc] border-b border-[#e2e8f0] text-center shrink-0">
                    <div className="flex justify-between items-center px-4 mb-2">
                        <button onClick={onBack} className="text-[#4a5568] font-bold px-2 py-1 bg-[#e2e8f0] rounded-xl hover:bg-[#cbd5e0] transition text-xs">
                            ⬅ Trở lại
                        </button>
                        <h1 className="text-[#2d3748] text-base font-bold m-0 flex-1">🎨 Bé Tập Phối Màu</h1>
                        <div className="w-12"></div> {/* Spacer to center the title */}
                    </div>
                    
                    {/* Tabs chuyển đổi danh mục */}
                    <div className="flex justify-center gap-2.5 mb-3 px-4">
                        <button 
                            className={`flex-1 p-2 border-none rounded-full text-[13px] font-bold cursor-pointer transition-all ${currentCategory === 'animal' ? 'bg-[#3182ce] text-white shadow-[0_4px_6px_rgba(49,130,206,0.3)]' : 'bg-[#e2e8f0] text-[#4a5568]'}`}
                            onClick={() => handleCategorySwitch('animal')}
                        >
                            🦁 Động Vật (30)
                        </button>
                        <button 
                            className={`flex-1 p-2 border-none rounded-full text-[13px] font-bold cursor-pointer transition-all ${currentCategory === 'pokemon' ? 'bg-[#3182ce] text-white shadow-[0_4px_6px_rgba(49,130,206,0.3)]' : 'bg-[#e2e8f0] text-[#4a5568]'}`}
                            onClick={() => handleCategorySwitch('pokemon')}
                        >
                            ⚡ Pokemon (30)
                        </button>
                    </div>

                {/* Thanh cuộn ngang chọn con vật/pokemon */}
                <div className="flex gap-2.5 overflow-x-auto px-4 pb-3 scroll-smooth scrollbar-none">
                    {list.map((emoji, index) => {
                        const id = startIndex + index;
                        return (
                            <button 
                                key={id}
                                onClick={(e) => handleLevelSelect(id, e)}
                                className={`text-2xl text-gray-900 bg-[#edf2f7] border-2 border-transparent rounded-full min-w-[50px] h-[50px] flex items-center justify-center cursor-pointer shrink-0 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.05)] ${id === currentLevel ? 'bg-[#ebf8ff] border-[#3182ce] scale-110 shadow-[0_4px_8px_rgba(49,130,206,0.2)]' : ''}`}
                            >
                                <span style={{ fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif' }}>
                                    {emoji || '?'}
                                </span>
                            </button>
                        );
                    })}
                </div>
                </header>

                {/* 2. Khu vực Canvas */}
                <div 
                    className="flex-1 min-h-0 bg-[#f1f5f9] flex justify-center items-center p-4 overflow-hidden relative" 
                    ref={svgContainerRef}
                    onClick={handleSvgClick}
                >
                    {/* SVGs are injected via useEffect to prevent React from re-rendering and wiping DOM modifications */}
                </div>

                {/* 3. Khu vực điều khiển phía dưới */}
                <div className="bg-white border-t border-[#e2e8f0] p-3 px-4 flex flex-col gap-3 shrink-0">
                    <div className="flex gap-1.5">
                        {Object.keys(colorThemes).map(theme => (
                            <button 
                                key={theme}
                                onClick={() => { setActiveTheme(theme); setActiveColor(colorThemes[theme][0]); }}
                                className={`flex-1 border-none p-2 text-xs font-bold rounded-lg cursor-pointer transition-colors capitalize ${activeTheme === theme ? 'bg-[#2d3748] text-white' : 'bg-[#edf2f7] text-[#718096]'}`}
                            >
                                {theme}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-5 gap-2.5 justify-items-center">
                        {colorThemes[activeTheme].map((color, index) => (
                            <div 
                                key={`${activeTheme}-${index}`}
                                onClick={() => setActiveColor(color)}
                                style={{ backgroundColor: color }}
                                className={`w-11 h-11 rounded-full cursor-pointer border-4 transition-transform shadow-[0_2px_6px_rgba(0,0,0,0.15)] ${activeColor === color ? 'border-[#1a202c] scale-110' : 'border-white'}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-[#718096] bg-[#f8fafc] px-3 py-2 rounded-lg">
                        <span>Tiến độ:</span>
                        <div className="flex-1 bg-[#e2e8f0] h-2 rounded-full mx-2.5 overflow-hidden">
                            <div className="bg-[#48bb78] h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                        <span>{progress}%</span>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={clearCanvas} className="flex-1 py-2.5 border-none rounded-xl text-[13px] font-bold cursor-pointer bg-[#fed7d7] text-[#c53030]">
                            🗑️ Vẽ lại
                        </button>
                        <button onClick={saveArtwork} className="flex-1 py-2.5 border-none rounded-xl text-[13px] font-bold cursor-pointer bg-[#c6f6d5] text-[#22543d]">
                            💾 Lưu ảnh
                        </button>
                    </div>
                </div>
            </div>
            {/* Global style override cho class scrollbar-none của mobile horizontal scroll, và CSS nội bộ của SVG */}
            <style dangerouslySetInnerHTML={{__html: `
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
                
                .artwork-svg {
                    width: 100%;
                    height: 100%;
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    display: block;
                    animation: fadeIn 0.3s ease;
                }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                
                .colorable {
                    cursor: pointer;
                    stroke: #1a202c;
                    stroke-width: 4px;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    transition: fill 0.2s ease;
                }
            `}} />
        </div>
    );
}

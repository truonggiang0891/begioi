import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Clock, Cuboid, Eraser, Gem, LockKeyhole, Minus, Plus, RotateCcw, Redo2, Sparkles, Square, Undo2, X } from 'lucide-react';
import { animalEmojis, animalNames, pokemonEmojis, pokemonNames, colorThemes, coloringSVGs } from './ColoringData';

const EMPTY_FILL_VALUES = new Set(['', '#ffffff', '#fff', 'white', 'none']);
const THEME_LABELS = {
    nature: 'Tự Nhiên',
    candy: 'Kẹo Ngọt',
    magic: 'Kỳ Ảo',
};
const MIN_ZOOM = 0.75;
const DEFAULT_ZOOM = 1;
const MAX_ZOOM = 1.75;
const ZOOM_STEP = 0.15;
const THREE_PREVIEW_READY_PROGRESS = 100;
const BACKGROUND_CONFIRM_MS = 2200;
// Mỗi palette: [nền dịu, màu chủ đạo (lặp lại nhiều lần) + sắc độ nhạt + điểm nhấn hài hòa]
const SAMPLE_PALETTES = [
    ['#eaf6ff', '#5eb3e4', '#a9d8f0', '#5eb3e4', '#5fc9c2', '#5eb3e4', '#a9d8f0', '#f6a58f'],
    ['#fff4ec', '#f7936f', '#ffc9a3', '#f7936f', '#ffd36e', '#f7936f', '#ffc9a3', '#ef8fa0'],
    ['#eef8ec', '#7cc47a', '#bfe3ab', '#7cc47a', '#d6e36b', '#66c6a8', '#7cc47a', '#bfe3ab'],
    ['#f5f0fb', '#a78bd0', '#cdbce8', '#a78bd0', '#e6a3cf', '#a78bd0', '#cdbce8', '#8fa0e0'],
    ['#fffaf0', '#ffc857', '#ffe0a3', '#ffc857', '#ff9f68', '#ffc857', '#ffe0a3', '#9fd67a'],
    ['#fff0f6', '#f78fb3', '#ffc2d6', '#f78fb3', '#c39be0', '#f78fb3', '#ffc2d6', '#ffb391'],
];

// Vị trí, độ trễ và màu của các chùm pháo hoa khi bé hoàn thành 100%
const FIREWORK_BURSTS = [
    { left: '22%', top: '26%', delay: 0, colors: ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6'] },
    { left: '74%', top: '22%', delay: 0.4, colors: ['#a855f7', '#ec4899', '#38bdf8', '#facc15'] },
    { left: '50%', top: '46%', delay: 0.8, colors: ['#22c55e', '#f97316', '#e11d48', '#8b5cf6'] },
    { left: '30%', top: '68%', delay: 1.1, colors: ['#facc15', '#06b6d4', '#f43f5e', '#84cc16'] },
    { left: '70%', top: '64%', delay: 0.6, colors: ['#3b82f6', '#f59e0b', '#ec4899', '#10b981'] },
];

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
const parseSvgNumber = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const getSvgViewBoxArea = (svgElement) => {
    const viewBox = svgElement?.getAttribute('viewBox');
    if (!viewBox) return null;

    const values = viewBox.split(/[\s,]+/).map(part => Number.parseFloat(part));
    if (values.length < 4 || values.some(value => !Number.isFinite(value))) return null;

    return Math.abs(values[2] * values[3]);
};

const isLikelyBackgroundElement = (element, svgElement, index) => {
    const tagName = element.tagName.toLowerCase();
    if (tagName !== 'rect') return false;

    const width = parseSvgNumber(element.getAttribute('width'));
    const height = parseSvgNumber(element.getAttribute('height'));
    if (!width || !height) return index === 0;

    const elementArea = Math.abs(width * height);
    const viewBoxArea = getSvgViewBoxArea(svgElement);

    if (!viewBoxArea) return index === 0;
    return elementArea >= viewBoxArea * 0.65;
};

const getBackgroundConfirmKey = (level, index) => `${level}:${index}`;

const buildSampleSvg = (level) => {
    const sourceSvg = coloringSVGs[level];
    if (!sourceSvg || typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
        return sourceSvg || '';
    }

    try {
        const parser = new DOMParser();
        const documentSvg = parser.parseFromString(sourceSvg, 'image/svg+xml');
        const svgElement = documentSvg.querySelector('svg');
        if (!svgElement || documentSvg.querySelector('parsererror')) return sourceSvg;

        const palette = SAMPLE_PALETTES[(level - 1) % SAMPLE_PALETTES.length];
        let paintIndex = 0;

        svgElement.querySelectorAll('.colorable').forEach((element) => {
            const tagName = element.tagName.toLowerCase();
            const fill = normalizeFill(element.getAttribute('fill'));
            if (tagName === 'line' || fill === 'none') return;

            const nextFill = paintIndex === 0
                ? palette[0]
                : palette[((paintIndex + level) % (palette.length - 1)) + 1];
            element.setAttribute('fill', nextFill);
            paintIndex += 1;
        });

        return new XMLSerializer().serializeToString(svgElement);
    } catch {
        return sourceSvg;
    }
};

const serializeSvgElement = (svgElement) => {
    if (!svgElement || typeof XMLSerializer === 'undefined') return '';

    const clone = svgElement.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '1024');
    clone.setAttribute('height', '1024');
    return new XMLSerializer().serializeToString(clone);
};

// Memo hóa để ảnh mẫu không bị tiêm lại (và chạy lại animation) mỗi khi app re-render
const SampleArtwork = memo(function SampleArtwork({ svg }) {
    return (
        <div
            className="flex h-full w-full items-center justify-center"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
});

export default function ColoringApp({
    onBack,
    robuxBalance = 0,
    unlockCost = 5,
    coloringTimeLeftSec = 0,
    unlockedLevels = [],
    onUnlockLevel,
}) {
    const [currentCategory, setCurrentCategory] = useState('animal');
    const [currentLevel, setCurrentLevel] = useState(1);
    const [activeTheme, setActiveTheme] = useState('nature');
    const [activeColor, setActiveColor] = useState(colorThemes.nature[0]);
    const [isEraserActive, setIsEraserActive] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
    const [showSamplePreview, setShowSamplePreview] = useState(false);
    const [showThreeDPreview, setShowThreeDPreview] = useState(false);
    const [threeDArtworkSvg, setThreeDArtworkSvg] = useState('');
    const [progress, setProgress] = useState(0);
    const [showFireworks, setShowFireworks] = useState(false);
    const [historyStatus, setHistoryStatus] = useState({ canUndo: false, canRedo: false });
    const [unlockNotice, setUnlockNotice] = useState('');
    const [backgroundConfirm, setBackgroundConfirm] = useState(null);

    // Pháo hoa chỉ chạy 5 giây khi vừa hoàn thành 100%
    useEffect(() => {
        if (progress !== 100) {
            setShowFireworks(false);
            return undefined;
        }
        setShowFireworks(true);
        const timer = setTimeout(() => setShowFireworks(false), 5000);
        return () => clearTimeout(timer);
    }, [progress]);

    const svgContainerRef = useRef(null);
    const threeDContainerRef = useRef(null);
    const currentLevelRef = useRef(currentLevel);
    const undoStacksRef = useRef({});
    const redoStacksRef = useRef({});
    const progressByLevelRef = useRef({});
    const unlockedLevelSet = useMemo(
        () => new Set((Array.isArray(unlockedLevels) ? unlockedLevels : []).map(level => Number(level))),
        [unlockedLevels]
    );
    const isCurrentUnlocked = unlockedLevelSet.has(currentLevel);
    const hasEnoughRobux = robuxBalance >= unlockCost;
    const displayTimeLeft = `${Math.floor(Math.max(0, coloringTimeLeftSec) / 60)}:${String(Math.max(0, coloringTimeLeftSec) % 60).padStart(2, '0')}`;
    const sampleSvg = useMemo(() => buildSampleSvg(currentLevel), [currentLevel]);

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
            const svgElement = wrapper.querySelector('svg');

            wrapper.querySelectorAll('.colorable').forEach((element, index) => {
                const initialFill = element.getAttribute('fill') || '#ffffff';
                const tagName = element.tagName.toLowerCase();

                element.dataset.colorIndex = String(index);
                element.dataset.initialFill = initialFill;
                element.dataset.backgroundColorable = isLikelyBackgroundElement(element, svgElement, index)
                    ? 'true'
                    : 'false';
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

    useEffect(() => {
        setUnlockNotice('');
        setBackgroundConfirm(null);
        setShowSamplePreview(false);
        setShowThreeDPreview(false);
    }, [currentLevel, isCurrentUnlocked]);

    useEffect(() => {
        setBackgroundConfirm(null);
    }, [activeColor, isEraserActive]);

    useEffect(() => {
        if (!backgroundConfirm) return undefined;

        const delay = Math.max(0, backgroundConfirm.expiresAt - Date.now());
        const timeoutId = window.setTimeout(() => {
            setBackgroundConfirm(previous => (
                previous?.key === backgroundConfirm.key ? null : previous
            ));
        }, delay);

        return () => window.clearTimeout(timeoutId);
    }, [backgroundConfirm]);

    useEffect(() => {
        if (progress < THREE_PREVIEW_READY_PROGRESS) {
            setShowThreeDPreview(false);
        }
    }, [progress]);

    useEffect(() => {
        if (!showThreeDPreview || !threeDArtworkSvg || !threeDContainerRef.current) return undefined;

        let disposeScene = null;
        let cancelled = false;

        const setupScene = async () => {
            const THREE = await import('three');
            if (cancelled || !threeDContainerRef.current) return;

            const container = threeDContainerRef.current;
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf1f5f9);

            const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
            camera.position.set(0, 0.15, 4.4);

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            container.innerHTML = '';
            container.appendChild(renderer.domElement);

            const group = new THREE.Group();
            scene.add(group);

            scene.add(new THREE.AmbientLight(0xffffff, 1.2));
            const mainLight = new THREE.DirectionalLight(0xffffff, 1.6);
            mainLight.position.set(2.2, 2.6, 4);
            scene.add(mainLight);
            const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.7);
            rimLight.position.set(-3, 1.6, -2);
            scene.add(rimLight);

            const backing = new THREE.Mesh(
                new THREE.BoxGeometry(3.15, 3.15, 0.16),
                new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6, metalness: 0.04 })
            );
            backing.position.z = -0.08;
            group.add(backing);

            const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.45, metalness: 0.08 });
            const framePieces = [
                { size: [3.3, 0.14, 0.24], position: [0, 1.65, 0.05] },
                { size: [3.3, 0.14, 0.24], position: [0, -1.65, 0.05] },
                { size: [0.14, 3.3, 0.24], position: [-1.65, 0, 0.05] },
                { size: [0.14, 3.3, 0.24], position: [1.65, 0, 0.05] },
            ].map(({ size, position }) => {
                const piece = new THREE.Mesh(new THREE.BoxGeometry(...size), frameMaterial);
                piece.position.set(...position);
                group.add(piece);
                return piece;
            });

            let artworkMesh = null;
            let artworkTexture = null;
            let isDisposed = false;
            const svgBlob = new Blob([threeDArtworkSvg], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(svgUrl, (texture) => {
                if (isDisposed) {
                    texture.dispose();
                    return;
                }
                artworkTexture = texture;
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                const artworkMaterial = new THREE.MeshStandardMaterial({
                    map: texture,
                    roughness: 0.5,
                    metalness: 0.02,
                    side: THREE.DoubleSide,
                });
                artworkMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.95, 2.95), artworkMaterial);
                artworkMesh.position.z = 0.07;
                group.add(artworkMesh);
            });

            let frameId = 0;
            let targetRotationX = -0.12;
            let targetRotationY = 0.28;
            let autoPhase = 0;
            let isDragging = false;
            let lastPointer = { x: 0, y: 0 };

            const resize = () => {
                const rect = container.getBoundingClientRect();
                const width = Math.max(1, Math.floor(rect.width));
                const height = Math.max(1, Math.floor(rect.height));
                renderer.setSize(width, height, false);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
            };

            const animate = () => {
                frameId = window.requestAnimationFrame(animate);
                if (!isDragging) {
                    autoPhase += 0.018;
                    targetRotationX = -0.1 + Math.sin(autoPhase * 0.75) * 0.05;
                    targetRotationY = Math.sin(autoPhase) * 0.42;
                }
                group.rotation.x += (targetRotationX - group.rotation.x) * 0.08;
                group.rotation.y += (targetRotationY - group.rotation.y) * 0.08;
                renderer.render(scene, camera);
            };

            const handlePointerDown = (event) => {
                isDragging = true;
                lastPointer = { x: event.clientX, y: event.clientY };
                renderer.domElement.setPointerCapture?.(event.pointerId);
            };
            const handlePointerMove = (event) => {
                if (!isDragging) return;
                const dx = event.clientX - lastPointer.x;
                const dy = event.clientY - lastPointer.y;
                targetRotationY += dx * 0.01;
                targetRotationX = Math.max(-0.7, Math.min(0.7, targetRotationX + dy * 0.008));
                lastPointer = { x: event.clientX, y: event.clientY };
            };
            const handlePointerUp = (event) => {
                isDragging = false;
                renderer.domElement.releasePointerCapture?.(event.pointerId);
            };

            renderer.domElement.className = 'h-full w-full rounded-xl';
            renderer.domElement.addEventListener('pointerdown', handlePointerDown);
            renderer.domElement.addEventListener('pointermove', handlePointerMove);
            renderer.domElement.addEventListener('pointerup', handlePointerUp);
            renderer.domElement.addEventListener('pointercancel', handlePointerUp);

            const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
            resizeObserver?.observe(container);
            resize();
            animate();

            disposeScene = () => {
                isDisposed = true;
                window.cancelAnimationFrame(frameId);
                resizeObserver?.disconnect();
                renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
                renderer.domElement.removeEventListener('pointermove', handlePointerMove);
                renderer.domElement.removeEventListener('pointerup', handlePointerUp);
                renderer.domElement.removeEventListener('pointercancel', handlePointerUp);
                URL.revokeObjectURL(svgUrl);
                if (artworkMesh) {
                    artworkMesh.geometry.dispose();
                    artworkMesh.material.dispose();
                }
                backing.geometry.dispose();
                backing.material.dispose();
                framePieces.forEach(piece => piece.geometry.dispose());
                frameMaterial.dispose();
                artworkTexture?.dispose();
                renderer.dispose();
                if (renderer.domElement.parentNode === container) {
                    container.removeChild(renderer.domElement);
                }
            };

            if (cancelled) {
                disposeScene();
                disposeScene = null;
            }
        };

        void setupScene().catch(() => {
            if (!cancelled) {
                setShowThreeDPreview(false);
            }
        });

        return () => {
            cancelled = true;
            if (disposeScene) {
                disposeScene();
                disposeScene = null;
            }
        };
    }, [showThreeDPreview, threeDArtworkSvg]);

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
        if (!isCurrentUnlocked) return;
        setBackgroundConfirm(null);

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
        if (!isCurrentUnlocked) return;
        setBackgroundConfirm(null);

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
        setBackgroundConfirm(null);
        currentLevelRef.current = nextLevel;
        setCurrentCategory(category);
        setCurrentLevel(nextLevel);
        syncHistoryStatus(nextLevel);
    };

    const handleLevelSelect = (id, event) => {
        setBackgroundConfirm(null);
        currentLevelRef.current = id;
        setCurrentLevel(id);
        syncHistoryStatus(id);
        if (event?.currentTarget && typeof event.currentTarget.scrollIntoView === 'function') {
            event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    };

    const handleSvgClick = (event) => {
        if (!isCurrentUnlocked) {
            setUnlockNotice(hasEnoughRobux ? 'Bấm mở khóa để tô hình này' : `Cần ${unlockCost} Robux để mở khóa`);
            return;
        }

        const target = event.target;
        const className = target?.getAttribute?.('class') || '';
        if (!className.includes('colorable') || (!isEraserActive && !activeColor)) return;

        const level = currentLevelRef.current;
        const index = Number(target.dataset.colorIndex);
        if (!Number.isFinite(index)) return;

        if (target.dataset.backgroundColorable === 'true') {
            const confirmKey = getBackgroundConfirmKey(level, index);
            const isConfirmedTap = backgroundConfirm?.key === confirmKey
                && backgroundConfirm.expiresAt > Date.now();

            if (!isConfirmedTap) {
                setBackgroundConfirm({
                    key: confirmKey,
                    level,
                    index,
                    expiresAt: Date.now() + BACKGROUND_CONFIRM_MS,
                });
                return;
            }

            setBackgroundConfirm(null);
        } else if (backgroundConfirm) {
            setBackgroundConfirm(null);
        }

        const previousFill = target.getAttribute('fill') || target.dataset.initialFill || '#ffffff';
        const nextFill = isEraserActive ? (target.dataset.initialFill || '#ffffff') : activeColor;
        if (normalizeFill(previousFill) === normalizeFill(nextFill)) return;

        target.setAttribute('fill', nextFill);
        pushHistoryEntry({
            type: 'fill',
            level,
            index,
            before: previousFill,
            after: nextFill,
        });
        playPopSound();
        updateProgress(level, { celebrate: !isEraserActive });
    };

    const clearCanvas = () => {
        if (!isCurrentUnlocked) return;
        setBackgroundConfirm(null);

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

    const handleUnlockCurrentLevel = () => {
        if (isCurrentUnlocked) return;

        const didUnlock = onUnlockLevel?.(currentLevel);
        setUnlockNotice(didUnlock ? 'Đã mở khóa hình này!' : `Cần ${unlockCost} Robux để mở khóa`);
    };

    const zoomOut = () => {
        setZoomLevel(previous => Math.max(MIN_ZOOM, Number((previous - ZOOM_STEP).toFixed(2))));
    };

    const zoomIn = () => {
        setZoomLevel(previous => Math.min(MAX_ZOOM, Number((previous + ZOOM_STEP).toFixed(2))));
    };

    const resetZoom = () => {
        setZoomLevel(DEFAULT_ZOOM);
    };

    const openThreeDPreview = () => {
        if (!isCurrentUnlocked || progress < THREE_PREVIEW_READY_PROGRESS) return;

        const currentSvgContainer = getCurrentSvgContainer(currentLevelRef.current);
        const svgElement = currentSvgContainer?.querySelector('svg');
        const serializedSvg = serializeSvgElement(svgElement);
        if (!serializedSvg) return;

        setThreeDArtworkSvg(serializedSvg);
        setShowSamplePreview(false);
        setShowThreeDPreview(true);
    };

    const list = currentCategory === 'animal' ? animalEmojis : pokemonEmojis;
    const nameList = currentCategory === 'animal' ? animalNames : pokemonNames;
    const startIndex = currentCategory === 'animal' ? 1 : 31;
    const currentListIndex = currentLevel - startIndex;
    const currentEmoji = list[currentListIndex] || '?';
    const currentCharacterName = nameList[currentListIndex] || 'Nhân vật';
    const { canUndo, canRedo } = historyStatus;

    return (
        <div className="fixed inset-0 z-50 flex h-[100dvh] w-full items-stretch justify-center overflow-hidden bg-white md:items-center md:bg-[#333a42]">
            <div className="relative flex h-full min-h-0 w-full max-w-[460px] flex-col bg-white shadow-[0_15px_35px_rgba(0,0,0,0.5)] md:h-[92vh] md:max-h-[860px] md:max-w-[520px] md:rounded-[28px] md:border-[6px] md:border-[#1a202c]">
                <header className="shrink-0 border-b border-[#e2e8f0] bg-[#f8fafc] text-center">
                    <div className="flex h-9 items-center justify-between gap-1.5 px-2.5 py-0.5">
                        <button
                            type="button"
                            onClick={onBack}
                            className="h-7 shrink-0 rounded-lg bg-[#e2e8f0] px-2.5 text-xs font-black text-[#4a5568] transition hover:bg-[#cbd5e0]"
                        >
                            Trở lại
                        </button>
                        <h1 className="m-0 min-w-0 flex-1 truncate text-sm font-black text-[#2d3748]">Bé Tập Phối Màu</h1>
                        <div className="flex shrink-0 items-center gap-1">
                            <div className="flex h-7 items-center gap-1 rounded-full bg-emerald-100 px-2 text-xs font-black text-emerald-700">
                                <Clock size={14} />
                                {displayTimeLeft}
                            </div>
                            <div className="flex h-7 items-center gap-1 rounded-full bg-yellow-100 px-2 text-xs font-black text-yellow-700">
                                <Gem size={14} className="fill-yellow-200" />
                                {robuxBalance}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 px-2.5 py-1">
                        <button
                            type="button"
                            className={`h-9 rounded-full border-none px-2 text-sm font-black transition-all ${currentCategory === 'animal' ? 'bg-[#3182ce] text-white shadow-[0_3px_6px_rgba(49,130,206,0.3)]' : 'bg-[#e2e8f0] text-[#4a5568]'}`}
                            onClick={() => handleCategorySwitch('animal')}
                        >
                            Động Vật (30)
                        </button>
                        <button
                            type="button"
                            className={`h-9 rounded-full border-none px-2 text-sm font-black transition-all ${currentCategory === 'pokemon' ? 'bg-[#3182ce] text-white shadow-[0_3px_6px_rgba(49,130,206,0.3)]' : 'bg-[#e2e8f0] text-[#4a5568]'}`}
                            onClick={() => handleCategorySwitch('pokemon')}
                        >
                            Pokemon (30)
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto px-2.5 pb-1 pt-1 scroll-smooth scrollbar-none">
                        {list.map((emoji, index) => {
                            const id = startIndex + index;
                            const isUnlocked = unlockedLevelSet.has(id);
                            return (
                                <button
                                    type="button"
                                    key={id}
                                    onClick={(event) => handleLevelSelect(id, event)}
                                    className={`relative flex h-10 min-w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent bg-[#edf2f7] text-xl text-gray-900 shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition-all ${!isUnlocked ? 'opacity-80' : ''} ${id === currentLevel ? 'scale-110 border-[#3182ce] bg-[#ebf8ff] shadow-[0_4px_8px_rgba(49,130,206,0.2)]' : ''}`}
                                >
                                    <span className={!isUnlocked ? 'opacity-55' : ''} style={{ fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif' }}>
                                        {emoji || '?'}
                                    </span>
                                    {!isUnlocked && (
                                        <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-[#1f2937] text-white shadow-sm">
                                            <LockKeyhole size={10} />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </header>

                <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#f1f5f9] px-1 py-0.5">
                    <div
                        className={`flex h-full w-full items-center justify-center transition ${isCurrentUnlocked ? '' : 'pointer-events-none opacity-0'}`}
                        ref={svgContainerRef}
                        onClick={handleSvgClick}
                        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center', transition: 'transform 0.16s ease' }}
                    />

                    {isCurrentUnlocked && (
                        <div className={`pointer-events-none absolute right-2 top-2 z-[12] flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black shadow-sm backdrop-blur transition-colors ${progress === 100 ? 'animate-[cf-badge-pop_0.5s_ease] border-white bg-gradient-to-r from-amber-400 to-pink-500 text-white' : 'border-white/80 bg-white/90 text-[#334155]'}`}>
                            <span className="truncate">{currentCharacterName}</span>
                            <span className="shrink-0">{progress === 100 ? '🎉 100%' : `${progress}%`}</span>
                        </div>
                    )}

                    {isCurrentUnlocked && showFireworks && (
                        <div className="pointer-events-none absolute inset-0 z-[11] overflow-hidden">
                            {FIREWORK_BURSTS.map((burst, burstIndex) => (
                                <div key={burstIndex} className="cf-firework" style={{ left: burst.left, top: burst.top }}>
                                    {Array.from({ length: 12 }).map((_, sparkIndex) => (
                                        <span
                                            key={sparkIndex}
                                            className="cf-spark"
                                            style={{
                                                '--cf-angle': `${sparkIndex * 30}deg`,
                                                '--cf-color': burst.colors[sparkIndex % burst.colors.length],
                                                animationDelay: `${burst.delay}s`,
                                            }}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    {isCurrentUnlocked && backgroundConfirm && (
                        <div className="pointer-events-none absolute left-1/2 top-2 z-[13] -translate-x-1/2 rounded-full border-2 border-yellow-200 bg-yellow-50 px-3 py-1.5 text-center text-xs font-black text-yellow-700 shadow-lg">
                            Bấm lần nữa để tô nền
                        </div>
                    )}

                    {!isCurrentUnlocked && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#e6ebf2] px-5 text-center">
                            <div className="w-full max-w-[280px] rounded-2xl border-2 border-white/80 bg-white/95 px-4 py-4 shadow-xl">
                                <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-full bg-slate-800 text-white shadow">
                                    <LockKeyhole size={28} />
                                </div>
                                <div className="text-4xl leading-none" style={{ fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif' }}>
                                    {currentEmoji}
                                </div>
                                <div className="mt-2 text-lg font-black text-slate-800">{currentCharacterName}</div>
                                <div className="mt-1 text-sm font-bold text-slate-500">
                                    Mở khóa {unlockCost} Robux, dùng mãi mãi
                                </div>
                                <button
                                    type="button"
                                    onClick={handleUnlockCurrentLevel}
                                    disabled={!hasEnoughRobux}
                                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 px-4 py-2.5 text-sm font-black text-yellow-950 shadow-[0_4px_0_rgb(202,138,4)] transition active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                                >
                                    <Gem size={19} className="fill-yellow-100" />
                                    Mở khóa
                                </button>
                                <div className="mt-2 text-xs font-black text-yellow-700">
                                    Robux hiện có: {robuxBalance}
                                </div>
                                {unlockNotice && (
                                    <div className="mt-2 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                                        {unlockNotice}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {showSamplePreview && isCurrentUnlocked && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/45 px-2 text-center">
                            <div className="relative flex h-[92%] w-full max-w-[440px] flex-col rounded-2xl border-2 border-white bg-white p-2 shadow-2xl">
                                <button
                                    type="button"
                                    onClick={() => setShowSamplePreview(false)}
                                    title="Đóng mẫu"
                                    aria-label="Đóng mẫu"
                                    className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                                >
                                    <X size={19} />
                                </button>
                                <div className="mb-2 pr-8 text-left">
                                    <div className="text-xs font-black uppercase text-pink-500">Mẫu phối màu</div>
                                    <div className="text-lg font-black text-slate-800">{currentCharacterName}</div>
                                </div>
                                <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-slate-100 p-1">
                                    <SampleArtwork svg={sampleSvg} />
                                </div>
                            </div>
                        </div>
                    )}

                    {showThreeDPreview && isCurrentUnlocked && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/55 px-2 text-center">
                            <div className="relative flex h-[92%] w-full max-w-[440px] flex-col rounded-2xl border-2 border-white bg-white p-2 shadow-2xl">
                                <button
                                    type="button"
                                    onClick={() => setShowThreeDPreview(false)}
                                    title="Đóng 3D"
                                    aria-label="Đóng 3D"
                                    className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                                >
                                    <X size={19} />
                                </button>
                                <div className="mb-2 pr-9 text-left">
                                    <div className="text-xs font-black uppercase text-indigo-500">Xem 3D</div>
                                    <div className="text-lg font-black text-slate-800">{currentCharacterName}</div>
                                </div>
                                <div
                                    ref={threeDContainerRef}
                                    className="min-h-0 flex-1 overflow-hidden rounded-xl bg-slate-100 shadow-inner"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 flex-col gap-1 border-t border-[#e2e8f0] bg-white px-2 py-1">
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5">
                        {Object.keys(colorThemes).map(theme => (
                            <button
                                type="button"
                                key={theme}
                                onClick={() => {
                                    setActiveTheme(theme);
                                    setActiveColor(colorThemes[theme][0]);
                                    setIsEraserActive(false);
                                }}
                                className={`h-8 rounded-lg border-none px-1 text-xs font-black transition-colors ${activeTheme === theme ? 'bg-[#2d3748] text-white' : 'bg-[#edf2f7] text-[#718096]'}`}
                            >
                                {THEME_LABELS[theme] || theme}
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
                                onChange={(event) => {
                                    setActiveColor(event.target.value);
                                    setIsEraserActive(false);
                                }}
                                className="h-4 w-5 cursor-pointer rounded-md border-0 bg-transparent p-0"
                                aria-label="Chọn màu tự do"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-6 justify-items-center gap-1">
                        {colorThemes[activeTheme].map((color, index) => (
                            <button
                                type="button"
                                key={`${activeTheme}-${index}`}
                                onClick={() => {
                                    setActiveColor(color);
                                    setIsEraserActive(false);
                                }}
                                style={{ backgroundColor: color }}
                                className={`h-10 w-10 cursor-pointer rounded-full border-2 shadow-[0_2px_6px_rgba(0,0,0,0.16)] transition-transform md:h-11 md:w-11 ${!isEraserActive && normalizeFill(activeColor) === normalizeFill(color) ? 'scale-105 border-[#1a202c]' : 'border-[#cbd5e0]'}`}
                                aria-label={`Chọn màu ${index + 1}`}
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-6 gap-1">
                        <button
                            type="button"
                            onClick={() => { setShowThreeDPreview(false); setShowSamplePreview(prev => !prev); }}
                            disabled={!isCurrentUnlocked}
                            title="Xem mẫu phối màu"
                            aria-label="Xem mẫu phối màu"
                            className="grid h-9 place-items-center rounded-full bg-[#fdf2f8] text-[#db2777] transition disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Sparkles size={19} />
                        </button>
                        <button
                            type="button"
                            onClick={() => (showThreeDPreview ? setShowThreeDPreview(false) : openThreeDPreview())}
                            disabled={!isCurrentUnlocked || progress < THREE_PREVIEW_READY_PROGRESS}
                            title="Xem 3D"
                            aria-label="Xem 3D"
                            className="grid h-9 place-items-center rounded-full bg-[#eef2ff] text-[#4f46e5] transition disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Cuboid size={19} />
                        </button>
                        <button
                            type="button"
                            onClick={undo}
                            disabled={!isCurrentUnlocked || !canUndo}
                            title="Hoàn tác"
                            aria-label="Hoàn tác"
                            className="grid h-9 place-items-center rounded-full bg-[#edf2f7] text-[#334155] transition disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Undo2 size={19} />
                        </button>
                        <button
                            type="button"
                            onClick={redo}
                            disabled={!isCurrentUnlocked || !canRedo}
                            title="Làm lại"
                            aria-label="Làm lại"
                            className="grid h-9 place-items-center rounded-full bg-[#edf2f7] text-[#334155] transition disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Redo2 size={19} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEraserActive(previous => !previous)}
                            disabled={!isCurrentUnlocked}
                            title="Cục tẩy"
                            aria-label="Cục tẩy"
                            className={`grid h-9 place-items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${isEraserActive ? 'bg-[#2d3748] text-white shadow-sm' : 'bg-[#edf2f7] text-[#334155]'}`}
                        >
                            <Eraser size={19} />
                        </button>
                        <button
                            type="button"
                            onClick={clearCanvas}
                            disabled={!isCurrentUnlocked}
                            title="Vẽ lại"
                            aria-label="Vẽ lại"
                            className="grid h-9 place-items-center rounded-full bg-[#fed7d7] text-[#c53030] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <RotateCcw size={19} />
                        </button>
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }

                .artwork-svg {
                    width: 100% !important;
                    height: auto !important;
                    max-width: 100% !important;
                    aspect-ratio: 1 / 1;
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

                .cf-firework { position: absolute; width: 0; height: 0; }
                .cf-spark {
                    position: absolute;
                    left: 0; top: 0;
                    width: 8px; height: 8px;
                    margin: -4px 0 0 -4px;
                    border-radius: 9999px;
                    background: var(--cf-color);
                    opacity: 0;
                    box-shadow: 0 0 6px var(--cf-color);
                    transform: rotate(var(--cf-angle)) translateX(0) scale(0.4);
                    animation: cf-burst 1.3s ease-out infinite;
                }
                @keyframes cf-burst {
                    0% { opacity: 0; transform: rotate(var(--cf-angle)) translateX(0) scale(0.4); }
                    12% { opacity: 1; }
                    100% { opacity: 0; transform: rotate(var(--cf-angle)) translateX(66px) scale(1); }
                }
                @keyframes cf-badge-pop {
                    0% { transform: scale(0.7); }
                    60% { transform: scale(1.15); }
                    100% { transform: scale(1); }
                }
            `}} />
        </div>
    );
}

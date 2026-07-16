'use client';

import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
    onSave: (base64Image: string) => void;
    placeholder: string;
}

export default function SignaturePad({ onSave, placeholder }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set high-res canvas scaling
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);

        // Customize the line styling
        ctx.strokeStyle = '#a78bfa'; // Beautiful light purple/violet stroke
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Listen to window resizing to keep the resolution scaled
        const handleResize = () => {
            const currentRect = canvas.getBoundingClientRect();
            canvas.width = currentRect.width * 2;
            canvas.height = currentRect.height * 2;
            ctx.scale(2, 2);
            ctx.strokeStyle = '#a78bfa';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            setHasSigned(false); // Reset drawing on resize to prevent distortion
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Get position coordinates relative to canvas
    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        
        let clientX = 0;
        let clientY = 0;

        if ('touches' in e) {
            if (e.touches.length === 0) return null;
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if ('touches' in e && e.cancelable) {
            e.preventDefault();
        }
        const coords = getCoordinates(e);
        if (!coords) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if ('touches' in e && e.cancelable) {
            e.preventDefault();
        }
        if (!isDrawing) return;

        const coords = getCoordinates(e);
        if (!coords) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        setHasSigned(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSigned(false);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasSigned) return;

        // Export as base64 image data URL
        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
    };

    return (
        <div className="flex flex-col gap-3 w-full animate-fade-in">
            <div className="relative h-44 rounded-2xl border border-white/10 bg-[#161616] overflow-hidden group cursor-crosshair">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="absolute inset-0 w-full h-full touch-none"
                    style={{ touchAction: 'none' }}
                />
                {!hasSigned && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted text-xs font-semibold select-none group-hover:opacity-40 transition-opacity">
                        {placeholder}
                    </div>
                )}
            </div>
            
            <div className="flex gap-3 justify-end">
                <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 h-9 rounded-xl border border-white/10 text-xs font-bold text-muted hover:text-white transition-colors"
                >
                    Effacer
                </button>
                <button
                    type="button"
                    disabled={!hasSigned}
                    onClick={handleSave}
                    className="px-4 h-9 rounded-xl bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white transition-all shadow-md active:scale-95 hover:bg-purple-500"
                >
                    Valider la signature
                </button>
            </div>
        </div>
    );
}

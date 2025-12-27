import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, FastForward, Rewind, SkipBack, SkipForward, Clock } from 'lucide-react';

function TimelineSlider({
    min = 0,
    max = 100,
    value = 0,
    onChange,
    isPlaying,
    onTogglePlay,
    onSpeedChange,
    playbackSpeed
}) {
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-zinc-900 border-t border-zinc-700 px-4 py-3 shadow-2xl backdrop-blur-sm">
            <div className="max-w-4xl mx-auto flex flex-col gap-2">

                {/* Controls & Time Display */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-zinc-400" />
                        <span className="text-xl font-mono text-white font-bold">
                            {formatTime(value)}
                        </span>
                        <span className="text-sm text-zinc-500 font-mono">
                            / {formatTime(max)}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={onTogglePlay}
                            className={`p-2 rounded-full ${isPlaying ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-zinc-900 transition-colors`}
                        >
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                        </button>

                        <div className="flex bg-zinc-800 rounded-lg p-1">
                            {[1, 2, 4, 8].map(speed => (
                                <button
                                    key={speed}
                                    onClick={() => onSpeedChange(speed)}
                                    className={`px-2 py-1 text-xs font-bold rounded ${playbackSpeed === speed ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Slider */}
                <div className="relative h-6 flex items-center group">
                    <input
                        type="range"
                        min={min}
                        max={max}
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer hover:bg-zinc-600 accent-indigo-500"
                    />

                    {/* Progress Bar Visual (optional if needed for better styling) */}
                </div>
            </div>
        </div>
    );
}

export default TimelineSlider;

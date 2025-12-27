import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Brain, Zap, Shield, Target } from 'lucide-react';

const AIControlPanel = ({ sessionId }) => {
    const socket = useSocket();
    const [config, setConfig] = useState({
        enabled: false,
        difficulty: 'medium', // easy, medium, hard, elite
        doctrine: 'balanced', // aggressive, defensive, balanced, ambush
        side: 'red' // blue, red (AI plays as...)
    });
    const [status, setStatus] = useState('Очікування');

    useEffect(() => {
        if (!socket || !sessionId) return;

        // Listen for updates from server (sync with other users)
        socket.on('aiConfigUpdate', (newConfig) => {
            setConfig(newConfig);
        });

        socket.on('aiStatusUpdate', (newStatus) => {
            // Translate status if needed
            const statusMap = {
                'Active': 'Активний',
                'Idle': 'Очікування',
                'Thinking': 'Думає',
                'Moving': 'Рухається'
            };
            setStatus(statusMap[newStatus] || newStatus);
        });

        // Request initial state (optional, or wait for room update)
        // socket.emit('requestAIState', sessionId); 

        return () => {
            socket.off('aiConfigUpdate');
            socket.off('aiStatusUpdate');
        };
    }, [socket, sessionId]);

    const handleChange = (key, value) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        // Emit update to server
        socket.emit('updateAIConfig', { sessionId, config: newConfig });
    };

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <Brain className="text-purple-400" />
                Центр Керування ШІ
            </h2>

            {/* STATUS CARD */}
            <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Статус</div>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="font-mono text-lg text-white">{config.enabled ? status : 'ВИМКНЕНО'}</span>
                </div>
            </div>

            {/* MASTER TOGGLE */}
            <div className="">
                <label className="flex items-center cursor-pointer justify-between">
                    <span className="font-medium text-zinc-300">Увімкнути ШІ</span>
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={config.enabled}
                            onChange={(e) => handleChange('enabled', e.target.checked)}
                        />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${config.enabled ? 'bg-purple-600' : 'bg-zinc-600'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${config.enabled ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                </label>
            </div>

            <hr className="border-zinc-700 my-2" />

            {/* CONFIGURATION */}
            <div className={`flex flex-col gap-4 transition-opacity ${config.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>

                {/* AI SIDE */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Сторона ШІ</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleChange('side', 'blue')}
                            className={`p-2 rounded border transition-colors ${config.side === 'blue' ? 'bg-blue-900 border-blue-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                        >
                            Сині (Свої)
                        </button>
                        <button
                            onClick={() => handleChange('side', 'red')}
                            className={`p-2 rounded border transition-colors ${config.side === 'red' ? 'bg-red-900 border-red-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                        >
                            Червоні (Вороги)
                        </button>
                    </div>
                </div>

                {/* DIFFICULTY */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Складність</label>
                    <select
                        value={config.difficulty}
                        onChange={(e) => handleChange('difficulty', e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-600 rounded p-2 text-white focus:outline-none focus:border-purple-500"
                    >
                        <option value="easy">Рекрут (Легко)</option>
                        <option value="medium">Регуляр (Середньо)</option>
                        <option value="hard">Ветеран (Важко)</option>
                        <option value="elite">Еліта (Експерт)</option>
                    </select>
                </div>

                {/* DOCTRINE */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Тактична Доктрина</label>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            { id: 'aggressive', label: 'Атака', icon: Zap, desc: 'Знайти і знищити. Високий темп.' },
                            { id: 'defensive', label: 'Оборона', icon: Shield, desc: 'Утримання позицій. Контратаки.' },
                            { id: 'ambush', label: 'Засідка', icon: Target, desc: 'Удар і відхід. Використання місцевості.' },
                        ].map((doc) => (
                            <button
                                key={doc.id}
                                onClick={() => handleChange('doctrine', doc.id)}
                                className={`flex items-center gap-3 p-3 rounded border text-left transition-all ${config.doctrine === doc.id
                                        ? 'bg-purple-900/30 border-purple-500 ring-1 ring-purple-500'
                                        : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-750'
                                    }`}
                            >
                                <doc.icon size={20} className={config.doctrine === doc.id ? 'text-purple-400' : 'text-zinc-500'} />
                                <div>
                                    <div className="font-medium text-sm text-white">{doc.label}</div>
                                    <div className="text-xs text-zinc-500">{doc.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIControlPanel;

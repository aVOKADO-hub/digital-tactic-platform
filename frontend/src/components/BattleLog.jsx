import React, { useState, useEffect, useRef } from 'react';
import { ScrollText, X, ChevronDown, ChevronUp } from 'lucide-react';

function BattleLog({ socket }) {
    const [logs, setLogs] = useState([]);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const logsEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleBattleLog = (logEntry) => {
            setLogs(prev => {
                const newLogs = [...prev, logEntry];
                // Keep only last 50 entries
                if (newLogs.length > 50) {
                    return newLogs.slice(-50);
                }
                return newLogs;
            });
        };

        socket.on('battleLog', handleBattleLog);

        return () => {
            socket.off('battleLog', handleBattleLog);
        };
    }, [socket]);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (isExpanded && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isExpanded]);

    const getEventIcon = (type) => {
        switch (type) {
            case 'advance': return '🚀';
            case 'engage': return '⚔️';
            case 'retreat': return '🏃';
            case 'damage': return '💔';
            case 'destroyed': return '☠️';
            case 'victory': return '🏆';
            default: return '📋';
        }
    };

    const getEventColor = (type) => {
        switch (type) {
            case 'advance': return 'text-blue-400';
            case 'engage': return 'text-yellow-400';
            case 'retreat': return 'text-orange-400';
            case 'damage': return 'text-red-400';
            case 'destroyed': return 'text-red-600';
            case 'victory': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };

    const clearLogs = () => {
        setLogs([]);
    };

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-4 right-4 z-[1000] flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2 text-white shadow-lg hover:bg-zinc-700 transition-all"
            >
                <ScrollText size={18} />
                <span className="text-sm font-medium">Журнал бою</span>
                {logs.length > 0 && (
                    <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-xs">{logs.length}</span>
                )}
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-[1000] w-96 rounded-lg bg-zinc-900/95 shadow-2xl border border-zinc-700 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
                <div className="flex items-center gap-2">
                    <ScrollText size={18} className="text-yellow-400" />
                    <span className="font-semibold text-white">Журнал бою</span>
                    <span className="text-xs text-zinc-500">({logs.length})</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 rounded hover:bg-zinc-700 text-zinc-400"
                    >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-1 rounded hover:bg-zinc-700 text-zinc-400"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Log entries */}
            {isExpanded && (
                <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                    {logs.length === 0 ? (
                        <div className="text-center text-zinc-500 py-4 text-sm">
                            Очікування подій...
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div
                                key={log.id}
                                className={`flex items-start gap-2 p-2 rounded bg-zinc-800/50 text-sm ${getEventColor(log.type)}`}
                            >
                                <span className="text-lg">{getEventIcon(log.type)}</span>
                                <div className="flex-1">
                                    <p className="leading-tight">{log.message}</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        {new Date(log.timestamp).toLocaleTimeString('uk-UA')}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={logsEndRef} />
                </div>
            )}

            {/* Footer */}
            {isExpanded && logs.length > 0 && (
                <div className="px-4 py-2 border-t border-zinc-700">
                    <button
                        onClick={clearLogs}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        Очистити журнал
                    </button>
                </div>
            )}
        </div>
    );
}

export default BattleLog;

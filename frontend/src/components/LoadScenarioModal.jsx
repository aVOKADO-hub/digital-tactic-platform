
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Download } from 'lucide-react';

// 'onClose' - функція, щоб закрити модалку
// 'onLoad' - функція, що завантажить сценарій (передасть ID)
function LoadScenarioModal({ onClose, onLoad }) {
    const [scenarios, setScenarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Завантажуємо список сценаріїв, коли модалка відкривається
    useEffect(() => {
        const fetchScenarios = async () => {
            try {
                setLoading(true);
                // Використовуємо проксі /api
                const { data } = await axios.get('/api/scenarios');
                setScenarios(data);
                setError(null);
            } catch (err) {
                console.error('Помилка завантаження списку сценаріїв:', err);
                setError('Не вдалося завантажити список.');
            }
            setLoading(false);
        };
        fetchScenarios();
    }, []);

    // 2. Хелпер для форматування дати (щоб було гарно)
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        // Темний фон (backdrop)
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={onClose} // Закриваємо по кліку на фон
        >
            {/* Саме модальне вікно */}
            <div
                className="relative w-full max-w-lg rounded-lg bg-zinc-800 text-white shadow-xl"
                onClick={(e) => e.stopPropagation()} // Зупиняємо клік, щоб вікно не закрилось
            >
                {/* Хедер модалки */}
                <div className="flex items-center justify-between border-b border-zinc-700 p-4">
                    <h2 className="text-xl font-semibold">Завантажити Сценарій</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Тіло модалки (список) */}
                <div className="max-h-[60vh] overflow-y-auto p-4">
                    {loading && <p>Завантаження...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                    {!loading && !error && (
                        <ul className="flex flex-col gap-2">
                            {scenarios.length === 0 ? (
                                <p>Збережених сценаріїв не знайдено.</p>
                            ) : (
                                scenarios.map((scenario) => (
                                    <li
                                        key={scenario._id}
                                        className="flex items-center justify-between rounded-md border border-zinc-700 p-3"
                                    >
                                        <div>
                                            <span className="font-medium">{scenario.name}</span>
                                            <span className="block text-xs text-zinc-400">
                                                Збережено: {formatDate(scenario.createdAt)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => onLoad(scenario._id)}
                                            className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium transition-colors hover:bg-blue-700"
                                        >
                                            <Download size={16} />
                                            Завантажити
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LoadScenarioModal;
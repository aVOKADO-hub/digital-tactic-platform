
import React from 'react';
import { Save, Share, Settings, Users, Download } from 'lucide-react';
import axios from 'axios'; // <-- 1. ІМПОРТУЄМО AXIOS

// 2. ОТРИМУЄМО 'objects' ТА 'drawings' ЯК PROPS
function Header({ objects, drawings, onLoadClick }) {

    // 3. ФУНКЦІЯ ДЛЯ ЗБЕРЕЖЕННЯ
    const handleSaveScenario = async () => {
        // Тимчасова назва, поки ми не зробили модальне вікно
        const scenarioName = `Сценарій ${new Date().toLocaleTimeString()}`;

        try {
            // Використовуємо наш Vite-проксі
            const { data } = await axios.post('/api/scenarios', {
                name: scenarioName,
                objects: objects,
                drawings: drawings,
            });

            console.log('Сценарій успішно збережено!', data);
            alert('Сценарій успішно збережено!'); // Тимчасове сповіщення

        } catch (error) {
            console.error('Помилка збереження сценарію:', error);
            alert('Помилка збереження сценарію!');
        }
    };

    return (
        <header className="flex h-16 w-full flex-shrink-0 items-center justify-between border-b border-zinc-700 bg-zinc-900 px-4">
            {/* Ліва частина: Назва */}
            <div>
                <h1 className="text-xl font-bold">Digital Tactic Platform</h1>
                <span className="text-xs text-zinc-400">Сесія: "Тренування 1"</span>
            </div>

            {/* Права частина: Кнопки */}
            <div className="flex items-center gap-4">
                {/* 4. ПРИВ'ЯЗУЄМО ФУНКЦІЮ ДО КНОПКИ */}
                <button
                    onClick={onLoadClick} // <-- ВІШАЄМО ОБРОБНИК
                    className="flex items-center gap-2 rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-700"
                >
                    <Download size={16} />
                    Завантажити
                </button>
                <button
                    onClick={handleSaveScenario}
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium transition-colors hover:bg-blue-700"
                >
                    <Save size={16} />
                    Зберегти
                </button>
                <button className="rounded-md p-2 transition-colors hover:bg-zinc-700">
                    <Share size={20} />
                </button>
                <button className="rounded-md p-2 transition-colors hover:bg-zinc-700">
                    <Users size={20} />
                </button>
                <button className="rounded-md p-2 transition-colors hover:bg-zinc-700">
                    <Settings size={20} />
                </button>
            </div>
        </header>
    );
}

export default Header;
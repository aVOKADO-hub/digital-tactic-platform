
import React from 'react';
import { SquareStack, PencilRuler, Layers } from 'lucide-react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../constants.js';

// 1. ІМПОРТУЄМО НАШ ХУК
import { useTool } from '../context/ToolContext.jsx';

// Компонент DraggableObject (код не змінився)
const DraggableObject = ({ name, type }) => {
    const [{ isDragging }, dragRef] = useDrag(() => ({
        type: ItemTypes.TACTICAL_OBJECT,
        item: { name, type },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={dragRef}
            className={`mt-2 cursor-grab rounded-md border border-zinc-700 bg-zinc-800 p-3 text-center transition-opacity hover:bg-zinc-700 ${isDragging ? 'opacity-50' : 'opacity-100'
                }`}
        >
            {name}
        </div>
    );
};

function Sidebar() {
    // 2. ОТРИМУЄМО ДОСТУП ДО ІНСТРУМЕНТІВ
    const { activeTool, setActiveTool, TOOLS } = useTool();

    // 3. Функція для вибору інструмента (для тестування)
    const handleToolChange = (tool) => {
        setActiveTool(tool);
        console.log(`[Tool] Активний інструмент: ${tool}`);
    };

    // 4. Динамічні класи для кнопок
    const getButtonClass = (tool) => {
        if (activeTool === tool) {
            // Активна кнопка
            return 'border-b-2 border-blue-500 text-blue-400';
        }
        // Неактивна
        return 'text-zinc-400 hover:bg-zinc-800';
    };

    return (
        <aside className="flex w-64 flex-col border-r border-zinc-700 bg-zinc-900">
            {/* 1. Таби (ОНОВЛЕНО) */}
            <div className="flex border-b border-zinc-700">
                <button
                    className={`flex-1 items-center justify-center gap-2 p-3 text-center text-sm font-medium ${getButtonClass(
                        TOOLS.CURSOR
                    )}`}
                    onClick={() => handleToolChange(TOOLS.CURSOR)}
                >
                    <SquareStack size={18} className="mx-auto" />
                    Об'єкти
                </button>
                <button
                    className={`flex-1 items-center justify-center gap-2 p-3 text-center text-sm font-medium ${getButtonClass(
                        TOOLS.DRAW_LINE
                    )}`}
                    onClick={() => handleToolChange(TOOLS.DRAW_LINE)}
                >
                    <PencilRuler size={18} className="mx-auto" />
                    Інструменти
                </button>
                <button
                    className={`flex-1 items-center justify-center gap-2 p-3 text-center text-sm font-medium ${getButtonClass(
                        'layers'
                    )}`} // "Шари" поки не чіпаємо
                >
                    <Layers size={18} className="mx-auto" />
                    Шари
                </button>
            </div>

            {/* 2. Контент вкладок (ОНОВЛЕНО) */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* Показуємо контент залежно від активного інструмента */}

                {activeTool === TOOLS.CURSOR && (
                    <div>
                        <h3 className="mb-4 text-lg font-semibold">Бібліотека Об'єктів</h3>
                        <DraggableObject name="Танковий взвод" type="tank_platoon" />
                        <DraggableObject name="Піхотне відділення" type="infantry_squad" />
                    </div>
                )}

                {activeTool === TOOLS.DRAW_LINE && (
                    <div>
                        <h3 className="mb-4 text-lg font-semibold">Інструменти</h3>
                        <div className="rounded-md border border-zinc-700 bg-zinc-800 p-3 text-center">
                            Обрано "Малювати Лінію"
                        </div>
                    </div>
                )}

            </div>
        </aside>
    );
}

export default Sidebar;

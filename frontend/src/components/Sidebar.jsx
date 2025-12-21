
// frontend/src/components/Sidebar.jsx

import React from 'react';
// 1. ІМПОРТУЄМО НОВІ ІКОНКИ
import {
    SquareStack,
    PencilRuler,
    Layers,
    MoveUpRight, // Для стрілки
    RectangleHorizontal, // Для прямокутника
    Circle, // Для кола
    Minus, // Для лінії
} from 'lucide-react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../constants.js';

// 2. ІМПОРТУЄМО НАШІ НОВІ ХУКИ З КОНТЕКСТУ
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

// 3. НОВИЙ КОМПОНЕНТ: Кнопка для палітри кольорів
const ColorButton = ({ color, activeColor, setActiveColor }) => {
    const isActive = activeColor === color;
    return (
        <button
            onClick={() => setActiveColor(color)}
            className={`h-6 w-6 rounded-full border-2 ${isActive ? 'border-white' : 'border-zinc-600'
                } transition-all hover:scale-110`}
            style={{ backgroundColor: color }}
        />
    );
};

// 4. НОВИЙ КОМПОНЕНТ: Кнопка для вибору інструмента
const ToolButton = ({
    label,
    icon: Icon,
    tool,
    activeTool,
    setActiveTool,
}) => {
    const isActive = activeTool === tool;
    return (
        <button
            onClick={() => setActiveTool(tool)}
            className={`flex flex-col items-center gap-1 rounded-md p-2 transition-colors ${isActive
                ? 'bg-blue-600 text-white'
                : 'hover:bg-zinc-700'
                }`}
        >
            <Icon size={20} />
            <span className="text-xs">{label}</span>
        </button>
    );
};

function Sidebar() {
    // 5. ОТРИМУЄМО ВСІ ДАНІ З КОНТЕКСТУ
    const {
        activeTool,
        setActiveTool,
        TOOLS,
        activeColor,
        setActiveColor,
        lineWeight,
        setLineWeight,
    } = useTool();

    // 6. Хелпер, щоб знати, чи ми в режимі малювання
    const isDrawingMode = [
        TOOLS.DRAW_LINE,
        TOOLS.DRAW_ARROW,
        TOOLS.DRAW_RECTANGLE,
        TOOLS.DRAW_CIRCLE,
    ].includes(activeTool);

    // 7. Оновлюємо логіку класів для табів
    const getTabClass = (tabName) => {
        if (tabName === 'objects' && activeTool === TOOLS.CURSOR) {
            return 'border-b-2 border-blue-500 text-blue-400';
        }
        if (tabName === 'tools' && isDrawingMode) {
            return 'border-b-2 border-blue-500 text-blue-400';
        }
        // "Шари" поки не чіпаємо
        if (tabName === 'layers' && activeTool === 'layers_placeholder') {
            return 'border-b-2 border-blue-500 text-blue-400';
        }
        return 'text-zinc-400 hover:bg-zinc-800';
    };

    return (
        <aside className="flex w-64 flex-col border-r border-zinc-700 bg-zinc-900">
            {/* 1. Таби (ОНОВЛЕНО) */}
            <div className="flex border-b border-zinc-700">
                <button
                    className={`flex-1 items-center justify-center gap-2 p-3 text-center text-sm font-medium ${getTabClass(
                        'objects'
                    )}`}
                    onClick={() => setActiveTool(TOOLS.CURSOR)}
                >
                    <SquareStack size={18} className="mx-auto" />
                    Об'єкти
                </button>
                <button
                    className={`flex-1 items-center justify-center gap-2 p-3 text-center text-sm font-medium ${getTabClass(
                        'tools'
                    )}`}
                    // При кліку на таб "Інструменти", обираємо перший інструмент - Лінію
                    onClick={() => setActiveTool(TOOLS.DRAW_LINE)}
                >
                    <PencilRuler size={18} className="mx-auto" />
                    Інструменти
                </button>
                <button
                    className={`flex-1 items-center justify-center gap-2 p-3 text-center text-sm font-medium ${getTabClass(
                        'layers'
                    )}`}
                >
                    <Layers size={18} className="mx-auto" />
                    Шари
                </button>
            </div>

            {/* 2. Контент вкладок (ОНОВЛЕНО) */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* --- ВКЛАДКА ОБ'ЄКТИ --- */}
                {activeTool === TOOLS.CURSOR && (
                    <div>
                        <h3 className="mb-4 text-lg font-semibold">
                            Бібліотека Об'єктів
                        </h3>
                        <DraggableObject
                            name="Танковий взвод"
                            type="tank_platoon"
                        />
                        <DraggableObject
                            name="Піхотне відділення"
                            type="infantry_squad"
                        />
                    </div>
                )}

                {/* --- ВКЛАДКА ІНСТРУМЕНТИ --- */}
                {isDrawingMode && (
                    <div className="flex flex-col gap-6">
                        {/* 8. БЛОК ВИБОРУ ІНСТРУМЕНТА */}
                        <div>
                            <h3 className="mb-3 text-lg font-semibold">
                                Інструменти
                            </h3>
                            <div className="grid grid-cols-3 gap-2">
                                <ToolButton
                                    label="Лінія"
                                    icon={Minus}
                                    tool={TOOLS.DRAW_LINE}
                                    activeTool={activeTool}
                                    setActiveTool={setActiveTool}
                                />
                                <ToolButton
                                    label="Стрілка"
                                    icon={MoveUpRight}
                                    tool={TOOLS.DRAW_ARROW}
                                    activeTool={activeTool}
                                    setActiveTool={setActiveTool}
                                />
                                <ToolButton
                                    label="Зона"
                                    icon={RectangleHorizontal}
                                    tool={TOOLS.DRAW_RECTANGLE}
                                    activeTool={activeTool}
                                    setActiveTool={setActiveTool}
                                />
                                <ToolButton
                                    label="Коло"
                                    icon={Circle}
                                    tool={TOOLS.DRAW_CIRCLE}
                                    activeTool={activeTool}
                                    setActiveTool={setActiveTool}
                                />
                            </div>
                        </div>

                        {/* 9. БЛОК ВИБОРУ КОЛЬОРУ */}
                        <div>
                            <h3 className="mb-3 text-lg font-semibold">Колір</h3>
                            <div className="flex flex-wrap gap-2">
                                <ColorButton
                                    color="#FF0000"
                                    activeColor={activeColor}
                                    setActiveColor={setActiveColor}
                                />
                                <ColorButton
                                    color="#0000FF"
                                    activeColor={activeColor}
                                    setActiveColor={setActiveColor}
                                />
                                <ColorButton
                                    color="#00FF00"
                                    activeColor={activeColor}
                                    setActiveColor={setActiveColor}
                                />
                                <ColorButton
                                    color="#FFFF00"
                                    activeColor={activeColor}
                                    setActiveColor={setActiveColor}
                                />
                                <ColorButton
                                    color="#FFFFFF"
                                    activeColor={activeColor}
                                    setActiveColor={setActiveColor}
                                />
                            </div>
                        </div>

                        {/* 10. БЛОК ТОВЩИНИ ЛІНІЇ */}
                        <div>
                            <h3 className="mb-3 text-lg font-semibold">
                                Товщина ({lineWeight}px)
                            </h3>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={lineWeight}
                                onChange={(e) =>
                                    setLineWeight(Number(e.target.value))
                                }
                                className="w-full"
                            />
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
import React, { useState, useMemo, useEffect } from 'react';
import {
    PencilRuler,
    Layers,
    MoveUpRight,
    RectangleHorizontal,
    Circle,
    Minus,
    Map as MapIcon,
    Settings2, // Іконка для конструктора
    Brain // AI Icon
} from 'lucide-react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../constants.js';
import { useTool } from '../context/ToolContext.jsx';
import ms from 'milsymbol';
import { generateSidc, SID_OPTIONS } from '../utils/sidcGenerator'; // Впевніться, що шлях вірний
import AIControlPanel from './AIControlPanel'; // Import AI Panel

// --- КОМПОНЕНТ ПРЕВ'Ю ТА ПЕРЕТЯГУВАННЯ ---
const DraggableSymbolPreview = ({ sidcData, name }) => {
    // Генеруємо SIDC для прев'ю
    const sidc = useMemo(() =>
        generateSidc(sidcData.identity, sidcData.entity, sidcData.echelon, sidcData.status, sidcData.modifier),
        [sidcData]);

    // Генеруємо SVG
    const symbolSvg = useMemo(() => {
        return new ms.Symbol(sidc, {
            size: 40,
            uniqueDesignation: name,
            simpleStatusModifier: true
        }).asSVG();
    }, [sidc, name]);

    const [{ isDragging }, dragRef] = useDrag(() => ({
        type: ItemTypes.TACTICAL_OBJECT,
        // Передаємо ВЕСЬ об'єкт даних
        item: {
            name,
            ...sidcData, // identity, entity, echelon
            sidc // готовий код
        },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [name, sidcData, sidc]);

    return (
        <div ref={dragRef} className={`mt-4 flex flex-col items-center cursor-grab rounded-xl border border-zinc-600 bg-zinc-800 p-4 transition-all hover:bg-zinc-700 hover:border-blue-500 ${isDragging ? 'opacity-50' : ''}`}>
            {/* Рендеримо SVG як компонент */}
            <div dangerouslySetInnerHTML={{ __html: symbolSvg }} />
            <div className="mt-2 text-sm text-gray-300 font-medium text-center">
                Перетягніть на карту
            </div>
        </div>
    );
};

// ... (ColorButton, ToolButton залишаються без змін) ...
const ColorButton = ({ color, activeColor, setActiveColor }) => {
    const isActive = activeColor === color;
    return (
        <button
            onClick={() => setActiveColor(color)}
            className={`h-6 w-6 rounded-full border-2 ${isActive ? 'border-white' : 'border-zinc-600'} transition-all hover:scale-110`}
            style={{ backgroundColor: color }}
        />
    );
};

const ToolButton = ({ label, icon: Icon, tool, activeTool, setActiveTool }) => {
    const isActive = activeTool === tool;
    return (
        <button
            onClick={() => setActiveTool(tool)}
            className={`flex flex-col items-center gap-1 rounded-md p-2 transition-colors ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-zinc-700'}`}
        >
            <Icon size={20} />
            <span className="text-xs">{label}</span>
        </button>
    );
};

function Sidebar({ onOpenMapManager, sessionId }) {
    const { activeTool, setActiveTool, TOOLS, activeColor, setActiveColor, lineWeight, setLineWeight } = useTool();

    // --- СТАН КОНСТРУКТОРА СИМВОЛІВ ---
    const [symbolParams, setSymbolParams] = useState({
        identity: 'friend', // friend, hostile, neutral
        echelon: 'platoon', // squad, platoon, company
        entity: 'tank',     // infantry, tank...
        status: 'present',  // present, planned
        modifier: 'none',   // none, hq, task_force
        name: 'Танковий взвод'
    });

    // State for active tab
    const [activeTab, setActiveTab] = useState('constructor'); // 'constructor', 'tools', 'ai'

    const isDrawingMode = [TOOLS.DRAW_LINE, TOOLS.DRAW_ARROW, TOOLS.DRAW_RECTANGLE, TOOLS.DRAW_CIRCLE].includes(activeTool);

    // Helper to determine tab class based on activeTab state
    const getTabClass = (tabName) => {
        if (activeTab === tabName) {
            if (tabName === 'ai') return 'border-b-2 border-purple-500 text-purple-400';
            return 'border-b-2 border-blue-500 text-blue-400';
        }
        return 'text-zinc-400 hover:bg-zinc-800';
    };

    // Effect to sync activeTool with activeTab
    useEffect(() => {
        // Only auto-switch to TOOLS if actively drawing.
        // Do NOT auto-switch to Constructor on CURSOR, because 'AI' tab also uses CURSOR.
        if (isDrawingMode && activeTab !== 'tools') {
            setActiveTab('tools');
        }
    }, [isDrawingMode, activeTab]);

    // Handler for tab clicks
    const handleTabClick = (tabName) => {
        setActiveTab(tabName);

        if (tabName === 'tools') {
            // If not already drawing, pick default line tool
            if (!isDrawingMode) setActiveTool(TOOLS.DRAW_LINE);
        } else if (tabName === 'constructor') {
            // If going to constructor, switch to Cursor
            setActiveTool(TOOLS.CURSOR);
        }
        // AI tab doesn't force a tool change (can stay as cursor)
    };

    // Оновлення параметрів символу
    const handleParamChange = (key, value) => {
        setSymbolParams(prev => ({ ...prev, [key]: value }));
    };

    return (
        <aside className="flex w-72 flex-col border-r border-zinc-700 bg-zinc-900 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-zinc-700">
                <button
                    className={`flex-1 flex items-center justify-center gap-2 p-3 text-center text-sm font-medium ${getTabClass('constructor')}`}
                    onClick={() => handleTabClick('constructor')}
                >
                    <Settings2 size={18} />
                    Конструктор
                </button>
                <button
                    className={`flex-1 flex items-center justify-center gap-2 p-3 text-center text-sm font-medium ${getTabClass('tools')}`}
                    onClick={() => handleTabClick('tools')}
                >
                    <PencilRuler size={18} />
                    Інструменти
                </button>
                <button
                    className={`flex-1 flex items-center justify-center gap-2 p-3 text-center text-sm font-medium ${getTabClass('ai')}`}
                    onClick={() => handleTabClick('ai')}
                >
                    <Brain size={18} />
                    AI
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {/* --- КОНСТРУКТОР (Map Army Style) --- */}
                {activeTab === 'constructor' && (
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-semibold text-white">Створити підрозділ</h3>

                        {/* 1. Належність */}
                        <div>
                            <label className="text-xs text-zinc-400">Належність</label>
                            <select
                                className="w-full rounded bg-zinc-800 border border-zinc-600 p-2 text-sm text-white focus:border-blue-500 outline-none"
                                value={symbolParams.identity}
                                onChange={(e) => handleParamChange('identity', e.target.value)}
                            >
                                <option value="friend">Свої війська (Friend)</option>
                                <option value="hostile">Противник (Hostile)</option>
                                <option value="neutral">Нейтральні (Neutral)</option>
                                <option value="unknown">Невідомі (Unknown)</option>
                            </select>
                        </div>

                        {/* 2. Статус (Planned/Present) */}
                        <div>
                            <label className="text-xs text-zinc-400">Статус</label>
                            <select
                                className="w-full rounded bg-zinc-800 border border-zinc-600 p-2 text-sm text-white focus:border-blue-500 outline-none"
                                value={symbolParams.status}
                                onChange={(e) => handleParamChange('status', e.target.value)}
                            >
                                <option value="present">В наявності (Solid)</option>
                                <option value="planned">Запланований (Dashed)</option>
                            </select>
                        </div>

                        {/* 3. Тип підрозділу */}
                        <div>
                            <label className="text-xs text-zinc-400">Тип підрозділу</label>
                            <select
                                className="w-full rounded bg-zinc-800 border border-zinc-600 p-2 text-sm text-white focus:border-blue-500 outline-none"
                                value={symbolParams.entity}
                                onChange={(e) => handleParamChange('entity', e.target.value)}
                            >
                                <option value="infantry">Піхота (Infantry)</option>
                                <option value="tank">Танки (Armor)</option>
                                <option value="apc">БМП/БТР (Mechanized)</option>
                                <option value="artillery">Артилерія</option>
                                <option value="medical">Медики</option>
                                <option value="supply">Постачання</option>
                                <option value="uav">БПЛА (UAV)</option>
                                <option value="hq">Штаб (як тип)</option>
                            </select>
                        </div>

                        {/* 4. Ешелон */}
                        <div>
                            <label className="text-xs text-zinc-400">Ешелон / Розмір</label>
                            <select
                                className="w-full rounded bg-zinc-800 border border-zinc-600 p-2 text-sm text-white focus:border-blue-500 outline-none"
                                value={symbolParams.echelon}
                                onChange={(e) => handleParamChange('echelon', e.target.value)}
                            >
                                <option value="team">Група / Екіпаж (Team)</option>
                                <option value="squad">Відділення (Squad)</option>
                                <option value="section">Секція (Section)</option>
                                <option value="platoon">Взвод (Platoon)</option>
                                <option value="company">Рота (Company)</option>
                                <option value="battalion">Батальйон</option>
                                <option value="regiment">Полк</option>
                                <option value="brigade">Бригада</option>
                            </select>
                        </div>

                        {/* 5. Модифікатор (HQ) */}
                        <div>
                            <label className="text-xs text-zinc-400">Модифікатор</label>
                            <select
                                className="w-full rounded bg-zinc-800 border border-zinc-600 p-2 text-sm text-white focus:border-blue-500 outline-none"
                                value={symbolParams.modifier}
                                onChange={(e) => handleParamChange('modifier', e.target.value)}
                            >
                                <option value="none">Немає</option>
                                <option value="hq">Штаб (Flag)</option>
                                <option value="task_force">Зведена група (Task Force)</option>
                            </select>
                        </div>

                        {/* 6. Назва / Позивний */}
                        <div>
                            <label className="text-xs text-zinc-400">Позивний / Назва</label>
                            <input
                                type="text"
                                className="w-full rounded bg-zinc-800 border border-zinc-600 p-2 text-sm text-white focus:border-blue-500 outline-none"
                                value={symbolParams.name}
                                onChange={(e) => handleParamChange('name', e.target.value)}
                            />
                        </div>

                        <div className="my-2 border-t border-zinc-700"></div>

                        <div className="my-2 border-t border-zinc-700"></div>

                        {/* 7. ПРЕВ'Ю (Воно ж Draggable) */}
                        <DraggableSymbolPreview
                            sidcData={symbolParams}
                            name={symbolParams.name}
                        />
                    </div>
                )}

                {/* --- ІНСТРУМЕНТИ МАЛЮВАННЯ (Без змін) --- */}
                {isDrawingMode && (
                    <div className="flex flex-col gap-6">
                        {/* ... (код інструментів ліній/зон залишається тим самим) ... */}
                        {/* Щоб зекономити місце, скопіюйте сюди блоки з попереднього Sidebar: ToolButton, Color, Thickness */}
                        <div>
                            <h3 className="mb-3 text-lg font-semibold">Інструменти</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <ToolButton label="Лінія" icon={Minus} tool={TOOLS.DRAW_LINE} activeTool={activeTool} setActiveTool={setActiveTool} />
                                <ToolButton label="Стрілка" icon={MoveUpRight} tool={TOOLS.DRAW_ARROW} activeTool={activeTool} setActiveTool={setActiveTool} />
                                <ToolButton label="Зона" icon={RectangleHorizontal} tool={TOOLS.DRAW_RECTANGLE} activeTool={activeTool} setActiveTool={setActiveTool} />
                                <ToolButton label="Коло" icon={Circle} tool={TOOLS.DRAW_CIRCLE} activeTool={activeTool} setActiveTool={setActiveTool} />
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-3 text-lg font-semibold">Колір</h3>
                            {/* ... кольори ... */}
                            <div className="flex flex-wrap gap-2">
                                <ColorButton color="#FF0000" activeColor={activeColor} setActiveColor={setActiveColor} />
                                <ColorButton color="#0000FF" activeColor={activeColor} setActiveColor={setActiveColor} />
                                <ColorButton color="#00FF00" activeColor={activeColor} setActiveColor={setActiveColor} />
                                <ColorButton color="#FFFF00" activeColor={activeColor} setActiveColor={setActiveColor} />
                                <ColorButton color="#FFFFFF" activeColor={activeColor} setActiveColor={setActiveColor} />
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-3 text-lg font-semibold">Товщина ({lineWeight}px)</h3>
                            <input type="range" min="1" max="10" value={lineWeight} onChange={(e) => setLineWeight(Number(e.target.value))} className="w-full" />
                        </div>
                    </div>
                )}
            </div>
            {/* Кнопка карт */}
            <div className="border-t border-zinc-700 p-4">
                <button onClick={onOpenMapManager} className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-800 p-3 text-blue-400 transition-colors hover:bg-zinc-700 hover:text-blue-300">
                    <MapIcon size={20} />
                    <span>Керування картами</span>
                </button>
                {/* --- AI PANEL --- */}
                {activeTab === 'ai' && (
                    <AIControlPanel sessionId={sessionId} />
                )}

            </div>
        </aside>
    );
}

export default Sidebar;
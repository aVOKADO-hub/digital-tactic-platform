// frontend/src/context/ToolContext.jsx

import React, { createContext, useContext, useState } from 'react';

// 1. Розширюємо список наших інструментів
export const TOOLS = {
    CURSOR: 'cursor', // Для виділення та перетягування об'єктів
    DRAW_LINE: 'draw_line', // Для малювання ліній
    DRAW_ARROW: 'draw_arrow', // Для малювання стрілок
    DRAW_RECTANGLE: 'draw_rectangle', // Для прямокутників
    DRAW_CIRCLE: 'draw_circle', // Для кіл
};

const ToolContext = createContext();

// Кастомний хук для легкого доступу
export function useTool() {
    return useContext(ToolContext);
}

export function ToolProvider({ children }) {
    // --- 2. ДОДАЄМО НОВИЙ СТАН ---
    const [activeTool, setActiveTool] = useState(TOOLS.CURSOR);
    // За замовчуванням колір буде червоний (як ми і робили)
    const [activeColor, setActiveColor] = useState('#FF0000'); // hex-код для червоного
    // За замовчуванням товщина 3px
    const [lineWeight, setLineWeight] = useState(3);
    // ----------------------------

    // 3. Передаємо всі нові значення у наш Provider
    const value = {
        activeTool,
        setActiveTool,
        TOOLS,
        activeColor,
        setActiveColor,
        lineWeight,
        setLineWeight,
    };

    return (
        <ToolContext.Provider value={value}>
            {children}
        </ToolContext.Provider>
    );
}
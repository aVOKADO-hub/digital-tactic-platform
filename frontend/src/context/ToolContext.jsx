import React, { createContext, useContext, useState } from 'react';

// Визначаємо наші інструменти
export const TOOLS = {
    CURSOR: 'cursor', // Для виділення та перетягування об'єктів
    DRAW_LINE: 'draw_line', // Для малювання ліній
};

const ToolContext = createContext();

// Кастомний хук для легкого доступу
export function useTool() {
    return useContext(ToolContext);
}

export function ToolProvider({ children }) {
    // За замовчуванням у нас в руках "Курсор"
    const [activeTool, setActiveTool] = useState(TOOLS.CURSOR);

    const value = {
        activeTool,
        setActiveTool,
        TOOLS,
    };

    return (
        <ToolContext.Provider value={value}>
            {children}
        </ToolContext.Provider>
    );
}



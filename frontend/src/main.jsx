import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { SocketProvider } from './context/SocketContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// 1. Імпортуємо наш новий ToolProvider
import { ToolProvider } from './context/ToolContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DndProvider backend={HTML5Backend}>
      <SocketProvider>
        {/* 2. Обгортаємо App у ToolProvider */}
        <ToolProvider>
          <App />
        </ToolProvider>
      </SocketProvider>
    </DndProvider>
  </React.StrictMode>
);
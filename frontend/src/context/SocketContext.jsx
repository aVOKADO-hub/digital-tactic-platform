import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

// ВАЖЛИВО: Ми підключаємося до нашого бек-енд сервера
const socket = io('http://localhost:5001');

const SocketContext = createContext();

export function useSocket() {
    return useContext(SocketContext);
}

export function SocketProvider({ children }) {
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        // Слухач на підключення
        function onConnect() {
            console.log('[Socket.io] Успішно підключено до WebSocket сервера! ID:', socket.id);
            setIsConnected(true);

            // --- НАШЕ ОНОВЛЕННЯ ---
            // !! ТИМЧАСОВО: Жорстко задаємо ID сесії для тестування
            // У майбутньому ми будемо брати цей ID з URL
            const testSessionId = 'my-first-session';
            socket.emit('joinSession', testSessionId);
            // ---------------------
        }

        // Слухач на відключення
        function onDisconnect() {
            console.warn('[Socket.io] Відключено від WebSocket сервера.');
            setIsConnected(false);
        }

        // Додаємо слухачів
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        // Прибираємо слухачів при демонтажі компонента
        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, []);

    // Надаємо сокет всім дочірнім компонентам
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

// Підключаємося до сервера
const socket = io('http://localhost:5001', {
    autoConnect: true,
    reconnection: true,
});

const SocketContext = createContext();

export function useSocket() {
    return useContext(SocketContext);
}

export function SocketProvider({ children }) {
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
            console.log('[Socket] Connected:', socket.id);
        }

        function onDisconnect() {
            setIsConnected(false);
            console.log('[Socket] Disconnected');
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}

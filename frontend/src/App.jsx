
import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import MapComponent from './components/MapComponent.jsx';
import 'leaflet/dist/leaflet.css';
import { useSocket } from './context/SocketContext.jsx';

function App() {
  const socket = useSocket();

  // --- 1. ПІДНІМАЄМО СТАН СЮДИ ---
  const [objects, setObjects] = useState([]);
  const [drawings, setDrawings] = useState([]);
  // ---------------------------------

  // --- 2. ПЕРЕНОСИМО СЛУХАЧІВ SOCKET.IO СЮДИ ---
  useEffect(() => {
    if (!socket) return;

    // Вся логіка отримання даних тепер живе тут
    const handleObjectAdded = (newObject) => {
      setObjects((prev) => [...prev, newObject]);
    };
    const handleObjectMoved = (data) => {
      setObjects((prevObjects) =>
        prevObjects.map((obj) =>
          obj.id === data.id ? { ...obj, latLng: data.latLng } : obj
        )
      );
    };
    const handleObjectDeleted = (id) => {
      setObjects((prev) => prev.filter((obj) => obj.id !== id));
    };
    const handleDrawingAdded = (newDrawing) => {
      setDrawings((prev) => [...prev, newDrawing]);
    };
    const handleDrawingDeleted = (id) => {
      setDrawings((prev) => prev.filter((drawing) => drawing.id !== id));
    };

    // Підписуємось на події
    socket.on('objectAdded', handleObjectAdded);
    socket.on('objectMoved', handleObjectMoved);
    socket.on('objectDeleted', handleObjectDeleted);
    socket.on('drawingAdded', handleDrawingAdded);
    socket.on('drawingDeleted', handleDrawingDeleted);

    // Відписуємось
    return () => {
      socket.off('objectAdded', handleObjectAdded);
      socket.off('objectMoved', handleObjectMoved);
      socket.off('objectDeleted', handleObjectDeleted);
      socket.off('drawingAdded', handleDrawingAdded);
      socket.off('drawingDeleted', handleDrawingDeleted);
    };
  }, [socket]); // Залежність тільки від 'socket'

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-800 text-white">
      {/* 3. ПЕРЕДАЄМО ДАНІ ВНИЗ У КОМПОНЕНТИ */}
      <Header objects={objects} drawings={drawings} />

      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 bg-zinc-700">

          <MapComponent objects={objects} drawings={drawings} />

        </main>
      </div>
    </div>
  );
}

export default App;
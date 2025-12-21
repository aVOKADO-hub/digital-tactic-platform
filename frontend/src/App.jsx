
import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import MapComponent from './components/MapComponent.jsx';
import 'leaflet/dist/leaflet.css';
import { useSocket } from './context/SocketContext.jsx';
// 1. Імпортуємо модальне вікно та axios
import LoadScenarioModal from './components/LoadScenarioModal.jsx';
import axios from 'axios';

function App() {
  const socket = useSocket();

  // --- 1. ПІДНІМАЄМО СТАН СЮДИ ---
  const [objects, setObjects] = useState([]);
  const [drawings, setDrawings] = useState([]);

  // 2. Додаємо стан для керування модалкою
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
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
    // 4. ДОДАЄМО НОВОГО СЛУХАЧА:
    // Коли хтось інший завантажує сценарій, ми оновлюємо наш стан
    const handleScenarioLoaded = (data) => {
      console.log('[Socket.io] Отримано новий сценарій від іншого клієнта!');
      setObjects(data.objects);
      setDrawings(data.drawings);
    };

    // Підписуємось на події
    socket.on('objectAdded', handleObjectAdded);
    socket.on('objectMoved', handleObjectMoved);
    socket.on('objectDeleted', handleObjectDeleted);
    socket.on('drawingAdded', handleDrawingAdded);
    socket.on('drawingDeleted', handleDrawingDeleted);
    socket.on('scenarioLoaded', handleScenarioLoaded);

    // Відписуємось
    return () => {
      socket.off('objectAdded', handleObjectAdded);
      socket.off('objectMoved', handleObjectMoved);
      socket.off('objectDeleted', handleObjectDeleted);
      socket.off('drawingAdded', handleDrawingAdded);
      socket.off('drawingDeleted', handleDrawingDeleted);
      socket.off('scenarioLoaded', handleScenarioLoaded);
    };
  }, [socket]); // Залежність тільки від 'socket'

  // 5. Функція, яку ми передамо в модальне вікно
  const handleLoadScenario = async (scenarioId) => {
    try {
      // 5.1. Отримуємо дані сценарію з бек-енду
      const { data } = await axios.get(`/api/scenarios/${scenarioId}`);

      // 5.2. Оновлюємо наш локальний стан
      setObjects(data.objects);
      setDrawings(data.drawings);

      // 5.3. Розсилаємо всім іншим цей сценарій (як ти і планував!)
      socket.emit('loadScenario', {
        objects: data.objects,
        drawings: data.drawings,
      });

      // 5.4. Закриваємо модалку
      setIsLoadModalOpen(false);
      console.log('Сценарій успішно завантажено!', data.name);
    } catch (error) {
      console.error('Помилка завантаження сценарію:', error);
      alert('Помилка завантаження сценарію!');
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-800 text-white">
      {/* 3. ПЕРЕДАЄМО ДАНІ ВНИЗ У КОМПОНЕНТИ */}
      {/* 6. Передаємо пропс onLoadClick в Header */}

      <Header
        objects={objects}
        drawings={drawings}
        onLoadClick={() => setIsLoadModalOpen(true)} // <-- Ми передаємо його тут
      />

      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 bg-zinc-700">

          <MapComponent objects={objects} drawings={drawings} />

        </main>
      </div>
      {/* 7. Рендеримо модальне вікно, якщо стан 'true' */}
      {isLoadModalOpen && (
        <LoadScenarioModal
          onClose={() => setIsLoadModalOpen(false)}
          onLoad={handleLoadScenario}
        />
      )}
    </div>
  );
}

export default App;
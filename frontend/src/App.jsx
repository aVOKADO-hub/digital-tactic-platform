import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Components
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import MapComponent from './components/MapComponent.jsx';
import LoadScenarioModal from './components/LoadScenarioModal.jsx';
import MapManagerModal from './components/MapManagerModal';
import LoginPage from './components/LoginPage.jsx';
import LobbyPage from './components/LobbyPage.jsx';
import ScenarioModal from './components/ScenarioModal'; // New import
import BattleLog from './components/BattleLog'; // Battle log component

// Contexts
import { useSocket } from './context/SocketContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToolProvider } from './context/ToolContext.jsx';
import { updateMap } from './services/mapService';
import { saveScenario as apiSaveScenario, getScenarioById } from './services/scenarioService'; // New imports
import { exportToJson, takeScreenshot } from './services/exportService'; // New imports
import { Settings, FileText, Camera } from 'lucide-react'; // Import icons (FileText, Camera added)

// HOC for protected routes
const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Завантаження...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// --- GAME LAYOUT (The actual map logic) ---
function GameLayout() {
  const { sessionId } = useParams(); // Get session ID from URL
  const socket = useSocket();
  const { user, logout } = useAuth(); // Get user and logout function

  const [isMapManagerOpen, setIsMapManagerOpen] = useState(false);
  const [activeMap, setActiveMap] = useState(null); // This is the map object from DB
  const [objects, setObjects] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]); // List of users in room

  // Calibration State
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Scenario State
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isSavingScenario, setIsSavingScenario] = useState(false);

  // 1. Join Session on Mount
  useEffect(() => {
    if (!socket || !sessionId) return;

    // Join the specific room with user info
    socket.emit('joinSession', {
      sessionId,
      user: {
        _id: user.id || user._id, // Handle different ID fields
        name: user.name,
        role: user.role,
        color: user.color // If user has color
      }
    });

    // --- Also fetch session details to get the map, objects, and drawings ---
    const fetchSessionDetails = async () => {
      try {
        const { data } = await axios.get(`/api/sessions/${sessionId}`);
        if (data) {
          if (data.map) {
            setActiveMap(data.map);
          }
          // Load persisted objects and drawings!
          if (data.objects && data.objects.length > 0) {
            setObjects(data.objects);
            console.log(`[App] Loaded ${data.objects.length} objects from DB`);
          }
          if (data.drawings && data.drawings.length > 0) {
            setDrawings(data.drawings);
            console.log(`[App] Loaded ${data.drawings.length} drawings from DB`);
          }
        }
      } catch (err) {
        console.error("Failed to load session details", err);
      }
    };
    fetchSessionDetails();

  }, [socket, sessionId]);

  // Calibration Handler
  const handleSaveCalibration = async (newBounds) => {
    if (!activeMap) return;
    try {
      // 1. Update backend
      // We save calibrationData as { bounds: [[lat,lng],[lat,lng]] }
      const updatedMap = await updateMap(activeMap._id, { bounds: newBounds });

      // 2. Update local state
      setActiveMap(updatedMap);
      setIsCalibrating(false);
      alert("Калібрування збережено!");
    } catch (error) {
      console.error("Calibration save error:", error);
      alert("Помилка збереження. Див. консоль.");
    }
  };

  // --- SCENARIO LOGIC ---
  // Save Scenario
  const handleSaveScenario = async (name) => {
    setIsSavingScenario(true);
    try {
      await apiSaveScenario({
        name,
        objects: objects, // Current state
        drawings: drawings, // Current state
        mapId: activeMap ? activeMap._id : 'osm'
      });
      alert('Сценарій успішно збережено!');
      setIsScenarioModalOpen(false);
    } catch (error) {
      console.error('Error saving scenario:', error);
      alert('Помилка при збереженні сценарію');
    } finally {
      setIsSavingScenario(false);
    }
  };

  // Load Scenario
  const handleLoadScenario = async (idOrData) => {
    try {
      let scenarioData;

      if (typeof idOrData === 'string') {
        // It's an ID, fetch from API
        const { data } = await axios.get(`/api/scenarios/${idOrData}`);
        scenarioData = data;
        // Note: data contains { name, objects, drawings, ... }
      } else {
        // It's raw data (from Import JSON)
        scenarioData = idOrData;
      }

      // 1. Update Local State
      setObjects(scenarioData.objects || []);
      setDrawings(scenarioData.drawings || []);

      // 2. Sync with Socket
      if (socket) {
        socket.emit('loadScenario', {
          objects: scenarioData.objects || [],
          drawings: scenarioData.drawings || []
        });
      }

      setIsScenarioModalOpen(false);
    } catch (error) {
      console.error('Error loading scenario:', error);
      alert('Помилка завантаження сценарію');
    }
  };
  // ----------------------

  // ... (Socket Listeners remain same) ...
  useEffect(() => {
    if (!socket) return;
    const handleObjectUpdated = (updatedData) => {
      setObjects((prev) => prev.map((obj) => obj.id === updatedData.id ? { ...obj, ...updatedData } : obj));
    };
    const handleObjectAdded = (newObject) => setObjects((prev) => [...prev, newObject]);
    const handleObjectMoved = (data) => {
      setObjects((prev) => prev.map((obj) => obj.id === data.id ? { ...obj, latLng: data.latLng } : obj));
    };
    const handleObjectDeleted = (id) => setObjects((prev) => prev.filter((obj) => obj.id !== id));
    const handleDrawingAdded = (newDrawing) => setDrawings((prev) => [...prev, newDrawing]);
    const handleDrawingDeleted = (id) => setDrawings((prev) => prev.filter((drawing) => drawing.id !== id));
    const handleScenarioLoaded = (data) => {
      setObjects(data.objects);
      setDrawings(data.drawings);
    };
    const handleRoomUsersUpdate = (users) => {
      setConnectedUsers(users);
    };

    // Combat: Unit destroyed (separate from delete for animation handling)
    const handleObjectDestroyed = (data) => {
      console.log(`[Combat] Unit ${data.id} destroyed!`);
      setObjects((prev) => prev.filter((obj) => obj.id !== data.id));
    };

    socket.on('objectAdded', handleObjectAdded);
    socket.on('objectMoved', handleObjectMoved);
    socket.on('objectDeleted', handleObjectDeleted);
    socket.on('drawingAdded', handleDrawingAdded);
    socket.on('drawingDeleted', handleDrawingDeleted);
    socket.on('scenarioLoaded', handleScenarioLoaded);
    socket.on('objectUpdated', handleObjectUpdated);
    socket.on('roomUsersUpdate', handleRoomUsersUpdate);
    socket.on('objectDestroyed', handleObjectDestroyed);

    return () => {
      socket.off('objectAdded', handleObjectAdded);
      socket.off('objectMoved', handleObjectMoved);
      socket.off('objectDeleted', handleObjectDeleted);
      socket.off('drawingAdded', handleDrawingAdded);
      socket.off('drawingDeleted', handleDrawingDeleted);
      socket.off('scenarioLoaded', handleScenarioLoaded);
      socket.off('objectUpdated', handleObjectUpdated);
      socket.off('roomUsersUpdate', handleRoomUsersUpdate);
      socket.off('objectDestroyed', handleObjectDestroyed);
    };
  }, [socket]);

  const handleObjectUpdate = (id, newProps) => {
    setObjects((prev) => prev.map((obj) => (obj.id === id ? { ...obj, ...newProps } : obj)));
    socket.emit('updateObject', { id, ...newProps });
  };

  const handleLogout = () => {
    logout();
  };

  const handleScreenshot = () => {
    // Assuming the map container has ID 'map-container'
    // We need to add this ID to the main element below
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    takeScreenshot('map-main', `tactical-map-${timestamp}.png`);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-800 text-white relative">
      <Header
        user={user}
        connectedUsers={connectedUsers} // Pass users to header
        onLogout={handleLogout}
        activeMap={activeMap}
        onChangeMap={/* Ми поки не маємо кнопки зміни карти тут, але можна додати */ () => { }}
      />

      {/* Instructor Controls */}
      {user?.role === 'instructor' && (
        <div className="absolute top-20 right-4 z-[1000] flex flex-col gap-2">
          {/* Calibration Button */}
          {activeMap && !isCalibrating && (
            <button
              onClick={() => setIsCalibrating(true)}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700"
            >
              <Settings size={18} />
              Калібрувати карту
            </button>
          )}

          {/* Scenarios Button */}
          <button
            onClick={() => setIsScenarioModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-zinc-700 border border-zinc-500 px-4 py-2 font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-zinc-600"
          >
            <FileText size={18} />
            Сценарії
          </button>

          {/* Screenshot Button */}
          <button
            onClick={handleScreenshot}
            className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-indigo-700"
          >
            <Camera size={18} />
            Скріншот
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 relative">
        <Sidebar onOpenMapManager={() => setIsMapManagerOpen(true)} sessionId={sessionId} />
        <main id="map-main" className="flex-1 bg-zinc-700 relative">
          <MapComponent
            activeMap={activeMap}
            objects={objects}
            drawings={drawings}
            isCalibrating={isCalibrating} // Pass calibration state
            onSaveCalibration={handleSaveCalibration}
            onCancelCalibration={() => setIsCalibrating(false)} // Pass cancel handler
            connectedUsers={connectedUsers} // Pass connected users for cursors
            sessionId={sessionId} // Pass sessionId for AI orders
            onObjectUpdate={handleObjectUpdate} // For editing unit properties
          />
        </main>
      </div>

      {/* Scenario Modal */}
      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        onSave={handleSaveScenario}
        onLoad={handleLoadScenario}
        isSaving={isSavingScenario}
      />

      {isLoadModalOpen && (
        <LoadScenarioModal onClose={() => setIsLoadModalOpen(false)} onLoad={handleLoadScenario} />
      )}
      <MapManagerModal
        isOpen={isMapManagerOpen}
        onClose={() => setIsMapManagerOpen(false)}
        activeMap={activeMap}
        onSelectMap={setActiveMap}
      />

      {/* Battle Log */}
      <BattleLog socket={socket} />
    </div>
  );
}

// --- MAIN APP ---
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/lobby" element={
            <RequireAuth>
              <LobbyPage />
            </RequireAuth>
          } />

          <Route path="/session/:sessionId" element={
            <RequireAuth>
              <ToolProvider>
                <GameLayout />
              </ToolProvider>
            </RequireAuth>
          } />

          <Route path="*" element={<Navigate to="/lobby" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
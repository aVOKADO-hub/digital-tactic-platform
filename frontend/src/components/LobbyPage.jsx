import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, Map as MapIcon, LogOut, Loader2, Settings } from 'lucide-react';
import MapManagerModal from './MapManagerModal'; // Import MapManager

const LobbyPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isMapManagerOpen, setIsMapManagerOpen] = useState(false); // State for Map Manager

    // State for creating new session
    const [newSessionName, setNewSessionName] = useState('');
    const [maps, setMaps] = useState([]);
    const [selectedMapId, setSelectedMapId] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    // Fetch sessions on mount
    useEffect(() => {
        fetchSessions();
    }, []);

    // Fetch maps whenever we start creating a session to get the latest list
    useEffect(() => {
        if (isCreating) {
            fetchMaps();
        }
    }, [isCreating]);

    const fetchSessions = async () => {
        try {
            const { data } = await axios.get('/api/sessions');
            setSessions(data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMaps = async () => {
        try {
            const { data } = await axios.get('/api/maps');
            setMaps(data);
            if (!selectedMapId) setSelectedMapId('osm');
        } catch (error) {
            console.error('Error fetching maps:', error);
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        if (!newSessionName || !selectedMapId) return;

        setCreateLoading(true);
        try {
            const { data } = await axios.post('/api/sessions', {
                name: newSessionName,
                mapId: selectedMapId,
                instructorId: user._id
            });
            // Navigate to the new session
            navigate(`/session/${data._id}`);
        } catch (error) {
            console.error('Error creating session:', error);
            alert('Не вдалося створити сесію');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleJoinSession = (sessionId) => {
        navigate(`/session/${sessionId}`);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-zinc-900 text-white p-6">
            {/* Header */}
            <header className="mx-auto max-w-5xl mb-8 flex items-center justify-between border-b border-zinc-700 pb-4">
                <div>
                    <h1 className="text-2xl font-bold">Тактичний Лобі</h1>
                    <p className="text-zinc-400">Вітаємо, <span className="text-blue-400 font-medium">{user?.username}</span></p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-md border border-zinc-600 px-3 py-2 text-sm hover:bg-zinc-800"
                >
                    <LogOut size={16} />
                    Вийти
                </button>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-5xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Активні сесії</h2>
                    {user?.role === 'instructor' && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsMapManagerOpen(true)}
                                className="flex items-center gap-2 rounded-md border border-zinc-600 px-4 py-2 font-medium transition-colors hover:bg-zinc-800"
                            >
                                <Settings size={18} />
                                Менеджер Карт
                            </button>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium transition-colors hover:bg-blue-700"
                            >
                                <Plus size={18} />
                                Створити сесію
                            </button>
                        </div>
                    )}
                </div>

                {/* Sessions Grid */}
                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-zinc-700 p-12 text-center text-zinc-500">
                        Немає активних сесій. {user?.role === 'instructor' ? 'Створіть першу!' : 'Очікуйте, поки інструктор створить сесію.'}
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {sessions.map((session) => (
                            <div key={session._id} className="group relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 p-5 transition-all hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-lg">{session.name}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${session.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                                        {session.status}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm text-zinc-400 mb-4">
                                    <div className="flex items-center gap-2">
                                        <MapIcon size={14} />
                                        <span>Карта: {session.map?.name || 'Невідома карта'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users size={14} />
                                        <span>Інструктор: {session.instructor?.username || 'Unknown'}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleJoinSession(session._id)}
                                    className="w-full rounded bg-zinc-700 py-2 text-sm font-medium transition-colors hover:bg-blue-600 group-hover:bg-blue-600"
                                >
                                    Приєднатися
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Session Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-lg bg-zinc-800 p-6 shadow-2xl border border-zinc-700">
                        <h3 className="mb-4 text-xl font-bold">Нова сесія</h3>

                        <form onSubmit={handleCreateSession} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-300">Назва сесії</label>
                                <input
                                    type="text"
                                    value={newSessionName}
                                    onChange={(e) => setNewSessionName(e.target.value)}
                                    className="w-full rounded border border-zinc-600 bg-zinc-900 p-2 focus:border-blue-500 focus:outline-none"
                                    placeholder="Операція 'Alpha'"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-300">Виберіть карту</label>
                                <select
                                    value={selectedMapId}
                                    onChange={(e) => setSelectedMapId(e.target.value)}
                                    className="w-full rounded border border-zinc-600 bg-zinc-900 p-2 focus:border-blue-500 focus:outline-none"
                                    required
                                >
                                    <option value="osm">Стандартна карта (OSM)</option>
                                    {maps.map((map) => (
                                        <option key={map._id} value={map._id}>
                                            {map.name}
                                        </option>
                                    ))}
                                </select>
                                {maps.length === 0 && (
                                    <p className="mt-1 text-xs text-red-400">Немає доступних карт. Використовуйте "Менеджер Карт" для завантаження.</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="rounded border border-zinc-600 px-4 py-2 text-sm font-medium hover:bg-zinc-700"
                                >
                                    Скасувати
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading || maps.length === 0}
                                    className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {createLoading && <Loader2 className="animate-spin" size={14} />}
                                    Створити
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Map Manager Modal */}
            <MapManagerModal
                isOpen={isMapManagerOpen}
                onClose={() => setIsMapManagerOpen(false)}
                activeMap={null} // In lobby we don't have an active map context
                onSelectMap={(map) => {
                    // Optional: If user selects a map here, we could auto-fill the create session form
                    // For now, just close manager and maybe open create session
                    setIsMapManagerOpen(false);
                    // setIsCreating(true); // Uncomment if we want this flow
                    // setSelectedMapId(map._id);
                }}
            />
        </div>
    );
};

export default LobbyPage;

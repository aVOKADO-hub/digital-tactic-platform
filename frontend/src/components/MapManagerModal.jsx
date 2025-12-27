// frontend/src/components/MapManagerModal.jsx
import React, { useState, useEffect } from 'react';
import { getMaps, uploadMap } from '../services/mapService';
import { X, Upload, Map as MapIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MapManagerModal = ({ isOpen, onClose, onSelectMap, activeMap }) => {
    const [maps, setMaps] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth(); // <--- Get user from context

    // Стан форми
    const [mapName, setMapName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Завантажуємо список карт при відкритті
    useEffect(() => {
        if (isOpen) {
            loadMaps();
        }
    }, [isOpen]);

    const loadMaps = async () => {
        setLoading(true);
        try {
            const data = await getMaps();
            setMaps(data);
        } catch (error) {
            console.error("Помилка завантаження карт:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!mapName || !selectedFile) return;

        setUploading(true);
        try {
            // Використовуємо ID реального користувача
            await uploadMap(mapName, selectedFile, user._id);

            // Очищення форми та оновлення списку
            setMapName('');
            setSelectedFile(null);
            loadMaps();
        } catch (error) {
            alert('Помилка завантаження. Перевірте консоль.');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-xl bg-gray-900 p-6 text-white shadow-2xl border border-gray-700">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between border-b border-gray-700 pb-4">
                    <h2 className="flex items-center gap-2 text-xl font-bold">
                        <MapIcon className="text-blue-500" />
                        Менеджер Карт
                    </h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Ліва колонка: Список карт */}
                    <div className="border-r border-gray-700 pr-6">
                        <h3 className="mb-3 font-semibold text-gray-400">Доступні карти</h3>
                        <div className="h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600">
                            {loading ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Опція за замовчуванням (OSM) */}
                                    <div
                                        onClick={() => onSelectMap(null)}
                                        className={`cursor-pointer rounded-lg border p-3 transition-all hover:bg-gray-800 ${activeMap === null ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'}`}
                                    >
                                        <div className="font-medium">Стандартна карта (OSM)</div>
                                        <div className="text-xs text-gray-500">OpenStreetMap Global</div>
                                    </div>

                                    {/* Список завантажених карт */}
                                    {maps.map((map) => (
                                        <div
                                            key={map._id}
                                            onClick={() => onSelectMap(map)}
                                            className={`cursor-pointer rounded-lg border p-3 transition-all hover:bg-gray-800 flex gap-3 items-center ${activeMap?._id === map._id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'}`}
                                        >
                                            {/* Мініатюра */}
                                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-gray-700">
                                                <img src={`http://localhost:5001${map.url}`} alt={map.name} className="h-full w-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{map.name}</div>
                                                <div className="text-xs text-gray-500">Зав: {map.uploadedBy?.username || 'User'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Права колонка: Завантаження */}
                    <div>
                        <h3 className="mb-3 font-semibold text-gray-400">Завантажити нову</h3>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm text-gray-400">Назва карти</label>
                                <input
                                    type="text"
                                    value={mapName}
                                    onChange={(e) => setMapName(e.target.value)}
                                    className="w-full rounded bg-gray-800 p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Напр: Сектор А"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-gray-400">Файл зображення</label>
                                <div className="relative flex w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-600 bg-gray-800 p-6 transition-colors hover:border-blue-500">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 cursor-pointer opacity-0"
                                        required
                                    />
                                    <div className="text-center">
                                        <Upload className="mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm text-gray-400">
                                            {selectedFile ? selectedFile.name : "Клікніть або перетягніть"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 py-2 font-semibold hover:bg-blue-700 disabled:opacity-50"
                            >
                                {uploading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
                                {uploading ? 'Завантаження...' : 'Завантажити на сервер'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapManagerModal;
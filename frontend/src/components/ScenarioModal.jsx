import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Upload, FileText, Calendar, Download, FileJson } from 'lucide-react';
import { getScenarios, getScenarioById } from '../services/scenarioService';
import { exportToJson, importFromJson } from '../services/exportService';

function ScenarioModal({ isOpen, onClose, onSave, onLoad, isSaving }) {
    const [mode, setMode] = useState('load'); // 'load' | 'save'
    const [scenarios, setScenarios] = useState([]);
    const [scenarioName, setScenarioName] = useState('');
    const [isLoadingList, setIsLoadingList] = useState(false);
    const fileInputRef = useRef(null);

    // Fetch list whenever modal opens or mode switches to 'load'
    useEffect(() => {
        if (isOpen && mode === 'load') {
            fetchScenarios();
        }
    }, [isOpen, mode]);

    const fetchScenarios = async () => {
        setIsLoadingList(true);
        try {
            const data = await getScenarios();
            setScenarios(data);
        } catch (error) {
            console.error('Error fetching scenarios:', error);
        } finally {
            setIsLoadingList(false);
        }
    };

    const handleSaveSubmit = (e) => {
        e.preventDefault();
        if (scenarioName.trim()) {
            onSave(scenarioName);
            setScenarioName('');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const data = await importFromJson(file);
            // Validating data structure briefly
            if (!data.objects && !data.drawings) {
                alert('Невірний формат файлу сценарію');
                return;
            }
            // Ask user for confirmation or name? 
            // Actually, we probably want to LOAD it directly.
            // Check props: onLoad takes an ID. But here we have raw data.
            // We need to modify App.jsx to support loading raw data OR save it first?
            // "onLoad" in App.jsx fetches by ID.

            // OPTION A: Save it as a new scenario then load it.
            // OPTION B: Pass raw data to App.jsx.

            // Let's go with OPTION A for consistency: Save imported scenario.
            // But wait, user might just want to view it.
            // Better: Add a new prop `onImport` to ScenarioModal. 
            // For now, I'll assumme I can pass data to `onLoad` if I change App.jsx.
            // But `onLoad` in App.jsx does `axios.get`. 

            // HACK: I will allow `onLoad` to accept OBJECT data instead of ID if it detects it's an object.
            // OR I just modify `onLoad` prop signature to `(idOrData)`.

            onLoad(data); // Passing RAW data
        } catch (error) {
            console.error('Import error:', error);
            alert('Помилка імпорту файлу');
        }
        e.target.value = null; // Reset
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-[500px] overflow-hidden rounded-xl bg-zinc-900 shadow-2xl border border-zinc-700">
                {/* Header */}
                <div className="flex items-center justify-between bg-zinc-800 px-4 py-3 border-b border-zinc-700">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                        <FileText size={20} className="text-blue-500" />
                        Менеджер Сценаріїв
                    </h2>
                    <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-zinc-700 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-700">
                    <button
                        onClick={() => setMode('load')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'load' ? 'bg-zinc-800 text-blue-400 border-b-2 border-blue-500' : 'text-zinc-400 hover:bg-zinc-800'
                            }`}
                    >
                        <Upload size={16} className="inline mr-2" />
                        Завантажити
                    </button>
                    <button
                        onClick={() => setMode('save')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'save' ? 'bg-zinc-800 text-green-400 border-b-2 border-green-500' : 'text-zinc-400 hover:bg-zinc-800'
                            }`}
                    >
                        <Save size={16} className="inline mr-2" />
                        Зберегти
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        style={{ display: 'none' }}
                    />

                    {mode === 'save' ? (
                        <form onSubmit={handleSaveSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Назва сценарію</label>
                                <input
                                    type="text"
                                    value={scenarioName}
                                    onChange={(e) => setScenarioName(e.target.value)}
                                    placeholder="Напр. 'Оборона Києва - Фаза 1'"
                                    className="w-full rounded bg-zinc-800 border border-zinc-600 p-2 text-white focus:border-green-500 outline-none"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving || !scenarioName.trim()}
                                className="flex items-center justify-center gap-2 rounded bg-green-600 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Збереження...' : 'Зберегти поточноу ситуацію'}
                            </button>
                        </form>
                    ) : (
                        <div className="flex flex-col h-[300px]">
                            {isLoadingList ? (
                                <div className="flex-1 flex items-center justify-center text-zinc-500">
                                    Завантаження списку...
                                </div>
                            ) : scenarios.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-zinc-500">
                                    Немає збережених сценаріїв
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                                    {/* Import Button */}
                                    <button
                                        onClick={handleImportClick}
                                        className="mb-2 flex w-full items-center justify-center gap-2 rounded border border-dashed border-zinc-600 py-3 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                                    >
                                        <FileJson size={20} />
                                        Імпортувати з файлу JSON
                                    </button>

                                    {scenarios.map((sc) => (
                                        <div
                                            key={sc._id}
                                            className="group flex items-center justify-between rounded-lg bg-zinc-800 p-3 border border-zinc-700 hover:border-blue-500 transition-colors cursor-pointer"
                                        // onClick={() => onLoad(sc._id)} // Don't trigger on container click to avoid conflict with buttons
                                        >
                                            <div className="flex flex-col flex-1" onClick={() => onLoad(sc._id)}>
                                                <span className="font-semibold text-white group-hover:text-blue-400">{sc.name}</span>
                                                <span className="text-xs text-zinc-500 flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {new Date(sc.createdAt).toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="flex gap-2">
                                                {/* Download Button */}
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            // 1. Fetch full data
                                                            const fullScenario = await getScenarioById(sc._id);
                                                            // 2. Export
                                                            exportToJson(fullScenario, `scenario-${sc.name.replace(/\s+/g, '-')}.json`);
                                                        } catch (error) {
                                                            console.error('Export failed:', error);
                                                            alert('Не вдалося експортувати сценарій');
                                                        }
                                                    }}
                                                    className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-white"
                                                    title="Експорт в JSON"
                                                >
                                                    <Download size={16} />
                                                </button>

                                                <button
                                                    onClick={() => onLoad(sc._id)}
                                                    className="rounded bg-blue-600/20 px-3 py-1 text-xs font-bold text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all"
                                                >
                                                    LOAD
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ScenarioModal;

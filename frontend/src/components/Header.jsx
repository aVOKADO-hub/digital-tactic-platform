
import React, { useState } from 'react';
import { Share, Settings, Users, LogOut, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

function Header({ user, connectedUsers = [], onLogout, activeMap, onChangeMap }) {
    const [isUserListOpen, setIsUserListOpen] = useState(false);

    // Filter out current user from the list if needed, or show all
    // Let's show all

    return (
        <header className="flex h-16 w-full flex-shrink-0 items-center justify-between border-b border-zinc-700 bg-zinc-900 px-4 select-none relative z-[2000]">
            {/* Left: Brand & Map Info */}
            <div className="flex items-center gap-4">
                <Link to="/lobby" className="flex flex-col hover:opacity-80 transition-opacity">
                    <h1 className="text-xl font-bold text-white">Digital Tactic Platform</h1>
                    <span className="text-xs text-zinc-400">
                        {activeMap ? `Map: ${activeMap.name}` : 'Map: Завантаження...'}
                    </span>
                </Link>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-4">
                {/* USER LIST DROPDOWN */}
                <div className="relative">
                    <button
                        onClick={() => setIsUserListOpen(!isUserListOpen)}
                        className={`flex items-center gap-2 rounded-md p-2 transition-colors ${isUserListOpen ? 'bg-zinc-700' : 'hover:bg-zinc-700'} text-zinc-200`}
                        title="Учасники сесії"
                    >
                        <Users size={20} />
                        <span className="text-sm font-bold">{connectedUsers.length}</span>
                        <ChevronDown size={14} className={`transition-transform ${isUserListOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* DROPDOWN MENU */}
                    {isUserListOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsUserListOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-zinc-600 bg-zinc-800 shadow-xl z-20 overflow-hidden">
                                <div className="bg-zinc-900 p-3 border-b border-zinc-700">
                                    <h3 className="text-sm font-bold text-zinc-300">Учасники ({connectedUsers.length})</h3>
                                </div>
                                <div className="max-h-64 overflow-y-auto p-2 flex flex-col gap-1">
                                    {connectedUsers.map((u) => (
                                        <div key={u.id} className="flex items-center gap-2 rounded p-2 hover:bg-zinc-700">
                                            <div
                                                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-zinc-900"
                                                style={{ backgroundColor: u.color }}
                                            >
                                                {u.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-white font-medium flex items-center gap-2">
                                                    {u.name}
                                                    {u.id === user?.socketId && <span className="text-xs text-zinc-500">(Ви)</span>}
                                                </span>
                                                <span className="text-xs text-zinc-400 capitalize">{u.role}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="h-6 w-px bg-zinc-700 mx-2"></div>

                {/* CURRENT USER PROFILE */}
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-white">{user?.name}</span>
                        <span className="text-xs text-zinc-400 capitalize">{user?.role}</span>
                    </div>
                    <div className="h-9 w-9 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white">
                        {user?.name?.substring(0, 1).toUpperCase()}
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    className="ml-2 rounded-md p-2 text-red-400 transition-colors hover:bg-zinc-700 hover:text-red-300"
                    title="Вийти"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
}

export default Header;
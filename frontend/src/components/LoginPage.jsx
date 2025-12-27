import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Shield } from 'lucide-react';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('observer');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim()) {
            setError("Будь ласка, введіть ім'я користувача");
            return;
        }

        try {
            await login(username, role);
            navigate('/lobby');
        } catch (err) {
            setError(err.response?.data?.message || 'Помилка входу');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
            <div className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-800 p-8 shadow-xl">
                <div className="mb-6 flex flex-col items-center">
                    <div className="mb-2 rounded-full bg-blue-600 p-3">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-2xl font-bold">Digital Tactic Platform</h1>
                    <p className="text-zinc-400">Увійдіть, щоб продовжити</p>
                </div>

                {error && (
                    <div className="mb-4 rounded bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-zinc-300">
                            Позивний / Ім'я
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-md border border-zinc-600 bg-zinc-900 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
                                placeholder="Сержант Петренко"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-zinc-300">
                            Роль
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full rounded-md border border-zinc-600 bg-zinc-900 p-2 focus:border-blue-500 focus:outline-none"
                        >
                            <option value="observer">Спостерігач (Observer)</option>
                            <option value="instructor">Інструктор (Instructor)</option>
                        </select>
                        <p className="mt-1 text-xs text-zinc-500">
                            * Інструктор може створювати та керувати сесіями
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="mt-6 w-full rounded-md bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                    >
                        Увійти
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;

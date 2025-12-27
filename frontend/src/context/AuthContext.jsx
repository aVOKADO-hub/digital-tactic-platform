import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Перевіряємо, чи є збережений користувач в localStorage при завантаженні
    const storedUser = localStorage.getItem('tactical_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, role) => {
    try {
      // Реєструємо або отримуємо користувача з бекенду
      const { data } = await axios.post('/api/users', { username, role });
      
      // Зберігаємо в стані
      setUser(data);
      // Зберігаємо в localStorage для персистентності
      localStorage.setItem('tactical_user', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tactical_user');
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

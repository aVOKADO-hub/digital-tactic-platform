// frontend/src/services/mapService.js
import axios from 'axios';

const API_URL = '/api/maps'; // Use relative path to leverage proxy

// Отримати список всіх карт
export const getMaps = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

// Завантажити нову карту
export const uploadMap = async (name, file, userId) => {
    const formData = new FormData();
    // Важливо: ключі повинні збігатися з тим, що чекає бекенд
    formData.append('name', name);
    formData.append('uploadedBy', userId);
    formData.append('mapImage', file); // <-- Саме 'mapImage', як у mapRoutes.js

    const response = await axios.post(API_URL, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Оновити карту (калібрування)
export const updateMap = async (id, calibrationData) => {
    const response = await axios.put(`${API_URL}/${id}`, { calibrationData });
    return response.data;
};
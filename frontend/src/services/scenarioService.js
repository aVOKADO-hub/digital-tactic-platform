import axios from 'axios';

const API_URL = 'http://localhost:5001/api/scenarios';

// Зберегти новий сценарій
export const saveScenario = async (scenarioData) => {
    const response = await axios.post(API_URL, scenarioData);
    return response.data;
};

// Отримати список всіх сценаріїв (тільки метадані)
export const getScenarios = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

// Отримати повні дані сценарію за ID
export const getScenarioById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

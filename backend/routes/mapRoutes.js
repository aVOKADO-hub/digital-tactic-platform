import express from 'express';
const router = express.Router();
import { uploadMap, getAllMaps, updateMap } from '../controllers/mapController.js';
import upload from '../middleware/uploadMiddleware.js'; // Імпортуємо наш 'multer'

// /api/maps

// GET-запит - просто отримує всі карти
router.get('/', getAllMaps);

// POST-запит - завантаження
router.post('/', upload.single('mapImage'), uploadMap);

// PUT-запит - оновлення (калібрування)
router.put('/:id', updateMap);

export default router;

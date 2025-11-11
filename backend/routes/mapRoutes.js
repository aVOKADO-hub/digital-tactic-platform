import express from 'express';
const router = express.Router();
import { uploadMap, getAllMaps } from '../controllers/mapController.js';
import upload from '../middleware/uploadMiddleware.js'; // Імпортуємо наш 'multer'

// /api/maps

// GET-запит - просто отримує всі карти
router.get('/', getAllMaps);

// POST-запит - тут магія!
// 1. Спочатку спрацює `upload.single('mapImage')`
// 2. Він візьме файл з поля 'mapImage', збереже його в 'backend/uploads/'
// 3. І лише ПОТІМ він передасть управління `uploadMap`
router.post('/', upload.single('mapImage'), uploadMap);

// 'mapImage' - це назва поля, яке ми будемо використовувати в Postman

export default router;

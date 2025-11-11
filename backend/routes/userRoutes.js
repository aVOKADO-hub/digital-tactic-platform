import express from 'express';
const router = express.Router();

// 1. Імпортуємо наші нові функції-контролери
import { registerUser, getAllUsers } from '../controllers/userController.js';

// 2. Кажемо, що POST-запит на '/' тепер обробляє функція registerUser
router.post('/', registerUser);

// 3. Кажемо, що GET-запит на '/' тепер обробляє функція getAllUsers
router.get('/', getAllUsers);

// Ми можемо це записати і в один рядок, це те ж саме:
// router.route('/').post(registerUser).get(getAllUsers);

export default router;


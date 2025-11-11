import mongoose from 'mongoose';

// 1. Створюємо "креслення" (Схему) для нашого Користувача
const userSchema = new mongoose.Schema(
    {
        // Ім'я користувача (або нікнейм)
        username: {
            type: String,
            required: true, // Це поле є обов'язковим
            unique: true, // Це поле має бути унікальним (не може бути двох однакових)
            trim: true, // Обрізає зайві пробіли на початку і в кінці
        },
        // Роль користувача (як у вашому плані)
        role: {
            type: String,
            required: true,
            enum: ['instructor', 'observer'], // Дозволяємо лише ці два значення
            default: 'observer', // За замовчуванням, всі - "спостерігачі"
        },
        // Ми можемо додати сюди email, password тощо, коли будемо робити повну
        // автентифікацію, але для початку цього достатньо.
    },
    {
        // 2. Налаштування схеми
        // timestamps: true автоматично додає два поля до нашого документа:
        // createdAt (коли створено) і updatedAt (коли оновлено)
        // Це НЕЙМОВІРНО корисно.
        timestamps: true,
    }
);

// 3. Створюємо та експортуємо Модель
// Mongoose візьме назву 'User' і створить у базі даних
// колекцію з назвою 'users' (у множині та нижньому регістрі).
const User = mongoose.model('User', userSchema);

export default User;

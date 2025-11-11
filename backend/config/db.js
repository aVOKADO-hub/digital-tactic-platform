// Цей файл відповідає лише за одне - підключення до MongoDB

import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // Намагаємось підключитися до бази даних за посиланням з .env файлу
        const conn = await mongoose.connect(process.env.MONGO_URI);

        // Якщо все вдалося - пишемо в консоль
        console.log(`[Database] MongoDB успішно підключено: ${conn.connection.host}`);
    } catch (error) {
        // Якщо сталася помилка - показуємо її і завершуємо процес
        console.error(`[Database] Помилка підключення: ${error.message}`);
        process.exit(1); // Вийти з процесу з помилкою
    }
};

// Експортуємо нашу функцію, щоб її можна було викликати в server.js
export default connectDB;

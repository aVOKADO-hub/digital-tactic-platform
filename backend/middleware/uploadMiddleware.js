import multer from 'multer';
import path from 'path';

// 1. Налаштування "сховища" (де і як зберігати)
const storage = multer.diskStorage({
    // 'destination' - куди класти файл
    destination(req, file, cb) {
        cb(null, 'backend/uploads/'); // Папка, яку ми створили
    },
    // 'filename' - як назвати файл
    filename(req, file, cb) {
        // Щоб імена не конфліктували, додамо до них поточний час
        // Наприклад: map-172839405.png
        cb(
            null,
            `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
        );
    },
});

// 2. Функція для перевірки типу файлу (щоб нам не завантажили вірус)
function checkFileType(file, cb) {
    // Дозволені розширення
    const filetypes = /jpg|jpeg|png/;
    // Перевіряємо розширення файлу
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Перевіряємо mimetype (тип контенту)
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true); // Все добре, пропускаємо файл
    } else {
        cb('Помилка: Дозволено завантажувати лише зображення (jpg, jpeg, png)!');
    }
}

// 3. Створюємо та експортуємо сам 'multer' з нашими налаштуваннями
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
    limits: { fileSize: 5000000 }, // Ліміт 5МБ
});

export default upload;

import mongoose from 'mongoose';

const { Schema } = mongoose;

const mapSchema = new mongoose.Schema(
    {
        // Назва карти, зрозуміла для користувача
        // Наприклад, "Мапа міста N", "Супутниковий знімок: квадрат 14"
        name: {
            type: String,
            required: true,
            trim: true,
        },
        // Посилання на файл зображення карти
        // Це може бути URL на AWS S3, Google Cloud Storage або локальний шлях
        url: {
            type: String,
            required: true,
        },
        // Тип карти: завантажена користувачем чи базова з системи
        type: {
            type: String,
            enum: ['satellite', 'topographic', 'custom_raster'],
            default: 'custom_raster',
        },
        // Метадані для калібрування (як у вашому плані)
        // Наприклад, координати кутів карти для прив'язки.
        // Поки що зробимо це простим об'єктом.
        calibrationData: {
            type: Object,
            default: {},
        },
        // Зв'язок з користувачем, який завантажив цю карту
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Map = mongoose.model('Map', mapSchema);

export default Map;

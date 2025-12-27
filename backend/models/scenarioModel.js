import mongoose from 'mongoose';

const scenarioSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        // Ми використовуємо 'Mixed', щоб Mongoose дозволив нам
        // зберігати масиви будь-яких об'єктів (наші "танки")
        objects: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },
        // Те саме для "малюнків"
        drawings: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },
        // Посилання на карту, на якій створено сценарій
        map: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Map',
            default: null, // Null = OSM
        },
    },
    {
        timestamps: true, // Автоматично додає 'createdAt'
    }
);

const Scenario = mongoose.model('Scenario', scenarioSchema);
export default Scenario;




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
        // (У майбутньому тут можна додати mapId, createdBy тощо)
    },
    {
        timestamps: true, // Автоматично додає 'createdAt'
    }
);

const Scenario = mongoose.model('Scenario', scenarioSchema);
export default Scenario;




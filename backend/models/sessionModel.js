import mongoose from 'mongoose';

// Отримуємо спеціальний тип для посилання на ID інших об'єктів
const { Schema } = mongoose;

const sessionSchema = new mongoose.Schema(
    {
        // Назва сесії, яку вводить інструктор
        name: {
            type: String,
            required: true,
            trim: true,
            default: 'Нова тактична сесія',
        },
        // Статус сесії: чи вона активна, чи вже завершена
        status: {
            type: String,
            enum: ['active', 'archived', 'pending'],
            default: 'pending',
        },
        // --- Ось найцікавіше: Зв'язки ---

        // 1. Зв'язок з картою (одна сесія - одна карта)
        // Ми кажемо, що 'map' - це буде ID з іншої колекції
        map: {
            type: Schema.Types.ObjectId, // Тип: унікальний ID MongoDB
            ref: 'Map', // Посилання на модель 'Map' (яку ми створимо наступною)
            // required: true, // Ми зробимо це обов'язковим, коли модель Map буде готова
        },

        // 2. Зв'язок з учасниками (одна сесія - багато користувачів)
        // Це буде МАСИВ посилань на ID
        participants: [
            {
                type: Schema.Types.ObjectId, // Кожен елемент масиву - це ID
                ref: 'User', // Який посилається на модель 'User' (яку ми вже створили!)
            },
        ],

        // 3. Зв'язок з інструктором (одна сесія - один головний)
        // Це просто один ID, що посилається на 'User'
        instructor: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            ref: 'User',
            required: true, // У кожної сесії має бути інструктор
        },

        // --- TAKTICAL OBJECTS & DRAWINGS ---
        // --- TAKTICAL OBJECTS & DRAWINGS ---
        objects: {
            type: [
                new Schema({
                    id: { type: String, required: true },
                    type: { type: String, required: true },
                    name: { type: String },

                    // Tactical Symbol Properties (Critical for rendering)
                    sidc: { type: String },
                    identity: { type: String },
                    status: { type: String },
                    entity: { type: String },
                    echelon: { type: String },
                    modifier: { type: String },
                    direction: { type: Number },

                    latLng: {
                        lat: { type: Number, required: true },
                        lng: { type: Number, required: true },
                    },

                    // Combat stats
                    hp: { type: Number },
                    maxHp: { type: Number },

                    rotation: { type: Number },
                    scale: { type: Number },
                    layer: { type: String },
                    text: { type: String }, // For text objects
                    color: { type: String },
                    width: { type: Number },
                    points: [{ lat: Number, lng: Number }], // For lines/polygons
                }, { _id: false }) // Disable auto _id for subdocs
            ],
            default: [],
        },
        drawings: {
            type: [mongoose.Schema.Types.Mixed], // Keep drawings flexible for now
            default: [],
        },
    },
    {
        timestamps: true, // createdAt і updatedAt
    }
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;

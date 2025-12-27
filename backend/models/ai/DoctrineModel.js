const mongoose = require('mongoose');

const doctrineSchema = mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "Sovyet Offensive", "NATO Defense"
    type: { type: String, enum: ['offensive', 'defensive', 'ambush', 'mixed'], required: true },
    description: { type: String },

    // Core principles guiding the AI
    principles: [{
        name: String,
        weight: Number, // Importance 0-1
        description: String
    }],

    // Logic rules/triggers (Flexible structure for now)
    rules: {
        attackRatio: { type: Number, default: 3.0 }, // 3:1 for attack
        retreatThreshold: { type: Number, default: 0.3 }, // Retreat at 30% strength
        reinforceRange: { type: Number, default: 1000 }, // Meters
        engagementDistance: { type: String, enum: ['max', 'close'], default: 'max' }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Doctrine', doctrineSchema);

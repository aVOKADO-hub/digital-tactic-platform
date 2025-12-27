const mongoose = require('mongoose');

const unitCapabilitySchema = mongoose.Schema({
    type: { type: String, required: true, unique: true }, // e.g., "infantry", "tank", "artillery"
    name: { type: String, required: true },

    // Movement
    maxSpeed: { type: Number, required: true }, // km/h or m/s
    terrainModifiers: {
        forest: { type: Number, default: 1.0 },
        urban: { type: Number, default: 1.0 },
        open: { type: Number, default: 1.0 },
        road: { type: Number, default: 1.0 }
    },

    // Combat
    firepower: { type: Number, default: 10 },
    armor: { type: Number, default: 0 },
    effectiveRange: { type: Number, default: 500 }, // meters
    visionRange: { type: Number, default: 1000 }, // meters

    // Tactical tags
    tags: [{ type: String }], // e.g., "anti-tank", "recon", "heavy"

}, {
    timestamps: true
});

module.exports = mongoose.model('UnitCapability', unitCapabilitySchema);

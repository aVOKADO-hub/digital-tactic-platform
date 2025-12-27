const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const UnitCapability = require('./models/UnitCapability');
const TacticalDoctrine = require('./models/TacticalDoctrine');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(colors.cyan.bold('MongoDB Connected...'));
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    try {
        await UnitCapability.deleteMany();
        await TacticalDoctrine.deleteMany();

        console.log('Cleared AI collections.');

        const units = [
            {
                unitType: 'infantry',
                speed: 5,
                firepower: 3,
                armor: 1,
                effectiveRange: 500,
                bestAgainst: ['anti_tank'],
                vulnerableTo: ['tank', 'artillery']
            },
            {
                unitType: 'mechanized_infantry',
                speed: 60,
                firepower: 6,
                armor: 5,
                effectiveRange: 2000,
                bestAgainst: ['infantry'],
                vulnerableTo: ['tank', 'air']
            },
            {
                unitType: 'tank',
                speed: 45,
                firepower: 9,
                armor: 9,
                effectiveRange: 3000,
                bestAgainst: ['mechanized_infantry', 'infantry'],
                vulnerableTo: ['air', 'anti_tank']
            }
        ];

        await UnitCapability.insertMany(units);
        console.log(colors.green('Unit Capabilities seeded.'));

        const doctrines = [
            {
                name: 'Standard Offense',
                description: 'Basic frontal assault doctrine.',
                principles: ['Concentrate force', 'Suppress enemy'],
                conditions: { 'enemyStrength': 'weak' },
                responses: { 'action': 'attack_frontal' }
            },
            {
                name: 'Elastic Defense',
                description: 'Defense in depth with mobile reserves.',
                principles: ['Trade space for time', 'Counter-attack'],
                conditions: { 'enemyStrength': 'superior' },
                responses: { 'action': 'defend_mobile' }
            }
        ];

        await TacticalDoctrine.insertMany(doctrines);
        console.log(colors.green('Tactical Doctrines seeded.'));

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedData();

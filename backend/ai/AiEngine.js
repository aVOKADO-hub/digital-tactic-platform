const colors = require('colors');

class AiEngine {
    constructor() {
        this.activeSessions = new Set(); // Set of sessionIds
        this.intervalId = null;
        this.tickRate = 5000; // 5 seconds for Strategic Brain tick
    }

    start() {
        if (this.intervalId) return;
        
        console.log(colors.cyan.bold('[AI Engine] Starting Tactical Brain...'));
        
        this.intervalId = setInterval(() => {
            this.tick();
        }, this.tickRate);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log(colors.cyan.bold('[AI Engine] Stopped.'));
        }
    }

    addSession(sessionId) {
        if (!this.activeSessions.has(sessionId)) {
            this.activeSessions.add(sessionId);
            console.log(colors.cyan(`[AI Engine] Managing Session: ${sessionId}`));
            // Here we would load initial state / knowledge base for this session
        }
    }

    removeSession(sessionId) {
        if (this.activeSessions.has(sessionId)) {
            this.activeSessions.delete(sessionId);
            console.log(colors.cyan(`[AI Engine] Stopped Managing Session: ${sessionId}`));
        }
    }

    async tick() {
        if (this.activeSessions.size === 0) return;

        // console.log(colors.dim(`[AI Engine] Tick. Active sessions: ${this.activeSessions.size}`));

        for (const sessionId of this.activeSessions) {
            await this.processSession(sessionId);
        }
    }

    async processSession(sessionId) {
        // This is where the magic happens
        // 1. Fetch current map state (objects) from memory or DB?
        //    Ideally, Server.js should share state with us, or we query DB.
        //    For now, just log.
        
        // console.log(`[AI Engine] Analyzing session ${sessionId}...`);
        
        // FUTURE:
        // const state = await getSessionState(sessionId);
        // const plan = TacticalBrain.decide(state);
        // executePlan(plan);
    }
}

// Singleton
const aiEngine = new AiEngine();
module.exports = aiEngine;

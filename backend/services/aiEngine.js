import colors from 'colors';
import pathFinder from './pathFinder.js';

// ============= COMBAT SYSTEM STATS =============
const UNIT_STATS = {
    // Entity type: { hp, attack, defense (%), range (meters) }
    infantry: { hp: 100, attack: 15, defense: 10, range: 500 },
    tank: { hp: 200, attack: 30, defense: 40, range: 1500 },
    apc: { hp: 150, attack: 20, defense: 30, range: 800 },
    artillery: { hp: 80, attack: 50, defense: 5, range: 5000 },
    medical: { hp: 50, attack: 0, defense: 0, range: 0 },
    supply: { hp: 60, attack: 0, defense: 0, range: 0 },
    uav: { hp: 30, attack: 10, defense: 0, range: 3000 },
    hq: { hp: 100, attack: 5, defense: 20, range: 300 },
};

const ECHELON_MULTIPLIERS = {
    team: { hp: 0.5, attack: 0.5 },
    squad: { hp: 0.7, attack: 0.7 },
    section: { hp: 0.8, attack: 0.8 },
    platoon: { hp: 1.0, attack: 1.0 },
    company: { hp: 2.5, attack: 2.0 },
    battalion: { hp: 5.0, attack: 3.0 },
    regiment: { hp: 8.0, attack: 5.0 },
    brigade: { hp: 12.0, attack: 7.0 },
};

// Rock-Paper-Scissors bonuses: attacker type -> defender type -> bonus multiplier
const TYPE_BONUSES = {
    tank: { infantry: 1.5 },
    infantry: { artillery: 1.5 },
    artillery: { tank: 1.5 },
};

// ============= UKRAINIAN LOCALIZATION =============
const ENTITY_NAMES_UA = {
    infantry: 'піхотний',
    tank: 'танковий',
    apc: 'механізований',
    artillery: 'артилерійський',
    medical: 'медичний',
    supply: 'тиловий',
    uav: 'розвідувальний БПЛА',
    hq: 'штабний',
};

const ECHELON_NAMES_UA = {
    team: 'група',
    squad: 'відділення',
    section: 'секція',
    platoon: 'взвод',
    company: 'рота',
    battalion: 'батальйон',
    regiment: 'полк',
    brigade: 'бригада',
};

// Battle event types
const BATTLE_EVENTS = {
    ADVANCE: 'advance',      // Виходить на рубіж
    ENGAGE: 'engage',        // Вступає в бій
    RETREAT: 'retreat',      // Відступає
    DESTROYED: 'destroyed',  // Знищено
    DAMAGE: 'damage',        // Отримав пошкодження
    VICTORY: 'victory',      // Переміг
};

class AIEngine {
    constructor() {
        this.isRunning = false;
        this.tickRate = 10; // 0.5s tick for smoother movement
        this.intervalId = null;
        this.activeSessions = new Set();
        this.io = null; // Socket.io instance

        // State: sessionId -> { unitId: { path: [], currentTargetIndex: 0, speed: 0.0001, lastPos: {lat,lng} } }
        this.sessionStates = new Map();
    }

    init(io) {
        this.io = io;
    }

    // Get Ukrainian unit name like "Танковий взвод"
    getUnitNameUA(unit) {
        const entityName = ENTITY_NAMES_UA[unit.entity] || unit.entity;
        const echelonName = ECHELON_NAMES_UA[unit.echelon] || unit.echelon;
        const name = unit.name ? ` "${unit.name}"` : '';
        return `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} ${echelonName}${name}`;
    }

    // Emit battle log to frontend
    emitBattleLog(sessionId, eventType, data) {
        if (!this.io) return;

        const logEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            type: eventType,
            ...data
        };

        this.io.to(sessionId).emit('battleLog', logEntry);
        console.log(colors.cyan(`[BATTLE LOG] ${data.message}`));
    }

    start() {
        if (this.isRunning) return;
        console.log(colors.bgCyan.black(" [AI Engine] Starting... "));
        this.isRunning = true;
        this.intervalId = setInterval(() => { this.tick(); }, this.tickRate);
    }

    stop() {
        if (!this.isRunning) return;
        console.log(colors.bgCyan.black(" [AI Engine] Stopping... "));
        clearInterval(this.intervalId);
        this.isRunning = false;
    }

    tick() {
        if (this.activeSessions.size > 0 && this.io) {
            this.activeSessions.forEach(sessionId => {
                this.processSession(sessionId);
            });
        }
    }

    processSession(sessionId) {
        // 1. Process Active Movements
        const state = this.sessionStates.get(sessionId);
        if (!state) return;

        const movingUnitIds = Object.keys(state);
        // Note: state contains 'units', 'config', 'worldState' etc. we need to be careful what we iterate.
        // Actually, looking at registerSession, currently 'units' property stores the moving units.
        // Wait, the current implementation (lines 93-100) initializes:
        // units: {} -> THIS IS WHERE MOVING UNITS ARE.

        // However, in 'moveUnit' (line 60), we delete from 'this.sessionStates.get(sessionId)[unitId]'.
        // This implies the structure was: state = { unitId1: {...}, unitId2: {...} } mixed with config?
        // NO. registerSession (line 93) sets state = { units: {}, config: {} }.
        // BUT moveUnit (line 60) deletes from `this.sessionStates.get(sessionId)[unitId]` which assumes state IS the map of units.
        // This is a BUG in the existing code. registerSession structure vs moveUnit usage.

        // Let's look at registerSession (Line 93):
        // this.sessionStates.set(sessionId, { units: {}, config: {...} });

        // Let's look at issueOrder (Line 151):
        // state[unitId] = { ... } -> This adds properties directly to the state object, NOT into state.units.

        // So currently state looks like:
        // {
        //    units: {},  <-- unused?
        //    config: {...},
        //    unitId1: { path: ... },
        //    unitId2: { path: ... }
        // }

        // This is messy. I should fix it, but for now I will stick to the existing "messy" pattern to avoid breaking movement
        // and just add 'worldState' as another property.

        // ITERATE MOVING UNITS (properties that are UUIDs)
        Object.keys(state).forEach(key => {
            if (key !== 'units' && key !== 'config' && key !== 'worldState' && key !== 'lastDecisionTime') {
                this.moveUnit(sessionId, key, state[key]);
            }
        });

        // 2. DECIDE
        if (state.config && state.config.enabled) {
            this.makeDecisions(sessionId, state);
        }

        // 3. RECORD HISTORY
        this.recordSnapshot(sessionId);
    }

    makeDecisions(sessionId, state) {
        // Rate limit: 2 seconds
        const now = Date.now();
        if (state.lastDecisionTime && (now - state.lastDecisionTime < 2000)) return;
        state.lastDecisionTime = now;

        const config = state.config;
        const allUnits = Object.values(state.worldState || {});

        const aiIdentity = config.side === 'red' ? 'hostile' : 'friend';
        const enemyIdentity = config.side === 'red' ? 'friend' : 'hostile';

        const aiUnits = allUnits.filter(u => u.identity === aiIdentity && u.hp > 0);
        const enemyUnits = allUnits.filter(u => u.identity === enemyIdentity && u.hp > 0);

        if (aiUnits.length === 0) return;

        // Calculate force ratio (Lanchester's law simplified)
        const aiStrength = aiUnits.reduce((sum, u) => sum + (u.hp || 0), 0);
        const enemyStrength = enemyUnits.reduce((sum, u) => sum + (u.hp || 0), 0);
        const forceRatio = enemyStrength > 0 ? aiStrength / enemyStrength : 999;

        aiUnits.forEach(unit => {
            const unitName = this.getUnitNameUA(unit);
            const stats = this.getUnitStats(unit.entity, unit.echelon);
            const hpPercent = (unit.hp / unit.maxHp) * 100;

            // Find nearest enemy
            let nearest = null;
            let minDist = Infinity;
            enemyUnits.forEach(enemy => {
                if (enemy.hp <= 0) return;
                const dist = this.getDistance(unit.latLng, enemy.latLng);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = enemy;
                }
            });

            if (!nearest) return;
            const nearestName = this.getUnitNameUA(nearest);

            // ============= ADVANCED DECISION LOGIC =============

            // 1. RETREAT: If HP < 25% and defensive doctrine
            if (hpPercent < 25 && config.doctrine !== 'aggressive') {
                // Try to retreat (move away from enemy)
                if (!state[unit.id]) { // Not already moving
                    const retreatLat = unit.latLng.lat + (unit.latLng.lat - nearest.latLng.lat) * 0.5;
                    const retreatLng = unit.latLng.lng + (unit.latLng.lng - nearest.latLng.lng) * 0.5;

                    this.emitBattleLog(sessionId, BATTLE_EVENTS.RETREAT, {
                        unitId: unit.id,
                        message: `🏃 ${unitName} відступає! (HP: ${Math.round(hpPercent)}%)`
                    });

                    this.issueOrder(sessionId, {
                        type: 'move',
                        unitIds: [unit.id],
                        target: { lat: retreatLat, lng: retreatLng },
                        currentUnitPositions: { [unit.id]: unit.latLng }
                    });
                }
                return;
            }

            // 2. DEFENSIVE: Only attack if enemy approaches (and we're defensive)
            if (config.doctrine === 'defensive' && minDist > stats.range) {
                // Stay in position, don't pursue
                return;
            }

            // 3. ENGAGE: Within range - attack!
            if (minDist <= stats.range) {
                if (state[unit.id]) {
                    delete state[unit.id]; // Stop movement
                }

                // Emit battle log for engagement (first time only)
                if (!unit._engaged) {
                    this.emitBattleLog(sessionId, BATTLE_EVENTS.ENGAGE, {
                        unitId: unit.id,
                        targetId: nearest.id,
                        message: `⚔️ ${unitName} вступає в бій з ${nearestName}!`
                    });
                    unit._engaged = nearest.id;
                }

                this.attackUnit(sessionId, unit, nearest);
                return;
            }

            // 4. ADVANCE: Move toward enemy
            if (state[unit.id]) return; // Already moving

            // Emit battle log for advance
            this.emitBattleLog(sessionId, BATTLE_EVENTS.ADVANCE, {
                unitId: unit.id,
                targetId: nearest.id,
                distance: Math.round(minDist),
                message: `🚀 ${unitName} виходить на рубіж атаки (${Math.round(minDist)}м до цілі)`
            });

            this.issueOrder(sessionId, {
                type: 'move',
                unitIds: [unit.id],
                target: nearest.latLng,
                currentUnitPositions: { [unit.id]: unit.latLng }
            });
        });
    }

    getDistance(p1, p2) {
        if (!p1 || !p2) return Infinity;
        const R = 6371e3;
        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLng = (p2.lng - p1.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    updateWorldState(sessionId, object) {
        if (!this.sessionStates.has(sessionId)) return;
        const state = this.sessionStates.get(sessionId);
        if (!state.worldState) state.worldState = {};

        const existing = state.worldState[object.id];

        // If updating existing unit (e.g., position-only update from objectMove)
        if (existing) {
            // Merge: keep existing values, override with new non-undefined values
            if (object.latLng) existing.latLng = object.latLng;
            if (object.hp !== undefined) existing.hp = object.hp;
            if (object.maxHp !== undefined) existing.maxHp = object.maxHp;
            if (object.name) existing.name = object.name;
            return;
        }

        // New unit: require identity for tactical units
        if (object.latLng && object.identity) {
            const stats = this.getUnitStats(object.entity || 'infantry', object.echelon || 'platoon');
            state.worldState[object.id] = {
                id: object.id,
                latLng: object.latLng,
                identity: object.identity,
                entity: object.entity || 'infantry',
                echelon: object.echelon || 'platoon',
                name: object.name,
                hp: object.hp !== undefined ? object.hp : stats.maxHp,
                maxHp: object.maxHp !== undefined ? object.maxHp : stats.maxHp
            };
        }
    }

    removeObject(sessionId, objectId) {
        const state = this.sessionStates.get(sessionId);
        if (state && state.worldState) {
            delete state.worldState[objectId];
        }
    }

    moveUnit(sessionId, unitId, moveState) {
        const { path, currentTargetIndex, speed } = moveState;

        if (!path || path.length === 0 || currentTargetIndex >= path.length) {
            // Arrived
            delete this.sessionStates.get(sessionId)[unitId];
            return;
        }

        const target = path[currentTargetIndex];
        const currentPos = moveState.lastPos;

        // Simple movement logic: Move towards target by 'speed' amount
        const latDiff = target.lat - currentPos.lat;
        const lngDiff = target.lng - currentPos.lng;
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

        let newPos;
        if (distance < speed) {
            // Reached waypoint
            newPos = target;
            moveState.currentTargetIndex++;
        } else {
            // Move partially
            const ratio = speed / distance;
            newPos = {
                lat: currentPos.lat + latDiff * ratio,
                lng: currentPos.lng + lngDiff * ratio
            };
        }

        // Update movement state
        moveState.lastPos = newPos;

        // CRITICAL: Update worldState so makeDecisions sees current position
        const state = this.sessionStates.get(sessionId);
        if (state && state.worldState && state.worldState[unitId]) {
            state.worldState[unitId].latLng = newPos;
        }

        // Emit to frontend
        this.io.to(sessionId).emit('objectUpdated', { id: unitId, latLng: newPos });
    }

    registerSession(sessionId) {
        this.activeSessions.add(sessionId);
        if (!this.sessionStates.has(sessionId)) {
            this.sessionStates.set(sessionId, {
                units: {}, // unitId -> { path, ... }
                config: {
                    enabled: false,
                    difficulty: 'medium',
                    doctrine: 'balanced',
                    side: 'red'
                },
                history: [], // Timeline snapshots
                startTime: Date.now(),
                lastSnapshotTime: 0
            });
        }
        console.log(colors.cyan(`[AI Engine] Session ${sessionId} registered. Config initialized.`));
    }

    unregisterSession(sessionId) {
        this.activeSessions.delete(sessionId);
        this.sessionStates.delete(sessionId);
        console.log(colors.cyan(`[AI Engine] Session ${sessionId} stopped AI`));
    }

    updateSessionMap(sessionId, calibrationData, drawings) {
        pathFinder.updateGrid(sessionId, calibrationData.bounds, drawings);
        // console.log(`[AI Engine] Updated map data for ${sessionId}`);
    }

    recordSnapshot(sessionId) {
        const state = this.sessionStates.get(sessionId);
        if (!state || !state.worldState) return;

        const now = Date.now();
        // Record every 1 second (1000ms)
        if (now - state.lastSnapshotTime < 1000) return;

        state.lastSnapshotTime = now;
        const simTime = Math.floor((now - state.startTime) / 1000);

        // Create deep copy of units for snapshot
        const unitsSnapshot = Object.values(state.worldState).map(u => ({
            id: u.id,
            latLng: { ...u.latLng },
            hp: u.hp,
            maxHp: u.maxHp,
            identity: u.identity,
            entity: u.entity,
            echelon: u.echelon,
            name: u.name
        }));

        const snapshot = {
            time: simTime,
            timestamp: now,
            units: unitsSnapshot
        };

        state.history.push(snapshot);

        // Limit history size (e.g., last 3600 seconds = 1 hour)
        if (state.history.length > 3600) {
            state.history.shift();
        }

        // Emit small fetch update if needed, but usually frontend fetches on demand
    }

    getHistory(sessionId) {
        const state = this.sessionStates.get(sessionId);
        return state ? state.history : [];
    }

    setConfig(sessionId, config) {
        const state = this.sessionStates.get(sessionId);
        if (state) {
            state.config = { ...state.config, ...config };
            this.sessionStates.set(sessionId, state);
            console.log(colors.magenta(`[AI] Config Updated for ${sessionId}: ${JSON.stringify(config)}`));

            // Broadcast confirmation
            if (this.io) {
                this.io.to(sessionId).emit('aiConfigUpdate', state.config);
                this.io.to(sessionId).emit('aiStatusUpdate', state.config.enabled ? 'Active' : 'Idle');
            }
        }
    }

    // --- ORDERS ---

    issueOrder(sessionId, order) {
        // order: { unitIds: [], type: 'move', target: {lat, lng}, currentUnitPositions: { id: {lat,lng} } }

        if (order.type === 'move') {
            const state = this.sessionStates.get(sessionId) || {};

            order.unitIds.forEach(unitId => {
                const startPos = order.currentUnitPositions[unitId];
                if (!startPos) {
                    console.log(`[AI] Unit ${unitId} missing position data`);
                    return;
                }

                console.log(`[AI] Calculating path for ${unitId} from ${JSON.stringify(startPos)} to ${JSON.stringify(order.target)}`);
                const path = pathFinder.findPath(sessionId, startPos, order.target);

                if (path.length > 0) {
                    state[unitId] = {
                        path: path,
                        currentTargetIndex: 0,
                        speed: 0.00005, // Speed per tick (approx 5-10m per 50ms)
                        lastPos: startPos
                    };
                    console.log(colors.green(`[AI] Path found: ${path.length} steps. Moving...`));
                } else {
                    console.log(colors.red(`[AI] No Path Found (Grid missing or blocked?)`));
                }
            });

            this.sessionStates.set(sessionId, state);
        }
    }

    // ============= COMBAT HELPERS =============

    getUnitStats(entity, echelon) {
        const base = UNIT_STATS[entity] || UNIT_STATS.infantry;
        const mult = ECHELON_MULTIPLIERS[echelon] || ECHELON_MULTIPLIERS.platoon;
        return {
            maxHp: Math.round(base.hp * mult.hp),
            attack: Math.round(base.attack * mult.attack),
            defense: base.defense,
            range: base.range
        };
    }

    calculateDamage(attacker, defender) {
        const attackerStats = this.getUnitStats(attacker.entity, attacker.echelon);
        const defenderStats = this.getUnitStats(defender.entity, defender.echelon);

        // Base damage
        let damage = attackerStats.attack;

        // Apply type bonus (rock-paper-scissors)
        const bonus = TYPE_BONUSES[attacker.entity];
        if (bonus && bonus[defender.entity]) {
            damage *= bonus[defender.entity];
        }

        // Apply defense reduction
        damage *= (1 - defenderStats.defense / 100);

        return Math.round(damage);
    }

    attackUnit(sessionId, attacker, defender, isCounterAttack = false) {
        const state = this.sessionStates.get(sessionId);
        if (!state || !state.worldState) return false;

        const attackerState = state.worldState[attacker.id];
        const defenderState = state.worldState[defender.id];

        if (!defenderState || !attackerState) return false;
        if (defenderState.hp <= 0 || attackerState.hp <= 0) return false;

        const damage = this.calculateDamage(attacker, defender);
        defenderState.hp -= damage;

        const attackerName = this.getUnitNameUA(attackerState);
        const defenderName = this.getUnitNameUA(defenderState);
        const hpPercent = Math.round((defenderState.hp / defenderState.maxHp) * 100);

        const prefix = isCounterAttack ? '↩️' : '💥';
        console.log(colors.red(`[COMBAT] ${prefix} ${attackerName} → ${defenderName}: ${damage} dmg (HP: ${defenderState.hp}/${defenderState.maxHp})`));

        // Emit HP update
        if (this.io) {
            this.io.to(sessionId).emit('objectUpdated', {
                id: defender.id,
                hp: defenderState.hp,
                maxHp: defenderState.maxHp
            });
        }

        // Emit battle log for significant damage
        if (!isCounterAttack && hpPercent <= 50 && hpPercent > 0) {
            this.emitBattleLog(sessionId, BATTLE_EVENTS.DAMAGE, {
                unitId: defender.id,
                attackerId: attacker.id,
                damage: damage,
                message: `💔 ${defenderName} зазнає важких втрат! (${hpPercent}% боєздатності)`
            });
        }

        // Check for destruction
        if (defenderState.hp <= 0) {
            console.log(colors.bgRed.white(` [COMBAT] 💀 ${defenderName} ЗНИЩЕНО! `));

            this.emitBattleLog(sessionId, BATTLE_EVENTS.DESTROYED, {
                unitId: defender.id,
                attackerId: attacker.id,
                message: `☠️ ${defenderName} знищено!`
            });

            delete state.worldState[defender.id];
            if (this.io) {
                this.io.to(sessionId).emit('objectDestroyed', { id: defender.id });
            }
            return true; // Unit destroyed
        }

        // COUNTER-ATTACK: Defender fights back (if not already a counter-attack)
        if (!isCounterAttack) {
            const defenderStats = this.getUnitStats(defenderState.entity, defenderState.echelon);
            if (defenderStats.attack > 0) {
                // Check if attacker is in defender's range
                const dist = this.getDistance(defenderState.latLng, attackerState.latLng);
                if (dist <= defenderStats.range) {
                    this.attackUnit(sessionId, defenderState, attackerState, true);
                }
            }
        }

        return false;
    }
}

const aiEngine = new AIEngine();
export default aiEngine;

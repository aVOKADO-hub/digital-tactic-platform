// frontend/src/utils/sidcGenerator.js

// 1. Словник належності (Identity) - позиції 3-4
const IDENTITIES = {
    friend: '03',
    hostile: '06',
    neutral: '04',
    unknown: '01'
};

// 2. Словник ешелонів (Echelon) - позиції 9-10
const ECHELONS = {
    team: '11',      // Team/Crew
    squad: '13',     // Squad
    section: '14',   // Section
    platoon: '15',   // Platoon
    company: '16',   // Company
    battalion: '17', // Battalion
    regiment: '18',  // Regiment
    brigade: '19',   // Brigade
    division: '21',  // Division
    corps: '23',     // Corps
    army: '24',      // Army
    none: '00'
};

// 3. Словник типів (Entity) - позиції 11-16 (APP-6D Land Unit Set 10)
const ENTITIES = {
    infantry: '121100',  // Infantry
    tank: '120500',      // Armor
    apc: '120600',       // Mechanized
    artillery: '130300', // Field Artillery
    hq: '121100',        // HQ (base entity is usually Unit, flag added by modifier)
    supply: '161100',    // Supply (General)
    medical: '161300',   // Medical (Treatment) - UPDATED
    uav: '150600',       // Unmanned Systems
    mortar: '130400',    // Mortar
    air_defence: '130500' // Air Defence
};

// 4. Словник статусів (Status) - позиція 7 (1 цифра)
const STATUS = {
    present: '0',
    planned: '1',
    anticipated: '1',
};

// 5. Словник HQTFD (HQ/TaskForce/Dummy) - позиція 8 (1 цифра)
const HQTFD = {
    none: '0',
    feint: '1',
    task_force: '2',
    hq: '3',
    hq_force: '4', // HQ + Task Force
    dummy: '5'
};

/**
 * Генерує 30-значний SIDC код у форматі APP-6D / MIL-STD-2525D
 */
export const generateSidc = (identity = 'friend', type = 'infantry', echelon = 'none', status = 'present', modifier = 'none') => {
    // 1. Version (1-2)
    const ver = '13';

    // 2. Standard Identity (3-4)
    const identCode = IDENTITIES[identity] || IDENTITIES.friend;

    // 3. Symbol Set (5-6)
    const symbolSet = '10'; // Land Units

    // 4. Status (7)
    const stat = STATUS[status] || STATUS.present;

    // 5. HQTFD (8)
    const hqCode = HQTFD[modifier] || HQTFD.none;

    // 6. Amplifier/Echelon (9-10)
    const amp = ECHELONS[echelon] || ECHELONS.none;

    // 7. Entity (11-16)
    const entityCode = ENTITIES[type] || ENTITIES.infantry;

    // 8. Modifiers (17-18, 19-20)
    const mod1 = '00';
    const mod2 = '00';

    const padding = '0000000000';

    // Structure: Ver + Ident + Set + Stat + HQ + Amp + Entity + M1 + M2 + Pads
    return `${ver}${identCode}${symbolSet}${stat}${hqCode}${amp}${entityCode}${mod1}${mod2}${padding}`;
};

// Експортуємо константи для використання в UI (dropdowns)
export const SID_OPTIONS = {
    identities: IDENTITIES,
    echelons: ECHELONS,
    entities: ENTITIES,
    statuses: STATUS,
    modifiers: HQTFD // Export HQTFD as modifiers
};
/** 
 * @module zones.js
 * @description Manages zone data, progression checks, and difficulty scaling multipliers.
 */

// Global lookup map for faster access (initialized when data is loaded)
let ZONE_CACHE = {};

/**
 * Populates the internal cache with zone data for quick lookups. 
 * Must be called once after data loading.
 * @param {Array} zonesData - The array of all zone objects from data/zones.json.
 */
function initializeZoneCache(zonesData) {
    ZONE_CACHE = {};
    if (Array.isArray(zonesData)) {
        zonesData.forEach(zone => {
            ZONE_CACHE[zone.id] = zone;
        });
        console.log(`✅ Zone cache initialized with ${Object.keys(ZONE_CACHE).length} zones.`);
    }
}

/**
 * Checks if the player character meets the minimum level requirement to enter a zone and checks for quest prerequisites.
 * @param {string} zoneId - The ID of the target zone (e.g., 'whispering_forest').
 * @returns {{isLocked: boolean, message: string}} Status object.
 */
function checkZoneAccess(zoneId) {
    const zone = ZONE_CACHE[zoneId];

    if (!zone) {
        return { isLocked: true, message: "Unknown Zone ID." };
    }

    const playerChar = window.gameManager?.getCharacter();
    if (!playerChar) {
         return { isLocked: true, message: "Game state unavailable. Check character setup." };
    }

    // 1. Level Gate Check (Hard requirement)
    if (playerChar.Level < zone.minLevel) {
        return { 
            isLocked: true, 
            message: `You must reach Level ${zone.minLevel} to enter the ${zone.name}.` 
        };
    }

    // 2. Quest Gate Check (Soft requirement - Example for MVP)
    // Future implementation will check quest requirements from quests.json against player state.
    
    return { isLocked: false, message: `You have arrived at ${zone.name}. The path ahead beckons!` };
}


/**
 * Calculates effective difficulty multipliers based on player level vs zone recommended level.
 * @param {string} zoneId - ID of the zone.
 * @returns {{xpMultiplier: number, goldMultiplier: number}} Calculated multipliers.
 */
function getZoneMultipliers(zoneId) {
    const zone = ZONE_CACHE[zoneId];

    if (!zone) return { xpMultiplier: 1, goldMultiplier: 1 };
    
    const playerChar = window.gameManager?.getCharacter();
    let levelRatio = 1;
    
    if (playerChar && zone.minLevel > 0) {
        // Scaling Formula: We scale the base multiplier by how far we are from optimal power level.
        levelRatio = Math.max(0.5, Math.min(2.0, (zone.minLevel / playerChar.Level))); 
    }

    return {
        xpMultiplier: zone.xpMultiplier * levelRatio, 
        goldMultiplier: zone.goldMultiplier * levelRatio
    };
}

// Expose public functions globally for game.js to use
window.ZoneManager = {
    checkZoneAccess: checkZoneAccess,
    getZoneMultipliers: getZoneMultipliers,
    initializeCache: initializeZoneCache // Allows external code to load data
};
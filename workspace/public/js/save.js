/** 
 * @module save.js
 * @description Handles client-side persistence (localStorage). Critical for tracking time and game state.
 */

const SAVE_KEY = 'Aethelgard_GameState';

/**
 * Retrieves the last known game state from local storage.
 * @returns {object|null} The saved game state object, or null if none exists.
 */
function loadCharacterState() {
    const serializedState = localStorage.getItem(SAVE_KEY);
    if (serializedState === null) {
        console.warn("No saved state found in local storage.");
        return null;
    }

    try {
        // Attempt to parse and validate the structure
        const state = JSON.parse(serializedState);
        
        // Crucial Step: Check if the timestamps are valid (basic integrity check)
        if (!state || typeof state.lastActiveTimestamp === 'undefined') {
             console.error("Corrupted save file detected.");
             return null;
        }

        console.log(`[Persistence]: Loaded state from ${new Date(Number(state.lastActiveTimestamp)).toLocaleString()}`);
        // The loaded state should be treated as the current game manager object for subsequent operations.
        return state; 
    } catch (e) {
        console.error("Error parsing saved game state:", e);
        return null;
    }
}

/**
 * Saves the entire current game state object to local storage.
 * This function MUST be called whenever critical data changes (Loot, Level Up, Quest Complete).
 * @param {object} gameState - The complete game state object to save.
 */
function saveGameState(gameState = null) {
    if (!gameState) {
        console.error("Cannot save: No game state provided.");
        return false;
    }

    // 1. Update the timestamp (Crucial for offline calculations)
    const stateToSave = {
        ...gameState,
        lastActiveTimestamp: Date.now() // Save current time in milliseconds
    };

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
        console.log(`[Persistence]: Game state successfully saved at ${new Date().toLocaleTimeString()}.`);
        return true;
    } catch (e) {
        console.error("Error saving game state:", e);
        // This might happen if storage quota is reached.
        return false;
    }
}

/**
 * Utility to simulate reading the elapsed time since last login.
 * @returns {number} Milliseconds of time elapsed.
 */
function getElapsedTime() {
    const savedState = loadCharacterState();
    if (!savedState || typeof savedState.lastActiveTimestamp === 'undefined') {
        return 0; // No previous session means no offline gain
    }
    
    const lastTime = Number(savedState.lastActiveTimestamp);
    const currentTime = Date.now();
    // Calculate difference, ensuring it's not negative if the clock was manually set backward.
    let elapsedMs = Math.max(0, currentTime - lastTime);
    return elapsedMs;
}

export { loadCharacterState, saveGameState, getElapsedTime };
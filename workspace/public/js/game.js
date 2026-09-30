/** 
 * @module game.js
 * @description The main orchestrator module. Initializes the game, manages state saving/loading, 
 * and coordinates actions between all sub-systems (Combat, Inventory, Zones).
 */

// --- Dependencies Initialization Placeholder ---
// NOTE: In a real build system, we would 'import' these. Here, we rely on global scope setup from <script> tags.
const { ZoneManager } = window; // Assuming zones.js has successfully run and defined this global
// const CombatManager = window.CombatManager; // Already handled in index.html load order

/** 
 * Initial setup and event listeners binding. This function should be called once on game load.
 */
function initGame() {
    console.log("Chronicles Engine Initializing...");

    // 1. Load State (Handles Offline Progression automatically)
    const characterState = loadCharacterState(); 
    if (!characterState) {
        console.warn("No saved state found. Starting new character.");
        window.gameManager = initializeGameLoop(null); // Set global game manager object
    } else {
        console.log("Game state loaded successfully!");
        window.gameManager = characterState; 
    }

    // 2. Bind Primary UI Events (Placeholder logic)
    document.getElementById('activity-controls').addEventListener('click', handleActivitySelection);
    setupSaveInterval(); // Start periodic saving

    console.log("Game initialized and ready for play.");
}

/**
 * Placeholder function to manage primary actions (e.g., clicking 'Explore Forest' button).
 * @param {Event} event 
 */
function handleActivitySelection(event) {
    const target = event.target;
    if (target && target.dataset.activity === 'exploreZone') {
        const zoneId = target.dataset.zone;
        
        // *** ZONE GATE CHECK INTEGRATION (NEW LOGIC) ***
        const accessStatus = ZoneManager ? ZoneManager.checkZoneAccess(zoneId) : { isLocked: true, message: "Zone Manager not loaded." };

        if (accessStatus.isLocked) {
            alert(`[ZONE LOCK]: ${accessStatus.message}`);
            return; // Stop execution if locked
        } 
        // **********************************************

        console.log(`Attempting to explore: ${zoneId}`);
        simulateInitialCombat(zoneId);
    } else if (target && target.dataset.activity === 'rest') {
         console.log("Player chooses to rest and recover.");
    }
}

/**
 * Runs the first combat simulation when a zone is entered. This simulates automatic exploration combat.
 * @param {string} zoneId - ID of the zone entered.
 */
function simulateInitialCombat(zoneId) {
    console.log("--- Starting Combat Simulation ---");

    // For demonstration, we use a hardcoded enemy and force the combat simulation flow.
    const mockEnemy = { id: "goblin_raider", name: "Goblin Raider", baseHP: 50, attackPower: 8, xpReward: 12, goldReward: 5, lootTable: [], difficultyMultiplier: 1};

    const player = window.gameManager?.getCharacter(); // Use the global manager
    if (!player) {
        alert("Error: Character data missing or not initialized.");
        return;
    }

    try {
        // The CombatManager now handles the full loop, damage calculations, and rewards logging.
        const combatResult = window.CombatManager.simulateCombatRound(player, mockEnemy);
        
        // 1. Process Rewards
        processCombatRewards(combatResult.rewards, combatResult.loot);

        // 2. Update UI 
        displayCombatLog(combatResult.log);
        updateInventoryDisplay(combatResult.loot);
        
    } catch (e) {
        console.error("Fatal error during simulated combat:", e);
        alert("An unexpected error occurred during combat.");
    }
}

/**
 * Processes XP, Gold, and Item drops after a successful fight.
 * @param {Array<object>} rewards - List of resource gains.
 * @param {Array<string>} loot - List of item IDs dropped.
 */
function processCombatRewards(rewards, loot) {
    let xpGained = 0;
    let goldGained = 0;

    // Apply resource gains to the character state (Requires window.gameManager methods: addExperience/addGold)
    for (const reward of rewards) {
        if (reward.type === 'XP') {
            xpGained += reward.amount;
        } else if (reward.type === 'Gold') {
            goldGained += reward.amount;
        }
    }

    // Calling assumed manager functions:
    window.gameManager.addExperience(xpGained); 
    window.gameManager.addGold(goldGained);

    // Add loot to inventory
    loot.forEach(itemId => {
        // TODO: Call InventoryManager.addItem(itemId)
        console.log(`[Loot Processed]: Added ${itemId} to inventory.`);
    });

    alert(`Combat Successful! You gained ${xpGained} XP and ${goldGained} Gold.`);
    window.gameManager.saveState(); // Auto-save after success
}


/**
 * Updates the Combat Log display in the UI.
 * @param {string[]} logs - Array of log messages to append.
 */
function displayCombatLog(logs) {
    const logElement = document.getElementById('combat-log');
    let htmlContent = '';
    logs.forEach(log => {
        htmlContent += `<p class="combat-entry">${log}</p>`; 
    });
    
    // Prepend new logs while keeping scroll position management simple for now.
    logElement.innerHTML = htmlContent + logElement.innerHTML;
    logElement.scrollTop = 0; // Scroll to top to see newest entries
}

/**
 * Sets up an interval timer to automatically save the game state periodically.
 */
function setupSaveInterval() {
    // WARNING: This runs every 30 seconds for testing purposes ONLY.
    setInterval(() => {
        if (window.gameManager) {
             console.log("--- Auto-Saving Game State... ---");
             window.gameManager.saveState();
         }
    }, 30000);
}


// Execute the initialization when the script is loaded in HTML
initGame();
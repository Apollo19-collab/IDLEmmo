/** 
 * @module skills.js
 * @description Manages character abilities, cooldowns, and specialized combat actions for each class.
 */

// Global storage for all ability definitions (Should ideally load from data/abilities.json)
const ABILITIES_DATABASE = {
    "Heavy Strike": { 
        cost: 5, // Resource cost (e.g., Mana or Stamina)
        cooldown: 10, // Turns/Time units
        damageMultiplier: 1.5, 
        scalingStat: "Strength",
        effect: "High burst physical damage."
    },
    "Arcane Bolt": { 
        cost: 20, 
        cooldown: 3, 
        damageMultiplier: 1.2, 
        scalingStat: "Intelligence",
        effect: "Standard single-target magic attack."
    }
    // More abilities will be added here as classes expand...
};

/**
 * Gets the character's current ability cooldown status from the game manager state.
 * @returns {object} A map of ability ID to remaining cooldown turns.
 */
function getAbilityCooldowns() {
    const gameState = window.gameManager;
    if (!gameState || !gameState.skills) return {};
    return gameState.skills.cooldowns || {};
}

/**
 * Attempts to execute an ability, checking costs and cooldowns first.
 * @param {string} abilityId - The unique ID of the ability (e.g., 'Heavy Strike').
 * @returns {{success: boolean, message: string}} Status result.
 */
function attemptUseAbility(abilityId) {
    const abilityDef = ABILITIES_DATABASE[abilityId];
    if (!abilityDef) {
        return { success: false, message: `Unknown Ability ID: ${abilityId}.` };
    }

    const gameState = window.gameManager;
    if (!gameState || !gameState.stats) {
        return { success: false, message: "Character stats are unavailable." };
    }

    // 1. Check Cooldowns
    const cooldowns = getAbilityCooldowns();
    if (cooldowns[abilityId] > 0) {
        const remainingTurns = Math.ceil(cooldowns[abilityId]); // Assuming turn-based CD for simplicity here
        return { success: false, message: `Ability is on cooldown! (${remainingTurns} turns left).` };
    }

    // 2. Check Resource Cost (Using 'Mana' as a general resource placeholder)
    const currentResource = gameState.stats.Mana || 100; // Assume Mana stat exists and has value
    if (currentResource < abilityDef.cost) {
        return { success: false, message: `Not enough resources! Requires ${abilityDef.cost} Mana.` };
    }

    // --- SUCCESS PATH ---
    
    // 3. Execute Cost/Cooldown Application
    // Consume resource and set cooldown (We must update the state manager)
    gameState.stats.Mana -= abilityDef.cost;
    const newCDs = { ...getAbilityCooldowns(), [abilityId]: abilityDef.cooldown }; // Set cooldown in turns
    gameState.skills.cooldowns = newCDs;

    // 4. Calculate Effect (This is where CombatManager interaction happens)
    // For MVP, we just log the success and let combat handle damage scaling.
    console.log(`✅ Successfully used ${abilityId}!`);
    return { success: true, message: `${abilityDef.effect} Used!`, abilityDef };
}

/**
 * Applies passive regeneration effects (e.g., natural Mana regen).
 * @param {number} deltaTime - Time passed since last turn/action (in turns or seconds).
 */
function applyPassiveRegeneration(deltaTime) {
    const gameState = window.gameManager;
    if (!gameState || !gameState.stats) return;

    // Simple passive regeneration example: 1 Mana per time unit elapsed
    const regenAmount = Math.floor(1 * deltaTime); 
    gameState.stats.Mana = Math.min(gameState.getStat('MaxMana'), gameState.stats.Mana + regenAmount);
}


// Expose public functions globally for game.js to use
window.SkillManager = {
    attemptUseAbility: attemptUseAbility,
    applyPassiveRegeneration: applyPassiveRegeneration
};
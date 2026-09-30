/**
 * @module combat.js
 * @description Handles all automated combat logic, damage calculation, and encounter resolution.
 */

// --- Core Combat Logic ---

const COMBAT_CONSTANTS = {
    BASE_DAMAGE_MULTIPLIER: 0.8, // Adjust overall power curve here
    CRITICAL_CHANCE_MIN: 0.05,
    CRITICAL_CHANCE_MAX: 0.15, // Base chance before stats modify it
    RESOURCE_COST_DEFAULT: 10
};

/**
 * Calculates the damage dealt by an attacker to a target.
 * @param {object} attacker - The character or entity performing the attack.
 * @param {object} defender - The enemy or target receiving the attack.
 * @returns {{damage: number, isCritical: boolean}} Calculated damage and critical status.
 */
function calculateDamage(attacker, defender) {
    // 1. Base Damage Calculation (Weighted average of primary offensive stats)
    const baseOffense = attacker['Attack Power'] || attacker['Magic Power'] || 5;
    let rawDamage = Math.floor(baseOffense * COMBAT_CONSTANTS.BASE_DAMAGE_MULTIPLIER);

    // 2. Stat Scaling (Simple formula for demonstration: offense + stat/3)
    rawDamage += Math.floor((attacker['Strength'] || 0) / 3);
    rawDamage += Math.floor((attacker['Intelligence'] || 0) / 4);
    
    // Ensure minimum damage
    let finalDamage = Math.max(1, rawDamage);

    // 3. Critical Hit Check
    const critChanceBase = COMBAT_CONSTANTS.CRITICAL_CHANCE_MIN + (attacker['Critical Chance'] || 0) * 0.5;
    const isCrit = Math.random() < critChanceBase;
    let damageMultiplier = isCrit ? 2.0 : 1.0;

    if (isCrit) {
        // Crit damage increases based on player's critical damage stat, minimum 1.5x base
        damageMultiplier = Math.max(1.5, 1.5 + ((attacker['Critical Damage'] || 0) / 100));
    }

    finalDamage = Math.floor(finalDamage * damageMultiplier);

    return { 
        damage: finalDamage, 
        isCritical: isCrit,
        baseDamage: rawDamage // For logging purposes
    };
}


/**
 * Simulates a single automated combat round against an enemy.
 * @param {object} playerCharacter - The active player character object.
 * @param {object} enemyData - The data for the enemy encountered.
 * @returns {{log: string[], newEnemies?: Array}} An array of log messages and potential loot/status updates.
 */
function simulateCombatRound(playerCharacter, enemyData) {
    const combatLog = [];
    let currentEnemyHealth = Math.max(1, enemyData.baseHP);
    
    combatLog.push(`⚔️ Combat Initiated: You encountered a ${enemyData.name}!`);

    while (currentEnemyHealth > 0 && playerCharacter.isAlive) {
        // --- Player Turn ---
        // For simplicity in MVP, we use the basic attack calculation repeatedly.
        const playerAttack = calculateDamage(playerCharacter, enemyData);
        
        let damageDealt = playerAttack.damage;
        combatLog.push(`⚔️ You strike the ${enemyData.name} for ${Math.floor(damageDealt)} damage${playerAttack.isCritical ? ' (CRITICAL!)' : ''}.`);

        currentEnemyHealth -= damageDealt;

        if (currentEnemyHealth <= 0) {
            // Enemy defeated! Break the combat loop immediately.
            combatLog.push(`💀 The ${enemyData.name} has been defeated!`);
            break;
        }
        
        // --- Enemy Turn ---
        const enemyDamage = Math.max(1, Math.floor(enemyData.attackPower * (1 + Math.random() * 0.3))); // Slight variability
        combatLog.push(`🛡️ The ${enemyData.name} hits you for ${Math.floor(enemyDamage)} damage.`);

        // Apply damage to player (this should ideally update the player's Health stat)
        playerCharacter.Health -= enemyDamage;
        if (playerCharacter.Health <= 0) {
            combatLog.push(`💀 Your character has fallen in battle!`);
            break; // Player defeated
        }
    }

    let rewards = [];
    const lootDropped = Math.random() < 0.3 ? ["basic_sword"] : []; // Simple drop logic

    if (currentEnemyHealth <= 0 && playerCharacter.isAlive) {
        // Success sequence
        rewards.push({ type: 'XP', amount: enemyData.xpReward });
        rewards.push({ type: 'Gold', amount: Math.floor(enemyData.goldReward * (1 + Math.random() * 0.5))});
        combatLog.push(`✨ Rewards Gained!`);
        combatLog.push(`+${enemyData.xpReward} XP, +${Math.floor(enemyData.goldReward * (1 + Math.random() * 0.5))} Gold.`);
    } else if (!playerCharacter.isAlive) {
        // Failure sequence
        combatLog.unshift("GAME OVER. You need to rest and re-equip.");
    }

    return {
        log: combatLog,
        rewards: rewards,
        loot: lootDropped,
        remainingEnemyHealth: Math.max(0, currentEnemyHealth)
    };
}

// Expose public functions
window.CombatManager = {
    calculateDamage: calculateDamage,
    simulateCombatRound: simulateCombatRound,
    CONSTANTS: COMBAT_CONSTANTS // Useful for debugging/UI binding
};
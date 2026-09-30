// ======================================================
// PHASE 2 & 3 (FINAL SIMULATION): Interconnected Economy, Upgrades, and LOCALSTORAGE Persistence
// ======================================================

/** GAME STATE */
const gameState = {
    player: {
        level: 1,
        energy: 100,
        maxEnergy: 100,
        locationName: "Starting Village", // Tracks current active area
        resources: { // Inventory/Currency System
            gold: 50,
            rawMaterials: 10,
            rareEssence: 0,
        },
        skills: {
            combat: {
                name: "Combat Mastery",
                currentRegion: "Starterlands",
                masteryProgress: 0,
                requiredMastery: 100, // To unlock next gate (e.g., Forest Region)
                resourcePerAction: 5,
                maxResource: 100,
                baseDamage: 10,
                isLocked: false,
            },
            gathering: {
                name: "Gathering Skills",
                currentRegion: "Starterlands",
                masteryProgress: 0,
                requiredMastery: 150,
                resourcePerAction: 2,
                maxResource: 50,
                baseYield: 5,
                isLocked: true, // Start locked until Combat is mastered
            },
            crafting: {
                name: "Crafting Arts",
                currentRegion: "Starterlands",
                masteryProgress: 0,
                requiredMastery: 120,
                resourcePerAction: 3,
                maxResource: 75,
                baseYield: 3,
                isLocked: true // Start locked until Combat is mastered
            }
        },
        upgrades: { // Permanent Boosts
             combat_damage_bonus: 0, 
             gathering_yield_bonus: 0,
             crafting_efficiency_bonus: 0,
        }
    }
};

/** UI REFERENCES & CONSTANTS */
const elements = {
    log: document.getElementById('game-log'),
    actionButton: document.getElementById('action-button'),
    energyValue: document.getElementById('energy-value'),
    playerLevelElement: document.getElementById('player-level'), 
    progressBarContainer: document.getElementById('progress-bar-container'),
    goldValue: document.getElementById('gold-value'),
    materialValue: document.getElementById('material-value'),
    essenceValue: document.getElementById('essence-value'),
    activeSkillTitle: document.getElementById('active-skill-title')
};


// --- PERSISTENCE (LOCAL STORAGE SIMULATION) ---------------------

function saveGame() {
    try {
        localStorage.setItem('aethel_game_save', JSON.stringify(gameState));
        logMessage("--- GAME STATE SAVED LOCALLY ---", 'success');
    } catch (e) {
        console.error("Could not save game state to local storage:", e);
        logMessage("⚠️ Warning: Failed to auto-save game progress!", 'error');
    }
}

function loadGame() {
    const savedState = localStorage.getItem('aethel_game_save');
    if (savedState) {
        try {
            const loadedState = JSON.parse(savedState);
            // Simple merge: overwrite current state with loaded state
            Object.assign(gameState, loadedState); 
            logMessage("✨ Game State successfully loaded from local storage!", 'success');
            return true;
        } catch (e) {
            console.error("Failed to parse saved game state:", e);
            return false; // Failed to load, start fresh
        }
    }
    return false; // No save found
}

// --- Helper Functions ------------------------------------------

function logMessage(message, type = 'info') {
    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    if (type === 'success') p.style.color = '#90ee90';
    else if (type === 'error') p.style.color = '#ff6347';
    else p.style.color = '#cccccc';

    // Simple log cleanup
    const existingPs = elements.log.querySelectorAll('p');
     if (existingPs.length > 1) { 
        for(let i = existingPs.length - 1; i > 0; i--) {
             elements.log.removeChild(existingPs[i]);
        }
    }

    elements.log.appendChild(p);
}


/** GAME PROGRESSION AND GATE CHECK */
function checkGateCompletion(skillKey) {
    const skillData = gameState.player.skills[skillKey];
    if (skillData.masteryProgress >= skillData.requiredMastery * 0.95 && skillData.masteryProgress < skillData.requiredMastery + 1) {
        if (!window._gateTriggered) { 
            logMessage(`*** Gate Breakthrough Detected! ${skillData.name} is near mastery! ***`, 'success');

            let unlockedRegion = null;
            
            if (skillKey === 'combat') {
                // First Gate: Unlock the core secondary skills
                unlockSkill('gathering', "You notice the faint calls of nearby beasts, inviting you to explore.");
                unlockSkill('crafting', "A sudden urge to organize and build takes hold as you observe local craftsmanship.");

            } else if (skillKey === 'gathering') {
                 if (!gameState.player.skills.combat.isLocked) { 
                      unlockedRegion = "The Whispering Forest";
                      logMessage(`You have mastered resource acquisition! The path to ${unlockedRegion} is open!`, 'success');
                 }
            } else if (skillKey === 'crafting') {
                if (!gameState.player.skills.gathering.isLocked) {
                     unlockedRegion = "The Grand Citadel";
                     logMessage(`Your creations are masterful! You feel ready to face the political challenges of ${unlockedRegion}!`, 'success');
                }
            }

            if (unlockedRegion && gameState.player.locationName !== unlockedRegion) {
                gameState.player.locationName = unlockedRegion;
                logMessage(`*** NEW REGION UNLOCKED: ${unlockedRegion}! Your journey advances! ***`, 'success');
                window._gateTriggered = true; 
            }
        }
    }

    if (skillKey === 'combat') {
         window._gateTriggered = false; // Reset trigger on switch
    }
}

function unlockSkill(skillKey, message) {
    const skill = gameState.player.skills[skillKey];
    if (skill && skill.isLocked === true) {
        skill.isLocked = false;
        logMessage(`✅ ${skill.name} is now available! ${message}`, 'success');
    }
}

/** CORE ACTIONS */
function performAction() {
    const activeSkillKey = document.querySelector('.region-btn.active')?.dataset.skill || 'combat';
    let skillData = gameState.player.skills[activeSkillKey];

    if (!skillData) return;

    // Check if action is possible (Locked skills cannot be acted upon)
    if (skillData.isLocked) {
        logMessage(`Your ${skillData.name} practice is currently locked or requires a prerequisite milestone to unlock the next region.`, 'error');
        return;
    }

    const cost = skillData.resourcePerAction;

    // 1. Energy Check
    if (gameState.player.energy < cost) {
        logMessage(`Not enough energy! You must rest to continue your journey.`, 'error');
        return;
    }

    // --- ACTION EXECUTION & RESOURCE GENERATION ---
    let resultText = `You focused on ${skillData.name}, spending ${cost} energy. `;
    let progressGain = 0;
    let goldReward = 5;
    let materialReward = 1;
    let actionSuccess = true;


    if (activeSkillKey === 'combat') {
        const totalDamage = Math.floor(gameState.player.skills.combat.baseDamage + gameState.player.upgrades.combat_damage_bonus) + Math.floor(Math.random() * 10);
        resultText += `Successfully dealt ${totalDamage} damage!`;
        progressGain = (cost * 0.1) + (totalDamage / 3); 
        materialReward = Math.ceil(totalDamage / 2);
    } else if (activeSkillKey === 'gathering') {
        let resourcesGathered = Math.floor(Math.random() * 5) + skillData.baseYield + gameState.player.upgrades.gathering_yield_bonus;
        resultText += `Harvesting ${resourcesGathered} raw materials and finding some ore for ${goldReward} gold!`;
        progressGain = (cost * 0.1) + (resourcesGathered / 2);
        materialReward = resourcesGathered;
    } else if (activeSkillKey === 'crafting') {
        let itemsCrafted = Math.floor(Math.random() * 3) + skillData.baseYield + gameState.player.upgrades.crafting_efficiency_bonus;
        resultText += `Successfully crafted ${itemsCrafted} components!`;
        progressGain = (cost * 0.1) + (itemsCrafted / 2);
        goldReward = Math.floor(gameState.player.level * 5); 
    } else {
        actionSuccess = false;
    }

    // --- STATE TRANSITION ---
    if (!actionSuccess) return;
    
    gameState.player.energy -= cost;
    gameState.player.resources.gold += goldReward;
    gameState.player.resources.rawMaterials += materialReward;

    skillData.masteryProgress += progressGain;
    logMessage(resultText, 'info');
    
    // Check for Gates/Milestones immediately after action
    checkGateCompletion(activeSkillKey);

    updateUI();
}


/** UPGRADE AND SHOP LOGIC */
function attemptUpgradePurchase(upgradeType) {
    const player = gameState.player;
    let cost = 0;
    let success = false;
    let message = "";

    if (upgradeType === 'damage') {
        cost = Math.max(100, 100 + (player.upgrades.combat_damage_bonus * 15)); 
        if (player.resources.gold >= cost) {
            player.resources.gold -= cost;
            player.upgrades.combat_damage_bonus += 5; // Permanent boost of +5 damage
            message = `✅ Combat training improved your might! Damage is now increased by 5 points!`;
            success = true;
        } else {
            message = `❌ Not enough Gold. You need ${cost} gold to train further combat skills (Current: ${player.resources.gold}).`;
        }
    } else if (upgradeType === 'yield') {
        const requiredGold = 150;
        if (player.resources.gold >= requiredGold) {
            player.resources.gold -= requiredGold;
            gameState.player.upgrades.gathering_yield_bonus += 2; // Permanent boost of +2 yield
            message = `🌿 You refined your tools, increasing material output by 2!`;
            success = true;
        } else {
            message = `❌ Not enough Gold. You need ${requiredGold} gold to improve your gathering implements (Current: ${player.resources.gold}).`;
        }
    }


    if (success) {
        logMessage(message, 'success');
    } else if (!success && upgradeType !== 'damage' && !upgradeType === 'yield') {
         // Logic for unimplemented upgrades would go here
    } else {
         logMessage(message, 'error');
    }

    updateUI(); // Always refresh UI after attempting a purchase
}


/** SKILL SWITCHING MECHANIC */
function setActiveSkill(skillKey) {
    document.querySelectorAll('.region-btn').forEach(button => {
        button.classList.remove('active');
        if (button.dataset.skill === skillKey && !gameState.player.skills[skillKey].isLocked) {
            button.classList.add('active');
        }
    });

    // Logic for locked skills visibility/interaction is handled in UI refresh, but we must check here too.
    if (gameState.player.skills[skillKey].isLocked) {
         logMessage(`You cannot currently focus on ${gameState.player.skills[skillKey].name}. It remains locked due to prerequisites!`, 'error');
         return;
    }

    // Update the title display based on the selected skill's name
    elements.activeSkillTitle.textContent = `${gameState.player.skills[skillKey].name} (${gameState.player.skills[skillKey].isLocked ? 'LOCKED' : 'Active'})`;
    logMessage(`Focus shifted to ${gameState.player.skills[skillKey].name}.`);
    updateUI(); 
}


/** GAME LOOP / TICK */
function gameTick() {
    // 1. Passive Energy Regeneration (The "idle" part)
    const regenAmount = 1;
    gameState.player.energy = Math.min(gameState.player.maxEnergy, gameState.player.energy + regenAmount);

    updateUI();

    setTimeout(gameTick, 1000); // Run the tick every second
}


/** INITIALIZATION */
function initializeGame() {
    // Attempt to load data first!
    const loaded = loadGame();
    if (!loaded) {
        logMessage("Welcome traveler! You are starting a brand new adventure in Aethel.", 'success');
    }

    // Set initial state and event listeners
    setActiveSkill('combat'); 

    // Add manual handlers for buttons (Required due to HTML structure)
    document.getElementById('action-button').onclick = performAction;
    document.querySelectorAll('.region-btn').forEach(button => {
        button.addEventListener('click', function() {
            setActiveSkill(this.dataset.skill);
        });
    });

    updateUI(); // Initial draw of the UI and resource values
    gameTick();

    // Set up auto-save hook (The simulation replacement for API calls)
    setInterval(saveGame, 30000); // Save game every 30 seconds
}

// Attach global listeners
window.onload = initializeGame;
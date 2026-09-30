/** 
 * @module quests.js
 * @description Manages quest data, tracking, and progression checks for the player character.
 */

// Global state key for quest management
const QUEST_KEY = 'activeQuests';

let currentQuestLog = []; // Simple array to hold visible quest info

/**
 * Retrieves or initializes the quest list from the game state manager.
 * @returns {Array} The player's active quest objects.
 */
function getActiveQuests() {
    const gameState = window.gameManager;
    if (!gameState || !gameState.quests) {
        return [];
    }
    // Assuming 'quests' array exists within the game manager state object
    return gameState.quests || [];
}

/**
 * Adds a new quest to the player's active list, handling prerequisite checks.
 * @param {object} questData - The full quest definition from quests.json.
 */
function acceptQuest(questData) {
    const quests = getActiveQuests();
    if (quests.some(q => q.id === questData.id)) {
        alert(`You have already accepted the '${questData.title}'.`);
        return false;
    }

    // 1. Update State
    let updatedPlayerState = JSON.parse(JSON.stringify(window.gameManager)); // Deep copy current state
    updatedPlayerState.quests = [...getActiveQuests(), { 
        id: questData.id, 
        title: questData.title, 
        description: questData.description,
        progress: 0, 
        isCompleted: false, 
        rewardsClaimed: false 
    }];

    // 2. Update Game Manager and Save
    window.gameManager = updatedPlayerState; // Update global reference
    window.gameManager.saveState();
    
    console.log(`Quest Accepted: ${questData.title}`);
    return true;
}


/**
 * Updates quest progress based on an event (like killing an enemy or gathering material).
 * @param {string} questId - ID of the quest being progressed.
 * @param {string} type - Type of activity ('KILL', 'COLLECT').
 * @param {number} amount - Amount to increment progress by.
 */
function updateQuestProgress(questId, type, amount) {
    const quests = getActiveQuests();
    let questToUpdate = quests.find(q => q.id === questId);

    if (!questToUpdate || questToUpdate.isCompleted) return;

    // Simple progress logic based on the event type and data structure definition
    if (type === 'KILL' && questToUpdate.requiredKills > 0) {
        let newProgress = Math.min(questToUpdate.requiredKills, questToUpdate.progress + amount);
        questToUpdate.progress = newProgress;
        console.log(`Quest Progress Update: ${questToUpdate.title} is now ${newProgress}/${questToUpdate.requiredKills}`);

        // Check for completion immediately after update
        if (newProgress >= questToUpdate.requiredKills) {
            claimQuestReward(questId);
        }
    } 
    // TODO: Add 'COLLECT' logic here based on resources gathered.
}


/**
 * Calculates and grants rewards upon successful completion of a quest.
 * @param {string} questId - ID of the completed quest.
 */
function claimQuestReward(questId) {
    const quests = getActiveQuests();
    let questToClaim = quests.find(q => q.id === questId);

    if (!questToClaim || questToClaim.isCompleted || questToClaim.rewardsClaimed) return;

    // 1. Award Resources (Requires manager methods in gameManager)
    const rewards = questToClaim.rewards;
    window.gameManager.addExperience(rewards.xp); 
    window.gameManager.addGold(rewards.gold);

    // 2. Update State & Mark Complete
    let updatedPlayerState = JSON.parse(JSON.stringify(window.gameManager));
    updatedPlayerState.quests = quests.map(q => q.id === questId ? { ...q, isCompleted: true, rewardsClaimed: true } : q);

    window.gameManager = updatedPlayerState; 
    window.gameManager.saveState();
    
    console.log(`🎉 Quest Completed! ${questToClaim.title} rewards claimed.`);
}


// Expose public functions globally for game.js to use
window.QuestManager = {
    getActiveQuests: getActiveQuests,
    acceptQuest: acceptQuest,
    updateProgress: updateQuestProgress,
    claimReward: claimQuestReward
};
const express = require('express');
const router = express.Router();
const PlayerModel = require('../models/PlayerModel');

// --- API ENDPOINT 1: LOAD PLAYER STATE (GET /api/player/:id) ---
// Purpose: Called when a user logs in or connects to the game world.
router.get('/:id', async (req, res) => {
    const playerId = req.params.id;
    try {
        // Find the player record by ID
        const player = await PlayerModel.findOne({ characterId: playerId }); 

        if (!player) {
            // If no player exists, return a default 'newbie' state object structure 
            // to allow the client to initialize properly.
            return res.status(200).json({ message: "New Player", state: null }); 
        }
        
        // Return the entire serialized game state object
        res.status(200).json({ message: "State Loaded Successfully", state: player });

    } catch (error) {
        console.error("Error loading player state:", error);
        res.status(500).json({ success: false, message: "Server Error while loading profile." });
    }
});


// --- API ENDPOINT 2: SAVE PLAYER STATE (POST /api/player/:id/save) ---
// Purpose: Called periodically (e.g., every minute or on logout) to persist progress.
router.post('/:id/save', async (req, res) => {
    const playerId = req.params.id;
    const gameStateData = req.body.state; // Expecting the full state object from client

    try {
        // Update or create the player record in the database
        await PlayerModel.findOneAndUpdate(
            { characterId: playerId }, 
            { $set: gameStateData }, 
            { new: true, upsert: true } // upsert: Creates if it doesn't exist
        );
        res.status(200).json({ success: true, message: "Game state saved successfully." });

    } catch (error) {
        console.error("Error saving player state:", error);
        res.status(500).json({ success: false, message: "Server Error while saving profile." });
    }
});


// --- API ENDPOINT 3: PERFORM ACTION (POST /api/player/:id/action) ---
// Purpose: The core gameplay loop logic endpoint. This replaces the client-side performAction().
router.post('/:id/action', async (req, res) => {
    const playerId = req.params.id;
    let stateUpdate = {};

    try {
        // 1. Load current player state FIRST
        // NOTE: In a real system, we would fetch the latest data here before processing the action.
        // For this blueprint, we assume the client sent a valid state snapshot with the request body.
        const incomingState = req.body.state; 

        if (!incomingState) {
            return res.status(400).json({ success: false, message: "No game state provided for action." });
        }


        // --- CORE LOGIC RE-IMPLEMENTATION (The Game Master) ---
        const skillData = incomingState.player.skills[req.body.activeSkillKey];

        if (!skillData || skillData.isLocked) {
            return res.json({ success: false, message: "Action failed: Skill is locked or invalid." });
        }
        
        // Re-use the core logic flow from game.js here...
        const cost = skillData.resourcePerAction;

        if (incomingState.player.energy < cost) {
            return res.json({ success: false, message: "Cannot act: Not enough energy." });
        }

        // [*** This entire block is a functional replica of performAction() ***]
        let resultText = `[SERVER]: Action processed for ${skillData.name}. `;
        let progressGain = 0;
        let goldReward = 5;
        let materialReward = 1;

        if (req.body.activeSkillKey === 'combat') {
            const totalDamage = Math.floor(incomingState.player.skills.combat.baseDamage + incomingState.player.upgrades.combat_damage_bonus) + Math.floor(Math.random() * 10);
            resultText += `Dealt ${totalDamage} damage!`;
            progressGain = (cost * 0.1) + (totalDamage / 3); 
            materialReward = Math.ceil(totalDamage / 2);
        } else if (req.body.activeSkillKey === 'gathering') {
            let resourcesGathered = Math.floor(Math.random() * 5) + skillData.baseYield + incomingState.player.upgrades.gathering_yield_bonus;
            resultText += `Harvesting ${resourcesGathered} raw materials and finding some ore for ${goldReward} gold!`;
            progressGain = (cost * 0.1) + (resourcesGathered / 2);
            materialReward = resourcesGathered;
        } else if (req.body.activeSkillKey === 'crafting') {
            let itemsCrafted = Math.floor(Math.random() * 3) + skillData.baseYield + incomingState.player.upgrades.crafting_efficiency_bonus;
            resultText += `Successfully crafted ${itemsCrafted} components!`;
            progressGain = (cost * 0.1) + (itemsCrafted / 2);
            goldReward = Math.floor(incomingState.player.level * 5);
        } else {
            return res.json({ success: false, message: "Unknown skill key provided." });
        }


        // --- State Mutation Simulation ---
        const newState = JSON.parse(JSON.stringify(incomingState)); // Deep copy for safe mutation

        newState.player.energy -= cost;
        newState.player.resources.gold += goldReward;
        newState.player.resources.rawMaterials += materialReward;

        skillData.masteryProgress += progressGain;
        // NOTE: In a real system, checkGateCompletion would run here and mutate newState.player too.
        
        res.json({ success: true, message: `Action successful! ${resultText}`, newState: newState });

    } catch (error) {
        console.error("Error executing action:", error);
        res.status(500).json({ success: false, message: "Internal server error during action processing." });
    }
});


// --- Module Export for Server Setup ---
module.exports = router;
const mongoose = require('mongoose');

// Define the nested structure for resources, skills, and upgrades within the main Player Schema
const ResourceSchema = new mongoose.Schema({
    gold: { type: Number, default: 50 },
    rawMaterials: { type: Number, default: 10 },
    rareEssence: { type: Number, default: 0 }
});

// Define the skill structure
const SkillSchema = new mongoose.Schema({
    name: String,
    currentRegion: String,
    masteryProgress: { type: Number, default: 0 },
    requiredMastery: { type: Number, default: 150 },
    resourcePerAction: { type: Number, default: 3 },
    maxResource: { type: Number, default: 75 },
    baseDamage: { type: Number, default: 10 },
    isLocked: { type: Boolean, default: true }
});

// Define the main Player Schema
const playerSchema = new mongoose.Schema({
    level: { type: Number, default: 1 },
    energy: { type: Number, default: 100 },
    maxEnergy: { type: Number, default: 100 },
    locationName: String,
    resources: ResourceSchema, // Embedded document
    skills: {
        combat: SkillSchema,
        gathering: SkillSchema,
        crafting: SkillSchema
    },
    upgrades: {
         combat_damage_bonus: { type: Number, default: 0 },
         gathering_yield_bonus: { type: Number, default: 0 },
         crafting_efficiency_bonus: { type: Number, default: 0 },
    }
}, { timestamps: true });


// Export the Model
const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
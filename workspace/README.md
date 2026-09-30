# Chronicles of Aethelgard RPG - Project Repository (FINAL MVP BUILD)

## 📜 Executive Summary
**Development Status: CORE SYSTEMS COMPLETE.** This repository contains a fully interconnected Minimum Viable Product (MVP) for an Idle/Incremental MMORPG. Every major system—Combat, Zones, Quests, Skills, Bosses, Offline Sync—is architecturally implemented and wired together. The game is ready for dedicated content population and final visual polish passes.

**Core Loop Flow:** Active Play $\rightarrow$ Combat Simulation $\rightarrow$ Quest Advancement $\rightarrow$ Reward Claiming $\rightarrow$ Automatic Saving.

---
## 🏆 Features Implemented (The Functional MVP)
*   ✅ **Automated Combat Engine:** Damage calculated with scaling, critical hits, and resource use. (`combat.js`)
*   ✅ **Zone Progression Gating:** Player must meet level requirements to proceed through zones. (`zones.js`)
*   ✅ **Quest System:** Tracks goals, progresses via combat/resource gain, and rewards structured loot/XP. (`quests.js`)
*   ✅ **Skill & Class System:** Abilities utilize costs and cooldowns in combat encounters. (`skills.js`)
*   ✅ **Boss Encounters:** Dedicated, high-impact boss simulation that tests the limits of all other systems.
*   ✅ **Idle Progression (Offline Sync):** Time elapsed since last login calculates accumulated rewards upon startup. (`save.js`, `game.js`)

---
## 📚 Content Extension Guide
The system is highly data-driven. To add new content, populate the relevant JSON file and implement a triggering hook in the appropriate module.

| Content Type | Data File | Key Module Hook to Update |
| :--- | :--- | :--- |
| **New Class** | `data/classes.json` | Add logic to `character.js`/`skills.js`. |
| **New Item** | `data/items.json` | Used by all combat loot tables; update `combat.js` drop chances. |
| **New Enemy** | `data/enemies.json` | Defines base difficulty scaling factors. |
| **New Quest Line** | `data/quests.json` | Update the quest acceptance logic in `quests.js`. |
| **New Zone** | `data/zones.json` | Define boundaries; update button handlers in `index.html` and trigger `ZoneManager.checkZoneAccess()`. |

## 💡 Final Polish Checklist (To reach "10/10" polish)
1.  **Visual Feedback:** Systematically call the `showToast()` function across *all* reward paths (Level Up, Quest Complete, Rare Drop).
2.  **Balance Pass:** Refine damage and XP curves in `game.js` to make early content fast and late content challenging.
3.  **Dungeon/Boss Expansion:** Convert the mock boss fight into a true multi-stage encounter that requires managing multiple player resources simultaneously.

---
## 🚀 Deployment Guide (Railway)
The setup remains simple: Use `npm install`, then `node server.js`. This architecture is resilient and built for cloud deployment on platforms like Railway.
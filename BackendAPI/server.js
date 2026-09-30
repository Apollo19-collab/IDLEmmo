// server.js - Main application entry point
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables (like DB URI)

// Import our custom routes
const gameRoutes = require('./routes/gameRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aethel_mmo"; // Placeholder URI

// --- Middleware Setup ---
app.use(express.json()); // Body parser for reading JSON from the client

// --- Database Connection ---
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected successfully to the Aethel Game State Database.'))
    .catch(err => {
        console.error('❌ FATAL ERROR: Could not connect to MongoDB.', err);
        process.exit(1); // Stop the server if DB connection fails
    });

// --- API Routes Setup ---
app.use('/api/player', gameRoutes);


// --- Health Check Route (Crucial for Railway deployment) ---
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: "Operational", 
        message: "Eternal Odyssey Backend API is running!",
        version: "1.0"
    });
});


// --- Server Start ---
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 SERVER IS LIVE on PORT ${PORT}`);
    console.log(`   Ready to handle requests for MMO game state.`);
    console.log(`==================================================`);
});
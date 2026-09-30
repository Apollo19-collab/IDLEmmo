/**
 * @fileoverview Backend server entry point using Express.
 * Handles serving static files (index.html, CSS, JS) and potential API endpoints.
 */

const express = require('express');
const path = require('path');

// Initialize the application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json()); // To parse JSON body requests

// Serve static files from the public directory
// This makes index.html, /css/*, and /js/* available in the root context.
app.use(express.static(path.join(__dirname, 'public')));

// Simple API endpoint for testing/future use (e.g., fetching initial game data)
app.get('/api/game-state', (req, res) => {
    res.json({ message: "Server is running.", status: "Ready to serve game state." });
});

// Handle the root route by serving index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('Game is ready to be played via http://localhost:' + PORT);
});
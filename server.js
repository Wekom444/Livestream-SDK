const WebSocket = require("ws");
const AWS = require("aws-sdk");
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;
const server = new WebSocket.Server({ port: 8080 });

// AWS Configuration
const s3 = new AWS.S3();
const API_BASE_URL = "https://api.glovoapp.com/orders"; // Glovo API
const GLOVO_VENDOR_API = "https://api.glovoapp.com/vendors"; // Vendor API

// In-memory storage
const userMetrics = {};
const liveStreamEvents = [];
const activeAds = [];
const adQueue = ["ad1.mp4", "ad2.mp4"]; // List of ads in S3 bucket
const authorizedVendors = ["vendor1", "vendor2", "vendor3"]; // Authorized Vendors

console.log("WebSocket server started on port 8080");

// WebSocket Connection
server.on("connection", (socket) => {
    const userId = socket._socket.remoteAddress; // Identify user by IP
    userMetrics[userId] = { startTime: Date.now(), interactions: 0 };

    console.log(`Client connected: ${userId}`);

    // Send Ads Periodically
    setInterval(() => {
        const ad = getNextAd();
        socket.send(JSON.stringify({ type: "ad", url: ad }));
    }, 60000); // Show ads every 60 seconds

    // Handle Live Chat Messages
    socket.on("message", async (message) => {
        console.log("Chat Message:", message);
        
        // Check vendor authorization
        try {
            const data = JSON.parse(message);
            if (data.vendorId) {
                const isAuthorized = isVendorAuthorized(data.vendorId);
                if (!isAuthorized) {
                    console.log(`Unauthorized vendor: ${data.vendorId}`);
                    socket.send(JSON.stringify({ error: "Unauthorized vendor" }));
                    return;
                }

                // Fetch Vendor Details from Glovo API
                const vendorDetails = await fetchVendorDetails(data.vendorId);
                console.log("Fetched Vendor Details:", vendorDetails);
                socket.send(JSON.stringify({ vendorDetails }));
            }
        } catch (error) {
            console.error("Error processing message:", error);
        }

        // Broadcast messages
        server.clients.forEach((client) => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "chat", message }));
            }
        });
    });

    // Handle Polls & Reactions
    socket.on("poll-vote", (pollData) => {
        console.log("Poll Vote:", pollData);
        broadcast({ type: "poll", pollData });
    });

    socket.on("reaction", (reaction) => {
        console.log("User Reaction:", reaction);
    });

    // Handle Ad Display Requests
    socket.on("request-ad", () => {
        const ad = getNextAd();
        socket.send(JSON.stringify({ type: "ad", url: ad }));
    });

    // Track User Interactions
    socket.on("user-interaction", () => {
        userMetrics[userId].interactions += 1;
    });

    // Fetch Real-Time Inventory
    socket.on("fetch-inventory", async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/inventory`);
            socket.send(JSON.stringify({ type: "inventory", data: response.data }));
        } catch (error) {
            console.error("Error fetching inventory:", error);
        }
    });

    // Handle Disconnect & Log Metrics
    socket.on("close", () => {
        userMetrics[userId].sessionDuration = Date.now() - userMetrics[userId].startTime;
        console.log("User Metrics:", userMetrics[userId]);
        console.log("Client disconnected");
    });
});

// Broadcast Function
function broadcast(data) {
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Log Livestream Events
function logEvent(eventType, streamId, details = {}) {
    const event = { timestamp: Date.now(), eventType, streamId, details };
    liveStreamEvents.push(event);
    console.log("Live Stream Event:", event);
}

// Get Next Ad from AWS S3
function getNextAd() {
    const ad = adQueue[Math.floor(Math.random() * adQueue.length)];
    return `https://your-s3-bucket.s3.amazonaws.com/${ad}`;
}

// Function to Check if Vendor is Authorized
function isVendorAuthorized(userId) {
    return authorizedVendors.includes(userId);
}

// Function to Fetch Vendor Details from Glovo API
async function fetchVendorDetails(vendorId) {
    try {
        const response = await axios.get(`${GLOVO_VENDOR_API}/${vendorId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching vendor data:", error);
        return null;
    }
}

// Express API Endpoints
app.get("/", (req, res) => res.send("Livestream API Running..."));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

console.log("LiveStream Server Running on ws://localhost:8080");

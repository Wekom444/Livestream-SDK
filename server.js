require("dotenv").config();
const WebSocket = require("ws");
const axios = require("axios");
const AWS = require("aws-sdk");
const express = require("express");
const config = require("./config"); // Import config file
const stripe = require("stripe")(config.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());

// WebSocket Server for Live Streaming, Ads, and Analytics
const server = new WebSocket.Server({ port: 8080 });
const s3 = new AWS.S3(); // AWS S3 for storing video ads
const userMetrics = {};
const liveStreamEvents = [];
const activeAds = [];

// WebSocket Server Logic
server.on("connection", (socket) => {
  const userId = socket._socket.remoteAddress; // Identify user by IP
  userMetrics[userId] = { startTime: Date.now(), interactions: 0 };

  console.log(`Client connected: ${userId}`);

  // Handle Messages (Chat, Reactions, Polls)
  socket.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "chat") {
        server.clients.forEach((client) => {
          if (client !== socket && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "chat", message: data.message }));
          }
        });
      }

      if (data.type === "poll-vote") {
        console.log("Poll Vote:", data.choice);
        server.clients.forEach((client) => {
          if (client !== socket && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "poll", pollData: data.choice }));
          }
        });
      }

      if (data.type === "reaction") {
        console.log("User Reaction:", data.reaction);
      }

      if (data.type === "request-ad") {
        const ad = getNextAd();
        socket.send(JSON.stringify({ type: "ad", ad }));
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  // Handle Inventory Fetch
  socket.on("fetch-inventory", async () => {
    try {
      const clientAPI = await config.getClientAPI(socket._socket.remoteAddress);
      if (!clientAPI) {
        socket.send(JSON.stringify({ error: "Client API not found" }));
        return;
      }
      const response = await axios.get(`${clientAPI.apiBaseUrl}/inventory`, {
        headers: { Authorization: `Bearer ${clientAPI.apiToken}` },
      });
      socket.send(JSON.stringify({ type: "inventory", data: response.data }));
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  });

  // Track Interactions
  socket.on("user-interaction", () => {
    userMetrics[userId].interactions += 1;
  });

  // Handle Disconnect
  socket.on("close", () => {
    userMetrics[userId].sessionDuration = Date.now() - userMetrics[userId].startTime;
    console.log("User Disconnected:", userId, "Metrics:", userMetrics[userId]);
    delete userMetrics[userId];
  });
});

// Fetch Next Ad Function
function getNextAd() {
  const ads = [
    { id: 1, title: "Buy One Get One Free!", videoUrl: "https://example.com/ad1.mp4" },
    { id: 2, title: "Limited-Time Discount!", videoUrl: "https://example.com/ad2.mp4" },
  ];
  return ads[Math.floor(Math.random() * ads.length)];
}

// Stripe Subscription Endpoint
app.post("/create-subscription", async (req, res) => {
  try {
    const { email, paymentMethodId } = req.body;

    const customer = await stripe.customers.create({
      email,
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: "price_ABC123" }], // Replace with your Stripe price ID
      trial_period_days: 14,
    });

    res.json({ subscriptionId: subscription.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Health Check
app.get("/", (req, res) => {
  res.send("Livestream API Running...");
});

// Start API Server
app.listen(5000, () => console.log("Server running on port 5000"));

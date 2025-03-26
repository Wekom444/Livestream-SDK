// Connect to your production WebSocket endpoint (update URL accordingly)
const socket = new WebSocket("wss://livestream.yourdomain.com");

socket.onopen = function () {
    console.log("Connected to WebSocket");
    requestAd(); // Request an ad on connection
};

socket.onmessage = function (event) {
    const data = JSON.parse(event.data);

    if (data.type === "chat") {
        document.getElementById("chatMessages").innerHTML += `<li>${data.message}</li>`;
    }
    if (data.type === "poll") {
        console.log("Poll update:", data.pollData);
    }
    if (data.type === "ad") {
        document.getElementById("ad-title").innerText = data.ad.title;
        document.getElementById("adVideo").src = data.ad.videoUrl;
        document.getElementById("adVideo").play();
    }
    if (data.type === "inventory") {
        console.log("Inventory update:", data.data);
    }
};

socket.onclose = function () {
    console.log("WebSocket connection closed");
};

function sendMessage() {
    const message = document.getElementById("messageInput").value;
    socket.send(JSON.stringify({ type: "chat", message }));
    document.getElementById("messageInput").value = "";
}

function votePoll(choice) {
    socket.send(JSON.stringify({ type: "poll-vote", choice }));
}

function requestAd() {
    socket.send(JSON.stringify({ type: "request-ad" }));
}

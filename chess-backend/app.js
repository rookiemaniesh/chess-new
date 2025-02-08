const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const cors = require("cors");



const app = express();
const server = http.createServer(app);
const io = socket(server, {
    cors: {
        origin: "http://localhost:5173", // ✅ Allow frontend to connect
        methods: ["GET", "POST"]
    }
});


const chess = new Chess();
let players = {};
let currentPlayer = "w";
app.use(cors()); // ✅ Enable CORS for all frontend requests
app.use(express.json());  // ✅ Allow JSON parsing
app.use(express.static(path.join(__dirname, "public")));

// ✅ STEP 1: Define API Routes First
app.get("/api/game-state", (req, res) => {
    res.json({ board: chess.fen(), turn: chess.turn() });
});

// ✅ WebSockets: Send board state to new players
io.on("connection", function (uniquesocket) {
    console.log("A new player connected:", uniquesocket.id);
    uniquesocket.emit("boardState", chess.fen()); // ✅ Send initial board state

    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    } else {
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on("disconnect", function () {
        if (uniquesocket.id === players.white) {
            delete players.white;
        } else if (uniquesocket.id === players.black) {
            delete players.black;
        }
    });

    uniquesocket.on("move", (move) => {
        console.log("⬇ Received move from frontend:", move);
    
        try {
            if (chess.turn() === "w" && uniquesocket.id !== players.white) {
                console.log("❌ Not white's turn!");
                return;
            }
            if (chess.turn() === "b" && uniquesocket.id !== players.black) {
                console.log("❌ Not black's turn!");
                return;
            }
    
            const result = chess.move(move);
            if (result) {
                console.log("✅ Move applied:", move);
                console.log("📤 Emitting new board state:", chess.fen());
                io.emit("boardState", chess.fen());  // ✅ Send updated board to all players
            } else {
                console.log("❌ Invalid move:", move);
                uniquesocket.emit("invalidMove", move);
            }
        } catch (err) {
            console.log("❌ Error processing move:", err);
            uniquesocket.emit("invalidMove", move);
        }
    });
    
});



// ✅ STEP 2: Serve React Frontend for Any Non-API Routes
// app.use(express.static(path.join(__dirname, "../chess-frontend/build")));

// app.get("*", (req, res) => {
//     if (!req.path.startsWith("/api")) {  // ✅ Only serve React for non-API requests
//         res.sendFile(path.join(__dirname, "../chess-frontend/build", "index.html"));
//     }
// });

// ✅ Start Server on PORT 5000
const PORT = process.env.PORT || 5000;
server.listen(PORT, function () {
    console.log(`Backend is running on port ${PORT}`);
});

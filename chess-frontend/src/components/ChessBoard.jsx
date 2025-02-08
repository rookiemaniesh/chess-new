import React, { useEffect, useState } from "react";
import { Chess } from "chess.js"; // ✅ Import chess.js
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // ✅ Connect to backend WebSocket
const game = new Chess(); // ✅ Create a chess game instance

const ChessBoard = () => {
  const [boardState, setBoardState] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState(null);

  useEffect(() => {
    socket.on("boardState", (fen) => {
      game.load(fen);
      setBoardState(game.board());
    });

    return () => socket.off("boardState");
  }, []);

  // ✅ Handle piece selection & movement
//   const handleMove = (row, col) => {
//     const square = String.fromCharCode(97 + col) + (8 - row); // Convert (row, col) to chess notation

//     if (!selectedSquare) {
//       setSelectedSquare(square); // Select piece
//     } else {
//       const move = { from: selectedSquare, to: square };
//       const result = game.move(move);
      
//       if (result) {
//           socket.emit("move", move); // ✅ Send move to backend
//         setBoardState(game.board());
//         console.log("📤 Attempting to send move to backend:", move);
//       }
//       setSelectedSquare(null);
//     }
//   };
  
const handleMove = (row, col) => {
    const square = String.fromCharCode(97 + col) + (8 - row); // Convert (row, col) to chess notation

    if (!selectedSquare) {
        setSelectedSquare(square); // Select piece
    } else {
        const move = { from: selectedSquare, to: square };

        // ✅ Check if move is legal before applying it
        const possibleMoves = game.moves({ square: selectedSquare, verbose: true });
        const isValid = possibleMoves.some(m => m.to === square);

        if (isValid) {
            const result = game.move(move);
            if (result) {
                console.log("✅ Valid move:", move);
                socket.emit("move", move); // ✅ Send move to backend
                setBoardState(game.board()); // Update frontend immediately
            }
        } else {
            console.log("❌ Invalid move:", move);
        }

        setSelectedSquare(null);
    }
};





  return (
    <div className="w-full h-screen flex items-center justify-center bg-zinc-900">
      <div className="grid grid-cols-8 grid-rows-8 w-96 h-96 border border-gray-800">
        {boardState.map((row, rowIndex) =>
          row.map((square, colIndex) => {
            const isDark = (rowIndex + colIndex) % 2 === 1;
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`flex justify-center items-center ${
                  isDark ? "bg-brown-600" : "bg-yellow-200"
                }`}
                style={{ width: "50px", height: "50px" }}
                onClick={() => handleMove(rowIndex, colIndex)}
              >
                {square && (
                  <span className="text-3xl cursor-pointer">
                    {square.type === "p" ? (square.color === "w" ? "♙" : "♟") :
                     square.type === "r" ? (square.color === "w" ? "♖" : "♜") :
                     square.type === "n" ? (square.color === "w" ? "♘" : "♞") :
                     square.type === "b" ? (square.color === "w" ? "♗" : "♝") :
                     square.type === "q" ? (square.color === "w" ? "♕" : "♛") :
                     square.type === "k" ? (square.color === "w" ? "♔" : "♚") : ""}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChessBoard;

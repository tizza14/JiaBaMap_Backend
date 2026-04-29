const { Server } = require('socket.io');
let io;

const parseAllowedOrigins = () => {
  const origins = process.env.FRONTEND_URLS || process.env.FRONTEND_URL;
  return (origins || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: parseAllowedOrigins(),
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log("A user connected");
    
    socket.on('join', (userId) => {
      if (!userId) {
        console.log("Received null/undefined userId");
        return;
      }
      try {
        const roomId = userId.toString();
        console.log(`User ${roomId} joined room`);
        socket.join(roomId);
      } catch (error) {
        console.error("Error joining room:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
      for (const room of socket.rooms) {
        if (room !== socket.id) socket.leave(room);
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };

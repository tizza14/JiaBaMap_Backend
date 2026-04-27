const { Server } = require('socket.io');
let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
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
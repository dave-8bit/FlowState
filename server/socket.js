const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let ioInstance = null;

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  ioInstance = io;

  io.use((socket, next) => {
    const token = socket.handshake?.auth?.token;
    if (!token) return next(new Error("Unauthorized"));

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return next(new Error("Server misconfigured"));

    try {
      const decoded = jwt.verify(token, jwtSecret);
      socket.user = decoded;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    // join an authenticated per-user room for task sync
    if (socket.user?.userId) socket.join(`user:${socket.user.userId}`);

    socket.on("join_session", ({ sessionId } = {}) => {
      if (!sessionId) return;
      socket.join(`session:${sessionId}`);
      io.to(`session:${sessionId}`).emit("user_joined", {
        userId: socket.user.userId,
        username: socket.user.username,
      });
    });

    socket.on("leave_session", ({ sessionId } = {}) => {
      if (!sessionId) return;
      socket.leave(`session:${sessionId}`);
      io.to(`session:${sessionId}`).emit("user_left", {
        userId: socket.user.userId,
      });
    });

    socket.on("task_update", ({ sessionId, taskId, status } = {}) => {
      if (!sessionId || !taskId) return;
      io.to(`session:${sessionId}`).emit("task_updated", {
        taskId,
        status,
        userId: socket.user.userId,
      });
    });

    socket.on("panic_button", ({ sessionId } = {}) => {
      if (!sessionId) return;
      io.to(`session:${sessionId}`).emit("focus_wave", {
        triggeredBy: socket.user.userId,
        timestamp: Date.now(),
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${reason}`);
    });
  });

  return io;
};

function getIO() {
  return ioInstance;
}

module.exports = { initSocket, getIO };


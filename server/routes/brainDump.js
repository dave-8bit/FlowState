const express = require("express");

const { getBrainDumpTasks } = require("../services/brainDumpService");
const { getIO } = require("../socket");
const { authenticateToken } = require("../middleware/authenticateToken");

const router = express.Router();

const validateBody = (req, res, next) => {
  const input = req.body?.input;

  if (typeof input !== "string") {
    return res.status(400).json({ error: "Invalid request body: input must be a string" });
  }

  if (input.trim().length === 0) {
    return res.status(400).json({ error: "Invalid request body: input cannot be empty" });
  }

  return next();
};

router.post("/", authenticateToken, validateBody, async (req, res) => {
  const userId = req.user?.userId;
  const io = getIO();

  try {
    const { input } = req.body;

    // Request validated + authenticated -> emit started
    if (io && userId) io.to(`user:${userId}`).emit("brainDump:started");

    const tasks = await getBrainDumpTasks({ input });

    // Generation succeeded -> emit completed
    if (io && userId) io.to(`user:${userId}`).emit("brainDump:completed", { tasks });

    return res.json({ tasks });
  } catch (err) {
    // Generation failed -> emit failed (only after processing begins)
    console.error("BRAIN_DUMP_ERROR_STACK:", err);
    if (io && userId) io.to(`user:${userId}`).emit("brainDump:failed");

    return res.status(500).json({
      error: "Failed to generate brain-dump tasks",
      message: err?.message,
      stack: err?.stack
    });
  }
});

module.exports = router;




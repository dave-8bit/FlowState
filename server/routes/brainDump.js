const express = require("express");

const { getBrainDumpTasks } = require("../services/brainDumpService");

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

router.post("/", validateBody, async (req, res) => {
  try {
    const { input } = req.body;

    const tasks = await getBrainDumpTasks({ input });

    return res.json({ tasks });
  } catch (err) {
  console.error("BRAIN_DUMP_ERROR_STACK:", err);

  return res.status(500).json({
    error: "Failed to generate brain-dump tasks",
    message: err?.message,
    stack: err?.stack
  });
}});

module.exports = router;


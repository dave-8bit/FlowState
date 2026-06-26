const express = require("express");
const jwt = require("jsonwebtoken");

const { PrismaClient } = require("@prisma/client");

const { getIO } = require("../socket");

const router = express.Router();

const prisma = new PrismaClient();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return res.status(401).json({ error: "Unauthorized" });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return res.status(500).json({ error: "Server misconfigured" });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

router.use(authenticateToken);

router.post("/tasks", async (req, res) => {
  try {
    const { title, description, priority, deadline } = req.body || {};

    const userId = req.user.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description: description || null,
        priority,
        status: "TODO",
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    await prisma.analytics.update({
      where: { userId },
      data: { lastActiveAt: new Date() },
    });

    const io = getIO();
    if (io) io.to(`user:${userId}`).emit("task:created", { task });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: "Failed to create task" });
  }
});

router.get("/tasks", async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { deadline: "asc" },
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

router.patch("/tasks/:id", async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    const { title, description, priority, status, deadline } = req.body || {};

    const existingTask = await prisma.task.findFirst({
      where: { id, userId },
      select: { id: true, status: true },
    });

    if (!existingTask) return res.status(404).json({ error: "Task not found" });

    const prevStatus = existingTask.status;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description: description || null,
        priority,
        status,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    if (prevStatus !== status) {
      if (status === "DONE") {
        await prisma.analytics.update({
          where: { userId },
          data: {
            tasksCompleted: { increment: 1 },
            lastActiveAt: new Date(),
          },
        });
      } else if (prevStatus === "DONE" && status === "TODO") {
        await prisma.analytics.update({
          where: { userId },
          data: {
            tasksCompleted: { decrement: 1 },
            lastActiveAt: new Date(),
          },
        });
      } else {
        await prisma.analytics.update({
          where: { userId },
          data: { lastActiveAt: new Date() },
        });
      }
    } else {
      await prisma.analytics.update({
        where: { userId },
        data: { lastActiveAt: new Date() },
      });
    }

    const io = getIO();
    if (io) io.to(`user:${userId}`).emit("task:updated", { task: updatedTask });

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

router.delete("/tasks/:id", async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;

    const existingTask = await prisma.task.findFirst({
      where: { id, userId },
      select: { id: true, status: true },
    });

    if (!existingTask) return res.status(404).json({ error: "Task not found" });

    await prisma.task.delete({ where: { id } });

    const io = getIO();
    if (io) io.to(`user:${userId}`).emit("task:deleted", { taskId: id });

    if (existingTask.status !== "DONE") {
      await prisma.analytics.update({
        where: { userId },
        data: {
          tasksAbandoned: { increment: 1 },
          lastActiveAt: new Date(),
        },
      });
    } else {
      await prisma.analytics.update({
        where: { userId },
        data: { lastActiveAt: new Date() },
      });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

module.exports = router;


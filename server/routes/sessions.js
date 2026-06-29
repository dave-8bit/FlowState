const express = require("express");

const { PrismaClient } = require("@prisma/client");

const { getIO } = require("../socket");
const { authenticateToken } = require("../middleware/authenticateToken");

const router = express.Router();

const prisma = new PrismaClient();

router.use(authenticateToken);

router.post("/sessions", async (req, res) => {
  try {
    const { title, timerMinutes, taskId, blockId } = req.body || {};
    const creatorId = req.user.userId;
    if (!creatorId) return res.status(401).json({ error: "Unauthorized" });

    const session = await prisma.focusSession.create({
      data: {
        title,
        timerMinutes,
        creatorId,
        participants: {
          create: {
            userId: creatorId,
            ...(taskId ? { taskId } : {}),
            ...(blockId ? { blockId } : {}),
          },
        },
      },
      include: {
        participants: true,
      },
    });

    const io = getIO();
    if (io) {
      const startedAt = new Date();
      const endsAt = new Date(startedAt.getTime() + Number(timerMinutes) * 60 * 1000);

      io.to(`user:${creatorId}`).emit("focus:started", {
        sessionId: session.id,
        taskId: null,
        timerMinutes: session.timerMinutes,
        status: "running",
        startedAt: startedAt.toISOString(),
        endsAt: endsAt.toISOString(),
      });
    }

    res.status(201).json(session);
  } catch {
    res.status(500).json({ error: "Failed to create session" });
  }
});

router.get("/sessions", async (req, res) => {
  try {
    const includeCompleted = String(req.query?.includeCompleted || '').toLowerCase() === 'true'

    const sessions = await prisma.focusSession.findMany({
      where: includeCompleted ? {} : { isActive: true },
      include: {
        participants: true,
      },
      orderBy: { createdAt: "desc" },
    });


    const formatted = sessions.map((s) => ({
      ...s,
      participantCount: s.participants.length,
      // keep participants as-is so client can read participant.taskId for progress mapping
    }));

    res.json(formatted);
  } catch {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});


router.get("/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.focusSession.findFirst({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!session) return res.status(404).json({ error: "Session not found" });

    const formattedParticipants = session.participants.map((p) => ({
      ...p,
      username: p.user.username,
      avatarUrl: p.user.avatarUrl,
    }));

    const { participants, ...rest } = session;
    res.json({ ...rest, participants: formattedParticipants });
  } catch {
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

router.patch("/sessions/:id/close", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    const userId = req.user.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const session = await prisma.focusSession.findFirst({
      where: { id, creatorId: userId },
      select: { id: true, creatorId: true },
    });

    if (!session) return res.status(404).json({ error: "Session not found" });

    const updated = await prisma.focusSession.update({
      where: { id },
      data: { isActive: false },
    });

    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit("focus:completed", {
        sessionId: updated.id,
        status: "completed",
        completedAt: new Date().toISOString(),
      });
    }

    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to close session" });
  }
});

module.exports = router;


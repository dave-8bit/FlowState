const express = require("express");

const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

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
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

router.use(authenticateToken);

router.post("/sessions", async (req, res) => {
  try {
    const { title, timerMinutes } = req.body || {};
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
          },
        },
      },
      include: {
        participants: true,
      },
    });

    res.status(201).json(session);
  } catch {
    res.status(500).json({ error: "Failed to create session" });
  }
});

router.get("/sessions", async (req, res) => {
  try {
    const sessions = await prisma.focusSession.findMany({
      where: { isActive: true },
      include: {
        participants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = sessions.map((s) => ({
      ...s,
      participantCount: s.participants.length,
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

    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to close session" });
  }
});

module.exports = router;


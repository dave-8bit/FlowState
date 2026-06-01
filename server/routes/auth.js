const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const { PrismaClient } = require("@prisma/client");



const router = express.Router();

const prisma = new PrismaClient();

const getRedirectUri = () => {
  if (process.env.GITHUB_REDIRECT_URI) return process.env.GITHUB_REDIRECT_URI;
  return `/auth/github/callback`;
};


const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const clientUrl = process.env.CLIENT_URL;
const jwtSecret = process.env.JWT_SECRET;

if (!githubClientId || !githubClientSecret || !clientUrl || !jwtSecret) {
  throw new Error(
    "Missing required environment variables: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, CLIENT_URL, JWT_SECRET"
  );
}

router.get("/github", (req, res) => {
  try {
    const redirectUri = `${clientUrl.replace(/\/$/, "")}/auth/github/callback`;
    const scope = encodeURIComponent("read:user user:email");

    const authorizationUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
      githubClientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}`;

    res.redirect(302, authorizationUrl);
  } catch (err) {
    res.status(500).json({ error: "Failed to start GitHub OAuth" });
  }
});

router.get("/github/callback", async (req, res) => {
  const { code } = req.query;

  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Missing OAuth code" });
  }

  try {
    const redirectUri = `${clientUrl.replace(/\/$/, "")}/auth/github/callback`;

    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: githubClientId,
        client_secret: githubClientSecret,
        code,
        redirect_uri: redirectUri,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const accessToken = tokenResponse?.data?.access_token;
    if (!accessToken) {
      return res.status(500).json({ error: "Failed to obtain access token" });
    }

    const githubProfileResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/json",
      },
    });

    const githubUser = githubProfileResponse.data;
    const githubId = githubUser?.id != null ? String(githubUser.id) : null;
    const username = githubUser?.login;
    const avatarUrl = githubUser?.avatar_url;

    if (!githubId || !username) {
      return res.status(500).json({ error: "Failed to fetch GitHub profile" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { githubId },
      include: { analytics: true },
    });

    let user;
    let isNewUser = false;

    if (!existingUser) {
      user = await prisma.user.create({
        data: {
          githubId,
          username,
          avatarUrl: avatarUrl || null,
        },
      });

      await prisma.analytics.create({
        data: {
          userId: user.id,
        },
      });

      isNewUser = true;
    } else {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          username,
          avatarUrl: avatarUrl || null,
        },
      });

      if (!existingUser.analytics) {
        await prisma.analytics.create({
          data: {
            userId: user.id,
          },
        });
      }
    }

    const token = jwt.sign(
      { userId: user.id, githubId: user.githubId },
      jwtSecret,
      { expiresIn: "7d" }
    );

    const redirectUrl = `${clientUrl.replace(/\/$/, "")}/?token=${encodeURIComponent(
      token
    )}`;

    return res.redirect(302, redirectUrl);
  } catch (err) {
    const message = err?.response?.data?.error_description || err?.message || "OAuth error";
    return res.redirect(302, `${clientUrl.replace(/\/$/, "")}/auth/error?message=${encodeURIComponent(message)}`);
  }
});

module.exports = router;


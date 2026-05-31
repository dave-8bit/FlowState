const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", project: "FlowState" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`David FlowState server running on port ${PORT}`);
});


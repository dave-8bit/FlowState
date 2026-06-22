const express = require("express");
const http = require("node:http");
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

const authRouter = require("./routes/auth");
const tasksRouter = require("./routes/tasks");
const sessionsRouter = require("./routes/sessions");
const brainDumpRouter = require("./routes/brainDump");
const { initSocket } = require("./socket");

app.use("/auth", authRouter);
app.use("/api", tasksRouter);
app.use("/api", sessionsRouter);
// Brain-dump is public (no auth). Keep /api tasks & sessions protected.
app.use("/api", brainDumpRouter);




const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = 3000;

httpServer.listen(PORT, () => {
  console.log(`David FlowState server running on port ${PORT}`);
});




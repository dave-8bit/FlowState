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
const debugBrainDumpRouter = require("./routes/debugBrainDump");
const { initSocket } = require("./socket");

app.use("/auth", authRouter);
// PUBLIC brain-dump endpoints (must be registered before any potentially protected /api routes)
app.use("/api/brain-dump", brainDumpRouter);
app.use("/api/brain-dump-debug", debugBrainDumpRouter);

app.use("/api", tasksRouter);
app.use("/api", sessionsRouter);







const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = 3000;

httpServer.listen(PORT, () => {
  console.log(`David FlowState server running on port ${PORT}`);
});




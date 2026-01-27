import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";

const app = express();
// Allow JSON bodies up to 1MB to support larger config payloads (~500KB)
app.use(express.json({ limit: "2mb" }));

// Enable CORS for local frontend during development
if (process.env.NODE_ENV === "development") {
  app.use(cors());
}

app.use("/api", authRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

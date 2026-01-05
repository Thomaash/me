import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";

const app = express();
app.use(express.json());

// Enable CORS for local frontend during development
if (process.env.NODE_ENV === "development") {
  app.use(cors({ origin: "http://127.0.0.1:5173" }));
}

app.use("/api", authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

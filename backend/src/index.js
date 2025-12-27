import dotenv from "dotenv";
dotenv.config();

import express from "express";
import authRoutes from "./routes/auth.js";

const app = express();
app.use(express.json());

app.use("/api", authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

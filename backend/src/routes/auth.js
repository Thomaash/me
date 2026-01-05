import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db/client.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

// POST /api/register
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: "user exists" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hashed, name } });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
  const { password: _p, ...safe } = user;
  res.status(201).json({ token, user: safe });
});

// POST /api/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
  const { password: _p, ...safe } = user;
  res.json({ token, user: safe });
});

// GET /api/me
router.get("/me", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = (auth.startsWith("Bearer ") && auth.slice(7)) || null;
  if (!token) return res.status(401).json({ error: "missing token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(404).json({ error: "user not found" });
    const { password: _p, ...safe } = user;
    res.json({ user: safe });
  } catch (err) {
    return res.status(401).json({ error: "invalid token" });
  }
});

import { listConfigs, setConfig, getConfig } from "../utils/configs.js";

// POST /api/configs
// Expects a JSON body that includes a string `projectName` key; the full JSON is stored as `content` (stringified).
// If a config with the same (userId, projectName) exists, it is replaced.
router.post("/configs", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = (auth.startsWith("Bearer ") && auth.slice(7)) || null;
  if (!token) return res.status(401).json({ error: "missing token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(404).json({ error: "user not found" });

    const body = req.body || {};
    const projectName = body.projectName;
    if (!projectName || typeof projectName !== "string") {
      return res.status(400).json({ error: "projectName (string) required in body" });
    }

    const createdOrUpdated = await setConfig(user.id, projectName, body);
    const status = createdOrUpdated ? (createdOrUpdated.createdAt === createdOrUpdated.updatedAt ? "created" : "updated") : "updated";

    // Return timestamps depending on result
    if (status === "created") {
      return res.status(201).json({ status: "created", name: projectName, createdAt: createdOrUpdated.createdAt });
    } else {
      return res.json({ status: "updated", name: projectName, updatedAt: createdOrUpdated.updatedAt });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal error" });
  }
});

// GET /api/configs
// Optional query param: ?full=true to include parsed content for each config
router.get("/configs", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = (auth.startsWith("Bearer ") && auth.slice(7)) || null;
  if (!token) return res.status(401).json({ error: "missing token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(404).json({ error: "user not found" });

    const includeContent = req.query.full === "true" || req.query.full === "1";
    const list = await listConfigs(user.id, { includeContent });
    res.json({ configs: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal error" });
  }
});

export default router;

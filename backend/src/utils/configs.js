import prisma from "../db/client.js";

export async function setConfig(userId, projectName, obj) {
  if (!projectName || typeof projectName !== "string") {
    throw new Error("projectName must be a non-empty string");
  }
  const content = JSON.stringify(obj);
  // Use upsert semantics: create if missing, update if existing
  const res = await prisma.config.upsert({
    where: { userId_name: { userId, name: projectName } },
    update: { content },
    create: { userId, name: projectName, content },
  });
  return res;
}

export async function getConfig(userId, projectName) {
  const row = await prisma.config.findUnique({
    where: { userId_name: { userId, name: projectName } },
  });
  if (!row) return null;
  let parsed = null;
  try {
    parsed = JSON.parse(row.content);
  } catch (err) {
    // If parsing fails, return raw string in `raw` field
    parsed = { raw: row.content };
  }
  return { name: row.name, createdAt: row.createdAt, updatedAt: row.updatedAt, content: parsed };
}

export async function listConfigs(userId, options = { includeContent: false }) {
  const rows = await prisma.config.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map((r) => {
    const base = { name: r.name, createdAt: r.createdAt, updatedAt: r.updatedAt };
    if (options.includeContent) {
      try {
        base.content = JSON.parse(r.content);
      } catch (err) {
        base.content = { raw: r.content };
      }
    }
    return base;
  });
}

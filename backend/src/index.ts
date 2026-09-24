import { resolve } from "node:path";
import cors from "cors";
import dotenv from "dotenv";
import express, { type Response } from "express";

dotenv.config({ path: resolve(process.cwd(), ".env") });
dotenv.config({ path: resolve(process.cwd(), "../.env.local") });
import {
  deleteProjectById,
  loadApplicationState,
  loadIntegrations,
  persistApplicationState,
  saveIntegrations,
} from "./repositories/pdcc-repository.js";
import {
  commitWizardDraft,
  createWizardDraft,
  deleteWizardDraft,
  findWizardDraftByProjectId,
  loadWizardDraft,
  updateWizardDraft,
} from "./repositories/wizard-draft-repository.js";
import { getPool } from "./db/pool.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    ],
  }),
);
app.use(express.json({ limit: "15mb" }));

app.get("/api/v1/health", async (_req, res) => {
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    res.json({
      ok: true,
      database: "postgres",
      service: "pdcc-api",
      features: { wizardDrafts: true, closingFlow: true },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    res.status(503).json({ ok: false, error: message });
  }
});

app.get("/api/v1/state", async (_req, res) => {
  try {
    const db = await loadApplicationState();
    res.json(db);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    res.status(500).json({ error: message });
  }
});

app.put("/api/v1/state", async (req, res) => {
  try {
    await persistApplicationState(req.body);
    res.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    res.status(500).json({ error: message });
  }
});

app.get("/api/v1/projects/active", async (_req, res) => {
  const db = await loadApplicationState();
  res.json({
    activeProjectId: db.activeProjectId ?? db.projects[0]?.id ?? null,
    projects: db.projects.map((p) => ({
      id: p.id,
      name: p.name,
      customerName: p.customerName,
      status: p.status,
    })),
  });
});

async function handleDeleteProject(projectId: string, res: Response) {
  try {
    await deleteProjectById(projectId);
    res.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    res.status(400).json({ error: message });
  }
}

app.post("/api/v1/projects/delete", async (req, res) => {
  const projectId = String(req.body?.projectId ?? "");
  if (!projectId) {
    res.status(400).json({ error: "projectId required" });
    return;
  }
  await handleDeleteProject(projectId, res);
});

app.post("/api/v1/wizard-drafts", async (req, res) => {
  try {
    const { organizationId, project } = req.body as {
      organizationId?: string;
      project?: import("../../../src/lib/types.ts").Project;
    };
    if (!organizationId || !project) {
      res.status(400).json({ error: "organizationId and project required" });
      return;
    }
    const draft = await createWizardDraft(organizationId, project);
    res.json({
      draftId: draft.draftId,
      organizationId: draft.organizationId,
      wizardStep: draft.wizardStep,
      payload: draft.payload,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    res.status(500).json({ error: message });
  }
});

app.get("/api/v1/wizard-drafts/by-project/:projectId", async (req, res) => {
  const draft = await findWizardDraftByProjectId(String(req.params.projectId));
  if (!draft) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json({
    draftId: draft.draftId,
    organizationId: draft.organizationId,
    wizardStep: draft.wizardStep,
    payload: draft.payload,
  });
});

app.get("/api/v1/wizard-drafts/:draftId", async (req, res) => {
  const draft = await loadWizardDraft(String(req.params.draftId));
  if (!draft) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json({
    draftId: draft.draftId,
    organizationId: draft.organizationId,
    wizardStep: draft.wizardStep,
    payload: draft.payload,
  });
});

app.put("/api/v1/wizard-drafts/:draftId", async (req, res) => {
  try {
    const payload = req.body?.payload;
    if (!payload?.project) {
      res.status(400).json({ error: "payload.project required" });
      return;
    }
    await updateWizardDraft(String(req.params.draftId), payload);
    res.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    res.status(500).json({ error: message });
  }
});

app.delete("/api/v1/wizard-drafts/:draftId", async (req, res) => {
  await deleteWizardDraft(String(req.params.draftId));
  res.json({ ok: true });
});

app.post("/api/v1/wizard-drafts/:draftId/commit", async (req, res) => {
  try {
    const projectId = await commitWizardDraft(String(req.params.draftId));
    res.json({ projectId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    res.status(400).json({ error: message });
  }
});

app.delete("/api/v1/projects/:projectId", async (req, res) => {
  await handleDeleteProject(String(req.params.projectId), res);
});

app.post("/api/v1/projects/active", async (req, res) => {
  const projectId = req.body?.projectId as string | undefined;
  if (!projectId) {
    res.status(400).json({ error: "projectId required" });
    return;
  }
  const db = await loadApplicationState();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) {
    res.status(404).json({ error: "project not found" });
    return;
  }
  db.activeProjectId = projectId;
  await persistApplicationState(db);
  res.json({ activeProjectId: projectId });
});

app.get("/api/v1/settings/integrations", async (req, res) => {
  const orgId = String(req.query.organizationId ?? "");
  if (!orgId) {
    res.status(400).json({ error: "organizationId query required" });
    return;
  }
  const config = await loadIntegrations(orgId);
  res.json({
    organizationId: config.organizationId,
    clickupWorkspaceId: config.clickupWorkspaceId ?? "",
    clickupSpaceId: config.clickupSpaceId ?? "",
    hasClickUpToken: Boolean(config.clickupApiToken),
    clickupApiToken: config.clickupApiToken,
  });
});

app.put("/api/v1/settings/integrations", async (req, res) => {
  const body = req.body as {
    organizationId?: string;
    clickupApiToken?: string;
    clickupWorkspaceId?: string;
    clickupSpaceId?: string;
  };
  if (!body.organizationId) {
    res.status(400).json({ error: "organizationId required" });
    return;
  }
  const existing = await loadIntegrations(body.organizationId);
  await saveIntegrations({
    organizationId: body.organizationId,
    clickupApiToken: body.clickupApiToken?.trim() || existing.clickupApiToken,
    clickupWorkspaceId: body.clickupWorkspaceId?.trim() || undefined,
    clickupSpaceId: body.clickupSpaceId?.trim() || undefined,
  });
  res.json({ ok: true });
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: Response,
    next: express.NextFunction,
  ) => {
    if (
      err instanceof SyntaxError &&
      "body" in err &&
      (err as SyntaxError & { status?: number }).status === 400
    ) {
      res.status(400).json({ error: "JSON body tidak valid" });
      return;
    }
    next(err);
  },
);

app.listen(port, () => {
  console.log(`PDCC API listening on http://127.0.0.1:${port}`);
});

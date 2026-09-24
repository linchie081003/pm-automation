import { notFound } from "next/navigation";
import { getDb, saveDb } from "@/lib/data/store";

export async function loadProject(projectId: string) {
  const db = await getDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) notFound();
  if (db.activeProjectId !== projectId) {
    db.activeProjectId = projectId;
    await saveDb(db);
  }
  return { db, project };
}

import type { ProjectPhase, ProjectTask } from "@/lib/types";

export interface ClickUpPreviewNode {
  folderName: string;
  lists: {
    name: string;
    durationDays: number;
    tasks: { name: string; isMilestone: boolean }[];
  }[];
}

export function buildClickUpPreview(
  projectName: string,
  phases: ProjectPhase[],
  tasks: ProjectTask[],
): ClickUpPreviewNode {
  const lists = phases
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((phase) => ({
      name: phase.name,
      durationDays: phase.durationDays,
      tasks: tasks
        .filter((t) => t.phaseId === phase.id && !t.parentTaskId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((t) => ({ name: t.name, isMilestone: t.isMilestone })),
    }));
  return { folderName: projectName, lists };
}

export async function createClickUpStructure(
  token: string | undefined,
  preview: ClickUpPreviewNode,
  spaceId?: string,
): Promise<{ folderId: string; created: boolean }> {
  if (!token || !spaceId) {
    return { folderId: `mock-folder-${Date.now()}`, created: false };
  }
  const folderRes = await fetch(
    `https://api.clickup.com/api/v2/space/${spaceId}/folder`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: preview.folderName }),
    },
  );
  if (!folderRes.ok) {
    throw new Error(`ClickUp folder create failed: ${folderRes.status}`);
  }
  const folder = (await folderRes.json()) as { id: string };
  for (const list of preview.lists) {
    const listRes = await fetch(
      `https://api.clickup.com/api/v2/folder/${folder.id}/list`,
      {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: `${list.name} ${list.durationDays} hari` }),
      },
    );
    if (!listRes.ok) continue;
    const listData = (await listRes.json()) as { id: string };
    for (const task of list.tasks) {
      await fetch(`https://api.clickup.com/api/v2/list/${listData.id}/task`, {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: task.name }),
      });
    }
  }
  return { folderId: folder.id, created: true };
}

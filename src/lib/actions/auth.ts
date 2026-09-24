"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/data/store";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const db = await getDb();
  const member = db.members.find((m) => m.email === email);
  if (!member) {
    redirect("/login?error=invalid");
  }
  const jar = await cookies();
  jar.set("pdcc_session", member.id, { httpOnly: true, path: "/" });
  jar.set("pdcc_role", member.role, { httpOnly: true, path: "/" });
  redirect("/portfolio");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete("pdcc_session");
  jar.delete("pdcc_role");
  redirect("/login");
}

import { NextResponse } from "next/server";
import { getPool } from "@/backend/db/pool";

export async function GET() {
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    return NextResponse.json({ ok: true, database: "postgres" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}

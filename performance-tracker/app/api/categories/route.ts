import { NextRequest, NextResponse } from "next/server";
import { appendCategory, deleteCategory, getCategories, getRecords, updateCategory } from "@/lib/sheets";
import { isAuthorized } from "@/lib/auth";
import { Category } from "@/lib/types";

function unauthorized() { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  try { return NextResponse.json(await getCategories()); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 }); }
}
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  try {
    const b = await req.json(); const now = new Date().toISOString();
    const c: Category = { id: crypto.randomUUID(), name: String(b.name || "").trim(), description: String(b.description || "").trim(), active: true, createdAt: now, updatedAt: now };
    if (!c.name) throw new Error("กรุณาระบุชื่อหมวดหมู่");
    await appendCategory(c); return NextResponse.json(c, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 400 }); }
}
export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  try { const b = await req.json(); const c: Category = { ...b, active: b.active !== false, updatedAt: new Date().toISOString() }; await updateCategory(c); return NextResponse.json(c); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  try {
    const id = new URL(req.url).searchParams.get("id"); if (!id) throw new Error("Missing id");
    const used = (await getRecords()).some(r => r.categoryId === id);
    if (used) throw new Error("หมวดหมู่นี้มีผลงานอ้างอิงอยู่ กรุณาย้าย/แก้ไขผลงานก่อนลบ");
    await deleteCategory(id); return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 400 }); }
}

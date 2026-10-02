import { NextRequest, NextResponse } from "next/server";
import { appendRecord, deleteRecord, getCategories, getRecords, updateRecord } from "@/lib/sheets";
import { isAuthorized } from "@/lib/auth";
import { getEvaluationCycle, getThaiFiscalYear } from "@/lib/fiscal";
import { WorkRecord } from "@/lib/types";

function unauthorized() { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  try { return NextResponse.json(await getRecords()); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  try {
    const b = await req.json();
    const categories = await getCategories();
    const category = categories.find(c => c.id === b.categoryId);
    const start = new Date(`${b.startDate}T00:00:00`);
    const now = new Date().toISOString();
    const record: WorkRecord = {
      id: crypto.randomUUID(), title: String(b.title || "").trim(), categoryId: String(b.categoryId || ""),
      categoryName: category?.name || "ไม่ระบุหมวดหมู่", startDate: b.startDate, endDate: b.endDate || b.startDate,
      fiscalYear: Number(b.fiscalYear || getThaiFiscalYear(start)), cycle: b.cycle || getEvaluationCycle(start),
      evidenceUrl: String(b.evidenceUrl || "").trim(), details: String(b.details || "").trim(), createdAt: now, updatedAt: now,
    };
    if (!record.title || !record.startDate || !record.categoryId) throw new Error("กรุณากรอกชื่อผลงาน หมวดหมู่ และวันที่เริ่มต้น");
    await appendRecord(record);
    return NextResponse.json(record, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 400 }); }
}

export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  try {
    const b = await req.json();
    const old = (await getRecords()).find(r => r.id === b.id);
    if (!old) throw new Error("ไม่พบข้อมูล");
    const categories = await getCategories();
    const category = categories.find(c => c.id === b.categoryId);
    const record: WorkRecord = { ...old, ...b, categoryName: category?.name || old.categoryName, fiscalYear: Number(b.fiscalYear), updatedAt: new Date().toISOString() };
    await updateRecord(record);
    return NextResponse.json(record);
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 400 }); }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new Error("Missing id");
    await deleteRecord(id);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 400 }); }
}

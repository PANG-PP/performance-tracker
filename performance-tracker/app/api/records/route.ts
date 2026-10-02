import { NextRequest, NextResponse } from "next/server";
import { appendRecord, deleteRecord, getRecords, updateRecord } from "@/lib/sheets";
import { isAuthorized } from "@/lib/auth";
import { getEvaluationCycle, getThaiFiscalYear } from "@/lib/fiscal";
import { WorkRecord } from "@/lib/types";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  try {
    return NextResponse.json(await getRecords());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  try {
    const b = await req.json();
    const start = new Date(`${b.startDate}T00:00:00`);
    const now = new Date().toISOString();
    const record: WorkRecord = {
      id: String(b.id || crypto.randomUUID()),
      title: String(b.title || "").trim(),
      categoryId: String(b.categoryId || ""),
      categoryName: String(b.categoryName || "ไม่ระบุหมวดหมู่").trim(),
      startDate: b.startDate,
      endDate: b.endDate || b.startDate,
      fiscalYear: Number(b.fiscalYear || getThaiFiscalYear(start)),
      cycle: b.cycle || getEvaluationCycle(start),
      evidenceUrl: String(b.evidenceUrl || "").trim(),
      details: String(b.details || "").trim(),
      createdAt: String(b.createdAt || now),
      updatedAt: now,
    };

    if (!record.title || !record.startDate || !record.categoryId) {
      throw new Error("กรุณากรอกชื่อผลงาน หมวดหมู่ และวันที่เริ่มต้น");
    }

    const saved = await appendRecord(record);
    return NextResponse.json(saved, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  try {
    const b = await req.json();
    const record: WorkRecord = {
      id: String(b.id || ""),
      title: String(b.title || "").trim(),
      categoryId: String(b.categoryId || ""),
      categoryName: String(b.categoryName || "ไม่ระบุหมวดหมู่").trim(),
      startDate: String(b.startDate || ""),
      endDate: String(b.endDate || b.startDate || ""),
      fiscalYear: Number(b.fiscalYear || 0),
      cycle: b.cycle === "2" ? "2" : "1",
      evidenceUrl: String(b.evidenceUrl || "").trim(),
      details: String(b.details || "").trim(),
      createdAt: String(b.createdAt || ""),
      updatedAt: new Date().toISOString(),
    };
    if (!record.id || !record.title || !record.categoryId || !record.startDate) {
      throw new Error("ข้อมูลสำหรับแก้ไขไม่ครบถ้วน");
    }
    const saved = await updateRecord(record);
    return NextResponse.json(saved);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new Error("Missing id");
    await deleteRecord(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 400 }
    );
  }
}

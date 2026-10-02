import { NextRequest, NextResponse } from "next/server";
import { appendCategory, deleteCategory, getCategories, updateCategory } from "@/lib/sheets";
import { isAuthorized } from "@/lib/auth";
import { Category } from "@/lib/types";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  try {
    return NextResponse.json(await getCategories());
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
    const now = new Date().toISOString();
    const category: Category = {
      id: crypto.randomUUID(),
      name: String(b.name || "").trim(),
      description: String(b.description || "").trim(),
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    if (!category.name) throw new Error("กรุณาระบุชื่อหมวดหมู่");
    const saved = await appendCategory(category);
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
    const category: Category = {
      ...b,
      active: b.active !== false,
      updatedAt: new Date().toISOString(),
    };
    const saved = await updateCategory(category);
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
    // ตรวจการอ้างอิงหมวดหมู่ที่ Apps Script เพียงจุดเดียว ลดการอ่าน records ซ้ำ
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 400 }
    );
  }
}

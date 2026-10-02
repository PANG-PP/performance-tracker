import { NextRequest, NextResponse } from "next/server";
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { getRecords } from "@/lib/sheets";
import { isAuthorized } from "@/lib/auth";
import { cycleLabel, thaiDate } from "@/lib/fiscal";

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { fiscalYear, cycle, categoryId } = await req.json();
    let records = await getRecords();
    records = records.filter(r => (!fiscalYear || r.fiscalYear === Number(fiscalYear)) && (!cycle || r.cycle === cycle) && (!categoryId || r.categoryId === categoryId));
    records.sort((a,b) => a.startDate.localeCompare(b.startDate));

    const font = "TH Sarabun New";
    const cell = (text: string, bold = false) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold, font, size: 32 })] })] });
    const rows = [new TableRow({ children: [cell("ลำดับ", true), cell("ผลงาน", true), cell("หมวดหมู่", true), cell("ระยะเวลาดำเนินการ", true), cell("ผลสัมฤทธิ์/รายละเอียด", true), cell("หลักฐาน", true)] })];
    records.forEach((r, i) => rows.push(new TableRow({ children: [
      cell(String(i+1)), cell(r.title), cell(r.categoryName), cell(`${thaiDate(r.startDate)} - ${thaiDate(r.endDate)}`), cell(r.details || "-"), cell(r.evidenceUrl || "-")
    ]})));

    const doc = new Document({
      styles: { default: { document: { run: { font, size: 32 }, paragraph: { spacing: { after: 80 } } } } },
      sections: [{ properties: {}, children: [
        new Paragraph({ alignment: AlignmentType.CENTER, heading: HeadingLevel.TITLE, children: [new TextRun({ text: "รายงานผลการปฏิบัติงาน", bold: true, font, size: 40 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `ปีงบประมาณ ${fiscalYear || "ทั้งหมด"}${cycle ? `  ${cycleLabel(cycle)}` : ""}`, font, size: 34 })] }),
        new Paragraph({ children: [new TextRun({ text: `จำนวนผลงานรวม ${records.length} รายการ`, font, size: 32 })] }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
      ]}],
    });
    const buffer = await Packer.toBuffer(doc);
    return new NextResponse(new Uint8Array(buffer), { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="performance-${fiscalYear || "all"}-${cycle || "all"}.docx"`
    }});
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 }); }
}

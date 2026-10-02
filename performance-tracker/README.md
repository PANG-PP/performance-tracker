# Performance Tracker

ระบบจัดเก็บผลการปฏิบัติงานตามปีงบประมาณและรอบการประเมิน ออกแบบเป็น Responsive Web App สำหรับใช้งานบนคอมพิวเตอร์และมือถือ

## สถาปัตยกรรมแบบไม่ใช้ Google Cloud Billing

ระบบนี้ใช้:

- **Next.js** เป็นเว็บไซต์และ API ฝั่งเซิร์ฟเวอร์
- **Vercel** สำหรับ Deploy เว็บไซต์
- **GitHub** สำหรับเก็บ Source Code
- **Google Apps Script Web App** เป็น Backend เชื่อม Google Sheets
- **Google Sheets** เป็นฐานข้อมูล

ไม่ต้องใช้ Google Cloud Console, Service Account, JSON Key หรือ Google Sheets API Credential

```text
Browser
  ↓
Next.js บน Vercel
  ↓
/api/records และ /api/categories
  ↓
Google Apps Script Web App
  ↓
Google Sheets
```

> Browser จะไม่เรียก Google Apps Script โดยตรง ค่าของ Apps Script URL และ Secret เก็บเป็น Environment Variables ฝั่ง Vercel

---

## ฟังก์ชันหลัก

### Dashboard

- แสดงผลการปฏิบัติงานตามปีงบประมาณไทย
- ปีงบประมาณเปลี่ยนอัตโนมัติวันที่ 1 ตุลาคม
- เลือกดูปีงบประมาณย้อนหลังได้
- แสดงจำนวนผลงานรายเดือน ต.ค. - ก.ย.
- แสดงความครบถ้วนของข้อมูล
- แสดงผลงานแยกตามหมวดหมู่
- แสดงผลงานล่าสุด
- Export รายงาน `.docx` โดยเลือกปีงบประมาณ รอบประเมิน และหมวดหมู่ได้
- รายงาน Word กำหนดฟอนต์ `TH Sarabun New`

### จัดการผลงาน

- ค้นหาและกรองตามปีงบประมาณ รอบประเมิน และหมวดหมู่
- เพิ่ม / แก้ไข / ลบผลงาน
- ระบุวันเริ่มต้นและวันสิ้นสุด
- ระบุปีงบประมาณ
- ระบุรอบประเมิน
  - รอบที่ 1: ตุลาคม - มีนาคม
  - รอบที่ 2: เมษายน - กันยายน
- แนบ URL หลักฐาน
- บันทึกรายละเอียด / ผลสัมฤทธิ์

### จัดการหมวดหมู่

- เพิ่ม / แก้ไข / ลบหมวดหมู่
- ระบบไม่อนุญาตให้ลบหมวดหมู่ที่ยังมีผลงานอ้างอิง

---

# วิธีติดตั้งแบบละเอียด

## ขั้นตอนที่ 1: สร้าง Google Sheet

1. เปิด Google Sheets
2. สร้าง Spreadsheet ใหม่ เช่น `Performance Tracker Database`
3. ยังไม่ต้องสร้างคอลัมน์เอง ระบบสร้างให้ได้อัตโนมัติ

## ขั้นตอนที่ 2: สร้าง Google Apps Script

จาก Google Sheet ที่สร้างไว้:

1. เลือก **Extensions > Apps Script**
2. เปิดไฟล์ `google-apps-script/Code.gs` จาก Project นี้
3. Copy โค้ดทั้งหมดไปแทนที่ไฟล์ `Code.gs` ใน Apps Script
4. กด Save

Apps Script นี้เป็น **Container-bound Script** จึงเชื่อมกับ Google Sheet ที่เปิดอยู่โดยตรง และไม่ต้องกำหนด `GOOGLE_SHEET_ID`

## ขั้นตอนที่ 3: ตั้ง APPS_SCRIPT_SECRET

สร้างข้อความสุ่มยาว ๆ หนึ่งค่า เช่น

```text
rmutl-performance-9f8c7a6b5d4e3f2a1-CHANGE-ME
```

จาก Apps Script:

1. เข้า **Project Settings**
2. ไปที่ **Script Properties**
3. กด **Add script property**
4. Property: `APPS_SCRIPT_SECRET`
5. Value: Secret ที่สร้างไว้
6. Save

ค่าตัวเดียวกันนี้จะต้องนำไปใส่ใน Vercel ภายหลัง

## ขั้นตอนที่ 4: เตรียมฐานข้อมูล

กลับหน้า Google Sheet แล้ว Refresh หนึ่งครั้ง จะมีเมนูใหม่ชื่อ **Performance Tracker**

เลือก:

**Performance Tracker > เตรียมฐานข้อมูล**

ครั้งแรก Google อาจขอสิทธิ์ให้ Script เข้าถึง Spreadsheet ให้กดยืนยันด้วยบัญชีเจ้าของ Sheet

ระบบจะสร้าง Sheet:

### `records`

```text
id
title
categoryId
categoryName
startDate
endDate
fiscalYear
cycle
evidenceUrl
details
createdAt
updatedAt
```

### `categories`

```text
id
name
description
active
createdAt
updatedAt
```

> หากไม่ได้กดเมนูนี้ ระบบจะสร้างสอง Sheet ให้อัตโนมัติเมื่อเว็บไซต์เรียกใช้งานครั้งแรกเช่นกัน

## ขั้นตอนที่ 5: Deploy Apps Script เป็น Web App

ในหน้า Apps Script:

1. กด **Deploy > New deployment**
2. Select type: **Web app**
3. Description: `Performance Tracker API`
4. Execute as: **Me**
5. Who has access: เลือกตัวเลือกที่อนุญาตให้ Vercel เรียก Web App ได้ เช่น **Anyone** ตามตัวเลือกที่บัญชีของคุณมี
6. กด Deploy
7. ยืนยัน Permission หาก Google ขอ
8. Copy **Web app URL**

URL จะมีรูปแบบประมาณ:

```text
https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxx/exec
```

แม้ Web App จะเปิดรับ Request ได้ แต่ทุก API ของระบบจะตรวจ `APPS_SCRIPT_SECRET` ก่อนอ่านหรือแก้ไขข้อมูล

### สำคัญเมื่อแก้ Code.gs ในอนาคต

หลังแก้ Apps Script ให้ไปที่:

**Deploy > Manage deployments > Edit > New version > Deploy**

ไม่เช่นนั้น Web App อาจยังทำงานด้วยโค้ดเวอร์ชันเก่า

---

# ขั้นตอนที่ 6: ทดสอบเว็บไซต์ในเครื่อง (ถ้าต้องการ)

ติดตั้ง Node.js รุ่นปัจจุบัน จากนั้นในโฟลเดอร์ Project:

```bash
npm install
```

สร้างไฟล์ `.env.local`

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
APPS_SCRIPT_SECRET=ใส่ค่าเดียวกับ Script Properties
APP_PASSWORD=รหัสผ่านสำหรับเข้าเว็บไซต์
```

จากนั้น:

```bash
npm run dev
```

เปิด:

```text
http://localhost:3000
```

---

# ขั้นตอนที่ 7: Upload ขึ้น GitHub

สร้าง Repository ใหม่ เช่น:

```text
performance-tracker
```

Upload Project นี้ขึ้น GitHub

อย่า Upload `.env.local` หรือ Secret ใด ๆ ขึ้น Repository

Project มี `.gitignore` ป้องกันไฟล์ environment ไว้แล้ว

---

# ขั้นตอนที่ 8: Deploy บน Vercel

1. Login Vercel
2. เลือก **Add New > Project**
3. Import Repository จาก GitHub
4. Framework จะตรวจพบเป็น Next.js
5. ก่อน Deploy ให้เพิ่ม Environment Variables

### Environment Variables

```text
GOOGLE_APPS_SCRIPT_URL
APPS_SCRIPT_SECRET
APP_PASSWORD
```

ตัวอย่าง:

```text
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/xxxxxxxx/exec
APPS_SCRIPT_SECRET=rmutl-performance-9f8c7a6b5d4e3f2a1
APP_PASSWORD=your-login-password
```

จากนั้นกด Deploy

ไม่ต้องมีค่าต่อไปนี้แล้ว:

```text
GOOGLE_SHEET_ID
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
```

---

# การทำงานด้านความปลอดภัย

ระบบมีการตรวจสองชั้นเบื้องต้น:

1. `APP_PASSWORD` ใช้สำหรับให้ผู้ใช้ Login หน้าเว็บไซต์
2. `APPS_SCRIPT_SECRET` ใช้ยืนยันการสื่อสารระหว่าง Vercel Server และ Apps Script

`APPS_SCRIPT_SECRET` ไม่ถูกส่งจากหน้า Browser ไป Google Apps Script โดยตรง

อย่างไรก็ตามระบบนี้ออกแบบสำหรับระบบส่วนตัวหรือทีมงานขนาดเล็ก หากใช้เป็นระบบหลายผู้ใช้ระดับองค์กร แนะนำให้พัฒนา Authentication รายบุคคลและ Audit Log เพิ่มเติม

---

# การ Export Word

รายงาน `.docx` ถูกสร้างที่ Next.js API บน Vercel ไม่ได้สร้างผ่าน Google Apps Script

กำหนดฟอนต์เอกสารเป็น:

```text
TH Sarabun New
```

เครื่องที่เปิดไฟล์ควรติดตั้ง TH Sarabun New เพื่อให้แสดงผลตามรูปแบบที่กำหนด

---

# โครงสร้าง Project

```text
performance-tracker/
├── app/
│   ├── api/
│   │   ├── categories/route.ts
│   │   ├── export/route.ts
│   │   └── records/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── google-apps-script/
│   └── Code.gs
├── lib/
│   ├── auth.ts
│   ├── fiscal.ts
│   ├── sheets.ts
│   └── types.ts
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── tsconfig.json
```

---

# ปัญหาที่พบบ่อย

## เว็บไซต์แจ้งว่า Unauthorized

ตรวจ `APP_PASSWORD` ใน Vercel และรหัสที่กรอกหน้าเว็บ

## แจ้ง Unauthorized จาก Apps Script

ตรวจว่า `APPS_SCRIPT_SECRET` ใน Vercel ตรงกับ Script Property ของ Apps Script ทุกตัวอักษร

## แก้ Code.gs แล้วเว็บไซต์ยังทำงานแบบเดิม

Deploy Apps Script เป็น **New version** แล้ว Deploy ใหม่

## เว็บไซต์อ่านข้อมูลไม่ได้หลัง Deploy Apps Script

ตรวจว่าใช้ URL ที่ลงท้าย `/exec` ไม่ใช่ URL สำหรับแก้ไข Script

## Export Word แล้วฟอนต์ไม่ตรง

ติดตั้ง `TH Sarabun New` ในเครื่องที่เปิดไฟล์ Word

---

## หมายเหตุเรื่องข้อมูลสำรอง

Google Sheets เป็นฐานข้อมูลโดยตรง จึงสามารถดูและสำรองข้อมูลจาก Spreadsheet ได้ง่าย แนะนำให้ใช้ Version history ของ Google Sheets และหลีกเลี่ยงการแก้ไขค่า `id` ในคอลัมน์แรกด้วยตนเอง

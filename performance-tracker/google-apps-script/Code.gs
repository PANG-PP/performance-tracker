/**
 * Performance Tracker - Google Apps Script Backend
 * ใช้แบบ Container-bound Script: เปิด Google Sheet > Extensions > Apps Script
 * แล้ววางไฟล์นี้ใน Code.gs
 */

const RECORD_SHEET = 'records';
const CATEGORY_SHEET = 'categories';
const RECORD_HEADERS = [
  'id', 'title', 'categoryId', 'categoryName', 'startDate', 'endDate',
  'fiscalYear', 'cycle', 'evidenceUrl', 'details', 'createdAt', 'updatedAt'
];
const CATEGORY_HEADERS = [
  'id', 'name', 'description', 'active', 'createdAt', 'updatedAt'
];


function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Performance Tracker')
    .addItem('เตรียมฐานข้อมูล', 'setupDatabase')
    .addToUi();
}

function setupDatabase() {
  ensureDatabase_();
  SpreadsheetApp.getActiveSpreadsheet().toast('เตรียมฐานข้อมูลเรียบร้อยแล้ว', 'Performance Tracker', 5);
}

function doGet(e) {
  try {
    assertSecret_((e && e.parameter && e.parameter.secret) || '');
    const action = (e && e.parameter && e.parameter.action) || '';
    let data;

    if (action === 'getRecords') data = getRecords_();
    else if (action === 'getCategories') data = getCategories_();
    else throw new Error('Unknown action');

    return json_({ ok: true, data: data });
  } catch (err) {
    return json_({ ok: false, error: errorMessage_(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    assertSecret_(body.secret || '');
    const action = body.action || '';
    const data = body.data || {};
    let result;

    switch (action) {
      case 'ensureDatabase':
        ensureDatabase_();
        result = { ready: true };
        break;
      case 'appendRecord':
        appendRecord_(data);
        result = data;
        break;
      case 'updateRecord':
        updateRecord_(data);
        result = data;
        break;
      case 'deleteRecord':
        deleteById_(RECORD_SHEET, data.id);
        result = { deleted: true };
        break;
      case 'appendCategory':
        appendCategory_(data);
        result = data;
        break;
      case 'updateCategory':
        updateCategory_(data);
        result = data;
        break;
      case 'deleteCategory':
        deleteCategory_(data.id);
        result = { deleted: true };
        break;
      default:
        throw new Error('Unknown action');
    }

    return json_({ ok: true, data: result });
  } catch (err) {
    return json_({ ok: false, error: errorMessage_(err) });
  }
}

function assertSecret_(provided) {
  const required = PropertiesService.getScriptProperties().getProperty('APPS_SCRIPT_SECRET');
  if (!required) throw new Error('ยังไม่ได้ตั้งค่า APPS_SCRIPT_SECRET ใน Script Properties');
  if (provided !== required) throw new Error('Unauthorized');
}

function spreadsheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('ไม่พบ Google Sheet ที่ผูกกับ Apps Script');
  return ss;
}

function ensureDatabase_() {
  ensureSheet_(RECORD_SHEET, RECORD_HEADERS);
  ensureSheet_(CATEGORY_SHEET, CATEGORY_HEADERS);
}

function ensureSheet_(name, headers) {
  const ss = spreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#dbeafe');
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

function getRecords_() {
  ensureDatabase_();
  const sheet = spreadsheet_().getSheetByName(RECORD_SHEET);
  if (sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, RECORD_HEADERS.length).getDisplayValues();

  return values.filter(function (r) { return r[0]; }).map(function (r) {
    return {
      id: r[0] || '',
      title: r[1] || '',
      categoryId: r[2] || '',
      categoryName: r[3] || '',
      startDate: r[4] || '',
      endDate: r[5] || '',
      fiscalYear: Number(r[6] || 0),
      cycle: r[7] === '2' ? '2' : '1',
      evidenceUrl: r[8] || '',
      details: r[9] || '',
      createdAt: r[10] || '',
      updatedAt: r[11] || ''
    };
  });
}

function appendRecord_(record) {
  validateRecord_(record);
  const sheet = ensureSheet_(RECORD_SHEET, RECORD_HEADERS);
  sheet.appendRow(recordRow_(record));
}

function updateRecord_(record) {
  validateRecord_(record);
  const sheet = ensureSheet_(RECORD_SHEET, RECORD_HEADERS);
  const row = findRowById_(sheet, record.id);
  sheet.getRange(row, 1, 1, RECORD_HEADERS.length).setValues([recordRow_(record)]);
}

function recordRow_(record) {
  return [
    record.id || '', record.title || '', record.categoryId || '', record.categoryName || '',
    record.startDate || '', record.endDate || '', Number(record.fiscalYear || 0),
    String(record.cycle || '1'), record.evidenceUrl || '', record.details || '',
    record.createdAt || '', record.updatedAt || ''
  ];
}

function validateRecord_(record) {
  if (!record || !record.id) throw new Error('ข้อมูลผลงานไม่มี id');
  if (!record.title) throw new Error('กรุณาระบุชื่อผลงาน');
  if (!record.categoryId) throw new Error('กรุณาระบุหมวดหมู่');
  if (!record.startDate) throw new Error('กรุณาระบุวันที่เริ่มต้น');
}

function getCategories_() {
  ensureDatabase_();
  const sheet = spreadsheet_().getSheetByName(CATEGORY_SHEET);
  if (sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, CATEGORY_HEADERS.length).getDisplayValues();

  return values.filter(function (r) { return r[0]; }).map(function (r) {
    return {
      id: r[0] || '',
      name: r[1] || '',
      description: r[2] || '',
      active: String(r[3]).toUpperCase() !== 'FALSE',
      createdAt: r[4] || '',
      updatedAt: r[5] || ''
    };
  });
}

function appendCategory_(category) {
  validateCategory_(category);
  const sheet = ensureSheet_(CATEGORY_SHEET, CATEGORY_HEADERS);
  sheet.appendRow(categoryRow_(category));
}

function updateCategory_(category) {
  validateCategory_(category);
  const sheet = ensureSheet_(CATEGORY_SHEET, CATEGORY_HEADERS);
  const row = findRowById_(sheet, category.id);
  sheet.getRange(row, 1, 1, CATEGORY_HEADERS.length).setValues([categoryRow_(category)]);
}

function deleteCategory_(id) {
  if (!id) throw new Error('Missing id');
  const used = getRecords_().some(function (record) { return record.categoryId === id; });
  if (used) throw new Error('หมวดหมู่นี้มีผลงานอ้างอิงอยู่ กรุณาย้าย/แก้ไขผลงานก่อนลบ');
  deleteById_(CATEGORY_SHEET, id);
}

function categoryRow_(category) {
  return [
    category.id || '', category.name || '', category.description || '',
    category.active !== false, category.createdAt || '', category.updatedAt || ''
  ];
}

function validateCategory_(category) {
  if (!category || !category.id) throw new Error('ข้อมูลหมวดหมู่ไม่มี id');
  if (!category.name) throw new Error('กรุณาระบุชื่อหมวดหมู่');
}

function findRowById_(sheet, id) {
  if (!id) throw new Error('Missing id');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('ไม่พบข้อมูลที่ต้องการ');
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return i + 2;
  }
  throw new Error('ไม่พบข้อมูลที่ต้องการ');
}

function deleteById_(sheetName, id) {
  const sheet = ensureSheet_(sheetName, sheetName === RECORD_SHEET ? RECORD_HEADERS : CATEGORY_HEADERS);
  const row = findRowById_(sheet, id);
  sheet.deleteRow(row);
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorMessage_(err) {
  if (!err) return 'Unknown error';
  return err.message ? String(err.message) : String(err);
}

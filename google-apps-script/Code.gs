/**
 * Phoebe Coaching App → Google Sheets 接收端
 * 更新後請在 Apps Script 重新部署為「網頁應用程式」，並確認網址與 src/config.js 相同。
 */
const BOOKING_SPREADSHEET_ID = '138Q4dDxKz5hY20vp1C1f6HZltPLh_02nJkgj3Xe8-eU';
const BOOKING_SHEET_NAME = 'Sheet1';
const TRAINING_SPREADSHEET_ID = '1C1MKQ5ri9HvFkXBagx4-QdGSir_Eo11tKSs5UHjr5f4';
const TRAINING_SHEET_NAME = '學員訓練紀錄';
const SESSION_SHEET_NAME = '上課紀錄';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    if (payload.action === 'appendTraining') return appendTraining(payload.student);
    if (payload.action === 'appendSession') return appendSession(payload.session);
    return saveBooking(payload);
  } catch (error) {
    return response({ ok: false, error: error.message });
  }
}

function doGet() {
  return response({ ok: true, message: 'Phoebe Coaching endpoint is ready.' });
}

function saveBooking(payload) {
  const sheet = SpreadsheetApp.openById(BOOKING_SPREADSHEET_ID).getSheetByName(BOOKING_SHEET_NAME);
  sheet.appendRow([
    new Date(), payload.name || '', payload.phone || '', payload.line || '', payload.birthday || '',
    payload.gender || '', payload.work || '', payload.workOther || '', payload.sleep || '',
    payload.condition || '', payload.conditionNote || '', payload.symptoms || '',
    listValue(payload.injuries), payload.injuryNote || '', payload.pregnancy || '',
    payload.exerciseFrequency || '', listValue(payload.activities), payload.coaching || '', listValue(payload.barriers),
    payload.barrierOther || '', payload.focus || '', payload.frequency || '', payload.time || '', payload.timeOther || '', payload.message || '',
  ]);
  return response({ ok: true });
}

function appendTraining(student) {
  if (!student || !student.id || !student.name) throw new Error('缺少學員資料。');
  const sheet = SpreadsheetApp.openById(TRAINING_SPREADSHEET_ID).getSheetByName(TRAINING_SHEET_NAME);
  if (!sheet) throw new Error(`找不到「${TRAINING_SHEET_NAME}」工作表。`);

  const now = new Date();
  const rows = (student.plan || []).map((exercise, index) => [
    now, student.id, student.name, student.goal || '', exercise.id || `exercise-${index + 1}`,
    exercise.section || '', exercise.name || '', exercise.weight || '', exercise.reps || '', exercise.sets || '',
  ]);
  if (rows.length) sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 10).setValues(rows);
  return response({ ok: true, rowCount: rows.length });
}

function appendSession(session) {
  const sheet = SpreadsheetApp.openById(TRAINING_SPREADSHEET_ID).getSheetByName(SESSION_SHEET_NAME);
  if (!sheet) throw new Error(`找不到「${SESSION_SHEET_NAME}」工作表。`);
  if (!session || !session.id || !session.date || !session.time) throw new Error('缺少上課日期、時間或課程 ID。');
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 3, sheet.getLastRow() - 1, 1).getValues().flat() : [];
  if (rows.includes(session.id)) return response({ ok: true, alreadyExists: true });
  sheet.appendRow([session.date, session.time, session.id, session.studentId || '', session.studentName || '', session.goal || '', session.record || '']);
  return response({ ok: true });
}

function listValue(value) {
  return Array.isArray(value) ? value.join('、') : (value || '');
}

function response(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

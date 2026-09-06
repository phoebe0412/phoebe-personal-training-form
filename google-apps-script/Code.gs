/**
 * Phoebe 體驗課預約表單 → Google Sheets 接收端
 * 部署為「網頁應用程式」後，將網址填入 src/config.js。
 */
const SPREADSHEET_ID = '138Q4dDxKz5hY20vp1C1f6HZltPLh_02nJkgj3Xe8-eU';
const SHEET_NAME = 'Sheet1';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    sheet.appendRow([
      new Date(), payload.name || '', payload.phone || '', payload.line || '', payload.birthday || '',
      payload.gender || '', payload.work || '', payload.workOther || '', payload.sleep || '',
      payload.condition || '', payload.conditionNote || '', payload.symptoms || '',
      listValue(payload.injuries), payload.injuryNote || '', payload.pregnancy || '',
      payload.exerciseFrequency || '', listValue(payload.activities), payload.coaching || '', listValue(payload.barriers),
      payload.barrierOther || '', payload.focus || '', payload.frequency || '', payload.time || '', payload.timeOther || '', payload.message || '',
    ]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('Phoebe booking form endpoint is ready.');
}

function listValue(value) {
  return Array.isArray(value) ? value.join('、') : (value || '');
}


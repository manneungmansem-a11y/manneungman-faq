/* =========================================================
   만능맨 파트너스 — Google Apps Script
   역할: 신청 데이터를 Google Sheets에 저장하고
         담당자 5명에게 이메일 발송
   ========================================================= */

/* ─── 설정값 (아래 3가지를 직접 입력하세요) ─────────────── */

// 수신자 이메일 주소 (5개, 순서 무관)
var RECIPIENTS = [
  '10000form_relay@samyangvalve.com'
];

// Google Sheets ID (스프레드시트 URL에서 /d/와 /edit 사이의 긴 문자열)
var SPREADSHEET_ID = '1p-_YZySYf4X_UFP0saoqPIwFRuyKd8U04ZhfDuViF7M';

// 저장할 시트 이름
var SHEET_NAME = '사전등록신청';

// 삭제된 신청서 시트 이름
var TRASH_SHEET_NAME = '삭제된 신청서';

// 관리자 활동 로그 시트 이름
var LOG_SHEET_NAME = '관리자활동로그';

/* ─── Sheets 컬럼 헤더 (순서 고정) ──────────────────────── */
var HEADERS = [
  '신청일시', '이름', '연락처', '이메일', '활동지역',
  '사업자구분', '업체명·상호명', '서비스분야', '보유자격증', '경력연수',
  '자기소개', '추가문의', '유입경로',
  '처리상태', '긴급출동가능여부', '담당자', '연락일', '관리자 메모', '최종결과'
];

/* ─── 테스트 데이터 키워드 (팝업 노출 제외) ─────────────── */
var TEST_KEYWORDS = [
  '테스트', 'test', '테스트이름', '테스트업체',
  '홍길동', '1111', '1234', 'asdf', 'qwer', '임시', '샘플'
];

function isTestRow(row) {
  var checkCols = [1, 2, 4, 6, 7]; // 이름, 연락처, 활동지역, 업체명, 서비스분야
  for (var c = 0; c < checkCols.length; c++) {
    var val = String(row[checkCols[c]] || '').toLowerCase().trim();
    for (var k = 0; k < TEST_KEYWORDS.length; k++) {
      if (val.indexOf(TEST_KEYWORDS[k].toLowerCase()) !== -1) return true;
    }
  }
  return false;
}

function isValidRow(row) {
  var name = String(row[1] || '').trim();
  var svc  = String(row[7] || '').trim();
  // 이름 2자 이상, 숫자만으로 구성되지 않음, 서비스분야 있음
  return name.length >= 2 && !/^\d+$/.test(name) && svc.length > 0;
}

/* ─── GET 핸들러 ─────────────────────────────────────────── */
function doGet(e) {
  // 관리자 페이지 라우팅
  if (e && e.parameter && e.parameter.page === 'admin') {
    return HtmlService.createHtmlOutputFromFile('admin')
      .setTitle('만능맨 파트너스 — 관리자 대시보드')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  }

  // 기존: 팝업용 최근 신청자 JSON 반환
  var items = [];
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) return buildJson([]);

    var lastRow = sheet.getLastRow();
    var numRows = Math.min(Math.max(lastRow - 1, 0), 200);
    if (numRows === 0) return buildJson([]);
    // A~H 8열: 신청일시(0) 이름(1) 연락처(2) 이메일(3) 활동지역(4) 사업자구분(5) 업체명·상호명(6) 서비스분야(7)
    // 새 신청은 항상 2행에 삽입되므로, 위에서부터 읽으면 최신순
    var data = sheet.getRange(2, 1, numRows, 8).getValues();

    for (var i = 0; i < data.length && items.length < 20; i++) {
      var row = data[i];
      if (isTestRow(row) || !isValidRow(row)) continue;
      var name = String(row[1] || '').trim();
      var svc  = String(row[7] || '').trim().split(/[,，]/)[0].trim();
      var ts   = row[0];
      items.push({
        n:  name.charAt(0) + '○○',
        j:  svc,
        ts: ts ? new Date(ts).getTime() : 0
      });
    }
  } catch (err) {
    Logger.log('doGet 오류: ' + err.message);
  }
  return buildJson(items);
}

function buildJson(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ─── 스팸/봇 방어 설정 ──────────────────────────────────── */
var MIN_SUBMIT_MS      = 2000;      // 페이지 진입 후 이만큼 안 지났으면 봇으로 간주
var RATE_LIMIT_WINDOW_S = 60;       // rate limit 집계 창(초)
var RATE_LIMIT_MAX      = 30;       // 창 내 허용 최대 제출 수 (정상 트래픽 대비 넉넉하게)
var DUP_CHECK_WINDOW_MS = 60 * 1000; // 동일 연락처 중복 접수 방지 창 — 프론트 DUP_GAP_MS와 동일하게 맞춤
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

/* 프론트에서 오지 않은 직접 POST 요청 등, 봇으로 의심되는 요청은 저장을 건너뛰되
   응답은 정상 요청과 동일한 success로 반환해 탐지 로직을 노출하지 않는다 */
function isLikelyBot(d) {
  if (d['_hp']) return true; // 허니팟 필드가 채워짐
  var ts = Number(d['_ts']);
  if (ts && (Date.now() - ts) < MIN_SUBMIT_MS) return true; // 너무 빠른 제출
  return false;
}

/* 짧은 시간에 과도하게 몰리는 제출(스팸 폭주) 방지 — 정상 사용자 트래픽엔 영향 없는 넉넉한 한도 */
function isRateLimited() {
  try {
    var cache = CacheService.getScriptCache();
    var bucket = 'submit_' + Math.floor(Date.now() / (RATE_LIMIT_WINDOW_S * 1000));
    var count = Number(cache.get(bucket) || '0') + 1;
    cache.put(bucket, String(count), RATE_LIMIT_WINDOW_S + 10);
    return count > RATE_LIMIT_MAX;
  } catch (err) {
    return false; // 캐시 오류로 정상 신청이 막히지 않도록 실패 시 통과
  }
}

/* 동일 연락처의 짧은 시간 내 중복 접수 방지 — 프론트의 60초 중복 차단을 서버에서도 보강 */
function isDuplicateSubmission(d) {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) return false;

    var phone = String(d['연락처'] || '').trim();
    var email = String(d['이메일'] || '').trim();
    if (!phone && !email) return false;

    var numRows = Math.min(sheet.getLastRow() - 1, 10); // 최신 접수는 항상 2행부터라 위쪽 몇 줄만 확인
    var rows = sheet.getRange(2, 1, numRows, 4).getValues(); // 신청일시, 이름, 연락처, 이메일
    var now = Date.now();

    for (var i = 0; i < rows.length; i++) {
      var rowTs = new Date(rows[i][0]).getTime();
      if (!rowTs || (now - rowTs) > DUP_CHECK_WINDOW_MS) continue;
      var rowPhone = String(rows[i][2] || '').trim();
      var rowEmail = String(rows[i][3] || '').trim();
      if ((phone && rowPhone === phone) || (email && rowEmail === email)) return true;
    }
  } catch (err) {
    Logger.log('중복 접수 확인 오류: ' + err.message);
  }
  return false;
}

/* ─── POST 핸들러 ────────────────────────────────────────── */
function doPost(e) {
  var result = { result: 'error', message: '알 수 없는 오류' };

  try {
    // 요청 본문 파싱 (text/plain으로 전송된 JSON)
    var raw = e.postData ? e.postData.contents : '';
    if (!raw) throw new Error('빈 요청');
    var d = JSON.parse(raw);

    // 필수값 확인
    if (!d['이름'] || !d['연락처'] || !d['이메일']) {
      throw new Error('필수 항목 누락');
    }

    // 형식 검증 (완화된 패턴 — 정상적인 신청은 막지 않음)
    if (!EMAIL_RE.test(String(d['이메일']).trim())) {
      throw new Error('이메일 형식 오류');
    }
    if (!PHONE_RE.test(String(d['연락처']).trim())) {
      throw new Error('연락처 형식 오류');
    }

    // 봇 의심 요청 / 과도한 요청 폭주 / 동일 연락처 단시간 중복 접수는
    // 조용히 건너뛰고 정상 응답만 반환 (탐지 로직 노출 방지, 정상 사용자는 영향 없음)
    if (isLikelyBot(d) || isRateLimited() || isDuplicateSubmission(d)) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Sheets 저장
    saveToSheet(d);

    // 이메일 발송
    sendEmail(d);

    result = { result: 'success' };

  } catch (err) {
    Logger.log('doPost 오류: ' + err.message);
    result = { result: 'error', message: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ─── Google Sheets 저장 ─────────────────────────────────── */
function saveToSheet(d) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // 새 시트: HEADERS로 초기화
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    var hRange = sheet.getRange(1, 1, 1, HEADERS.length);
    hRange.setBackground('#1a56db').setFontColor('#ffffff')
          .setFontWeight('bold').setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
  }

  // 실제 시트 헤더를 읽어서 '업체명·상호명' 컬럼 자동 처리
  var numCols = sheet.getLastColumn();
  var sheetHeaders = sheet.getRange(1, 1, 1, numCols).getValues()[0]
                          .map(function(h) { return String(h || '').trim(); });

  var companyKey = '업체명·상호명';
  if (sheetHeaders.indexOf(companyKey) === -1) {
    var oldIdx = sheetHeaders.indexOf('업체명');
    if (oldIdx !== -1) {
      // 기존 '업체명' 헤더명만 교체 (데이터 위치 그대로 유지)
      sheet.getRange(1, oldIdx + 1).setValue(companyKey);
      sheetHeaders[oldIdx] = companyKey;
    } else {
      // '사업자구분' 다음에 새 컬럼 삽입 (기존 데이터는 오른쪽으로 밀림)
      var bizIdx = sheetHeaders.indexOf('사업자구분');
      var insertAt = bizIdx !== -1 ? bizIdx + 2 : numCols + 1;
      sheet.insertColumnBefore(insertAt);
      sheet.getRange(1, insertAt).setValue(companyKey);
      // 헤더 목록 갱신
      numCols = sheet.getLastColumn();
      sheetHeaders = sheet.getRange(1, 1, 1, numCols).getValues()[0]
                          .map(function(h) { return String(h || '').trim(); });
    }
  }

  // 실제 헤더 순서에 맞춰 데이터 행 구성
  var newAppId = 'APP' + Date.now() + Math.floor(Math.random() * 9000 + 1000);
  var adminDefaults = {
    '신청ID': newAppId,
    '처리상태': '신규 접수', '담당자': '', '연락일': '',
    '관리자 메모': '', '최종결과': ''
  };
  var rowData = sheetHeaders.map(function(key) {
    if (!key) return '';
    if (adminDefaults.hasOwnProperty(key)) return adminDefaults[key];
    if (key === '긴급출동가능여부') return sanitizeSheet(String(d[key] || '미정'));
    return sanitizeSheet(String(d[key] || ''));
  });

  sheet.insertRowBefore(2);
  sheet.getRange(2, 1, 1, rowData.length).setValues([rowData]);
  SpreadsheetApp.flush();
}

/* ─── Formula Injection 방어 ─────────────────────────────── */
// =, +, -, @, |, \ 로 시작하는 값 앞에 작은따옴표를 붙여 수식 실행 차단
function sanitizeSheet(value) {
  if (typeof value !== 'string') value = String(value);
  value = value.trim();
  if (/^[=+\-@|\\]/.test(value)) {
    value = "'" + value;
  }
  return value;
}

/* ─── HTML 이스케이프 (이메일 본문용) ───────────────────── */
function escapeHtml(str) {
  if (typeof str !== 'string') str = String(str || '');
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;')
    .replace(/\n/g, '<br>');
}

/* ─── 이메일 발송 ────────────────────────────────────────── */
function sendEmail(d) {
  var name   = d['이름']     || '(이름 없음)';
  var region = d['활동지역'] || '(지역 없음)';

  // 제목 형식: [만능맨 파트너스 사전등록 신청] 이름 / 활동지역
  var subject = '[만능맨 파트너스 사전등록 신청] ' + name + ' / ' + region;

  // 본문에 표시할 항목
  var fields = [
    ['신청일시', d['신청일시']],
    ['이름',     d['이름']],
    ['연락처',   d['연락처']],
    ['이메일',   d['이메일']],
    ['활동지역', d['활동지역']],
    ['사업자구분', d['사업자구분']],
    ['업체명·상호명', d['업체명·상호명']],
    ['서비스분야', d['서비스분야']],
    ['긴급출동가능여부', d['긴급출동가능여부']],
    ['보유자격증', d['보유자격증']],
    ['경력연수', d['경력연수']],
    ['자기소개', d['자기소개']],
    ['추가문의', d['추가문의']],
    ['유입경로', d['유입경로']]
  ];

  var rows = fields.map(function (f) {
    return '<tr>'
      + '<td style="padding:9px 14px;background:#f0f4ff;font-weight:bold;white-space:nowrap;'
      +      'border:1px solid #dce3f3;width:110px;vertical-align:top">'
      + escapeHtml(f[0])
      + '</td>'
      + '<td style="padding:9px 14px;border:1px solid #dce3f3;word-break:break-all">'
      + escapeHtml(f[1] || '')
      + '</td>'
      + '</tr>';
  }).join('');

  var htmlBody =
    '<div style="font-family:\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif;'
    + 'max-width:680px;margin:0 auto;color:#1a1a2e">'
    + '<div style="background:#1a56db;color:#fff;padding:18px 24px;border-radius:8px 8px 0 0">'
    + '<h2 style="margin:0;font-size:17px">만능맨 파트너스 — 사전등록 신청서 접수</h2>'
    + '</div>'
    + '<table style="width:100%;border-collapse:collapse;border:1px solid #dce3f3;border-top:none">'
    + rows
    + '</table>'
    + '<p style="margin-top:16px;color:#888;font-size:12px;line-height:1.7">'
    + '※ 이 메일은 만능맨 파트너스 랜딩페이지에서 자동 발송되었습니다.<br>'
    + '※ 신청 데이터는 Google Sheets에도 자동 저장됩니다.'
    + '</p>'
    + '</div>';

  var plainText =
    '[만능맨 파트너스 사전등록 신청]\n\n'
    + fields.map(function (f) {
        return (f[0] + ': ' + (f[1] || ''));
      }).join('\n');

  RECIPIENTS.forEach(function (addr) {
    try {
      // 주소가 비어 있거나 @가 없으면 건너뜀
      if (!addr || addr.indexOf('@') === -1) return;
      GmailApp.sendEmail(addr, subject, plainText, { htmlBody: htmlBody });
    } catch (err) {
      Logger.log('메일 발송 실패 (' + addr + '): ' + err.message);
    }
  });
}

/* ─── 최초 시트 설정 (수동 실행용) ─────────────────────── */
// Apps Script 편집기에서 이 함수를 선택 후 [실행] 버튼을 눌러
// 시트 헤더를 미리 만들어 두세요 (선택 사항 — doPost가 자동 생성).
function setupSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    var hRange = sheet.getRange(1, 1, 1, HEADERS.length);
    hRange.setBackground('#1a56db');
    hRange.setFontColor('#ffffff');
    hRange.setFontWeight('bold');
    hRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
    SpreadsheetApp.flush();
    Logger.log('시트 설정 완료: ' + SHEET_NAME);
  } else {
    Logger.log('이미 데이터가 있어 헤더를 추가하지 않았습니다.');
  }
}

/* ─── 관리용 시트 서식 세팅 (수동 1회 실행) ─────────────── */
// Apps Script 편집기에서 이 함수를 선택 후 [실행]을 눌러 사용하세요.
// 기존 데이터와 doPost는 영향받지 않습니다.
//
// 실제 시트 컬럼 구조 (A~Q, 총 17열):
//   A 신청일시  B 이름  C 연락처  D 이메일  E 활동지역  F 사업자구분
//   G 서비스분야  H 보유자격증  I 경력연수  J 자기소개  K 추가문의
//   L 유입경로  M 처리상태  N 담당자  O 연락일  P 관리자 메모  Q 최종결과
function setupManagementSheet() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) { Logger.log('시트를 찾을 수 없습니다: ' + SHEET_NAME); return; }

  var totalCols   = 17;   // A~Q
  var maxDataRows = 1000; // 드롭다운·조건부서식 적용 행 범위

  // 1. 1행 고정
  sheet.setFrozenRows(1);

  // 2. 필터 적용 (기존 필터 있으면 제거 후 재설정)
  var existingFilter = sheet.getFilter();
  if (existingFilter) existingFilter.remove();
  sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 2), totalCols).createFilter();

  // 3. 헤더 스타일
  //    신청 데이터 컬럼 A~L (1~12) → 진한 파랑
  //    관리자 편집 컬럼 M~Q (13~17) → 주황 (처리상태·담당자·연락일·관리자 메모·최종결과)
  sheet.getRange(1, 1, 1, 12)
    .setBackground('#1565C0').setFontColor('#FFFFFF')
    .setFontWeight('bold').setHorizontalAlignment('center');
  sheet.getRange(1, 13, 1, 5)
    .setBackground('#E65100').setFontColor('#FFFFFF')
    .setFontWeight('bold').setHorizontalAlignment('center');

  // 4. 열 너비 (A~Q, 17열)
  //     A    B    C    D    E    F    G    H    I    J    K    L    M    N    O    P    Q
  var widths = [160, 90, 130, 190, 100, 110, 130, 140, 80, 250, 250, 110, 120, 90, 110, 250, 110];
  widths.forEach(function(w, i) { sheet.setColumnWidth(i + 1, w); });

  // 5. 긴 텍스트 컬럼 줄바꿈
  //    J 자기소개=10, K 추가문의=11, P 관리자 메모=16
  [10, 11, 16].forEach(function(col) {
    sheet.getRange(2, col, maxDataRows, 1)
      .setWrap(true)
      .setVerticalAlignment('top');
  });

  // 6. 처리상태 드롭다운 (M열 = 13번째)
  var statusList = [
    '신규 접수', '연락 예정', '1차 연락 완료', '재연락 필요',
    '입점 검토', '입점 가능', '입점 완료', '보류', '거절'
  ];
  var dropRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(statusList, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 13, maxDataRows, 1).setDataValidation(dropRule);

  // 7. 처리상태별 행 전체 색상 (조건부 서식)
  //    공식 =$M2="값" → M열(13번째, 처리상태) 기준으로 전체 행 색상 변경
  var colorMap = [
    { status: '신규 접수',     bg: '#BBDEFB', font: '#0D47A1' },
    { status: '연락 예정',     bg: '#FFF9C4', font: '#E65100' },
    { status: '1차 연락 완료', bg: '#DCEDC8', font: '#1B5E20' },
    { status: '재연락 필요',   bg: '#FFE0B2', font: '#BF360C' },
    { status: '입점 검토',     bg: '#E8EAF6', font: '#283593' },
    { status: '입점 가능',     bg: '#C8E6C9', font: '#1B5E20' },
    { status: '입점 완료',     bg: '#A5D6A7', font: '#1B5E20' },
    { status: '보류',          bg: '#F5F5F5', font: '#757575' },
    { status: '거절',          bg: '#FFCDD2', font: '#B71C1C' }
  ];

  sheet.clearConditionalFormatRules();
  var cfRules = colorMap.map(function(c) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$M2="' + c.status + '"')
      .setBackground(c.bg)
      .setFontColor(c.font)
      .setRanges([sheet.getRange(2, 1, maxDataRows, totalCols)])
      .build();
  });
  sheet.setConditionalFormatRules(cfRules);

  SpreadsheetApp.flush();
  Logger.log('✅ 관리용 시트 세팅 완료');
  SpreadsheetApp.getUi().alert(
    '✅ 관리용 시트 세팅 완료!\n\n' +
    '• 1행 고정\n' +
    '• 필터 적용\n' +
    '• 처리상태 드롭다운 적용 (M열, 1000행)\n' +
    '• 처리상태별 행 색상 조건부 서식 적용\n' +
    '• 열 너비 및 줄바꿈 설정 완료\n\n' +
    '주황색 헤더(M~Q) = 관리자가 직접 입력하는 컬럼입니다.'
  );
}

/* ─── 점검모드 설정 ──────────────────────────────────────── */
// 저장 키: maintenanceMode / maintenanceOwnerToken / maintenanceStartAt /
//          maintenanceEndAt / maintenanceDurationMinutes / maintenanceNoTimer

function getMaintenanceProps_() {
  var props   = PropertiesService.getScriptProperties();
  var noTimer = props.getProperty('maintenanceNoTimer') === 'true';
  return {
    active:   props.getProperty('maintenanceMode') === 'true',
    token:    props.getProperty('maintenanceOwnerToken') || '',
    noTimer:  noTimer,
    endAt:    parseInt(props.getProperty('maintenanceEndAt') || '0', 10),
    duration: parseInt(props.getProperty('maintenanceDurationMinutes') || '0', 10)
  };
}

// 점검모드 ON이고 ownerToken 불일치 시 에러 throw
function checkMaintenanceBlock_(ownerToken) {
  var m = getMaintenanceProps_();
  if (!m.active) return;
  // 타이머 모드일 때만 만료 자동 해제
  if (!m.noTimer && m.endAt > 0 && Date.now() > m.endAt) {
    PropertiesService.getScriptProperties().setProperty('maintenanceMode', 'false');
    return;
  }
  if (!ownerToken || ownerToken !== m.token) {
    throw new Error('MAINTENANCE');
  }
}

// 점검모드 상태 조회 (인증 불필요)
function getMaintenanceStatus(ownerToken) {
  var m = getMaintenanceProps_();
  // 타이머 모드이고 만료됐으면 자동 해제
  if (m.active && !m.noTimer && m.endAt > 0 && Date.now() > m.endAt) {
    PropertiesService.getScriptProperties().setProperty('maintenanceMode', 'false');
    return { active: false, isOwner: false, remainingMs: 0, noTimer: false };
  }
  var remainingMs = 0;
  if (m.active && !m.noTimer && m.endAt > 0) {
    remainingMs = Math.max(0, m.endAt - Date.now());
  }
  return {
    active:      m.active,
    isOwner:     m.active && !!ownerToken && ownerToken === m.token,
    remainingMs: remainingMs,
    noTimer:     m.noTimer,
    endAt:       (m.active && !m.noTimer) ? m.endAt : 0
  };
}

// 점검모드 ON/OFF (관리자 인증 필요)
// durationMinutes: 30 / 60 / 120 / 180 / 0(수동=noTimer)
function setMaintenanceMode(enabled, ownerToken, durationMinutes, pw) {
  if (!checkAdminAuth_(pw)) throw new Error('AUTH_FAIL');
  var props = PropertiesService.getScriptProperties();
  if (enabled) {
    var noTimer = (durationMinutes <= 0);
    var startAt = Date.now();
    var endAt   = noTimer ? 0 : startAt + durationMinutes * 60000;
    props.setProperties({
      'maintenanceMode':            'true',
      'maintenanceOwnerToken':      ownerToken,
      'maintenanceStartAt':         String(startAt),
      'maintenanceEndAt':           String(endAt),
      'maintenanceDurationMinutes': String(durationMinutes),
      'maintenanceNoTimer':         noTimer ? 'true' : 'false'
    });
    return { success: true, endAt: endAt, noTimer: noTimer };
  } else {
    props.setProperties({
      'maintenanceMode':    'false',
      'maintenanceNoTimer': 'false',
      'maintenanceEndAt':   '0'
    });
    return { success: true };
  }
}

/* ─── 관리자 인증 ────────────────────────────────────────── */
// ⚠️ 보안 조치: 기존 하드코딩 비밀번호(@samyang01!)가 이 저장소가 GitHub에 Public으로
//    올라가며 그대로 노출되었습니다. 아래 임시값으로 교체했으니, 지금 바로
//    Apps Script 편집기 > 프로젝트 설정 > 스크립트 속성 에서 ADMIN_PASSWORD 키를
//    새로 만들어 원하는 비밀번호로 반드시 교체하세요. 스크립트 속성이 설정되면
//    아래 임시값은 더 이상 쓰이지 않습니다.
var ADMIN_DEFAULT_PW = 'I4cvHcyK35N2sR7UDtx'; // TODO: 스크립트 속성 설정 후 이 줄은 의미 없어짐

function checkAdminAuth_(pw) {
  var stored = PropertiesService.getScriptProperties()
                 .getProperty('ADMIN_PASSWORD') || ADMIN_DEFAULT_PW;
  return pw === stored;
}

function verifyAdminPassword(pw) {
  return checkAdminAuth_(pw);
}

/* ─── 관리자: 전체 데이터 조회 ──────────────────────────── */
function getAdminData(pw, ownerToken) {
  if (!checkAdminAuth_(pw)) throw new Error('AUTH_FAIL');
  checkMaintenanceBlock_(ownerToken);

  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];

  var numCols     = sheet.getLastColumn();
  var sheetHeaders = sheet.getRange(1, 1, 1, numCols).getValues()[0]
                          .map(function(h) { return String(h || '').trim(); });

  // 필수 컬럼이 없으면 최초 1회 생성 및 기존 데이터 마이그레이션
  if (sheetHeaders.indexOf('신청ID') === -1 || sheetHeaders.indexOf('등록구분') === -1
      || sheetHeaders.indexOf('긴급출동가능여부') === -1) {
    ensureColumns_();
    numCols     = sheet.getLastColumn();
    sheetHeaders = sheet.getRange(1, 1, 1, numCols).getValues()[0]
                        .map(function(h) { return String(h || '').trim(); });
  }

  // 신청ID가 비어있는 행에 자동 부여 (기존 누락 행 보완)
  var idColFix = sheetHeaders.indexOf('신청ID');
  if (idColFix !== -1) {
    var fixLastRow = sheet.getLastRow();
    if (fixLastRow >= 2) {
      var fixRows  = fixLastRow - 1;
      var idCheck  = sheet.getRange(2, idColFix + 1, fixRows, 1).getValues();
      var needsFix = false;
      idCheck.forEach(function(row, i) {
        if (!row[0]) {
          row[0] = 'APP' + (Date.now() + i) + Math.floor(Math.random() * 9000 + 1000);
          needsFix = true;
        }
      });
      if (needsFix) {
        sheet.getRange(2, idColFix + 1, fixRows, 1).setValues(idCheck);
        SpreadsheetApp.flush();
      }
    }
  }

  var numRows = sheet.getLastRow() - 1;
  var data    = sheet.getRange(2, 1, numRows, numCols).getValues();

  return data.map(function (row, i) {
    var obj = { _row: i + 2 };
    for (var j = 0; j < sheetHeaders.length; j++) {
      var key = String(sheetHeaders[j] || '').trim();
      if (!key) continue;
      var val = row[j];
      if (val instanceof Date) {
        obj[key] = Utilities.formatDate(val, 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
      } else {
        obj[key] = (val === null || val === undefined) ? '' : String(val);
      }
    }
    return obj;
  });
}

/* ─── 관리자: 처리상태·메모 업데이트 ───────────────────── */
function updateRowStatus(rowNum, newStatus, memo, pw, ownerToken) {
  if (!checkAdminAuth_(pw)) throw new Error('AUTH_FAIL');
  checkMaintenanceBlock_(ownerToken);

  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('시트 없음');

  // 실제 시트 헤더를 읽어서 컬럼 위치를 동적으로 찾음
  var numCols = sheet.getLastColumn();
  var sheetHeaders = sheet.getRange(1, 1, 1, numCols).getValues()[0];
  var statusCol = 0, memoCol = 0;
  for (var j = 0; j < sheetHeaders.length; j++) {
    var h = String(sheetHeaders[j] || '').trim();
    if (h === '처리상태') statusCol = j + 1;
    if (h === '관리자 메모') memoCol = j + 1;
  }

  // 이름·ID 취득 (로그용)
  var nameColIdx = sheetHeaders.indexOf('이름');
  var idColIdx   = sheetHeaders.indexOf('신청ID');
  var rName  = nameColIdx >= 0 ? String(sheet.getRange(rowNum, nameColIdx + 1).getValue() || '') : '';
  var rAppId = idColIdx   >= 0 ? String(sheet.getRange(rowNum, idColIdx + 1).getValue()   || '') : '';

  if (newStatus !== null && newStatus !== undefined && newStatus !== '' && statusCol > 0) {
    var prevStatus = String(sheet.getRange(rowNum, statusCol).getValue() || '');
    sheet.getRange(rowNum, statusCol).setValue(newStatus);
    if (prevStatus !== newStatus) {
      appendLog_(ss, { appId: rAppId, name: rName, field: '처리상태', before: prevStatus, after: newStatus });
    }
  }
  if (memo !== null && memo !== undefined && memoCol > 0) {
    var prevMemo = String(sheet.getRange(rowNum, memoCol).getValue() || '');
    sheet.getRange(rowNum, memoCol).setValue(memo);
    if (prevMemo !== String(memo)) {
      appendLog_(ss, { appId: rAppId, name: rName, field: '관리자 메모', before: prevMemo, after: memo });
    }
  }
  SpreadsheetApp.flush();
  return true;
}

/* ─── 삭제된 신청서 시트 자동 생성 ──────────────────────── */
function ensureTrashSheet_(ss) {
  var sheet = ss.getSheetByName(TRASH_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TRASH_SHEET_NAME);
    var srcSheet = ss.getSheetByName(SHEET_NAME);
    var trashHeaders;
    if (srcSheet && srcSheet.getLastColumn() > 0) {
      var srcH = srcSheet.getRange(1, 1, 1, srcSheet.getLastColumn()).getValues()[0]
                         .map(function(h) { return String(h || '').trim(); })
                         .filter(function(h) { return h; });
      trashHeaders = srcH.concat(['삭제일시', '삭제구분']);
    } else {
      trashHeaders = HEADERS.concat(['삭제일시', '삭제구분']);
    }
    sheet.appendRow(trashHeaders);
    sheet.getRange(1, 1, 1, trashHeaders.length)
         .setBackground('#c62828').setFontColor('#ffffff')
         .setFontWeight('bold').setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    SpreadsheetApp.flush();
  }
  return sheet;
}

/* ─── 신청 추가 (관리자 직접 추가) ──────────────────────── */
function addApplication(data, pw, ownerToken) {
  if (!checkAdminAuth_(pw)) throw new Error('AUTH_FAIL');
  checkMaintenanceBlock_(ownerToken);
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('시트 없음');

  var numCols      = sheet.getLastColumn();
  var sheetHeaders = sheet.getRange(1, 1, 1, numCols).getValues()[0]
                          .map(function(h) { return String(h || '').trim(); });

  // 신청ID · 등록구분 컬럼 확보
  if (sheetHeaders.indexOf('신청ID') === -1 || sheetHeaders.indexOf('등록구분') === -1) {
    ensureColumns_();
    numCols      = sheet.getLastColumn();
    sheetHeaders = sheet.getRange(1, 1, 1, numCols).getValues()[0]
                        .map(function(h) { return String(h || '').trim(); });
  }

  var newId = 'APP' + Date.now() + Math.floor(Math.random() * 9000 + 1000);

  var rowData = sheetHeaders.map(function(key) {
    if (!key) return '';
    if (key === '신청ID')   return newId;
    if (key === '등록구분') return '관리자 추가';
    var val = data[key];
    if (val === undefined || val === null) {
      if (key === '긴급출동가능여부') return '미정';
      return '';
    }
    return sanitizeSheet(String(val));
  });

  sheet.insertRowBefore(2);
  sheet.getRange(2, 1, 1, rowData.length).setValues([rowData]);
  appendLog_(ss, { appId: newId, name: data['이름'] || '', field: '신청 추가', before: '', after: data['이름'] + ' (' + (data['연락처'] || '') + ')' });
  SpreadsheetApp.flush();
  return true;
}

/* ─── 컬럼 자동 보완 (신청ID·등록구분·수정일시·수정구분) ── */
function ensureColumns_() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return;

  var numCols = sheet.getLastColumn();
  if (numCols < 1) return;

  var headers = sheet.getRange(1, 1, 1, numCols).getValues()[0]
                     .map(function(h) { return String(h || '').trim(); });

  // 긴급출동가능여부 컬럼이 없으면 처리상태 다음에 추가
  if (headers.indexOf('긴급출동가능여부') === -1) {
    var statusIdx = headers.indexOf('처리상태');
    var insertAt  = statusIdx !== -1 ? statusIdx + 2 : numCols + 1;
    sheet.insertColumnBefore(insertAt);
    sheet.getRange(1, insertAt).setValue('긴급출동가능여부')
         .setBackground('#E65100').setFontColor('#FFFFFF')
         .setFontWeight('bold').setHorizontalAlignment('center');
    // 기존 데이터 행에 기본값 '미정' 채우기
    if (lastRow >= 2) {
      var fillData = [];
      for (var fi = 0; fi < lastRow - 1; fi++) { fillData.push(['미정']); }
      sheet.getRange(2, insertAt, lastRow - 1, 1).setValues(fillData);
    }
    numCols = sheet.getLastColumn();
    headers = sheet.getRange(1, 1, 1, numCols).getValues()[0]
                   .map(function(h) { return String(h || '').trim(); });
    SpreadsheetApp.flush();
  }

  // 필요 컬럼이 없으면 오른쪽에 추가
  ['신청ID', '등록구분', '수정일시', '수정구분'].forEach(function(col) {
    if (headers.indexOf(col) === -1) {
      numCols++;
      sheet.getRange(1, numCols)
           .setValue(col)
           .setBackground('#455A64')
           .setFontColor('#FFFFFF')
           .setFontWeight('bold')
           .setHorizontalAlignment('center');
      headers.push(col);
    }
  });

  if (lastRow < 2) { SpreadsheetApp.flush(); return; }

  var idColNum     = headers.indexOf('신청ID')  + 1;
  var regColNum    = headers.indexOf('등록구분') + 1;
  var sourceColNum = headers.indexOf('유입경로') + 1;
  var dataRows     = lastRow - 1;

  // 신청ID가 없는 행에 자동 부여
  if (idColNum > 0) {
    var idVals = sheet.getRange(2, idColNum, dataRows, 1).getValues();
    var idChanged = false;
    idVals.forEach(function(row, i) {
      if (!row[0]) {
        row[0] = 'APP' + (Date.now() + i) + Math.floor(Math.random() * 9000 + 1000);
        idChanged = true;
      }
    });
    if (idChanged) sheet.getRange(2, idColNum, dataRows, 1).setValues(idVals);
  }

  // 등록구분이 없는 행: 유입경로 "관리자 직접 추가"이면 "관리자 추가"로 채움
  if (regColNum > 0 && sourceColNum > 0) {
    var regVals    = sheet.getRange(2, regColNum, dataRows, 1).getValues();
    var sourceVals = sheet.getRange(2, sourceColNum, dataRows, 1).getValues();
    var regChanged = false;
    regVals.forEach(function(row, i) {
      if (!row[0]) {
        var src = String(sourceVals[i][0] || '').trim();
        if (src === '관리자 직접 추가') {
          row[0] = '관리자 추가';
          regChanged = true;
        }
      }
    });
    if (regChanged) sheet.getRange(2, regColNum, dataRows, 1).setValues(regVals);
  }

  SpreadsheetApp.flush();
}

/* ─── 신청 수정 (관리자 추가건만 허용) ──────────────────── */
function updateApplication(applicationId, data, pw, ownerToken) {
  if (!checkAdminAuth_(pw)) throw new Error('AUTH_FAIL');
  if (!applicationId) throw new Error('신청ID가 없습니다.');
  checkMaintenanceBlock_(ownerToken);

  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('시트 없음');

  var numCols = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, numCols).getValues()[0]
                     .map(function(h) { return String(h || '').trim(); });

  var idColIdx = headers.indexOf('신청ID');
  if (idColIdx === -1) throw new Error('신청ID 컬럼 없음. 데이터를 새로고침 후 다시 시도하세요.');

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('데이터 없음');

  // 신청ID로 대상 행 탐색
  var idVals = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues();
  var targetRow = -1;
  for (var i = 0; i < idVals.length; i++) {
    if (String(idVals[i][0]).trim() === String(applicationId).trim()) {
      targetRow = i + 2;
      break;
    }
  }
  if (targetRow === -1) throw new Error('신청ID를 찾을 수 없습니다: ' + applicationId);

  // 기존 행 값 읽기
  var rowValues = sheet.getRange(targetRow, 1, 1, numCols).getValues()[0];

  // 관리자 추가건인지 서버 측 검증
  var regTypeIdx = headers.indexOf('등록구분');
  var sourceIdx  = headers.indexOf('유입경로');
  var regType = regTypeIdx >= 0 ? String(rowValues[regTypeIdx] || '').trim() : '';
  var source  = sourceIdx  >= 0 ? String(rowValues[sourceIdx]  || '').trim() : '';
  if (regType !== '관리자 추가' && source !== '관리자 직접 추가') {
    throw new Error('EDIT_FORBIDDEN: 랜딩페이지 신청건은 수정할 수 없습니다.');
  }

  // 수정 허용 필드
  var updatable = [
    '신청일시', '이름', '연락처', '이메일', '활동지역',
    '사업자구분', '업체명·상호명', '서비스분야', '보유자격증', '경력연수',
    '자기소개', '추가문의', '유입경로', '처리상태', '긴급출동가능여부', '담당자', '관리자 메모'
  ];

  var now    = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  var newRow = rowValues.slice();

  headers.forEach(function(h, i) {
    if (!h) return;
    if (h === '수정일시') { newRow[i] = now; return; }
    if (h === '수정구분') { newRow[i] = '관리자 수정'; return; }
    if (updatable.indexOf(h) !== -1 && data.hasOwnProperty(h)) {
      newRow[i] = sanitizeSheet(String(data[h] != null ? data[h] : ''));
    }
  });

  sheet.getRange(targetRow, 1, 1, numCols).setValues([newRow]);

  // 변경된 필드 로그
  var nameIdx3 = headers.indexOf('이름');
  var rName3 = data['이름'] || (nameIdx3 >= 0 ? String(rowValues[nameIdx3] || '') : '');
  headers.forEach(function(h, i) {
    if (!h || updatable.indexOf(h) === -1) return;
    if (!data.hasOwnProperty(h)) return;
    var prev = String(rowValues[i] || '');
    var next = sanitizeSheet(String(data[h] != null ? data[h] : ''));
    if (prev !== next) {
      appendLog_(ss, { appId: applicationId, name: data['이름'] || '', field: '신청서 수정 - ' + h, before: prev, after: next });
    }
  });

  SpreadsheetApp.flush();
  return true;
}

/* ─── 선택 신청 → 삭제된 신청서 시트로 이동 ──────────────── */
function moveApplicationsToTrash(rowNums, pw, ownerToken) {
  if (!checkAdminAuth_(pw)) throw new Error('AUTH_FAIL');
  if (!rowNums || rowNums.length === 0) return true;
  checkMaintenanceBlock_(ownerToken);

  var ss         = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet      = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('시트 없음');
  var trashSheet = ensureTrashSheet_(ss);

  var numCols    = sheet.getLastColumn();
  var srcHeaders = sheet.getRange(1, 1, 1, numCols).getValues()[0]
                        .map(function(h) { return String(h || '').trim(); });

  var trashNumCols = trashSheet.getLastColumn();
  var trashHeaders = trashSheet.getRange(1, 1, 1, trashNumCols).getValues()[0]
                               .map(function(h) { return String(h || '').trim(); });

  var now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');

  // 큰 행 번호부터 처리해야 삭제 후 행 번호 밀림 방지
  var sorted = rowNums.slice().sort(function(a, b) { return b - a; });

  sorted.forEach(function(rowNum) {
    var rowValues = sheet.getRange(rowNum, 1, 1, numCols).getValues()[0];

    var dataObj = {};
    srcHeaders.forEach(function(key, i) {
      if (!key) return;
      var v = rowValues[i];
      dataObj[key] = (v instanceof Date)
        ? Utilities.formatDate(v, 'Asia/Seoul', 'yyyy-MM-dd HH:mm')
        : (v === null || v === undefined ? '' : String(v));
    });

    var trashRow = trashHeaders.map(function(key) {
      if (key === '삭제일시')  return now;
      if (key === '삭제구분') return '관리자 삭제';
      return dataObj.hasOwnProperty(key) ? dataObj[key] : '';
    });

    trashSheet.appendRow(trashRow);
    appendLog_(ss, { appId: dataObj['신청ID'] || '', name: dataObj['이름'] || '', field: '신청 삭제', before: dataObj['처리상태'] || '', after: '삭제됨' });
    sheet.deleteRow(rowNum);
  });

  SpreadsheetApp.flush();
  return true;
}

/* ─── 삭제된 신청서 목록 조회 ────────────────────────────── */
function getDeletedApplications(pw, ownerToken) {
  if (!checkAdminAuth_(pw)) throw new Error('AUTH_FAIL');
  checkMaintenanceBlock_(ownerToken);

  var ss         = SpreadsheetApp.openById(SPREADSHEET_ID);
  var trashSheet = ss.getSheetByName(TRASH_SHEET_NAME);
  if (!trashSheet || trashSheet.getLastRow() < 2) return [];

  var numRows = trashSheet.getLastRow() - 1;
  var numCols = trashSheet.getLastColumn();
  var headers = trashSheet.getRange(1, 1, 1, numCols).getValues()[0];
  var data    = trashSheet.getRange(2, 1, numRows, numCols).getValues();

  return data.map(function(row, i) {
    var obj = { _trashRow: i + 2 };
    for (var j = 0; j < headers.length; j++) {
      var key = String(headers[j] || '').trim();
      if (!key) continue;
      var val = row[j];
      obj[key] = (val instanceof Date)
        ? Utilities.formatDate(val, 'Asia/Seoul', 'yyyy-MM-dd HH:mm')
        : (val === null || val === undefined ? '' : String(val));
    }
    return obj;
  });
}

/* ─── 긴급출동가능여부 업데이트 ──────────────────────────── */
function updateEmergencyAvailability(applicationId, value, pw, ownerToken) {
  if (!checkAdminAuth_(pw)) throw new Error('AUTH_FAIL');
  checkMaintenanceBlock_(ownerToken);

  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('시트 없음');

  var numCols = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, numCols).getValues()[0]
                     .map(function(h) { return String(h || '').trim(); });

  // 긴급출동가능여부 컬럼 확보
  if (headers.indexOf('긴급출동가능여부') === -1) {
    ensureColumns_();
    numCols = sheet.getLastColumn();
    headers = sheet.getRange(1, 1, 1, numCols).getValues()[0]
                   .map(function(h) { return String(h || '').trim(); });
  }

  var emergencyCol = headers.indexOf('긴급출동가능여부') + 1;
  if (emergencyCol === 0) throw new Error('긴급출동가능여부 컬럼 없음');

  // applicationId로 행 탐색
  var idColIdx = headers.indexOf('신청ID');
  if (idColIdx === -1) throw new Error('신청ID 컬럼 없음');

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('데이터 없음');

  var idVals = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues();
  var targetRow = -1;
  for (var i = 0; i < idVals.length; i++) {
    if (String(idVals[i][0]).trim() === String(applicationId).trim()) {
      targetRow = i + 2;
      break;
    }
  }
  if (targetRow === -1) throw new Error('신청ID를 찾을 수 없습니다: ' + applicationId);

  var prevEmerg = String(sheet.getRange(targetRow, emergencyCol).getValue() || '');
  sheet.getRange(targetRow, emergencyCol).setValue(value);
  if (prevEmerg !== value) {
    var nameColIdx2 = headers.indexOf('이름');
    var rName2 = nameColIdx2 >= 0 ? String(sheet.getRange(targetRow, nameColIdx2 + 1).getValue() || '') : '';
    appendLog_(ss, { appId: applicationId, name: rName2, field: '긴급출동가능여부', before: prevEmerg, after: value });
  }
  SpreadsheetApp.flush();
  return true;
}

/* ─── 활동 로그 시트 자동 생성 ─────────────────────────── */
function ensureLogSheet_(ss) {
  var sheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(LOG_SHEET_NAME);
    var headers = ['로그일시', '관리자', '신청ID', '이름', '변경항목', '변경전', '변경후'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setBackground('#455A64').setFontColor('#FFFFFF')
         .setFontWeight('bold').setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, 7, 140);
    sheet.setColumnWidth(6, 200);
    sheet.setColumnWidth(7, 200);
    SpreadsheetApp.flush();
  }
  return sheet;
}

/* ─── 활동 로그 기록 (내부 헬퍼) ───────────────────────── */
function appendLog_(ss, logData) {
  try {
    ensureLogSheet_(ss);
    var sheet = ss.getSheetByName(LOG_SHEET_NAME);
    var now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    sheet.appendRow([
      now,
      logData.admin  || '관리자',
      logData.appId  || '',
      logData.name   || '',
      logData.field  || '',
      logData.before || '',
      logData.after  || ''
    ]);
  } catch (e) {
    Logger.log('로그 기록 실패: ' + e.message);
  }
}

/* ─── 활동 로그 조회 ────────────────────────────────────── */
function getActivityLogs(pw, ownerToken) {
  if (!checkAdminAuth_(pw)) throw new Error('AUTH_FAIL');
  checkMaintenanceBlock_(ownerToken);

  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];

  var numRows = sheet.getLastRow() - 1;
  var numCols = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, numCols).getValues()[0]
                     .map(function(h) { return String(h || '').trim(); });
  var data = sheet.getRange(2, 1, numRows, numCols).getValues();

  return data.reverse().map(function(row) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      obj[headers[j]] = (val instanceof Date)
        ? Utilities.formatDate(val, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss')
        : (val === null || val === undefined ? '' : String(val));
    }
    return obj;
  });
}

/* ─── 테스트용 더미 요청 (수동 실행용) ──────────────────── */
// Apps Script 편집기에서 이 함수를 실행하면 Sheets 저장 + 이메일 발송을 테스트합니다.
function testPost() {
  var dummy = {
    '신청일시':   new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    '이름':       '테스트 홍길동',
    '연락처':     '010-0000-0000',
    '이메일':     'test@example.com',
    '활동지역':   '서울',
    '사업자구분': '개인사업자',
    '업체명·상호명': '테스트 설비',
    '서비스분야': '배관·수도, 보일러',
    '긴급출동가능여부': '가능',
    '보유자격증': '배관기능사',
    '경력연수':   '5~10년',
    '자기소개':   '테스트 자기소개입니다.',
    '추가문의':   '테스트 문의입니다.',
    '유입경로':   '지인 소개'
  };

  saveToSheet(dummy);
  sendEmail(dummy);
  Logger.log('testPost 완료');
}

/* =========================================================
   만능맨 파트너스 — Google Apps Script
   역할: 신청 데이터를 Google Sheets에 저장하고
         담당자 5명에게 이메일 발송
   ========================================================= */

/* ─── 설정값 (아래 3가지를 직접 입력하세요) ─────────────── */

// 수신자 이메일 주소 (5개, 순서 무관)
var RECIPIENTS = [
  '메일주소1@example.com',   // ← 실제 주소로 교체
  '메일주소2@example.com',   // ← 실제 주소로 교체
  '메일주소3@example.com',   // ← 실제 주소로 교체
  '메일주소4@example.com',   // ← 실제 주소로 교체
  '메일주소5@example.com'    // ← 실제 주소로 교체
];

// Google Sheets ID (스프레드시트 URL에서 /d/와 /edit 사이의 긴 문자열)
var SPREADSHEET_ID = '여기에 Google Sheets ID 입력';

// 저장할 시트 이름
var SHEET_NAME = '사전등록신청';

/* ─── Sheets 컬럼 헤더 (순서 고정) ──────────────────────── */
var HEADERS = [
  '신청일시', '이름', '연락처', '이메일', '활동지역',
  '사업자구분', '업체명', '서비스분야', '보유자격증', '경력연수',
  '자기소개', '추가문의', '유입경로',
  '처리상태', '담당자', '연락일', '관리자 메모', '최종결과'
];

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

  // 시트가 없으면 새로 생성
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // 헤더 행이 없으면 추가 + 스타일 적용
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    var hRange = sheet.getRange(1, 1, 1, HEADERS.length);
    hRange.setBackground('#1a56db');
    hRange.setFontColor('#ffffff');
    hRange.setFontWeight('bold');
    hRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
  }

  // 데이터 행 추가
  var row = [
    sanitizeSheet(d['신청일시']   || ''),
    sanitizeSheet(d['이름']       || ''),
    sanitizeSheet(d['연락처']     || ''),
    sanitizeSheet(d['이메일']     || ''),
    sanitizeSheet(d['활동지역']   || ''),
    sanitizeSheet(d['사업자구분'] || ''),
    sanitizeSheet(d['업체명']     || ''),
    sanitizeSheet(d['서비스분야'] || ''),
    sanitizeSheet(d['보유자격증'] || ''),
    sanitizeSheet(d['경력연수']   || ''),
    sanitizeSheet(d['자기소개']   || ''),
    sanitizeSheet(d['추가문의']   || ''),
    sanitizeSheet(d['유입경로']   || ''),
    '신규 접수',  // 처리상태 기본값
    '',           // 담당자 (관리자 직접 입력)
    '',           // 연락일 (관리자 직접 입력)
    '',           // 관리자 메모 (관리자 직접 입력)
    ''            // 최종결과 (관리자 직접 입력)
  ];

  sheet.appendRow(row);
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
    ['업체명',   d['업체명']],
    ['서비스분야', d['서비스분야']],
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
    '업체명':     '테스트 설비',
    '서비스분야': '배관·수도, 보일러',
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

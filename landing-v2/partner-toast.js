/* =========================================================
   만능맨 파트너스 v2 — 파트너 신청 알림 토스트
   기존 submit 로직, Google Sheets, 이메일 연동과 완전 독립
   ========================================================= */
(function () {
  'use strict';

  /* ===== 성씨 데이터 ===== */
  var SURNAMES = [
    '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
    '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍',
    '전', '고', '문', '양', '손', '배', '백', '허', '유', '남',
    '심', '노', '하', '곽', '성', '차', '주', '우', '구', '민',
    '진', '지', '엄', '채', '원', '천', '방', '공', '현', '함',
    '변', '염', '추', '도', '소', '석', '설', '마', '길', '연',
    '위', '표', '명', '기', '반', '라', '왕', '금', '옥', '육',
    '인', '맹', '제', '탁', '모', '피', '경', '봉'
  ];

  /* ===== 서비스 분야 데이터 ===== */
  var SERVICES = [
    '배관·수도', '누수·배관', '수도 수리', '배관 수리', '욕실 수전 교체',
    '싱크대 수전 교체', '세면대 수리', '변기 수리', '양변기 교체',
    '하수구 막힘', '배수구 막힘', '싱크대 하수구 막힘', '욕실 배수구 막힘',
    '세탁실 배수 문제', '계량기 누수', '수도 배관 누수', '온수 배관 누수',
    '난방 배관 누수', '배관 동파 복구', '수압 저하 점검', '급수 배관 점검',
    '배수 배관 점검', '위생배관 공사', '오수관 점검', '배관 교체', '배관 보수',
    '밸브 교체', '밸브 점검', '펌프 교체', '펌프 수리', '가압펌프 점검',
    '부스터펌프 점검', '저수조 배관', '물탱크 배관',
    '보일러 점검', '보일러 수리', '보일러 교체', '보일러 배관',
    '난방 배관', '난방 불량 점검', '온수 불량 점검', '온수기 설치', '온수기 수리',
    '분배기 교체', '난방 분배기 수리', '바닥난방 점검', '보일러 누수',
    '순환펌프 교체',
    '에어컨 설치', '에어컨 이전 설치', '에어컨 청소', '에어컨 가스 충전',
    '에어컨 누수', '에어컨 배관', '시스템에어컨', '천장형 에어컨', '스탠드 에어컨',
    '벽걸이 에어컨', '냉난방기 점검', '실외기 점검', '환기설비',
    '환풍기 교체', '환풍기 설치', '덕트 점검', '덕트 청소', '공조설비',
    '전기 점검', '전기 수리', '전기 배선', '전기 증설', '누전 점검',
    '차단기 교체', '분전반 점검', '콘센트 교체', '스위치 교체',
    '조명 교체', 'LED 조명 설치', '센서등 교체', '전등 수리', '인터폰 설치',
    '도어락 설치', 'CCTV 설치', '통신 배선', '비상등 점검', '유도등 점검',
    '소방 점검', '소화전 점검', '스프링클러 점검', '화재감지기 점검',
    '화재수신기 점검', '소방배관', '소방펌프 점검', '비상방송 점검',
    '피난설비 점검', '방화문 점검', '소화기 점검', '소방시설 유지보수',
    '가스 배관', '가스 누설 점검', '가스레인지 연결', '가스 밸브 교체',
    '도시가스 점검', 'LPG 배관 점검', '가스 경보기 설치', '가스 온수기 점검',
    '도배', '장판', '타일', '욕실 타일', '주방 타일', '바닥 타일',
    '페인트', '부분 도장', '방수', '욕실 방수', '옥상 방수', '베란다 방수',
    '실리콘 보수', '몰딩 교체', '문틀 보수', '방문 교체', '창문 수리', '샷시 수리',
    '방충망 교체', '블라인드 설치', '천장 보수', '벽체 보수', '바닥 보수',
    '싱크대 수리', '싱크대 교체', '필름 시공', '데코타일 시공',
    '입주청소', '이사청소', '상가청소', '사무실청소', '계단청소',
    '건물청소', '주차장청소', '외벽청소', '유리창청소', '후드 청소',
    '하수구 청소', '곰팡이 제거', '악취 제거', '소독 방역', '해충 방역',
    '물탱크 청소', '저수조 청소',
    '건물 유지보수', '상가 설비', '사무실 설비', '공장 설비',
    '기계설비 유지보수', '설비 정기점검', '공용부 보수',
    '화장실 유지보수', '배수펌프 점검', '집수정 펌프', '오배수펌프',
    '기계실 설비', '냉각탑 점검', '열교환기 점검', '압력탱크 점검',
    '공장 배관', '산업용 배관', '상업시설 유지보수',
    '소규모 집수리', '문 손잡이 교체', '도어클로저 교체', '경첩 수리',
    '선반 설치', '벽걸이 TV 설치', '커튼레일 설치', '욕실 악세사리 설치',
    '주방 후드 교체', '배수 트랩 교체', '수전 누수', '실내 누수',
    '베란다 누수', '천장 누수', '외벽 누수', '현장 점검', '긴급 수리', '긴급 출동'
  ];

  /* ===== 시간 표현 데이터 (방금 전 제외 — 샘플용) ===== */
  var TIMES = [
    '3분 전', '5분 전', '7분 전', '9분 전', '12분 전',
    '15분 전', '18분 전', '21분 전', '24분 전', '27분 전',
    '31분 전', '34분 전', '38분 전', '43분 전', '47분 전',
    '52분 전', '58분 전', '1시간 전', '1시간 5분 전', '1시간 12분 전',
    '1시간 18분 전', '1시간 24분 전', '1시간 31분 전', '1시간 37분 전',
    '1시간 45분 전', '1시간 52분 전', '2시간 전', '2시간 10분 전',
    '2시간 25분 전', '2시간 40분 전', '3시간 전',
    '오늘 오전 신청', '오늘 오후 신청', '오늘 영업시간 중 신청', '최근 신청 완료'
  ];

  /* ===== 기타 분야 정규화 후보 ===== */
  var ETC_SERVICES = [
    '기타 설비', '생활·건축설비', '현장 점검', '긴급 수리',
    '소규모 집수리', '상가 설비', '사무실 설비', '공장 설비',
    '건물 유지보수', '시설관리', '누수·배관', '전기 점검',
    '청소', '도배·장판', '타일·방수', '냉난방', '환기설비', '펌프·밸브'
  ];

  /* ===== 상태 변수 ===== */
  var toastCount    = 0;
  var closeCount    = 0;
  var maxCount      = window.innerWidth <= 768 ? 8 : 12;
  var toastTimer    = null;
  var hideTimer     = null;
  var lastSurname   = null;
  var lastService   = null;
  var lastTime      = null;
  var recentNames   = [];
  var recentSvcs    = [];

  /* ===== 유틸 ===== */
  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /* 앞쪽(흔한) 항목에 3배 가중치 */
  function weightedPick(arr, commonCount) {
    var pool = [];
    var threshold = Math.min(commonCount, arr.length);
    for (var i = 0; i < arr.length; i++) {
      var w = i < threshold ? 3 : 1;
      for (var j = 0; j < w; j++) pool.push(arr[i]);
    }
    return pool[rand(0, pool.length - 1)];
  }

  function pickNoRepeat(arr, last, recent, commonCount) {
    var item;
    var tries = 0;
    do {
      item = weightedPick(arr, commonCount);
      tries++;
    } while (tries < 30 && (item === last || recent.indexOf(item) !== -1));
    return item;
  }

  /* 시간대별 표시 간격 (ms) */
  function getInterval() {
    var h = new Date().getHours();
    if (h >= 8  && h < 9)  return rand(180000, 300000);
    if (h >= 9  && h < 11) return rand(90000,  180000);
    if (h >= 11 && h < 14) return rand(45000,  120000);
    if (h >= 14 && h < 18) return rand(90000,  210000);
    if (h >= 18 && h < 21) return rand(150000, 300000);
    if (h >= 21 && h < 23) return rand(240000, 420000);
    return rand(600000, 1200000);
  }

  /* 샘플 알림 데이터 생성 */
  function getRandomData() {
    var surname = pickNoRepeat(SURNAMES, lastSurname, recentNames, 20);
    var service = pickNoRepeat(SERVICES, lastService, recentSvcs,  40);
    var time;
    var t = 0;
    do {
      time = TIMES[rand(0, TIMES.length - 1)];
      t++;
    } while (t < 10 && time === lastTime);

    lastSurname = surname;
    lastService = service;
    lastTime    = time;
    recentNames = recentNames.concat([surname]).slice(-5);
    recentSvcs  = recentSvcs.concat([service]).slice(-5);

    return { name: surname + 'OO', service: service, timeText: time, isReal: false };
  }

  /* ===== DOM 참조 ===== */
  var toast      = document.getElementById('partnerToast');
  var elInitial  = document.getElementById('partnerToastInitial');
  var elName     = document.getElementById('partnerToastName');
  var elField    = document.getElementById('partnerToastField');
  var elTime     = document.getElementById('partnerToastTime');
  var elClose    = document.getElementById('partnerToastClose');

  /* ===== 위치 동기화 ===== */
  function syncPosition() {
    if (!toast) return;
    var isMobile    = window.innerWidth <= 768;
    var baseBottom  = isMobile ? 18 : 24;
    var extraBottom = 0;
    var bar = document.querySelector('.event-banner--bottom.visible');
    if (bar) {
      extraBottom = bar.getBoundingClientRect().height + 12;
    }
    toast.style.bottom = (baseBottom + extraBottom) + 'px';
  }

  /* 이벤트 배너 visible 클래스 변화 감지 */
  function watchBanner() {
    var bar = document.querySelector('.event-banner--bottom');
    if (bar && 'MutationObserver' in window) {
      new MutationObserver(syncPosition).observe(bar, {
        attributes: true, attributeFilter: ['class']
      });
    }
  }

  /* ===== 모달/정책 차단 체크 ===== */
  function isBlocked() {
    var fo = document.getElementById('formOverlay');
    var pv = document.getElementById('policyView');
    return (fo && fo.classList.contains('show')) ||
           (pv && pv.classList.contains('active'));
  }

  /* ===== 팝업 표시 ===== */
  function showToast(data) {
    if (!toast) return;
    if (!data.isReal && isBlocked()) return;

    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }

    if (elInitial) elInitial.textContent = data.name.charAt(0);
    if (elName)    elName.textContent    = data.name;
    if (elField)   elField.textContent   = '(' + data.service + ')';
    if (elTime)    elTime.textContent    = data.timeText + ' 사전등록 완료';

    syncPosition();
    toast.classList.remove('is-visible');
    void toast.offsetWidth; /* reflow — transition 재시작 */
    toast.classList.add('is-visible');

    var dur = data.isReal ? rand(6000, 8000) : rand(5000, 6000);
    hideTimer = setTimeout(hideToast, dur);
  }

  function hideToast() {
    if (!toast) return;
    toast.classList.remove('is-visible');
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  }

  /* ===== 다음 팝업 예약 ===== */
  function scheduleNext() {
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    if (closeCount >= 3 || toastCount >= maxCount) return;

    var interval = getInterval();
    if (closeCount >= 2) interval = Math.floor(interval * 1.5);

    toastTimer = setTimeout(function () {
      if (toastCount < maxCount && !isBlocked()) {
        showToast(getRandomData());
        toastCount++;
      }
      scheduleNext();
    }, interval);
  }

  /* ===== 닫기 버튼 ===== */
  if (elClose) {
    elClose.addEventListener('click', function () {
      hideToast();
      closeCount++;
      if (closeCount >= 3) {
        if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
      }
    });
  }

  /* ===== 리사이즈 ===== */
  window.addEventListener('resize', function () {
    maxCount = window.innerWidth <= 768 ? 8 : 12;
    syncPosition();
  }, { passive: true });

  /* ===== 실제 신청 완료 연동 함수 ===== */

  /* 이름 마스킹: 성씨만 남기고 OO 처리 */
  function maskName(name) {
    if (!name || typeof name !== 'string') return '신청자';
    var t = name.trim();
    return t ? (t.charAt(0) + 'OO') : '신청자';
  }

  /* 폼 서비스 분야 → 토스트용 세부 표현으로 변환 */
  function normalizeService(svcs) {
    if (typeof svcs === 'string') {
      svcs = svcs.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    }
    if (!svcs || !svcs.length) {
      return ETC_SERVICES[rand(0, ETC_SERVICES.length - 1)];
    }
    var real = svcs.filter(function (s) { return s !== '기타'; });
    if (!real.length) {
      return ETC_SERVICES[rand(0, ETC_SERVICES.length - 1)];
    }
    var picked = real[rand(0, real.length - 1)];
    var detailMap = {
      '에어컨':    ['에어컨 설치', '에어컨 청소', '에어컨 가스 충전', '에어컨 이전 설치', '냉난방기 점검', '실외기 점검'],
      '보일러':    ['보일러 점검', '보일러 수리', '보일러 교체', '난방 배관', '온수 불량 점검', '순환펌프 교체'],
      '전기':      ['전기 점검', '전기 수리', '누전 점검', '조명 교체', 'LED 조명 설치', '차단기 교체'],
      '배관·수도': ['배관·수도', '누수·배관', '수도 수리', '배관 수리', '하수구 막힘', '수도 배관 누수'],
      '소방설비':  ['소방 점검', '소화전 점검', '스프링클러 점검', '화재감지기 점검', '소방배관'],
      '가스':      ['가스 배관', '가스 누설 점검', '도시가스 점검', '가스 밸브 교체', '가스레인지 연결'],
      '인테리어':  ['도배', '장판', '타일', '욕실 타일', '바닥 보수', '실리콘 보수', '방수', '페인트']
    };
    var opts = detailMap[picked];
    return opts ? opts[rand(0, opts.length - 1)] : picked;
  }

  /*
   * 외부 훅: app.js 에서 구글시트 저장 성공 직후 호출
   * window.mnmToastOnRealSignup(formData, svcs)
   *   formData — FormData 객체 (name 필드 포함)
   *   svcs     — string[] 선택된 서비스 data-v 값 배열
   */
  window.mnmToastOnRealSignup = function (formData, svcs) {
    var rawName = (formData && typeof formData.get === 'function') ? (formData.get('name') || '') : '';
    showToast({
      name:     maskName(rawName),
      service:  normalizeService(svcs || []),
      timeText: '방금 전',
      isReal:   true
    });
  };

  /* ===== 초기화 ===== */
  syncPosition();
  watchBanner();

  var firstDelay = rand(5000, 10000);
  toastTimer = setTimeout(function () {
    if (toastCount < maxCount) {
      showToast(getRandomData());
      toastCount++;
    }
    scheduleNext();
  }, firstDelay);

}());

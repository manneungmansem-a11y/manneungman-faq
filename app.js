/* =========================================================
   만능맨 파트너스 — interactions
   ========================================================= */
(function () {
  'use strict';

  /* ---------- image loader (handles spaces / Korean paths) ---------- */
  var IMG_BASE = 'https://manneungmansem-a11y.github.io/manneungman-faq/';
  document.querySelectorAll('[data-img]').forEach(function (el) {
    el.src = IMG_BASE + encodeURI(el.getAttribute('data-img'));
    el.loading = 'lazy';
    el.addEventListener('error', function () {
      el.style.background = 'repeating-linear-gradient(45deg,#eef2fb,#eef2fb 10px,#e3e9f6 10px,#e3e9f6 20px)';
      el.style.minHeight = '160px';
    });
  });

  /* ---------- header shadow on scroll ---------- */
  var header = document.getElementById('header');
  var onScroll = function () {
    header.classList.toggle('scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  var menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      var t = document.getElementById('benefits');
      if (t) window.scrollTo({ top: t.offsetTop - 60, behavior: 'smooth' });
    });
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (t) { e.preventDefault(); window.scrollTo({ top: t.offsetTop - 64, behavior: 'smooth' }); }
    });
  });

  /* ---------- scroll reveal ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  function revealInView() {
    document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.96 && r.bottom > 0) el.classList.add('in');
    });
  }
  window.addEventListener('load', revealInView);
  window.addEventListener('scroll', revealInView, { passive: true });
  revealInView();
  setTimeout(revealInView, 250);

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    q.addEventListener('click', function () {
      var open = item.classList.contains('open');
      if (!open) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      } else {
        item.classList.remove('open');
        a.style.maxHeight = 0;
      }
    });
  });

  /* ---------- FAQ category tabs ---------- */
  var tabs = document.querySelectorAll('.faq-tab');
  var groups = document.querySelectorAll('.faq-group');
  var faqEmpty = document.getElementById('faqEmpty');
  var searchInput = document.getElementById('faqSearch');
  var activeCat = '전체';

  function applyFaqFilter() {
    var term = (searchInput.value || '').trim().toLowerCase();
    var anyVisible = false;
    groups.forEach(function (g) {
      var catMatch = activeCat === '전체' || g.getAttribute('data-cat') === activeCat;
      var groupHasVisible = false;
      g.querySelectorAll('.faq-item').forEach(function (item) {
        var txt = item.textContent.toLowerCase();
        var termMatch = !term || txt.indexOf(term) !== -1;
        var show = catMatch && termMatch;
        item.style.display = show ? '' : 'none';
        if (show) groupHasVisible = true;
      });
      g.style.display = groupHasVisible ? '' : 'none';
      if (groupHasVisible) anyVisible = true;
    });
    faqEmpty.style.display = anyVisible ? 'none' : 'block';
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      activeCat = tab.getAttribute('data-cat');
      applyFaqFilter();
    });
  });
  searchInput.addEventListener('input', applyFaqFilter);

  /* =========================================================
     APPLICATION FORM (multi-step)
     ========================================================= */
  var overlay = document.getElementById('formOverlay');
  var formArea = document.getElementById('formArea');
  var successArea = document.getElementById('successArea');
  var form = document.getElementById('regForm');
  var fsteps = form.querySelectorAll('.fstep');
  var stepDots = document.querySelectorAll('.steps .st');
  var current = 1;
  var selectedSvc = [];

  /* 전화번호 자동 하이픈 포맷 */
  var phoneInput = form.querySelector('[name="phone"]');
  if (phoneInput) {
    phoneInput.addEventListener('input', function (e) {
      var digits = e.target.value.replace(/\D/g, '').slice(0, 11);
      var formatted = '';
      if (digits.startsWith('02')) {
        if (digits.length <= 2)        formatted = digits;
        else if (digits.length <= 5)   formatted = digits.slice(0,2) + '-' + digits.slice(2);
        else if (digits.length <= 9)   formatted = digits.slice(0,2) + '-' + digits.slice(2,5) + '-' + digits.slice(5);
        else                           formatted = digits.slice(0,2) + '-' + digits.slice(2,6) + '-' + digits.slice(6);
      } else if (digits.startsWith('0')) {
        if (digits.length <= 3)        formatted = digits;
        else if (digits.length <= 6)   formatted = digits.slice(0,3) + '-' + digits.slice(3);
        else if (digits.length <= 10)  formatted = digits.slice(0,3) + '-' + digits.slice(3,6) + '-' + digits.slice(6);
        else                           formatted = digits.slice(0,3) + '-' + digits.slice(3,7) + '-' + digits.slice(7);
      } else {
        formatted = digits;
      }
      var pos = e.target.selectionStart;
      var old = e.target.value;
      e.target.value = formatted;
      if (formatted.length > old.length) {
        try { e.target.setSelectionRange(pos + (formatted.length - old.length), pos + (formatted.length - old.length)); } catch(_) {}
      }
    });
  }

  function openForm() {
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeForm() {
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }
  document.querySelectorAll('[data-open-form]').forEach(function (b) { b.addEventListener('click', openForm); });
  document.querySelectorAll('[data-close-form]').forEach(function (b) { b.addEventListener('click', closeForm); });
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeForm(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeForm(); });

  function showStep(n) {
    current = n;
    fsteps.forEach(function (s) { s.classList.toggle('active', +s.dataset.step === n); });
    stepDots.forEach(function (d) {
      var sn = +d.dataset.st;
      d.classList.toggle('active', sn === n);
      d.classList.toggle('done', sn < n);
    });
    var body = overlay.querySelector('.modal-body');
    if (body) body.scrollTop = 0;
  }

  /* 유입경로 라디오 */
  var refEtcRow = document.getElementById('refEtcRow');
  var refEtcInput = document.getElementById('refEtcInput');
  document.querySelectorAll('input[name="referral"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      var referralRow = document.getElementById('referralRow');
      if (referralRow) referralRow.classList.remove('invalid');
      if (radio.value === '기타') {
        refEtcRow.hidden = false;
      } else {
        refEtcRow.hidden = true;
        if (refEtcInput) { refEtcInput.value = ''; refEtcRow.classList.remove('invalid'); }
      }
    });
  });
  if (refEtcInput) refEtcInput.addEventListener('input', function () {
    if (refEtcInput.value.trim()) refEtcRow.classList.remove('invalid');
  });

  /* service multi-select */
  var etcRow = document.getElementById('etcRow');
  var etcInput = document.getElementById('etcInput');
  document.querySelectorAll('#svcGrid .svc').forEach(function (s) {
    s.addEventListener('click', function () {
      s.classList.toggle('on');
      var v = s.getAttribute('data-v');
      var i = selectedSvc.indexOf(v);
      if (i === -1) selectedSvc.push(v); else selectedSvc.splice(i, 1);
      var row = document.getElementById('svcGrid').closest('.field-row');
      if (selectedSvc.length) row.classList.remove('invalid');
      if (selectedSvc.indexOf('기타') !== -1) {
        etcRow.hidden = false;
      } else {
        etcRow.hidden = true;
        if (etcInput) { etcInput.value = ''; etcRow.classList.remove('invalid'); }
      }
    });
  });
  if (etcInput) etcInput.addEventListener('input', function () {
    if (etcInput.value.trim()) etcRow.classList.remove('invalid');
  });

  /* validation per step */
  function validateStep(n) {
    var ok = true;
    var step = form.querySelector('.fstep[data-step="' + n + '"]');
    if (n === 1) {
      step.querySelectorAll('.inp[required]').forEach(function (inp) {
        var row = inp.closest('.field-row');
        var valid = inp.value.trim() !== '';
        row.classList.toggle('invalid', !valid);
        if (!valid) ok = false;
      });
      var bizChecked = step.querySelector('input[name="bizType"]:checked');
      var bizRow = step.querySelector('.seg').closest('.field-row');
      bizRow.classList.toggle('invalid', !bizChecked);
      if (!bizChecked) ok = false;
    }
    if (n === 2) {
      var svcRow = document.getElementById('svcGrid').closest('.field-row');
      var valid = selectedSvc.length > 0;
      svcRow.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
      if (selectedSvc.indexOf('기타') !== -1) {
        var etcOk = etcInput && etcInput.value.trim() !== '';
        etcRow.classList.toggle('invalid', !etcOk);
        if (!etcOk) ok = false;
      }
      var careerSel = step.querySelector('select[name="career"]');
      var careerRow = careerSel.closest('.field-row');
      var careerOk = careerSel.value !== '';
      careerRow.classList.toggle('invalid', !careerOk);
      if (!careerOk) ok = false;
    }
    if (n === 3) {
      var referralChecked = form.querySelector('input[name="referral"]:checked');
      var referralRow = document.getElementById('referralRow');
      referralRow.classList.toggle('invalid', !referralChecked);
      if (!referralChecked) ok = false;
      if (referralChecked && referralChecked.value === '기타') {
        var refEtcOk = refEtcInput && refEtcInput.value.trim() !== '';
        refEtcRow.classList.toggle('invalid', !refEtcOk);
        if (!refEtcOk) ok = false;
      }
      var agree = form.querySelector('input[name="agree"]');
      var agreeRow = agree.closest('.field-row');
      agreeRow.classList.toggle('invalid', !agree.checked);
      if (!agree.checked) ok = false;
    }
    return ok;
  }

  form.querySelectorAll('[data-next]').forEach(function (b) {
    b.addEventListener('click', function () { if (validateStep(current)) showStep(current + 1); });
  });
  form.querySelectorAll('[data-prev]').forEach(function (b) {
    b.addEventListener('click', function () { showStep(current - 1); });
  });

  /* ---------- duplicate prevention (60s) ---------- */
  var dupOverlay = document.getElementById('dupOverlay');
  var dupTimerEl = document.getElementById('dupTimer');
  var dupClose = document.getElementById('dupClose');
  var dupInterval = null;
  function lastSubmitTime() { return +(localStorage.getItem('mnm_lastSubmit') || 0); }
  function showDup() {
    var remain = 60 - Math.floor((Date.now() - lastSubmitTime()) / 1000);
    if (remain < 1) remain = 1;
    dupTimerEl.textContent = remain;
    dupOverlay.classList.add('show');
    dupInterval = setInterval(function () {
      remain--;
      dupTimerEl.textContent = remain > 0 ? remain : 0;
      if (remain <= 0) { clearInterval(dupInterval); dupOverlay.classList.remove('show'); }
    }, 1000);
  }
  dupClose.addEventListener('click', function () {
    clearInterval(dupInterval);
    dupOverlay.classList.remove('show');
  });
  dupOverlay.addEventListener('click', function (e) {
    if (e.target === dupOverlay) { clearInterval(dupInterval); dupOverlay.classList.remove('show'); }
  });

  /* ---------- submit (Google Apps Script) ---------- */
  // Google Apps Script Web App URL — 배포 후 아래 값을 실제 URL로 교체하세요
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyD1yELbOat2_mdO_EzelUtNGtLGSTWvFIBeTI_LTq25lp-nspsLfS6Uo1Jsi25h68s/exec';

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateStep(3)) return;

    if (Date.now() - lastSubmitTime() < 60 * 1000) { showDup(); return; }

    var now = new Date();
    var submitTime = now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    var referralEl = form.querySelector('input[name="referral"]:checked');
    var referralVal = referralEl ? referralEl.value : '';
    if (referralVal === '기타' && refEtcInput && refEtcInput.value.trim()) {
      referralVal = '기타 - ' + refEtcInput.value.trim();
    }

    // 서비스분야: 선택값 + 기타 직접입력 통합
    var svcFinal = selectedSvc.join(', ');
    if (selectedSvc.indexOf('기타') !== -1 && etcInput && etcInput.value.trim()) {
      svcFinal = svcFinal.replace('기타', '기타(' + etcInput.value.trim() + ')');
    }

    var payload = {
      '신청일시':   submitTime,
      '이름':       form.name.value.trim(),
      '연락처':     form.phone.value.trim(),
      '이메일':     form.email.value.trim(),
      '활동지역':   form.region.value,
      '사업자구분': (form.querySelector('input[name="bizType"]:checked') || {}).value || '',
      '업체명':     form.company.value.trim(),
      '서비스분야': svcFinal,
      '보유자격증': form.license.value.trim(),
      '경력연수':   form.career.value,
      '자기소개':   form.intro.value.trim(),
      '추가문의':   form.inquiry.value.trim(),
      '유입경로':   referralVal
    };

    console.log('신청폼 제출 시작');
    console.log('Apps Script 전송 payload:', payload);
    console.log('Apps Script URL:', SCRIPT_URL);

    var btn = document.getElementById('submitBtn');
    var errEl = document.getElementById('submitErrMsg');
    btn.disabled = true; btn.textContent = '제출 중…';
    if (errEl) errEl.style.display = 'none';

    function onSuccess() {
      console.log('Apps Script 전송 완료');
      localStorage.setItem('mnm_lastSubmit', Date.now());
      try {
        var mName = payload['이름'] ? payload['이름'].charAt(0) + '○○' : '신규';
        var mJob = (selectedSvc.indexOf('기타') !== -1 && etcInput && etcInput.value.trim())
                   ? etcInput.value.trim()
                   : (selectedSvc[0] || '설비');
        if (window.mnmPushApplicant) window.mnmPushApplicant(mName, mJob);
      } catch (ex) {}
      formArea.style.display = 'none';
      successArea.style.display = 'block';
      btn.disabled = false; btn.textContent = '신청서 제출하기';
    }

    function onError(error) {
      console.error('Apps Script 전송 실패:', error);
      btn.disabled = false; btn.textContent = '신청서 제출하기';
      if (errEl) errEl.style.display = 'block';
    }

    // no-cors: 응답 내용은 읽을 수 없으나 요청 자체는 Apps Script에 정상 전달됨
    // Content-Type: text/plain → CORS preflight 없이 단순 요청으로 처리
    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(onSuccess).catch(onError);
  });

  document.querySelectorAll('[data-close-form]').forEach(function (b) {
    b.addEventListener('click', function () {
      setTimeout(function () {
        if (successArea.style.display === 'block') {
          successArea.style.display = 'none';
          formArea.style.display = 'block';
          form.reset();
          selectedSvc = [];
          document.querySelectorAll('#svcGrid .svc').forEach(function (s) { s.classList.remove('on'); });
          if (etcRow) { etcRow.hidden = true; }
          document.querySelectorAll('input[name="referral"]').forEach(function (r) { r.checked = false; });
          if (refEtcRow) { refEtcRow.hidden = true; }
          if (refEtcInput) { refEtcInput.value = ''; }
          form.querySelectorAll('.invalid').forEach(function (r) { r.classList.remove('invalid'); });
          showStep(1);
        }
      }, 250);
    });
  });

  /* =========================================================
     REALTIME APPLICATION TOAST (social proof)
     ========================================================= */
  (function () {
    var toast = document.getElementById('rtToast');
    if (!toast) return;

    /* ---- 시간대별 스케줄 ---- */
    var popupSchedule = {
      dawn:        { start: 0,  end: 6,  firstDelay: [60, 90],  interval: [240, 360], maxPerSession: 1,
                     timeAgoList: ['6시간 전','7시간 전','8시간 전','9시간 전','10시간 전','어제'] },
      earlyMorning:{ start: 7,  end: 8,  firstDelay: [25, 40],  interval: [90, 150],  maxPerSession: 2,
                     timeAgoList: ['1시간 전','2시간 전','3시간 전','4시간 전'] },
      morning:     { start: 9,  end: 11, firstDelay: [8, 18],   interval: [25, 45],   maxPerSession: 5,
                     timeAgoList: ['7분 전','12분 전','18분 전','25분 전','34분 전','48분 전','1시간 전'] },
      lunch:       { start: 12, end: 12, firstDelay: [25, 40],  interval: [60, 100],  maxPerSession: 2,
                     timeAgoList: ['38분 전','52분 전','1시간 전','2시간 전'] },
      afternoon:   { start: 13, end: 17, firstDelay: [8, 15],   interval: [25, 40],   maxPerSession: 6,
                     timeAgoList: ['5분 전','9분 전','14분 전','22분 전','31분 전','43분 전','58분 전','1시간 전'] },
      evening:     { start: 18, end: 20, firstDelay: [30, 50],  interval: [90, 150],  maxPerSession: 2,
                     timeAgoList: ['1시간 전','2시간 전','3시간 전','4시간 전'] },
      lateEvening: { start: 21, end: 23, firstDelay: [50, 80],  interval: [180, 300], maxPerSession: 1,
                     timeAgoList: ['3시간 전','4시간 전','5시간 전','6시간 전','오늘 오후','어제'] }
    };

    /* 실제 데이터 → 등록완료 계열 / 샘플 데이터 → 예시 계열 */
    var REAL_ACTIONS   = ['파트너스 등록완료','입점 신청완료','사전등록 완료','파트너 신청완료','만능맨 파트너스 등록완료'];
    var SAMPLE_ACTIONS = ['파트너 등록 예시','입점 예시','사전등록 예시','파트너 신청 예시','만능맨 파트너 등록 예시'];

    var NAMES = [
      '김○○','이○○','박○○','최○○','정○○','강○○','조○○','윤○○','장○○','임○○',
      '한○○','오○○','서○○','신○○','권○○','황○○','안○○','송○○','류○○','유○○',
      '홍○○','전○○','고○○','문○○','양○○','손○○','배○○','백○○','허○○','남○○',
      '심○○','노○○','하○○','곽○○','성○○','차○○','주○○','우○○','구○○','민○○',
      '진○○','엄○○','채○○','원○○','천○○','방○○','공○○','현○○','함○○','변○○',
      '염○○','여○○','추○○','도○○','소○○','석○○','선○○','설○○','마○○','길○○',
      '연○○','명○○','위○○','표○○','기○○','반○○','라○○','왕○○','금○○','옥○○',
      '육○○','인○○','맹○○','제○○','탁○○','편○○','봉○○','두○○','모○○','사○○',
      '빈○○','피○○','지○○','단○○','국○○','어○○','은○○','궁○○','내○○'
    ];

    var FIELDS = [
      '배관수리','배관설비','배관점검','배관교체','배관공사','배관막힘','배관누수','노후배관교체',
      '급수배관수리','급탕배관수리','온수배관수리','난방배관수리','수도배관수리','화장실배관수리','주방배관수리',
      '누수탐지','누수수리','누수공사','누수점검','천장누수','벽면누수','욕실누수','주방누수',
      '베란다누수','수도누수','배관누수탐지','아파트누수','상가누수','건물누수','옥상누수',
      '수도수리','수도설비','수도점검','수도배관','수도꼭지수리','수도꼭지교체','수전교체','수전수리',
      '싱크수전교체','욕실수전교체','샤워수전교체','세면대수전교체','수압점검','수압조절','물샘수리',
      '보일러수리','보일러점검','보일러교체','보일러설치','보일러배관','보일러누수','보일러분배기',
      '난방수리','난방점검','난방배관','난방분배기수리','난방분배기교체','온도조절기교체','구동기교체',
      '난방불량수리','온수불량수리','온수기수리','온수기설치','전기온수기수리','가스온수기수리',
      '밸브교체','밸브수리','밸브점검','수도밸브교체','난방밸브교체','가스밸브점검','분배기밸브교체',
      '감압밸브교체','정수위밸브점검','자동제어밸브점검',
      '설비수리','기계설비','건물설비','아파트설비','상가설비','사무실설비','공장설비','위생설비',
      '급수설비','급탕설비','배수설비','냉난방설비','설비점검','설비보수','시설관리','건물유지보수',
      '하수구막힘','하수구수리','하수구뚫음','하수구냄새','배수구막힘','배수구수리','배수관수리',
      '배수관막힘','싱크대막힘','싱크대수리','싱크대배수','싱크대누수','싱크대교체',
      '세면대막힘','세면대수리','세면대교체','욕조배수수리','욕실배수수리',
      '변기수리','변기막힘','변기교체','변기부속교체','변기누수','양변기수리','양변기교체',
      '화장실수리','욕실수리','욕실설비','샤워기교체','샤워기수리','욕실환풍기교체','욕실환풍기수리',
      '욕실실리콘','욕실타일수리',
      '에어컨수리','에어컨설치','에어컨이전설치','에어컨철거','에어컨청소',
      '벽걸이에어컨설치','스탠드에어컨설치','시스템에어컨점검','냉매충전','실외기점검',
      '냉방기수리','냉난방기수리','환풍기교체','환풍기수리','환기설비',
      '전기수리','전기점검','전기공사','전기배선수리','누전점검','차단기점검','차단기교체',
      '콘센트교체','콘센트수리','스위치교체','스위치수리','조명교체','조명설치','LED조명교체',
      '등기구교체','전등수리','전기증설','분전함점검','배선정리',
      '도어락설치','도어락수리','도어락교체','문수리','문고리교체','방문수리','현관문수리',
      '중문수리','경첩교체','문틀수리','샷시수리','샷시교체','방충망수리','방충망교체','방범창수리',
      '실리콘시공','코킹시공','타일수리','타일교체','타일시공','줄눈시공','욕실줄눈',
      '주방타일수리','벽타일수리','바닥타일수리','도배수리','장판수리','몰딩수리','걸레받이수리','마감수리',
      '생활수리','집수리','출장수리','긴급수리','소규모수리','간단수리','설치수리','주방수리',
      '가구수리','가구조립','선반설치','커튼설치','블라인드설치','액자설치','거울설치','행거설치','수납장설치',
      '철거작업','간단철거','욕실철거','주방철거','타일철거','싱크대철거','폐기물정리',
      '원상복구','부분보수','하자보수','입주수리','퇴거수리','상가수리','사무실수리',
      '원룸수리','빌라수리','아파트수리'
    ];

    var GLOBAL_MAX        = 6;
    var CLOSE_COOLDOWN_MS = 3 * 60 * 1000;
    var SK_COUNT  = 'mnm_rtCount';
    var SK_CLOSED = 'mnm_rtClosedAt';
    var SK_RECENT = 'mnm_rtRecent';

    var TEST_WORDS = ['테스트','test','홍길동','1111','1234','asdf','qwer','임시','샘플','테스트이름','테스트업체'];
    function isTestEntry(val) {
      var v = String(val || '').toLowerCase();
      for (var i = 0; i < TEST_WORDS.length; i++) {
        if (v.indexOf(TEST_WORDS[i].toLowerCase()) !== -1) return true;
      }
      return false;
    }

    function getCurrentSchedule() {
      var h = new Date().getHours();
      var keys = Object.keys(popupSchedule);
      for (var i = 0; i < keys.length; i++) {
        var s = popupSchedule[keys[i]];
        if (h >= s.start && h <= s.end) return s;
      }
      return popupSchedule.dawn;
    }

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function randInt(a, b) { return Math.round(a + Math.random() * (b - a)); }

    function getRecentKeys() {
      try { return JSON.parse(sessionStorage.getItem(SK_RECENT) || '[]'); }
      catch (e) { return []; }
    }
    function addRecentKey(key) {
      var recent = getRecentKeys();
      recent.push(key);
      if (recent.length > 3) recent.shift();
      try { sessionStorage.setItem(SK_RECENT, JSON.stringify(recent)); } catch (e) {}
    }

    function buildSampleData(sched) {
      var recent = getRecentKeys();
      var name, field, timeAgo, key, guard = 0;
      do {
        name    = pick(NAMES);
        field   = pick(FIELDS);
        timeAgo = pick(sched.timeAgoList);
        key = name + '|' + field + '|' + timeAgo;
        guard++;
      } while (recent.indexOf(key) !== -1 && guard < 30);
      addRecentKey(key);
      return { n: name, j: field, timeAgo: timeAgo, action: pick(SAMPLE_ACTIONS), real: false };
    }

    function buildRealData(item, sched) {
      return { n: item.n, j: item.j, timeAgo: pick(sched.timeAgoList), action: pick(REAL_ACTIONS), real: true };
    }

    var schedule   = getCurrentSchedule();
    var SESSION_MAX = Math.min(schedule.maxPerSession, GLOBAL_MAX);
    if (+(sessionStorage.getItem(SK_COUNT) || 0) >= SESSION_MAX) { toast.remove(); return; }

    var initEl = toast.querySelector('.rt-ava-init');
    var nameEl = toast.querySelector('.rt-name-txt');
    var jobEl  = toast.querySelector('.rt-job');
    var timeEl = toast.querySelector('.rt-time');
    var hideTimer = null, nextTimer = null, stopped = false;
    var realQueue = [];

    function show() {
      if (stopped) return;

      var closedAt = +(sessionStorage.getItem(SK_CLOSED) || 0);
      if (closedAt && Date.now() - closedAt < CLOSE_COOLDOWN_MS) {
        nextTimer = setTimeout(show, CLOSE_COOLDOWN_MS - (Date.now() - closedAt) + 500);
        return;
      }

      var shownCount = +(sessionStorage.getItem(SK_COUNT) || 0);
      if (shownCount >= SESSION_MAX) { stopped = true; return; }

      var d = realQueue.length ? buildRealData(realQueue.shift(), schedule) : buildSampleData(schedule);

      initEl.textContent = d.n.charAt(0);
      nameEl.textContent = d.n;
      jobEl.textContent  = '(' + d.j + ')';
      timeEl.textContent = d.timeAgo + ' ' + d.action;
      toast.classList.toggle('rt-real', !!d.real);
      toast.classList.add('show');

      sessionStorage.setItem(SK_COUNT, shownCount + 1);
      hideTimer = setTimeout(hide, d.real ? 6200 : 5200);
    }

    function hide() {
      toast.classList.remove('show');
      if (stopped) return;
      var shownCount = +(sessionStorage.getItem(SK_COUNT) || 0);
      if (shownCount >= SESSION_MAX) { stopped = true; return; }
      nextTimer = setTimeout(show, randInt(schedule.interval[0], schedule.interval[1]) * 1000);
    }

    window.mnmPushApplicant = function (maskedName, job) {
      if (stopped || !maskedName) return;
      realQueue.push({ n: maskedName, j: job || '설비' });
      clearTimeout(nextTimer);
      clearTimeout(hideTimer);
      toast.classList.remove('show');
      nextTimer = setTimeout(show, 700);
    };

    document.getElementById('rtClose').addEventListener('click', function () {
      clearTimeout(hideTimer); clearTimeout(nextTimer);
      toast.classList.remove('show');
      sessionStorage.setItem(SK_CLOSED, Date.now());
      var shownCount = +(sessionStorage.getItem(SK_COUNT) || 0);
      if (shownCount >= SESSION_MAX) {
        stopped = true;
        setTimeout(function () { if (toast.parentNode) toast.remove(); }, 550);
      } else {
        nextTimer = setTimeout(show, CLOSE_COOLDOWN_MS + 500);
      }
    });

    // Google Sheets에서 실제 신청자 fetch → 검증 통과 시 realQueue 주입
    try {
      fetch(SCRIPT_URL, { method: 'GET' })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!Array.isArray(data)) return;
          var valid = data.filter(function (item) {
            if (!item || !item.n || !item.j) return false;
            if (isTestEntry(item.n) || isTestEntry(item.j)) return false;
            if (item.n.length < 2 || /^\d+$/.test(item.n)) return false;
            return true;
          });
          if (valid.length >= 3) {
            valid.forEach(function (item) { realQueue.push({ n: item.n, j: item.j }); });
          }
        })
        .catch(function () {});
    } catch (e) {}

    setTimeout(show, randInt(schedule.firstDelay[0], schedule.firstDelay[1]) * 1000);
  })();

  /* ---------- 히어로 카드 슬라이더 ---------- */
  (function () {
    var slides = document.querySelectorAll('.hc-slide');
    var dots   = document.querySelectorAll('.hcd');
    if (!slides.length) return;

    var current = 0;
    var autoTimer = null;
    var AUTO_INTERVAL = 5500;   /* 기본 자동 전환 간격 */
    var MANUAL_DELAY  = 8500;   /* 수동 클릭 후 충분히 읽는 시간 */

    function go(idx) {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (idx + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }

    function clearAuto() {
      if (autoTimer !== null) {
        clearInterval(autoTimer);
        clearTimeout(autoTimer);
        autoTimer = null;
      }
    }

    function startAuto() {
      clearAuto();
      autoTimer = setInterval(function () { go(current + 1); }, AUTO_INTERVAL);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        go(i);
        clearAuto();
        /* 수동 클릭 후 MANUAL_DELAY 만큼 기다린 뒤 자동 전환 재개 */
        autoTimer = setTimeout(function () { startAuto(); }, MANUAL_DELAY);
      });
    });

    startAuto();
  })();

  /* ---------- 위로가기 버튼 ---------- */
  (function () {
    var btn = document.getElementById('scrollTopBtn');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('show', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  })();
})();

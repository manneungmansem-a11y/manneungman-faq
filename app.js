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
     REALTIME APPLICATION TOAST (decorative social proof)
     ========================================================= */
  (function () {
    var toast = document.getElementById('rtToast');
    if (!toast) return;
    if (sessionStorage.getItem('mnm_rtClosed') === '1') { toast.remove(); return; }

    var NAMES = [
      '김○○','이○○','박○○','최○○','정○○','강○○','윤○○','임○○','조○○','한○○',
      '서○○','신○○','오○○','권○○','황○○','안○○','송○○','류○○','전○○','고○○',
      '장○○','유○○','백○○','노○○','하○○','홍○○','마○○','양○○','손○○','민○○',
      '차○○','진○○','원○○','천○○','방○○','공○○','석○○','구○○','나○○','도○○',
      '라○○','명○○','봉○○','엄○○','여○○','연○○','우○○','은○○','자○○','제○○',
      '지○○','채○○','표○○','함○○','허○○','문○○','배○○','남○○','위○○','사○○'
    ];
    var JOBS = [
      '누수탐지','배관설비','보일러·난방','수도설비','밸브교체','온수배관','난방배관','욕실설비','상가설비','기계설비',
      '펌프설비','냉난방설비','배관청소','하수도설비','온수기설치','분배기교체','열교환기','자동제어설비','공조설비','빌딩설비',
      '보일러 수리','수전 교체','하수구 막힘','욕실 수리','수도 배관','전기 수리','배관 누수','보일러 점검','싱크대 수리','변기 막힘',
      '난방 분배기','수전 설치','온수 누수','배관 교체','욕실 설비','주방 수리','수도 누수','보일러 배관','배수관 청소','세면대 수리',
      '샤워기 교체','급수 배관','급탕 배관','펌프 점검','온도조절기','계량기 점검','배관 보수','난방 점검','누수 보수','욕실 배관',
      '주방 배관','보일러 설치','수도 설비','전기 점검','난방 설비','하수 배관','배관 설비','수전 수리','화장실 수리','싱크대 막힘',
      '보일러 교체','배관 진단','난방 누수','수도 공사','욕실 리모델링','주방 설비','누수 검사','밸브 수리','온수기 점검','배관 점검'
    ];
    var TIMES = ['방금 전','1분 전','2분 전','3분 전','4분 전','5분 전','6분 전','7분 전','8분 전','9분 전','10분 전','11분 전','12분 전','13분 전','14분 전','15분 전','16분 전','17분 전','18분 전','19분 전','20분 전','22분 전','25분 전','28분 전','31분 전','35분 전','42분 전','51분 전'];

    var initEl = toast.querySelector('.rt-ava-init');
    var nameEl = toast.querySelector('.rt-name-txt');
    var jobEl = toast.querySelector('.rt-job');
    var timeEl = toast.querySelector('.rt-time');
    var recentKeys = [];
    var hideTimer = null, nextTimer = null, closed = false;
    var realQueue = [];

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function rand(a, b) { return a + Math.random() * (b - a); }

    function nextData() {
      if (realQueue.length) { recentKeys = []; return realQueue.shift(); }
      var n, j, t, key, guard = 0;
      do { n = pick(NAMES); j = pick(JOBS); t = pick(TIMES); key = n + '|' + j; }
      while (recentKeys.indexOf(key) !== -1 && ++guard < 30);
      recentKeys.push(key);
      if (recentKeys.length > 5) recentKeys.shift();
      return { n: n, j: j, t: t, real: false };
    }

    function show() {
      if (closed) return;
      var d = nextData();
      initEl.textContent = d.n.charAt(0);
      nameEl.textContent = d.n;
      jobEl.textContent = '(' + d.j + ')';
      timeEl.textContent = d.t + ' 파트너스 신청 완료';
      toast.classList.toggle('rt-real', !!d.real);
      toast.classList.add('show');
      hideTimer = setTimeout(hide, d.real ? 6200 : 5200);
    }
    function hide() {
      toast.classList.remove('show');
      if (closed) return;
      nextTimer = setTimeout(show, rand(8000, 20000));
    }

    window.mnmPushApplicant = function (maskedName, job) {
      if (closed || !maskedName) return;
      realQueue.push({ n: maskedName, j: job || '설비', t: '방금 전', real: true });
      clearTimeout(nextTimer);
      clearTimeout(hideTimer);
      toast.classList.remove('show');
      nextTimer = setTimeout(show, 700);
    };

    document.getElementById('rtClose').addEventListener('click', function () {
      closed = true;
      clearTimeout(hideTimer); clearTimeout(nextTimer);
      toast.classList.remove('show');
      sessionStorage.setItem('mnm_rtClosed', '1');
      setTimeout(function () { if (toast.parentNode) toast.remove(); }, 550);
    });

    setTimeout(show, rand(3500, 6000));
  })();
})();

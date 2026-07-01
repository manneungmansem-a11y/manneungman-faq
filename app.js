/* =========================================================
   만능맨 파트너스 v2 — interactions
   SPA 탭 전환 방식 (homeView / tabViewContainer 분리)
   ========================================================= */
(function () {
  'use strict';


  /* =========================================================
     SPA 뷰 전환 시스템
     - homeView: 기본 랜딩페이지 전체 스크롤 구조
     - tabViewContainer: 헤더 탭 클릭 시 전환되는 별도 콘텐츠
     ========================================================= */

  /* 탭 이름 ↔ URL 파라미터 매핑 */
  var VIEW_PARAM = {
    '혜택':     'benefits',
    '플랫폼 소개': 'intro',
    '파트너 모집': 'partners',
    '운영 흐름': 'process',
    'FAQ':      'faq',
    '이벤트':   'event'
  };
  var PARAM_VIEW = {};
  Object.keys(VIEW_PARAM).forEach(function (k) { PARAM_VIEW[VIEW_PARAM[k]] = k; });

  var homeView         = document.getElementById('homeView');
  var tabViewContainer = document.getElementById('tabViewContainer');
  var policyView       = document.getElementById('policyView');
  var currentViewName  = null; /* null = 홈 */
  var currentPolicyId  = null;

  /* 헤더 탭 활성 상태 업데이트 */
  function setNavActive(tabName) {
    document.querySelectorAll('.nav-tab').forEach(function (btn) {
      var active = btn.getAttribute('data-tab') === tabName;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.mob-tab-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    document.querySelectorAll('.mqt-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
  }

  /* 홈(기본 랜딩페이지)으로 복귀 */
  function showHome(pushHistory) {
    if (policyView) policyView.classList.remove('active');
    currentPolicyId = null;
    if (homeView) homeView.classList.remove('hidden');
    if (tabViewContainer) tabViewContainer.classList.remove('active');
    setNavActive(null);
    currentViewName = null;
    if (pushHistory !== false) {
      try { history.pushState({ view: null }, '', location.pathname); } catch (e) {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    /* 슬라이더에게 홈 복귀를 알림 — display:none 중 isTransitioning이 묶이는 문제 해소 */
    window.dispatchEvent(new Event('mnm:homeshow'));
  }

  /* 탭 뷰로 전환 */
  function showTab(tabName, pushHistory) {
    if (!tabName) return;
    if (tabName === currentViewName && !currentPolicyId) { closeMobMenu(); return; }
    currentViewName = tabName;
    /* 정책 페이지가 열려있으면 닫기 */
    if (policyView) policyView.classList.remove('active');
    currentPolicyId = null;

    if (homeView) homeView.classList.add('hidden');
    if (tabViewContainer) tabViewContainer.classList.add('active');

    /* 해당 탭 뷰만 표시 */
    document.querySelectorAll('.tab-view').forEach(function (v) {
      v.classList.toggle('active', v.getAttribute('data-view') === tabName);
    });

    /* 새로 표시된 뷰의 reveal 요소 관찰 시작 */
    var activeView = document.querySelector('.tab-view[data-view="' + tabName + '"]');
    if (activeView && revealObserver) {
      activeView.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
        revealObserver.observe(el);
      });
    }

    setNavActive(tabName);
    closeMobMenu();

    if (pushHistory !== false) {
      try {
        var param = VIEW_PARAM[tabName] || encodeURIComponent(tabName);
        history.pushState({ view: tabName }, '', '?view=' + param);
      } catch (e) {}
    }

    window.scrollTo({ top: 0 });
    /* 슬라이더에게 탭 전환을 알림 — homeView가 hidden인 동안 타이머가 계속 돌며
       current가 범위를 넘어서는 것을 방지 */
    window.dispatchEvent(new Event('mnm:tabshow'));
  }

  /* 데스크탑 탭 클릭 */
  document.querySelectorAll('.nav-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showTab(btn.getAttribute('data-tab'));
    });
  });

  /* 모바일 탭 클릭 */
  document.querySelectorAll('.mob-tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showTab(btn.getAttribute('data-tab'));
    });
  });

  /* CTA 카드 빠른 이동 버튼 */
  document.querySelectorAll('.quick-section-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showTab(btn.getAttribute('data-tab'));
    });
  });

  /* 모바일 빠른 탭 메뉴 */
  document.querySelectorAll('.mqt-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showTab(btn.getAttribute('data-tab'));
    });
  });

  /* 로고/브랜드 클릭 = 홈 복귀 */
  document.querySelectorAll('.brand-home-link').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      showHome();
    });
  });

  /* 배너 "자세히 보기" → 이벤트 탭 */
  document.querySelectorAll('[data-tab-link]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      showTab(el.getAttribute('data-tab-link'));
    });
  });

  /* 뒤로/앞으로 가기 */
  window.addEventListener('popstate', function (e) {
    if (e.state && e.state.view) {
      showTab(e.state.view, false);
    } else {
      showHome(false);
    }
  });

  /* =========================================================
     헤더 스크롤 효과
     ========================================================= */
  var header = document.getElementById('header');
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
    var scrollBtn = document.getElementById('scrollTopBtn');
    if (scrollBtn) scrollBtn.classList.toggle('visible', window.scrollY > 300);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* =========================================================
     모바일 사이드 메뉴
     ========================================================= */
  var menuToggle = document.getElementById('menuToggle');
  var mobMenu    = document.getElementById('mobMenu');
  var mobOverlay = document.getElementById('mobOverlay');
  var mobClose   = document.getElementById('mobClose');

  function openMobMenu() {
    if (!mobMenu) return;
    mobMenu.classList.add('open');
    mobOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMobMenu() {
    if (!mobMenu) return;
    mobMenu.classList.remove('open');
    mobOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  if (menuToggle) menuToggle.addEventListener('click', openMobMenu);
  if (mobClose)   mobClose.addEventListener('click', closeMobMenu);
  if (mobOverlay) mobOverlay.addEventListener('click', closeMobMenu);

  /* =========================================================
     위로가기 버튼
     ========================================================= */
  var scrollTopBtn = document.getElementById('scrollTopBtn');
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* =========================================================
     스크롤 reveal 애니메이션
     ========================================================= */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        revealObserver.unobserve(en.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

  /* 홈 뷰의 reveal 요소 관찰 */
  document.querySelectorAll('#homeView .reveal').forEach(function (el) {
    revealObserver.observe(el);
  });

  /* =========================================================
     히어로 카드 슬라이더 (무한 루프)
     ========================================================= */
  var track     = document.getElementById('sliderTrack');
  var dots      = document.querySelectorAll('.slider-dot');
  var prevBtn   = document.getElementById('sliderPrev');
  var nextBtn   = document.getElementById('sliderNext');
  var TOTAL     = dots.length;
  var current   = 1; /* 클론 때문에 1부터 시작 */
  var autoTimer = null;
  var AUTO_DELAY = 5000;
  var isTransitioning = false;

  if (track && TOTAL > 0) {
    /* 첫/마지막 슬라이드 클론 추가 — 자연스러운 무한 루프용 */
    var slides = track.querySelectorAll('.slide');
    var firstClone = slides[0].cloneNode(true);
    var lastClone  = slides[TOTAL - 1].cloneNode(true);
    firstClone.setAttribute('aria-hidden', 'true');
    lastClone.setAttribute('aria-hidden', 'true');
    track.appendChild(firstClone);
    track.insertBefore(lastClone, slides[0]);

    /* 초기 위치: 애니메이션 없이 첫 번째 실제 슬라이드로 */
    track.style.transition = 'none';
    track.style.transform  = 'translateX(-100%)';

    function updateDots(idx) {
      var realIdx = ((idx - 1) % TOTAL + TOTAL) % TOTAL;
      dots.forEach(function (d, i) {
        d.classList.toggle('active', i === realIdx);
        d.setAttribute('aria-selected', i === realIdx ? 'true' : 'false');
      });
    }

    function goToSlide(idx) {
      if (isTransitioning) return;
      isTransitioning = true;
      current = idx;
      track.style.transition = 'transform .5s cubic-bezier(.4,0,.2,1)';
      track.style.transform  = 'translateX(-' + (current * 100) + '%)';
      updateDots(current);
      /* 안전망: display:none으로 transitionend가 오지 않더라도 600ms 뒤 플래그 해제 */
      setTimeout(function () { isTransitioning = false; }, 600);
    }

    /* 클론 끝에 닿으면 실제 슬라이드로 순간이동 */
    track.addEventListener('transitionend', function () {
      isTransitioning = false;
      if (current === 0) {
        track.style.transition = 'none';
        current = TOTAL;
        track.style.transform  = 'translateX(-' + (current * 100) + '%)';
      } else if (current === TOTAL + 1) {
        track.style.transition = 'none';
        current = 1;
        track.style.transform  = 'translateX(-' + (current * 100) + '%)';
      }
    });

    function startAuto() {
      clearInterval(autoTimer);
      autoTimer = setInterval(function () { goToSlide(current + 1); }, AUTO_DELAY);
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goToSlide(current - 1); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goToSlide(current + 1); startAuto(); });

    dots.forEach(function (d) {
      d.addEventListener('click', function () {
        goToSlide(parseInt(d.getAttribute('data-dot'), 10) + 1);
        startAuto();
      });
    });

    /* 터치 스와이프 */
    var touchStartX = 0;
    track.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', function (e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { goToSlide(diff > 0 ? current + 1 : current - 1); startAuto(); }
    }, { passive: true });

    updateDots(1);
    startAuto();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearInterval(autoTimer);
      else startAuto();
    });

    /* 탭 전환 후 홈으로 복귀 시 슬라이더 상태 초기화
       (display:none 중 transitionend 미발화로 isTransitioning이 묶이거나
        current가 유효 범위를 벗어나는 버그 방지) */
    window.addEventListener('mnm:homeshow', function () {
      isTransitioning = false;
      /* current가 [1, TOTAL] 범위를 벗어났을 경우 정규화 */
      current = ((current - 1 + TOTAL) % TOTAL) + 1;
      track.style.transition = 'none';
      track.style.transform  = 'translateX(-' + (current * 100) + '%)';
      updateDots(current);
      startAuto();
    });

    /* 탭 전환 시 타이머 중단 — homeView가 display:none인 동안 current가
       유효 범위(0 ~ TOTAL+1)를 넘어 공백 슬라이드가 표시되는 버그 방지 */
    window.addEventListener('mnm:tabshow', function () {
      clearInterval(autoTimer);
      isTransitioning = false;
    });
  }

  /* =========================================================
     사전등록 모달 (3-step form)
     ========================================================= */
  var formOverlay  = document.getElementById('formOverlay');
  var formArea     = document.getElementById('formArea');
  var successArea  = document.getElementById('successArea');
  var regForm      = document.getElementById('regForm');
  var submitBtn    = document.getElementById('submitBtn');
  var submitErrMsg = document.getElementById('submitErrMsg');
  var dupOverlay   = document.getElementById('dupOverlay');
  var dupClose     = document.getElementById('dupClose');
  var dupTimer     = document.getElementById('dupTimer');

  var DUP_KEY    = 'mnm_v2_last_submit';
  var DUP_GAP_MS = 60 * 1000;

  function openForm() {
    if (!formOverlay) return;
    formOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeForm() {
    if (!formOverlay) return;
    formOverlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-open-form]').forEach(function (el) {
    el.addEventListener('click', openForm);
  });
  document.querySelectorAll('[data-close-form]').forEach(function (el) {
    el.addEventListener('click', function () {
      closeForm();
      setTimeout(function () {
        if (successArea && successArea.style.display === 'block') {
          successArea.style.display = 'none';
          if (formArea) formArea.style.display = 'block';
          if (regForm) regForm.reset();
          document.querySelectorAll('.svc.on').forEach(function (s) { s.classList.remove('on'); });
          var etcRowEl = document.getElementById('etcRow');
          if (etcRowEl) etcRowEl.hidden = true;
          document.querySelectorAll('input[name="referral"]').forEach(function (r) { r.checked = false; });
          var refEtcRowEl = document.getElementById('refEtcRow');
          if (refEtcRowEl) refEtcRowEl.hidden = true;
          if (regForm) regForm.querySelectorAll('.invalid').forEach(function (r) { r.classList.remove('invalid'); });
          goStep(1);
        }
      }, 250);
    });
  });
  if (formOverlay) {
    formOverlay.addEventListener('click', function (e) {
      if (e.target === formOverlay) closeForm();
    });
  }

  /* 스텝 관련 */
  var steps  = document.querySelectorAll('.fstep');
  var stDots = document.querySelectorAll('.st');
  var curStep = 1;

  function goStep(n) {
    curStep = n;
    steps.forEach(function (s) { s.classList.toggle('active', parseInt(s.getAttribute('data-step'), 10) === n); });
    stDots.forEach(function (s) {
      var sn = parseInt(s.getAttribute('data-st'), 10);
      s.classList.toggle('active', sn === n);
      s.classList.toggle('done', sn < n);
    });
  }

  function validateStep(n) {
    var panel = document.querySelector('.fstep[data-step="' + n + '"]');
    if (!panel) return true;
    var valid = true;
    panel.querySelectorAll('.inp[required], select.inp[required]').forEach(function (inp) {
      var row = inp.closest('.field-row');
      var ok = inp.value.trim() !== '';
      if (row) row.classList.toggle('invalid', !ok);
      if (!ok) valid = false;
    });
    panel.querySelectorAll('.field-row').forEach(function (row) {
      var radios = row.querySelectorAll('input[type="radio"]');
      if (!radios.length) return;
      var name = radios[0].name;
      var checked = panel.querySelector('input[name="' + name + '"]:checked');
      var seg = row.querySelector('.seg');
      var referralGrid = row.querySelector('.referral-grid');
      if ((seg || referralGrid) && !checked) {
        row.classList.add('invalid'); valid = false;
      } else if (checked) {
        row.classList.remove('invalid');
      }
    });
    if (n === 2) {
      var selected = panel.querySelectorAll('.svc.on');
      var svcRow = panel.querySelector('#svcGrid');
      if (svcRow) {
        var fr = svcRow.closest('.field-row');
        if (!selected.length) { if (fr) fr.classList.add('invalid'); valid = false; }
        else { if (fr) fr.classList.remove('invalid'); }
      }
      var etcSelected = panel.querySelector('.svc[data-v="기타"].on');
      var etcInput    = document.getElementById('etcInput');
      if (etcSelected && etcInput && !etcInput.value.trim()) {
        var etcRow = document.getElementById('etcRow');
        if (etcRow) etcRow.classList.add('invalid');
        valid = false;
      }
    }
    if (n === 3) {
      var agreeChk = panel.querySelector('input[name="agree"]');
      if (agreeChk && !agreeChk.checked) {
        var fr2 = agreeChk.closest('.field-row');
        if (fr2) fr2.classList.add('invalid');
        valid = false;
      }
      var refEtcRow2  = document.getElementById('refEtcRow');
      var refEtcInput2 = document.getElementById('refEtcInput');
      if (refEtcRow2 && !refEtcRow2.hidden && refEtcInput2 && !refEtcInput2.value.trim()) {
        refEtcRow2.classList.add('invalid'); valid = false;
      }
    }
    return valid;
  }

  document.querySelectorAll('[data-next]').forEach(function (btn) {
    btn.addEventListener('click', function () { if (validateStep(curStep)) goStep(curStep + 1); });
  });
  document.querySelectorAll('[data-prev]').forEach(function (btn) {
    btn.addEventListener('click', function () { if (curStep > 1) goStep(curStep - 1); });
  });

  document.querySelectorAll('.svc').forEach(function (svc) {
    svc.addEventListener('click', function () {
      svc.classList.toggle('on');
      var row = svc.closest('.field-row');
      if (row) row.classList.remove('invalid');
      var etcRow = document.getElementById('etcRow');
      if (etcRow) etcRow.hidden = !document.querySelector('.svc[data-v="기타"].on');
    });
  });

  var refEtcRow = document.getElementById('refEtcRow');
  document.querySelectorAll('input[name="referral"]').forEach(function (r) {
    r.addEventListener('change', function () {
      if (refEtcRow) refEtcRow.hidden = r.value !== '기타';
    });
  });

  /* v1과 동일한 Google Apps Script URL — Google Sheet·관리자페이지 key 구조 유지 */
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyD1yELbOat2_mdO_EzelUtNGtLGSTWvFIBeTI_LTq25lp-nspsLfS6Uo1Jsi25h68s/exec';

  /* 전화번호 자동 하이픈 포맷 */
  var phoneInput = regForm ? regForm.querySelector('[name="phone"]') : null;
  if (phoneInput) {
    phoneInput.addEventListener('input', function (e) {
      var digits = e.target.value.replace(/\D/g, '').slice(0, 11);
      var formatted = '';
      if (digits.startsWith('02')) {
        if (digits.length <= 2)       formatted = digits;
        else if (digits.length <= 5)  formatted = digits.slice(0,2) + '-' + digits.slice(2);
        else if (digits.length <= 9)  formatted = digits.slice(0,2) + '-' + digits.slice(2,5) + '-' + digits.slice(5);
        else                          formatted = digits.slice(0,2) + '-' + digits.slice(2,6) + '-' + digits.slice(6);
      } else if (digits.startsWith('0')) {
        if (digits.length <= 3)       formatted = digits;
        else if (digits.length <= 6)  formatted = digits.slice(0,3) + '-' + digits.slice(3);
        else if (digits.length <= 10) formatted = digits.slice(0,3) + '-' + digits.slice(3,6) + '-' + digits.slice(6);
        else                          formatted = digits.slice(0,3) + '-' + digits.slice(3,7) + '-' + digits.slice(7);
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

  if (regForm) {
    regForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateStep(3)) return;
      try {
        var last = localStorage.getItem(DUP_KEY);
        if (last && (Date.now() - parseInt(last, 10)) < DUP_GAP_MS) {
          showDupModal(Math.ceil((DUP_GAP_MS - (Date.now() - parseInt(last, 10))) / 1000));
          return;
        }
      } catch (ex) {}

      submitBtn.disabled = true;
      submitBtn.textContent = '제출 중...';
      if (submitErrMsg) submitErrMsg.style.display = 'none';

      /* 선택된 서비스 분야 수집 */
      var svcs = [];
      document.querySelectorAll('.svc.on').forEach(function (s) { svcs.push(s.getAttribute('data-v')); });

      var now = new Date();
      var submitTime = now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

      /* 유입경로 — 기타 직접입력 통합 */
      var referralEl = regForm.querySelector('input[name="referral"]:checked');
      var referralVal = referralEl ? referralEl.value : '';
      var refEtcInputEl = document.getElementById('refEtcInput');
      if (referralVal === '기타' && refEtcInputEl && refEtcInputEl.value.trim()) {
        referralVal = '기타 - ' + refEtcInputEl.value.trim();
      }

      /* 서비스분야 — 기타 직접입력 통합 */
      var etcInputEl = document.getElementById('etcInput');
      var svcFinal = svcs.join(', ');
      if (svcs.indexOf('기타') !== -1 && etcInputEl && etcInputEl.value.trim()) {
        svcFinal = svcFinal.replace('기타', '기타(' + etcInputEl.value.trim() + ')');
      }

      /* v1과 동일한 payload key 구조 — Google Sheet·관리자페이지 변경 금지 */
      var payload = {
        '신청일시':         submitTime,
        '이름':             regForm.querySelector('[name="name"]').value.trim(),
        '연락처':           regForm.querySelector('[name="phone"]').value.trim(),
        '이메일':           regForm.querySelector('[name="email"]').value.trim(),
        '활동지역':         regForm.querySelector('[name="region"]').value,
        '사업자구분':       (regForm.querySelector('input[name="bizType"]:checked') || {}).value || '',
        '업체명·상호명':    regForm.querySelector('[name="company"]').value.trim(),
        '서비스분야':       svcFinal,
        '보유자격증':       regForm.querySelector('[name="license"]').value.trim(),
        '경력연수':         regForm.querySelector('[name="career"]').value,
        '긴급출동가능여부': (regForm.querySelector('input[name="emergency"]:checked') || {}).value || '미정',
        '자기소개':         regForm.querySelector('[name="intro"]').value.trim(),
        '추가문의':         regForm.querySelector('[name="inquiry"]').value.trim(),
        '유입경로':         referralVal
      };

      function onSuccess() {
        try { localStorage.setItem(DUP_KEY, String(Date.now())); } catch (ex) {}
        showSuccess();
        submitBtn.disabled = false;
        submitBtn.textContent = '신청서 제출하기';
        /* 실제 신청 완료 토스트 */
        if (typeof window.mnmToastOnRealSignup === 'function') {
          var fakeFormData = { get: function(k) { return k === 'name' ? payload['이름'] : null; } };
          window.mnmToastOnRealSignup(fakeFormData, svcs);
        }
      }

      function onError() {
        submitBtn.disabled = false;
        submitBtn.textContent = '신청서 제출하기';
        if (submitErrMsg) submitErrMsg.style.display = 'block';
      }

      /* no-cors: 응답 내용은 읽을 수 없으나 Apps Script에 정상 전달됨 */
      fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).then(onSuccess).catch(onError);
    });
  }

  function showSuccess() {
    if (formArea)    formArea.style.display = 'none';
    if (successArea) successArea.style.display = 'block';
  }

  function showDupModal(remaining) {
    if (!dupOverlay) return;
    dupOverlay.classList.add('show');
    if (dupTimer) dupTimer.textContent = remaining;
    var t = setInterval(function () {
      remaining -= 1;
      if (dupTimer) dupTimer.textContent = remaining;
      if (remaining <= 0) { clearInterval(t); dupOverlay.classList.remove('show'); }
    }, 1000);
  }

  if (dupClose) {
    dupClose.addEventListener('click', function () { dupOverlay.classList.remove('show'); });
  }

  /* =========================================================
     FAQ 탭 필터 + 검색 (홈 뷰용)
     ========================================================= */
  function initFaqBlock(tabsSelector, searchId, listId, emptyId) {
    var faqTabs   = document.querySelectorAll(tabsSelector + ' .faq-tab');
    var faqSearch = document.getElementById(searchId);
    var faqList   = document.getElementById(listId);
    var faqEmpty  = document.getElementById(emptyId);
    var activeCat = '전체';

    if (!faqList) return;

    function filterFaq() {
      var q = faqSearch ? faqSearch.value.trim().toLowerCase() : '';
      var shown = 0;
      faqList.querySelectorAll('.faq-group').forEach(function (group) {
        var cat = group.getAttribute('data-cat');
        var catMatch = activeCat === '전체' || cat === activeCat;
        var groupShown = 0;
        group.querySelectorAll('.faq-item').forEach(function (item) {
          var text = item.textContent.toLowerCase();
          var match = catMatch && (q === '' || text.indexOf(q) !== -1);
          item.style.display = match ? '' : 'none';
          if (match) { groupShown++; shown++; }
        });
        group.style.display = groupShown > 0 ? '' : 'none';
      });
      if (faqEmpty) faqEmpty.style.display = shown === 0 ? 'block' : 'none';
    }

    faqTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        faqTabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        activeCat = tab.getAttribute('data-cat');
        filterFaq();
      });
    });

    if (faqSearch) faqSearch.addEventListener('input', filterFaq);

    /* FAQ 아코디언 */
    faqList.querySelectorAll('.faq-q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq-item');
        var ans  = item.querySelector('.faq-a');
        var open = item.classList.contains('open');
        var group = item.closest('.faq-group');
        if (group) {
          group.querySelectorAll('.faq-item.open').forEach(function (o) {
            if (o !== item) {
              o.classList.remove('open');
              var a = o.querySelector('.faq-a');
              if (a) a.style.maxHeight = '';
            }
          });
        }
        item.classList.toggle('open', !open);
        if (ans) ans.style.maxHeight = open ? '' : ans.scrollHeight + 'px';
      });
    });

    filterFaq();
  }

  /* 홈 FAQ */
  initFaqBlock('#faqTabsHome', 'faqSearchHome', 'faqListHome', 'faqEmptyHome');

  /* FAQ 탭 뷰 FAQ */
  initFaqBlock('#faqTabsV2', 'faqSearchV2', 'faqListV2', 'faqEmptyV2');

  /* =========================================================
     페이지 로드 시 URL 파라미터 확인
     ========================================================= */
  (function () {
    try {
      var params    = new URLSearchParams(location.search);
      var viewParam = params.get('view');
      if (viewParam) {
        var tabName = PARAM_VIEW[viewParam];
        if (tabName && document.querySelector('.tab-view[data-view="' + tabName + '"]')) {
          history.replaceState({ view: tabName }, '', location.href);
          showTab(tabName, false);
          return;
        }
      }
    } catch (e) {}
    /* 기본: 홈 */
    history.replaceState({ view: null }, '', location.pathname);
  }());

  /* =========================================================
     이벤트 배너 — 하단 sticky 전환 & 닫기
     ========================================================= */
  (function () {
    var topBanner = document.getElementById('eventBanner');
    if (!topBanner) return;

    /* 하단 sticky 배너 생성 (상단 배너 DOM 복제) */
    var bottomBanner = topBanner.cloneNode(true);
    bottomBanner.removeAttribute('id');
    bottomBanner.classList.add('event-banner--bottom');
    bottomBanner.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bottomBanner);

    /* 하단 배너 버튼 이벤트 (클론이라 기존 이벤트 없음) */
    bottomBanner.querySelectorAll('[data-tab-link]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        showTab(el.getAttribute('data-tab-link'));
      });
    });

    var footer = document.querySelector('footer.footer');
    var isTopHidden  = false;
    var isFooterVisible = false;

    function syncBanner() {
      var showBottom = isTopHidden && !isFooterVisible;
      bottomBanner.classList.toggle('visible', showBottom);
      var scrollBtn = document.getElementById('scrollTopBtn');
      if (scrollBtn) scrollBtn.classList.toggle('above-banner', showBottom);
    }

    /* IntersectionObserver로 상단 배너 화면 이탈 감지 */
    if ('IntersectionObserver' in window) {
      var bannerObserver = new IntersectionObserver(function (entries) {
        isTopHidden = !entries[0].isIntersecting;
        syncBanner();
      }, { threshold: 0 });
      bannerObserver.observe(topBanner);

      /* 푸터 진입 감지 */
      if (footer) {
        var footerObserver = new IntersectionObserver(function (entries) {
          isFooterVisible = entries[0].isIntersecting;
          syncBanner();
        }, { threshold: 0 });
        footerObserver.observe(footer);
      }
    } else {
      /* scroll 이벤트 fallback */
      function onBannerScroll() {
        var topRect    = topBanner.getBoundingClientRect();
        var footerRect = footer ? footer.getBoundingClientRect() : null;
        isTopHidden      = topRect.bottom <= 0;
        isFooterVisible  = footerRect ? footerRect.top < window.innerHeight : false;
        syncBanner();
      }
      window.addEventListener('scroll', onBannerScroll, { passive: true });
      onBannerScroll();
    }
  }());


  /* =========================================================
     정책 페이지 전환 시스템 — 푸터 링크(이용약관·마케팅·개인정보·사업자)
     ========================================================= */
  var policyBcText = document.getElementById('policyBcText');

  var POLICY_LABELS = {
    'terms':     '이용약관',
    'marketing': '마케팅동의',
    'privacy':   '개인정보 처리방침',
    'business':  '사업자 정보확인'
  };

  function showPolicyPage(pageId) {
    if (!policyView) return;
    currentPolicyId = pageId;

    /* 기존 뷰 숨김 */
    if (homeView) homeView.classList.add('hidden');
    if (tabViewContainer) tabViewContainer.classList.remove('active');
    setNavActive(null);
    currentViewName = null;

    /* 정책 뷰 표시 */
    policyView.classList.add('active');

    /* 해당 정책 페이지만 표시 */
    policyView.querySelectorAll('.policy-page').forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-policy') === pageId);
    });

    /* 브레드크럼 텍스트 업데이트 */
    if (policyBcText) policyBcText.textContent = POLICY_LABELS[pageId] || pageId;

    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeMobMenu();
  }

  function showMainPage() {
    if (policyView) policyView.classList.remove('active');
    currentPolicyId = null;
    showHome();
  }

  /* 푸터 링크 이벤트 바인딩 */
  document.querySelectorAll('[data-policy-page]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      showPolicyPage(el.getAttribute('data-policy-page'));
    });
  });

  /* 뒤로가기 버튼 바인딩 (breadcrumb + 상단 + 하단) */
  document.querySelectorAll('[data-policy-back]').forEach(function (el) {
    el.addEventListener('click', function () {
      showMainPage();
    });
  });

  /* 햄버거 메뉴 내부 정책 버튼 */
  document.querySelectorAll('.mobile-policy-buttons [data-policy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showPolicyPage(btn.getAttribute('data-policy'));
    });
  });

  /* =========================================================
     파트너 앱 사용 흐름 카드 슬라이더 (appFlow 전용)
     - 기존 히어로 슬라이더(track/current/prevBtn/nextBtn)와 완전 분리
     ========================================================= */
  function initAppFlowSlider() {
    var appFlowSlider = document.querySelector('.app-flow-slider');
    if (!appFlowSlider || appFlowSlider.dataset.initialized === 'true') return;
    appFlowSlider.dataset.initialized = 'true';

    var appFlowTrack   = appFlowSlider.querySelector('.app-flow-track');
    var appFlowSlides  = Array.from(appFlowSlider.querySelectorAll('.app-flow-slide'));
    var appFlowDots    = Array.from(appFlowSlider.querySelectorAll('.app-flow-dots button'));
    var appFlowPrevBtn = appFlowSlider.querySelector('.app-flow-prev');
    var appFlowNextBtn = appFlowSlider.querySelector('.app-flow-next');
    var appFlowTotal   = appFlowSlides.length;

    if (appFlowTotal === 0) return;

    var appFlowIndex      = 0;
    var appFlowAutoTimer  = null;
    var APP_FLOW_DELAY    = 5500;

    function appFlowGoTo(index) {
      appFlowIndex = ((index % appFlowTotal) + appFlowTotal) % appFlowTotal;
      appFlowTrack.style.transform = 'translateX(-' + (appFlowIndex * 100) + '%)';
      appFlowDots.forEach(function (dot, i) {
        var isActive = i === appFlowIndex;
        dot.classList.toggle('active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
    }

    function appFlowStartAuto() {
      clearInterval(appFlowAutoTimer);
      appFlowAutoTimer = setInterval(function () {
        appFlowGoTo(appFlowIndex + 1);
      }, APP_FLOW_DELAY);
    }

    function appFlowPauseAuto() {
      clearInterval(appFlowAutoTimer);
    }

    if (appFlowPrevBtn) {
      appFlowPrevBtn.addEventListener('click', function () {
        appFlowGoTo(appFlowIndex - 1);
        appFlowStartAuto();
      });
    }

    if (appFlowNextBtn) {
      appFlowNextBtn.addEventListener('click', function () {
        appFlowGoTo(appFlowIndex + 1);
        appFlowStartAuto();
      });
    }

    appFlowDots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        appFlowGoTo(i);
        appFlowStartAuto();
      });
    });

    /* 키보드 접근성 */
    appFlowSlider.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { appFlowGoTo(appFlowIndex - 1); appFlowStartAuto(); }
      if (e.key === 'ArrowRight') { appFlowGoTo(appFlowIndex + 1); appFlowStartAuto(); }
    });

    /* 모바일 터치 스와이프 */
    var appFlowTouchStartX = 0;
    appFlowTrack.addEventListener('touchstart', function (e) {
      appFlowTouchStartX = e.touches[0].clientX;
    }, { passive: true });
    appFlowTrack.addEventListener('touchend', function (e) {
      var diff = appFlowTouchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        appFlowGoTo(diff > 0 ? appFlowIndex + 1 : appFlowIndex - 1);
        appFlowStartAuto();
      }
    }, { passive: true });

    /* 탭 전환 시 자동재생 멈춤·재개 */
    window.addEventListener('mnm:tabshow', function () { appFlowPauseAuto(); });
    window.addEventListener('mnm:homeshow', function () { appFlowStartAuto(); });

    /* 페이지 숨김 시 자동재생 멈춤 */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) appFlowPauseAuto();
      else appFlowStartAuto();
    });

    appFlowGoTo(0);
    appFlowStartAuto();
  }

  /* DOMContentLoaded 이후 초기화 (IIFE 내부이므로 즉시 실행) */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppFlowSlider);
  } else {
    initAppFlowSlider();
  }

}());

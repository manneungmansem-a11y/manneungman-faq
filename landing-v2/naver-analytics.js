/* =========================================================
   네이버 광고/웹로그 분석 초기화
   (CSP script-src에서 인라인 스크립트를 없애기 위해 외부 파일로 분리 — 로직은 기존과 동일)
   ========================================================= */
(function () {
  if (!window.wcs_add) window.wcs_add = {};
  if (!window._nasa) window._nasa = {};

  function runNaverWcs(wa, useInflow) {
    if (!window.wcs) return;
    window.wcs_add["wa"] = wa;
    if (useInflow && typeof window.wcs.inflow === "function") {
      window.wcs.inflow();
    }
    if (typeof window.wcs_do === "function") {
      window.wcs_do();
    }
  }

  runNaverWcs("s_a2aa16fb02b", true);
  runNaverWcs("3a993dd337e5b0", false);
})();

/* =========================================================
   motion.js — 사이트 전체 모션
   1) 페이지 이동: 지원 브라우저는 View Transitions(CSS), 그 외는 아래 대체 동작
   2) Motion.swap  : 같은 페이지 안에서 내용이 바뀔 때 부드럽게 교체
   3) Motion.reveal: 스크롤해서 화면에 들어올 때 떠오르기 (data-reveal)
   ※ <head>에서 바로 불러와야 첫 화면이 깜빡이지 않습니다.
   ========================================================= */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduce.matches;

  root.classList.add('motion');

  // 크롬·사파리 최신판은 CSS(@view-transition)만으로 페이지 전환이 됩니다.
  // 파일을 더블클릭해 연(file://) 경우나 미지원 브라우저는 대체 전환을 씁니다.
  const crossDoc = 'onpagereveal' in window && location.protocol !== 'file:';
  if (!crossDoc) {
    root.classList.add('no-vt');

    document.addEventListener('click', e => {
      if (still() || e.defaultPrevented || e.button !== 0 ||
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      // 같은 페이지 안의 #이동은 각 페이지 스크립트가 처리
      if (url.pathname === location.pathname && url.search === location.search) return;
      e.preventDefault();
      root.classList.add('is-leaving');
      setTimeout(() => { location.href = url.href; }, 260);
    });

    // 뒤로가기로 돌아왔을 때 사라진 상태로 남지 않게
    addEventListener('pageshow', e => {
      if (e.persisted) root.classList.remove('is-leaving');
    });
  }

  /* ---------- 같은 페이지 안 내용 교체 ---------- */
  let token = 0;
  function swap(targets, update) {
    const els = [].concat(targets)
      .map(t => typeof t === 'string' ? document.querySelector(t) : t)
      .filter(Boolean);
    const mine = ++token;
    if (still()) { update(); return; }

    els.forEach(el => { el.classList.remove('swap-in'); el.classList.add('swap-out'); });
    setTimeout(() => {
      if (mine !== token) return;          // 빠르게 연달아 눌렀으면 마지막 것만
      update();
      els.forEach((el, i) => {
        el.classList.remove('swap-out');
        el.style.animationDelay = (i * 70) + 'ms';
        void el.offsetWidth;               // 애니메이션 다시 시작
        el.classList.add('swap-in');
      });
    }, 220);
  }

  /* ---------- 스크롤 등장 ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        let n = 0;
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          const el = en.target, delay = n++ * 90;
          el.style.transitionDelay = delay + 'ms';
          el.classList.add('in');
          io.unobserve(el);
          // 등장이 끝나면 표식을 지워 원래 호버·누름 효과가 그대로 살게
          setTimeout(() => { el.removeAttribute('data-reveal'); el.style.transitionDelay = ''; }, delay + 1200);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
    : null;

  function reveal(scope) {
    const els = (scope || document).querySelectorAll('[data-reveal]:not(.in)');
    if (!io || still()) { els.forEach(el => el.classList.add('in')); return; }
    els.forEach(el => io.observe(el));
  }

  /* ---------- 가로 목록에서 선택한 항목을 보이게 (세로 스크롤은 건드리지 않음) ---------- */
  function scrollChip(box, el) {
    if (!box || !el || box.scrollWidth <= box.clientWidth) return;
    const left = box.scrollLeft + el.getBoundingClientRect().left - box.getBoundingClientRect().left - 12;
    box.scrollTo({ left, behavior: still() ? 'auto' : 'smooth' });
  }

  /* ---------- 상단 메뉴 높이를 CSS 변수로 (휴대폰에서 목록을 그 아래에 붙이기 위해) ---------- */
  function measureTop() {
    const top = document.querySelector('.top');
    if (top) root.style.setProperty('--top-h', top.offsetHeight + 'px');
  }
  addEventListener('resize', measureTop);

  document.addEventListener('DOMContentLoaded', () => { measureTop(); reveal(); });

  window.Motion = { swap, reveal, still, scrollChip };
})();

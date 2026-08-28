/* ==========================================================================
   Bright Sparx Electrical & Security Services
   Mobile nav, scroll reveals, split headings, stat counters, wizard form.
   ========================================================================== */
(function () {
  'use strict';

  /* --------------------------------------------------------------------
     Form endpoint.
     Paste the Apps Script URL here after running Skill 03.
     -------------------------------------------------------------------- */
  const ENDPOINT = '';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Marks the document as script-enabled. The reveal start states in the
     stylesheet are scoped to .js, so without this everything renders visible. */
  document.documentElement.classList.add('js');

  /* ====================================================================
     1. Current year in the footer
     ==================================================================== */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ====================================================================
     2. Mobile navigation
     ==================================================================== */
  const burger = document.querySelector('.burger');
  const mobileMenu = document.getElementById('mobile-menu');

  function closeMenu() {
    if (!burger || !mobileMenu) return;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    mobileMenu.classList.remove('is-open');
    document.body.classList.remove('nav-open');
  }

  function openMenu() {
    if (!burger || !mobileMenu) return;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    mobileMenu.classList.add('is-open');
    document.body.classList.add('nav-open');
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      const isOpen = burger.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMenu() : openMenu();
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024) closeMenu();
    });
  }

  /* ====================================================================
     3. Split headings into words for the blur reveal
     ==================================================================== */
  document.querySelectorAll('[data-split]').forEach(function (heading) {
    const source = Array.prototype.slice.call(heading.childNodes);
    const frag = document.createDocumentFragment();
    let i = 0;

    source.forEach(function (node) {
      /* Keep author-placed <br> so headings can be broken onto set lines. */
      if (node.nodeType === 1 && node.tagName === 'BR') {
        frag.appendChild(document.createElement('br'));
        return;
      }
      if (node.nodeType !== 3) { frag.appendChild(node.cloneNode(true)); return; }

      const words = node.textContent.split(/\s+/).filter(Boolean);
      words.forEach(function (word, w) {
        const span = document.createElement('span');
        span.className = 'split-word';
        span.textContent = word;
        span.style.transitionDelay = (i * 55) + 'ms';
        frag.appendChild(span);
        if (w < words.length - 1) frag.appendChild(document.createTextNode(' '));
        i++;
      });
    });

    heading.textContent = '';
    heading.appendChild(frag);
  });

  /* ====================================================================
     3b. Buttons get a second arrow so the hover swap can animate
     ==================================================================== */
  document.querySelectorAll('.btn').forEach(function (btn) {
    const icon = btn.querySelector('.btn__icon');
    if (!icon || btn.querySelector('.btn__icon--end')) return;
    icon.classList.add('btn__icon--start');
    const tail = icon.cloneNode(true);
    tail.classList.remove('btn__icon--start');
    tail.classList.add('btn__icon--end');
    btn.appendChild(tail);
  });

  /* ====================================================================
     4. Scroll reveals
     ==================================================================== */
  const revealTargets = document.querySelectorAll('[data-reveal], [data-split]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealTargets.forEach(function (el) { observer.observe(el); });

    /* Failsafe. Some environments (a backgrounded or non-compositing tab)
       never deliver intersection callbacks. Anything still hidden after a
       few seconds is shown outright so no copy is ever lost. */
    window.setTimeout(function () {
      revealTargets.forEach(function (el) {
        if (!el.classList.contains('is-in')) el.classList.add('is-in');
      });
    }, 2500);
  }

  /* ====================================================================
     4b. Scroll-scrubbed scale, as on the reference project card.
     The card grows from 0.62 to 1 as it travels up through the viewport,
     tied to scroll position rather than firing once.
     ==================================================================== */
  const scrubTargets = document.querySelectorAll('[data-scrub-scale]');

  if (scrubTargets.length) {
    if (reduceMotion) {
      scrubTargets.forEach(function (el) { el.style.transform = 'none'; });
    } else {
      let ticking = false;

      const paint = function () {
        ticking = false;
        scrubTargets.forEach(function (el) {
          const r = el.getBoundingClientRect();
          const vh = window.innerHeight;
          /* 0 when the card's top hits the bottom of the viewport,
             1 once it has risen to roughly a third of the way up. */
          let p = (vh - r.top) / (vh * 0.72);
          p = Math.max(0, Math.min(1, p));
          const eased = 1 - Math.pow(1 - p, 3);
          const scale = 0.62 + (0.38 * eased);
          el.style.transform = 'scale(' + scale.toFixed(4) + ')';
          el.style.opacity = (0.35 + 0.65 * eased).toFixed(3);
        });
      };

      const onScroll = function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(paint);
      };

      scrubTargets.forEach(function (el) {
        el.style.transformOrigin = 'center bottom';
        el.style.willChange = 'transform, opacity';
      });

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      paint();
    }
  }

  /* ====================================================================
     5. Stat counters
     ==================================================================== */
  const counters = document.querySelectorAll('[data-count]');

  function runCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = String(target); return; }

    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(runCounter);
    } else {
      const countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          countObserver.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { countObserver.observe(el); });
    }
  }

  /* ====================================================================
     6. Wizard form
     Works on every .wizard on the page, so the same markup can be used
     on the home page and the contact page.
     ==================================================================== */
  document.querySelectorAll('.wizard').forEach(function (form) {
    const steps = Array.prototype.slice.call(form.querySelectorAll('.wizard__step'));
    if (!steps.length) return;

    const dots = form.querySelectorAll('.wizard__dot');
    const countEl = form.querySelector('[data-wizard-count]');
    const backBtn = form.querySelector('[data-wizard-back]');
    const nextBtn = form.querySelector('[data-wizard-next]');
    const submitBtn = form.querySelector('[data-wizard-submit]');
    const statusEl = form.querySelector('[data-wizard-status]');
    const doneEl = form.querySelector('[data-wizard-done]');
    const answers = {};

    let index = 0;

    function setStatus(message, kind) {
      if (!statusEl) return;
      statusEl.textContent = message || '';
      statusEl.className = 'form-status';
      if (message) {
        statusEl.classList.add('is-visible', kind === 'error' ? 'form-status--error' : 'form-status--ok');
      }
    }

    function render() {
      steps.forEach(function (step, i) {
        step.classList.toggle('is-active', i === index);
      });

      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
        dot.classList.toggle('is-done', i < index);
      });

      if (countEl) countEl.textContent = 'Step ' + (index + 1) + ' of ' + steps.length;

      const isLast = index === steps.length - 1;
      if (backBtn) backBtn.hidden = index === 0;
      if (nextBtn) nextBtn.hidden = isLast;
      if (submitBtn) submitBtn.hidden = !isLast;

      setStatus('');
    }

    function goTo(i) {
      index = Math.max(0, Math.min(steps.length - 1, i));
      render();
      const panel = form.closest('.form-panel') || form;
      const top = panel.getBoundingClientRect().top + window.pageYOffset - 110;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    /* Choice cards: select, then auto advance */
    form.querySelectorAll('[data-choice-group]').forEach(function (group) {
      const key = group.getAttribute('data-choice-group');

      group.querySelectorAll('.choice').forEach(function (choice) {
        choice.addEventListener('click', function () {
          group.querySelectorAll('.choice').forEach(function (c) {
            c.classList.remove('is-selected');
            c.setAttribute('aria-pressed', 'false');
          });
          choice.classList.add('is-selected');
          choice.setAttribute('aria-pressed', 'true');
          answers[key] = choice.getAttribute('data-value');

          if (index < steps.length - 1) {
            window.setTimeout(function () { goTo(index + 1); }, 220);
          }
        });
      });
    });

    if (backBtn) {
      backBtn.addEventListener('click', function () { goTo(index - 1); });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        const current = steps[index];
        const group = current.querySelector('[data-choice-group]');

        if (group && !answers[group.getAttribute('data-choice-group')]) {
          setStatus('Pick an option to continue.', 'error');
          return;
        }
        goTo(index + 1);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const required = form.querySelectorAll('.wizard__step[data-step="' + steps.length + '"] [required]');
      let firstInvalid = null;

      for (let i = 0; i < required.length; i++) {
        if (!required[i].checkValidity()) { firstInvalid = required[i]; break; }
      }

      if (firstInvalid) {
        setStatus('Please check the highlighted fields and try again.', 'error');
        firstInvalid.focus();
        return;
      }

      const payload = {
        service: answers.service || '',
        property: answers.property || '',
        timing: answers.timing || '',
        name: (form.querySelector('[name="name"]') || {}).value || '',
        suburb: (form.querySelector('[name="suburb"]') || {}).value || '',
        phone: (form.querySelector('[name="phone"]') || {}).value || '',
        email: (form.querySelector('[name="email"]') || {}).value || '',
        message: (form.querySelector('[name="message"]') || {}).value || '',
        page: window.location.pathname,
        submittedAt: new Date().toISOString()
      };

      if (!ENDPOINT) {
        setStatus('The form endpoint is not connected yet. Run Skill 03 and paste the Apps Script URL into ENDPOINT at the top of main.js.', 'error');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        const label = submitBtn.querySelector('.btn__text');
        if (label) label.textContent = 'Sending...';
      }
      setStatus('');

      fetch(ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(function () {
          steps.forEach(function (s) { s.classList.remove('is-active'); });
          const nav = form.querySelector('.wizard__nav');
          if (nav) nav.hidden = true;
          const progress = form.querySelector('.wizard__progress');
          if (progress) progress.hidden = true;
          if (countEl) countEl.hidden = true;
          if (doneEl) doneEl.classList.add('is-active');
        })
        .catch(function () {
          setStatus('Something went wrong sending that. Please call 0423 168 780 instead.', 'error');
          if (submitBtn) {
            submitBtn.disabled = false;
            const label = submitBtn.querySelector('.btn__text');
            if (label) label.textContent = 'Send my request';
          }
        });
    });

    render();
  });

})();

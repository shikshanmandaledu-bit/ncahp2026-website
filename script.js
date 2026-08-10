/* ==========================================================================
   NCAHP 2026 — Interaction & Motion Layer
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------------------
     0. CONFIG
  --------------------------------------------------------------------- */
  const CONFERENCE_DATE = new Date('2026-11-02T08:00:00+05:30').getTime();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     1. LOADER — cinematic progress + split-panel exit
  --------------------------------------------------------------------- */
  const loader = document.getElementById('loader');
  const progressBar = document.getElementById('loader-progress-bar');
  const progressNum = document.getElementById('loader-progress-num');
  const loaderSub = document.getElementById('loader-sub');
  const loaderMessages = ['calibrating instruments', 'syncing scientific tracks', 'polishing the auditorium', 'almost ready'];

  let progress = 0;
  let loaderDone = false;
  function setProgress(p) {
    progress = Math.min(100, p);
    if (progressBar) progressBar.style.setProperty('--p', progress + '%');
    if (progressNum) progressNum.textContent = Math.floor(progress) + '%';
    if (loaderSub) loaderSub.textContent = loaderMessages[Math.min(loaderMessages.length - 1, Math.floor((progress / 100) * loaderMessages.length))];
  }
  const progressTimer = setInterval(() => {
    if (loaderDone) return clearInterval(progressTimer);
    setProgress(progress + (progress < 70 ? Math.random() * 9 : Math.random() * 3));
  }, 160);

  function finishLoader() {
    if (loaderDone) return;
    loaderDone = true;
    clearInterval(progressTimer);
    setProgress(100);
    setTimeout(() => {
      loader.classList.add('exiting');
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.classList.add('loaded');
        runIntro();
      }, 750);
    }, 350);
  }

  window.addEventListener('load', () => setTimeout(finishLoader, 500));
  setTimeout(finishLoader, 3600); // hard fallback

  /* ---------------------------------------------------------------------
     2. LENIS SMOOTH SCROLL
  --------------------------------------------------------------------- */
  let lenis;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    lenis.on('scroll', ScrollTrigger && ScrollTrigger.update);
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) {
      gsap.ticker.add((time) => { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }

  // Smooth anchor navigation
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        closeMobileNav();
        if (lenis) lenis.scrollTo(id, { offset: -70 });
        else document.querySelector(id).scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* ---------------------------------------------------------------------
     2b. WORD-BY-WORD SPLIT (no external SplitText dependency)
  --------------------------------------------------------------------- */
  function splitIntoWords(container) {
    // Splits each .line child (or the element itself) into masked word spans.
    const lines = container.querySelectorAll('.line');
    const targets = lines.length ? lines : [container];
    targets.forEach(line => {
      const html = line.innerHTML.trim();
      // Preserve <em> emphasis wrapper if present by splitting on tag-aware boundary
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const frag = document.createDocumentFragment();
      temp.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.textContent.split(' ').filter(Boolean).forEach(word => {
            frag.appendChild(makeWord(word));
          });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          node.textContent.split(' ').filter(Boolean).forEach(word => {
            const w = makeWord(word);
            w.querySelector('.word').style.background = 'linear-gradient(135deg,var(--primary),var(--secondary))';
            w.querySelector('.word').style.webkitBackgroundClip = 'text';
            w.querySelector('.word').style.backgroundClip = 'text';
            w.querySelector('.word').style.color = 'transparent';
            frag.appendChild(w);
          });
        }
      });
      line.innerHTML = '';
      line.appendChild(frag);
    });
    function makeWord(word) {
      const mask = document.createElement('span');
      mask.className = 'word-mask';
      const w = document.createElement('span');
      w.className = 'word';
      w.textContent = word + '\u00A0';
      mask.appendChild(w);
      return mask;
    }
  }
  document.querySelectorAll('[data-split-words]').forEach(splitIntoWords);

  /* ---------------------------------------------------------------------
     3. CURSOR FOLLOWER
  --------------------------------------------------------------------- */
  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');
  if (!reduceMotion && window.matchMedia('(hover:hover)').matches) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; cursorDot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`; });
    function ringLoop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      cursorRing.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(ringLoop);
    }
    ringLoop();
    document.querySelectorAll('a, button, .tilt-card, .prog-head, .acc-head').forEach(el => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovering'));
    });
  } else {
    cursorDot?.remove(); cursorRing?.remove();
  }

  /* ---------------------------------------------------------------------
     4. HEADER SCROLL STATE + MOBILE NAV
  --------------------------------------------------------------------- */
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  const navToggle = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  function closeMobileNav() { navToggle.classList.remove('open'); mobileNav.classList.remove('open'); }
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    mobileNav.classList.toggle('open');
  });

  // Active link highlighting
  const sections = document.querySelectorAll('main section[id], .hero[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  window.addEventListener('scroll', () => {
    let current = 'home';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 140) current = sec.id;
    });
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
  }, { passive: true });

  /* ---------------------------------------------------------------------
     5. COUNTDOWN TIMER
  --------------------------------------------------------------------- */
  const dEl = document.getElementById('cd-days'), hEl = document.getElementById('cd-hours'),
        mEl = document.getElementById('cd-mins'), sEl = document.getElementById('cd-secs');
  function pad(n) { return String(n).padStart(2, '0'); }
  function tickCountdown() {
    const diff = CONFERENCE_DATE - Date.now();
    if (diff <= 0) { dEl.textContent = hEl.textContent = mEl.textContent = sEl.textContent = '00'; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    dEl.textContent = pad(d); hEl.textContent = pad(h); mEl.textContent = pad(m); sEl.textContent = pad(s);
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ---------------------------------------------------------------------
     6. THREE.JS — MOLECULAR / DIAGNOSTIC PARTICLE FIELD
  --------------------------------------------------------------------- */
  (function initThree() {
    const canvas = document.getElementById('bg-canvas');
    if (!window.THREE || !canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 34;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Particle cloud shaped loosely like a double-helix / molecular lattice
    const COUNT = window.innerWidth < 768 ? 260 : 620;
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const t = Math.random() * Math.PI * 2;
      const strand = i % 2 === 0 ? 1 : -1;
      const helixR = 9 + Math.random() * 10;
      const y = (Math.random() - 0.5) * 60;
      const angle = y * 0.25 + (strand * Math.PI * 0.5);
      positions[i * 3] = Math.cos(angle) * helixR * (0.4 + Math.random() * 0.6) + (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * helixR * (0.4 + Math.random() * 0.6) - 10;
      speeds[i] = 0.15 + Math.random() * 0.35;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Soft circular sprite for a glow-dot look
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = spriteCanvas.height = 64;
    const ctx = spriteCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0,174,239,0.9)');
    grad.addColorStop(0.5, 'rgba(0,87,184,0.35)');
    grad.addColorStop(1, 'rgba(0,87,184,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const sprite = new THREE.CanvasTexture(spriteCanvas);

    const material = new THREE.PointsMaterial({
      size: 0.55,
      map: sprite,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.85,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // A few larger "gold" accent nodes
    const accentGeo = new THREE.BufferGeometry();
    const accentCount = 24;
    const accentPos = new Float32Array(accentCount * 3);
    for (let i = 0; i < accentCount; i++) {
      accentPos[i * 3] = (Math.random() - 0.5) * 40;
      accentPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      accentPos[i * 3 + 2] = -10 + (Math.random() - 0.5) * 20;
    }
    accentGeo.setAttribute('position', new THREE.BufferAttribute(accentPos, 3));
    const accentSpriteCanvas = document.createElement('canvas');
    accentSpriteCanvas.width = accentSpriteCanvas.height = 64;
    const actx = accentSpriteCanvas.getContext('2d');
    const agrad = actx.createRadialGradient(32, 32, 0, 32, 32, 32);
    agrad.addColorStop(0, 'rgba(255,213,79,0.95)');
    agrad.addColorStop(1, 'rgba(255,213,79,0)');
    actx.fillStyle = agrad; actx.fillRect(0, 0, 64, 64);
    const accentMat = new THREE.PointsMaterial({
      size: 0.9, map: new THREE.CanvasTexture(accentSpriteCanvas),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8,
    });
    const accentPoints = new THREE.Points(accentGeo, accentMat);
    scene.add(accentPoints);

    let mouseX = 0, mouseY = 0, targetRotY = 0, targetRotX = 0;
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5);
      mouseY = (e.clientY / window.innerHeight - 0.5);
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    let scrollY = 0;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!reduceMotion) {
        points.rotation.y = t * 0.035;
        accentPoints.rotation.y = -t * 0.02;
        targetRotY += (mouseX * 0.3 - targetRotY) * 0.02;
        targetRotX += (mouseY * 0.2 - targetRotX) * 0.02;
        points.rotation.x = targetRotX * 0.3;
        camera.position.x = targetRotY;
        camera.position.y = -scrollY * 0.006 + targetRotX * -1;
        camera.lookAt(0, -scrollY * 0.006, 0);
      }

      renderer.render(scene, camera);
    }
    animate();
  })();

  /* ---------------------------------------------------------------------
     7. GSAP — HERO INTRO + SCROLL REVEALS
  --------------------------------------------------------------------- */
  function runIntro() {
    if (!window.gsap) return;
    if (reduceMotion) {
      gsap.set('.reveal-up, .word', { opacity: 1, y: 0 });
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to('.hero-title .word', { y: '0%', opacity: 1, duration: 1.1, stagger: 0.045 })
      .to('.eyebrow', { opacity: 1, y: 0, duration: 0.7 }, '-=0.85')
      .to('.hero-theme', { opacity: 1, y: 0, duration: 0.7 }, '-=0.6')
      .to('.hero-meta', { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
      .to('.countdown', { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
      .to('.hero-actions', { opacity: 1, y: 0, duration: 0.7 }, '-=0.5');
  }
  // Hero words start off-screen below their mask until the intro timeline runs
  if (window.gsap) gsap.set('.hero-title .word', { y: '110%', opacity: 0 });

  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.utils.toArray('.reveal-up').forEach((el) => {
      // Elements already animated by the hero intro timeline are skipped
      if (el.closest('.hero-content')) return;
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });

    // Stagger children within grids for a nicer cascade
    ['.highlight-grid', '.tracks-grid', '.awards-grid', '.committee-grid-lead', '.committee-grid-joint'].forEach(sel => {
      const grid = document.querySelector(sel);
      if (!grid) return;
      gsap.to(grid.children, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08,
        scrollTrigger: { trigger: grid, start: 'top 85%' },
      });
    });

    // Section kickers slide in + section titles clip-reveal for cinematic per-section entrance
    gsap.utils.toArray('.kicker').forEach(k => {
      gsap.from(k, { opacity: 0, x: -20, duration: 0.7, scrollTrigger: { trigger: k, start: 'top 90%' } });
    });
    gsap.utils.toArray('.section-title').forEach(t => {
      gsap.fromTo(t,
        { clipPath: 'inset(0 0 100% 0)', opacity: 0.4 },
        { clipPath: 'inset(0 0 0% 0)', opacity: 1, duration: 1.1, ease: 'power4.out',
          scrollTrigger: { trigger: t, start: 'top 88%' } });
    });

    // Vertical timeline fill — grows with scroll progress through the section
    const vTimeline = document.querySelector('.v-timeline');
    const vFill = document.getElementById('v-timeline-fill');
    if (vTimeline && vFill) {
      gsap.to(vFill, {
        height: '100%', ease: 'none',
        scrollTrigger: { trigger: vTimeline, start: 'top 65%', end: 'bottom 75%', scrub: 0.6 },
      });
    }

    // Animated counters
    gsap.utils.toArray('.stat-num').forEach(num => {
      const target = +num.dataset.count;
      ScrollTrigger.create({
        trigger: num, start: 'top 90%', once: true,
        onEnter: () => {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: target, duration: 1.6, ease: 'power2.out',
            onUpdate: () => { num.textContent = Math.floor(obj.val); },
          });
        },
      });
    });
  } else {
    // No-JS-animation fallback: just show everything
    document.querySelectorAll('.reveal-up, .word').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    document.querySelectorAll('.stat-num').forEach(n => n.textContent = n.dataset.count);
    const vFill = document.getElementById('v-timeline-fill');
    if (vFill) vFill.style.height = '100%';
  }

  /* ---------------------------------------------------------------------
     7b. HERO MOUSE PARALLAX
  --------------------------------------------------------------------- */
  const heroSection = document.getElementById('hero');
  const heroContentEl = document.getElementById('hero-content');
  if (heroSection && heroContentEl && !reduceMotion && window.gsap) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(heroContentEl, { x: px * 18, y: py * 12, duration: 0.9, ease: 'power2.out' });
      gsap.to('.hero-glow', { x: px * 40, y: py * 30, duration: 1.2, ease: 'power2.out' });
    });
    heroSection.addEventListener('mouseleave', () => {
      gsap.to(heroContentEl, { x: 0, y: 0, duration: 1 });
      gsap.to('.hero-glow', { x: 0, y: 0, duration: 1 });
    });
  }

  /* ---------------------------------------------------------------------
     7c. MAGNETIC BUTTONS
  --------------------------------------------------------------------- */
  if (!reduceMotion && window.matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.35;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0,0)'; });
    });
  }

  /* ---------------------------------------------------------------------
     7d. RIPPLE ON CLICK (all .btn elements)
  --------------------------------------------------------------------- */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const r = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(r.width, r.height) * 1.4;
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - r.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - r.top - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });

  /* ---------------------------------------------------------------------
     7e. 3D TILT + SPOTLIGHT ON CARDS
  --------------------------------------------------------------------- */
  function bindTiltCards(scope) {
    if (reduceMotion || !window.matchMedia('(hover:hover)').matches) return;
    (scope || document).querySelectorAll('.tilt-card:not([data-tilt-bound])').forEach(card => {
      card.setAttribute('data-tilt-bound', '1');
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * 100;
        const py = ((e.clientY - r.top) / r.height) * 100;
        const rx = ((py - 50) / 50) * -6;
        const ry = ((px - 50) / 50) * 6;
        card.style.setProperty('--mx', px + '%');
        card.style.setProperty('--my', py + '%');
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateY(0)';
      });
    });
  }
  bindTiltCards();

  /* ---------------------------------------------------------------------
     8. KEYNOTE SPEAKERS — right-to-left marquee (placeholder cards)
  --------------------------------------------------------------------- */
  const speakersGrid = document.getElementById('speakers-grid');
  if (speakersGrid) {
    const CARD_COUNT = 10; // enough repeats for a smooth, seamless right-to-left loop
    const cardHTML = `
        <div class="speaker-photo">?</div>
        <h3>To Be Announced</h3>
        <p class="speaker-role">Keynote Speaker</p>`;
    for (let i = 0; i < CARD_COUNT * 2; i++) {
      const card = document.createElement('div');
      card.className = 'speaker-card';
      card.innerHTML = cardHTML;
      speakersGrid.appendChild(card);
    }
  }

  /* ---------------------------------------------------------------------
     9. PARTNERS LOGO MARQUEE (real partners; logos where uploaded)
  --------------------------------------------------------------------- */
  const sponsors = [
    { name: 'AIMLTA Delhi State Unit', logo: 'assets/logo-aimlta.png', link: 'https://aimlta.org.in/' },
    { name: 'AIIMS New Delhi', logo: 'assets/logo-aiims.png' },
    { name: 'Shikshan Mandal', logo: 'assets/shikshan-mandal-logo.jpeg', link: 'https://www.shikshanmandal.in/' },
    { name: 'JMLSD Journal', logo: 'assets/jmlsd-logo.png' },
    { name: 'Other Partners — To Be Announced', logo: null },
  ];
  const logoTrack = document.getElementById('logo-track');
  if (logoTrack) {
    [...sponsors, ...sponsors].forEach(s => {
      const el = document.createElement(s.link ? 'a' : 'span');
      el.className = 'logo-item';
      if (s.link) {
        el.href = s.link;
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
      }
      if (s.logo) {
        el.innerHTML = `<img src="${s.logo}" alt="${s.name}" loading="lazy">`;
      } else {
        el.textContent = s.name;
      }
      logoTrack.appendChild(el);
    });
  }

  /* ---------------------------------------------------------------------
     10. LIGHTBOX (kept for potential future use)
  --------------------------------------------------------------------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxInner = document.getElementById('lightbox-inner');
  function openLightbox(svgHTML, caption) {
    lightboxInner.innerHTML = `<div style="max-width:70vw">${svgHTML}<p style="color:#fff;text-align:center;margin-top:14px;font-family:'IBM Plex Mono',monospace;font-size:13px;">${caption}</p></div>`;
    lightbox.classList.add('open');
  }
  document.getElementById('lightbox-close')?.addEventListener('click', () => lightbox.classList.remove('open'));
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('open'); });

  /* ---------------------------------------------------------------------
     10b. AIMLTACON 2024 MOMENTS — auto-rotating photo carousel
     Uploaded photos, kept in original sequence, object-fit:contain so
     nothing is ever cropped.
  --------------------------------------------------------------------- */
  const momentsPhotos = [
    { src: 'assets/moments/moment-1.jpg', alt: 'AIMLTACON 2024 conference moment 1' },
    { src: 'assets/moments/moment-2.jpg', alt: 'AIMLTACON 2024 conference moment 2' },
    { src: 'assets/moments/moment-3.jpg', alt: 'AIMLTACON 2024 conference moment 3' },
    { src: 'assets/moments/moment-4.jpg', alt: 'AIMLTACON 2024 conference moment 4' },
    { src: 'assets/moments/moment-5.jpg', alt: 'AIMLTACON 2024 conference moment 5' },
    { src: 'assets/moments/moment-6.jpg', alt: 'AIMLTACON 2024 conference moment 6' },
  ];
  const momentsTrack = document.getElementById('moments-track');
  const momentsDots = document.getElementById('moments-dots');
  if (momentsTrack && momentsDots) {
    momentsPhotos.forEach((p, i) => {
      const slide = document.createElement('div');
      slide.className = 'moments-slide' + (i === 0 ? ' active' : '');
      slide.innerHTML = `<img src="${p.src}" alt="${p.alt}" loading="lazy">`;
      momentsTrack.appendChild(slide);

      const dot = document.createElement('button');
      dot.className = 'moments-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Go to photo ${i + 1}`);
      dot.addEventListener('click', () => goToMoment(i));
      momentsDots.appendChild(dot);
    });

    const slides = momentsTrack.querySelectorAll('.moments-slide');
    const dots = momentsDots.querySelectorAll('.moments-dot');
    let momentIndex = 0;
    let momentsTimer;

    function goToMoment(i) {
      slides[momentIndex].classList.remove('active');
      dots[momentIndex].classList.remove('active');
      momentIndex = (i + slides.length) % slides.length;
      slides[momentIndex].classList.add('active');
      dots[momentIndex].classList.add('active');
    }
    function nextMoment() { goToMoment(momentIndex + 1); }
    function prevMoment() { goToMoment(momentIndex - 1); }
    function startMomentsAuto() {
      clearInterval(momentsTimer);
      momentsTimer = setInterval(nextMoment, 4500);
    }
    document.getElementById('moments-next')?.addEventListener('click', () => { nextMoment(); startMomentsAuto(); });
    document.getElementById('moments-prev')?.addEventListener('click', () => { prevMoment(); startMomentsAuto(); });

    const momentsCarousel = document.getElementById('moments-carousel');
    momentsCarousel?.addEventListener('mouseenter', () => clearInterval(momentsTimer));
    momentsCarousel?.addEventListener('mouseleave', startMomentsAuto);
    startMomentsAuto();
  }

  /* ---------------------------------------------------------------------
     10c. EXPLORE DELHI — horizontally scrolling landmark gallery
     Real photographs sourced from Wikimedia Commons (CC-licensed),
     external by design per project instructions. Each card links to
     Google Maps for that exact landmark.
  --------------------------------------------------------------------- */
  const delhiLandmarks = [
    {
      name: 'India Gate',
      desc: 'A 42-metre war memorial at the heart of Kartavya Path, honouring soldiers of the Indian Army — especially striking at dusk when it is lit.',
      img: 'https://commons.wikimedia.org/wiki/Special:FilePath/India_Gate_in_New_Delhi_03-2016.jpg?width=800',
      maps: 'https://www.google.com/maps/search/?api=1&query=India+Gate+New+Delhi',
    },
    {
      name: 'Red Fort',
      desc: 'The Mughal-era fortress of red sandstone where India\'s Prime Minister addresses the nation every Independence Day.',
      img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Red-Fort,Delhi.JPG?width=800',
      maps: 'https://www.google.com/maps/search/?api=1&query=Red+Fort+Delhi',
    },
    {
      name: 'Qutub Minar',
      desc: 'A soaring 73-metre sandstone and marble minaret, the tallest brick minaret in the world and a UNESCO World Heritage Site.',
      img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Qutub_Minar,_Delhi,_India.jpg?width=800',
      maps: 'https://www.google.com/maps/search/?api=1&query=Qutub+Minar+Delhi',
    },
    {
      name: "Humayun's Tomb",
      desc: 'A 16th-century Mughal garden-tomb often called a precursor to the Taj Mahal, set within manicured Persian-style gardens.',
      img: "https://commons.wikimedia.org/wiki/Special:FilePath/Tomb_of_Humayun,_Delhi.jpg?width=800",
      maps: 'https://www.google.com/maps/search/?api=1&query=Humayun%27s+Tomb+Delhi',
    },
    {
      name: 'Lotus Temple',
      desc: "A striking Bahá'í House of Worship shaped like a blooming lotus flower, open to people of every faith for quiet reflection.",
      img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Lotus_Temple_in_New_Delhi_03-2016.jpg?width=800',
      maps: 'https://www.google.com/maps/search/?api=1&query=Lotus+Temple+Delhi',
    },
    {
      name: 'Akshardham Temple',
      desc: 'A vast, intricately carved modern Hindu temple complex on the banks of the Yamuna, known for its craftsmanship and evening light show.',
      img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Delhi_Akshardham_Temple.JPG?width=800',
      maps: 'https://www.google.com/maps/search/?api=1&query=Akshardham+Temple+Delhi',
    },
  ];
  const delhiScroller = document.getElementById('delhi-scroller');
  if (delhiScroller) {
    const track = document.createElement('div');
    track.className = 'delhi-track';
    [...delhiLandmarks, ...delhiLandmarks].forEach(l => {
      const card = document.createElement('div');
      card.className = 'delhi-card';
      card.innerHTML = `
        <img src="${l.img}" alt="${l.name}, Delhi" loading="lazy">
        <div class="delhi-card-body">
          <h3>${l.name}</h3>
          <p>${l.desc}</p>
          <a href="${l.maps}" target="_blank" rel="noopener" class="delhi-map-link">View on Google Maps &#8594;</a>
        </div>`;
      track.appendChild(card);
    });
    delhiScroller.appendChild(track);
  }

  /* ---------------------------------------------------------------------
     10d. AIMLTA EXECUTIVE COMMITTEE — slow left-to-right marquee
     Uploaded photos, matched to named members from the supplied ZIP.
  --------------------------------------------------------------------- */
  const execCommittee = [
    { name: 'Dr. Govind Tripathi', role: 'President, AIMLTA', photo: 'assets/exec-committee/govind-tripathi.png' },
    { name: 'Mr. Devendra Prasad', role: 'General Secretary', photo: 'assets/exec-committee/devendra-prasad.png' },
    { name: 'M.N. Yadav', role: 'Central Executive', photo: 'assets/exec-committee/mn-yadav.png' },
    { name: 'Mr. M.H. Khan', role: 'President, Delhi State Unit', photo: 'assets/exec-committee/mh-khan-exec.png' },
    { name: 'Ashok Kumar KEM', role: 'Vice President', photo: 'assets/exec-committee/ashok-kumar-kem.png' },
    { name: 'Kiran Kumari', role: 'Vice President', photo: 'assets/exec-committee/kiran-kumari.jpeg' },
    { name: 'Irshad Ahmed', role: 'Secretary', photo: 'assets/irshad-ahmed.png' },
    { name: 'Saksham Saxena', role: 'Assistant Secretary', photo: 'assets/saksham-saxena.png' },
    { name: 'Jagdish Lal', role: 'Treasurer', photo: 'assets/exec-committee/jagdish-lal.png' },
    { name: 'Shyam Sunder', role: 'Internal Auditor', photo: 'assets/exec-committee/shyam-sunder.png' },
  ];
  const execTrack = document.getElementById('exec-track');
  if (execTrack) {
    [...execCommittee, ...execCommittee].forEach(m => {
      const card = document.createElement('div');
      card.className = 'exec-card';
      card.innerHTML = `
        <div class="exec-photo"><img src="${m.photo}" alt="${m.name}" loading="lazy"></div>
        <h3>${m.name}</h3>
        <p>${m.role}</p>`;
      execTrack.appendChild(card);
    });
  }

  /* ---------------------------------------------------------------------
     11. PROGRAMME TABS + EXPANDABLE ITEMS
  --------------------------------------------------------------------- */
  document.querySelectorAll('.prog-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.prog-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.prog-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`.prog-panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
      ScrollTrigger && ScrollTrigger.refresh();
    });
  });

  document.querySelectorAll('.prog-item').forEach(item => {
    const head = item.querySelector('.prog-head');
    const detail = item.querySelector('.prog-detail');
    if (!head || !detail) return;
    head.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.classList.toggle('open', !isOpen);
      detail.style.maxHeight = isOpen ? null : detail.scrollHeight + 'px';
      ScrollTrigger && ScrollTrigger.refresh();
    });
  });

  /* ---------------------------------------------------------------------
     12. FAQ ACCORDION
  --------------------------------------------------------------------- */
  document.querySelectorAll('.acc-item').forEach(item => {
    const head = item.querySelector('.acc-head');
    const body = item.querySelector('.acc-body');
    head.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.acc-item').forEach(i => { i.classList.remove('open'); i.querySelector('.acc-body').style.maxHeight = null; });
      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  /* ---------------------------------------------------------------------
     13. TOAST
  --------------------------------------------------------------------- */
  document.getElementById('brochure-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    toast('Brochure will be available closer to the conference date.');
  });

  let toastTimer;
  function toast(msg) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      Object.assign(el.style, {
        position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%) translateY(20px)',
        background: '#0A1B2E', color: '#fff', padding: '14px 24px', borderRadius: '100px',
        fontFamily: "'Inter',sans-serif", fontSize: '13.5px', zIndex: 500, opacity: 0,
        transition: 'opacity .4s, transform .4s', boxShadow: '0 20px 50px rgba(10,27,46,0.35)',
      });
      document.body.appendChild(el);
    }
    el.textContent = msg;
    clearTimeout(toastTimer);
    requestAnimationFrame(() => { el.style.opacity = 1; el.style.transform = 'translateX(-50%) translateY(0)'; });
    toastTimer = setTimeout(() => { el.style.opacity = 0; el.style.transform = 'translateX(-50%) translateY(20px)'; }, 3200);
  }

});

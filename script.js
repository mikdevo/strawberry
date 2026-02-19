(function () {
  const cfg = window.PROFILE_CONFIG || {};

  const root = document.documentElement;
  if (cfg.site?.theme) {
    root.style.setProperty('--primary', cfg.site.theme.primary || '#6c5ce7');
    root.style.setProperty('--accent', cfg.site.theme.accent || '#00d1ff');
    root.style.setProperty('--text', cfg.site.theme.text || '#f6f7fb');
    root.style.setProperty('--muted', cfg.site.theme.muted || '#cfd3e3');
  }
  if (cfg.site?.backgroundImage) {
    root.style.setProperty('--site-bg', `url('${cfg.site.backgroundImage}')`);
  }

  (function setupAnimatedBackground() {
    const ab = cfg.site?.animatedBackground;
    if (!ab?.enabled) return;
    document.body.classList.add('animated-bg');
    const container = document.getElementById('bg-animated');
    if (!container) return;
    container.innerHTML = '';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    container.appendChild(canvas);

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let width = 0;
    let height = 0;
    let isSmall = false;
    function resize() {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      isSmall = Math.min(width, height) < 700;
    }
    resize();
    window.addEventListener('resize', resize);

    const primary = getComputedStyle(root).getPropertyValue('--primary').trim() || '#6c5ce7';
    const accent = getComputedStyle(root).getPropertyValue('--accent').trim() || '#00d1ff';

    const particles = [];
    let linkMaxDist = 110;
    let repelRadius = 130;
    const mouse = { x: width / 2, y: height / 2, vx: 0, vy: 0, down: false };
    let lastInput = performance.now();
    let autoPhase = 0;
    let lastMouseX = mouse.x, lastMouseY = mouse.y;

    const onPointerMove = (clientX, clientY) => {
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      mouse.vx = x - lastMouseX;
      mouse.vy = y - lastMouseY;
      mouse.x = lastMouseX = x;
      mouse.y = lastMouseY = y;
      lastInput = performance.now();
    };

    window.addEventListener('pointermove', (e) => onPointerMove(e.clientX, e.clientY), { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length) {
        const t = e.touches[0];
        onPointerMove(t.clientX, t.clientY);
      }
    }, { passive: true });
    window.addEventListener('deviceorientation', (e) => {
      const ax = Math.max(-45, Math.min(45, (e.gamma || 0)));
      const ay = Math.max(-45, Math.min(45, (e.beta || 0)));
      const x = (ax + 45) / 90 * width;
      const y = (ay + 45) / 90 * height;
      onPointerMove(x, y);
    });

    function rand(min, max) { return Math.random() * (max - min) + min; }
    function lerp(a, b, t) { return a + (b - a) * t; }

    linkMaxDist = isSmall ? 80 : 110;
    repelRadius = isSmall ? 90 : 130;
    const particleCount = isSmall ? 60 : 110;
    const rMin = isSmall ? 1.8 : 1.4;
    const rMax = isSmall ? 3.8 : 3.4;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: rand(0, width),
        y: rand(0, height),
        r: rand(rMin, rMax),
        hue: Math.random() < 0.5 ? primary : accent,
        vx: rand(-0.4, 0.4),
        vy: rand(-0.4, 0.4),
      });
    }

    function hexToRgba(hex, alpha) {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!m) return `rgba(108,92,231,${alpha})`;
      const r = parseInt(m[1], 16);
      const g = parseInt(m[2], 16);
      const b = parseInt(m[3], 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, hexToRgba(primary, 0.13));
      g.addColorStop(1, hexToRgba(accent, 0.13));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = isSmall ? 0.9 : 1.1;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < linkMaxDist * linkMaxDist) {
            const alpha = 1 - dist2 / (linkMaxDist * linkMaxDist);
            const base = isSmall ? 0.22 : 0.12;
            ctx.strokeStyle = `rgba(255,255,255,${base * alpha})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grad.addColorStop(0, p.hue);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function step() {
      const strength = isSmall ? 900 : 1200;

      const now = performance.now();
      if (now - lastInput > 1500) {
        autoPhase += 0.008 * (isSmall ? 1.3 : 1);
        const ax = Math.sin(autoPhase) * 0.35 + 0.5; // 0..1
        const ay = Math.cos(autoPhase * 0.9) * 0.35 + 0.5;
        mouse.x = ax * width;
        mouse.y = ay * height;
        mouse.vx *= 0.9;
        mouse.vy *= 0.9;
      }
      for (const p of particles) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < repelRadius * repelRadius) {
          const dist = Math.sqrt(dist2) || 0.001;
          const force = (strength / dist2) + 0.02 * (mouse.vx + mouse.vy);
          p.vx += (dx / dist) * force * 0.02;
          p.vy += (dy / dist) * force * 0.02;
        }

        p.vx = lerp(p.vx, Math.sign(p.vx) * 0.25, 0.002);
        p.vy = lerp(p.vy, Math.sign(p.vy) * 0.25, 0.002);

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
      }
    }

    function loop() {
      step();
      draw();
      requestAnimationFrame(loop);
    }
    loop();
  })();

  const bannerImage = document.getElementById('bannerImage');
  const avatarImage = document.getElementById('avatarImage');
  const displayName = document.getElementById('displayName');
  const rolesContainer = document.getElementById('roles');
  const socialLinks = document.getElementById('socialLinks');
  const card = document.querySelector('.profile-card');
  const avatarWrap = avatarImage ? avatarImage.closest('.avatar-wrapper') : null;
  const bannerWrap = bannerImage ? bannerImage.parentElement : null;

  if (avatarImage) avatarImage.referrerPolicy = 'no-referrer';
  if (bannerImage) bannerImage.referrerPolicy = 'no-referrer';

  function preload(url) {
    return new Promise((resolve, reject) => {
      if (!url) return reject(new Error('No URL'));
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error('Load failed'));
      img.src = url;
    });
  }

  const discordEnabled = !!(cfg.dynamic && cfg.dynamic.discord && cfg.dynamic.discord.enabled);
  if (cfg.user) {
    displayName.textContent = cfg.user.displayName || 'Your Name';
    avatarImage.alt = `${cfg.user.displayName} avatar`;
    bannerImage.alt = `${cfg.user.displayName} banner`;

    if (!discordEnabled) {
      if (cfg.user.avatar) {
        preload(cfg.user.avatar)
          .then((url) => {
            avatarImage.src = url;
            avatarWrap && avatarWrap.classList.remove('fallback');
          })
          .catch(() => {
            if (avatarWrap) avatarWrap.classList.add('fallback');
          });
      } else if (avatarWrap) {
        avatarWrap.classList.add('fallback');
      }

      if (cfg.user.banner) {
        preload(cfg.user.banner)
          .then((url) => {
            bannerImage.src = url;
            bannerWrap && bannerWrap.classList.remove('no-image');
          })
          .catch(() => {
            if (bannerWrap) bannerWrap.classList.add('no-image');
          });
      } else if (bannerWrap) {
        bannerWrap.classList.add('no-image');
      }
    } else {
      if (avatarWrap) avatarWrap.classList.add('fallback');
      if (bannerWrap) bannerWrap.classList.add('no-image');
    }
  }

  if (avatarImage) {
    avatarImage.addEventListener('error', () => {
      if (avatarWrap) avatarWrap.classList.add('fallback');
      avatarImage.removeAttribute('src');
    });
  }
  if (bannerImage) {
    bannerImage.addEventListener('error', () => {
      if (bannerWrap) bannerWrap.classList.add('no-image');
      bannerImage.removeAttribute('src');
    });
  }

  const ICONS = {
    github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2c-3.22.7-3.9-1.55-3.9-1.55a3.07 3.07 0 0 0-1.28-1.69c-1.05-.72.08-.71.08-.71a2.43 2.43 0 0 1 1.78 1.2 2.46 2.46 0 0 0 3.36 1 2.45 2.45 0 0 1 .73-1.55c-2.57-.29-5.27-1.29-5.27-5.75A4.5 4.5 0 0 1 6 7.44a4.18 4.18 0 0 1 .11-3.08s.97-.31 3.18 1.2a10.94 10.94 0 0 1 5.8 0C17.3 4.05 18.27 4.36 18.27 4.36a4.18 4.18 0 0 1 .12 3.08 4.5 4.5 0 0 1 1.2 3.12c0 4.47-2.71 5.45-5.29 5.74a2.74 2.74 0 0 1 .78 2.12v3.14c0 .31.21.67.8.55A11.5 11.5 0 0 0 12 .5Z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.46 6c-.77.34-1.6.57-2.46.67a4.26 4.26 0 0 0 1.86-2.35 8.54 8.54 0 0 1-2.7 1.03 4.26 4.26 0 0 0-7.26 3.88A12.07 12.07 0 0 1 3.16 4.9a4.26 4.26 0 0 0 1.32 5.68 4.23 4.23 0 0 1-1.93-.53v.05a4.26 4.26 0 0 0 3.42 4.17 4.28 4.28 0 0 1-1.92.07 4.26 4.26 0 0 0 3.97 2.95A8.55 8.55 0 0 1 2 19.54a12.06 12.06 0 0 0 6.53 1.91c7.84 0 12.12-6.5 12.12-12.12 0-.18-.01-.36-.02-.54A8.65 8.65 0 0 0 24 5.56a8.42 8.42 0 0 1-2.54.7Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.86v5.49H9.47V9h3.4v1.56h.05c.47-.89 1.62-1.82 3.34-1.82 3.57 0 4.23 2.35 4.23 5.4v6.31ZM5.34 7.43A2.06 2.06 0 1 1 5.35 3a2.06 2.06 0 0 1-.01 4.43ZM7.12 20.45H3.56V9h3.56v11.45Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 7.09A4.91 4.91 0 1 0 12 17a4.91 4.91 0 0 0 0-9.82Zm0 8.1A3.19 3.19 0 1 1 12 8.8a3.19 3.19 0 0 1 0 6.39Zm6.24-8.41a1.15 1.15 0 1 1-2.31 0 1.15 1.15 0 0 1 2.31 0ZM12 2.16c-2.67 0-3 0-4.05.06-1.05.05-1.76.22-2.38.47-.65.25-1.2.58-1.74 1.12-.54.54-.87 1.1-1.12 1.74-.25.62-.42 1.33-.47 2.38C2.16 9 2.16 9.33 2.16 12s0 3 0 4.05c.05 1.05.22 1.76.47 2.38.25.65.58 1.2 1.12 1.74.54.54 1.1.87 1.74 1.12.62.25 1.33.42 2.38.47 1.05.06 1.38.06 4.05.06s3 0 4.05-.06c1.05-.05 1.76-.22 2.38-.47.65-.25 1.2-.58 1.74-1.12.54-.54.87-1.1 1.12-1.74.25-.62.42-1.33.47-2.38.06-1.05.06-1.38.06-4.05s0-3-.06-4.05c-.05-1.05-.22-1.76-.47-2.38-.25-.65-.58-1.2-1.12-1.74-.54-.54-1.1-.87-1.74-1.12-.62-.25-1.33-.42-2.38-.47C15 2.16 14.67 2.16 12 2.16Zm0 1.62c2.62 0 2.94 0 3.98.06.96.05 1.48.2 1.83.33.46.18.79.39 1.13.73.34.34.55.67.73 1.13.13.35.28.87.33 1.83.06 1.04.06 1.36.06 3.98s0 2.94-.06 3.98c-.05.96-.2 1.48-.33 1.83-.18.46-.39.79-.73 1.13-.34.34-.67.55-1.13.73-.35.13-.87.28-1.83.33-1.04.06-1.36.06-3.98.06s-2.94 0-3.98-.06c-.96-.05-1.48-.2-1.83-.33a3.65 3.65 0 0 1-1.13-.73c-.34-.34-.55-.67-.73-1.13-.13-.35-.28-.87-.33-1.83-.06-1.04-.06-1.36-.06-3.98s0-2.94.06-3.98c.05-.96.2-1.48.33-1.83.18-.46.39-.79.73-1.13.34-.34.67-.55 1.13-.73.35-.13.87-.28 1.83-.33 1.04-.06 1.36-.06 3.98-.06Z"/></svg>',
    discord: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/></svg>',
    spotify: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>',
    gamepad: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM11 13H8v3H6v-3H3v-2h3V8h2v3h3v2zm10-4h-2v2h-2v-2h-2V9h2V7h2v2h2v2z"/></svg>',
  };

  function createSocialLink(item) {
    const anchor = document.createElement('a');
    anchor.href = item.url;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer noopener';
    anchor.title = item.title || item.name;
    
    if (item.icon && item.icon.includes('fa-')) {
      // For gaming IDs, show both icon and text
      if (item.name === 'CODM' || item.name === 'PUBG') {
        anchor.innerHTML = `<i class="${item.icon}"></i><span>${item.name}</span>`;
      } else {
        anchor.innerHTML = `<i class="${item.icon}"></i>`;
      }
    } else {
      anchor.innerHTML = ICONS[item.icon] || ICONS.github;
    }
    
    return anchor;
  }

  if (Array.isArray(cfg.socials)) {
    cfg.socials.forEach((s) => {
      const el = createSocialLink(s);
      el.addEventListener('pointerdown', (e) => {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = el.getBoundingClientRect();
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        el.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
      });
      socialLinks.appendChild(el);
    });
  }

  const roles = Array.isArray(cfg.user?.roles) && cfg.user.roles.length ? cfg.user.roles : [];
  const roleIcons = cfg.roles || {};

  function renderRoleBadges() {
    if (!rolesContainer) return;
    rolesContainer.innerHTML = '';
    roles.forEach((role) => {
      const badge = document.createElement('span');
      badge.className = 'role-badge';
      badge.innerHTML = `${roleIcons[role] || ''}<span class="label">${role}</span>`;
      rolesContainer.appendChild(badge);
    });
  }

  renderRoleBadges();

  let targetTiltX = 0;
  let targetTiltY = 0;
  let currentTiltX = 0;
  let currentTiltY = 0;
  let rafId = 0;

  function animateTilt() {
    const easing = 0.1;
    currentTiltX += (targetTiltX - currentTiltX) * easing;
    currentTiltY += (targetTiltY - currentTiltY) * easing;
    document.documentElement.style.setProperty('--tiltX', `${currentTiltX.toFixed(3)}deg`);
    document.documentElement.style.setProperty('--tiltY', `${currentTiltY.toFixed(3)}deg`);
    rafId = requestAnimationFrame(animateTilt);
  }

  function handleTilt(e) {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    targetTiltY = (x - 0.5) * 6;
    targetTiltX = -(y - 0.5) * 6;
  }

  function resetTilt() {
    targetTiltX = 0;
    targetTiltY = 0;
  }

  if (card) {
    animateTilt();
    card.addEventListener('mousemove', handleTilt);
    card.addEventListener('mouseleave', resetTilt);
    requestAnimationFrame(() => card.classList.add('revealed'));
  }

  const discordCfg = cfg.dynamic?.discord;

  function isAnimated(hash) {
    return typeof hash === 'string' && hash.startsWith('a_');
  }

  function buildAvatarUrl(userId, avatarHash, size) {
    if (!userId || !avatarHash) return null;
    const ext = isAnimated(avatarHash) ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}?size=${size || 256}`;
  }

  function buildBannerUrl(userId, bannerHash, size) {
    if (!userId || !bannerHash) return null;
    const ext = isAnimated(bannerHash) ? 'gif' : 'png';
    return `https://cdn.discordapp.com/banners/${userId}/${bannerHash}.${ext}?size=${size || 1024}`;
  }

  function buildBannerUrlWithExt(userId, bannerHash, ext, size) {
    if (!userId || !bannerHash || !ext) return null;
    return `https://cdn.discordapp.com/banners/${userId}/${bannerHash}.${ext}?size=${size || 1024}`;
  }

  function ensureSizeParam(url, desiredSize) {
    try {
      const u = new URL(url);
      u.searchParams.set('size', String(desiredSize));
      return u.toString();
    } catch {
      return url;
    }
  }

  function replaceExtension(url, newExt) {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('.');
      if (parts.length > 1) {
        parts[parts.length - 1] = newExt;
        u.pathname = parts.join('.');
        return u.toString();
      }
    } catch {}
    return url;
  }

  function buildProxyUrls(originalUrl) {
    try {
      const encoded = encodeURIComponent(originalUrl);
      const u = new URL(originalUrl);
      return [
        `https://wsrv.nl/?url=${encoded}`,
        `https://images.weserv.nl/?url=${encodeURIComponent(u.host + u.pathname + u.search)}`,
        `https://cdn.statically.io/img/${u.host}${u.pathname}${u.search}`,
      ];
    } catch {
      return [];
    }
  }

  async function tryLoadAny(urls) {
    const expanded = [];
    for (const u of urls) {
      if (!u) continue;
      expanded.push(u, ...buildProxyUrls(u));
    }
    const tried = new Set();
    for (const url of expanded) {
      if (!url || tried.has(url)) continue;
      tried.add(url);
      try {
        await loadImage(url);
        return url;
      } catch {}
    }
    throw new Error('No banner candidates loaded');
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      if (!url) return reject(new Error('No URL'));
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = reject;
      img.src = url;
    });
  }

  function applyDiscordProfile(profile) {
    if (discordCfg?.overrideDisplayName && profile.displayName) {
      displayName.textContent = profile.displayName;
    }

    const avatarUrl = profile.avatarUrl;
    const bannerUrl = profile.bannerUrl;

    Promise.all([
      avatarUrl ? loadImage(avatarUrl).catch(() => null) : Promise.resolve(null),
      (async () => {
        const candidates = [];
        const desired = (discordCfg?.imageSizes?.banner) || 2048;
        if (bannerUrl) {
          const sized = ensureSizeParam(bannerUrl, desired);
          candidates.push(sized);
          candidates.push(replaceExtension(sized, 'webp'));
          candidates.push(replaceExtension(sized, 'png'));
          candidates.push(replaceExtension(sized, 'jpg'));
          candidates.push(replaceExtension(sized, 'gif'));
        }
        if (profile.bannerHash && profile.userId) {
          const hash = profile.bannerHash;
          const isAnim = isAnimated(hash);
          const exts = isAnim ? ['gif', 'webp', 'png', 'jpg'] : ['webp', 'png', 'jpg'];
          const sizes = [desired, 1024];
          for (const sz of sizes) {
            for (const ext of exts) {
              candidates.push(buildBannerUrlWithExt(profile.userId, hash, ext, sz));
            }
          }
        }
        const unique = Array.from(new Set(candidates.filter(Boolean)));
        try {
          const ok = await tryLoadAny(unique);
          return ok;
        } catch {
          return null;
        }
      })()
    ]).then(([aUrl, bUrl]) => {
      if (aUrl) {
        avatarImage.src = aUrl;
        avatarImage.closest('.avatar-wrapper')?.classList.remove('fallback');
      } else if (!cfg.user?.avatar) {
        avatarImage.closest('.avatar-wrapper')?.classList.add('fallback');
      }
      if (bUrl) {
        bannerImage.src = bUrl;
        bannerImage.onload = () => {
          const naturalW = bannerImage.naturalWidth || 0;
          if (naturalW && naturalW < 1000 && /\/banners\//.test(bUrl)) {
            const url = new URL(bUrl);
            const search = url.searchParams;
            const sizeParam = Number(search.get('size')) || 1024;
            if (sizeParam < 2048) {
              search.set('size', '2048');
              const upgraded = url.toString();
              loadImage(upgraded).then(() => {
                bannerImage.src = upgraded;
              }).catch(() => {});
            }
          }
        };
        bannerImage.parentElement?.classList.remove('no-image');
      } else if (!cfg.user?.banner) {
        bannerImage.parentElement?.classList.add('no-image');
      }
    }).catch(() => {
    });
  }

  async function fetchFromJapi(userId) {
    const url = `https://japi.rest/discord/v1/user/${encodeURIComponent(userId)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('JAPI request failed');
    const json = await res.json();
    const data = json?.data || json;
    if (!data) throw new Error('No data from JAPI');

    const display = data.global_name || data.display_name || data.tag || data.username;
    const avatarHash = data.avatar;
    const bannerHash = data.banner;
    const avatarUrl = data.avatarURL || buildAvatarUrl(userId, avatarHash, discordCfg?.imageSizes?.avatar || 256);
    const bannerUrl = data.bannerURL || buildBannerUrl(userId, bannerHash, discordCfg?.imageSizes?.banner || 1024);
    const accent = data.accent_color || data.banner_color || null;
    return { displayName: display, avatarUrl, bannerUrl, bannerHash, userId, accentColor: accent };
  }

  async function fetchFromLanyard(userId) {
    const url = `https://api.lanyard.rest/v1/users/${encodeURIComponent(userId)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Lanyard request failed');
    const json = await res.json();
    const user = json?.data?.discord_user;
    if (!user) throw new Error('No user from Lanyard');
    const display = user.global_name || user.display_name || user.username;
    const avatarHash = user.avatar;
    const avatarUrl = buildAvatarUrl(userId, avatarHash, discordCfg?.imageSizes?.avatar || 256);
    return { displayName: display, avatarUrl, bannerUrl: null, bannerHash: null, userId };
  }

  async function fetchFromDiscordLookup(userId) {
    const url = `https://discordlookup.mesavirep.xyz/v1/user/${encodeURIComponent(userId)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('DiscordLookup request failed');
    const data = await res.json();
    const display = data.global_name || data.username || data.tag;
    const avatarUrl = data.avatar || null;
    const bannerUrl = data.banner || null;
    return { displayName: display, avatarUrl, bannerUrl, bannerHash: null, userId };
  }

  async function refreshDiscord() {
    if (!discordCfg?.enabled || !discordCfg?.userId) return;
    const baseOrder = Array.isArray(discordCfg.sourcePriority) ? discordCfg.sourcePriority : ['japi', 'lanyard'];
    const order = Array.from(new Set([...baseOrder, 'discordlookup']));
    for (const src of order) {
      try {
        let profile;
        if (src === 'japi') profile = await fetchFromJapi(discordCfg.userId);
        else if (src === 'lanyard') profile = await fetchFromLanyard(discordCfg.userId);
        else if (src === 'discordlookup') profile = await fetchFromDiscordLookup(discordCfg.userId);
        if (profile) {
          applyDiscordProfile(profile);
          return;
        }
      } catch (e) {
      }
    }
  }

  refreshDiscord();
  if (discordCfg?.enabled && discordCfg?.refreshMs) {
    const ms = Math.max(15000, Number(discordCfg.refreshMs) || 60000);
    setInterval(refreshDiscord, ms);
  }
})();
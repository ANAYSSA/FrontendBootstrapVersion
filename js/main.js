document.addEventListener('DOMContentLoaded', () => {
  let audioCtx;
  let currentTone;

  function playUiSound(frequency = 580) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (currentTone) currentTone.stop();
    const tone = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    tone.frequency.value = frequency;
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    tone.connect(gain);
    gain.connect(audioCtx.destination);
    currentTone = tone;
    tone.onended = () => {
      tone.disconnect();
      gain.disconnect();
      if (currentTone === tone) currentTone = null;
    };
    tone.start();
    tone.stop(audioCtx.currentTime + 0.15);
  }

  const soundBtn = document.getElementById('soundBtn');
  soundBtn?.addEventListener('click', () => {
    playUiSound(660);
    soundBtn.style.transform = 'scale(1.1)';
    setTimeout(() => { soundBtn.style.transform = ''; }, 150);
  });

  const clock = document.getElementById('clockText');
  function updateClock() {
    if (clock) clock.textContent = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Almaty', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  }
  updateClock();
  if (clock) setInterval(updateClock, 1000);

  const themeButton = document.getElementById('themeToggleBtn');
  const themeLabel = document.getElementById('themeNameLabel');
  function applyTheme(theme) {
    document.documentElement.dataset.bsTheme = theme;
    if (themeLabel) themeLabel.textContent = theme === 'light' ? 'Day' : 'Night';
    themeButton?.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'night' : 'day'} theme`);
    themeButton?.setAttribute('aria-pressed', String(theme === 'light'));
    document.querySelectorAll('.navbar').forEach(nav => {
      nav.classList.toggle('navbar-dark', theme === 'dark');
    });
  }
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('cinema-theme') || 'dark'; } catch {}
  applyTheme(savedTheme === 'light' ? 'light' : 'dark');
  themeButton?.addEventListener('click', () => {
    const theme = document.documentElement.dataset.bsTheme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try { localStorage.setItem('cinema-theme', theme); } catch {}
  });
  window.addEventListener('storage', event => {
    if (event.key === 'cinema-theme') applyTheme(event.newValue === 'light' ? 'light' : 'dark');
  });

  const navLinks = [...document.querySelectorAll('.navbar-nav .nav-link')];
  navLinks.forEach(link => link.addEventListener('keydown', event => {
    const current = navLinks.indexOf(document.activeElement);
    let next;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown': next = (current + 1) % navLinks.length; break;
      case 'ArrowLeft':
      case 'ArrowUp': next = (current - 1 + navLinks.length) % navLinks.length; break;
      default: return;
    }
    event.preventDefault();
    navLinks[next].focus();
  }));

  const stars = document.querySelectorAll('#cinemaStarRating .star-item');
  const ratingText = document.getElementById('ratingFeedback');
  stars.forEach(star => {
    star.setAttribute('role', 'button');
    star.setAttribute('tabindex', '0');
    star.setAttribute('aria-label', `Rate ${star.dataset.value} out of 5`);
    star.setAttribute('aria-pressed', 'false');
    star.addEventListener('click', () => {
      const rating = Number(star.dataset.value);
      playUiSound(720);
      stars.forEach(item => {
        item.classList.toggle('active', Number(item.dataset.value) <= rating);
        item.setAttribute('aria-pressed', String(item === star));
      });
      star.style.transform = 'scale(1.35)';
      setTimeout(() => { star.style.transform = ''; }, 180);
      if (ratingText) ratingText.textContent = `You rated this experience ${rating} / 5 stars. Thank you!`;
    });
    star.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        star.click();
      }
    });
  });

  const cinemaInfo = {
    name: '404 Cinema',
    highlights: ['4K Dual-Laser IMAX', 'Dolby Atmos 64-Ch', 'VIP Electric Recliners'],
    getInfo() { return `${this.name} features ${this.highlights.length} premium cinema technologies`; }
  };
  const highlights = document.getElementById('dynamicHighlights');
  if (highlights) {
    for (let i = 0; i < cinemaInfo.highlights.length; i++) {
      const badge = document.createElement('span');
      badge.className = 'badge bg-dark border border-secondary text-warning';
      badge.textContent = cinemaInfo.highlights[i];
      highlights.appendChild(badge);
    }
  }
  const summary = document.getElementById('cinemaInfoSummary');
  if (summary) summary.textContent = cinemaInfo.getInfo();

  const accordionHeaders = document.querySelectorAll('.cinema-accordion-header');
  function setAccordion(header, open) {
    const item = header.parentElement;
    const body = item.querySelector('.cinema-accordion-body');
    item.classList.toggle('active', open);
    header.setAttribute('aria-expanded', String(open));
    body.style.maxHeight = open ? `${body.scrollHeight}px` : '';
    body.setAttribute('aria-hidden', String(!open));
    const icon = header.querySelector('.accordion-icon');
    if (icon) icon.style.transform = open ? 'rotate(180deg)' : '';
  }
  accordionHeaders.forEach((header, index) => {
    const body = header.parentElement.querySelector('.cinema-accordion-body');
    body.id = body.id || `faq-answer-${index}`;
    header.setAttribute('aria-controls', body.id);
    setAccordion(header, false);
    header.addEventListener('click', () => {
      const open = header.getAttribute('aria-expanded') !== 'true';
      accordionHeaders.forEach(other => setAccordion(other, other === header && open));
    });
  });
  window.addEventListener('resize', () => {
    accordionHeaders.forEach(header => {
      if (header.getAttribute('aria-expanded') === 'true') setAccordion(header, true);
    });
  });

  const modal = document.getElementById('cinemaModal');
  let modalTrigger;
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('show');
    document.body.style.overflow = '';
    modalTrigger?.focus();
    modal.setAttribute('aria-hidden', 'true');
  }
  document.querySelectorAll('.js-open-modal').forEach(button => {
    button.addEventListener('click', event => {
      if (!modal) return;
      event.preventDefault();
      modalTrigger = button;
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => document.getElementById('regName')?.focus());
    });
  });
  document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', event => {
    if (!modal?.classList.contains('show')) return;
    if (event.key === 'Escape') closeModal();
    if (event.key !== 'Tab') return;
    const controls = [...modal.querySelectorAll('button, input, a[href], select, textarea, [tabindex="0"]')]
      .filter(control => !control.disabled && control.offsetParent !== null);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
});

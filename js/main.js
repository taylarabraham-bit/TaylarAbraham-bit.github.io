const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Theme toggle: follows the system until the visitor picks one, then remembers it.
const toggle = document.getElementById('theme-toggle');

if (toggle) {
  toggle.addEventListener('click', () => {
    const current =
      root.dataset.theme ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    const next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch (e) {
      // Private windows can refuse storage; the toggle still works for this visit.
    }
  });
}

// Ticket machine: the main navigation. Its links are plain anchors, so the page works
// with no script. The script adds the printed ticket, the phone menu and the sound.
const machine = document.getElementById('machine');

if (machine) {
  const menuButton = machine.querySelector('.machine-toggle');
  const roll = machine.querySelector('.machine-roll');
  const soundButton = document.getElementById('sound-toggle');
  const narrow = window.matchMedia('(max-width: 62rem)'); // same width as css/style.css
  let orderNumber = 0;
  let audio;

  // Self-check: every key must point at a section that exists.
  roll.querySelectorAll('a[href^="#"]').forEach((a) => {
    console.assert(document.querySelector(a.hash), 'Ticket machine key has no section:', a.hash);
  });

  // Sound is off until the visitor turns it on, then remembered.
  const soundOn = () => soundButton.getAttribute('aria-pressed') === 'true';
  try {
    if (localStorage.getItem('sound') === 'on') soundButton.setAttribute('aria-pressed', 'true');
  } catch (e) {}

  // A thermal printer's buzz: a quiet low square wave, chopped into nine short steps
  // to match the nine steps the paper feeds in.
  const buzz = () => {
    if (!soundOn()) return;
    audio = audio || new AudioContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const start = audio.currentTime;
    osc.type = 'square';
    osc.frequency.value = 110;
    gain.gain.value = 0;
    for (let step = 0; step < 9; step++) {
      gain.gain.setValueAtTime(0.04, start + step * 0.05);
      gain.gain.setValueAtTime(0, start + step * 0.05 + 0.03);
    }
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.45);
  };

  soundButton.addEventListener('click', () => {
    const on = !soundOn();
    soundButton.setAttribute('aria-pressed', on);
    try {
      localStorage.setItem('sound', on ? 'on' : 'off');
    } catch (e) {}
    buzz();
  });

  // Wide screens: a small ticket feeds out of the slot, hangs, then drops away.
  // It is decoration only; the link itself does the scrolling.
  const print = (label) => {
    const old = machine.querySelector('.printout');
    if (old) old.remove();
    const out = document.createElement('div');
    out.className = 'printout';
    out.setAttribute('aria-hidden', 'true');
    const slip = document.createElement('p');
    slip.className = 'paper';
    const order = document.createElement('small');
    order.textContent = `Order ${String(++orderNumber).padStart(3, '0')}`;
    slip.append(order, `→ ${label}`);
    out.append(slip);
    slip.addEventListener('animationend', () => out.remove());
    machine.append(out);
    buzz();
  };

  // Small screens: the roll is one long ticket listing every section.
  const setOpen = (open) => {
    machine.classList.toggle('open', open);
    roll.classList.toggle('paper', open);
    menuButton.setAttribute('aria-expanded', open);
    if (open) buzz();
  };

  menuButton.addEventListener('click', () => setOpen(!machine.classList.contains('open')));
  narrow.addEventListener('change', () => setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && machine.classList.contains('open')) {
      setOpen(false);
      menuButton.focus();
    }
  });

  roll.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    if (narrow.matches) setOpen(false);
    else if (link.hash && !reduceMotion) print(link.textContent);
  });
}

// Videos only download once they scroll into view, and never autoplay for
// visitors who asked for reduced motion (they keep the poster frame).
const videos = document.querySelectorAll('video.lazy-video');

if (videos.length && !reduceMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          if (!target.src) target.src = target.dataset.src;
          target.play().catch(() => {});
        } else {
          target.pause();
        }
      });
    },
    { threshold: 0.35 }
  );
  videos.forEach((video) => observer.observe(video));
}

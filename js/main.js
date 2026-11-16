// Theme toggle: follows the system until the visitor picks one, then remembers it.
const root = document.documentElement;
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

// Videos only download once they scroll into view, and never autoplay for
// visitors who asked for reduced motion (they keep the poster frame).
const videos = document.querySelectorAll('video.lazy-video');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

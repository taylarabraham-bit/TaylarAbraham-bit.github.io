// Dish videos stay as still posters until asked for, so the page loads fast.
// The banner plays when it scrolls into view; each dish plays on hover, focus or tap.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function start(video) {
  if (!video.src) video.src = video.dataset.src;
  video.play().catch(() => {});
}

const banner = document.querySelector('.k-hero-video');
if (banner && !reduceMotion && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) start(banner);
    else banner.pause();
  }).observe(banner);
}

const canHover = window.matchMedia('(hover: hover)').matches;

document.querySelectorAll('.dish video').forEach((video) => {
  video.tabIndex = 0;
  if (canHover) {
    video.addEventListener('focus', () => start(video));
    video.addEventListener('blur', () => video.pause());
    video.addEventListener('pointerenter', () => start(video));
    video.addEventListener('pointerleave', () => video.pause());
  } else {
    // Touch screens have no hover: a tap toggles playback.
    video.addEventListener('click', () => (video.paused ? start(video) : video.pause()));
  }
});

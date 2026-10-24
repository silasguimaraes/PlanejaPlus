import { initRibbonGlow } from './ribbonGlow.js';

const authWrapper = document.getElementById('auth-bg-field');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (authWrapper && !reducedMotion) {
  initRibbonGlow(authWrapper, {
    background: '#f7f8ff',
    color1: '#ffffff',
    color2: '#5667d9',
    size: 134,
    speed: 50,
    angle: -180,
    hover: 100,
    reach: 240,
  });
}

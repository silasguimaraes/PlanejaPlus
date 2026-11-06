const apiHostname = window.location.hostname || 'localhost';
// O Live Server do VS Code usa 5500 por padrao; a API local usa 3000.
const apiPort = window.location.port === '5500' ? '3000' : window.location.port || '3000';
const apiProtocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
const ipv4Parts = window.location.hostname.split('.').map(Number);
const isPrivateIpv4 = ipv4Parts.length === 4
  && ipv4Parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
  && (
    ipv4Parts[0] === 10
    || (ipv4Parts[0] === 172 && ipv4Parts[1] >= 16 && ipv4Parts[1] <= 31)
    || (ipv4Parts[0] === 192 && ipv4Parts[1] === 168)
  );

window.API_BASE_URL = `${apiProtocol}//${apiHostname}:${apiPort}/api`;
window.PUBLIC_REGISTRATION_ENABLED = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  || isPrivateIpv4;

if (!window.PUBLIC_REGISTRATION_ENABLED) {
  document.querySelectorAll('[data-public-registration]').forEach((link) => {
    link.hidden = true;
  });
}
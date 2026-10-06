// Firebase web configs for O.L.Y.M.P.U.S. These values are not secrets: the olympus server function decides access.
// Fill each in from Firebase console → Project settings → Your apps → Web app (docs/RUNBOOK.md, step 2).
const PROJECTS = {
  TEST: null,  // olympus-test
  LIVE: null,  // olympus-live
};
const host = location.hostname;
export const ENV = /^(localhost|127\.0\.0\.1)$/.test(host) || host.startsWith('olympus-test') ? 'TEST' : 'LIVE';
export const firebaseConfig = PROJECTS[ENV];
export const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
export const REGION = 'asia-southeast1';
/* each company domain signs in one way (the server checks it too, functions/lib/identity.js) */
export const SIGNIN_DOMAINS = { 'olympianict.com': 'google', 'olympian-tech.com': 'link' };
export const domainOf = (em) => { const m = /^[^@\s]+@([^@\s]+)$/.exec(String(em || '').trim().toLowerCase()); return m ? m[1] : ''; };

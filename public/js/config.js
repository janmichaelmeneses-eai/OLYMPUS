// Firebase web configs for O.L.Y.M.P.U.S. These values are not secrets: the olympus server function decides access.
// Fill each in from Firebase console → Project settings → Your apps → Web app (docs/RUNBOOK.md, step 2).
const PROJECTS = {
  TEST: {  // olympus-8d388
    apiKey: 'AIzaSyDAROoJoT2aUcwoP3WM1HR1bmt_IVVr-9A',
    authDomain: 'olympus-8d388.firebaseapp.com',
    projectId: 'olympus-8d388',
    storageBucket: 'olympus-8d388.firebasestorage.app',
    messagingSenderId: '1028231305120',
    appId: '1:1028231305120:web:149eea95e5a03c7cd0b6c5',
  },
  LIVE: null,  // olympus-live
};
const host = location.hostname;
export const ENV = /^(localhost|127\.0\.0\.1)$/.test(host) || host.startsWith('olympus-8d388') ? 'TEST' : 'LIVE';
export const firebaseConfig = PROJECTS[ENV];
export const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
export const REGION = 'asia-southeast1';
/* each company domain signs in one way (the server checks it too, functions/lib/identity.js) */
export const SIGNIN_DOMAINS = { 'olympianict.com': 'google', 'olympian-tech.com': 'link' };
export const domainOf = (em) => { const m = /^[^@\s]+@([^@\s]+)$/.exec(String(em || '').trim().toLowerCase()); return m ? m[1] : ''; };

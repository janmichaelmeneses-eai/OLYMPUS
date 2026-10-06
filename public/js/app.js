/* O.L.Y.M.P.U.S: one sign-in for every Olympian system. */
import { ENV, firebaseConfig, FIREBASE_SDK, REGION, SIGNIN_DOMAINS, domainOf } from './config.js';

const $ = (s) => document.querySelector(s);
const LINK_EMAIL = 'olympus.linkEmail';
const view = $('#view');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const store = { get: (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } }, set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* private window */ } } };

function show(html) { view.innerHTML = html; }
function message(text, kind = 'warn') { const m = $('#msg'); if (m) { m.textContent = text; m.className = 'msg ' + kind; m.hidden = !text; } }

async function boot() {
  $('#env').textContent = ENV === 'TEST' ? 'Test environment' : '';
  if (!firebaseConfig) return show('<p class="msg warn">This site is not connected to Firebase yet. See docs/RUNBOOK.md.</p>');
  const [{ initializeApp }, A, F] = await Promise.all([
    import(`${FIREBASE_SDK}/firebase-app.js`), import(`${FIREBASE_SDK}/firebase-auth.js`), import(`${FIREBASE_SDK}/firebase-functions.js`),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const call = F.httpsCallable(F.getFunctions(app, REGION), 'olympus');
  const api = async (data) => (await call(data)).data;

  if (A.isSignInWithEmailLink(auth, location.href)) {
    let email = store.get(LINK_EMAIL);
    if (!email) email = (window.prompt('Confirm the email address the link was sent to') || '').trim();
    try { await A.signInWithEmailLink(auth, email, location.href); }
    catch (e) { signInScreen(A, auth, friendly(e)); return; }
    finally { store.set(LINK_EMAIL, ''); history.replaceState(null, '', location.pathname); }
  }

  A.onAuthStateChanged(auth, async (user) => {
    if (!user) return signInScreen(A, auth);
    show('<p class="muted">Checking your account…</p>');
    try { launcher(A, auth, api, await api({ action: 'whoami' })); }
    catch (e) { await A.signOut(auth); signInScreen(A, auth, friendly(e)); }
  });
}

function signInScreen(A, auth, error = '') {
  show(`<form id="si" class="card" novalidate>
      <h2>Sign in</h2>
      <p class="muted">Use your company email. We'll pick the right way to sign you in.</p>
      <label for="em">Work email</label>
      <input id="em" type="text" inputmode="email" autocomplete="email" placeholder="name@olympianict.com" value="${esc(store.get(LINK_EMAIL))}">
      <button class="btn primary" type="submit">Continue</button>
      <p id="msg" class="msg" role="alert" hidden></p>
      <p class="hint">@olympianict.com: Google sign-in. @olympian-tech.com: a one-time link by email.</p>
    </form>`);
  if (error) message(error);
  $('#si').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const email = $('#em').value.trim().toLowerCase();
    const how = SIGNIN_DOMAINS[domainOf(email)] || (domainOf(email) === 'gmail.com' ? 'google' : '');
    if (!how) return message('Use your @olympianict.com or @olympian-tech.com email.');
    const btn = ev.submitter || $('#si button'); btn.disabled = true;
    try {
      if (how === 'google') {
        const p = new A.GoogleAuthProvider(), params = { prompt: 'select_account', login_hint: email };
        if (domainOf(email) === 'olympianict.com') params.hd = 'olympianict.com';
        p.setCustomParameters(params);
        await A.signInWithPopup(auth, p);
      } else {
        await A.sendSignInLinkToEmail(auth, email, { url: location.origin + location.pathname, handleCodeInApp: true });
        store.set(LINK_EMAIL, email);
        message(`Check your inbox at ${email} and open the sign-in link on this device.`, 'ok');
      }
    } catch (e) { message(friendly(e)); } finally { btn.disabled = false; }
  });
}

function launcher(A, auth, api, me) {
  show(`<section>
      <div class="who"><span>Signed in as <b>${esc(me.email)}</b></span><button id="out" class="btn">Sign out</button></div>
      <h2>Your systems</h2>
      <div class="tiles">${me.apps.map((a) => `
        <button class="tile" data-app="${esc(a.id)}" ${a.available ? '' : 'disabled'}>
          <b>${esc(a.name)}</b><span>${esc(a.about)}</span>${a.available ? '' : '<em>Not available here yet</em>'}
        </button>`).join('')}</div>
      <p id="msg" class="msg" role="alert" hidden></p>
      <p class="hint">Each system still decides what you can do. If it says you're not enrolled, ask its administrator.</p>
    </section>`);
  $('#out').addEventListener('click', () => A.signOut(auth));
  view.querySelectorAll('.tile').forEach((t) => t.addEventListener('click', async () => {
    t.disabled = true; message('Opening…', 'ok');
    try { location.assign((await api({ action: 'open', app: t.dataset.app })).url); }
    catch (e) { message(friendly(e)); t.disabled = false; }
  }));
}

function friendly(e) {
  const code = (e && e.code) || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'Sign-in was cancelled.';
  if (code === 'auth/invalid-action-code' || code === 'auth/expired-action-code') return 'That sign-in link has expired or was already used. Ask for a new one.';
  if (code === 'auth/operation-not-allowed') return 'This sign-in method is not turned on yet. Ask the administrator.';
  return (e && e.message ? String(e.message).replace(/^Firebase: /, '') : 'Something went wrong. Try again.');
}

boot().catch((e) => show(`<p class="msg warn">${esc(friendly(e))}</p>`));

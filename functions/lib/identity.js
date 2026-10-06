'use strict';
/* Who may use O.L.Y.M.P.U.S, and how each person must have signed in.
 * olympianict.com is Google Workspace, so Google only. olympian-tech.com mail is forwarded by Cloudflare Email Routing
 * (or hosted elsewhere) and has no Google identity behind it, so the one-time email link only (Firebase reports it as
 * "password"). The owner's account signs in with Google. Same rules as VALKYRIE, Z.E.U.S and HERMES (CR-016). */
const DOMAINS = { 'olympianict.com': 'google.com', 'olympian-tech.com': 'password' };
const OWNERS = ['janmichaelmeneses@gmail.com'];

const normEmail = (e) => String(e || '').trim().toLowerCase();
const domainOf = (e) => { const m = /^[^@\s]+@([^@\s]+)$/.exec(normEmail(e)); return m ? m[1] : ''; };
const isOwner = (e) => OWNERS.includes(normEmail(e));
const expectedProvider = (e) => (isOwner(e) ? 'google.com' : DOMAINS[domainOf(e)] || null);

class Refusal extends Error {
  constructor(message, code = 'permission-denied') { super(message); this.code = code; }
}

/* The verified email of the person behind a decoded ID token, or a Refusal. */
function checkIdentity(token) {
  if (!token || !token.email || token.email_verified !== true) throw new Refusal('Sign in with a verified email first.', 'unauthenticated');
  const email = normEmail(token.email);
  const want = expectedProvider(email);
  if (!want) throw new Refusal('Use your @olympianict.com or @olympian-tech.com email.', 'unauthenticated');
  const provider = token.firebase && token.firebase.sign_in_provider;
  if (provider !== want) {
    throw new Refusal(want === 'google.com' ? 'Sign in with Continue with Google using your company account.' : 'Sign in with the one-time email link.', 'unauthenticated');
  }
  return email;
}

module.exports = { DOMAINS, OWNERS, Refusal, normEmail, domainOf, isOwner, expectedProvider, checkIdentity };

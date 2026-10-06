'use strict';
/* Opening a system for someone already signed in to O.L.Y.M.P.U.S.
 * - @olympianict.com and the owner: the system's own "Continue with Google" (it only accepts Google for them), so the
 *   answer is just the address, with the email as a hint. Google's own session makes that one tap.
 * - @olympian-tech.com: O.L.Y.M.P.U.S has already checked the mailbox with its email link, so it signs the person into
 *   the system directly with a custom token marked { olympus: true }, minted with that system's service account key.
 *   Each system accepts such a token only for @olympian-tech.com (TRUSTED_CUSTOM in its env.js). The token rides in the
 *   address's #fragment, which browsers never send to a server, and the system removes it on arrival. */
const { APPS } = require('./apps');
const { Refusal, domainOf } = require('./identity');

const CLAIM = 'olympus';
const TOKEN_DOMAINS = ['olympian-tech.com'];

/* auth: (projectId) => a firebase-admin Auth for that system's project, or null when no key is configured */
async function handover({ email, appId, env, auth }) {
  const app = APPS[appId];
  if (!app) throw new Refusal('Unknown system.', 'invalid-argument');
  const target = app[env];
  if (!target) throw new Refusal(app.name + ' is not available here yet.', 'failed-precondition');
  if (!TOKEN_DOMAINS.includes(domainOf(email))) {
    return { mode: 'google', url: target.url + '#olympus-hint=' + encodeURIComponent(email) };
  }
  const a = auth(target.project);
  if (!a) throw new Refusal(app.name + ' is not linked to O.L.Y.M.P.U.S yet. Ask the Super Admin to add its key.', 'failed-precondition');
  let user;
  try { user = await a.getUserByEmail(email); } catch (e) {
    if (e && e.code !== 'auth/user-not-found') throw e;
    user = await a.createUser({ email, emailVerified: true });
  }
  if (user.disabled) throw new Refusal('Your account is disabled in ' + app.name + '.', 'permission-denied');
  if (!user.emailVerified) user = await a.updateUser(user.uid, { emailVerified: true });  // the mailbox was just proven here
  const token = await a.createCustomToken(user.uid, { [CLAIM]: true });
  return { mode: 'token', url: target.url + '#olympus=' + encodeURIComponent(token) };
}

module.exports = { handover, CLAIM, TOKEN_DOMAINS };

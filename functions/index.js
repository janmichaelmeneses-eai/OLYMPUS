'use strict';
/* O.L.Y.M.P.U.S server: who am I, which systems exist, and the handover into one of them. */
const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const { checkIdentity, Refusal } = require('./lib/identity');
const { envName, listApps } = require('./lib/apps');
const { handover } = require('./lib/handover');

admin.initializeApp();
/* JSON object: { "<system project id>": <that project's service account key JSON>, ... }. Never in git. */
const SYSTEM_SERVICE_ACCOUNTS = defineSecret('SYSTEM_SERVICE_ACCOUNTS');

const targets = new Map();
function targetAuth(projectId) {
  if (targets.has(projectId)) return targets.get(projectId);
  let keys = {};
  try { keys = JSON.parse(SYSTEM_SERVICE_ACCOUNTS.value() || '{}'); } catch { logger.error('SYSTEM_SERVICE_ACCOUNTS is not valid JSON'); }
  const key = keys[projectId];
  const auth = key ? admin.initializeApp({ credential: admin.credential.cert(key), projectId }, 'sys-' + projectId).auth() : null;
  targets.set(projectId, auth);
  return auth;
}

exports.olympus = onCall({ region: 'asia-southeast1', secrets: [SYSTEM_SERVICE_ACCOUNTS], enforceAppCheck: false }, async (req) => {
  const env = envName();
  try {
    const email = checkIdentity(req.auth && req.auth.token);
    const action = req.data && req.data.action;
    if (action === 'whoami') return { email, env, apps: listApps(env) };
    if (action === 'open') {
      const appId = String((req.data && req.data.app) || '');
      const out = await handover({ email, appId, env, auth: targetAuth });
      await admin.firestore().collection('handovers').add({ at: new Date().toISOString(), email, app: appId, mode: out.mode, env });
      return out;
    }
    throw new Refusal('Unknown action.', 'invalid-argument');
  } catch (e) {
    if (e instanceof Refusal) throw new HttpsError(e.code, e.message);
    logger.error('olympus failed', e);
    throw new HttpsError('internal', 'Something went wrong. Try again.');
  }
});

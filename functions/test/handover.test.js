'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { checkIdentity, Refusal } = require('../lib/identity');
const { handover } = require('../lib/handover');
const { listApps } = require('../lib/apps');

const tok = (email, provider, verified = true) => ({ email, email_verified: verified, firebase: { sign_in_provider: provider } });

test('each domain signs in one way', () => {
  assert.equal(checkIdentity(tok('Ana@OlympianICT.com', 'google.com')), 'ana@olympianict.com');
  assert.equal(checkIdentity(tok('ben@olympian-tech.com', 'password')), 'ben@olympian-tech.com');
  assert.equal(checkIdentity(tok('janmichaelmeneses@gmail.com', 'google.com')), 'janmichaelmeneses@gmail.com');
  assert.throws(() => checkIdentity(tok('ana@olympianict.com', 'password')), Refusal);
  assert.throws(() => checkIdentity(tok('ben@olympian-tech.com', 'google.com')), Refusal);
  assert.throws(() => checkIdentity(tok('janmichaelmeneses@gmail.com', 'password')), Refusal);
  assert.throws(() => checkIdentity(tok('x@gmail.com', 'google.com')), Refusal);
  assert.throws(() => checkIdentity(tok('ben@olympian-tech.com', 'password', false)), Refusal);
  assert.throws(() => checkIdentity(tok('ben@olympian-tech.com', 'custom')), Refusal);
  assert.throws(() => checkIdentity(null), Refusal);
});

function fakeAuth(users = {}) {
  const calls = [];
  return {
    calls,
    async getUserByEmail(email) { if (users[email]) return users[email]; const e = new Error('nf'); e.code = 'auth/user-not-found'; throw e; },
    async createUser(p) { calls.push(['create', p]); return (users[p.email] = { uid: 'u-' + p.email, email: p.email, emailVerified: p.emailVerified }); },
    async updateUser(uid, p) { calls.push(['update', uid, p]); return { uid, emailVerified: true }; },
    async createCustomToken(uid, claims) { calls.push(['token', uid, claims]); return 'TOKEN-' + uid; },
  };
}

test('olympianict.com is sent to the system with an email hint, no token', async () => {
  const a = fakeAuth();
  const r = await handover({ email: 'ana@olympianict.com', appId: 'zeus', env: 'LIVE', auth: () => a });
  assert.equal(r.mode, 'google');
  assert.equal(r.url, 'https://zeus-oict.web.app/#olympus-hint=ana%40olympianict.com');
  assert.equal(a.calls.length, 0);
});

test('olympian-tech.com gets a marked custom token for an existing user', async () => {
  const a = fakeAuth({ 'ben@olympian-tech.com': { uid: 'b1', emailVerified: true } });
  const r = await handover({ email: 'ben@olympian-tech.com', appId: 'hermes', env: 'TEST', auth: (p) => (p === 'olympian-pms-test' ? a : null) });
  assert.equal(r.mode, 'token');
  assert.equal(r.url, 'https://olympian-pms-test.web.app/#olympus=TOKEN-b1');
  assert.deepEqual(a.calls, [['token', 'b1', { olympus: true }]]);
});

test('olympian-tech.com user is created verified when missing, or marked verified', async () => {
  const a = fakeAuth();
  await handover({ email: 'new@olympian-tech.com', appId: 'valkyrie', env: 'TEST', auth: () => a });
  assert.deepEqual(a.calls[0], ['create', { email: 'new@olympian-tech.com', emailVerified: true }]);
  const b = fakeAuth({ 'old@olympian-tech.com': { uid: 'o1', emailVerified: false } });
  await handover({ email: 'old@olympian-tech.com', appId: 'valkyrie', env: 'TEST', auth: () => b });
  assert.deepEqual(b.calls[0], ['update', 'o1', { emailVerified: true }]);
});

test('refusals: unknown system, not on this environment, no key, disabled user', async () => {
  const a = fakeAuth({ 'off@olympian-tech.com': { uid: 'x', emailVerified: true, disabled: true } });
  await assert.rejects(handover({ email: 'ben@olympian-tech.com', appId: 'nope', env: 'TEST', auth: () => a }), /Unknown system/);
  await assert.rejects(handover({ email: 'ben@olympian-tech.com', appId: 'valkyrie', env: 'LIVE', auth: () => a }), /not available here yet/);
  await assert.rejects(handover({ email: 'ben@olympian-tech.com', appId: 'zeus', env: 'TEST', auth: () => null }), /not linked/);
  await assert.rejects(handover({ email: 'off@olympian-tech.com', appId: 'zeus', env: 'TEST', auth: () => a }), /disabled/);
});

test('launcher lists every system with availability', () => {
  assert.deepEqual(listApps('LIVE').map((a) => [a.id, a.available]), [['valkyrie', false], ['zeus', true], ['hermes', true]]);
});

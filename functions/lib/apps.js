'use strict';
/* The systems O.L.Y.M.P.U.S opens. Each one is its own Firebase project with its own enrolment and roles: O.L.Y.M.P.U.S
 * only proves who the person is, and the system decides what they may do (or refuses them). A system with no address
 * for an environment is shown as "not available yet" there. */
const APPS = {
  valkyrie: {
    name: 'V.A.L.K.Y.R.I.E', about: 'Fleet: vehicles, drivers, work orders',
    TEST: { project: 'oict-fleet-ops', url: 'https://oict-fleet-ops.web.app/' },
    LIVE: null,
  },
  zeus: {
    name: 'Z.E.U.S', about: 'Purchasing: requisitions and approvals',
    TEST: { project: 'ars-portal-test-5uyl3', url: 'https://ars-portal-test-5uyl3.web.app/' },
    LIVE: { project: 'zeus-oict', url: 'https://zeus-oict.web.app/' },
  },
  hermes: {
    name: 'H.E.R.M.E.S', about: 'People: KPIs and performance reviews',
    TEST: { project: 'olympian-pms-test', url: 'https://olympian-pms-test.web.app/' },
    LIVE: { project: 'olympian-pms-live', url: 'https://olympian-pms-live.web.app/' },
  },
};

/* Only these projects are TEST; any other project (a new LIVE one included) is LIVE. */
const TEST_PROJECTS = ['olympus-8d388'];
const projectId = () => process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || (JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId) || '';
function envName() {
  const p = projectId();
  if (p) return TEST_PROJECTS.includes(p) ? 'TEST' : 'LIVE';
  return String(process.env.OLYMPUS_ENV || 'LIVE').toUpperCase() === 'TEST' ? 'TEST' : 'LIVE';
}

/* What the launcher shows: every system, with whether it is reachable in this environment. */
const listApps = (env) => Object.entries(APPS).map(([id, a]) => ({ id, name: a.name, about: a.about, available: !!a[env] }));

module.exports = { APPS, TEST_PROJECTS, envName, listApps };

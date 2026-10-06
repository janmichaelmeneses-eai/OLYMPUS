# O.L.Y.M.P.U.S runbook

## 1. Create the Firebase project (once per environment)
1. https://console.firebase.google.com → **Add project**: TEST is `olympus-8d388` (created 2026-10-06); LIVE will be `olympus-live`.
   Only `olympus-8d388` is TEST (`TEST_PROJECTS` in `functions/lib/apps.js`); any other project is LIVE.
2. Upgrade to the **Blaze** plan (server functions and Secret Manager need it). Set a budget alert.
3. **Firestore Database → Create database**, production mode, location **asia-southeast1**.
4. **Authentication → Sign-in method**: turn on **Google**, and **Email/Password** with **Email link (passwordless
   sign-in)**. Under **Settings**, keep one account per email address and turn on email enumeration protection.
5. **Project settings → Your apps → Web app**: register a web app and copy its config into `PROJECTS.TEST` (or `LIVE`)
   in `public/js/config.js`. Copy `.firebaserc.example` to `.firebaserc`.

## 2. Link each system (its service account key)
O.L.Y.M.P.U.S signs @olympian-tech.com people into a system with a key from that system's own project. Whoever holds
one of these keys can sign in to that system as any @olympian-tech.com person, so they live only in Secret Manager.

For each system project (TEST: `oict-fleet-ops`, `ars-portal-test-5uyl3`, `olympian-pms-test`):
1. Google Cloud console for that project → **IAM & Admin → Service accounts → Create**: name `olympus-handover`,
   role **Firebase Authentication Admin**.
2. Open it → **Keys → Add key → JSON**. The file downloads to your computer.

Put the keys into one file, keyed by project id, outside any git folder (for example `~/Projects/Dev-Setup/Secrets/`):
```json
{ "oict-fleet-ops": { ...first key file... }, "ars-portal-test-5uyl3": { ... }, "olympian-pms-test": { ... } }
```
Then store it and delete the local copies:
```bash
npx firebase-tools functions:secrets:set SYSTEM_SERVICE_ACCOUNTS --data-file ~/Projects/Dev-Setup/Secrets/olympus-system-keys.json
```
To add or rotate a key later: set the secret again with the new file, then redeploy the function. Delete the old key in
the system's service account.

A system without a key shows "not linked to O.L.Y.M.P.U.S yet" for @olympian-tech.com people; @olympianict.com
people are unaffected.

## 3. Deploy
```bash
cd functions && npm install && npm test && cd ..
npx firebase-tools deploy --only functions,hosting,firestore
```
The address is `https://olympus-8d388.web.app` (TEST). Each system's website must include the O.L.Y.M.P.U.S handover
(`#olympus=` and `#olympus-hint=`) and its server must accept `olympus: true` tokens (CR-016 follow-up, merged).

## 4. Adding a system
Add it to `APPS` in `functions/lib/apps.js` with its TEST and LIVE project ids and addresses, add its key to the
secret, accept `olympus: true` tokens for @olympian-tech.com on its server (`TRUSTED_CUSTOM`), and handle the two
address fragments on its website.

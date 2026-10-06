# O.L.Y.M.P.U.S

One sign-in for every Olympian system. People sign in once with their company email, then open V.A.L.K.Y.R.I.E,
Z.E.U.S or H.E.R.M.E.S from one page.

| Email | Signs in to O.L.Y.M.P.U.S with | Opening a system |
|---|---|---|
| @olympianict.com | Continue with Google (company accounts only) | The system's own Google sign-in, with the email filled in; Google's session makes it one tap |
| @olympian-tech.com | One-time email link | Signed straight in with a custom token marked `olympus: true` |
| Owner account | Continue with Google | As @olympianict.com |

Each system stays its own Firebase project with its own enrolment, roles and Super Admin. O.L.Y.M.P.U.S only proves
who the person is; the system still refuses anyone it hasn't enrolled.

## How it fits together

```
Browser (public/)                       O.L.Y.M.P.U.S Firebase project (TEST: olympus-test · LIVE: olympus-live)
 ├─ Firebase Auth: Google or email link ─▶ ID token
 └─ olympus callable ──────────────────▶ functions/index.js (Node 22, asia-southeast1)
                                           ├─ lib/identity.js  each domain signs in one way (same rules as the systems)
                                           ├─ lib/apps.js      the systems and their TEST/LIVE addresses
                                           └─ lib/handover.js  olympian-tech.com: custom token minted with the
                                                                system's service account key (SYSTEM_SERVICE_ACCOUNTS secret)
                                         Firestore: handovers log, written by the function only; browsers have no access
```

The custom token travels in the address's `#olympus=` fragment, which browsers never send to a server; the system's
page removes it as soon as it arrives. Custom tokens expire after one hour.

## Run the tests

```bash
cd functions && npm install && npm test
```

Setup, keys and deploy: [docs/RUNBOOK.md](docs/RUNBOOK.md).

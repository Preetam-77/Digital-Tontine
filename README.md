# Tontine: rotating savings circles on Lightning

A non-custodial digital tontine. Each round, members pay the round's winner directly over Lightning. The app only coordinates and verifies proof of payment (the payment preimage), so there is no treasurer to trust and no pool to steal.

## Run
```
npm test          # protocol tests (Node 20+, no dependencies)
docker compose up --build   # MERN app on http://localhost:8080
# or locally: cd server && npm i && npm start ; cd client && npm i && npm run dev
```
Demo uses simulated Lightning payments (`MOCK_LN=1`). Press Cotiser, then "Tester un faux reçu" to see a forged proof rejected. MongoDB is storage only: truth is the protocol replay, and unique indexes block duplicate receipts.

## Layout
- `packages/protocol`: validation, preimage proof, verifiable lottery, ledger rules (tested)
- `server`: Express + MongoDB (Mongoose) API; replays stored receipts through the protocol on every read
- `client`: React (Vite) UI, FR + draft Wolof
- `apps/web`: earlier single-file demo, no dependencies
- `docs/threat-model.md`

## Status
Done: protocol core, 6 passing tests, demo UI. Not yet: real NWC payments (NIP-47), Nostr relay ledger (signed events), AI reminder bot, offline service worker.
Wolof strings are a draft and must be reviewed by a native speaker.

## Metrics to track
Active circles, payout success rate, time to first payment, default rate.

## Next
1. NWC budget-capped connections with Alby Hub or Breez SDK
2. Publish receipts as Nostr events and verify signatures
3. Reminder bot with human-reviewed Wolof templates
4. Mobile-money off-ramp (XOF), SMS/USSD access, real-group pilot

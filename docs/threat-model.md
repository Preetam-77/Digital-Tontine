# Threat model (v0.1)
| Threat | Mitigation |
|---|---|
| Operator steals funds | Pass-through model: members pay the round winner directly. No custody. |
| Fake receipt | `sha256(preimage) == paymentHash`, amount and payer checked (`Ledger.addReceipt`). |
| Duplicate or replayed receipt | Keyed by (round, payer); payment hash reuse rejected. |
| Rigged payout order | `lotteryOrder` derived from public inputs plus a future Bitcoin block hash. |
| Member defaults after payout | `reliability()`, `eligibleForPayout()` admin rule; deposits planned for v2. |
| Leaked NWC string | Planned: per-circle budget-capped connection with expiry. |
| Prompt injection | AI helper (planned) is read-only: no keys, no payment tools. |
| PII leakage | Only pubkeys and amounts are handled. No phone numbers. |
| Bad input | Schema validation on every circle and receipt. |
## Known gaps
Nostr event signature verification (use nostr-tools, Schnorr/BIP-340) and real NWC are not wired yet.

// Tontine protocol core: validation, preimage proof, verifiable lottery, ledger.
// Zero dependencies (node:crypto only).
import { createHash } from "node:crypto";

export const KINDS = { CIRCLE: "tontine.circle", ROUND: "tontine.round", RECEIPT: "tontine.receipt" };
const HEX = (n) => new RegExp(`^[0-9a-f]{${n}}$`);
export const sha256hex = (data, isHex = false) =>
  createHash("sha256").update(isHex ? Buffer.from(data, "hex") : data).digest("hex");

/** Anyone can check proof of payment: sha256(preimage) must equal the payment hash. */
export function verifyPreimage(preimageHex, paymentHashHex) {
  if (!HEX(64).test(preimageHex) || !HEX(64).test(paymentHashHex)) return false;
  return sha256hex(preimageHex, true) === paymentHashHex;
}

const fail = (m) => { throw new Error("invalid: " + m); };
const isPk = (p) => typeof p === "string" && HEX(64).test(p);

export function validateCircle(c) {
  if (!c || typeof c !== "object") fail("circle");
  if (typeof c.id !== "string" || !/^[a-z0-9-]{3,40}$/.test(c.id)) fail("id");
  if (typeof c.name !== "string" || c.name.length < 1 || c.name.length > 60) fail("name");
  if (!Array.isArray(c.members) || c.members.length < 2 || c.members.length > 50) fail("members");
  if (new Set(c.members).size !== c.members.length || !c.members.every(isPk)) fail("member pubkeys");
  if (!Number.isInteger(c.amountSats) || c.amountSats < 1 || c.amountSats > 10_000_000) fail("amountSats");
  if (!["weekly", "biweekly", "monthly"].includes(c.schedule)) fail("schedule");
  return c;
}

export function validateReceipt(r) {
  if (!r || typeof r !== "object") fail("receipt");
  if (!Number.isInteger(r.round) || r.round < 1) fail("round");
  if (!isPk(r.payer)) fail("payer");
  if (!Number.isInteger(r.amountSats) || r.amountSats < 1) fail("amount");
  if (!HEX(64).test(r.paymentHash || "")) fail("paymentHash");
  if (!HEX(64).test(r.preimage || "")) fail("preimage");
  return r;
}

/** Verifiable lottery: order derived from public inputs, so nobody (not even the bot) can rig it.
 *  beacon = a value unknown at circle creation, e.g. a pre-agreed future Bitcoin block hash. */
export function lotteryOrder(circleId, members, beacon) {
  const arr = [...members].sort();
  let counter = 0;
  const next = (max) => {
    for (;;) { // rejection sampling avoids modulo bias
      const v = parseInt(sha256hex(`${circleId}|${beacon}|${counter++}`).slice(0, 8), 16);
      if (v < 0x100000000 - (0x100000000 % max)) return v % max;
    }
  };
  for (let i = arr.length - 1; i > 0; i--) { const j = next(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

/** Ledger: rebuilt from events. The bot is NOT the source of truth; anyone can replay this. */
export class Ledger {
  constructor(circle, order) {
    this.circle = validateCircle(circle);
    if (order.length !== circle.members.length || !order.every((m) => circle.members.includes(m))) fail("order");
    this.order = order;
    this.receipts = new Map(); // key: round|payer
  }
  winnerOf(round) { return this.order[round - 1]; }
  payersOf(round) { return this.circle.members.filter((m) => m !== this.winnerOf(round)); }

  addReceipt(r) {
    validateReceipt(r);
    if (r.round > this.order.length) fail("round out of range");
    if (r.payer === this.winnerOf(r.round)) fail("winner does not pay own round");
    if (!this.circle.members.includes(r.payer)) fail("payer not a member");
    if (r.amountSats !== this.circle.amountSats) fail("wrong amount");
    if (!verifyPreimage(r.preimage, r.paymentHash)) fail("preimage does not match payment hash");
    const key = `${r.round}|${r.payer}`;
    if (this.receipts.has(key)) fail("duplicate receipt");
    for (const x of this.receipts.values()) if (x.paymentHash === r.paymentHash) fail("payment hash reused");
    this.receipts.set(key, r);
    return true;
  }
  roundStatus(round) {
    const payers = this.payersOf(round);
    const paid = payers.filter((p) => this.receipts.has(`${round}|${p}`));
    const missing = payers.filter((p) => !paid.includes(p));
    return { round, winner: this.winnerOf(round), paid, missing, complete: missing.length === 0 };
  }
  /** Admin rule: a member who missed an earlier round is not eligible for payout. */
  eligibleForPayout(pubkey, upToRound) {
    for (let r = 1; r < upToRound; r++)
      if (this.winnerOf(r) !== pubkey && !this.receipts.has(`${r}|${pubkey}`)) return false;
    return true;
  }
  reliability(pubkey, upToRound) {
    let due = 0, paid = 0;
    for (let r = 1; r <= upToRound; r++)
      if (this.winnerOf(r) !== pubkey) { due++; if (this.receipts.has(`${r}|${pubkey}`)) paid++; }
    return due ? paid / due : 1;
  }
}

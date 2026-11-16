import test from "node:test";
import assert from "node:assert/strict";
import { Ledger, lotteryOrder, verifyPreimage, sha256hex } from "../packages/protocol/index.js";

const pk = (c) => c.repeat(64);
const members = ["a", "b", "c", "d"].map(pk);
const circle = { id: "marche-sandaga", name: "Tontine Sandaga", members, amountSats: 5000, schedule: "weekly" };
const mkReceipt = (round, payer, seed = round + payer) => {
  const preimage = sha256hex(seed);
  return { round, payer, amountSats: 5000, preimage, paymentHash: sha256hex(preimage, true) };
};
const ledger = () => new Ledger(circle, lotteryOrder(circle.id, members, "blockhash-123"));

test("preimage proof", () => {
  const r = mkReceipt(1, pk("b"));
  assert.ok(verifyPreimage(r.preimage, r.paymentHash));
  assert.ok(!verifyPreimage(r.preimage, sha256hex("x")));
});
test("lottery is deterministic and a permutation", () => {
  const o1 = lotteryOrder("x", members, "b1"), o2 = lotteryOrder("x", [...members].reverse(), "b1");
  assert.deepEqual(o1, o2);
  assert.deepEqual([...o1].sort(), [...members].sort());
});
test("happy path: round completes", () => {
  const l = ledger();
  for (const p of l.payersOf(1)) l.addReceipt(mkReceipt(1, p));
  assert.ok(l.roundStatus(1).complete);
});
test("rejects duplicate, forged, wrong amount, winner self-pay", () => {
  const l = ledger(), p = l.payersOf(1)[0];
  l.addReceipt(mkReceipt(1, p));
  assert.throws(() => l.addReceipt(mkReceipt(1, p, "other")), /duplicate/);
  const forged = { ...mkReceipt(1, l.payersOf(1)[1]), paymentHash: sha256hex("nope") };
  assert.throws(() => l.addReceipt(forged), /preimage/);
  assert.throws(() => l.addReceipt({ ...mkReceipt(1, l.payersOf(1)[2]), amountSats: 1 }), /amount/);
  assert.throws(() => l.addReceipt(mkReceipt(1, l.winnerOf(1))), /winner/);
});
test("default rule and reliability", () => {
  const l = ledger(), [skip, ...rest] = l.payersOf(1);
  for (const p of rest) l.addReceipt(mkReceipt(1, p));
  assert.equal(l.eligibleForPayout(skip, 2), false);
  assert.equal(l.reliability(skip, 1), 0);
  assert.equal(l.eligibleForPayout(rest[0], 2), true);
});
test("input validation", () => {
  assert.throws(() => new Ledger({ ...circle, amountSats: -5 }, members), /amountSats/);
  assert.throws(() => new Ledger({ ...circle, members: [pk("a"), pk("a")] }, members), /member/);
});

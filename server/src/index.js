import express from "express";
import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { Ledger, lotteryOrder, validateCircle, sha256hex } from "../../packages/protocol/index.js";
import { Circle, Receipt } from "./models.js";

const { MONGO_URL = "mongodb://localhost:27017/tontine", PORT = 8080, MOCK_LN = "1" } = process.env;
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));
app.use((_, res, next) => { res.set({ "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" }); next(); });

const ID = /^[a-z0-9-]{3,40}$/; // validated before any DB query, so no operator injection
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  const bad = /^invalid:|E11000/.test(e.message);
  if (!bad) console.error(e.name); // never log request bodies (no PII)
  res.status(bad ? 400 : 500).json({ error: bad ? e.message.replace(/^.*E11000.*$/, "invalid: duplicate") : "server error" });
});

async function load(id) {
  if (!ID.test(id)) throw new Error("invalid: id");
  const c = await Circle.findById(id).lean();
  if (!c) throw Object.assign(new Error("invalid: not found"), {});
  const ledger = new Ledger({ id, name: c.name, members: c.members, amountSats: c.amountSats, schedule: c.schedule }, c.order);
  for (const r of await Receipt.find({ circleId: id }).lean()) ledger.addReceipt(r); // replay = verify
  return { c, ledger };
}
function view({ c, ledger }) {
  const rounds = c.order.map((_, i) => ledger.roundStatus(i + 1));
  const cur = rounds.find((r) => !r.complete)?.round ?? c.order.length;
  return { id: c._id, name: c.name, amountSats: c.amountSats, schedule: c.schedule, members: c.members,
    labels: Object.fromEntries(c.labels || []), order: c.order, rounds, currentRound: cur,
    reliability: Object.fromEntries(c.members.map((m) => [m, ledger.reliability(m, cur)])) };
}

app.post("/api/circles", wrap(async (req, res) => {
  const { id, name, members, amountSats, schedule, beacon, labels } = req.body;
  validateCircle({ id, name, members, amountSats, schedule });
  if (typeof beacon !== "string" || beacon.length > 100) throw new Error("invalid: beacon");
  const order = lotteryOrder(id, members, beacon);
  const clean = Object.fromEntries(Object.entries(labels || {}).filter(([k, v]) => members.includes(k) && typeof v === "string").map(([k, v]) => [k, v.slice(0, 30)]));
  await Circle.create({ _id: id, name, members, amountSats, schedule, beacon, order, labels: clean });
  res.status(201).json(view(await load(id)));
}));

app.get("/api/circles/:id", wrap(async (req, res) => res.json(view(await load(req.params.id)))));

app.post("/api/circles/:id/receipts", wrap(async (req, res) => {
  const { c, ledger } = await load(req.params.id);
  const { round, payer, amountSats, paymentHash, preimage } = req.body;
  const r = { round, payer, amountSats, paymentHash, preimage };
  ledger.addReceipt(r); // validates schema, payer, amount, preimage proof, duplicates
  await Receipt.create({ circleId: c._id, ...r });
  res.status(201).json(view(await load(req.params.id)));
}));

// Simulated Lightning payment for demos and judges. Disabled with MOCK_LN=0.
if (MOCK_LN === "1") {
  app.post("/api/mock/seed", wrap(async (_, res) => {
    const names = ["Awa", "Moussa", "Fatou", "Ibrahima", "Aminata"];
    const members = names.map((n) => sha256hex("demo-" + n));
    const labels = Object.fromEntries(names.map((n, i) => [members[i], n]));
    const id = "demo-" + randomBytes(3).toString("hex");
    await Circle.create({ _id: id, name: "Tontine Sandaga", members, amountSats: 5000, schedule: "weekly",
      beacon: "demo-beacon", order: lotteryOrder(id, members, "demo-beacon"), labels });
    res.status(201).json(view(await load(id)));
  }));
  app.post("/api/mock/pay", wrap(async (req, res) => {
    const { circleId, round, payer, forge } = req.body;
    const { c } = await load(circleId);
    const preimage = randomBytes(32).toString("hex");
    const paymentHash = forge ? randomBytes(32).toString("hex") : sha256hex(preimage, true);
    req.params.id = circleId; req.body = { round, payer, amountSats: c.amountSats, paymentHash, preimage };
    const { ledger } = await load(circleId);
    ledger.addReceipt(req.body);
    await Receipt.create({ circleId, ...req.body });
    res.status(201).json(view(await load(circleId)));
  }));
}

const dist = fileURLToPath(new URL("../../client/dist", import.meta.url));
app.use(express.static(dist));

mongoose.connect(MONGO_URL).then(() => app.listen(PORT, () => console.log(`Tontine on :${PORT}`)))
  .catch(() => { console.error("MongoDB connection failed"); process.exit(1); });

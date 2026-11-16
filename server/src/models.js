import mongoose from "mongoose";
const circle = new mongoose.Schema({
  _id: String, name: String, members: [String], amountSats: Number, schedule: String,
  beacon: String, order: [String], labels: { type: Map, of: String },
});
const receipt = new mongoose.Schema({
  circleId: { type: String, index: true }, round: Number, payer: String,
  amountSats: Number, paymentHash: String, preimage: String,
});
// The database also refuses duplicates, not just the protocol code.
receipt.index({ circleId: 1, round: 1, payer: 1 }, { unique: true });
receipt.index({ circleId: 1, paymentHash: 1 }, { unique: true });
export const Circle = mongoose.model("Circle", circle);
export const Receipt = mongoose.model("Receipt", receipt);

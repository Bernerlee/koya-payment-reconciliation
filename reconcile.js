// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

let total = 0;
let count = 0;

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n");
const transactions = new Map();

for (const line of lines) {
  if (!line.trim()) continue;

  let event;

  try {
    event = JSON.parse(line);
  } catch {
    continue;
  }

  if (!event.txn_id) continue;

  const previous = transactions.get(event.txn_id);

  // Keep only the latest attempt for this transaction
  if (!previous || Date.parse(event.ts) >= Date.parse(previous.ts)) {
    transactions.set(event.txn_id, event);
  }
}

// Count only the latest successful attempt per transaction
for (const event of transactions.values()) {
  if (event.status === "success") {
    total += Number(event.amount);
    count++;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(
    `Check failed: counted ${count} successful payments, expected ${expected}.`,
  );
  console.log(
    "Something in the data isn't being handled the way the README describes.",
  );
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}

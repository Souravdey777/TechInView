import assert from "node:assert/strict";
import test from "node:test";
import { CREDIT_PACKS, EARLY_ACCESS_DISCOUNT_PERCENT, earlyAccessPrice } from "../constants";

test("early access price is never a smaller discount than advertised", () => {
  for (const pack of Object.values(CREDIT_PACKS)) {
    for (const full of Object.values(pack.displayPrices)) {
      const price = earlyAccessPrice(full);
      assert.ok(Number.isInteger(price));
      assert.ok(price <= (full * (100 - EARLY_ACCESS_DISCOUNT_PERCENT)) / 100, `${full} -> ${price}`);
      assert.ok(price > 0);
    }
  }
  assert.equal(earlyAccessPrice(19), 9);
  assert.equal(earlyAccessPrice(799), 399);
});

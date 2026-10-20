import { initSimnet, tx } from "@stacks/clarinet-sdk";
import { Cl } from "@stacks/transactions";
import { beforeEach, describe, expect, it } from "vitest";

let simnet: Awaited<ReturnType<typeof initSimnet>>;
let accounts: Map<string, string>;

const CONTRACT_NAME = "model-market";
const MODEL_CID = "bafybeigdyrzt5sfp7udm7hu76uhk4n6wt7v7b3q4n3q4m5e6w7r2z3xq";
const METADATA_CID = "bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzmmm5z3w4";

beforeEach(async () => {
  simnet = await initSimnet();
  accounts = simnet.getAccounts();
});

async function listModel(seller: string, price = 1_000_000) {
  return simnet.mineBlock([
    tx.callPublicFn(
      CONTRACT_NAME,
      "list-model",
      [Cl.stringAscii(MODEL_CID), Cl.stringAscii(METADATA_CID), Cl.uint(price)],
      seller,
    ),
  ]);
}

describe("model-market", () => {
  it("lists a model and exposes the listing", async () => {
    const seller = accounts.get("wallet_1")!;
    const result = await listModel(seller);

    expect(result[0].result).toEqual(Cl.ok(Cl.uint(1)));

    const listing = await simnet.callReadOnlyFn(
      CONTRACT_NAME,
      "get-listing",
      [Cl.uint(1)],
      seller,
    );
    expect(listing.result).toEqual(
      Cl.some(
        Cl.tuple({
          seller: Cl.standardPrincipal(seller),
          "model-cid": Cl.stringAscii(MODEL_CID),
          "metadata-cid": Cl.stringAscii(METADATA_CID),
          price: Cl.uint(1_000_000),
          active: Cl.bool(true),
        }),
      ),
    );
  });

  it("rejects a zero listing price without consuming an ID", async () => {
    const seller = accounts.get("wallet_1")!;
    const result = await simnet.mineBlock([
      tx.callPublicFn(
        CONTRACT_NAME,
        "list-model",
        [Cl.stringAscii(MODEL_CID), Cl.stringAscii(METADATA_CID), Cl.uint(0)],
        seller,
      ),
    ]);

    expect(result[0].result).toEqual(Cl.error(Cl.uint(102)));
    const nextId = await simnet.callReadOnlyFn(
      CONTRACT_NAME,
      "get-next-listing-id",
      [],
      seller,
    );
    expect(nextId.result).toEqual(Cl.ok(Cl.uint(1)));
  });

  it("allows only the active listing seller to update the price", async () => {
    const seller = accounts.get("wallet_1")!;
    const other = accounts.get("wallet_2")!;
    await listModel(seller);

    const unauthorized = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "update-price", [Cl.uint(1), Cl.uint(2_000_000)], other),
    ]);
    expect(unauthorized[0].result).toEqual(Cl.error(Cl.uint(101)));

    const updated = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "update-price", [Cl.uint(1), Cl.uint(2_000_000)], seller),
    ]);
    expect(updated[0].result).toEqual(Cl.ok(Cl.bool(true)));

    const listing = await simnet.callReadOnlyFn(
      CONTRACT_NAME,
      "get-listing",
      [Cl.uint(1)],
      seller,
    );
    expect(listing.result).toEqual(
      Cl.some(
        Cl.tuple({
          seller: Cl.standardPrincipal(seller),
          "model-cid": Cl.stringAscii(MODEL_CID),
          "metadata-cid": Cl.stringAscii(METADATA_CID),
          price: Cl.uint(2_000_000),
          active: Cl.bool(true),
        }),
      ),
    );
  });

  it("delists only once and rejects further changes to the inactive listing", async () => {
    const seller = accounts.get("wallet_1")!;
    await listModel(seller);

    const delisted = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "delist-model", [Cl.uint(1)], seller),
    ]);
    expect(delisted[0].result).toEqual(Cl.ok(Cl.bool(true)));

    const secondDelist = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "delist-model", [Cl.uint(1)], seller),
    ]);
    expect(secondDelist[0].result).toEqual(Cl.error(Cl.uint(104)));

    const update = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "update-price", [Cl.uint(1), Cl.uint(2_000_000)], seller),
    ]);
    expect(update[0].result).toEqual(Cl.error(Cl.uint(104)));
  });

  it("transfers the exact asking price and closes the listing on purchase", async () => {
    const seller = accounts.get("wallet_1")!;
    const buyer = accounts.get("wallet_2")!;
    const price = 1_000_000;
    await listModel(seller, price);
    const sellerBefore = simnet.getAssetsMap().get("STX")?.get(seller) ?? 0n;
    const buyerBefore = simnet.getAssetsMap().get("STX")?.get(buyer) ?? 0n;

    const purchased = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "buy-model", [Cl.uint(1)], buyer),
    ]);
    expect(purchased[0].result).toEqual(Cl.ok(Cl.bool(true)));

    const balances = simnet.getAssetsMap().get("STX");
    expect(balances?.get(seller)).toBe(sellerBefore + BigInt(price));
    expect(balances?.get(buyer)).toBe(buyerBefore - BigInt(price));

    const listing = await simnet.callReadOnlyFn(
      CONTRACT_NAME,
      "get-listing",
      [Cl.uint(1)],
      buyer,
    );
    expect(listing.result).toEqual(
      Cl.some(
        Cl.tuple({
          seller: Cl.standardPrincipal(buyer),
          "model-cid": Cl.stringAscii(MODEL_CID),
          "metadata-cid": Cl.stringAscii(METADATA_CID),
          price: Cl.uint(price),
          active: Cl.bool(false),
        }),
      ),
    );
  });

  it("rejects self purchases, missing listings, and repeat purchases", async () => {
    const seller = accounts.get("wallet_1")!;
    const buyer = accounts.get("wallet_2")!;
    await listModel(seller);

    const selfPurchase = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "buy-model", [Cl.uint(1)], seller),
    ]);
    expect(selfPurchase[0].result).toEqual(Cl.error(Cl.uint(103)));

    const missing = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "buy-model", [Cl.uint(99)], buyer),
    ]);
    expect(missing[0].result).toEqual(Cl.error(Cl.uint(100)));

    const purchase = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "buy-model", [Cl.uint(1)], buyer),
    ]);
    expect(purchase[0].result).toEqual(Cl.ok(Cl.bool(true)));

    const repeat = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "buy-model", [Cl.uint(1)], seller),
    ]);
    expect(repeat[0].result).toEqual(Cl.error(Cl.uint(104)));
  });
});

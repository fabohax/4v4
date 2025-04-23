import { initSimnet, tx } from "@hirosystems/clarinet-sdk";
import { Cl, ClarityType } from "@stacks/transactions";
import { describe, it, expect, beforeEach } from "vitest";

let simnet: Awaited<ReturnType<typeof initSimnet>>;
let accounts: Map<string, string>;

const MINTER_CONTRACT_ID = "ST3ZFT624V70VXEYAZ51VPKRHXSEQRT6PA51T2SPS.minter";
let MARKET_CONTRACT_ID: string; 

beforeEach(async () => {
  simnet = await initSimnet();
  accounts = simnet.getAccounts();
  const deployer = accounts.get("deployer")!;
  MARKET_CONTRACT_ID = `${deployer}.marketplace`;
});

const mintAndTransferNFT = async (wallet: string, tokenId: number) => {
  await simnet.mineBlock([
    tx.callPublicFn("minter", "mint-public", [], wallet),
    tx.callPublicFn("minter", "transfer", [
      Cl.uint(tokenId),
      Cl.standardPrincipal(wallet),
      Cl.contractPrincipal(MARKET_CONTRACT_ID.split(".")[0], MARKET_CONTRACT_ID.split(".")[1]),
    ], wallet),
  ]);
};

describe("market", () => {
  it("Admin can whitelist NFT contract", async () => {
    const deployer = accounts.get("deployer")!;
    const result = await simnet.mineBlock([
      tx.callPublicFn("market", "set-whitelisted", [
        Cl.contractPrincipal(MINTER_CONTRACT_ID.split(".")[0], MINTER_CONTRACT_ID.split(".")[1]),
        Cl.bool(true),
      ], deployer),
    ]);
    expect(result[0].result).toEqual(Cl.ok(Cl.bool(true)));
  });

  it("User can list NFT for sale after minting", async () => {
    const wallet1 = accounts.get("wallet_1")!;
    await mintAndTransferNFT(wallet1, 1);

    const result = await simnet.mineBlock([
      tx.callPublicFn("market", "list-asset", [
        Cl.contractPrincipal(MINTER_CONTRACT_ID.split(".")[0], MINTER_CONTRACT_ID.split(".")[1]),
        Cl.tuple({
          taker: Cl.none(),
          ["token-id"]: Cl.uint(1),
          expiry: Cl.uint(999999999),
          price: Cl.uint(1000),
          ["payment-asset-contract"]: Cl.none(),
        }),
      ], wallet1),
    ]);

    expect(result[0].result.type).toBe(ClarityType.ResponseOk);
  });

  it("User can cancel listing", async () => {
    const wallet1 = accounts.get("wallet_1")!;
    await mintAndTransferNFT(wallet1, 1);

    await simnet.mineBlock([
      tx.callPublicFn("market", "list-asset", [
        Cl.contractPrincipal(MINTER_CONTRACT_ID.split(".")[0], MINTER_CONTRACT_ID.split(".")[1]),
        Cl.tuple({
          taker: Cl.none(),
          ["token-id"]: Cl.uint(1),
          expiry: Cl.uint(999999999),
          price: Cl.uint(1000),
          ["payment-asset-contract"]: Cl.none(),
        }),
      ], wallet1),
    ]);

    const result = await simnet.mineBlock([
      tx.callPublicFn("market", "cancel-listing", [
        Cl.uint(0),
        Cl.contractPrincipal(MINTER_CONTRACT_ID.split(".")[0], MINTER_CONTRACT_ID.split(".")[1]),
      ], wallet1),
    ]);
    expect(result[0].result).toEqual(Cl.ok(Cl.bool(true)));
  });

  it("Another user can fulfil listing with STX", async () => {
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;
    await mintAndTransferNFT(wallet1, 1);

    await simnet.mineBlock([
      tx.callPublicFn("market", "list-asset", [
        Cl.contractPrincipal(MINTER_CONTRACT_ID.split(".")[0], MINTER_CONTRACT_ID.split(".")[1]),
        Cl.tuple({
          taker: Cl.none(),
          ["token-id"]: Cl.uint(1),
          expiry: Cl.uint(999999999),
          price: Cl.uint(1000),
          ["payment-asset-contract"]: Cl.none(),
        }),
      ], wallet1),
    ]);

    const result = await simnet.mineBlock([
      tx.callPublicFn("market", "fulfil-listing-stx", [
        Cl.uint(0),
        Cl.contractPrincipal(MINTER_CONTRACT_ID.split(".")[0], MINTER_CONTRACT_ID.split(".")[1]),
      ], wallet2),
    ]);

    expect(result[0].result).toEqual(Cl.ok(Cl.uint(0)));
  });

  it("Batch listing works correctly", async () => {
    const wallet1 = accounts.get("wallet_1")!;
    await mintAndTransferNFT(wallet1, 1);
    await mintAndTransferNFT(wallet1, 2);

    const result = await simnet.mineBlock([
      tx.callPublicFn("market", "list-assets-batch", [
        Cl.contractPrincipal(MINTER_CONTRACT_ID.split(".")[0], MINTER_CONTRACT_ID.split(".")[1]),
        Cl.list([
          Cl.tuple({
            taker: Cl.none(),
            ["token-id"]: Cl.uint(1),
            expiry: Cl.uint(999999999),
            price: Cl.uint(1000),
            ["payment-asset-contract"]: Cl.none(),
          }),
          Cl.tuple({
            taker: Cl.none(),
            ["token-id"]: Cl.uint(2),
            expiry: Cl.uint(999999999),
            price: Cl.uint(2000),
            ["payment-asset-contract"]: Cl.none(),
          }),
        ]),
      ], wallet1),
    ]);

    expect(result[0].result.type).toBe(ClarityType.ResponseOk);
  });

  it("Retrieve all listings", async () => {
    const wallet1 = accounts.get("wallet_1")!;
    await mintAndTransferNFT(wallet1, 1);

    await simnet.mineBlock([
      tx.callPublicFn("market", "list-asset", [
        Cl.contractPrincipal(MINTER_CONTRACT_ID.split(".")[0], MINTER_CONTRACT_ID.split(".")[1]),
        Cl.tuple({
          taker: Cl.none(),
          ["token-id"]: Cl.uint(1),
          expiry: Cl.uint(999999999),
          price: Cl.uint(1000),
          ["payment-asset-contract"]: Cl.none(),
        }),
      ], wallet1),
    ]);

    const result = await simnet.callReadOnlyFn("market", "get-all-listings", [], wallet1);

    if (result.result.type === ClarityType.List) {
      expect(result.result.list.length).toBeGreaterThan(0);
    } else {
      throw new Error("Expected a list but got a different ClarityValue type");
    }
  });

  it("Retrieve all whitelisted contracts", async () => {
    const deployer = accounts.get("deployer")!;
    await simnet.mineBlock([
      tx.callPublicFn("market", "set-whitelisted", [
        Cl.contractPrincipal(MINTER_CONTRACT_ID.split(".")[0], MINTER_CONTRACT_ID.split(".")[1]),
        Cl.bool(true),
      ], deployer),
    ]);

    const result = await simnet.callReadOnlyFn("market", "get-whitelisted-contracts", [], deployer);

    if (result.result.type === ClarityType.List) {
      expect(result.result.list.length).toBeGreaterThan(0);
    } else {
      throw new Error("Expected a list but got a different ClarityValue type");
    }
  });
});

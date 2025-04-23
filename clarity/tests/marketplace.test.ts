import { initSimnet, tx } from "@hirosystems/clarinet-sdk";
import { Cl, ClarityType } from "@stacks/transactions";
import { describe, it, expect, beforeEach } from "vitest";

let simnet: Awaited<ReturnType<typeof initSimnet>>;
let accounts: Map<string, string>;

const CONTRACT_ADDRESS = "ST3ZFT624V70VXEYAZ51VPKRHXSEQRT6PA51T2SPS";
const CONTRACT_NAME="marketplace";

beforeEach(async () => {
  simnet = await initSimnet();
  accounts = simnet.getAccounts();
});

const mintAndTransferNFT = async (wallet: string, tokenId: number) => {
  await simnet.mineBlock([
    tx.callPublicFn("minter", "mint-public", [], wallet),
    tx.callPublicFn("minter", "transfer", [
      Cl.uint(tokenId),
      Cl.standardPrincipal(wallet),
      Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], CONTRACT_ADDRESS.split(".")[1]),
    ], wallet),
  ]);
};

describe("marketplace", () => {
  it("Admin can whitelist NFT contract", async () => {
    const deployer = accounts.get("deployer")!;
    const result = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "set-whitelisted", [
        Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], CONTRACT_ADDRESS.split(".")[1]),
        Cl.bool(true),
      ], deployer),
    ]);
    expect(result[0].result).toEqual(Cl.ok(Cl.bool(true)));
  });

  it("User can list NFT for sale after minting", async () => {
    const wallet1 = accounts.get("wallet_1")!;
    await mintAndTransferNFT(wallet1, 1);

    const result = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "list-asset", [
        Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], CONTRACT_ADDRESS.split(".")[1]),
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
      tx.callPublicFn(CONTRACT_NAME, "list-asset", [
        Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], CONTRACT_ADDRESS.split(".")[1]),
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
      tx.callPublicFn(CONTRACT_NAME, "cancel-listing", [
        Cl.uint(0),
        Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], CONTRACT_ADDRESS.split(".")[1]),
      ], wallet1),
    ]);
    expect(result[0].result).toEqual(Cl.ok(Cl.bool(true)));
  });

  it("Another user can fulfil listing with STX", async () => {
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;
    await mintAndTransferNFT(wallet1, 1);

    await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "list-asset", [
        Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], CONTRACT_ADDRESS.split(".")[1]),
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
      tx.callPublicFn(CONTRACT_NAME, "fulfil-listing-stx", [
        Cl.uint(0),
        Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], CONTRACT_ADDRESS.split(".")[1]),
      ], wallet2),
    ]);

    expect(result[0].result).toEqual(Cl.ok(Cl.uint(0)));
  });

  it("Batch listing works correctly", async () => {
    const wallet1 = accounts.get("wallet_1")!;
    await mintAndTransferNFT(wallet1, 1);
    await mintAndTransferNFT(wallet1, 2);

    const result = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "list-assets-batch", [
        Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], CONTRACT_ADDRESS.split(".")[1]),
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
      tx.callPublicFn(CONTRACT_NAME, "list-asset", [
        Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], CONTRACT_ADDRESS.split(".")[1]),
        Cl.tuple({
          taker: Cl.none(),
          ["token-id"]: Cl.uint(1),
          expiry: Cl.uint(999999999),
          price: Cl.uint(1000),
          ["payment-asset-contract"]: Cl.none(),
        }),
      ], wallet1),
    ]);

    const result = await simnet.callReadOnlyFn(CONTRACT_NAME, "get-all-listings", [], wallet1);

    if (result.result.type === ClarityType.List) {
      expect(result.result.list.length).toBeGreaterThan(0);
    } else {
      throw new Error("Expected a list but got a different ClarityValue type");
    }
  });

  it("Retrieve all whitelisted contracts", async () => {
    const deployer = accounts.get("deployer")!;
    await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "set-whitelisted", [
        Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], CONTRACT_ADDRESS.split(".")[1]),
        Cl.bool(true),
      ], deployer),
    ]);

    const result = await simnet.callReadOnlyFn(CONTRACT_NAME, "get-whitelisted-contracts", [], deployer);

    if (result.result.type === ClarityType.List) {
      expect(result.result.list.length).toBeGreaterThan(0);
    } else {
      throw new Error("Expected a list but got a different ClarityValue type");
    }
  });
});

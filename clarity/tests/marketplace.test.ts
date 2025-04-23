import { initSimnet, tx } from "@hirosystems/clarinet-sdk";
import { Cl, ClarityType } from "@stacks/transactions";
import { describe, it, expect, beforeEach } from "vitest";

let simnet: Awaited<ReturnType<typeof initSimnet>>;
let accounts: Map<string, string>;

const CONTRACT_ADDRESS = "ST3ZFT624V70VXEYAZ51VPKRHXSEQRT6PA51T2SPS";
const CONTRACT_NAME = "marketplace";

beforeEach(async () => {
  simnet = await initSimnet();
  accounts = simnet.getAccounts();
});

const mintAndTransferNFT = async (wallet: string, tokenId: number) => {
  await simnet.mineBlock([
    tx.callPublicFn("avatar-minter", "mint", [Cl.standardPrincipal(wallet)], wallet),
    tx.callPublicFn("avatar-minter", "transfer", [
      Cl.uint(tokenId),
      Cl.standardPrincipal(wallet),
      Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], CONTRACT_NAME),
    ], wallet),
  ]);
};

describe("marketplace", () => {
  it("User can list NFT for sale", async () => {
    const wallet1 = accounts.get("wallet_1")!;
    await mintAndTransferNFT(wallet1, 1);

    const result = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "list-asset", [
        Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], "avatar-minter"),
        Cl.uint(1),
        Cl.uint(999999999),
        Cl.uint(1000),
      ], wallet1),
    ]);

    expect(result[0].result).toEqual(Cl.ok(Cl.uint(0))); // Listing ID should be 0
  });

  it("User can cancel a listing", async () => {
    const wallet1 = accounts.get("wallet_1")!;
    await mintAndTransferNFT(wallet1, 1);

    await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "list-asset", [
        Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], "avatar-minter"),
        Cl.uint(1),
        Cl.uint(999999999),
        Cl.uint(1000),
      ], wallet1),
    ]);

    const result = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "cancel-listing", [Cl.uint(0)], wallet1),
    ]);

    expect(result[0].result).toEqual(Cl.ok(Cl.bool(true)));
  });

  it("Another user can fulfil a listing", async () => {
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;
    await mintAndTransferNFT(wallet1, 1);

    await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "list-asset", [
        Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], "avatar-minter"),
        Cl.uint(1),
        Cl.uint(999999999),
        Cl.uint(1000),
      ], wallet1),
    ]);

    const result = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "fulfil-listing", [Cl.uint(0)], wallet2),
    ]);

    expect(result[0].result).toEqual(Cl.ok(Cl.uint(0))); // Listing ID should be 0
  });

  it("Cannot list NFT with expiry in the past", async () => {
    const wallet1 = accounts.get("wallet_1")!;
    await mintAndTransferNFT(wallet1, 1);

    const result = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "list-asset", [
        Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], "avatar-minter"),
        Cl.uint(1),
        Cl.uint(0), // Expiry in the past
        Cl.uint(1000),
      ], wallet1),
    ]);

    expect(result[0].result.type).toBe(ClarityType.ResponseErr);
  });

  it("Cannot list NFT with price of zero", async () => {
    const wallet1 = accounts.get("wallet_1")!;
    await mintAndTransferNFT(wallet1, 1);

    const result = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "list-asset", [
        Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], "avatar-minter"),
        Cl.uint(1),
        Cl.uint(999999999),
        Cl.uint(0), // Price of zero
      ], wallet1),
    ]);

    expect(result[0].result.type).toBe(ClarityType.ResponseErr);
  });

  it("Cannot fulfil an expired listing", async () => {
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;
    await mintAndTransferNFT(wallet1, 1);

    await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "list-asset", [
        Cl.contractPrincipal(CONTRACT_ADDRESS.split(".")[0], "avatar-minter"),
        Cl.uint(1),
        Cl.uint(0), // Expiry in the past
        Cl.uint(1000),
      ], wallet1),
    ]);

    const result = await simnet.mineBlock([
      tx.callPublicFn(CONTRACT_NAME, "fulfil-listing", [Cl.uint(0)], wallet2),
    ]);

    expect(result[0].result.type).toBe(ClarityType.ResponseErr);
  });
});

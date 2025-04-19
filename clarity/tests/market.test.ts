import { initSimnet, tx } from "@hirosystems/clarinet-sdk";
import { Cl, ClarityType } from "@stacks/transactions";
import { describe, it, expect, beforeEach } from "vitest";

let simnet: Awaited<ReturnType<typeof initSimnet>>;
let accounts: Map<string, string>;

const MINTER_CONTRACT_ID = "ST3ZFT624V70VXEYAZ51VPKRHXSEQRT6PA51T2SPS.minter";
const MARKET_CONTRACT_ID = "ST3ZFT624V70VXEYAZ51VPKRHXSEQRT6PA51T2SPS.market";

beforeEach(async () => {
  simnet = await initSimnet();
  accounts = simnet.getAccounts();
});

describe("market", () => {
  it("Admin can whitelist NFT contract", async () => {
    const deployer = accounts.get("deployer")!;
    const result = await simnet.mineBlock([
      tx.callPublicFn("market", "set-whitelisted", [
        Cl.contractPrincipal(...MINTER_CONTRACT_ID.split(".")),
        Cl.bool(true),
      ], deployer),
    ]);
    expect(result[0].result).toEqual(Cl.ok(true));
  });

  it("User can list NFT for sale after minting", async () => {
    const wallet1 = accounts.get("wallet_1")!;
    const deployer = accounts.get("deployer")!;

    await simnet.mineBlock([
      tx.callPublicFn("minter", "mint-public", [], wallet1),
      tx.callPublicFn("minter", "transfer", [
        Cl.uint(1),
        Cl.standardPrincipal(wallet1),
        Cl.contractPrincipal(...MARKET_CONTRACT_ID.split(".")),
      ], wallet1),
    ]);

    const result = await simnet.mineBlock([
      tx.callPublicFn("market", "list-asset", [
        Cl.contractPrincipal(...MINTER_CONTRACT_ID.split(".")),
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
    const wallet1 = accounts.get("wallet_1");

    const result = await simnet.mineBlock([
      tx.callPublicFn("market", "cancel-listing", [
        Cl.uint(0),
        Cl.contractPrincipal(...MINTER_CONTRACT_ID.split(".")),
      ], wallet1),
    ]);
    expect(result[0].result).toEqual(Cl.ok(true));
  });

  it("Another user can fulfil listing with STX", async () => {
    const deployer = accounts.get("deployer")!;
    const wallet2 = accounts.get("wallet_2")!;

    await simnet.mineBlock([
      tx.callPublicFn("minter", "mint-public", [], wallet2),
      tx.callPublicFn("minter", "transfer", [
        Cl.uint(2),
        Cl.standardPrincipal(wallet2),
        Cl.contractPrincipal(...MARKET_CONTRACT_ID.split(".")),
      ], wallet2),
    ]);

    await simnet.mineBlock([
      tx.callPublicFn("market", "list-asset", [
        Cl.contractPrincipal(...MINTER_CONTRACT_ID.split(".")),
        Cl.tuple({
          taker: Cl.none(),
          ["token-id"]: Cl.uint(2),
          expiry: Cl.uint(999999999),
          price: Cl.uint(1000),
          ["payment-asset-contract"]: Cl.none(),
        }),
      ], wallet2),
    ]);

    const result = await simnet.mineBlock([
      tx.callPublicFn("market", "fulfil-listing-stx", [
        Cl.uint(1),
        Cl.contractPrincipal(...MINTER_CONTRACT_ID.split(".")),
      ], deployer),
    ]);

    expect(result[0].result).toEqual(Cl.ok(Cl.uint(1)));
  });
});

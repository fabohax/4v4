import { initSimnet, tx } from "@hirosystems/clarinet-sdk";
import { Cl, ClarityType, StringAsciiCV } from "@stacks/transactions";
import { describe, it, expect, beforeEach } from "vitest";

let simnet: Awaited<ReturnType<typeof initSimnet>>;
let accounts: Map<string, string>;

beforeEach(async () => {
  simnet = await initSimnet();
  accounts = simnet.getAccounts();
});

function ascii(str: string): StringAsciiCV {
  return {
    type: ClarityType.StringASCII,
    data: str,
  };
}

describe("minter", () => {
  it("Admin can add to whitelist and mint via whitelist", async () => {
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;

    // Add to whitelist
    await simnet.mineBlock([
      tx.callPublicFn("minter", "add-to-whitelist", [
        Cl.standardPrincipal(wallet1),
        Cl.uint(2),
      ], deployer),
    ]);

    // Mint via whitelist
    const mintBlock = await simnet.mineBlock([
      tx.callPublicFn("minter", "mint-whitelist", [
        Cl.standardPrincipal(wallet1),
      ], wallet1),
    ]);

    expect(mintBlock[0].result).toEqual(Cl.ok(Cl.uint(1)));

    const read = await simnet.callReadOnlyFn("minter", "get-owner", [
      Cl.uint(1),
    ], wallet1);

    expect(read.result).toEqual(Cl.ok(Cl.some(Cl.standardPrincipal(wallet1))));
  });

  it("Public mint works and increments token ID", async () => {
    const wallet2 = accounts.get("wallet_2")!;

    const block = await simnet.mineBlock([
      tx.callPublicFn("minter", "mint-public", [], wallet2),
    ]);

    expect(block[0].result).toEqual(Cl.ok(Cl.uint(1)));

    const read = await simnet.callReadOnlyFn("minter", "get-owner", [
      Cl.uint(1),
    ], wallet2);

    expect(read.result).toEqual(Cl.ok(Cl.some(Cl.standardPrincipal(wallet2))));
  });

  it("Cannot mint whitelist if over allowance", async () => {
    const deployer = accounts.get("deployer")!;
    const wallet3 = accounts.get("wallet_3")!;

    await simnet.mineBlock([
      tx.callPublicFn("minter", "add-to-whitelist", [
        Cl.standardPrincipal(wallet3),
        Cl.uint(1),
      ], deployer),
    ]);

    await simnet.mineBlock([
      tx.callPublicFn("minter", "mint-whitelist", [
        Cl.standardPrincipal(wallet3),
      ], wallet3),
    ]);

    const block = await simnet.mineBlock([
      tx.callPublicFn("minter", "mint-whitelist", [
        Cl.standardPrincipal(wallet3),
      ], wallet3),
    ]);

    expect(block[0].result.type).toBe(ClarityType.ResponseErr);
    expect(block[0].result.value.value).toBe(403n);
    
  });

  it("get-royalty-info returns expected amount", async () => {
    const deployer = accounts.get("deployer")!;
    const response = await simnet.callReadOnlyFn("minter", "get-royalty-info", [
      Cl.uint(1000),
    ], deployer);
  
    const result = response.result;
  
    if (result.type !== ClarityType.ResponseOk || result.value.type !== ClarityType.Tuple) {
      throw new Error("Unexpected result format");
    }
  
    const tuple = result.value; 
  
    expect(tuple.data["amount"]).toEqual(Cl.uint(50));
    expect(tuple.data["recipient"]).toEqual(Cl.standardPrincipal(deployer));    
  });

  it("Owner can set and get token URI", async () => {
    const wallet4 = accounts.get("wallet_4")!;
    const uri = Cl.stringAscii("ipfs://avatar-0004");
  
    // Mint the token
    await simnet.mineBlock([
      tx.callPublicFn("minter", "mint-public", [], wallet4),
    ]);
  
    // Set token URI
    await simnet.mineBlock([
      tx.callPublicFn("minter", "set-token-uri", [Cl.uint(1), uri], wallet4),
    ]);
  
    // Read back the URI
    const read = await simnet.callReadOnlyFn("minter", "get-token-uri", [
      Cl.uint(1),
    ], wallet4);
  
    expect(read.result.type).toBe(ClarityType.ResponseOk);
  
    // This is the Some(...)
    const optional = read.result.value;
    expect(optional.type).toBe(ClarityType.OptionalSome);
  
    // Now unwrap the inner ASCII string
    const stringValue = optional.value;
    expect(stringValue.type).toBe(ClarityType.StringASCII);
    expect(stringValue.data).toBe("ipfs://avatar-0004");
  });
  
  
});

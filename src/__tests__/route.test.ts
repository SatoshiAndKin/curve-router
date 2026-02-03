import { describe, it, expect } from "vitest";
import { parseRouteParams, isValidAddress } from "../route.js";

const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

function makeParams(params: Record<string, string>): URLSearchParams {
  return new URLSearchParams(params);
}

describe("isValidAddress", () => {
  it("accepts valid checksummed address", () => {
    expect(isValidAddress(DAI)).toBe(true);
  });

  it("accepts valid lowercase address", () => {
    expect(isValidAddress(DAI.toLowerCase())).toBe(true);
  });

  it("accepts valid uppercase address", () => {
    expect(isValidAddress("0x6B175474E89094C44DA98B954EEDEAC495271D0F")).toBe(true);
  });

  it("rejects address without 0x prefix", () => {
    expect(isValidAddress("6B175474E89094C44Da98b954EedeAC495271d0F")).toBe(false);
  });

  it("rejects short address", () => {
    expect(isValidAddress("0x123")).toBe(false);
  });

  it("rejects long address", () => {
    expect(isValidAddress("0x6B175474E89094C44Da98b954EedeAC495271d0F00")).toBe(false);
  });

  it("rejects address with invalid characters", () => {
    expect(isValidAddress("0x6B175474E89094C44Da98b954EedeAC495271d0G")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidAddress("")).toBe(false);
  });

  it("rejects token symbol", () => {
    expect(isValidAddress("DAI")).toBe(false);
  });
});

describe("parseRouteParams", () => {
  it("parses valid params", () => {
    const result = parseRouteParams(makeParams({ from: DAI, to: USDC, amount: "1000" }));
    expect(result).toEqual({
      success: true,
      data: { from: DAI, to: USDC, amount: "1000" },
    });
  });

  it("uses default amount of 1", () => {
    const result = parseRouteParams(makeParams({ from: DAI, to: USDC }));
    expect(result).toEqual({
      success: true,
      data: { from: DAI, to: USDC, amount: "1" },
    });
  });

  it("rejects missing from param", () => {
    const result = parseRouteParams(makeParams({ to: USDC, amount: "1000" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Missing required params");
    }
  });

  it("rejects missing to param", () => {
    const result = parseRouteParams(makeParams({ from: DAI, amount: "1000" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Missing required params");
    }
  });

  it("rejects invalid from address", () => {
    const result = parseRouteParams(makeParams({ from: "DAI", to: USDC }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid 'from' address");
    }
  });

  it("rejects invalid to address", () => {
    const result = parseRouteParams(makeParams({ from: DAI, to: "USDC" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid 'to' address");
    }
  });

  it("rejects negative amount", () => {
    const result = parseRouteParams(makeParams({ from: DAI, to: USDC, amount: "-100" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid amount");
    }
  });

  it("rejects zero amount", () => {
    const result = parseRouteParams(makeParams({ from: DAI, to: USDC, amount: "0" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid amount");
    }
  });

  it("rejects non-numeric amount", () => {
    const result = parseRouteParams(makeParams({ from: DAI, to: USDC, amount: "abc" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid amount");
    }
  });

  it("accepts decimal amount", () => {
    const result = parseRouteParams(makeParams({ from: DAI, to: USDC, amount: "0.5" }));
    expect(result).toEqual({
      success: true,
      data: { from: DAI, to: USDC, amount: "0.5" },
    });
  });
});

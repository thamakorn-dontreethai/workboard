import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../lib/server/auth";

describe("Authentication & Security Tests", () => {
  it("should securely hash and verify passwords", () => {
    const password = "mySecretPassword2026!";
    const hash = hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBe(64); // SHA-256 hex string

    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword("wrongPassword", hash)).toBe(false);
  });

  it("should generate deterministic hashes for identical inputs", () => {
    const hash1 = hashPassword("companySecret");
    const hash2 = hashPassword("companySecret");
    expect(hash1).toBe(hash2);
  });
});

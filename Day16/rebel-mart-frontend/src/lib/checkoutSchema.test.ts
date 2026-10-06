import { describe, expect, it } from "vitest";
import { checkoutDefaults, checkoutSchema } from "./checkoutSchema";

const valid = {
  customer_name: "Thrinaadh Varma",
  phone: "9876543210",
  address: "12 Main Street, Ongole",
  city: "Ongole",
  state: "Andhra Pradesh",
  pincode: "523001",
  delivery_instructions: "Leave at the gate",
};

describe("checkoutSchema", () => {
  it("accepts a complete valid checkout payload", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });

  it("provides empty defaults for every checkout field", () => {
    expect(checkoutDefaults).toEqual({
      customer_name: "", phone: "", address: "", city: "", state: "", pincode: "", delivery_instructions: "",
    });
  });

  it("rejects a missing customer name", () => {
    expect(checkoutSchema.safeParse({ ...valid, customer_name: "" }).success).toBe(false);
  });

  it("rejects a short phone number", () => {
    expect(checkoutSchema.safeParse({ ...valid, phone: "12345" }).success).toBe(false);
  });

  it("rejects an invalid pincode", () => {
    expect(checkoutSchema.safeParse({ ...valid, pincode: "12AB" }).success).toBe(false);
  });

  it("rejects a short delivery address", () => {
    expect(checkoutSchema.safeParse({ ...valid, address: "Home" }).success).toBe(false);
  });

  it("allows optional delivery instructions to be empty", () => {
    expect(checkoutSchema.safeParse({ ...valid, delivery_instructions: "" }).success).toBe(true);
  });

  it("rejects overly long delivery instructions", () => {
    expect(checkoutSchema.safeParse({ ...valid, delivery_instructions: "x".repeat(251) }).success).toBe(false);
  });
});

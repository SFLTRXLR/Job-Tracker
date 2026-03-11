import { validateProspect } from "../prospect-helpers";

describe("prospect creation validation", () => {
  test("rejects a blank company name", () => {
    const result = validateProspect({
      companyName: "",
      roleTitle: "Software Engineer",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Company name is required");
  });

  test("rejects a blank role title", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Role title is required");
  });
});

describe("target salary validation", () => {
  test("rejects a negative salary", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "Engineer",
      targetSalary: -50000,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Target salary cannot be negative");
  });

  test("rejects non-numeric salary input", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "Engineer",
      targetSalary: "not-a-number",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Target salary must be a number");
  });

  test("accepts a blank (null) salary since it is optional", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "Engineer",
      targetSalary: null,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("accepts a blank (undefined) salary since it is optional", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "Engineer",
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("accepts a valid positive whole number salary", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "Engineer",
      targetSalary: 150000,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("accepts zero salary", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "Engineer",
      targetSalary: 0,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("rejects a decimal salary", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "Engineer",
      targetSalary: 150000.50,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Target salary must be a whole number");
  });
});

import { describe, expect, it } from "vitest";
import { renderCollectedFiles } from "../../src/domains/output/formatter.js";

describe("Output formatter errors", () => {
  it("throws for unsupported output formats", () => {
    expect(() => renderCollectedFiles([], "json")).toThrow(
      "Unsupported output format: json",
    );
  });
});

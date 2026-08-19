import { installLatinDigitsPolicy, toLatinDigits } from "./latinDigits";

describe("Latin digit presentation policy", () => {
  beforeAll(() => installLatinDigitsPolicy());

  test("normalizes Arabic-Indic and Persian digits without changing surrounding text", () => {
    expect(toLatinDigits("السعر ١٢٣ و ۴۵")) .toBe("السعر 123 و 45");
  });

  test("keeps Number locale output free of Arabic-Indic digits", () => {
    const formatted = Number(123456).toLocaleString("ar-SA");
    expect(formatted).toMatch(/1/);
    expect(formatted).not.toMatch(/[٠-٩۰-۹]/);
  });

  test("keeps Date locale output Gregorian and free of Arabic-Indic digits", () => {
    const formatted = new Date("2025-04-03T12:00:00Z").toLocaleDateString("ar-SA-u-ca-islamic");
    expect(formatted).not.toMatch(/[٠-٩۰-۹]/);
    expect(formatted).toMatch(/2025/);
    expect(formatted).not.toMatch(/144[0-9]/);
  });
});

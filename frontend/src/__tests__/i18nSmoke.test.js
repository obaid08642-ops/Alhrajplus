import translations from "../auto_translations.json";

describe("i18n production smoke", () => {
  test("contains all supported locales and non-empty dictionaries", () => {
    const supported = ["ar", "en", "ur", "hi", "bn", "fr"];
    supported.forEach((locale) => {
      const translatedKeys = locale === "ar"
        ? Object.keys(translations).filter((key) => key.trim().length > 0)
        : Object.values(translations).filter((entry) => entry && entry[locale]);
      expect(translatedKeys.length).toBeGreaterThan(0);
    });
  });

  test("contains critical marketplace labels in every locale", () => {
    const keys = ["تواصل مع البائع", "المفضلة", "المشاهدات", "الإشعارات"];
    ["ar", "en", "ur", "hi", "bn", "fr"].forEach((locale) => {
      keys.forEach((key) => {
        const value = locale === "ar" ? key : translations[key]?.[locale];
        expect(value).toBeTruthy();
      });
    });
  });
});

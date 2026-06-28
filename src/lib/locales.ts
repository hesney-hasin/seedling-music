import { fakerEN_US, fakerDE, fakerUK, type Faker } from "@faker-js/faker";

export const LOCALES = [
  { code: "en_US", label: "English (US)" },
  { code: "de_DE", label: "Deutsch (Deutschland)" },
  { code: "uk_UA", label: "Українська (Україна)" },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

export function getFaker(locale: LocaleCode): Faker {
  switch (locale) {
    case "de_DE": return fakerDE;
    case "uk_UA": return fakerUK;
    default: return fakerEN_US;
  }
}

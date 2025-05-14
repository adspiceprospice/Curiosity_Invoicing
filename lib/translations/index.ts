import { en } from './en';
import { de } from './de';
import { nl } from './nl';
import { fr } from './fr';
import { es } from './es';

const languages = {
  en,
  de,
  nl,
  fr,
  es,
};

export type Language = keyof typeof languages;

export function t(key: string, lang: Language = 'en'): string {
  const parts = key.split('.');
  let current: any = languages[lang] || languages.en;

  for (const part of parts) {
    if (current[part] === undefined) {
      // Fallback to English if the key doesn't exist in the selected language
      current = languages.en;
      for (const fallbackPart of parts) {
        if (current[fallbackPart] === undefined) {
          return key; // Return the key itself if not found in any language
        }
        current = current[fallbackPart];
      }
      return current;
    }
    current = current[part];
  }

  return current;
}
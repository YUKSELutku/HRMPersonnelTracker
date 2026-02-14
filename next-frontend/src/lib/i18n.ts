// Path: NextFrontend/src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files directly (bundled at build time — no HTTP needed)
import en from '@/locales/en.json';
import tr from '@/locales/tr.json';

/**
 * i18next configuration optimized for a static-export Next.js app
 * running inside a MAUI WebView (offline, no server).
 *
 * - Resources are bundled directly (no lazy loading / no backend plugin)
 * - Language is detected from localStorage, then defaults to Turkish
 * - When language changes, we also notify the C# layer via the bridge
 */
i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            tr: { translation: tr },
        },
        fallbackLng: 'tr', // Default to Turkish for a TR-market app
        supportedLngs: ['en', 'tr'],
        interpolation: {
            escapeValue: false, // React already escapes
        },
        detection: {
            // Only use localStorage for persistence (no cookies, no server)
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'hrm_language',
            caches: ['localStorage'],
        },
        react: {
            useSuspense: false, // Avoids hydration issues in static export
        },
    });

/**
 * Change the UI language and notify the C# backend.
 * Called by the LanguageSwitcher component.
 */
export async function changeLanguage(lng: string): Promise<void> {
    await i18n.changeLanguage(lng);
    localStorage.setItem('hrm_language', lng);

    // Set a global variable so the bridge always sends the current lang
    if (typeof window !== 'undefined') {
        (window as any).__currentLang = lng;
    }

    // Notify C# backend about the language change
    try {
        if ((window as any).bridge) {
            await (window as any).bridge.invoke('updateLanguage', { lang: lng }, lng);
        }
    } catch {
        // Bridge may not be available during development
        console.warn('[i18n] Bridge not available; language change is frontend-only');
    }
}

/**
 * Get the current language code.
 */
export function getCurrentLanguage(): string {
    return i18n.language?.substring(0, 2) ?? 'tr';
}

export default i18n;
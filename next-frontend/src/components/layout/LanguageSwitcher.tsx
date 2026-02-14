// Path: NextFrontend/src/components/layout/LanguageSwitcher.tsx
'use client';

import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * A compact language toggle that switches between Turkish and English.
 *
 * When the user clicks a language button:
 * 1. react-i18next updates all UI strings instantly
 * 2. The selection is persisted to localStorage
 * 3. The C# backend is notified via bridge.invoke('updateLanguage', { lang })
 *    so that subsequent PDF/Excel exports use the correct language
 */
export function LanguageSwitcher() {
    const { t } = useTranslation();
    const currentLang = getCurrentLanguage();

    const languages = [
        { code: 'tr', label: '🇹🇷 TR', fullLabel: 'Türkçe' },
        { code: 'en', label: '🇬🇧 EN', fullLabel: 'English' },
    ];

    return (
        <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('language')}
            </span>

            <div className="flex gap-1">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={cn(
                            'flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all',
                            currentLang === lang.code
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-secondary text-secondary-foreground hover:bg-accent'
                        )}
                        title={lang.fullLabel}
                    >
                        {lang.label}
                    </button>
                ))}
            </div>
        </div>
    );
} 
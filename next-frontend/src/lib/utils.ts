// Path: NextFrontend/src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with conflict resolution (used by shadcn/ui) */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Format a number as Turkish Lira currency */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
    }).format(amount);
}

/** Format a date string */
export function formatDate(dateStr: string, locale: string = 'tr-TR'): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

/** Get current period as YYYY-MM */
export function getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
} 
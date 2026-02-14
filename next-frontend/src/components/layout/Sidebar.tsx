// Path: NextFrontend/src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/dashboard', icon: '📊', key: 'nav_dashboard' },
    { href: '/employees', icon: '👥', key: 'nav_employees' },
    { href: '/attendance', icon: '🕐', key: 'nav_attendance' },
    { href: '/salary', icon: '💵', key: 'nav_salary' },
    { href: '/payroll', icon: '💰', key: 'nav_payroll' },
    { href: '/leaves', icon: '🏖️', key: 'nav_leaves' },
    { href: '/reports', icon: '📄', key: 'nav_reports' },
    { href: '/settings', icon: '⚙️', key: 'nav_settings' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { t } = useTranslation();

    return (
        <aside className="flex w-64 flex-col border-r border-border bg-card">
            {/* App title */}
            <div className="flex h-16 items-center gap-2 border-b border-border px-6">
                <span className="text-xl">🏢</span>
                <h1 className="text-base font-semibold text-foreground truncate">
                    {t('app_title')}
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4 sidebar-scroll overflow-y-auto">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href || pathname?.startsWith(item.href + '/');

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            <span className="text-lg">{item.icon}</span>
                            {t(item.key)}
                        </Link>
                    );
                })}
            </nav>

            {/* Language switcher at the bottom */}
            <div className="border-t border-border p-4">
                <LanguageSwitcher />
            </div>
        </aside>
    );
}
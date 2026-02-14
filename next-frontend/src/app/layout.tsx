// Path: NextFrontend/src/app/layout.tsx
'use client';

import '@/styles/globals.css';
import '@/lib/i18n'; // Initialize i18next on first import
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastProvider } from '@/components/ui/toast';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

/**
 * Root layout.
 *
 * Because this is a static export (`output: 'export'`), we mark the
 * entire tree as 'use client'. The I18nextProvider wraps all pages so
 * any component can call useTranslation().
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang={i18n.language} suppressHydrationWarning>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>HRM Personnel Tracker</title>
            </head>
            <body className="min-h-screen bg-background antialiased">
                <I18nextProvider i18n={i18n}>
                    <ToastProvider>
                        <ErrorBoundary>
                            <div className="flex h-screen overflow-hidden">
                                {/* Fixed sidebar */}
                                <Sidebar />

                                {/* Main content area */}
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                                        {children}
                                    </main>
                                    <footer className="shrink-0 border-t border-border bg-card/50 px-6 py-2.5 text-center text-xs text-muted-foreground">
                                        Developed by <span className="font-medium text-foreground/70">Utku Yuksel</span>
                                    </footer>
                                </div>
                            </div>
                        </ErrorBoundary>
                    </ToastProvider>
                </I18nextProvider>
            </body>
        </html>
    );
}
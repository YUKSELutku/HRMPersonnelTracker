// Path: NextFrontend/src/app/settings/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type PayrollSettingsData, type TaxBracket } from '@/lib/bridge';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function SettingsPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form state — rates stored as percentages for display
    const [label, setLabel] = useState('');
    const [sgkWorker, setSgkWorker] = useState(14);
    const [unemploymentWorker, setUnemploymentWorker] = useState(1);
    const [stampTax, setStampTax] = useState(0.759);
    const [sgkEmployer, setSgkEmployer] = useState(21.75);
    const [unemploymentEmployer, setUnemploymentEmployer] = useState(2);
    const [sgkCeiling, setSgkCeiling] = useState(0);
    const [minimumWage, setMinimumWage] = useState(28075);
    const [brackets, setBrackets] = useState<TaxBracket[]>([]);
    const [updatedAt, setUpdatedAt] = useState('');

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const s = await api.getPayrollSettings();
            if (s) {
                setLabel(s.label ?? '');
                setSgkWorker(toPercent(s.sgkWorkerRate));
                setUnemploymentWorker(toPercent(s.unemploymentWorkerRate));
                setStampTax(toPercent(s.stampTaxRate));
                setSgkEmployer(toPercent(s.sgkEmployerRate));
                setUnemploymentEmployer(toPercent(s.unemploymentEmployerRate));
                setSgkCeiling(s.sgkCeiling ?? 0);
                setMinimumWage(s.minimumWage ?? 28075);
                setUpdatedAt(s.updatedAt ?? '');

                // Parse brackets from JSON or use parsed field
                let b: TaxBracket[] = [];
                if (s.taxBrackets && Array.isArray(s.taxBrackets)) {
                    b = s.taxBrackets;
                } else if (s.taxBracketsJson) {
                    try { b = JSON.parse(s.taxBracketsJson); } catch { }
                }
                setBrackets(b.length > 0 ? b : defaultBrackets());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadSettings(); }, [loadSettings]);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const bracketsJson = JSON.stringify(brackets);
            await api.updatePayrollSettings({
                label,
                sgkWorkerRate: fromPercent(sgkWorker),
                unemploymentWorkerRate: fromPercent(unemploymentWorker),
                stampTaxRate: fromPercent(stampTax),
                sgkEmployerRate: fromPercent(sgkEmployer),
                unemploymentEmployerRate: fromPercent(unemploymentEmployer),
                sgkCeiling,
                minimumWage,
                taxBracketsJson: bracketsJson,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            await loadSettings();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm(t('settings_reset_confirm'))) return;
        setSaving(true);
        try {
            await api.resetPayrollSettings();
            await loadSettings();
        } finally {
            setSaving(false);
        }
    };

    // ── Tax bracket helpers ──────────────────────────────────
    const updateBracket = (idx: number, field: keyof TaxBracket, value: number) => {
        setBrackets((prev) => prev.map((b, i) =>
            i === idx ? { ...b, [field]: field === 'rate' ? fromPercent(value) : value } : b
        ));
    };

    const addBracket = () => {
        const last = brackets[brackets.length - 1];
        setBrackets([...brackets.slice(0, -1), {
            threshold: (last?.threshold ?? 500000) + 100000,
            rate: last?.rate ?? 0.35,
        }, {
            threshold: 999999999,
            rate: Math.min((last?.rate ?? 0.35) + 0.05, 0.50),
        }]);
    };

    const removeBracket = (idx: number) => {
        if (brackets.length <= 2) return;
        setBrackets((prev) => prev.filter((_, i) => i !== idx));
    };

    if (loading) return <p className="text-muted-foreground p-6">{t('loading')}</p>;

    const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
    const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">{t('settings_title')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('settings_subtitle')}</p>
                {updatedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                        {t('settings_last_updated')}: {formatDate(updatedAt)}
                    </p>
                )}
            </div>

            {/* Label */}
            <div>
                <label className={labelClass}>{t('settings_label')}</label>
                <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className={inputClass + ' max-w-sm'}
                    placeholder="2026 Yılı Parametreleri"
                />
            </div>

            {/* ── Worker Deductions ──────────────────────────────── */}
            <Section title={t('settings_worker_deductions')} color="bg-red-500">
                <div className="grid grid-cols-3 gap-4">
                    <RateInput label={t('settings_sgk_worker')} value={sgkWorker} onChange={setSgkWorker} />
                    <RateInput label={t('settings_unemployment_worker')} value={unemploymentWorker} onChange={setUnemploymentWorker} />
                    <RateInput label={t('settings_stamp_tax')} value={stampTax} onChange={setStampTax} step={0.001} />
                </div>
            </Section>

            {/* ── Employer Contributions ─────────────────────────── */}
            <Section title={t('settings_employer_contributions')} color="bg-blue-500">
                <div className="grid grid-cols-2 gap-4">
                    <RateInput label={t('settings_sgk_employer')} value={sgkEmployer} onChange={setSgkEmployer} />
                    <RateInput label={t('settings_unemployment_employer')} value={unemploymentEmployer} onChange={setUnemploymentEmployer} />
                </div>
            </Section>

            {/* ── General Parameters ─────────────────────────────── */}
            <Section title={t('settings_general')} color="bg-green-500">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>{t('settings_sgk_ceiling')}</label>
                        <input
                            type="number"
                            value={sgkCeiling || ''}
                            onChange={(e) => setSgkCeiling(parseFloat(e.target.value) || 0)}
                            className={inputClass}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>{t('settings_minimum_wage')}</label>
                        <input
                            type="number"
                            value={minimumWage || ''}
                            onChange={(e) => setMinimumWage(parseFloat(e.target.value) || 0)}
                            className={inputClass}
                            placeholder="28075"
                        />
                    </div>
                </div>
            </Section>

            {/* ── Tax Brackets ───────────────────────────────────── */}
            <Section title={t('settings_tax_brackets')} color="bg-amber-500">
                <div className="space-y-3">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-xs font-medium text-muted-foreground">
                        <span>{t('settings_bracket_threshold')}</span>
                        <span>{t('settings_bracket_rate')}</span>
                        <span className="w-16" />
                    </div>

                    {/* Rows */}
                    {brackets.map((b, idx) => {
                        const isLast = idx === brackets.length - 1;
                        return (
                            <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
                                <input
                                    type="number"
                                    value={isLast ? '' : b.threshold}
                                    onChange={(e) => updateBracket(idx, 'threshold', parseFloat(e.target.value) || 0)}
                                    className={inputClass}
                                    placeholder={isLast ? '∞ (son dilim)' : '0'}
                                    disabled={isLast}
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={toPercent(b.rate)}
                                        onChange={(e) => updateBracket(idx, 'rate', parseFloat(e.target.value) || 0)}
                                        className={inputClass}
                                        step={0.01}
                                    />
                                    <span className="text-sm text-muted-foreground">%</span>
                                </div>
                                <button
                                    onClick={() => removeBracket(idx)}
                                    disabled={brackets.length <= 2}
                                    className="w-16 rounded-md px-2 py-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-30 transition-colors"
                                >
                                    {t('settings_remove_bracket')}
                                </button>
                            </div>
                        );
                    })}

                    <button
                        onClick={addBracket}
                        className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                        + {t('settings_add_bracket')}
                    </button>
                </div>
            </Section>

            {/* ── Actions ─────────────────────────────────────────── */}
            <div className="flex items-center gap-3 border-t border-border pt-6">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    {saving ? t('loading') : t('btn_save')}
                </button>
                <button
                    onClick={handleReset}
                    disabled={saving}
                    className="rounded-lg border border-input px-5 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors"
                >
                    {t('settings_reset_default')}
                </button>
                {saved && (
                    <span className="text-sm font-medium text-green-600 animate-pulse">
                        ✓ {t('settings_saved')}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Helpers ─────────────────────────────────────────────────

function toPercent(rate: number): number {
    return Math.round(rate * 100000) / 1000; // 0.14 → 14, 0.00759 → 0.759
}

function fromPercent(pct: number): number {
    return pct / 100; // 14 → 0.14
}

function defaultBrackets(): TaxBracket[] {
    return [
        { threshold: 190000, rate: 0.15 },
        { threshold: 400000, rate: 0.20 },
        { threshold: 1500000, rate: 0.27 },
        { threshold: 5300000, rate: 0.35 },
        { threshold: 999999999, rate: 0.40 },
    ];
}

// ── Sub-components ──────────────────────────────────────────

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
                <span className={`inline-block w-1 h-4 rounded ${color}`} />
                <h2 className="text-sm font-semibold">{title}</h2>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function RateInput({ label, value, onChange, step }: {
    label: string; value: number; onChange: (v: number) => void; step?: number;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    step={step ?? 0.1}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <span className="text-sm text-muted-foreground">%</span>
            </div>
        </div>
    );
}
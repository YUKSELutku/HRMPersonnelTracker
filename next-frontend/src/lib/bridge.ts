// Path: NextFrontend/src/lib/bridge.ts
/**
 * Bridge utility for communicating between Next.js and the MAUI C# backend.
 *
 * In production (inside WebView2), window.bridge is injected by MainPage.xaml.cs.
 * In development (browser), we provide mock responses for testing.
 */

import { getCurrentLanguage } from './i18n';

// ── Types ────────────────────────────────────────────────────

export interface BridgeResponse<T = any> {
    id: string;
    success: boolean;
    data?: T;
    error?: string;
}

export interface Employee {
    id: number;
    fullName: string;
    tc_No?: string;
    birthDate?: string;
    phone?: string;
    email?: string;
    department?: string;
    title?: string;
    hireDate: string;
    activeStatus: boolean;
    archivePaths: string[];
}

export interface Attendance {
    id: number;
    employeeId: number;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    isLate: boolean;
    overtimeHours: number;
    employee?: Employee;
}

export interface PayrollRecord {
    id: number;
    employeeId: number;
    period: string;
    grossSalary: number;
    mealAllowance: number;
    transportAllowance: number;
    privateHealthInsurance: number;
    familyAllowance: number;
    housingAllowance: number;
    educationAllowance: number;
    bonusAmount: number;
    overtimePay: number;
    overtimeHours: number;
    mealWorkDays: number;
    totalGross: number;
    sgkWorker: number;
    unemploymentWorker: number;
    incomeTax: number;
    stampTax: number;
    totalDeductions: number;
    netSalary: number;
    sgkEmployer: number;
    unemploymentEmployer: number;
    totalEmployerCost: number;
    cumulativeTaxBase: number;
    employee?: Employee;
    // backward compat
    baseSalary: number;
    allowances: number;
    deductions: number;
    finalSalary: number;
}

export interface SalaryDefinition {
    id: number;
    employeeId: number;
    grossSalary: number;
    paymentPeriod: string;
    mealAllowance: number;
    transportAllowance: number;
    privateHealthInsurance: number;
    familyAllowance: number;
    housingAllowance: number;
    educationAllowance: number;
    monthlyBonus: number;
    effectiveDate: string;
    isActive: boolean;
    notes?: string;
    totalAllowances: number;
    employee?: Employee;
}

export interface DashboardData {
    activeEmployees: number;
    lateArrivals: number;
    date: string;
}

export interface TaxBracket {
    threshold: number;
    rate: number;
}

export interface PayrollSettingsData {
    id: number;
    label: string;
    sgkWorkerRate: number;
    unemploymentWorkerRate: number;
    stampTaxRate: number;
    sgkEmployerRate: number;
    unemploymentEmployerRate: number;
    taxBracketsJson: string;
    taxBrackets: TaxBracket[];
    sgkCeiling: number;
    minimumWage: number;
    isActive: boolean;
    updatedAt: string;
}

// ── Bridge invocation ────────────────────────────────────────

/**
 * Invoke a C# command through the WebView2 bridge.
 *
 * @param command  - The command name (matches BridgeRouter switch cases)
 * @param payload  - JSON-serializable payload
 * @returns        - The response data from C#
 */
export async function invoke<T = any>(
    command: string,
    payload: Record<string, any> = {}
): Promise<T> {
    const lang = getCurrentLanguage();

    // Check if we're running inside WebView2 (production)
    if (typeof window !== 'undefined' && (window as any).bridge) {
        return (window as any).bridge.invoke(command, payload, lang);
    }

    // Development mock fallback (no MAUI backend)
    console.warn(`[Bridge Mock] ${command}`, payload);
    return getMockResponse<T>(command, payload);
}

// ── Typed API functions ──────────────────────────────────────

export const api = {
    // Dashboard
    getDashboard: () => invoke<DashboardData>('getDashboard'),

    // Employees
    getEmployees: (activeOnly?: boolean) =>
        invoke<Employee[]>('getEmployees', { activeOnly }),
    getEmployee: (id: number) =>
        invoke<Employee>('getEmployee', { id }),
    createEmployee: (employee: Partial<Employee>) =>
        invoke<Employee>('createEmployee', employee),
    updateEmployee: (id: number, employee: Partial<Employee>) =>
        invoke<Employee>('updateEmployee', { id, ...employee }),
    deleteEmployee: (id: number) =>
        invoke<boolean>('deleteEmployee', { id }),
    searchEmployees: (term: string) =>
        invoke<Employee[]>('searchEmployees', { term }),

    // Attendance
    checkIn: (employeeId: number, date?: string, time?: string) =>
        invoke<Attendance>('checkIn', { employeeId, date, time }),
    checkOut: (employeeId: number, date?: string, time?: string) =>
        invoke<Attendance>('checkOut', { employeeId, date, time }),
    getAttendanceByDate: (date?: string) =>
        invoke<Attendance[]>('getAttendanceByDate', { date }),
    getAttendanceToday: () =>
        invoke<Attendance[]>('getAttendanceToday'),
    updateAttendance: (id: number, checkInTime?: string, checkOutTime?: string) =>
        invoke<Attendance>('updateAttendance', { id, checkInTime, checkOutTime }),
    deleteAttendance: (id: number) =>
        invoke<boolean>('deleteAttendance', { id }),

    // Payroll
    generatePayroll: (period: string) =>
        invoke<PayrollRecord[]>('generatePayroll', { period }),
    getPayroll: (period: string) =>
        invoke<PayrollRecord[]>('getPayroll', { period }),
    deletePeriodPayroll: (period: string) =>
        invoke<boolean>('deletePeriodPayroll', { period }),

    // Salary Management
    getSalaries: () =>
        invoke<SalaryDefinition[]>('getSalaries'),
    getSalary: (employeeId: number) =>
        invoke<SalaryDefinition>('getSalary', { employeeId }),
    upsertSalary: (salary: Partial<SalaryDefinition>) =>
        invoke<SalaryDefinition>('upsertSalary', salary),
    deleteSalary: (id: number) =>
        invoke<boolean>('deleteSalary', { id }),

    // Payroll Settings
    getPayrollSettings: () =>
        invoke<PayrollSettingsData>('getPayrollSettings'),
    updatePayrollSettings: (settings: Partial<PayrollSettingsData>) =>
        invoke<PayrollSettingsData>('updatePayrollSettings', settings),
    resetPayrollSettings: () =>
        invoke<PayrollSettingsData>('resetPayrollSettings'),

    // Reports
    exportAttendancePdf: (period: string) =>
        invoke<{ filePath: string }>('exportAttendancePdf', { period }),
    exportAttendanceExcel: (period: string) =>
        invoke<{ filePath: string }>('exportAttendanceExcel', { period }),
    exportEmployeeAttendancePdf: (period: string, employeeId: number) =>
        invoke<{ filePath: string }>('exportEmployeeAttendancePdf', { period, employeeId }),
    exportEmployeeAttendanceExcel: (period: string, employeeId: number) =>
        invoke<{ filePath: string }>('exportEmployeeAttendanceExcel', { period, employeeId }),
    exportPayrollPdf: (period: string) =>
        invoke<{ filePath: string }>('exportPayrollPdf', { period }),
    exportPayrollExcel: (period: string) =>
        invoke<{ filePath: string }>('exportPayrollExcel', { period }),
};

// ── Dev mock data ────────────────────────────────────────────

function getMockResponse<T>(command: string, payload: any): T {
    const mocks: Record<string, any> = {
        getDashboard: { activeEmployees: 42, lateArrivals: 3, date: new Date().toISOString().split('T')[0] },
        getEmployees: [
            { id: 1, fullName: 'Ahmet Yılmaz', department: 'Yazılım', title: 'Kıdemli Geliştirici', activeStatus: true, hireDate: '2020-01-10', archivePaths: [] },
            { id: 2, fullName: 'Elif Demir', department: 'İnsan Kaynakları', title: 'İK Müdürü', activeStatus: true, hireDate: '2018-06-01', archivePaths: [] },
            { id: 3, fullName: 'Mehmet Kaya', department: 'Muhasebe', title: 'Muhasebe Uzmanı', activeStatus: true, hireDate: '2022-03-15', archivePaths: [] },
        ],
        getAttendanceToday: [
            { id: 1, employeeId: 1, date: new Date().toISOString().split('T')[0], checkInTime: '09:00', isLate: false, overtimeHours: 0, employee: { fullName: 'Ahmet Yılmaz', department: 'Yazılım' } },
            { id: 2, employeeId: 2, date: new Date().toISOString().split('T')[0], checkInTime: '09:15', isLate: true, overtimeHours: 0, employee: { fullName: 'Elif Demir', department: 'İnsan Kaynakları' } },
        ],
        getPayroll: [],
        getSalaries: [
            { id: 1, employeeId: 1, grossSalary: 55000, paymentPeriod: 'Monthly', mealAllowance: 2000, transportAllowance: 1500, privateHealthInsurance: 1000, familyAllowance: 0, housingAllowance: 0, educationAllowance: 0, monthlyBonus: 3000, effectiveDate: '2020-01-10', isActive: true, totalAllowances: 7500, employee: { id: 1, fullName: 'Ahmet Yılmaz', department: 'Yazılım' } },
        ],
        searchEmployees: [],
    };

    return (mocks[command] ?? null) as T;
}
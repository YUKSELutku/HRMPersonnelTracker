// Path: NextFrontend/src/types/index.ts
// ── Bridge Types ─────────────────────────────────────────────

declare global {
    interface Window {
        bridge?: {
            invoke: (command: string, payload?: any, lang?: string) => Promise<any>;
        };
        __currentLang?: string;
        __bridgeCallbacks?: Record<string, { resolve: Function; reject: Function }>;
        chrome?: {
            webview?: {
                postMessage: (message: string) => void;
                addEventListener: (event: string, handler: Function) => void;
            };
        };
    }
}

// ── Entity Types ─────────────────────────────────────────────

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

export interface Leave {
    id: number;
    employeeId: number;
    startDate: string;
    endDate: string;
    type: LeaveType;
    status: LeaveStatus;
    totalDays: number;
    employee?: Employee;
}

export type LeaveType = 'Annual' | 'Sick' | 'Maternity' | 'Unpaid' | 'Other';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface PayrollRecord {
    id: number;
    employeeId: number;
    period: string;
    baseSalary: number;
    allowances: number;
    deductions: number;
    finalSalary: number;
    createdAt: string;
    employee?: Employee;
}

export interface DashboardData {
    activeEmployees: number;
    lateArrivals: number;
    date: string;
}

export interface FileInfo {
    name: string;
    path: string;
    size: number;
    created: string;
}

// ── Bridge Response ──────────────────────────────────────────

export interface BridgeResponse<T = any> {
    id: string;
    success: boolean;
    data?: T;
    error?: string;
}

export { };
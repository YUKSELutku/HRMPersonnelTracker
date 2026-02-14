# HRM Personnel Tracker

A full-featured Human Resource Management desktop application built with .NET MAUI and Next.js. Designed for Turkish labor law compliance with full bilingual (TR/EN) support.

![.NET MAUI](https://img.shields.io/badge/.NET_MAUI-9.0-512BD4?logo=dotnet)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![SQLite](https://img.shields.io/badge/SQLite-EF_Core_9-003B57?logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-green)

## Overview

HRM Personnel Tracker is a standalone Windows desktop application that combines the power of .NET MAUI with a modern Next.js frontend. The app runs entirely offline — no server required. All data is stored locally in SQLite, and the UI is served from static files inside a WebView2 container.

### Key Features

- **Employee Management** — Full CRUD with department, title, contact info, TC identity number, and document archiving
- **Attendance Tracking** — Manual check-in/check-out with date & time selection, late detection, overtime calculation
- **Salary Definitions** — Per-employee salary setup with daily meal allowance, transport, health insurance, family, housing, education allowances, and bonuses
- **Payroll Engine** — Turkish payroll calculation with progressive income tax, SGK, unemployment insurance, stamp tax, cumulative tax base tracking
- **Overtime Pay** — Automatic calculation using the formula: `Gross / 225 × 1.5 × hours`
- **Meal Allowance** — Daily rate with automatic weekday counting (weekends excluded)
- **Leave Management** — Annual, sick, maternity, unpaid leave tracking with approval workflow
- **Reports** — PDF and Excel export for attendance and payroll, both company-wide and per-employee
- **Configurable Settings** — All payroll rates, SGK ceiling, and tax brackets are editable from the UI
- **Bilingual** — Full Turkish and English support across UI, PDFs, and Excel exports

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  .NET MAUI Shell                 │
│  ┌─────────────────────────────────────────────┐ │
│  │              WebView2 Container             │ │
│  │  ┌───────────────────────────────────────┐  │ │
│  │  │      Next.js 14 (Static Export)       │  │ │
│  │  │   React · Tailwind CSS · shadcn/ui    │  │ │
│  │  └──────────────┬────────────────────────┘  │ │
│  │                 │ JSON Bridge                │ │
│  │  ┌──────────────▼────────────────────────┐  │ │
│  │  │     BridgeRouter (Command Router)     │  │ │
│  │  └──────────────┬────────────────────────┘  │ │
│  └─────────────────┼───────────────────────────┘ │
│    ┌───────────────▼───────────────────────┐     │
│    │         Service Layer (C#)            │     │
│    │  Employee · Attendance · Payroll      │     │
│    │  Salary · Leave · Export · Settings   │     │
│    └───────────────┬───────────────────────┘     │
│    ┌───────────────▼───────────────────────┐     │
│    │     SQLite via EF Core 9              │     │
│    └───────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

### Data Flow

```
[Next.js UI] → bridge.invoke("checkIn", { employeeId: 1, date: "2026-02-15", time: "09:00" })
      ↓  window.chrome.webview.postMessage(object)
[MAUI WebView2] → WebMessageReceived → BridgeRouter.HandleCommandAsync()
      ↓
[Service Layer] → EF Core → SQLite
      ↓
[BridgeResponse JSON] → PostWebMessageAsString
      ↓  window.chrome.webview 'message' event
[Next.js UI] → Promise resolves → State update → Re-render
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | .NET MAUI 9 (Windows) |
| UI Framework | Next.js 14 (App Router, Static Export) |
| Styling | Tailwind CSS 3.4 + shadcn/ui |
| State | React hooks |
| i18n | i18next (frontend) + custom LanguageService (backend) |
| Database | SQLite via Entity Framework Core 9 |
| PDF Generation | QuestPDF |
| Excel Export | MiniExcel |
| Icons | Lucide React |

## Project Structure

```
hrm-project/
├── MauiApp/                        # .NET MAUI 9 backend
│   ├── Models/
│   │   ├── Employee.cs             # Employee entity
│   │   ├── Attendance.cs           # Daily attendance records
│   │   ├── Salary.cs               # Salary definitions (daily meal allowance)
│   │   ├── Payroll.cs              # Monthly payroll records
│   │   ├── PayrollSettings.cs      # Configurable rates & tax brackets
│   │   ├── Leave.cs                # Leave requests
│   │   └── BridgeCommand.cs        # JS ↔ C# message envelope
│   ├── Data/
│   │   ├── HrmDbContext.cs         # EF Core DbContext
│   │   └── SeedData.cs             # Initial data + auto-migration
│   ├── Services/
│   │   ├── BridgeRouter.cs         # Central command dispatcher
│   │   ├── EmployeeService.cs      # Employee CRUD
│   │   ├── AttendanceService.cs    # Check-in/out, overtime calc
│   │   ├── SalaryService.cs        # Salary definitions
│   │   ├── PayrollService.cs       # Full Turkish payroll engine
│   │   ├── PayrollSettingsService.cs # Rate management
│   │   ├── LeaveService.cs         # Leave request handling
│   │   ├── PdfExportService.cs     # QuestPDF report generation
│   │   ├── ExcelExportService.cs   # MiniExcel export
│   │   ├── LanguageService.cs      # Backend i18n
│   │   └── FileUploadService.cs    # Document archiving
│   ├── Resources/Languages/
│   │   ├── en.json                 # Backend EN translations
│   │   └── tr.json                 # Backend TR translations
│   └── MainPage.xaml.cs            # WebView2 host + bridge injection
│
├── NextFrontend/                   # Next.js 14 frontend
│   └── src/
│       ├── app/
│       │   ├── dashboard/          # KPI dashboard
│       │   ├── employees/          # Employee management
│       │   ├── attendance/         # Attendance tracking
│       │   ├── salary/             # Salary definitions
│       │   ├── payroll/            # Payroll generation
│       │   ├── leaves/             # Leave management
│       │   ├── reports/            # PDF & Excel export
│       │   └── settings/           # Payroll rate configuration
│       ├── components/
│       │   ├── ui/                 # shadcn/ui primitives
│       │   ├── layout/             # Sidebar, LanguageSwitcher
│       │   ├── employees/          # EmployeeList, EmployeeForm
│       │   ├── salary/             # SalaryForm, SalaryTable
│       │   ├── payroll/            # PayrollTable, PayrollDetail
│       │   └── ...
│       ├── lib/
│       │   ├── bridge.ts           # JS → C# bridge with timeout
│       │   ├── i18n.ts             # i18next setup
│       │   └── utils.ts            # Formatting helpers
│       └── locales/
│           ├── en.json             # Frontend EN translations
│           └── tr.json             # Frontend TR translations
│
├── run.ps1                         # One-command build & run
└── scripts/
    └── build.ps1                   # Detailed build script
```

## Payroll Calculation

The payroll engine implements Turkish labor law requirements:

### Earnings
| Component | Calculation |
|-----------|------------|
| Base Salary | Monthly gross salary |
| Meal Allowance | `Daily rate × weekdays in month` (weekends excluded) |
| Overtime Pay | `Gross / 225 × 1.5 × overtime hours` |
| Other Allowances | Transport, health insurance, family, housing, education |
| Bonus | Fixed monthly bonus |

### Deductions (Worker)
| Deduction | Default Rate |
|-----------|-------------|
| SGK Worker | 14% of gross |
| Unemployment Insurance | 1% of gross |
| Income Tax | Progressive brackets (cumulative) |
| Stamp Tax | 0.759% of total gross |

### Employer Cost
| Component | Default Rate |
|-----------|-------------|
| SGK Employer | 20.5% of gross |
| Unemployment Insurance | 2% of gross |

All rates and tax brackets are configurable from the Settings page.

## Reports

### Company-Wide Reports
- **Attendance PDF** — All employees, landscape A4, late arrivals highlighted
- **Attendance Excel** — Sortable spreadsheet with all attendance data
- **Payroll PDF** — Monthly payroll summary for all employees
- **Payroll Excel** — Detailed payroll data with all breakdown columns

### Per-Employee Reports
- **Employee Attendance PDF** — Detailed daily report with:
  - Employee info header (name, department, title)
  - Summary boxes (work days, late count, overtime hours, check-out count)
  - Day-by-day table with day names, worked hours, late/overtime flags
- **Employee Attendance Excel** — Same data in spreadsheet format with totals row

## Prerequisites

- **Windows 10** (version 1809+) or **Windows 11**
- **.NET 9 SDK** — [Download](https://dotnet.microsoft.com/download/dotnet/9.0)
- **.NET MAUI workload** — `dotnet workload install maui`
- **Node.js 18+** — [Download](https://nodejs.org/)
- **WebView2 Runtime** — Pre-installed on Windows 10/11 (ships with Edge)

## Quick Start

```powershell
# Clone the repository
git clone https://github.com/YUKSELutku/hrm-tracker.git
cd hrm-tracker

# Build and run (single command)
.\run.ps1
```

The `run.ps1` script will:
1. Install npm dependencies (if needed)
2. Build the Next.js frontend as a static export
3. Copy the output to the MAUI `wwwroot/` folder
4. Compile and launch the MAUI application

### Manual Build

```powershell
# 1. Build frontend
cd NextFrontend
npm install
npm run build

# 2. Copy static files to MAUI
Remove-Item -Recurse -Force ../MauiApp/wwwroot -ErrorAction SilentlyContinue
Copy-Item -Recurse out ../MauiApp/wwwroot

# 3. Build and run MAUI
cd ../MauiApp
dotnet run -f net9.0-windows10.0.19041.0
```

### Clean Build

```powershell
# Remove all build artifacts
Remove-Item -Recurse -Force MauiApp\bin, MauiApp\obj -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force NextFrontend\.next, NextFrontend\out -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force MauiApp\wwwroot -ErrorAction SilentlyContinue

# Optionally reset database
Remove-Item "$env:LOCALAPPDATA\HrmTracker\hrm.db" -ErrorAction SilentlyContinue

# Rebuild
.\run.ps1
```

## File Locations

| Item | Path |
|------|------|
| Database | `%LOCALAPPDATA%\HrmTracker\hrm.db` |
| Exported Reports | `%USERPROFILE%\Documents\HrmTracker\Exports\` |
| Employee Documents | `%LOCALAPPDATA%\HrmTracker\Files\` |

## Bridge API Reference

The frontend communicates with the C# backend through a JSON message bridge. All calls are asynchronous and return promises.

### Employees
```typescript
api.getEmployees()                    // → Employee[]
api.getEmployee(id)                   // → Employee
api.createEmployee(data)              // → Employee
api.updateEmployee(id, data)          // → Employee
api.deleteEmployee(id)                // → boolean
api.searchEmployees(term)             // → Employee[]
```

### Attendance
```typescript
api.checkIn(employeeId, date?, time?)     // → Attendance
api.checkOut(employeeId, date?, time?)    // → Attendance
api.getAttendanceByDate(date?)            // → Attendance[]
api.updateAttendance(id, checkIn, checkOut) // → Attendance
api.deleteAttendance(id)                  // → boolean
```

### Salary & Payroll
```typescript
api.getSalaries()                     // → SalaryDefinition[]
api.upsertSalary(data)               // → SalaryDefinition
api.generatePayroll(period)           // → PayrollRecord[]
api.getPayroll(period)                // → PayrollRecord[]
api.deletePeriodPayroll(period)       // → boolean
```

### Reports
```typescript
api.exportAttendancePdf(period)                      // → { filePath }
api.exportAttendanceExcel(period)                    // → { filePath }
api.exportEmployeeAttendancePdf(period, employeeId)  // → { filePath }
api.exportEmployeeAttendanceExcel(period, employeeId) // → { filePath }
api.exportPayrollPdf(period)                         // → { filePath }
api.exportPayrollExcel(period)                       // → { filePath }
```

### Settings
```typescript
api.getPayrollSettings()              // → PayrollSettingsData
api.updatePayrollSettings(data)       // → PayrollSettingsData
api.resetPayrollSettings()            // → PayrollSettingsData
```

## Internationalization

The application is fully bilingual. Language can be switched at runtime from the sidebar.

- **Frontend** — i18next with `locales/tr.json` and `locales/en.json`
- **Backend** — `LanguageService` loads `Resources/Languages/tr.json` and `en.json`
- **Reports** — PDF headers, column names, and Excel sheet names are all localized
- **Date Formatting** — Turkish locale for dates (e.g., "15 Şubat 2026 Pazar")

## Database

SQLite database is created automatically on first launch via `EnsureCreatedAsync()`. Schema changes are handled through automatic column migration in `SeedData.cs` using `ALTER TABLE` statements, so the app can upgrade existing databases without data loss.

### Seed Data

On first launch with an empty database, sample data is created:
- 3 employees (Ahmet Yılmaz, Elif Demir, Mehmet Kaya)
- Salary definitions with daily meal allowance
- Default payroll settings (2026 Turkish rates)
- Today's attendance records

## Screenshots

*Coming soon*

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
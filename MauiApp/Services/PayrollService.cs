// Path: MauiApp/Services/PayrollService.cs
using Microsoft.EntityFrameworkCore;
using HrmApp.Data;
using HrmApp.Models;

namespace HrmApp.Services;

/// <summary>
/// Full Turkish payroll calculation engine.
/// All rates are loaded from PayrollSettings (database-backed, user-editable).
/// </summary>
public class PayrollService(HrmDbContext db, SalaryService salaryService, PayrollSettingsService settingsService)
{
    // ══════════════════════════════════════════════════════════════
    //  GENERATE MONTHLY PAYROLL
    // ══════════════════════════════════════════════════════════════

    public async Task<List<Payroll>> GenerateMonthlyPayrollAsync(string period)
    {
        // Load current rates from settings
        var settings = await settingsService.GetActiveAsync();

        // Parse period → year, month
        var year = int.Parse(period[..4]);
        var month = int.Parse(period[5..7]);
        var weekdays = CountWeekdays(year, month);

        var activeEmployees = await db.Employees
            .Where(e => e.ActiveStatus)
            .ToListAsync();

        // Preload attendance overtime for this month
        var from = new DateOnly(year, month, 1);
        var to = from.AddMonths(1).AddDays(-1);
        var attendances = await db.Attendances
            .Where(a => a.Date >= from && a.Date <= to && a.OvertimeHours > 0)
            .ToListAsync();

        var generated = new List<Payroll>();

        foreach (var emp in activeEmployees)
        {
            // Skip if already generated
            var exists = await db.Payrolls
                .AnyAsync(p => p.EmployeeId == emp.Id && p.Period == period);
            if (exists) continue;

            // Get salary definition
            var salary = await salaryService.GetActiveAsync(emp.Id);
            if (salary is null) continue;

            // Get cumulative tax base from last month
            var yearStr = period[..4];
            var lastMonth = await db.Payrolls
                .Where(p => p.EmployeeId == emp.Id && p.Period.StartsWith(yearStr) && p.Period.CompareTo(period) < 0)
                .OrderByDescending(p => p.Period)
                .FirstOrDefaultAsync();
            var prevCumulative = lastMonth?.CumulativeTaxBase ?? 0m;

            // Get total overtime hours from attendance
            var overtimeHours = attendances
                .Where(a => a.EmployeeId == emp.Id)
                .Sum(a => a.OvertimeHours);

            var payroll = CalculatePayroll(salary, period, prevCumulative, settings, weekdays, overtimeHours);
            payroll.EmployeeId = emp.Id;

            db.Payrolls.Add(payroll);
            generated.Add(payroll);
        }

        await db.SaveChangesAsync();

        return await GetByPeriodAsync(period);
    }

    // ══════════════════════════════════════════════════════════════
    //  CALCULATION ENGINE — uses PayrollSettings
    // ══════════════════════════════════════════════════════════════

    public Payroll CalculatePayroll(Salary salary, string period, decimal prevCumulativeTaxBase,
        PayrollSettings settings, int weekdays, decimal overtimeHours)
    {
        var gross = salary.GrossSalary;

        // ── Yemek yardımı: günlük ücret × hafta içi gün sayısı ──
        var monthlyMeal = Math.Round(salary.MealAllowance * weekdays, 2);

        // ── Fazla mesai ücreti: brüt/225 × 1.5 × saat ──────────
        var overtimePay = overtimeHours > 0
            ? Math.Round(gross / 225m * 1.5m * overtimeHours, 2)
            : 0m;

        // ── Brüt kazançlar ──────────────────────────────────────
        var totalGross = gross
            + monthlyMeal
            + salary.TransportAllowance
            + salary.PrivateHealthInsurance
            + salary.FamilyAllowance
            + salary.HousingAllowance
            + salary.EducationAllowance
            + salary.MonthlyBonus
            + overtimePay;

        // ── SGK matrahı ─────────────────────────────────────────
        var sgkBase = gross;
        if (settings.SgkCeiling > 0 && sgkBase > settings.SgkCeiling)
            sgkBase = settings.SgkCeiling;

        var sgkWorker = Math.Round(sgkBase * settings.SgkWorkerRate, 2);
        var unemploymentWorker = Math.Round(sgkBase * settings.UnemploymentWorkerRate, 2);

        // ── Gelir vergisi matrahı ───────────────────────────────
        var taxableIncome = gross - sgkWorker - unemploymentWorker;
        if (taxableIncome < 0) taxableIncome = 0;

        // Cumulative progressive tax using configurable brackets
        var newCumulative = prevCumulativeTaxBase + taxableIncome;
        var brackets = settings.TaxBrackets;
        var incomeTax = CalculateProgressiveTax(newCumulative, brackets)
                      - CalculateProgressiveTax(prevCumulativeTaxBase, brackets);
        incomeTax = Math.Round(incomeTax, 2);

        // ── Damga vergisi ───────────────────────────────────────
        var stampTax = Math.Round(totalGross * settings.StampTaxRate, 2);

        // ── Toplam kesinti ──────────────────────────────────────
        var totalDeductions = sgkWorker + unemploymentWorker + incomeTax + stampTax;

        // ── Net maaş ────────────────────────────────────────────
        var netSalary = totalGross - totalDeductions;

        // ── İşveren maliyeti ────────────────────────────────────
        var sgkEmployer = Math.Round(sgkBase * settings.SgkEmployerRate, 2);
        var unemploymentEmployer = Math.Round(sgkBase * settings.UnemploymentEmployerRate, 2);
        var totalEmployerCost = totalGross + sgkEmployer + unemploymentEmployer;

        return new Payroll
        {
            Period = period,
            GrossSalary = gross,
            MealAllowance = monthlyMeal,
            TransportAllowance = salary.TransportAllowance,
            PrivateHealthInsurance = salary.PrivateHealthInsurance,
            FamilyAllowance = salary.FamilyAllowance,
            HousingAllowance = salary.HousingAllowance,
            EducationAllowance = salary.EducationAllowance,
            BonusAmount = salary.MonthlyBonus,
            OvertimePay = overtimePay,
            OvertimeHours = overtimeHours,
            MealWorkDays = weekdays,
            TotalGross = Math.Round(totalGross, 2),
            SgkWorker = sgkWorker,
            UnemploymentWorker = unemploymentWorker,
            IncomeTax = incomeTax,
            StampTax = stampTax,
            TotalDeductions = Math.Round(totalDeductions, 2),
            NetSalary = Math.Round(netSalary, 2),
            SgkEmployer = sgkEmployer,
            UnemploymentEmployer = unemploymentEmployer,
            TotalEmployerCost = Math.Round(totalEmployerCost, 2),
            CumulativeTaxBase = Math.Round(newCumulative, 2),
            CreatedAt = DateTime.UtcNow
        };
    }

    // ── Progressive tax calculation with configurable brackets ───

    private static decimal CalculateProgressiveTax(decimal cumulativeIncome, List<TaxBracket> brackets)
    {
        decimal tax = 0;
        decimal prev = 0;

        foreach (var bracket in brackets)
        {
            if (cumulativeIncome <= prev) break;

            var taxable = Math.Min(cumulativeIncome, bracket.Threshold) - prev;
            if (taxable > 0)
                tax += taxable * bracket.Rate;

            prev = bracket.Threshold;
        }

        return tax;
    }

    // ── Hafta içi gün sayısını hesapla ──────────────────────────

    private static int CountWeekdays(int year, int month)
    {
        var daysInMonth = DateTime.DaysInMonth(year, month);
        var count = 0;
        for (var day = 1; day <= daysInMonth; day++)
        {
            var dow = new DateTime(year, month, day).DayOfWeek;
            if (dow != DayOfWeek.Saturday && dow != DayOfWeek.Sunday)
                count++;
        }
        return count;
    }

    // ══════════════════════════════════════════════════════════════
    //  QUERIES
    // ══════════════════════════════════════════════════════════════

    public async Task<List<Payroll>> GetByPeriodAsync(string period) =>
        await db.Payrolls
            .Include(p => p.Employee)
            .Where(p => p.Period == period)
            .OrderBy(p => p.Employee!.FullName)
            .AsNoTracking()
            .ToListAsync();

    public async Task<List<Payroll>> GetByEmployeeAsync(int employeeId) =>
        await db.Payrolls
            .Where(p => p.EmployeeId == employeeId)
            .OrderByDescending(p => p.Period)
            .AsNoTracking()
            .ToListAsync();

    public async Task<Payroll?> GetSingleAsync(int employeeId, string period) =>
        await db.Payrolls
            .Include(p => p.Employee)
            .FirstOrDefaultAsync(p => p.EmployeeId == employeeId && p.Period == period);

    public async Task<bool> DeletePeriodAsync(string period)
    {
        var records = await db.Payrolls.Where(p => p.Period == period).ToListAsync();
        if (records.Count == 0) return false;
        db.Payrolls.RemoveRange(records);
        await db.SaveChangesAsync();
        return true;
    }
}
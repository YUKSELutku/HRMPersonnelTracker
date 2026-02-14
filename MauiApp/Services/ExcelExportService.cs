// Path: MauiApp/Services/ExcelExportService.cs
using MiniExcelLibs;
using HrmApp.Models;

namespace HrmApp.Services;

/// <summary>
/// Generates localized Excel exports using MiniExcel.
/// </summary>
public class ExcelExportService(LanguageService lang)
{
    // ── All employees attendance ──────────────────────────────────

    public string ExportAttendance(
        string languageCode,
        string period,
        List<Attendance> records)
    {
        string T(string key) => lang.T(languageCode, key);

        var rows = records.Select(r => new Dictionary<string, object?>
        {
            [T("col_employee_name")] = r.Employee?.FullName ?? "-",
            [T("col_department")] = r.Employee?.Department ?? "-",
            [T("col_date")] = r.Date.ToString("dd.MM.yyyy"),
            [T("col_checkin")] = r.CheckInTime?.ToString("HH:mm") ?? "-",
            [T("col_checkout")] = r.CheckOutTime?.ToString("HH:mm") ?? "-",
            [T("col_is_late")] = r.IsLate ? T("yes") : T("no"),
            [T("col_overtime")] = r.OvertimeHours > 0 ? r.OvertimeHours : 0m
        }).ToList();

        var filePath = GetExportPath($"Attendance_{period}.xlsx");
        MiniExcel.SaveAs(filePath, rows, sheetName: T("excel_sheet_name"));
        return filePath;
    }

    // ── Per-employee attendance ───────────────────────────────────

    public string ExportEmployeeAttendance(
        string languageCode,
        string period,
        Employee employee,
        List<Attendance> records)
    {
        string T(string key) => lang.T(languageCode, key);

        var dayNames = languageCode == "tr"
            ? new[] { "Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi" }
            : new[] { "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };

        var rows = records.Select((r, idx) =>
        {
            var workedStr = "-";
            if (r.CheckInTime.HasValue && r.CheckOutTime.HasValue)
            {
                var worked = r.CheckOutTime.Value.ToTimeSpan() - r.CheckInTime.Value.ToTimeSpan();
                workedStr = $"{(int)worked.TotalHours}:{worked.Minutes:D2}";
            }
            var dow = r.Date.ToDateTime(TimeOnly.MinValue).DayOfWeek;

            return new Dictionary<string, object?>
            {
                ["#"] = idx + 1,
                [T("col_date")] = r.Date.ToString("dd.MM.yyyy"),
                [T("col_day_name")] = dayNames[(int)dow],
                [T("col_checkin")] = r.CheckInTime?.ToString("HH:mm") ?? "-",
                [T("col_checkout")] = r.CheckOutTime?.ToString("HH:mm") ?? "-",
                [T("col_worked_hours")] = workedStr,
                [T("col_is_late")] = r.IsLate ? T("yes") : T("no"),
                [T("col_overtime")] = r.OvertimeHours > 0 ? r.OvertimeHours : 0m
            };
        }).ToList();

        // Add summary row
        rows.Add(new Dictionary<string, object?>
        {
            ["#"] = "",
            [T("col_date")] = "",
            [T("col_day_name")] = T("summary_totals"),
            [T("col_checkin")] = $"{records.Count} {T("summary_work_days_short")}",
            [T("col_checkout")] = $"{records.Count(r => r.CheckOutTime.HasValue)} {T("summary_checkout_short")}",
            [T("col_worked_hours")] = "",
            [T("col_is_late")] = $"{records.Count(r => r.IsLate)} {T("summary_late_short")}",
            [T("col_overtime")] = records.Sum(r => r.OvertimeHours)
        });

        var safeName = employee.FullName.Replace(" ", "_");
        var filePath = GetExportPath($"Puantaj_{safeName}_{period}.xlsx");
        MiniExcel.SaveAs(filePath, rows, sheetName: $"{employee.FullName} - {period}");
        return filePath;
    }

    // ── Payroll ──────────────────────────────────────────────────

    public string ExportPayroll(
        string languageCode,
        string period,
        List<Payroll> payrolls)
    {
        string T(string key) => lang.T(languageCode, key);

        var rows = payrolls.Select(p => new Dictionary<string, object?>
        {
            [T("col_employee_name")] = p.Employee?.FullName ?? "-",
            [T("col_department")] = p.Employee?.Department ?? "-",
            [T("col_period")] = p.Period,
            [T("col_base_salary")] = p.BaseSalary,
            [T("col_allowances")] = p.Allowances,
            [T("col_deductions")] = p.Deductions,
            [T("col_final_salary")] = p.FinalSalary
        }).ToList();

        var filePath = GetExportPath($"Payroll_{period}.xlsx");
        MiniExcel.SaveAs(filePath, rows, sheetName: T("excel_sheet_name"));
        return filePath;
    }

    // ── Employee list ────────────────────────────────────────────

    public string ExportEmployeeList(string languageCode, List<Employee> employees)
    {
        string T(string key) => lang.T(languageCode, key);

        var rows = employees.Select(e => new Dictionary<string, object?>
        {
            [T("col_employee_name")] = e.FullName,
            [T("col_department")] = e.Department ?? "-",
            [T("col_title")] = e.Title ?? "-",
            ["Email"] = e.Email ?? "-",
            [T("col_status")] = e.ActiveStatus ? T("status_active") : T("status_inactive")
        }).ToList();

        var filePath = GetExportPath("Employees.xlsx");
        MiniExcel.SaveAs(filePath, rows, sheetName: T("excel_sheet_name"));
        return filePath;
    }

    // ── Helper ───────────────────────────────────────────────────

    private static string GetExportPath(string fileName)
    {
        var exportDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            "HrmTracker", "Exports");
        Directory.CreateDirectory(exportDir);
        return Path.Combine(exportDir, fileName);
    }
}
// Path: MauiApp/Services/BridgeRouter.cs
using System.Text.Json;
using HrmApp.Models;

namespace HrmApp.Services;

/// <summary>
/// Central command router for the JS ↔ C# bridge.
/// 
/// Receives a BridgeCommand (deserialized from WebView postMessage),
/// dispatches to the appropriate service, and returns a BridgeResponse
/// that is sent back to JavaScript.
/// 
/// The `lang` field is forwarded to services that produce localized
/// output (PDFs, Excel files).
/// </summary>
public class BridgeRouter(
    EmployeeService employees,
    AttendanceService attendance,
    SalaryService salaries,
    PayrollService payroll,
    PayrollSettingsService payrollSettings,
    LeaveService leaves,
    FileUploadService fileUpload,
    PdfExportService pdfExport,
    ExcelExportService excelExport,
    LanguageService language)
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    };

    /// <summary>
    /// Main entry point. Called by MainPage.xaml.cs when a WebView message arrives.
    /// </summary>
    public async Task<BridgeResponse> HandleCommandAsync(BridgeCommand cmd)
    {
        try
        {
            return cmd.Command switch
            {
                // ── Employee CRUD ─────────────────────────────────
                "getEmployees" => await HandleGetEmployees(cmd),
                "getEmployee" => await HandleGetEmployee(cmd),
                "createEmployee" => await HandleCreateEmployee(cmd),
                "updateEmployee" => await HandleUpdateEmployee(cmd),
                "deleteEmployee" => await HandleDeleteEmployee(cmd),
                "searchEmployees" => await HandleSearchEmployees(cmd),

                // ── Attendance ────────────────────────────────────
                "checkIn" => await HandleCheckIn(cmd),
                "checkOut" => await HandleCheckOut(cmd),
                "getAttendanceByDate" => await HandleGetAttendanceByDate(cmd),
                "getAttendanceToday" => await HandleGetAttendanceByDate(cmd),
                "updateAttendance" => await HandleUpdateAttendance(cmd),
                "deleteAttendance" => await HandleDeleteAttendance(cmd),

                // ── Payroll ───────────────────────────────────────
                "generatePayroll" => await HandleGeneratePayroll(cmd),
                "getPayroll" => await HandleGetPayroll(cmd),
                "deletePeriodPayroll" => await HandleDeletePeriodPayroll(cmd),

                // ── Salary Management ─────────────────────────────
                "getSalaries" => await HandleGetSalaries(cmd),
                "getSalary" => await HandleGetSalary(cmd),
                "upsertSalary" => await HandleUpsertSalary(cmd),
                "deleteSalary" => await HandleDeleteSalary(cmd),

                // ── Dashboard KPIs ────────────────────────────────
                "getDashboard" => await HandleGetDashboard(cmd),

                // ── Leaves ────────────────────────────────────────
                "getLeaves" => await HandleGetLeaves(cmd),
                "createLeave" => await HandleCreateLeave(cmd),
                "updateLeaveStatus" => await HandleUpdateLeaveStatus(cmd),
                "deleteLeave" => await HandleDeleteLeave(cmd),

                // ── File Upload ───────────────────────────────────
                "uploadFile" => await HandleUploadFile(cmd),
                "getEmployeeFiles" => HandleGetEmployeeFiles(cmd),
                "deleteFile" => HandleDeleteFile(cmd),

                // ── Reports (PDF / Excel) ─────────────────────────
                "exportAttendancePdf" => await HandleExportAttendancePdf(cmd),
                "exportAttendanceExcel" => await HandleExportAttendanceExcel(cmd),
                "exportEmployeeAttendancePdf" => await HandleExportEmployeeAttendancePdf(cmd),
                "exportEmployeeAttendanceExcel" => await HandleExportEmployeeAttendanceExcel(cmd),
                "exportPayrollPdf" => await HandleExportPayrollPdf(cmd),
                "exportPayrollExcel" => await HandleExportPayrollExcel(cmd),

                // ── Language ──────────────────────────────────────
                "updateLanguage" => HandleUpdateLanguage(cmd),

                // ── Payroll Settings ─────────────────────────────
                "getPayrollSettings" => await HandleGetPayrollSettings(cmd),
                "updatePayrollSettings" => await HandleUpdatePayrollSettings(cmd),
                "resetPayrollSettings" => await HandleResetPayrollSettings(cmd),

                _ => BridgeResponse.Fail(cmd.Id, $"Unknown command: {cmd.Command}")
            };
        }
        catch (Exception ex)
        {
            return BridgeResponse.Fail(cmd.Id, ex.Message);
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  HANDLERS
    // ══════════════════════════════════════════════════════════════

    // ── Employees ─────────────────────────────────────────────────

    private async Task<BridgeResponse> HandleGetEmployees(BridgeCommand cmd)
    {
        var activeOnly = GetPayloadProp<bool?>(cmd, "activeOnly");
        var list = await employees.GetAllAsync(activeOnly);
        return BridgeResponse.Ok(cmd.Id, list);
    }

    private async Task<BridgeResponse> HandleGetEmployee(BridgeCommand cmd)
    {
        var id = GetPayloadProp<int>(cmd, "id");
        var emp = await employees.GetByIdAsync(id);
        return emp is not null
            ? BridgeResponse.Ok(cmd.Id, emp)
            : BridgeResponse.Fail(cmd.Id, "Employee not found");
    }

    private async Task<BridgeResponse> HandleCreateEmployee(BridgeCommand cmd)
    {
        var employee = DeserializePayload<Employee>(cmd);
        var created = await employees.CreateAsync(employee);
        return BridgeResponse.Ok(cmd.Id, created);
    }

    private async Task<BridgeResponse> HandleUpdateEmployee(BridgeCommand cmd)
    {
        var id = GetPayloadProp<int>(cmd, "id");
        var employee = DeserializePayload<Employee>(cmd);
        var updated = await employees.UpdateAsync(id, employee);
        return updated is not null
            ? BridgeResponse.Ok(cmd.Id, updated)
            : BridgeResponse.Fail(cmd.Id, "Employee not found");
    }

    private async Task<BridgeResponse> HandleDeleteEmployee(BridgeCommand cmd)
    {
        var id = GetPayloadProp<int>(cmd, "id");
        var ok = await employees.DeactivateAsync(id); // soft delete
        return ok
            ? BridgeResponse.Ok(cmd.Id)
            : BridgeResponse.Fail(cmd.Id, "Employee not found");
    }

    private async Task<BridgeResponse> HandleSearchEmployees(BridgeCommand cmd)
    {
        var term = GetPayloadProp<string>(cmd, "term") ?? "";
        var results = await employees.SearchAsync(term);
        return BridgeResponse.Ok(cmd.Id, results);
    }

    // ── Attendance ────────────────────────────────────────────────

    private async Task<BridgeResponse> HandleCheckIn(BridgeCommand cmd)
    {
        var empId = GetPayloadProp<int>(cmd, "employeeId");
        var dateStr = GetPayloadProp<string>(cmd, "date");
        var timeStr = GetPayloadProp<string>(cmd, "time");

        DateOnly? date = !string.IsNullOrWhiteSpace(dateStr) ? DateOnly.Parse(dateStr) : null;
        TimeOnly? time = !string.IsNullOrWhiteSpace(timeStr) ? TimeOnly.Parse(timeStr) : null;

        var record = await attendance.CheckInAsync(empId, date, time);
        return BridgeResponse.Ok(cmd.Id, record);
    }

    private async Task<BridgeResponse> HandleCheckOut(BridgeCommand cmd)
    {
        var empId = GetPayloadProp<int>(cmd, "employeeId");
        var dateStr = GetPayloadProp<string>(cmd, "date");
        var timeStr = GetPayloadProp<string>(cmd, "time");

        DateOnly? date = !string.IsNullOrWhiteSpace(dateStr) ? DateOnly.Parse(dateStr) : null;
        TimeOnly? time = !string.IsNullOrWhiteSpace(timeStr) ? TimeOnly.Parse(timeStr) : null;

        var record = await attendance.CheckOutAsync(empId, date, time);
        return BridgeResponse.Ok(cmd.Id, record);
    }

    private async Task<BridgeResponse> HandleGetAttendanceByDate(BridgeCommand cmd)
    {
        var dateStr = GetPayloadProp<string>(cmd, "date");
        var date = !string.IsNullOrWhiteSpace(dateStr) ? DateOnly.Parse(dateStr) : DateOnly.FromDateTime(DateTime.Today);
        var records = await attendance.GetByDateAsync(date);
        return BridgeResponse.Ok(cmd.Id, records);
    }

    private async Task<BridgeResponse> HandleUpdateAttendance(BridgeCommand cmd)
    {
        var id = GetPayloadProp<int>(cmd, "id");
        var checkInStr = GetPayloadProp<string>(cmd, "checkInTime");
        var checkOutStr = GetPayloadProp<string>(cmd, "checkOutTime");

        TimeOnly? checkIn = !string.IsNullOrWhiteSpace(checkInStr) ? TimeOnly.Parse(checkInStr) : null;
        TimeOnly? checkOut = !string.IsNullOrWhiteSpace(checkOutStr) ? TimeOnly.Parse(checkOutStr) : null;

        var record = await attendance.UpdateAsync(id, checkIn, checkOut);
        return record is not null
            ? BridgeResponse.Ok(cmd.Id, record)
            : BridgeResponse.Fail(cmd.Id, "Record not found");
    }

    private async Task<BridgeResponse> HandleDeleteAttendance(BridgeCommand cmd)
    {
        var id = GetPayloadProp<int>(cmd, "id");
        var ok = await attendance.DeleteAsync(id);
        return ok ? BridgeResponse.Ok(cmd.Id) : BridgeResponse.Fail(cmd.Id, "Record not found");
    }

    // ── Payroll ───────────────────────────────────────────────────

    private async Task<BridgeResponse> HandleGeneratePayroll(BridgeCommand cmd)
    {
        var period = GetPayloadProp<string>(cmd, "period") ?? DateTime.Now.ToString("yyyy-MM");
        var generated = await payroll.GenerateMonthlyPayrollAsync(period);
        return BridgeResponse.Ok(cmd.Id, generated);
    }

    private async Task<BridgeResponse> HandleGetPayroll(BridgeCommand cmd)
    {
        var period = GetPayloadProp<string>(cmd, "period") ?? DateTime.Now.ToString("yyyy-MM");
        var records = await payroll.GetByPeriodAsync(period);
        return BridgeResponse.Ok(cmd.Id, records);
    }

    private async Task<BridgeResponse> HandleDeletePeriodPayroll(BridgeCommand cmd)
    {
        var period = GetPayloadProp<string>(cmd, "period") ?? "";
        var ok = await payroll.DeletePeriodAsync(period);
        return ok ? BridgeResponse.Ok(cmd.Id) : BridgeResponse.Fail(cmd.Id, "No records found");
    }

    // ── Salary Management ──────────────────────────────────────

    private async Task<BridgeResponse> HandleGetSalaries(BridgeCommand cmd)
    {
        var list = await salaries.GetAllActiveAsync();
        return BridgeResponse.Ok(cmd.Id, list);
    }

    private async Task<BridgeResponse> HandleGetSalary(BridgeCommand cmd)
    {
        var empId = GetPayloadProp<int>(cmd, "employeeId");
        var salary = await salaries.GetActiveAsync(empId);
        return salary is not null
            ? BridgeResponse.Ok(cmd.Id, salary)
            : BridgeResponse.Fail(cmd.Id, "No salary definition found");
    }

    private async Task<BridgeResponse> HandleUpsertSalary(BridgeCommand cmd)
    {
        var salary = DeserializePayload<Salary>(cmd);
        var result = await salaries.UpsertAsync(salary);
        return BridgeResponse.Ok(cmd.Id, result);
    }

    private async Task<BridgeResponse> HandleDeleteSalary(BridgeCommand cmd)
    {
        var id = GetPayloadProp<int>(cmd, "id");
        var ok = await salaries.DeleteAsync(id);
        return ok ? BridgeResponse.Ok(cmd.Id) : BridgeResponse.Fail(cmd.Id, "Salary not found");
    }

    // ── Dashboard ─────────────────────────────────────────────────

    private async Task<BridgeResponse> HandleGetDashboard(BridgeCommand cmd)
    {
        var activeCount = await employees.GetActiveCountAsync();
        var lateCount = await attendance.GetLateCountTodayAsync();

        return BridgeResponse.Ok(cmd.Id, new
        {
            activeEmployees = activeCount,
            lateArrivals = lateCount,
            date = DateTime.Today.ToString("yyyy-MM-dd")
        });
    }

    // ── PDF Exports ───────────────────────────────────────────────

    private async Task<BridgeResponse> HandleExportAttendancePdf(BridgeCommand cmd)
    {
        var period = GetPayloadProp<string>(cmd, "period") ?? DateTime.Now.ToString("yyyy-MM");
        var parts = period.Split('-');
        var records = await attendance.GetMonthlyReportAsync(int.Parse(parts[0]), int.Parse(parts[1]));

        var pdfBytes = pdfExport.GenerateAttendanceReport(cmd.Lang, period, records);
        var filePath = SaveExport(pdfBytes, $"Puantaj_{period}.pdf");

        return BridgeResponse.Ok(cmd.Id, new { filePath });
    }

    private async Task<BridgeResponse> HandleExportPayrollPdf(BridgeCommand cmd)
    {
        var period = GetPayloadProp<string>(cmd, "period") ?? DateTime.Now.ToString("yyyy-MM");
        var records = await payroll.GetByPeriodAsync(period);

        var pdfBytes = pdfExport.GeneratePayrollReport(cmd.Lang, period, records);
        var filePath = SaveExport(pdfBytes, $"Payroll_{period}.pdf");

        return BridgeResponse.Ok(cmd.Id, new { filePath });
    }

    // ── Excel Exports ─────────────────────────────────────────────

    private async Task<BridgeResponse> HandleExportAttendanceExcel(BridgeCommand cmd)
    {
        var period = GetPayloadProp<string>(cmd, "period") ?? DateTime.Now.ToString("yyyy-MM");
        var parts = period.Split('-');
        var records = await attendance.GetMonthlyReportAsync(int.Parse(parts[0]), int.Parse(parts[1]));

        var filePath = excelExport.ExportAttendance(cmd.Lang, period, records);
        return BridgeResponse.Ok(cmd.Id, new { filePath });
    }

    // ── Per-Employee Exports ──────────────────────────────────────

    private async Task<BridgeResponse> HandleExportEmployeeAttendancePdf(BridgeCommand cmd)
    {
        var period = GetPayloadProp<string>(cmd, "period") ?? DateTime.Now.ToString("yyyy-MM");
        var employeeId = GetPayloadProp<int>(cmd, "employeeId");
        if (employeeId <= 0)
            return BridgeResponse.Fail(cmd.Id, "employeeId is required");

        var parts = period.Split('-');
        var year = int.Parse(parts[0]);
        var month = int.Parse(parts[1]);

        var emp = await employees.GetByIdAsync(employeeId);
        if (emp is null)
            return BridgeResponse.Fail(cmd.Id, "Employee not found");

        var records = await attendance.GetMonthlyByEmployeeAsync(employeeId, year, month);

        var pdfBytes = pdfExport.GenerateEmployeeAttendanceReport(cmd.Lang, period, emp, records);
        var safeName = emp.FullName.Replace(" ", "_");
        var filePath = SaveExport(pdfBytes, $"Puantaj_{safeName}_{period}.pdf");

        return BridgeResponse.Ok(cmd.Id, new { filePath });
    }

    private async Task<BridgeResponse> HandleExportEmployeeAttendanceExcel(BridgeCommand cmd)
    {
        var period = GetPayloadProp<string>(cmd, "period") ?? DateTime.Now.ToString("yyyy-MM");
        var employeeId = GetPayloadProp<int>(cmd, "employeeId");
        if (employeeId <= 0)
            return BridgeResponse.Fail(cmd.Id, "employeeId is required");

        var parts = period.Split('-');
        var year = int.Parse(parts[0]);
        var month = int.Parse(parts[1]);

        var emp = await employees.GetByIdAsync(employeeId);
        if (emp is null)
            return BridgeResponse.Fail(cmd.Id, "Employee not found");

        var records = await attendance.GetMonthlyByEmployeeAsync(employeeId, year, month);

        var filePath = excelExport.ExportEmployeeAttendance(cmd.Lang, period, emp, records);
        return BridgeResponse.Ok(cmd.Id, new { filePath });
    }

    private async Task<BridgeResponse> HandleExportPayrollExcel(BridgeCommand cmd)
    {
        var period = GetPayloadProp<string>(cmd, "period") ?? DateTime.Now.ToString("yyyy-MM");
        var records = await payroll.GetByPeriodAsync(period);

        var filePath = excelExport.ExportPayroll(cmd.Lang, period, records);
        return BridgeResponse.Ok(cmd.Id, new { filePath });
    }

    // ── Language ──────────────────────────────────────────────────

    private BridgeResponse HandleUpdateLanguage(BridgeCommand cmd)
    {
        var newLang = GetPayloadProp<string>(cmd, "lang") ?? cmd.Lang;
        return BridgeResponse.Ok(cmd.Id, new { lang = newLang, message = "Language updated" });
    }

    // ── Payroll Settings ───────────────────────────────────────────

    private async Task<BridgeResponse> HandleGetPayrollSettings(BridgeCommand cmd)
    {
        var settings = await payrollSettings.GetActiveAsync();
        return BridgeResponse.Ok(cmd.Id, settings);
    }

    private async Task<BridgeResponse> HandleUpdatePayrollSettings(BridgeCommand cmd)
    {
        var updated = DeserializePayload<PayrollSettings>(cmd);
        var result = await payrollSettings.UpdateAsync(updated);
        return BridgeResponse.Ok(cmd.Id, result);
    }

    private async Task<BridgeResponse> HandleResetPayrollSettings(BridgeCommand cmd)
    {
        var result = await payrollSettings.ResetToDefaultAsync();
        return BridgeResponse.Ok(cmd.Id, result);
    }

    // ── Leaves ────────────────────────────────────────────────────

    private async Task<BridgeResponse> HandleGetLeaves(BridgeCommand cmd)
    {
        var empId = GetPayloadProp<int?>(cmd, "employeeId");
        var records = empId.HasValue
            ? await leaves.GetByEmployeeAsync(empId.Value)
            : await leaves.GetAllAsync();
        return BridgeResponse.Ok(cmd.Id, records);
    }

    private async Task<BridgeResponse> HandleCreateLeave(BridgeCommand cmd)
    {
        var empId = GetPayloadProp<int>(cmd, "employeeId");
        var startStr = GetPayloadProp<string>(cmd, "startDate") ?? DateTime.Now.ToString("yyyy-MM-dd");
        var endStr = GetPayloadProp<string>(cmd, "endDate") ?? DateTime.Now.ToString("yyyy-MM-dd");
        var typeStr = GetPayloadProp<string>(cmd, "type") ?? "Annual";

        var startDate = DateTime.Parse(startStr);
        var endDate = DateTime.Parse(endStr);
        if (!Enum.TryParse<Models.LeaveType>(typeStr, out var leaveType))
            leaveType = Models.LeaveType.Annual;

        var leave = await leaves.CreateAsync(empId, startDate, endDate, leaveType);
        return BridgeResponse.Ok(cmd.Id, leave);
    }

    private async Task<BridgeResponse> HandleUpdateLeaveStatus(BridgeCommand cmd)
    {
        var id = GetPayloadProp<int>(cmd, "id");
        var statusStr = GetPayloadProp<string>(cmd, "status") ?? "Pending";
        if (!Enum.TryParse<Models.LeaveStatus>(statusStr, out var status))
            status = Models.LeaveStatus.Pending;

        var leave = await leaves.UpdateStatusAsync(id, status);
        return leave is not null
            ? BridgeResponse.Ok(cmd.Id, leave)
            : BridgeResponse.Fail(cmd.Id, "Leave not found");
    }

    private async Task<BridgeResponse> HandleDeleteLeave(BridgeCommand cmd)
    {
        var id = GetPayloadProp<int>(cmd, "id");
        var ok = await leaves.DeleteAsync(id);
        return ok ? BridgeResponse.Ok(cmd.Id) : BridgeResponse.Fail(cmd.Id, "Leave not found");
    }

    // ── File Upload ───────────────────────────────────────────────

    private async Task<BridgeResponse> HandleUploadFile(BridgeCommand cmd)
    {
        var empId = GetPayloadProp<int>(cmd, "employeeId");
        var fileName = GetPayloadProp<string>(cmd, "fileName") ?? "file";
        var base64 = GetPayloadProp<string>(cmd, "base64Content") ?? "";

        var filePath = await fileUpload.SaveFileAsync(empId, fileName, base64);
        await employees.AddArchiveFileAsync(empId, filePath);
        return BridgeResponse.Ok(cmd.Id, new { filePath });
    }

    private BridgeResponse HandleGetEmployeeFiles(BridgeCommand cmd)
    {
        var empId = GetPayloadProp<int>(cmd, "employeeId");
        var files = fileUpload.GetEmployeeFiles(empId)
            .Select(f => new { name = f.Name, path = f.FullName, size = f.Length, created = f.CreationTime })
            .ToList();
        return BridgeResponse.Ok(cmd.Id, files);
    }

    private BridgeResponse HandleDeleteFile(BridgeCommand cmd)
    {
        var filePath = GetPayloadProp<string>(cmd, "filePath") ?? "";
        var ok = fileUpload.DeleteFile(filePath);
        return ok ? BridgeResponse.Ok(cmd.Id) : BridgeResponse.Fail(cmd.Id, "File not found");
    }

    // ══════════════════════════════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════════════════════════════

    private static T? GetPayloadProp<T>(BridgeCommand cmd, string prop)
    {
        if (cmd.Payload is null) return default;
        if (cmd.Payload.Value.TryGetProperty(prop, out var element))
            return JsonSerializer.Deserialize<T>(element.GetRawText(), JsonOpts);
        return default;
    }

    private static T DeserializePayload<T>(BridgeCommand cmd) where T : new()
    {
        if (cmd.Payload is null) return new T();
        return JsonSerializer.Deserialize<T>(cmd.Payload.Value.GetRawText(), JsonOpts) ?? new T();
    }

    private static string SaveExport(byte[] bytes, string fileName)
    {
        var dir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            "HrmTracker", "Exports");
        Directory.CreateDirectory(dir);
        var path = Path.Combine(dir, fileName);
        File.WriteAllBytes(path, bytes);
        return path;
    }
}
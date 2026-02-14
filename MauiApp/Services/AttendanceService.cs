// Path: MauiApp/Services/AttendanceService.cs
using Microsoft.EntityFrameworkCore;
using HrmApp.Data;
using HrmApp.Models;

namespace HrmApp.Services;

public class AttendanceService(HrmDbContext db)
{
    private static readonly TimeOnly ShiftStart = new(9, 0);
    private const decimal StandardShiftHours = 8m;

    // ── Check-In (with optional date & time) ────────────────────

    public async Task<Attendance> CheckInAsync(int employeeId, DateOnly? date = null, TimeOnly? time = null)
    {
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.Today);
        var targetTime = time ?? TimeOnly.FromDateTime(DateTime.Now);

        var existing = await db.Attendances
            .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.Date == targetDate);

        if (existing is not null)
        {
            if (existing.CheckInTime is not null)
                throw new InvalidOperationException("Already checked in for this date.");

            existing.CheckInTime = targetTime;
            existing.IsLate = targetTime > ShiftStart;
            RecalcOvertime(existing);
        }
        else
        {
            existing = new Attendance
            {
                EmployeeId = employeeId,
                Date = targetDate,
                CheckInTime = targetTime,
                IsLate = targetTime > ShiftStart
            };
            db.Attendances.Add(existing);
        }

        await db.SaveChangesAsync();
        return await ReloadWithEmployee(existing.Id);
    }

    // ── Check-Out (with optional date & time) ───────────────────

    public async Task<Attendance> CheckOutAsync(int employeeId, DateOnly? date = null, TimeOnly? time = null)
    {
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.Today);
        var targetTime = time ?? TimeOnly.FromDateTime(DateTime.Now);

        var record = await db.Attendances
            .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.Date == targetDate)
            ?? throw new InvalidOperationException("No check-in record found for this date.");

        record.CheckOutTime = targetTime;
        RecalcOvertime(record);

        await db.SaveChangesAsync();
        return await ReloadWithEmployee(record.Id);
    }

    // ── Update (edit existing record) ───────────────────────────

    public async Task<Attendance?> UpdateAsync(int id, TimeOnly? checkIn, TimeOnly? checkOut)
    {
        var record = await db.Attendances.FindAsync(id);
        if (record is null) return null;

        record.CheckInTime = checkIn;
        record.CheckOutTime = checkOut;
        record.IsLate = checkIn.HasValue && checkIn.Value > ShiftStart;
        RecalcOvertime(record);

        await db.SaveChangesAsync();
        return await ReloadWithEmployee(record.Id);
    }

    // ── Delete ──────────────────────────────────────────────────

    public async Task<bool> DeleteAsync(int id)
    {
        var record = await db.Attendances.FindAsync(id);
        if (record is null) return false;
        db.Attendances.Remove(record);
        await db.SaveChangesAsync();
        return true;
    }

    // ── Queries ─────────────────────────────────────────────────

    public async Task<List<Attendance>> GetByDateAsync(DateOnly date) =>
        await db.Attendances
            .Include(a => a.Employee)
            .Where(a => a.Date == date)
            .OrderBy(a => a.Employee.FullName)
            .AsNoTracking()
            .ToListAsync();

    public async Task<List<Attendance>> GetByEmployeeAndPeriodAsync(
        int employeeId, DateOnly from, DateOnly to) =>
        await db.Attendances
            .Where(a => a.EmployeeId == employeeId && a.Date >= from && a.Date <= to)
            .OrderBy(a => a.Date)
            .AsNoTracking()
            .ToListAsync();

    public async Task<int> GetLateCountTodayAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        return await db.Attendances.CountAsync(a => a.Date == today && a.IsLate);
    }

    public async Task<List<Attendance>> GetMonthlyReportAsync(int year, int month)
    {
        var from = new DateOnly(year, month, 1);
        var to = from.AddMonths(1).AddDays(-1);

        return await db.Attendances
            .Include(a => a.Employee)
            .Where(a => a.Date >= from && a.Date <= to)
            .OrderBy(a => a.Employee.FullName)
            .ThenBy(a => a.Date)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<Attendance>> GetMonthlyByEmployeeAsync(int employeeId, int year, int month)
    {
        var from = new DateOnly(year, month, 1);
        var to = from.AddMonths(1).AddDays(-1);

        return await db.Attendances
            .Include(a => a.Employee)
            .Where(a => a.EmployeeId == employeeId && a.Date >= from && a.Date <= to)
            .OrderBy(a => a.Date)
            .AsNoTracking()
            .ToListAsync();
    }

    // ── Helpers ─────────────────────────────────────────────────

    private static void RecalcOvertime(Attendance record)
    {
        record.OvertimeHours = 0;
        if (record.CheckInTime is not null && record.CheckOutTime is not null)
        {
            var worked = record.CheckOutTime.Value.ToTimeSpan() - record.CheckInTime.Value.ToTimeSpan();
            var hours = (decimal)worked.TotalHours;
            record.OvertimeHours = Math.Max(0, Math.Round(hours - StandardShiftHours, 2));
        }
    }

    private async Task<Attendance> ReloadWithEmployee(int id) =>
        await db.Attendances
            .Include(a => a.Employee)
            .AsNoTracking()
            .FirstAsync(a => a.Id == id);
}
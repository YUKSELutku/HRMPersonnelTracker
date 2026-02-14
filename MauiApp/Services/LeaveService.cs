// Path: MauiApp/Services/LeaveService.cs
using Microsoft.EntityFrameworkCore;
using HrmApp.Data;
using HrmApp.Models;

namespace HrmApp.Services;

public class LeaveService(HrmDbContext db)
{
    public async Task<List<Leave>> GetAllAsync() =>
        await db.Leaves
            .Include(l => l.Employee)
            .OrderByDescending(l => l.StartDate)
            .AsNoTracking()
            .ToListAsync();

    public async Task<List<Leave>> GetByEmployeeAsync(int employeeId) =>
        await db.Leaves
            .Where(l => l.EmployeeId == employeeId)
            .OrderByDescending(l => l.StartDate)
            .AsNoTracking()
            .ToListAsync();

    public async Task<List<Leave>> GetPendingAsync() =>
        await db.Leaves
            .Include(l => l.Employee)
            .Where(l => l.Status == LeaveStatus.Pending)
            .OrderBy(l => l.StartDate)
            .AsNoTracking()
            .ToListAsync();

    public async Task<Leave> CreateAsync(int employeeId, DateTime startDate, DateTime endDate, LeaveType type)
    {
        if (endDate < startDate)
            throw new InvalidOperationException("End date cannot be before start date.");

        // Check for overlapping leaves
        var overlap = await db.Leaves.AnyAsync(l =>
            l.EmployeeId == employeeId &&
            l.Status != LeaveStatus.Rejected &&
            l.StartDate < endDate &&
            l.EndDate > startDate);

        if (overlap)
            throw new InvalidOperationException("Employee already has an active leave in this period.");

        var leave = new Leave
        {
            EmployeeId = employeeId,
            StartDate = startDate,
            EndDate = endDate,
            Type = type,
            Status = LeaveStatus.Pending
        };

        db.Leaves.Add(leave);
        await db.SaveChangesAsync();
        return leave;
    }

    public async Task<Leave?> UpdateStatusAsync(int leaveId, LeaveStatus newStatus)
    {
        var leave = await db.Leaves.FindAsync(leaveId);
        if (leave is null) return null;

        leave.Status = newStatus;
        await db.SaveChangesAsync();
        return leave;
    }

    public async Task<bool> DeleteAsync(int leaveId)
    {
        var leave = await db.Leaves.FindAsync(leaveId);
        if (leave is null) return false;

        db.Leaves.Remove(leave);
        await db.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Get remaining annual leave days for an employee in a given year.
    /// Default entitlement: 14 days/year (Turkish Labor Law minimum).
    /// </summary>
    public async Task<int> GetRemainingAnnualDaysAsync(int employeeId, int year)
    {
        const int annualEntitlement = 14;

        var approvedLeaves = await db.Leaves
            .Where(l => l.EmployeeId == employeeId &&
                        l.Type == LeaveType.Annual &&
                        l.Status == LeaveStatus.Approved &&
                        l.StartDate.Year == year)
            .AsNoTracking()
            .ToListAsync();

        // Calculate in memory (SQLite doesn't support DateDiffDay)
        var usedDays = approvedLeaves.Sum(l => (l.EndDate - l.StartDate).Days + 1);

        return annualEntitlement - usedDays;
    }
}
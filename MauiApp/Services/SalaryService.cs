// Path: MauiApp/Services/SalaryService.cs
using Microsoft.EntityFrameworkCore;
using HrmApp.Data;
using HrmApp.Models;

namespace HrmApp.Services;

/// <summary>
/// Manages salary definitions (contract data) for employees.
/// Each employee has one active salary definition at a time.
/// </summary>
public class SalaryService(HrmDbContext db)
{
    /// <summary>Get the currently active salary for an employee.</summary>
    public async Task<Salary?> GetActiveAsync(int employeeId) =>
        await db.Salaries
            .Include(s => s.Employee)
            .Where(s => s.EmployeeId == employeeId && s.IsActive)
            .OrderByDescending(s => s.EffectiveDate)
            .AsNoTracking()
            .FirstOrDefaultAsync();

    /// <summary>Get all salary definitions (active ones, with employee info).</summary>
    public async Task<List<Salary>> GetAllActiveAsync() =>
        await db.Salaries
            .Include(s => s.Employee)
            .Where(s => s.IsActive)
            .OrderBy(s => s.Employee!.FullName)
            .AsNoTracking()
            .ToListAsync();

    /// <summary>Get salary history for an employee.</summary>
    public async Task<List<Salary>> GetHistoryAsync(int employeeId) =>
        await db.Salaries
            .Where(s => s.EmployeeId == employeeId)
            .OrderByDescending(s => s.EffectiveDate)
            .AsNoTracking()
            .ToListAsync();

    /// <summary>
    /// Create or update salary definition.
    /// Deactivates previous active salary for the same employee.
    /// </summary>
    public async Task<Salary> UpsertAsync(Salary salary)
    {
        // Deactivate previous active salaries for this employee
        var existing = await db.Salaries
            .Where(s => s.EmployeeId == salary.EmployeeId && s.IsActive)
            .ToListAsync();

        foreach (var old in existing)
            old.IsActive = false;

        // Create new active salary
        salary.Id = 0;
        salary.IsActive = true;
        salary.CreatedAt = DateTime.UtcNow;

        db.Salaries.Add(salary);
        await db.SaveChangesAsync();

        // Reload with employee
        return (await GetActiveAsync(salary.EmployeeId))!;
    }

    /// <summary>Delete a salary definition.</summary>
    public async Task<bool> DeleteAsync(int id)
    {
        var salary = await db.Salaries.FindAsync(id);
        if (salary is null) return false;

        db.Salaries.Remove(salary);
        await db.SaveChangesAsync();
        return true;
    }
}
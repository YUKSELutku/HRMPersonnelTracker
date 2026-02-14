// Path: MauiApp/Services/EmployeeService.cs
using Microsoft.EntityFrameworkCore;
using HrmApp.Data;
using HrmApp.Models;

namespace HrmApp.Services;

public class EmployeeService(HrmDbContext db)
{
    public async Task<List<Employee>> GetAllAsync(bool? activeOnly = null)
    {
        var query = db.Employees.AsQueryable();

        if (activeOnly == true)
            query = query.Where(e => e.ActiveStatus);

        return await query
            .OrderBy(e => e.FullName)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Employee?> GetByIdAsync(int id) =>
        await db.Employees
            .Include(e => e.Attendances.OrderByDescending(a => a.Date).Take(30))
            .Include(e => e.Leaves.OrderByDescending(l => l.StartDate).Take(10))
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id);

    public async Task<Employee> CreateAsync(Employee employee)
    {
        employee.HireDate = employee.HireDate == default ? DateTime.Now : employee.HireDate;
        employee.ActiveStatus = true;

        db.Employees.Add(employee);
        await db.SaveChangesAsync();
        return employee;
    }

    public async Task<Employee?> UpdateAsync(int id, Employee updated)
    {
        var existing = await db.Employees.FindAsync(id);
        if (existing is null) return null;

        existing.FullName = updated.FullName;
        existing.TC_No = updated.TC_No;
        existing.BirthDate = updated.BirthDate;
        existing.Phone = updated.Phone;
        existing.Email = updated.Email;
        existing.Department = updated.Department;
        existing.Title = updated.Title;
        existing.HireDate = updated.HireDate;
        existing.ActiveStatus = updated.ActiveStatus;
        existing.ArchivePaths = updated.ArchivePaths;

        await db.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var employee = await db.Employees.FindAsync(id);
        if (employee is null) return false;

        db.Employees.Remove(employee);
        await db.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Soft-delete: marks employee as inactive instead of removing.
    /// </summary>
    public async Task<bool> DeactivateAsync(int id)
    {
        var employee = await db.Employees.FindAsync(id);
        if (employee is null) return false;

        employee.ActiveStatus = false;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetActiveCountAsync() =>
        await db.Employees.CountAsync(e => e.ActiveStatus);

    public async Task<List<Employee>> SearchAsync(string term) =>
        await db.Employees
            .Where(e => e.FullName.Contains(term) ||
                        (e.Department != null && e.Department.Contains(term)) ||
                        (e.Email != null && e.Email.Contains(term)))
            .OrderBy(e => e.FullName)
            .AsNoTracking()
            .ToListAsync();

    /// <summary>
    /// Attach an uploaded file path to the employee's archive.
    /// </summary>
    public async Task<bool> AddArchiveFileAsync(int employeeId, string filePath)
    {
        var employee = await db.Employees.FindAsync(employeeId);
        if (employee is null) return false;

        employee.ArchivePaths.Add(filePath);
        await db.SaveChangesAsync();
        return true;
    }
}
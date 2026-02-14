// Path: MauiApp/Models/Employee.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HrmApp.Models;

public class Employee
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(11)]
    public string? TC_No { get; set; }

    public DateTime? BirthDate { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(100)]
    public string? Department { get; set; }

    [MaxLength(100)]
    public string? Title { get; set; }

    public DateTime HireDate { get; set; } = DateTime.Now;

    public bool ActiveStatus { get; set; } = true;

    /// <summary>
    /// JSON-serialized list of file paths attached to this employee.
    /// Stored as TEXT in SQLite; EF Core value converter handles serialization.
    /// </summary>
    public List<string> ArchivePaths { get; set; } = [];

    // Navigation properties
    public ICollection<Attendance> Attendances { get; set; } = [];
    public ICollection<Leave> Leaves { get; set; } = [];
    public ICollection<Payroll> Payrolls { get; set; } = [];
    public ICollection<Salary> Salaries { get; set; } = [];
}
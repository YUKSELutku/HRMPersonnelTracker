// Path: MauiApp/Models/Attendance.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HrmApp.Models;

public class Attendance
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int EmployeeId { get; set; }

    [ForeignKey(nameof(EmployeeId))]
    public Employee Employee { get; set; } = null!;

    [Required]
    public DateOnly Date { get; set; }

    public TimeOnly? CheckInTime { get; set; }

    public TimeOnly? CheckOutTime { get; set; }

    /// <summary>
    /// Computed flag: true if CheckInTime is after the company-defined start time (e.g. 09:00).
    /// </summary>
    public bool IsLate { get; set; }

    /// <summary>
    /// Hours worked beyond the standard shift (e.g. 8h). 0 if none.
    /// </summary>
    public decimal OvertimeHours { get; set; }
}
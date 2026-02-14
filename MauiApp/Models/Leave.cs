// Path: MauiApp/Models/Leave.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HrmApp.Models;

public enum LeaveType
{
    Annual,      // Yıllık İzin
    Sick,        // Hastalık İzni
    Maternity,   // Doğum İzni
    Unpaid,      // Ücretsiz İzin
    Other        // Diğer
}

public enum LeaveStatus
{
    Pending,     // Beklemede
    Approved,    // Onaylandı
    Rejected     // Reddedildi
}

public class Leave
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int EmployeeId { get; set; }

    [ForeignKey(nameof(EmployeeId))]
    public Employee Employee { get; set; } = null!;

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public LeaveType Type { get; set; } = LeaveType.Annual;

    public LeaveStatus Status { get; set; } = LeaveStatus.Pending;

    /// <summary>
    /// Calculated total business days of the leave.
    /// </summary>
    [NotMapped]
    public int TotalDays => (int)(EndDate.Date - StartDate.Date).TotalDays + 1;
}
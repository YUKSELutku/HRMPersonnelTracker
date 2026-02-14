// Path: MauiApp/Models/Salary.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HrmApp.Models;

/// <summary>
/// Salary definition per employee — defines gross salary, benefits, and payment terms.
/// This is the "contract" data. Payroll uses this to calculate monthly net pay.
/// </summary>
public class Salary
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int EmployeeId { get; set; }

    [ForeignKey(nameof(EmployeeId))]
    public Employee? Employee { get; set; }

    // ── Core ────────────────────────────────────────────────────

    /// <summary>Brüt aylık maaş (TL)</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal GrossSalary { get; set; }

    /// <summary>Ödeme periyodu</summary>
    public PaymentPeriod PaymentPeriod { get; set; } = PaymentPeriod.Monthly;

    // ── Yan Haklar (Benefits) ───────────────────────────────────

    /// <summary>Yemek yardımı (günlük TL — hafta sonları hariç hesaplanır)</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal MealAllowance { get; set; }

    /// <summary>Yol / ulaşım yardımı (aylık TL)</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TransportAllowance { get; set; }

    /// <summary>Özel sağlık sigortası işveren katkısı (aylık TL)</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal PrivateHealthInsurance { get; set; }

    /// <summary>Çocuk / aile yardımı (aylık TL)</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal FamilyAllowance { get; set; }

    /// <summary>Kira / konut yardımı (aylık TL)</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal HousingAllowance { get; set; }

    /// <summary>Eğitim yardımı (aylık TL)</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal EducationAllowance { get; set; }

    // ── Prim & Bonus ────────────────────────────────────────────

    /// <summary>Sabit aylık prim (TL) — performans primi vb.</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal MonthlyBonus { get; set; }

    // ── Meta ─────────────────────────────────────────────────────

    /// <summary>Bu maaş tanımının yürürlük tarihi</summary>
    public DateTime EffectiveDate { get; set; } = DateTime.Now;

    /// <summary>Aktif / geçersiz</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>Notlar</summary>
    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ── Calculated helpers ───────────────────────────────────────

    [NotMapped]
    public decimal TotalAllowances =>
        MealAllowance + TransportAllowance + PrivateHealthInsurance +
        FamilyAllowance + HousingAllowance + EducationAllowance + MonthlyBonus;
}

public enum PaymentPeriod
{
    Monthly,     // Aylık
    BiWeekly,    // 15 günlük
    Weekly       // Haftalık
}
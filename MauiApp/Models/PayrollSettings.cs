// Path: MauiApp/Models/PayrollSettings.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace HrmApp.Models;

/// <summary>
/// Configurable payroll rates and tax brackets.
/// Stored as a single row in the database. When regulations change,
/// users update rates from the Settings page instead of recompiling.
/// </summary>
public class PayrollSettings
{
    [Key]
    public int Id { get; set; }

    /// <summary>Label for this configuration, e.g. "2026 Yılı Parametreleri"</summary>
    [MaxLength(200)]
    public string Label { get; set; } = "Varsayılan";

    // ══════════════════════════════════════════════════════════════
    //  İŞÇİ KESİNTİLERİ (Worker Deductions)
    // ══════════════════════════════════════════════════════════════

    /// <summary>SGK İşçi Payı oranı (varsayılan: 0.14 = %14)</summary>
    [Column(TypeName = "decimal(8,5)")]
    public decimal SgkWorkerRate { get; set; } = 0.14m;

    /// <summary>İşsizlik Sigortası İşçi oranı (varsayılan: 0.01 = %1)</summary>
    [Column(TypeName = "decimal(8,5)")]
    public decimal UnemploymentWorkerRate { get; set; } = 0.01m;

    /// <summary>Damga Vergisi oranı (varsayılan: 0.00759 = %0.759)</summary>
    [Column(TypeName = "decimal(8,5)")]
    public decimal StampTaxRate { get; set; } = 0.00759m;

    // ══════════════════════════════════════════════════════════════
    //  İŞVEREN PAYLARİ (Employer Contributions)
    // ══════════════════════════════════════════════════════════════

    /// <summary>SGK İşveren Payı oranı (varsayılan: 0.2175 = %21.75)</summary>
    [Column(TypeName = "decimal(8,5)")]
    public decimal SgkEmployerRate { get; set; } = 0.2175m;

    /// <summary>İşsizlik Sigortası İşveren oranı (varsayılan: 0.02 = %2)</summary>
    [Column(TypeName = "decimal(8,5)")]
    public decimal UnemploymentEmployerRate { get; set; } = 0.02m;

    // ══════════════════════════════════════════════════════════════
    //  GELİR VERGİSİ DİLİMLERİ (Income Tax Brackets)
    // ══════════════════════════════════════════════════════════════

    /// <summary>
    /// JSON-serialized tax brackets: [{"threshold":110000,"rate":0.15}, ...]
    /// Last bracket should have threshold = 999999999 (effectively unlimited).
    /// </summary>
    [Column(TypeName = "TEXT")]
    public string TaxBracketsJson { get; set; } = DefaultTaxBracketsJson;

    // ══════════════════════════════════════════════════════════════
    //  SGK TAVAN / TABAN
    // ══════════════════════════════════════════════════════════════

    /// <summary>SGK Prim Tavanı — aylık üst sınır (0 = sınır yok)</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal SgkCeiling { get; set; } = 0m;

    /// <summary>Asgari Ücret — SGK prim tabanı ve AGİ referansı</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal MinimumWage { get; set; } = 28_075m;

    // ── Meta ─────────────────────────────────────────────────────

    public bool IsActive { get; set; } = true;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ══════════════════════════════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════════════════════════════

    private static readonly JsonSerializerOptions _jsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    /// <summary>Parse tax brackets from JSON.</summary>
    [NotMapped]
    public List<TaxBracket> TaxBrackets
    {
        get
        {
            try
            {
                return JsonSerializer.Deserialize<List<TaxBracket>>(TaxBracketsJson, _jsonOpts) ?? DefaultTaxBrackets();
            }
            catch
            {
                return DefaultTaxBrackets();
            }
        }
        set => TaxBracketsJson = JsonSerializer.Serialize(value, _jsonOpts);
    }

    public static List<TaxBracket> DefaultTaxBrackets() =>
    [
        new(190_000m,     0.15m),
        new(400_000m,     0.20m),
        new(1_500_000m,     0.27m),
        new(5_300_000m,   0.35m),
        new(999_999_999m, 0.40m),
    ];

    public static string DefaultTaxBracketsJson =>
        JsonSerializer.Serialize(DefaultTaxBrackets(), new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
}

/// <summary>Single income tax bracket.</summary>
public record TaxBracket(decimal Threshold, decimal Rate);
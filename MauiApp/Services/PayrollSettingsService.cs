// Path: MauiApp/Services/PayrollSettingsService.cs
using Microsoft.EntityFrameworkCore;
using HrmApp.Data;
using HrmApp.Models;

namespace HrmApp.Services;

/// <summary>
/// Manages configurable payroll rates stored in the database.
/// Always returns the single active settings row.
/// If no settings exist, creates default 2026 Turkish rates.
/// </summary>
public class PayrollSettingsService(HrmDbContext db)
{
    /// <summary>Get the current active settings (creates default if none exist).</summary>
    public async Task<PayrollSettings> GetActiveAsync()
    {
        var settings = await db.PayrollSettings
            .Where(s => s.IsActive)
            .OrderByDescending(s => s.UpdatedAt)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (settings is not null) return settings;

        // Create default settings
        settings = new PayrollSettings();
        db.PayrollSettings.Add(settings);
        await db.SaveChangesAsync();
        return settings;
    }

    /// <summary>Update settings. Deactivates old, creates new record for audit trail.</summary>
    public async Task<PayrollSettings> UpdateAsync(PayrollSettings updated)
    {
        // Deactivate all existing
        var existing = await db.PayrollSettings
            .Where(s => s.IsActive)
            .ToListAsync();
        foreach (var old in existing)
            old.IsActive = false;

        // Create new active record
        var settings = new PayrollSettings
        {
            Label = updated.Label,
            SgkWorkerRate = updated.SgkWorkerRate,
            UnemploymentWorkerRate = updated.UnemploymentWorkerRate,
            StampTaxRate = updated.StampTaxRate,
            SgkEmployerRate = updated.SgkEmployerRate,
            UnemploymentEmployerRate = updated.UnemploymentEmployerRate,
            TaxBracketsJson = updated.TaxBracketsJson,
            SgkCeiling = updated.SgkCeiling,
            MinimumWage = updated.MinimumWage,
            IsActive = true,
            UpdatedAt = DateTime.UtcNow
        };

        db.PayrollSettings.Add(settings);
        await db.SaveChangesAsync();

        return settings;
    }

    /// <summary>Reset to default Turkish 2026 rates.</summary>
    public async Task<PayrollSettings> ResetToDefaultAsync()
    {
        var defaults = new PayrollSettings { Label = "2026 Varsayılan" };
        return await UpdateAsync(defaults);
    }

    /// <summary>Get settings history (for audit).</summary>
    public async Task<List<PayrollSettings>> GetHistoryAsync() =>
        await db.PayrollSettings
            .OrderByDescending(s => s.UpdatedAt)
            .Take(20)
            .AsNoTracking()
            .ToListAsync();
}
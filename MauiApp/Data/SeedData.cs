// Path: MauiApp/Data/SeedData.cs
using Microsoft.EntityFrameworkCore;
using HrmApp.Models;

namespace HrmApp.Data;

public static class SeedData
{
    public static async Task InitializeAsync(HrmDbContext db)
    {
        // Ensure database and tables exist
        await db.Database.EnsureCreatedAsync();

        // ── Add new columns if upgrading existing DB ──────────
        await AddColumnIfMissing(db, "Payrolls", "OvertimePay", "REAL NOT NULL DEFAULT 0");
        await AddColumnIfMissing(db, "Payrolls", "OvertimeHours", "REAL NOT NULL DEFAULT 0");
        await AddColumnIfMissing(db, "Payrolls", "MealWorkDays", "INTEGER NOT NULL DEFAULT 0");

        // Only seed if empty
        if (db.Employees.Any()) return;

        var employees = new List<Employee>
        {
            new()
            {
                FullName = "Ahmet Yılmaz",
                TC_No = "12345678901",
                BirthDate = new DateTime(1990, 3, 15),
                Phone = "+90 532 111 2233",
                Email = "ahmet.yilmaz@company.com",
                Department = "Yazılım",
                Title = "Kıdemli Geliştirici",
                HireDate = new DateTime(2020, 1, 10),
                ActiveStatus = true
            },
            new()
            {
                FullName = "Elif Demir",
                TC_No = "98765432109",
                BirthDate = new DateTime(1988, 7, 22),
                Phone = "+90 533 444 5566",
                Email = "elif.demir@company.com",
                Department = "İnsan Kaynakları",
                Title = "İK Müdürü",
                HireDate = new DateTime(2018, 6, 1),
                ActiveStatus = true
            },
            new()
            {
                FullName = "Mehmet Kaya",
                TC_No = "11223344556",
                BirthDate = new DateTime(1995, 11, 8),
                Phone = "+90 535 777 8899",
                Email = "mehmet.kaya@company.com",
                Department = "Muhasebe",
                Title = "Muhasebe Uzmanı",
                HireDate = new DateTime(2022, 3, 15),
                ActiveStatus = true
            }
        };

        db.Employees.AddRange(employees);
        await db.SaveChangesAsync();

        // Seed salary definitions — MealAllowance is DAILY (günlük)
        var salaryData = new[]
        {
            (Idx: 0, Gross: 55000m,  Meal: 100m, Transport: 1500m, Health: 1000m, Bonus: 3000m),
            (Idx: 1, Gross: 65000m,  Meal: 120m, Transport: 1500m, Health: 1500m, Bonus: 5000m),
            (Idx: 2, Gross: 40000m,  Meal: 80m,  Transport: 1000m, Health: 800m,  Bonus: 2000m),
        };

        foreach (var s in salaryData)
        {
            db.Salaries.Add(new Salary
            {
                EmployeeId = employees[s.Idx].Id,
                GrossSalary = s.Gross,
                PaymentPeriod = PaymentPeriod.Monthly,
                MealAllowance = s.Meal,
                TransportAllowance = s.Transport,
                PrivateHealthInsurance = s.Health,
                MonthlyBonus = s.Bonus,
                EffectiveDate = employees[s.Idx].HireDate,
                IsActive = true
            });
        }
        await db.SaveChangesAsync();

        // Seed default payroll settings
        db.PayrollSettings.Add(new PayrollSettings
        {
            Label = "2026 Yılı Parametreleri",
            IsActive = true
        });
        await db.SaveChangesAsync();

        // Seed attendance records for today
        var today = DateOnly.FromDateTime(DateTime.Today);
        foreach (var emp in employees)
        {
            db.Attendances.Add(new Attendance
            {
                EmployeeId = emp.Id,
                Date = today,
                CheckInTime = new TimeOnly(9, 0),
                IsLate = false
            });
        }

        await db.SaveChangesAsync();
    }

    /// <summary>
    /// SQLite: adds a column to an existing table if it doesn't exist yet.
    /// Safe to call multiple times.
    /// </summary>
    private static async Task AddColumnIfMissing(HrmDbContext db, string table, string column, string colDef)
    {
        try
        {
            var conn = db.Database.GetDbConnection();
            await conn.OpenAsync();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = $"SELECT COUNT(*) FROM pragma_table_info('{table}') WHERE name='{column}'";
            var exists = Convert.ToInt64(await cmd.ExecuteScalarAsync()) > 0;
            if (!exists)
            {
                using var alter = conn.CreateCommand();
                alter.CommandText = $"ALTER TABLE {table} ADD COLUMN {column} {colDef}";
                await alter.ExecuteNonQueryAsync();
                System.Diagnostics.Debug.WriteLine($"[DB] Added column {table}.{column}");
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[DB] Column check failed for {table}.{column}: {ex.Message}");
        }
    }
}
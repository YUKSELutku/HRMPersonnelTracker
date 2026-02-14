// Path: MauiApp/Data/HrmDbContext.cs
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using HrmApp.Models;

namespace HrmApp.Data;

public class HrmDbContext : DbContext
{
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<Leave> Leaves => Set<Leave>();
    public DbSet<Payroll> Payrolls => Set<Payroll>();
    public DbSet<Salary> Salaries => Set<Salary>();
    public DbSet<PayrollSettings> PayrollSettings => Set<PayrollSettings>();

    private readonly string _dbPath;

    public HrmDbContext()
    {
        // Store the DB next to the app binary for true offline/portable usage
        var appData = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "HrmTracker");
        Directory.CreateDirectory(appData);
        _dbPath = Path.Combine(appData, "hrm.db");
    }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
    {
        options.UseSqlite($"Data Source={_dbPath}");

#if DEBUG
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
#endif
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ── Employee ──────────────────────────────────────────────
        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasIndex(e => e.TC_No).IsUnique();
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.Department);

            // Value converter: List<string> ↔ JSON TEXT column in SQLite
            var archivePathsConverter = new ValueConverter<List<string>, string>(
                v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                v => JsonSerializer.Deserialize<List<string>>(v, JsonSerializerOptions.Default) ?? new()
            );
            entity.Property(e => e.ArchivePaths)
                  .HasConversion(archivePathsConverter)
                  .HasColumnType("TEXT");
        });

        // ── Attendance ────────────────────────────────────────────
        modelBuilder.Entity<Attendance>(entity =>
        {
            // One record per employee per day
            entity.HasIndex(a => new { a.EmployeeId, a.Date }).IsUnique();

            entity.HasOne(a => a.Employee)
                  .WithMany(e => e.Attendances)
                  .HasForeignKey(a => a.EmployeeId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Leave ─────────────────────────────────────────────────
        modelBuilder.Entity<Leave>(entity =>
        {
            entity.HasOne(l => l.Employee)
                  .WithMany(e => e.Leaves)
                  .HasForeignKey(l => l.EmployeeId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(l => l.Type)
                  .HasConversion<string>();

            entity.Property(l => l.Status)
                  .HasConversion<string>();
        });

        // ── Payroll ───────────────────────────────────────────────
        modelBuilder.Entity<Payroll>(entity =>
        {
            entity.HasIndex(p => new { p.EmployeeId, p.Period }).IsUnique();

            entity.HasOne(p => p.Employee)
                  .WithMany(e => e.Payrolls)
                  .HasForeignKey(p => p.EmployeeId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Salary ──────────────────────────────────────────────
        modelBuilder.Entity<Salary>(entity =>
        {
            entity.HasIndex(s => new { s.EmployeeId, s.IsActive });

            entity.HasOne(s => s.Employee)
                  .WithMany(e => e.Salaries)
                  .HasForeignKey(s => s.EmployeeId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(s => s.PaymentPeriod)
                  .HasConversion<string>();
        });

        // ── PayrollSettings ─────────────────────────────────────
        modelBuilder.Entity<PayrollSettings>(entity =>
        {
            entity.HasIndex(ps => ps.IsActive);
        });
    }
}
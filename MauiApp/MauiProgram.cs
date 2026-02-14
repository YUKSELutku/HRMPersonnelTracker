// Path: MauiApp/MauiProgram.cs
using Microsoft.Extensions.Logging;
using HrmApp.Data;
using HrmApp.Services;

namespace HrmApp;

public static class MauiProgram
{
    public static Microsoft.Maui.Hosting.MauiApp CreateMauiApp()
    {
        var builder = Microsoft.Maui.Hosting.MauiApp.CreateBuilder();

        builder
            .UseMauiApp<App>();

        // ── Register Services ────────────────────────────────────
        builder.Services.AddSingleton<HrmDbContext>();
        builder.Services.AddSingleton<LanguageService>();

        builder.Services.AddTransient<EmployeeService>();
        builder.Services.AddTransient<AttendanceService>();
        builder.Services.AddTransient<SalaryService>();
        builder.Services.AddTransient<PayrollSettingsService>();
        builder.Services.AddTransient<PayrollService>();
        builder.Services.AddTransient<LeaveService>();
        builder.Services.AddSingleton<FileUploadService>();
        builder.Services.AddTransient<PdfExportService>();
        builder.Services.AddTransient<ExcelExportService>();
        builder.Services.AddTransient<BridgeRouter>();

        builder.Services.AddTransient<MainPage>();

#if DEBUG
        builder.Logging.SetMinimumLevel(Microsoft.Extensions.Logging.LogLevel.Debug);
#endif

        // QuestPDF community license
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

        var app = builder.Build();

        // Initialize database
        Task.Run(async () =>
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<HrmDbContext>();
            await SeedData.InitializeAsync(db);
        }).Wait();

        return app;
    }
}
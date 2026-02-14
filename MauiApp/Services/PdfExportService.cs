// Path: MauiApp/Services/PdfExportService.cs
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using HrmApp.Models;

// Disambiguate: MAUI also defines Colors via global usings
using Colors = QuestPDF.Helpers.Colors;

namespace HrmApp.Services;

/// <summary>
/// Generates localized PDF reports using QuestPDF.
/// </summary>
public class PdfExportService(LanguageService lang)
{
    // ══════════════════════════════════════════════════════════════
    //  ALL EMPLOYEES — monthly attendance
    // ══════════════════════════════════════════════════════════════

    public byte[] GenerateAttendanceReport(
        string languageCode,
        string period,
        List<Attendance> records)
    {
        string T(string key) => lang.T(languageCode, key);
        string TF(string key, params object[] args) => lang.TF(languageCode, key, args);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(9));

                page.Header().Column(col =>
                {
                    col.Item().Text(T("pdf_attendance_title"))
                        .FontSize(16).Bold().FontColor(Colors.Blue.Darken2);
                    col.Item().Text(TF("pdf_attendance_subtitle", period))
                        .FontSize(11).FontColor(Colors.Grey.Darken1);
                    col.Item().Text(TF("pdf_generated_at", DateTime.Now.ToString("dd.MM.yyyy HH:mm")))
                        .FontSize(8).FontColor(Colors.Grey.Medium);
                    col.Item().PaddingVertical(5).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                });

                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        cols.RelativeColumn(3);
                        cols.RelativeColumn(2);
                        cols.RelativeColumn(1.5f);
                        cols.RelativeColumn(1);
                        cols.RelativeColumn(1);
                        cols.RelativeColumn(0.8f);
                        cols.RelativeColumn(1);
                    });

                    table.Header(header =>
                    {
                        var hs = TextStyle.Default.Bold().FontSize(9);
                        foreach (var key in new[] { "col_employee_name", "col_department", "col_date",
                            "col_checkin", "col_checkout", "col_is_late", "col_overtime" })
                            header.Cell().Background(Colors.Blue.Lighten4).Padding(4).Text(T(key)).Style(hs);
                    });

                    foreach (var record in records)
                    {
                        var bg = record.IsLate ? Colors.Red.Lighten5 : Colors.White;
                        table.Cell().Background(bg).Padding(3).Text(record.Employee?.FullName ?? "-");
                        table.Cell().Background(bg).Padding(3).Text(record.Employee?.Department ?? "-");
                        table.Cell().Background(bg).Padding(3).Text(record.Date.ToString("dd.MM.yyyy"));
                        table.Cell().Background(bg).Padding(3).Text(record.CheckInTime?.ToString("HH:mm") ?? "-");
                        table.Cell().Background(bg).Padding(3).Text(record.CheckOutTime?.ToString("HH:mm") ?? "-");
                        table.Cell().Background(bg).Padding(3).Text(record.IsLate ? T("yes") : T("no"));
                        table.Cell().Background(bg).Padding(3).Text(record.OvertimeHours > 0 ? record.OvertimeHours.ToString("F1") : "-");
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span(T("page_footer").Replace("{0}", "").Replace("{1}", ""));
                    text.CurrentPageNumber();
                    text.Span(" / ");
                    text.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }

    // ══════════════════════════════════════════════════════════════
    //  PER EMPLOYEE — detailed monthly attendance report
    // ══════════════════════════════════════════════════════════════

    public byte[] GenerateEmployeeAttendanceReport(
        string languageCode,
        string period,
        Employee employee,
        List<Attendance> records)
    {
        string T(string key) => lang.T(languageCode, key);
        string TF(string key, params object[] args) => lang.TF(languageCode, key, args);

        var totalDays = records.Count;
        var lateDays = records.Count(r => r.IsLate);
        var totalOvertime = records.Sum(r => r.OvertimeHours);
        var daysWithCheckout = records.Count(r => r.CheckOutTime.HasValue);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(9));

                // ── Header ──────────────────────────────────────
                page.Header().Column(col =>
                {
                    col.Item().Text(T("pdf_emp_attendance_title"))
                        .FontSize(16).Bold().FontColor(Colors.Blue.Darken2);

                    col.Item().PaddingTop(6).Row(row =>
                    {
                        row.RelativeItem().Column(left =>
                        {
                            left.Item().Text($"{T("col_employee_name")}: {employee.FullName}")
                                .FontSize(11).SemiBold();
                            left.Item().Text($"{T("col_department")}: {employee.Department ?? "-"}")
                                .FontSize(10).FontColor(Colors.Grey.Darken1);
                            if (!string.IsNullOrEmpty(employee.Title))
                                left.Item().Text($"{T("col_title")}: {employee.Title}")
                                    .FontSize(10).FontColor(Colors.Grey.Darken1);
                        });
                        row.RelativeItem().AlignRight().Column(right =>
                        {
                            right.Item().Text(TF("pdf_attendance_subtitle", period))
                                .FontSize(11).FontColor(Colors.Grey.Darken1);
                            right.Item().Text(TF("pdf_generated_at", DateTime.Now.ToString("dd.MM.yyyy HH:mm")))
                                .FontSize(8).FontColor(Colors.Grey.Medium);
                        });
                    });

                    col.Item().PaddingVertical(5).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                    // ── Summary boxes ────────────────────────────
                    col.Item().PaddingBottom(8).Row(row =>
                    {
                        void Box(QuestPDF.Infrastructure.IContainer c, string label, string value)
                        {
                            c.Border(1).BorderColor(Colors.Grey.Lighten2)
                             .Background(Colors.Grey.Lighten4).Padding(8).Column(inner =>
                             {
                                 inner.Item().Text(label).FontSize(8).FontColor(Colors.Grey.Darken1);
                                 inner.Item().Text(value).FontSize(14).Bold();
                             });
                        }

                        row.RelativeItem().Element(c => Box(c, T("summary_work_days"), totalDays.ToString()));
                        row.ConstantItem(8);
                        row.RelativeItem().Element(c => Box(c, T("summary_late_arrivals"), lateDays.ToString()));
                        row.ConstantItem(8);
                        row.RelativeItem().Element(c => Box(c, T("summary_total_overtime"), $"{totalOvertime:F1} {T("hours_abbr")}"));
                        row.ConstantItem(8);
                        row.RelativeItem().Element(c => Box(c, T("summary_checkout_count"), daysWithCheckout.ToString()));
                    });
                });

                // ── Day-by-day table ────────────────────────────
                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        cols.ConstantColumn(28);
                        cols.RelativeColumn(1.5f);
                        cols.RelativeColumn(1.2f);
                        cols.RelativeColumn(1);
                        cols.RelativeColumn(1);
                        cols.RelativeColumn(1);
                        cols.RelativeColumn(0.8f);
                        cols.RelativeColumn(1);
                    });

                    table.Header(header =>
                    {
                        var hs = TextStyle.Default.Bold().FontSize(9);
                        header.Cell().Background(Colors.Blue.Lighten4).Padding(4).Text("#").Style(hs);
                        foreach (var key in new[] { "col_date", "col_day_name", "col_checkin",
                            "col_checkout", "col_worked_hours", "col_is_late", "col_overtime" })
                            header.Cell().Background(Colors.Blue.Lighten4).Padding(4).Text(T(key)).Style(hs);
                    });

                    var dayNames = languageCode == "tr"
                        ? new[] { "Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt" }
                        : new[] { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" };

                    int rowNum = 0;
                    foreach (var rec in records)
                    {
                        rowNum++;
                        var bg = rec.IsLate
                            ? Colors.Red.Lighten5
                            : (rowNum % 2 == 0 ? Colors.Grey.Lighten5 : Colors.White);

                        var workedStr = "-";
                        if (rec.CheckInTime.HasValue && rec.CheckOutTime.HasValue)
                        {
                            var worked = rec.CheckOutTime.Value.ToTimeSpan() - rec.CheckInTime.Value.ToTimeSpan();
                            workedStr = $"{(int)worked.TotalHours}:{worked.Minutes:D2}";
                        }

                        var dow = rec.Date.ToDateTime(TimeOnly.MinValue).DayOfWeek;

                        table.Cell().Background(bg).Padding(3).Text(rowNum.ToString());
                        table.Cell().Background(bg).Padding(3).Text(rec.Date.ToString("dd.MM.yyyy"));
                        table.Cell().Background(bg).Padding(3).Text(dayNames[(int)dow]);
                        table.Cell().Background(bg).Padding(3).Text(rec.CheckInTime?.ToString("HH:mm") ?? "-");
                        table.Cell().Background(bg).Padding(3).Text(rec.CheckOutTime?.ToString("HH:mm") ?? "-");
                        table.Cell().Background(bg).Padding(3).Text(workedStr);
                        table.Cell().Background(bg).Padding(3).Text(rec.IsLate ? T("yes") : T("no"))
                            .FontColor(rec.IsLate ? Colors.Red.Darken1 : Colors.Black);
                        table.Cell().Background(bg).Padding(3).Text(rec.OvertimeHours > 0 ? rec.OvertimeHours.ToString("F1") : "-");
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span(T("page_footer").Replace("{0}", "").Replace("{1}", ""));
                    text.CurrentPageNumber();
                    text.Span(" / ");
                    text.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }

    // ══════════════════════════════════════════════════════════════
    //  PAYROLL REPORT
    // ══════════════════════════════════════════════════════════════

    public byte[] GeneratePayrollReport(
        string languageCode,
        string period,
        List<Payroll> payrolls)
    {
        string T(string key) => lang.T(languageCode, key);
        string TF(string key, params object[] args) => lang.TF(languageCode, key, args);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(9));

                page.Header().Column(col =>
                {
                    col.Item().Text(T("payroll_report_title"))
                        .FontSize(16).Bold().FontColor(Colors.Green.Darken2);
                    col.Item().Text(TF("pdf_attendance_subtitle", period))
                        .FontSize(11).FontColor(Colors.Grey.Darken1);
                    col.Item().PaddingVertical(5).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                });

                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        cols.RelativeColumn(3);
                        cols.RelativeColumn(2);
                        cols.RelativeColumn(1.5f);
                        cols.RelativeColumn(1.5f);
                        cols.RelativeColumn(1.5f);
                        cols.RelativeColumn(1.5f);
                    });

                    table.Header(header =>
                    {
                        var hs = TextStyle.Default.Bold().FontSize(9);
                        foreach (var key in new[] { "col_employee_name", "col_department",
                            "col_base_salary", "col_allowances", "col_deductions", "col_final_salary" })
                            header.Cell().Background(Colors.Green.Lighten4).Padding(4).Text(T(key)).Style(hs);
                    });

                    foreach (var p in payrolls)
                    {
                        table.Cell().Padding(3).Text(p.Employee?.FullName ?? "-");
                        table.Cell().Padding(3).Text(p.Employee?.Department ?? "-");
                        table.Cell().Padding(3).Text($"₺{p.BaseSalary:N2}");
                        table.Cell().Padding(3).Text($"₺{p.Allowances:N2}");
                        table.Cell().Padding(3).Text($"₺{p.Deductions:N2}");
                        table.Cell().Padding(3).Text($"₺{p.FinalSalary:N2}").Bold();
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.CurrentPageNumber();
                    text.Span(" / ");
                    text.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }
}
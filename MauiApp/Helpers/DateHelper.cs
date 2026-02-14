// Path: MauiApp/Helpers/DateHelper.cs
namespace HrmApp.Helpers;

/// <summary>
/// Date-related utility methods for Turkish business logic.
/// </summary>
public static class DateHelper
{
    /// <summary>
    /// Turkish national holidays (fixed dates — variable dates like Ramadan
    /// would need a separate calendar library in production).
    /// </summary>
    private static readonly HashSet<(int Month, int Day)> FixedHolidays =
    [
        (1, 1),   // Yılbaşı
        (4, 23),  // Ulusal Egemenlik ve Çocuk Bayramı
        (5, 1),   // Emek ve Dayanışma Günü
        (5, 19),  // Atatürk'ü Anma, Gençlik ve Spor Bayramı
        (7, 15),  // Demokrasi ve Millî Birlik Günü
        (8, 30),  // Zafer Bayramı
        (10, 29), // Cumhuriyet Bayramı
    ];

    /// <summary>
    /// Calculate business days between two dates (excluding weekends and TR holidays).
    /// </summary>
    public static int GetBusinessDays(DateTime start, DateTime end)
    {
        if (end < start) return 0;

        int count = 0;
        for (var date = start.Date; date <= end.Date; date = date.AddDays(1))
        {
            if (IsBusinessDay(date))
                count++;
        }
        return count;
    }

    /// <summary>
    /// Check if a date is a Turkish business day.
    /// </summary>
    public static bool IsBusinessDay(DateTime date) =>
        date.DayOfWeek != DayOfWeek.Saturday &&
        date.DayOfWeek != DayOfWeek.Sunday &&
        !IsNationalHoliday(date);

    /// <summary>
    /// Check if a date is a Turkish national holiday (fixed dates only).
    /// </summary>
    public static bool IsNationalHoliday(DateTime date) =>
        FixedHolidays.Contains((date.Month, date.Day));

    /// <summary>
    /// Get the number of working days in a given month.
    /// </summary>
    public static int GetWorkingDaysInMonth(int year, int month)
    {
        var start = new DateTime(year, month, 1);
        var end = start.AddMonths(1).AddDays(-1);
        return GetBusinessDays(start, end);
    }

    /// <summary>
    /// Parse a period string "YYYY-MM" to year and month.
    /// </summary>
    public static (int Year, int Month) ParsePeriod(string period)
    {
        var parts = period.Split('-');
        return (int.Parse(parts[0]), int.Parse(parts[1]));
    }

    /// <summary>
    /// Get the start and end dates of a month from a "YYYY-MM" period string.
    /// </summary>
    public static (DateOnly Start, DateOnly End) GetMonthRange(string period)
    {
        var (year, month) = ParsePeriod(period);
        var start = new DateOnly(year, month, 1);
        var end = start.AddMonths(1).AddDays(-1);
        return (start, end);
    }
}

/// <summary>
/// Currency formatting helpers.
/// </summary>
public static class CurrencyHelper
{
    /// <summary>
    /// Format a decimal as Turkish Lira.
    /// </summary>
    public static string FormatTRY(decimal amount) =>
        amount.ToString("C2", new System.Globalization.CultureInfo("tr-TR"));

    /// <summary>
    /// Format a decimal as generic currency based on language.
    /// </summary>
    public static string Format(decimal amount, string lang) =>
        lang == "tr"
            ? FormatTRY(amount)
            : amount.ToString("C2", new System.Globalization.CultureInfo("en-US"));
}
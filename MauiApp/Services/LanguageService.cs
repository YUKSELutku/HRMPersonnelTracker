// Path: MauiApp/Services/LanguageService.cs
using System.Reflection;
using System.Text.Json;

namespace HrmApp.Services;

/// <summary>
/// Lightweight backend i18n service.
/// Loads en.json / tr.json from embedded resources and provides
/// string lookups that the PDF and Excel exporters consume.
/// 
/// Thread-safe: translations are loaded once into a frozen dictionary.
/// </summary>
public sealed class LanguageService
{
    private static readonly Dictionary<string, Dictionary<string, string>> _translations = new();
    private static readonly object _lock = new();
    private static bool _initialized;

    private const string DefaultLang = "en";
    private static readonly string[] SupportedLanguages = ["en", "tr"];

    public LanguageService()
    {
        EnsureLoaded();
    }

    /// <summary>
    /// Get a translated string for the given key in the specified language.
    /// Falls back to English, then to the raw key if nothing is found.
    /// </summary>
    public string T(string lang, string key)
    {
        lang = NormalizeLang(lang);

        if (_translations.TryGetValue(lang, out var dict) && dict.TryGetValue(key, out var val))
            return val;

        // Fallback to English
        if (lang != DefaultLang &&
            _translations.TryGetValue(DefaultLang, out var enDict) &&
            enDict.TryGetValue(key, out var enVal))
            return enVal;

        return key; // Last resort: return the key itself
    }

    /// <summary>
    /// Get a translated string with string.Format placeholders.
    /// Usage: TF("tr", "pdf_attendance_subtitle", "2026-02")
    /// </summary>
    public string TF(string lang, string key, params object[] args)
    {
        var template = T(lang, key);
        try { return string.Format(template, args); }
        catch { return template; }
    }

    /// <summary>
    /// Get all translations for a given language (useful for bulk operations).
    /// </summary>
    public IReadOnlyDictionary<string, string> GetAll(string lang)
    {
        lang = NormalizeLang(lang);
        return _translations.TryGetValue(lang, out var dict)
            ? dict
            : _translations[DefaultLang];
    }

    // ── Private helpers ──────────────────────────────────────────

    private static string NormalizeLang(string lang) =>
        SupportedLanguages.Contains(lang?.ToLowerInvariant() ?? "")
            ? lang!.ToLowerInvariant()
            : DefaultLang;

    private static void EnsureLoaded()
    {
        if (_initialized) return;
        lock (_lock)
        {
            if (_initialized) return;

            var assembly = Assembly.GetExecutingAssembly();

            foreach (var lang in SupportedLanguages)
            {
                var resourceName = $"HrmApp.Resources.Languages.{lang}.json";
                using var stream = assembly.GetManifestResourceStream(resourceName);

                if (stream is null)
                {
                    // Fallback: try loading from file system (dev mode)
                    var filePath = Path.Combine(
                        AppContext.BaseDirectory, "Resources", "Languages", $"{lang}.json");

                    if (File.Exists(filePath))
                    {
                        var json = File.ReadAllText(filePath);
                        _translations[lang] = JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? [];
                    }
                    else
                    {
                        _translations[lang] = [];
                    }
                    continue;
                }

                using var reader = new StreamReader(stream);
                var content = reader.ReadToEnd();
                _translations[lang] = JsonSerializer.Deserialize<Dictionary<string, string>>(content) ?? [];
            }

            _initialized = true;
        }
    }
}
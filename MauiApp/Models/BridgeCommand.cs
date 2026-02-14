// Path: MauiApp/Models/BridgeCommand.cs
using System.Text.Json;
using System.Text.Json.Serialization;

namespace HrmApp.Models;

/// <summary>
/// JSON envelope sent from Next.js → MAUI via WebView2 postMessage.
/// 
/// Example payload from JS:
/// {
///   "id": "a1b2c3",
///   "command": "getEmployees",
///   "lang": "tr",
///   "payload": { "activeOnly": true }
/// }
/// </summary>
public class BridgeCommand
{
    /// <summary>
    /// Unique correlation ID so the frontend can match responses to requests.
    /// </summary>
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// The command name that BridgeRouter will dispatch on.
    /// </summary>
    [JsonPropertyName("command")]
    public string Command { get; set; } = string.Empty;

    /// <summary>
    /// Current UI language code: "en" or "tr".
    /// Passed to services that generate localized content (PDFs, Excel).
    /// </summary>
    [JsonPropertyName("lang")]
    public string Lang { get; set; } = "en";

    /// <summary>
    /// Arbitrary JSON payload specific to each command.
    /// </summary>
    [JsonPropertyName("payload")]
    public JsonElement? Payload { get; set; }
}

/// <summary>
/// Envelope sent back from C# → Next.js.
/// </summary>
public class BridgeResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("data")]
    public object? Data { get; set; }

    [JsonPropertyName("error")]
    public string? Error { get; set; }

    public static BridgeResponse Ok(string id, object? data = null) =>
        new() { Id = id, Success = true, Data = data };

    public static BridgeResponse Fail(string id, string error) =>
        new() { Id = id, Success = false, Error = error };
}
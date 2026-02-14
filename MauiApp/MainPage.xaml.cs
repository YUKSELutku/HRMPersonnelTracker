// Path: MauiApp/MainPage.xaml.cs
using System.Text.Json;
using HrmApp.Models;
using HrmApp.Services;
using Microsoft.Maui.Platform;

#if WINDOWS
using Microsoft.UI.Xaml.Controls;
using Microsoft.Web.WebView2.Core;
#endif

namespace HrmApp;

public partial class MainPage : ContentPage
{
    private readonly BridgeRouter _bridge;

    public MainPage(BridgeRouter bridge)
    {
        InitializeComponent();
        _bridge = bridge;

#if WINDOWS
        HrmWebView.HandlerChanged += OnHandlerChanged;
#endif
    }

#if WINDOWS
    private async void OnHandlerChanged(object? sender, EventArgs e)
    {
        if (HrmWebView.Handler?.PlatformView is not WebView2 webView2) return;

        await webView2.EnsureCoreWebView2Async();

        // ── SSL bypass ──────────────────────────────────────────
        webView2.CoreWebView2.ServerCertificateErrorDetected += (s, args) =>
        {
            args.Action = CoreWebView2ServerCertificateErrorAction.AlwaysAllow;
        };

        // ── C# mesaj alıcısı ───────────────────────────────────
        webView2.CoreWebView2.WebMessageReceived += async (sender2, args) =>
        {
            // TryGetWebMessageAsString — JS'ten gelen raw string'i al
            // WebMessageAsJson çift escape yapar, bu yüzden string olarak alıyoruz
            string? json = null;
            try { json = args.TryGetWebMessageAsString(); } catch { }
            json ??= args.WebMessageAsJson;

            // Eğer hâlâ JSON string ise (tırnak ile sarılı), iç string'i çıkar
            if (json.StartsWith('"') && json.EndsWith('"'))
            {
                try { json = JsonSerializer.Deserialize<string>(json); }
                catch { }
            }

            System.Diagnostics.Debug.WriteLine($"[Bridge] Received: {json?[..Math.Min(json.Length, 200)]}");

            BridgeCommand? cmd = null;
            BridgeResponse response;

            try
            {
                cmd = JsonSerializer.Deserialize<BridgeCommand>(json!, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                response = cmd is not null
                    ? await _bridge.HandleCommandAsync(cmd)
                    : BridgeResponse.Fail("unknown", "Failed to parse command");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[Bridge] Error: {ex.Message}");
                response = BridgeResponse.Fail(cmd?.Id ?? "unknown", ex.Message);
            }

            var responseJson = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles,
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            });

            System.Diagnostics.Debug.WriteLine($"[Bridge] Sending: {responseJson[..Math.Min(responseJson.Length, 200)]}");

            MainThread.BeginInvokeOnMainThread(() =>
            {
                try
                {
                    webView2.CoreWebView2.PostWebMessageAsString(responseJson);
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[Bridge] PostMessage error: {ex.Message}");
                }
            });
        };

        // ── Bridge JS — NAVIGASYONDAN ÖNCE ─────────────────────
        await webView2.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(@"
            window.__bridgeCallbacks = {};

            window.bridge = {
                invoke: function(command, payload, lang) {
                    return new Promise(function(resolve, reject) {
                        var id = 'cmd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                        window.__bridgeCallbacks[id] = { resolve: resolve, reject: reject };
                        
                        // Obje olarak gönder (string değil) — çift-escape sorununu önler
                        var msgObj = {
                            id: id,
                            command: command,
                            lang: lang || window.__currentLang || 'en',
                            payload: payload || {}
                        };
                        
                        window.chrome.webview.postMessage(msgObj);
                        
                        setTimeout(function() {
                            if (window.__bridgeCallbacks[id]) {
                                window.__bridgeCallbacks[id].reject(new Error('Bridge timeout'));
                                delete window.__bridgeCallbacks[id];
                            }
                        }, 30000);
                    });
                }
            };

            // C#'tan gelen yanıtları dinle
            window.chrome.webview.addEventListener('message', function(event) {
                var response;
                try {
                    response = typeof event.data === 'string' 
                        ? JSON.parse(event.data) 
                        : event.data;
                } catch(e) {
                    console.error('[Bridge] Parse error:', e, event.data);
                    return;
                }
                
                var callback = window.__bridgeCallbacks[response.id];
                if (callback) {
                    if (response.success) {
                        callback.resolve(response.data);
                    } else {
                        callback.reject(new Error(response.error || 'Unknown error'));
                    }
                    delete window.__bridgeCallbacks[response.id];
                } else {
                    console.warn('[Bridge] No callback for:', response.id);
                }
            });

            console.log('[HRM Bridge] Ready - window.bridge =', typeof window.bridge);
        ");

        // ── Sayfa yükle ────────────────────────────────────────
        var wwwroot = Path.Combine(AppContext.BaseDirectory, "wwwroot");
        if (Directory.Exists(wwwroot))
        {
            webView2.CoreWebView2.SetVirtualHostNameToFolderMapping(
                "hrm.app", wwwroot,
                CoreWebView2HostResourceAccessKind.Allow);

            webView2.CoreWebView2.NavigationStarting += (s, navArgs) =>
            {
                if (navArgs.Uri is null) return;
                var uri = new Uri(navArgs.Uri);
                if (uri.Host != "hrm.app") return;

                var path = uri.AbsolutePath.TrimEnd('/');
                if (string.IsNullOrEmpty(path) || path == "/index.html") return;
                if (path.Contains("/_next/") || path.Contains(".")) return;

                var filePath = Path.Combine(wwwroot, path.TrimStart('/'), "index.html");
                if (!File.Exists(filePath))
                {
                    navArgs.Cancel = true;
                    webView2.CoreWebView2.Navigate("https://hrm.app/index.html");
                }
            };

            webView2.CoreWebView2.Navigate("https://hrm.app/index.html");
        }
        else
        {
            webView2.CoreWebView2.Navigate("https://localhost:3000");
        }
    }
#endif
}
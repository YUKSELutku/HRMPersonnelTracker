// Path: MauiApp/Platforms/Windows/WindowsConfig.cs
using Microsoft.UI;
using Microsoft.UI.Windowing;
using Windows.Graphics;

namespace HrmApp.Platforms.Windows;

/// <summary>
/// Windows-specific configuration for the MAUI application.
/// Called from MauiProgram if additional platform setup is needed.
/// </summary>
public static class WindowsConfig
{
    /// <summary>
    /// Configure the main window size and position on Windows.
    /// </summary>
    public static void ConfigureWindow(Microsoft.UI.Xaml.Window window)
    {
        var hwnd = WinRT.Interop.WindowNative.GetWindowHandle(window);
        var windowId = Win32Interop.GetWindowIdFromWindow(hwnd);
        var appWindow = AppWindow.GetFromWindowId(windowId);

        // Set window size
        appWindow.Resize(new SizeInt32(1400, 900));

        // Center on screen
        var displayArea = DisplayArea.GetFromWindowId(windowId, DisplayAreaFallback.Nearest);
        if (displayArea is not null)
        {
            var centerX = (displayArea.WorkArea.Width - 1400) / 2;
            var centerY = (displayArea.WorkArea.Height - 900) / 2;
            appWindow.Move(new PointInt32(centerX, centerY));
        }

        // Set title bar
        if (appWindow.Presenter is OverlappedPresenter presenter)
        {
            presenter.IsResizable = true;
            presenter.IsMaximizable = true;
        }
    }
}
// Path: MauiApp/Platforms/Windows/App.xaml.cs
using Microsoft.Maui;
using Microsoft.Maui.Hosting;

namespace HrmApp.WinUI;

public partial class App : MauiWinUIApplication
{
    public App()
    {
        this.InitializeComponent();
    }

    protected override Microsoft.Maui.Hosting.MauiApp CreateMauiApp()
        => HrmApp.MauiProgram.CreateMauiApp();
}
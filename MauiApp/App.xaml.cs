// Path: MauiApp/App.xaml.cs
namespace HrmApp;

public partial class App : Application
{
    public App(MainPage mainPage)
    {
        InitializeComponent();
    }

    protected override Window CreateWindow(IActivationState? activationState)
    {
        var mainPage = Handler?.MauiContext?.Services.GetRequiredService<MainPage>();

        return new Window(mainPage ?? new ContentPage())
        {
            Title = "HRM Personnel Tracker",
            Width = 1400,
            Height = 900,
            X = 100,
            Y = 50
        };
    }
}
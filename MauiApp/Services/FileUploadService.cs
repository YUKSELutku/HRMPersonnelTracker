// Path: MauiApp/Services/FileUploadService.cs
namespace HrmApp.Services;

/// <summary>
/// Handles file upload, storage, and retrieval for employee archives.
/// Files are stored in a local folder under the app's data directory.
/// </summary>
public class FileUploadService
{
    private readonly string _storageRoot;

    public FileUploadService()
    {
        _storageRoot = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "HrmTracker", "Uploads");
        Directory.CreateDirectory(_storageRoot);
    }

    /// <summary>
    /// Save a file from a base64-encoded string (sent from the frontend).
    /// Returns the absolute file path.
    /// </summary>
    public async Task<string> SaveFileAsync(int employeeId, string fileName, string base64Content)
    {
        var empFolder = Path.Combine(_storageRoot, employeeId.ToString());
        Directory.CreateDirectory(empFolder);

        // Sanitize filename
        var safeName = SanitizeFileName(fileName);
        var uniqueName = $"{DateTime.Now:yyyyMMdd_HHmmss}_{safeName}";
        var filePath = Path.Combine(empFolder, uniqueName);

        var bytes = Convert.FromBase64String(base64Content);
        await File.WriteAllBytesAsync(filePath, bytes);

        return filePath;
    }

    /// <summary>
    /// Get all files for an employee.
    /// </summary>
    public List<FileInfo> GetEmployeeFiles(int employeeId)
    {
        var empFolder = Path.Combine(_storageRoot, employeeId.ToString());
        if (!Directory.Exists(empFolder)) return [];

        return new DirectoryInfo(empFolder)
            .GetFiles()
            .OrderByDescending(f => f.CreationTime)
            .ToList();
    }

    /// <summary>
    /// Read a file and return as base64 for sending to the frontend.
    /// </summary>
    public async Task<string?> ReadFileAsBase64Async(string filePath)
    {
        if (!File.Exists(filePath)) return null;

        // Security: ensure the file is within our storage root
        var fullPath = Path.GetFullPath(filePath);
        if (!fullPath.StartsWith(Path.GetFullPath(_storageRoot)))
            throw new UnauthorizedAccessException("Access denied to file outside storage root.");

        var bytes = await File.ReadAllBytesAsync(fullPath);
        return Convert.ToBase64String(bytes);
    }

    /// <summary>
    /// Delete a file from the archive.
    /// </summary>
    public bool DeleteFile(string filePath)
    {
        var fullPath = Path.GetFullPath(filePath);
        if (!fullPath.StartsWith(Path.GetFullPath(_storageRoot))) return false;
        if (!File.Exists(fullPath)) return false;

        File.Delete(fullPath);
        return true;
    }

    /// <summary>
    /// Get total storage used in bytes.
    /// </summary>
    public long GetTotalStorageUsed()
    {
        if (!Directory.Exists(_storageRoot)) return 0;
        return new DirectoryInfo(_storageRoot)
            .EnumerateFiles("*", SearchOption.AllDirectories)
            .Sum(f => f.Length);
    }

    // ── Helpers ──────────────────────────────────────────────────

    private static string SanitizeFileName(string fileName)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = new string(fileName.Where(c => !invalidChars.Contains(c)).ToArray());
        return string.IsNullOrWhiteSpace(sanitized) ? "file" : sanitized;
    }
}
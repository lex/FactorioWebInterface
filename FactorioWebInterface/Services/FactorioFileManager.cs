using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Serilog;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Abstractions;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services
{
    public interface IFactorioFileManager
    {
        event EventHandler<IFactorioFileManager, FilesChangedEventArgs> ChatLogFilesChanged;
        event EventHandler<IFactorioFileManager, FilesChangedEventArgs> GlobalSaveFilesChanged;
        event EventHandler<IFactorioFileManager, FilesChangedEventArgs> LocalSaveFilesChanged;
        event EventHandler<IFactorioFileManager, FilesChangedEventArgs> LogFilesChanged;
        event EventHandler<IFactorioFileManager, CollectionChangedData<ScenarioMetaData>> ScenariosChanged;
        event EventHandler<IFactorioFileManager, FilesChangedEventArgs> TempSaveFilesChanged;

        Result CopyFiles(string serverId, string destination, List<string> filePaths);
        Result DeleteFiles(string serverId, List<string> filePaths);
        FileInfo? GetChatLogFile(string directoryName, string fileName);
        List<FileMetaData> GetChatLogs(FactorioServerData serverData);
        FileMetaData[] GetGlobalSaveFiles();
        FileMetaData[] GetLocalSaveFiles(FactorioServerData serverData);
        FileInfo? GetLogFile(string directoryName, string fileName);
        List<FileMetaData> GetLogs(FactorioServerData serverData);
        DirectoryInfo? GetSaveDirectory(string serverId, string dirName);
        IFileInfo? GetSaveFile(string serverId, string directoryName, string fileName);
        IDirectoryInfo GetScenariosDirectory();
        ScenarioMetaData[] GetScenarios();
        bool HasTempSaveFiles(string tempSavesDirectoryPath);
        FileMetaData[] GetTempSaveFiles(string tempSavesDirectoryPath);
        bool ScenarioExists(string scenarioName);
        Result MoveFiles(string serverId, string destination, List<string> filePaths);
        void NotifyScenariosChanged();
        void NotifyTempFilesChanged(FactorioServerData serverData);
        void RaiseGlobalFilesChanged(FilesChangedEventArgs ev);
        void RaiseLocalFilesChanged(FilesChangedEventArgs ev);
        Task RaiseRecentTempFiles(FactorioServerData serverData);
        void RaiseTempFilesChanged(FilesChangedEventArgs ev);
        Result RenameFile(string serverId, string directoryName, string fileName, string newFileName = "");
        Result RotateChatLogs(FactorioServerMutableData serverData);
        Result RotateFactorioLogs(FactorioServerMutableData serverData);
        Task<Result> UploadFiles(string serverId, IList<IFormFile> files);
        void EnsureScenarioDirectoryRemoved(string localScenarioDirectoryPath);
        void EnsureScenarioDirectoryCreated(string localScenarioDirectoryPath);
        Result BuildServerRunningSettings(FactorioServerConstantData serverData);
        Task SaveServerExtraData(FactorioServerMutableData mutableData);
    }

    public class FactorioFileManager : IFactorioFileManager
    {
        private readonly ILogger<IFactorioFileManager> _logger;
        private readonly IFactorioServerDataService _factorioServerDataService;
        private readonly IFileSystem _fileSystem;

        public event EventHandler<IFactorioFileManager, FilesChangedEventArgs>? TempSaveFilesChanged;
        public event EventHandler<IFactorioFileManager, FilesChangedEventArgs>? LocalSaveFilesChanged;
        public event EventHandler<IFactorioFileManager, FilesChangedEventArgs>? GlobalSaveFilesChanged;
        public event EventHandler<IFactorioFileManager, FilesChangedEventArgs>? LogFilesChanged;
        public event EventHandler<IFactorioFileManager, FilesChangedEventArgs>? ChatLogFilesChanged;
        public event EventHandler<IFactorioFileManager, CollectionChangedData<ScenarioMetaData>>? ScenariosChanged;

        public FactorioFileManager(ILogger<IFactorioFileManager> logger, IFactorioServerDataService factorioServerDataService, IFileSystem fileSystem)
        {
            _logger = logger;
            _factorioServerDataService = factorioServerDataService;
            _fileSystem = fileSystem;
        }

        public bool HasTempSaveFiles(string tempSavesDirectoryPath)
        {
            try
            {
                var directoryInfo = new DirectoryInfo(tempSavesDirectoryPath);
                if (!directoryInfo.Exists)
                {
                    return false;
                }

                return directoryInfo.EnumerateFiles(Constants.FactorioSaveSearchPattern, SearchOption.TopDirectoryOnly).Any();
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(HasTempSaveFiles));
                return false;
            }
        }

        public bool ScenarioExists(string scenarioName)
        {
            try
            {
                string scenarioPath = Path.Combine(_factorioServerDataService.ScenarioDirectoryPath, scenarioName);
                scenarioPath = Path.GetFullPath(scenarioPath);
                if (!scenarioPath.StartsWith(_factorioServerDataService.ScenarioDirectoryPath))
                {
                    return false;
                }

                var scenarioDir = new DirectoryInfo(scenarioPath);
                if (!scenarioDir.Exists)
                {
                    return false;
                }

                return true;
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(ScenarioExists));
                return false;
            }
        }

        public FileMetaData[] GetTempSaveFiles(string tempSavesDirectoryPath)
        {
            var dir = Constants.TempSavesDirectoryName;

            return GetFilesMetaData(tempSavesDirectoryPath, dir);
        }

        public FileMetaData[] GetLocalSaveFiles(FactorioServerData serverData)
        {
            string serverId = serverData.ServerId;

            var path = serverData.LocalSavesDirectoroyPath;
            var dir = Constants.LocalSavesDirectoryName;

            return GetFilesMetaData(path, dir);
        }

        public FileMetaData[] GetGlobalSaveFiles()
        {
            var path = _factorioServerDataService.GlobalSavesDirectoryPath;
            var dir = Constants.GlobalSavesDirectoryName;

            return GetFilesMetaData(path, dir);
        }

        public List<FileMetaData> GetLogs(FactorioServerData serverData)
        {
            string serverId = serverData.ServerId;

            List<FileMetaData> logs = new List<FileMetaData>();

            var currentLog = new FileInfo(serverData.CurrentLogPath);
            if (currentLog.Exists)
            {
                logs.Add(BuildCurrentLogFileMetaData(currentLog, serverId));
            }

            var logsDir = new DirectoryInfo(serverData.LogsDirectoryPath);
            if (logsDir.Exists)
            {
                var logfiles = logsDir.EnumerateFiles("*.log")
                    .Select(x => BuildLogFileMetaData(x, serverId))
                    .OrderByDescending(x => x.CreatedTime);

                logs.AddRange(logfiles);
            }

            return logs;
        }

        public IDirectoryInfo GetScenariosDirectory()
        {
            var dir = _fileSystem.DirectoryInfo.FromDirectoryName(_factorioServerDataService.ScenarioDirectoryPath);
            if (!dir.Exists)
            {
                dir.Create();
            }

            return dir;
        }

        public ScenarioMetaData[] GetScenarios()
        {
            try
            {
                var dir = GetScenariosDirectory();

                return dir.EnumerateDirectories().Select(d =>
                    new ScenarioMetaData()
                    {
                        Name = d.Name,
                        CreatedTime = d.CreationTimeUtc,
                        LastModifiedTime = d.LastWriteTimeUtc
                    }
                ).ToArray();
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString());
                return new ScenarioMetaData[0];
            }
        }

        public List<FileMetaData> GetChatLogs(FactorioServerData serverData)
        {
            string serverId = serverData.ServerId;

            List<FileMetaData> logs = new List<FileMetaData>();

            var logsDir = new DirectoryInfo(serverData.ChatLogsDirectoryPath);
            if (logsDir.Exists)
            {
                var logfiles = logsDir.EnumerateFiles("*.log")
                    .Select(x => BuildLogFileMetaData(x, serverId))
                    .OrderByDescending(x => x.CreatedTime);

                logs.AddRange(logfiles);
            }

            return logs;
        }

        public FileInfo? GetLogFile(string directoryName, string fileName)
        {
            string safeFileName = Path.GetFileName(fileName);
            string path = Path.Combine(_factorioServerDataService.BaseDirectoryPath, directoryName, safeFileName);
            path = Path.GetFullPath(path);

            if (!path.StartsWith(_factorioServerDataService.BaseDirectoryPath))
            {
                return null;
            }

            var file = new FileInfo(path);
            if (!file.Exists)
            {
                return null;
            }

            if (file.Extension != ".log")
            {
                return null;
            }

            if (file.Directory.Name == Constants.LogDirectoryName)
            {
                return file;
            }
            else if (file.Name == Constants.CurrentLogFileName)
            {
                return file;
            }
            else
            {
                return null;
            }
        }

        public FileInfo? GetChatLogFile(string directoryName, string fileName)
        {
            string safeFileName = Path.GetFileName(fileName);
            string path = Path.Combine(_factorioServerDataService.BaseDirectoryPath, directoryName, safeFileName);
            path = Path.GetFullPath(path);

            if (!path.StartsWith(_factorioServerDataService.BaseDirectoryPath))
            {
                return null;
            }

            var file = new FileInfo(path);
            if (!file.Exists)
            {
                return null;
            }

            if (file.Extension != ".log")
            {
                return null;
            }

            if (file.Directory.Name == Constants.ChatLogDirectoryName)
            {
                return file;
            }
            else
            {
                return null;
            }
        }

        private FileMetaData[] GetFilesMetaData(string path, string directory)
        {
            try
            {
                var di = new DirectoryInfo(path);
                if (!di.Exists)
                {
                    di.Create();
                }

                var files = di.EnumerateFiles(Constants.FactorioSaveSearchPattern)
                    .Select(f => new FileMetaData()
                    {
                        Name = f.Name,
                        Directory = directory,
                        CreatedTime = f.CreationTimeUtc,
                        LastModifiedTime = f.LastWriteTimeUtc,
                        Size = f.Length
                    })
                    .ToArray();

                return files;
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString());
                return new FileMetaData[0];
            }
        }

        private bool IsSaveDirectory(string dirName)
        {
            switch (dirName)
            {
                case Constants.GlobalSavesDirectoryName:
                case Constants.LocalSavesDirectoryName:
                case Constants.TempSavesDirectoryName:
                    return true;
                default:
                    return false;
            }
        }

        private DirectoryInfo? GetSaveDirectory(string dirName)
        {
            try
            {
                if (_factorioServerDataService.IsValidSaveDirectory(dirName))
                {
                    var dirPath = Path.Combine(_factorioServerDataService.BaseDirectoryPath, dirName);
                    dirPath = Path.GetFullPath(dirPath);

                    if (!dirPath.StartsWith(_factorioServerDataService.BaseDirectoryPath))
                        return null;

                    var dir = new DirectoryInfo(dirPath);
                    if (!dir.Exists)
                    {
                        dir.Create();
                    }

                    return dir;
                }
                else
                {
                    return null;
                }
            }
            catch (Exception)
            {
                return null;
            }
        }

        public DirectoryInfo? GetSaveDirectory(string serverId, string dirName)
        {
            if (dirName == Constants.TempSavesDirectoryName || dirName == Constants.LocalSavesDirectoryName)
            {
                dirName = Path.Combine(serverId, dirName);
            }

            return GetSaveDirectory(dirName);
        }

        private string GetServerIdOfDirectory(DirectoryInfo dir)
        {
            switch (dir.Name)
            {
                case Constants.TempSavesDirectoryName:
                case Constants.LocalSavesDirectoryName:
                    var parent = dir.Parent;
                    return parent.Name;
                default:
                    return "";
            }
        }

        private string? SafeFilePath(string dirPath, string fileName)
        {
            fileName = Path.GetFileName(fileName);
            string path = Path.Combine(dirPath, fileName);
            path = Path.GetFullPath(path);

            if (!path.StartsWith(_factorioServerDataService.BaseDirectoryPath))
            {
                return null;
            }

            return path;
        }

        public IFileInfo? GetSaveFile(string serverId, string directoryName, string fileName)
        {
            var directory = GetSaveDirectory(serverId, directoryName);

            if (directory == null)
            {
                return null;
            }

            string? path = SafeFilePath(directory.FullName, fileName);
            if (path == null)
            {
                return null;
            }

            if (Path.GetExtension(fileName) != Constants.FactorioSaveExtension)
            {
                return null;
            }

            try
            {
                IFileInfo fi = _fileSystem.FileInfo.FromFileName(path);
                if (fi.Exists)
                {
                    return fi;
                }
                else
                {
                    return null;
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(GetSaveFile));
                return null;
            }
        }

        public async Task<Result> UploadFiles(string serverId, IList<IFormFile> files)
        {
            var directory = GetSaveDirectory(serverId, Constants.LocalSavesDirectoryName);

            if (directory == null)
            {
                return Result.Failure(new Error(Constants.InvalidDirectoryErrorKey, Path.Combine(serverId, Constants.LocalSavesDirectoryName)));
            }

            var changedFiles = new List<FileMetaData>();
            var errors = new List<Error>();

            foreach (var file in files)
            {
                if (string.IsNullOrWhiteSpace(file.FileName))
                {
                    errors.Add(new Error(Constants.InvalidFileNameErrorKey, file.FileName ?? ""));
                    continue;
                }
                if (file.FileName.Contains(" "))
                {
                    errors.Add(new Error(Constants.InvalidFileNameErrorKey, $"name {file.FileName} cannot contain spaces."));
                    continue;
                }

                string? path = SafeFilePath(directory.FullName, file.FileName);
                if (path == null)
                {
                    errors.Add(new Error(Constants.FileErrorKey, $"Error uploading {file.FileName}."));
                    continue;
                }

                try
                {
                    var fi = new FileInfo(path);

                    if (fi.Exists)
                    {
                        errors.Add(new Error(Constants.FileAlreadyExistsErrorKey, $"{file.FileName} already exists."));
                        continue;
                    }

                    using (var writeStream = fi.OpenWrite())
                    using (var readStream = file.OpenReadStream())
                    {
                        await readStream.CopyToAsync(writeStream);
                        await writeStream.FlushAsync();
                    }

                    fi.Refresh();

                    var fileMetaData = new FileMetaData()
                    {
                        Name = fi.Name,
                        CreatedTime = fi.CreationTimeUtc,
                        LastModifiedTime = fi.LastWriteTimeUtc,
                        Size = fi.Length,
                        Directory = Constants.LocalSavesDirectoryName
                    };

                    changedFiles.Add(fileMetaData);
                }
                catch (Exception e)
                {
                    _logger.LogError("Error Uploading file.", e);
                    errors.Add(new Error(Constants.FileErrorKey, $"Error uploading {file.FileName}."));
                }
            }

            if (changedFiles.Count > 0)
            {
                var changeData = CollectionChangedData.Add(changedFiles);
                var ev = new FilesChangedEventArgs(serverId, changeData);

                _ = Task.Run(() => LocalSaveFilesChanged?.Invoke(this, ev));
            }

            if (errors.Count != 0)
            {
                return Result.Failure(errors);
            }
            else
            {
                return Result.OK;
            }
        }

        public Result DeleteFiles(string serverId, List<string> filePaths)
        {
            var changedTempFiles = new List<FileMetaData>();
            var changedLocalFiles = new List<FileMetaData>();
            var changedGlobalFiles = new List<FileMetaData>();
            var errors = new List<Error>();

            foreach (string filePath in filePaths)
            {
                var dirName = Path.GetDirectoryName(filePath) ?? "";
                var dir = GetSaveDirectory(serverId, dirName);

                if (dir == null)
                {
                    errors.Add(new Error(Constants.InvalidDirectoryErrorKey, dirName));
                    continue;
                }

                string? path = SafeFilePath(dir.FullName, filePath);
                if (path == null)
                {
                    errors.Add(new Error(Constants.FileErrorKey, $"Error deleting {filePath}."));
                    continue;
                }

                try
                {
                    var fi = new FileInfo(path);

                    if (!fi.Exists)
                    {
                        errors.Add(new Error(Constants.MissingFileErrorKey, $"{filePath} doesn't exists."));
                        continue;
                    }

                    var fileMetaData = new FileMetaData()
                    {
                        Name = fi.Name,
                        CreatedTime = fi.CreationTimeUtc,
                        LastModifiedTime = fi.LastWriteTimeUtc,
                        Size = fi.Length,
                        Directory = dirName
                    };

                    fi.Delete();

                    switch (dirName)
                    {
                        case Constants.TempSavesDirectoryName:
                            changedTempFiles.Add(fileMetaData);
                            break;
                        case Constants.LocalSavesDirectoryName:
                            changedLocalFiles.Add(fileMetaData);
                            break;
                        case Constants.GlobalSavesDirectoryName:
                            changedGlobalFiles.Add(fileMetaData);
                            break;
                        default:
                            break;
                    }
                }
                catch (Exception e)
                {
                    _logger.LogError("Error Deleting file.", e);
                    errors.Add(new Error(Constants.FileErrorKey, $"Error deleting {filePath}."));
                }
            }

            if (changedTempFiles.Count > 0)
            {
                var changeData = CollectionChangedData.Remove(changedTempFiles);
                var ev = new FilesChangedEventArgs(serverId, changeData);

                _ = Task.Run(() => TempSaveFilesChanged?.Invoke(this, ev));
            }

            if (changedLocalFiles.Count > 0)
            {
                var changeData = CollectionChangedData.Remove(changedLocalFiles);
                var ev = new FilesChangedEventArgs(serverId, changeData);

                _ = Task.Run(() => LocalSaveFilesChanged?.Invoke(this, ev));
            }

            if (changedGlobalFiles.Count > 0)
            {
                var changeData = CollectionChangedData.Remove(changedGlobalFiles);
                var ev = new FilesChangedEventArgs("", changeData);

                _ = Task.Run(() => GlobalSaveFilesChanged?.Invoke(this, ev));
            }

            if (errors.Count != 0)
            {
                return Result.Failure(errors);
            }
            else
            {
                return Result.OK;
            }
        }

        private static HashSet<string> trackMap = new HashSet<string>()
        {
            Constants.TempSavesDirectoryName,
            Constants.LocalSavesDirectoryName,
            Constants.GlobalSavesDirectoryName
        };

        public Result MoveFiles(string serverId, string destination, List<string> filePaths)
        {
            string targetDirPath = Path.Combine(_factorioServerDataService.BaseDirectoryPath, destination);

            var targetDir = GetSaveDirectory(destination);
            if (targetDir == null)
            {
                return Result.Failure(new Error(Constants.InvalidDirectoryErrorKey, destination));
            }

            bool trackDestination = trackMap.Contains(targetDir.Name);

            List<FileMetaData>? newFiles = null;
            string? destinationId = null;
            if (trackDestination)
            {
                newFiles = new List<FileMetaData>();
                destinationId = GetServerIdOfDirectory(targetDir);
            }

            var oldTempFiles = new List<FileMetaData>();
            var oldLocalFiles = new List<FileMetaData>();
            var oldGlobalFiles = new List<FileMetaData>();

            var errors = new List<Error>();

            foreach (var filePath in filePaths)
            {
                var sourceDirName = Path.GetDirectoryName(filePath) ?? "";
                var sourceDir = GetSaveDirectory(serverId, sourceDirName);

                if (sourceDir == null)
                {
                    errors.Add(new Error(Constants.InvalidDirectoryErrorKey, sourceDirName));
                    continue;
                }

                string? sourceFullPath = SafeFilePath(sourceDir.FullName, filePath);
                if (sourceFullPath == null)
                {
                    errors.Add(new Error(Constants.FileErrorKey, $"Error moveing {filePath}."));
                    continue;
                }

                try
                {
                    var sourceFile = new FileInfo(sourceFullPath);

                    if (!sourceFile.Exists)
                    {
                        errors.Add(new Error(Constants.MissingFileErrorKey, $"{filePath} doesn't exists."));
                        continue;
                    }

                    string destinationFilePath = Path.Combine(targetDir.FullName, sourceFile.Name);

                    var destinationFileInfo = new FileInfo(destinationFilePath);

                    if (destinationFileInfo.Exists)
                    {
                        errors.Add(new Error(Constants.FileAlreadyExistsErrorKey, $"{destination}/{destinationFileInfo.Name} already exists."));
                        continue;
                    }

                    var oldFileMetaDdata = new FileMetaData()
                    {
                        Name = sourceFile.Name,
                        CreatedTime = sourceFile.CreationTimeUtc,
                        LastModifiedTime = sourceFile.LastWriteTimeUtc,
                        Size = sourceFile.Length,
                        Directory = sourceFile.Directory.Name
                    };

                    sourceFile.MoveTo(destinationFilePath);

                    switch (oldFileMetaDdata.Directory)
                    {
                        case Constants.TempSavesDirectoryName:
                            oldTempFiles.Add(oldFileMetaDdata);
                            break;
                        case Constants.LocalSavesDirectoryName:
                            oldLocalFiles.Add(oldFileMetaDdata);
                            break;
                        case Constants.GlobalSavesDirectoryName:
                            oldGlobalFiles.Add(oldFileMetaDdata);
                            break;
                        default:
                            break;
                    }

                    if (trackDestination)
                    {
                        destinationFileInfo.Refresh();

                        var newFileMetaData = new FileMetaData()
                        {
                            Name = destinationFileInfo.Name,
                            CreatedTime = destinationFileInfo.CreationTimeUtc,
                            LastModifiedTime = destinationFileInfo.LastWriteTimeUtc,
                            Size = destinationFileInfo.Length,
                            Directory = destinationFileInfo.Directory.Name
                        };

                        newFiles!.Add(newFileMetaData);
                    }
                }
                catch (Exception e)
                {
                    _logger.LogError("Error moveing file.", e);
                    errors.Add(new Error(Constants.FileErrorKey, $"Error moveing {filePath}."));
                }
            }

            if (oldTempFiles.Count > 0)
            {
                var changeData = CollectionChangedData.Remove(oldTempFiles);
                var ev = new FilesChangedEventArgs(serverId, changeData);

                _ = Task.Run(() => TempSaveFilesChanged?.Invoke(this, ev));
            }

            if (oldLocalFiles.Count > 0)
            {
                var changeData = CollectionChangedData.Remove(oldLocalFiles);
                var ev = new FilesChangedEventArgs(serverId, changeData);

                _ = Task.Run(() => LocalSaveFilesChanged?.Invoke(this, ev));
            }

            if (oldGlobalFiles.Count > 0)
            {
                var changeData = CollectionChangedData.Remove(oldGlobalFiles);
                var ev = new FilesChangedEventArgs("", changeData);

                _ = Task.Run(() => GlobalSaveFilesChanged?.Invoke(this, ev));
            }

            if (trackDestination && newFiles!.Count > 0)
            {
                var changeData = CollectionChangedData.Add(newFiles);
                var ev = new FilesChangedEventArgs(destinationId!, changeData);

                switch (targetDir.Name)
                {
                    case Constants.TempSavesDirectoryName:
                        _ = Task.Run(() => TempSaveFilesChanged?.Invoke(this, ev));
                        break;
                    case Constants.LocalSavesDirectoryName:
                        _ = Task.Run(() => LocalSaveFilesChanged?.Invoke(this, ev));
                        break;
                    case Constants.GlobalSavesDirectoryName:
                        _ = Task.Run(() => GlobalSaveFilesChanged?.Invoke(this, ev));
                        break;
                    default:
                        break;
                }
            }

            if (errors.Count != 0)
            {
                return Result.Failure(errors);
            }
            else
            {
                return Result.OK;
            }
        }

        public Result CopyFiles(string serverId, string destination, List<string> filePaths)
        {
            string targetDirPath = Path.Combine(_factorioServerDataService.BaseDirectoryPath, destination);

            var targetDir = GetSaveDirectory(destination);
            if (targetDir == null)
            {
                return Result.Failure(new Error(Constants.InvalidDirectoryErrorKey, destination));
            }

            bool trackDestination = trackMap.Contains(targetDir.Name);

            List<FileMetaData>? newFiles = null;
            string? destinationId = null;
            if (trackDestination)
            {
                newFiles = new List<FileMetaData>();
                destinationId = GetServerIdOfDirectory(targetDir);
            }

            var errors = new List<Error>();

            foreach (var filePath in filePaths)
            {
                var sourceDirName = Path.GetDirectoryName(filePath) ?? "";
                var sourceDir = GetSaveDirectory(serverId, sourceDirName);

                if (sourceDir == null)
                {
                    errors.Add(new Error(Constants.InvalidDirectoryErrorKey, sourceDirName));
                    continue;
                }

                string? sourceFullPath = SafeFilePath(sourceDir.FullName, filePath);
                if (sourceFullPath == null)
                {
                    errors.Add(new Error(Constants.FileErrorKey, $"Error coppying {filePath}."));
                    continue;
                }

                try
                {
                    var sourceFile = new FileInfo(sourceFullPath);

                    if (!sourceFile.Exists)
                    {
                        errors.Add(new Error(Constants.MissingFileErrorKey, $"{filePath} doesn't exists."));
                        continue;
                    }

                    string destinationFilePath = Path.Combine(targetDir.FullName, sourceFile.Name);

                    var destinationFileInfo = new FileInfo(destinationFilePath);

                    if (destinationFileInfo.Exists)
                    {
                        errors.Add(new Error(Constants.FileAlreadyExistsErrorKey, $"{destination}/{destinationFileInfo.Name} already exists."));
                        continue;
                    }

                    sourceFile.CopyTo(destinationFilePath);
                    destinationFileInfo.LastWriteTimeUtc = sourceFile.LastWriteTimeUtc;


                    if (trackDestination)
                    {
                        destinationFileInfo.Refresh();

                        var newFileMetaData = new FileMetaData()
                        {
                            Name = destinationFileInfo.Name,
                            CreatedTime = destinationFileInfo.CreationTimeUtc,
                            LastModifiedTime = destinationFileInfo.LastWriteTimeUtc,
                            Size = destinationFileInfo.Length,
                            Directory = destinationFileInfo.Directory.Name
                        };

                        newFiles!.Add(newFileMetaData);
                    }
                }
                catch (Exception e)
                {
                    _logger.LogError("Error copying file.", e);
                    errors.Add(new Error(Constants.FileErrorKey, $"Error coppying {filePath}."));
                }
            }

            if (trackDestination && newFiles!.Count > 0)
            {
                var changeData = CollectionChangedData.Add(newFiles);
                var ev = new FilesChangedEventArgs(destinationId!, changeData);

                switch (targetDir.Name)
                {
                    case Constants.TempSavesDirectoryName:
                        _ = Task.Run(() => TempSaveFilesChanged?.Invoke(this, ev));
                        break;
                    case Constants.LocalSavesDirectoryName:
                        _ = Task.Run(() => LocalSaveFilesChanged?.Invoke(this, ev));
                        break;
                    case Constants.GlobalSavesDirectoryName:
                        _ = Task.Run(() => GlobalSaveFilesChanged?.Invoke(this, ev));
                        break;
                    default:
                        break;
                }
            }

            if (errors.Count != 0)
            {
                return Result.Failure(errors);
            }
            else
            {
                return Result.OK;
            }
        }

        public Result RenameFile(string serverId, string directoryName, string fileName, string newFileName = "")
        {
            if (string.IsNullOrWhiteSpace(newFileName))
            {
                return Result.Failure(Constants.InvalidFileNameErrorKey, newFileName);
            }
            if (newFileName.Contains(" "))
            {
                return Result.Failure(Constants.InvalidFileNameErrorKey, $"name { newFileName} cannot contain spaces.");
            }

            var directory = GetSaveDirectory(serverId, directoryName);

            if (directory == null)
            {
                return Result.Failure(new Error(Constants.InvalidDirectoryErrorKey, directoryName));
            }

            try
            {
                string actualFileName = Path.GetFileName(fileName);

                if (actualFileName != fileName)
                {
                    return Result.Failure(Constants.FileErrorKey, $"Invalid file name {fileName}");
                }

                string actualNewFileName = Path.GetFileName(newFileName);

                if (actualNewFileName != newFileName)
                {
                    return Result.Failure(Constants.FileErrorKey, $"Invalid file name {newFileName}");
                }

                string filePath = Path.Combine(directory.FullName, fileName);
                var fileInfo = new FileInfo(filePath);

                if (!fileInfo.Exists)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"File {fileName} doesn't exist.");
                }

                string newFilePath = Path.Combine(directory.FullName, newFileName);
                if (Path.GetExtension(newFilePath) != Constants.FactorioSaveExtension)
                {
                    newFilePath += Constants.FactorioSaveExtension;
                }

                var newFileInfo = new FileInfo(newFilePath);

                if (newFileInfo.Exists)
                {
                    return Result.Failure(Constants.FileAlreadyExistsErrorKey, $"File {fileName} already exists.");
                }

                string dirName = directory.Name;

                var oldFileMetaDdata = new FileMetaData()
                {
                    Name = fileInfo.Name,
                    CreatedTime = fileInfo.CreationTimeUtc,
                    LastModifiedTime = fileInfo.LastWriteTimeUtc,
                    Size = fileInfo.Length,
                    Directory = dirName
                };

                fileInfo.MoveTo(newFilePath);
                newFileInfo.Refresh();

                var newFileMetaData = new FileMetaData()
                {
                    Name = newFileInfo.Name,
                    CreatedTime = newFileInfo.CreationTimeUtc,
                    LastModifiedTime = newFileInfo.LastWriteTimeUtc,
                    Size = newFileInfo.Length,
                    Directory = dirName
                };

                if (directoryName == Constants.GlobalSavesDirectoryName)
                {
                    serverId = "";
                }

                var changeData = CollectionChangedData.AddAndRemove(new[] { newFileMetaData }, new[] { oldFileMetaDdata });
                var ev = new FilesChangedEventArgs(serverId, changeData);

                switch (dirName)
                {
                    case Constants.TempSavesDirectoryName:
                        _ = Task.Run(() => TempSaveFilesChanged?.Invoke(this, ev));
                        break;
                    case Constants.LocalSavesDirectoryName:
                        _ = Task.Run(() => LocalSaveFilesChanged?.Invoke(this, ev));
                        break;
                    case Constants.GlobalSavesDirectoryName:
                        _ = Task.Run(() => GlobalSaveFilesChanged?.Invoke(this, ev));
                        break;
                    default:
                        break;
                }

                return Result.OK;
            }
            catch (Exception e)
            {
                _logger.LogError("Error renaming file.", e);
                return Result.Failure(Constants.FileErrorKey, $"Error renaming files");
            }
        }
        private static string MakeLogFilePath(FileInfo file, DirectoryInfo logDirectory)
        {
            string timeStamp = file.CreationTimeUtc.ToString("yyyyMMddHHmmss");
            string logName = Path.GetFileNameWithoutExtension(file.Name);

            return Path.Combine(logDirectory.FullName, $"{logName}{timeStamp}.log");
        }

        private struct FilesChanged
        {
            public static FilesChanged empty = new FilesChanged();

            public IReadOnlyList<FileMetaData>? newFiles;
            public IReadOnlyList<FileMetaData>? oldFiles;

            public FilesChanged(IReadOnlyList<FileMetaData>? newFiles, IReadOnlyList<FileMetaData>? oldFiles = null)
            {
                this.newFiles = newFiles;
                this.oldFiles = oldFiles;
            }

            public CollectionChangedData<FileMetaData> BuildCollectionChangedData()
            {
                if (newFiles != null && oldFiles != null)
                {
                    return CollectionChangedData.AddAndRemove(newFiles, oldFiles);
                }
                else if (newFiles != null)
                {
                    return CollectionChangedData.Add(newFiles);
                }
                else if (oldFiles != null)
                {
                    return CollectionChangedData.Add(oldFiles);
                }
                else
                {
                    return CollectionChangedData.Add(Array.Empty<FileMetaData>());
                }
            }
        }

        private Result<FilesChanged> RotateFactorioLogsInner(FactorioServerMutableData serverData)
        {
            string serverId = serverData.ServerId;

            try
            {
                var dir = new DirectoryInfo(serverData.LogsDirectoryPath);
                if (!dir.Exists)
                {
                    dir.Create();
                }

                var currentLog = new FileInfo(serverData.CurrentLogPath);
                if (!currentLog.Exists)
                {
                    using (_ = currentLog.Create()) { }
                    currentLog.CreationTimeUtc = DateTime.UtcNow;

                    var filesChanged = new FilesChanged(new[] { BuildCurrentLogFileMetaData(currentLog, serverId) });
                    return Result<FilesChanged>.OK(filesChanged);
                }

                if (currentLog.Length == 0)
                {
                    currentLog.CreationTimeUtc = DateTime.UtcNow;

                    var filesChanged = new FilesChanged(new[] { BuildCurrentLogFileMetaData(currentLog, serverId) });
                    return Result<FilesChanged>.OK(filesChanged);
                }

                string path = MakeLogFilePath(currentLog, dir);
                var targetLog = new FileInfo(path);
                if (targetLog.Exists)
                {
                    targetLog.Delete();
                }

                currentLog.MoveTo(path);
                targetLog.Refresh();

                var newFile = new FileInfo(serverData.CurrentLogPath);
                using (_ = newFile.Create()) { }
                newFile.CreationTimeUtc = DateTime.UtcNow;

                var logs = dir.GetFiles("*.log");

                int removeCount = logs.Length - _factorioServerDataService.MaxLogFiles + 1;
                if (removeCount <= 0)
                {
                    var filesChanged = new FilesChanged(new[]
                    {
                        BuildCurrentLogFileMetaData(newFile, serverData.ServerId),
                        BuildLogFileMetaData(targetLog, serverData.ServerId)
                    });
                    return Result<FilesChanged>.OK(filesChanged);
                }

                var archiveDir = new DirectoryInfo(serverData.ArchiveLogsDirectoryPath);
                if (!archiveDir.Exists)
                {
                    archiveDir.Create();
                }

                // sort oldest first.
                Array.Sort(logs, (a, b) => a.CreationTimeUtc.CompareTo(b.CreationTimeUtc));
                var oldLogs = new List<FileMetaData>();

                for (int i = 0; i < removeCount && i < logs.Length; i++)
                {
                    var log = logs[i];

                    var archivePath = Path.Combine(archiveDir.FullName, log.Name);

                    log.MoveTo(archivePath);
                    oldLogs.Add(BuildLogFileMetaData(log, serverId));
                }

                var newLogs = new[]
                {
                    BuildCurrentLogFileMetaData(newFile, serverData.ServerId),
                    BuildLogFileMetaData(targetLog, serverData.ServerId)
                };

                return Result<FilesChanged>.OK(new FilesChanged(newLogs, oldLogs));
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(RotateFactorioLogs));
                return Result<FilesChanged>.Failure(Constants.UnexpectedErrorKey, e.Message);
            }
        }

        public Result RotateFactorioLogs(FactorioServerMutableData serverData)
        {
            var result = RotateFactorioLogsInner(serverData);
            if (!result.Success)
            {
                return result;
            }

            var filesChanged = result.Value;
            var changeData = filesChanged.BuildCollectionChangedData();
            var ev = new FilesChangedEventArgs(serverData.ServerId, changeData);

            Task.Run(() => LogFilesChanged?.Invoke(this, ev));

            return result;
        }

        private Result<FilesChanged> RotateChatLogsInner(FactorioServerMutableData serverData)
        {
            void BuildLogger(FileInfo file)
            {
                file.CreationTimeUtc = DateTime.UtcNow;

                serverData.ChatLogger = new LoggerConfiguration()
                        .MinimumLevel.Information()
                        .WriteTo.Async(a => a.File(serverData.ChatLogCurrentPath, outputTemplate: "{Message:l}{NewLine}"))
                        .CreateLogger();
            }

            string serverId = serverData.ServerId;

            try
            {
                serverData.ChatLogger?.Dispose();

                var dir = new DirectoryInfo(serverData.ChatLogsDirectoryPath);
                if (!dir.Exists)
                {
                    dir.Create();
                }

                var currentLog = new FileInfo(serverData.ChatLogCurrentPath);
                if (!currentLog.Exists)
                {
                    using (_ = currentLog.Create()) { }

                    BuildLogger(currentLog);

                    var filesChanged = new FilesChanged(new[] { BuildLogFileMetaData(currentLog, serverId) });
                    return Result<FilesChanged>.OK(filesChanged);
                }

                if (currentLog.Length == 0)
                {
                    BuildLogger(currentLog);

                    var filesChanged = new FilesChanged(new[] { BuildLogFileMetaData(currentLog, serverId) });
                    return Result<FilesChanged>.OK(filesChanged);
                }

                string path = MakeLogFilePath(currentLog, dir);
                var targetLog = new FileInfo(path);
                if (targetLog.Exists)
                {
                    targetLog.Delete();
                }

                currentLog.MoveTo(path);
                targetLog.Refresh();

                var newFile = new FileInfo(serverData.ChatLogCurrentPath);
                using (_ = newFile.Create()) { }
                BuildLogger(newFile);

                var logs = dir.GetFiles("*.log");

                int removeCount = logs.Length - _factorioServerDataService.MaxLogFiles;
                if (removeCount <= 0)
                {
                    var filesChanged = new FilesChanged(new[]
                    {
                        BuildLogFileMetaData(newFile, serverData.ServerId),
                        BuildLogFileMetaData(targetLog, serverData.ServerId)
                    });
                    return Result<FilesChanged>.OK(filesChanged);
                }

                var archiveDir = new DirectoryInfo(serverData.ChatLogsArchiveDirectoryPath);
                if (!archiveDir.Exists)
                {
                    archiveDir.Create();
                }

                // sort oldest first.
                Array.Sort(logs, (a, b) => a.CreationTimeUtc.CompareTo(b.CreationTimeUtc));
                var oldLogs = new List<FileMetaData>();

                for (int i = 0; i < removeCount && i < logs.Length; i++)
                {
                    var log = logs[i];

                    var archivePath = Path.Combine(archiveDir.FullName, log.Name);

                    log.MoveTo(archivePath);
                    oldLogs.Add(BuildLogFileMetaData(log, serverId));
                }

                var newLogs = new[]
                {
                    BuildLogFileMetaData(newFile, serverData.ServerId),
                    BuildLogFileMetaData(targetLog, serverData.ServerId)
                };

                return Result<FilesChanged>.OK(new FilesChanged(newLogs, oldLogs));
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(RotateChatLogsInner));
                return Result<FilesChanged>.Failure(Constants.UnexpectedErrorKey, e.Message);
            }
        }

        public Result RotateChatLogs(FactorioServerMutableData serverData)
        {
            var result = RotateChatLogsInner(serverData);
            if (!result.Success)
            {
                return result;
            }

            var filesChanged = result.Value;
            var changeData = filesChanged.BuildCollectionChangedData();
            var ev = new FilesChangedEventArgs(serverData.ServerId, changeData);

            _ = Task.Run(() => ChatLogFilesChanged?.Invoke(this, ev));

            return result;
        }

        public Result BuildServerRunningSettings(FactorioServerConstantData serverData)
        {
            try
            {
                _fileSystem.File.Copy(serverData.ServerSettingsPath, serverData.ServerRunningSettingsPath, true);
                return Result.OK;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, nameof(BuildServerRunningSettings));
                return Result.Failure(Constants.UnexpectedErrorKey, ex.Message);
            }
        }

        public Task SaveServerExtraData(FactorioServerMutableData mutableData)
        {
            var data = new FactorioServerExtraData() { SelectedModPack = mutableData.ModPack };
            byte[] bytes = System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(data);

            return _fileSystem.WriteAllBytesAsync(mutableData.ServerExtraDataPath, bytes)
                              .LogExceptions(_logger);
        }

        public void EnsureScenarioDirectoryRemoved(string localScenarioDirectoryPath) => _fileSystem.DeleteDirectoryIfExists(localScenarioDirectoryPath);

        public void EnsureScenarioDirectoryCreated(string localScenarioDirectoryPath)
        {
            var dir = new DirectoryInfo(localScenarioDirectoryPath);
            if (!dir.Exists)
            {
                FileHelpers.CreateDirectorySymlink(_factorioServerDataService.ScenarioDirectoryPath, localScenarioDirectoryPath);
            }
            else if (!FileHelpers.IsSymbolicLink(localScenarioDirectoryPath))
            {
                dir.Delete(true);
                FileHelpers.CreateDirectorySymlink(_factorioServerDataService.ScenarioDirectoryPath, localScenarioDirectoryPath);
            }
        }

        public void RaiseTempFilesChanged(FilesChangedEventArgs ev)
        {
            Task.Run(() => TempSaveFilesChanged?.Invoke(this, ev));
        }

        public void RaiseLocalFilesChanged(FilesChangedEventArgs ev)
        {
            Task.Run(() => LocalSaveFilesChanged?.Invoke(this, ev));
        }

        public void RaiseGlobalFilesChanged(FilesChangedEventArgs ev)
        {
            Task.Run(() => GlobalSaveFilesChanged?.Invoke(this, ev));
        }

        public Task RaiseRecentTempFiles(FactorioServerData serverData)
        {
            DateTime ChangeLastTime(FactorioServerMutableData md)
            {
                DateTime lastChecked = md.LastTempFilesChecked;
                md.LastTempFilesChecked = DateTime.UtcNow;

                return lastChecked;
            }

            async Task RaiseRecentTempFilesInner()
            {
                DateTime lastChecked = await serverData.LockAsync(ChangeLastTime);

                try
                {
                    var dir = new DirectoryInfo(serverData.TempSavesDirectoryPath);

                    if (!dir.Exists)
                    {
                        dir.Create();
                        return;
                    }

                    var files = dir.EnumerateFiles()
                        .Where(f => f.LastWriteTimeUtc >= lastChecked)
                        .Select(f => new FileMetaData()
                        {
                            Name = f.Name,
                            CreatedTime = f.CreationTimeUtc,
                            LastModifiedTime = f.LastWriteTimeUtc,
                            Size = f.Length,
                            Directory = Constants.TempSavesDirectoryName
                        })
                        .ToArray<FileMetaData>();

                    var changeData = CollectionChangedData.Add(files);
                    var ev = new FilesChangedEventArgs(serverData.ServerId, changeData);

                    TempSaveFilesChanged?.Invoke(this, ev);
                }
                catch (Exception ex)
                {
                    _logger.LogError(nameof(RaiseRecentTempFiles), ex);
                }
            }

            return Task.Run(RaiseRecentTempFilesInner);
        }

        public void NotifyTempFilesChanged(FactorioServerData serverData)
        {
            Task.Run(() =>
            {
                var files = GetTempSaveFiles(serverData.TempSavesDirectoryPath);
                var changeData = CollectionChangedData.Add(files);
                var ev = new FilesChangedEventArgs(serverData.ServerId, changeData);

                TempSaveFilesChanged?.Invoke(this, ev);
            });
        }

        public void NotifyScenariosChanged()
        {
            var scenarios = GetScenarios();
            var ev = CollectionChangedData.Add(scenarios);

            ScenariosChanged?.Invoke(this, ev);
        }

        private FileMetaData BuildLogFileMetaData(FileInfo file, string serverId)
        {
            return new FileMetaData()
            {
                Name = file.Name,
                Directory = Path.Combine(serverId, file.Directory.Name),
                CreatedTime = file.CreationTimeUtc,
                LastModifiedTime = file.LastWriteTimeUtc,
                Size = file.Length
            };
        }

        private FileMetaData BuildCurrentLogFileMetaData(FileInfo file, string serverId)
        {
            return new FileMetaData()
            {
                Name = file.Name,
                Directory = serverId,
                CreatedTime = file.CreationTimeUtc,
                LastModifiedTime = file.LastWriteTimeUtc,
                Size = file.Length
            };
        }
    }
}

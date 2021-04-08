using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Abstractions;
using System.Linq;
using System.Threading.Tasks;
//using static FactorioWebInterface.Models.ModPackChangedType;

namespace FactorioWebInterface.Services
{
    public interface IFactorioModManager
    {
        event EventHandler<IFactorioModManager, CollectionChangedData<ModPackMetaData>> ModPackChanged;
        event EventHandler<IFactorioModManager, ModPackFilesChangedEventArgs> ModPackFilesChanged;

        Result CopyModPackFiles(string sourceModPack, string targetModPack, string[] files);
        Result CreateModPack(string name);
        Result DeleteModPack(string name);
        Result DeleteModPackFiles(string modPack, string[] files);
        IDirectoryInfo? GetModPackDirectoryInfo(string modPack);
        FileInfo? GetModPackFile(string modPack, string fileName);
        ModPackFileMetaData[] GetModPackFiles(string name);
        ModPackMetaData[] GetModPacks();
        Result MoveModPackFiles(string sourceModPack, string targetModPack, string[] files);
        Result RenameModPack(string name, string newName);
        Task<Result> UploadFiles(string modPack, IList<IFormFile> files);
        Task<Result> DownloadFromModPortal(string modPack, IReadOnlyList<string> fileNames);
    }

    public class FactorioModManager : IFactorioModManager
    {
        private readonly IHubContext<FactorioModHub, IFactorioModClientMethods> _factorioModHub;
        private readonly IFactorioServerDataService _factorioServerDataService;
        private readonly ILogger<FactorioModManager> _logger;
        private readonly IFactorioModPortalService _modPortalService;
        private readonly IFileSystem _fileSystem = new FileSystem();

        public event EventHandler<IFactorioModManager, CollectionChangedData<ModPackMetaData>> ModPackChanged;
        public event EventHandler<IFactorioModManager, ModPackFilesChangedEventArgs> ModPackFilesChanged;

        public FactorioModManager(IHubContext<FactorioModHub,
            IFactorioModClientMethods> factorioModHub,
            IFactorioServerDataService factorioServerDataService,
            ILogger<FactorioModManager> logger,
            IFactorioModPortalService modPortalService)
        {
            _factorioModHub = factorioModHub;
            _factorioServerDataService = factorioServerDataService;
            _logger = logger;
            _modPortalService = modPortalService;

            ModPackChanged += FactorioModManager_ModPackChanged;
            ModPackFilesChanged += FactorioModManager_ModPackFilesChanged;
        }

        private void FactorioModManager_ModPackChanged(IFactorioModManager sender, CollectionChangedData<ModPackMetaData> eventArgs)
        {
            _factorioModHub.Clients.All.SendModPacks(eventArgs);
        }

        private void FactorioModManager_ModPackFilesChanged(IFactorioModManager sender, ModPackFilesChangedEventArgs eventArgs)
        {
            _factorioModHub.Clients.All.SendModPackFiles(eventArgs.ModPack, eventArgs.ChangedData);
        }

        public ModPackMetaData[] GetModPacks()
        {
            try
            {
                var dir = new DirectoryInfo(_factorioServerDataService.ModsDirectoryPath);

                if (!dir.Exists)
                {
                    dir.Create();
                    return Array.Empty<ModPackMetaData>();
                }

                return dir.GetDirectories()
                    .Select(x => new ModPackMetaData()
                    {
                        Name = x.Name,
                        CreatedTime = x.CreationTimeUtc,
                        LastModifiedTime = x.LastWriteTimeUtc
                    })
                    .ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, nameof(GetModPacks));
                return Array.Empty<ModPackMetaData>();
            }
        }

        public IDirectoryInfo? GetModPackDirectoryInfo(string modPack)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(modPack))
                {
                    return null;
                }

                var dir = new DirectoryInfo(_factorioServerDataService.ModsDirectoryPath);

                if (!dir.Exists)
                {
                    dir.Create();
                    return null;
                }

                string safeName = Path.GetFileName(modPack);
                string modPackPath = Path.Combine(dir.FullName, safeName);
                var modPackDir = _fileSystem.DirectoryInfo.FromDirectoryName(modPackPath);

                if (!modPackDir.Exists)
                {
                    return null;
                }
                if (modPackDir.Parent.FullName != dir.FullName)
                {
                    return null;
                }

                return modPackDir;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, nameof(GetModPackDirectoryInfo));
                return null;
            }
        }

        public Result CreateModPack(string name)
        {
            try
            {
                var dir = new DirectoryInfo(_factorioServerDataService.ModsDirectoryPath);

                if (!dir.Exists)
                {
                    dir.Create();
                }

                if (string.IsNullOrWhiteSpace(name))
                {
                    return Result.Failure(new Error(Constants.InvalidFileNameErrorKey, name ?? ""));
                }
                if (name.Contains(" "))
                {
                    return Result.Failure(new Error(Constants.InvalidFileNameErrorKey, $"Name {name} cannot contain spaces."));
                }

                string safeName = Path.GetFileName(name);
                string modPackPath = Path.Combine(dir.FullName, safeName);
                var modPackDir = new DirectoryInfo(modPackPath);

                if (modPackDir.Exists)
                {
                    return Result.Failure(new Error(Constants.FileAlreadyExistsErrorKey, $"Mod pack {name} already exists."));
                }
                if (modPackDir.Parent.FullName != dir.FullName)
                {
                    return Result.Failure(new Error(Constants.FileErrorKey, $"Error creating mod pack with name {name}."));
                }

                modPackDir = Directory.CreateDirectory(modPackPath);

                var modPack = new ModPackMetaData()
                {
                    Name = modPackDir.Name,
                    CreatedTime = modPackDir.CreationTimeUtc,
                    LastModifiedTime = modPackDir.LastWriteTimeUtc
                };

                var ev = CollectionChangedData.Add(new[] { modPack });
                Task.Run(() => ModPackChanged?.Invoke(this, ev));

                return Result.OK;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, nameof(CreateModPack));
                return Result.Failure(new Error(Constants.FileErrorKey, $"Error creating mod pack with name {name}."));
            }
        }

        public Result DeleteModPack(string name)
        {
            try
            {
                var dir = new DirectoryInfo(_factorioServerDataService.ModsDirectoryPath);

                if (!dir.Exists)
                {
                    dir.Create();
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {name} does not exist.");
                }

                string safeName = Path.GetFileName(name);
                string modPackPath = Path.Combine(dir.FullName, safeName);
                var modPackDir = new DirectoryInfo(modPackPath);

                if (!modPackDir.Exists)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {name} does not exist.");
                }
                if (modPackDir.Parent.FullName != dir.FullName)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {name} does not exist.");
                }

                var modPack = new ModPackMetaData()
                {
                    Name = modPackDir.Name,
                    CreatedTime = modPackDir.CreationTimeUtc,
                    LastModifiedTime = modPackDir.LastWriteTimeUtc
                };

                modPackDir.Delete(true);

                var ev = CollectionChangedData.Remove(new[] { modPack });
                Task.Run(() => ModPackChanged?.Invoke(this, ev));

                return Result.OK;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, nameof(DeleteModPack));
                return Result.Failure(Constants.FileErrorKey, $"Error deleting mod pack {name}.");
            }
        }

        public Result RenameModPack(string name, string newName)
        {
            try
            {
                var dir = new DirectoryInfo(_factorioServerDataService.ModsDirectoryPath);

                if (!dir.Exists)
                {
                    dir.Create();
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {name} does not exist.");
                }

                string safeName = Path.GetFileName(name);
                string modPackPath = Path.Combine(dir.FullName, safeName);
                var modPackDir = new DirectoryInfo(modPackPath);

                if (!modPackDir.Exists)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {name} does not exist.");
                }
                if (modPackDir.Parent.FullName != dir.FullName)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {name} does not exist.");
                }

                if (string.IsNullOrWhiteSpace(newName))
                {
                    return Result.Failure(new Error(Constants.InvalidFileNameErrorKey, newName ?? ""));
                }
                if (newName.Contains(" "))
                {
                    return Result.Failure(new Error(Constants.InvalidFileNameErrorKey, $"Name {newName} cannot contain spaces."));
                }

                string safeNewName = Path.GetFileName(newName);
                string modPackNewPath = Path.Combine(dir.FullName, safeNewName);
                var modPackNewDir = new DirectoryInfo(modPackNewPath);

                if (modPackNewDir.Exists)
                {
                    return Result.Failure(new Error(Constants.FileAlreadyExistsErrorKey, $"Mod pack {newName} already exists."));
                }
                if (modPackNewDir.Parent.FullName != dir.FullName)
                {
                    return Result.Failure(new Error(Constants.FileErrorKey, $"Error renaming mod pack from {name} to {newName}."));
                }

                var oldModPack = new ModPackMetaData()
                {
                    Name = modPackDir.Name,
                    CreatedTime = modPackDir.CreationTimeUtc,
                    LastModifiedTime = modPackDir.LastWriteTimeUtc
                };

                modPackDir.MoveTo(modPackNewPath);
                modPackNewDir.Refresh();

                var newModpack = new ModPackMetaData()
                {
                    Name = modPackNewDir.Name,
                    CreatedTime = modPackNewDir.CreationTimeUtc,
                    LastModifiedTime = modPackNewDir.LastWriteTimeUtc
                };

                var ev = CollectionChangedData.AddAndRemove(new[] { newModpack }, new[] { oldModPack });
                Task.Run(() => ModPackChanged?.Invoke(this, ev));

                return Result.OK;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, nameof(RenameModPack));
                return Result.Failure(Constants.FileErrorKey, $"Error deleting mod pack {name}.");
            }
        }

        public ModPackFileMetaData[] GetModPackFiles(string name)
        {
            try
            {
                var dir = new DirectoryInfo(_factorioServerDataService.ModsDirectoryPath);

                if (!dir.Exists)
                {
                    dir.Create();
                    return Array.Empty<ModPackFileMetaData>();
                }

                string safeName = Path.GetFileName(name);
                string modPackPath = Path.Combine(dir.FullName, safeName);
                var modPackDir = new DirectoryInfo(modPackPath);

                if (!modPackDir.Exists)
                {
                    return Array.Empty<ModPackFileMetaData>();
                }
                if (modPackDir.Parent.FullName != dir.FullName)
                {
                    return Array.Empty<ModPackFileMetaData>();
                }

                return modPackDir.GetFiles()
                        .Select(x => new ModPackFileMetaData()
                        {
                            Name = x.Name,
                            CreatedTime = x.CreationTimeUtc,
                            LastModifiedTime = x.LastWriteTimeUtc,
                            Size = x.Length
                        })
                        .ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, nameof(GetModPackFiles));
                return Array.Empty<ModPackFileMetaData>();
            }
        }

        public Result DeleteModPackFiles(string modPack, string[] files)
        {
            var changedFiles = new List<ModPackFileMetaData>();

            try
            {
                var dir = new DirectoryInfo(_factorioServerDataService.ModsDirectoryPath);

                if (!dir.Exists)
                {
                    dir.Create();
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {modPack} does not exist.");
                }

                string safeModPackName = Path.GetFileName(modPack);
                string modPackPath = Path.Combine(dir.FullName, safeModPackName);
                var modPackDir = new DirectoryInfo(modPackPath);

                if (!modPackDir.Exists)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {modPack} does not exist.");
                }
                if (modPackDir.Parent.FullName != dir.FullName)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {modPack} does not exist.");
                }

                var errors = new List<Error>();

                foreach (var file in files)
                {
                    if (string.IsNullOrWhiteSpace(file))
                    {
                        errors.Add(new Error(Constants.InvalidFileNameErrorKey, file ?? ""));
                        continue;
                    }

                    string safeName = Path.GetFileName(file);
                    string filePath = Path.Combine(modPackDir.FullName, safeName);
                    var fileInfo = new FileInfo(filePath);

                    if (!fileInfo.Exists)
                    {
                        errors.Add(new Error(Constants.MissingFileErrorKey, file));
                        continue;
                    }
                    if (fileInfo.Directory.FullName != modPackDir.FullName)
                    {
                        errors.Add(new Error(Constants.MissingFileErrorKey, file));
                        continue;
                    }

                    var fileMetaData = new ModPackFileMetaData()
                    {
                        Name = fileInfo.Name,
                        CreatedTime = fileInfo.CreationTimeUtc,
                        LastModifiedTime = fileInfo.LastWriteTimeUtc,
                        Size = fileInfo.Length
                    };

                    fileInfo.Delete();

                    changedFiles.Add(fileMetaData);
                }

                if (changedFiles.Count > 0)
                {
                    modPackDir.Refresh();
                    var data = new ModPackMetaData()
                    {
                        Name = modPack,
                        CreatedTime = modPackDir.CreationTimeUtc,
                        LastModifiedTime = modPackDir.LastWriteTimeUtc
                    };

                    var packEventArgs = CollectionChangedData.Add(new[] { data });
                    var filesChangedData = CollectionChangedData.Remove(changedFiles);
                    var filesEventArgs = new ModPackFilesChangedEventArgs(modPack, filesChangedData);

                    Task.Run(() =>
                    {
                        ModPackChanged?.Invoke(this, packEventArgs);
                        ModPackFilesChanged?.Invoke(this, filesEventArgs);
                    });
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
            catch (Exception ex)
            {
                _logger.LogError(ex, nameof(DeleteModPackFiles));
                return Result.Failure(Constants.FileErrorKey, $"Error deleting mod pack files.");
            }
        }

        public async Task<Result> UploadFiles(string modPack, IList<IFormFile> files)
        {
            var changedFiles = new List<ModPackFileMetaData>();

            try
            {
                var dir = new DirectoryInfo(_factorioServerDataService.ModsDirectoryPath);

                if (!dir.Exists)
                {
                    dir.Create();
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {modPack} does not exist.");
                }

                string safeModPackName = Path.GetFileName(modPack);
                string modPackPath = Path.Combine(dir.FullName, safeModPackName);
                var modPackDir = new DirectoryInfo(modPackPath);

                if (!modPackDir.Exists)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {modPack} does not exist.");
                }
                if (modPackDir.Parent.FullName != dir.FullName)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {modPack} does not exist.");
                }

                var errors = new List<Error>();

                foreach (var file in files)
                {
                    string fileName = file.FileName;
                    if (string.IsNullOrWhiteSpace(fileName))
                    {
                        errors.Add(new Error(Constants.InvalidFileNameErrorKey, fileName ?? ""));
                        continue;
                    }

                    fileName = fileName.Trim();

                    string safeName = Path.GetFileName(fileName);
                    string filePath = Path.Combine(modPackDir.FullName, safeName);
                    var fileInfo = new FileInfo(filePath);

                    if (fileInfo.Exists)
                    {
                        errors.Add(new Error(Constants.FileAlreadyExistsErrorKey, fileName));
                        continue;
                    }
                    if (fileInfo.Directory.FullName != modPackDir.FullName)
                    {
                        errors.Add(new Error(Constants.InvalidFileNameErrorKey, fileName));
                        continue;
                    }

                    using (var writeStream = fileInfo.OpenWrite())
                    using (var readStream = file.OpenReadStream())
                    {
                        await readStream.CopyToAsync(writeStream);
                        await writeStream.FlushAsync();
                    }

                    fileInfo.Refresh();

                    var fileMetaData = new ModPackFileMetaData()
                    {
                        Name = fileInfo.Name,
                        CreatedTime = fileInfo.CreationTimeUtc,
                        LastModifiedTime = fileInfo.LastWriteTimeUtc,
                        Size = fileInfo.Length
                    };

                    changedFiles.Add(fileMetaData);
                }

                if (changedFiles.Count > 0)
                {
                    modPackDir.Refresh();
                    var data = new ModPackMetaData()
                    {
                        Name = modPack,
                        CreatedTime = modPackDir.CreationTimeUtc,
                        LastModifiedTime = modPackDir.LastWriteTimeUtc
                    };

                    var packEventArgs = CollectionChangedData.Add(new[] { data });
                    var filesChangedData = CollectionChangedData.Add(changedFiles);
                    var filesEventArgs = new ModPackFilesChangedEventArgs(modPack, filesChangedData);

                    _ = Task.Run(() =>
                    {
                        ModPackChanged?.Invoke(this, packEventArgs);
                        ModPackFilesChanged?.Invoke(this, filesEventArgs);
                    });
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
            catch (Exception ex)
            {
                _logger.LogError(ex, nameof(UploadFiles));
                return Result.Failure(Constants.FileErrorKey, $"Error uploading mod pack files.");
            }
        }

        public FileInfo? GetModPackFile(string modPack, string fileName)
        {
            try
            {
                var dir = new DirectoryInfo(_factorioServerDataService.ModsDirectoryPath);

                if (!dir.Exists)
                {
                    dir.Create();
                    return null;
                }

                string safeModPackName = Path.GetFileName(modPack);
                string modPackPath = Path.Combine(dir.FullName, safeModPackName);
                var modPackDir = new DirectoryInfo(modPackPath);

                if (!modPackDir.Exists)
                {
                    return null;
                }
                if (modPackDir.Parent.FullName != dir.FullName)
                {
                    return null;
                }

                if (string.IsNullOrWhiteSpace(fileName))
                {
                    return null;
                }

                string safeName = Path.GetFileName(fileName);
                string filePath = Path.Combine(modPackDir.FullName, safeName);
                var fileInfo = new FileInfo(filePath);

                if (!fileInfo.Exists)
                {
                    return null;
                }
                if (fileInfo.Directory.FullName != modPackDir.FullName)
                {
                    return null;
                }

                return fileInfo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, nameof(GetModPackFile));
                return null;
            }
        }

        public Result CopyModPackFiles(string sourceModPack, string targetModPack, string[] files)
        {
            if (sourceModPack == targetModPack)
            {
                return Result.Failure(Constants.FileAlreadyExistsErrorKey, "Cannot copy files to the same mod pack.");
            }

            try
            {
                var dir = new DirectoryInfo(_factorioServerDataService.ModsDirectoryPath);

                if (!dir.Exists)
                {
                    dir.Create();
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {sourceModPack} does not exist.");
                }

                string safeSoureModPackName = Path.GetFileName(sourceModPack);
                string sourceModPackPath = Path.Combine(dir.FullName, safeSoureModPackName);
                var sourceModPackDir = new DirectoryInfo(sourceModPackPath);

                if (!sourceModPackDir.Exists)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {sourceModPack} does not exist.");
                }
                if (sourceModPackDir.Parent.FullName != dir.FullName)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {sourceModPack} does not exist.");
                }

                string safeTargetModPackName = Path.GetFileName(targetModPack);
                string targetModPackPath = Path.Combine(dir.FullName, safeTargetModPackName);
                var targetModPackDir = new DirectoryInfo(targetModPackPath);

                if (!sourceModPackDir.Exists)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {targetModPack} does not exist.");
                }
                if (sourceModPackDir.Parent.FullName != dir.FullName)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {targetModPack} does not exist.");
                }

                var errors = new List<Error>();
                var changedFiles = new List<ModPackFileMetaData>();

                foreach (var file in files)
                {
                    if (string.IsNullOrWhiteSpace(file))
                    {
                        errors.Add(new Error(Constants.InvalidFileNameErrorKey, file ?? ""));
                        continue;
                    }

                    string safeSourceName = Path.GetFileName(file);
                    string sourceFilePath = Path.Combine(sourceModPackDir.FullName, safeSourceName);
                    var sourceFileInfo = new FileInfo(sourceFilePath);

                    if (!sourceFileInfo.Exists)
                    {
                        errors.Add(new Error(Constants.MissingFileErrorKey, file));
                        continue;
                    }
                    if (sourceFileInfo.Directory.FullName != sourceModPackDir.FullName)
                    {
                        errors.Add(new Error(Constants.MissingFileErrorKey, file));
                        continue;
                    }

                    string safeTargetName = Path.GetFileName(file);
                    string targetFilePath = Path.Combine(targetModPackDir.FullName, safeTargetName);
                    var targetFileInfo = new FileInfo(targetFilePath);

                    if (targetFileInfo.Exists)
                    {
                        errors.Add(new Error(Constants.FileAlreadyExistsErrorKey, file));
                        continue;
                    }
                    if (targetFileInfo.Directory.FullName != targetModPackDir.FullName)
                    {
                        errors.Add(new Error(Constants.FileErrorKey, file));
                        continue;
                    }

                    sourceFileInfo.CopyTo(targetFilePath);
                    targetFileInfo.Refresh();

                    var fileMetaData = new ModPackFileMetaData()
                    {
                        Name = targetFileInfo.Name,
                        CreatedTime = targetFileInfo.CreationTimeUtc,
                        LastModifiedTime = targetFileInfo.LastWriteTimeUtc,
                        Size = targetFileInfo.Length
                    };

                    changedFiles.Add(fileMetaData);
                }

                if (changedFiles.Count > 0)
                {
                    targetModPackDir.Refresh();
                    var data = new ModPackMetaData()
                    {
                        Name = targetModPack,
                        CreatedTime = targetModPackDir.CreationTimeUtc,
                        LastModifiedTime = targetModPackDir.LastWriteTimeUtc
                    };

                    var packEventArgs = CollectionChangedData.Add(new[] { data });
                    var filesChangedData = CollectionChangedData.Add(changedFiles);
                    var filesEventArgs = new ModPackFilesChangedEventArgs(targetModPack, filesChangedData);

                    Task.Run(() =>
                    {
                        ModPackChanged?.Invoke(this, packEventArgs);
                        ModPackFilesChanged?.Invoke(this, filesEventArgs);
                    });
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
            catch (Exception ex)
            {
                _logger.LogError(ex, nameof(CopyModPackFiles));
                return Result.Failure(Constants.FileErrorKey, $"Error copying mod pack files.");
            }
        }

        public Result MoveModPackFiles(string sourceModPack, string targetModPack, string[] files)
        {
            if (sourceModPack == targetModPack)
            {
                return Result.Failure(Constants.FileAlreadyExistsErrorKey, "Cannot move files to the same mod pack.");
            }

            try
            {
                var dir = new DirectoryInfo(_factorioServerDataService.ModsDirectoryPath);

                if (!dir.Exists)
                {
                    dir.Create();
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {sourceModPack} does not exist.");
                }

                string safeSoureModPackName = Path.GetFileName(sourceModPack);
                string sourceModPackPath = Path.Combine(dir.FullName, safeSoureModPackName);
                var sourceModPackDir = new DirectoryInfo(sourceModPackPath);

                if (!sourceModPackDir.Exists)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {sourceModPack} does not exist.");
                }
                if (sourceModPackDir.Parent.FullName != dir.FullName)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {sourceModPack} does not exist.");
                }

                string safeTargetModPackName = Path.GetFileName(targetModPack);
                string targetModPackPath = Path.Combine(dir.FullName, safeTargetModPackName);
                var targetModPackDir = new DirectoryInfo(targetModPackPath);

                if (!sourceModPackDir.Exists)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {targetModPack} does not exist.");
                }
                if (sourceModPackDir.Parent.FullName != dir.FullName)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"Mod pack {targetModPack} does not exist.");
                }

                var errors = new List<Error>();
                var oldFiles = new List<ModPackFileMetaData>();
                var newFiles = new List<ModPackFileMetaData>();

                foreach (var file in files)
                {
                    if (string.IsNullOrWhiteSpace(file))
                    {
                        errors.Add(new Error(Constants.InvalidFileNameErrorKey, file ?? ""));
                        continue;
                    }

                    string safeSourceName = Path.GetFileName(file);
                    string sourceFilePath = Path.Combine(sourceModPackDir.FullName, safeSourceName);
                    var sourceFileInfo = new FileInfo(sourceFilePath);

                    if (!sourceFileInfo.Exists)
                    {
                        errors.Add(new Error(Constants.MissingFileErrorKey, file));
                        continue;
                    }
                    if (sourceFileInfo.Directory.FullName != sourceModPackDir.FullName)
                    {
                        errors.Add(new Error(Constants.MissingFileErrorKey, file));
                        continue;
                    }

                    string safeTargetName = Path.GetFileName(file);
                    string targetFilePath = Path.Combine(targetModPackDir.FullName, safeTargetName);
                    var targetFileInfo = new FileInfo(targetFilePath);

                    if (targetFileInfo.Exists)
                    {
                        errors.Add(new Error(Constants.FileAlreadyExistsErrorKey, file));
                        continue;
                    }
                    if (targetFileInfo.Directory.FullName != targetModPackDir.FullName)
                    {
                        errors.Add(new Error(Constants.FileErrorKey, file));
                        continue;
                    }

                    var oldFileMetaData = new ModPackFileMetaData()
                    {
                        Name = sourceFileInfo.Name,
                        CreatedTime = sourceFileInfo.CreationTimeUtc,
                        LastModifiedTime = sourceFileInfo.LastAccessTimeUtc,
                        Size = sourceFileInfo.Length
                    };

                    sourceFileInfo.MoveTo(targetFilePath);
                    targetFileInfo.Refresh();

                    var newFileMetaData = new ModPackFileMetaData()
                    {
                        Name = targetFileInfo.Name,
                        CreatedTime = targetFileInfo.CreationTimeUtc,
                        LastModifiedTime = targetFileInfo.LastWriteTimeUtc,
                        Size = targetFileInfo.Length
                    };

                    oldFiles.Add(oldFileMetaData);
                    newFiles.Add(newFileMetaData);
                }

                if (newFiles.Count > 0)
                {
                    sourceModPackDir.Refresh();
                    var oldPackData = new ModPackMetaData()
                    {
                        Name = sourceModPack,
                        CreatedTime = sourceModPackDir.CreationTimeUtc,
                        LastModifiedTime = sourceModPackDir.LastWriteTimeUtc
                    };

                    targetModPackDir.Refresh();
                    var newPackData = new ModPackMetaData()
                    {
                        Name = targetModPack,
                        CreatedTime = targetModPackDir.CreationTimeUtc,
                        LastModifiedTime = targetModPackDir.LastWriteTimeUtc
                    };

                    var oldPackEventArgs = CollectionChangedData.Add(new[] { oldPackData });
                    var newPackEventArgs = CollectionChangedData.Add(new[] { newPackData });
                    var oldFilesChangedData = CollectionChangedData.Remove(oldFiles);
                    var newFilesChangedData = CollectionChangedData.Remove(newFiles);
                    var oldFilesEventArgs = new ModPackFilesChangedEventArgs(sourceModPack, oldFilesChangedData);
                    var newFilesEventArgs = new ModPackFilesChangedEventArgs(targetModPack, newFilesChangedData);

                    Task.Run(() =>
                    {
                        ModPackChanged?.Invoke(this, oldPackEventArgs);
                        ModPackFilesChanged?.Invoke(this, oldFilesEventArgs);
                        ModPackChanged?.Invoke(this, newPackEventArgs);
                        ModPackFilesChanged?.Invoke(this, newFilesEventArgs);
                    });
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
            catch (Exception ex)
            {
                _logger.LogError(ex, nameof(MoveModPackFiles));
                return Result.Failure(Constants.FileErrorKey, $"Error moving mod pack files.");
            }
        }

        public async Task<Result> DownloadFromModPortal(string modPack, IReadOnlyList<string> fileNames)
        {
            var modPackDirResult = TryGetModPackDirectoryInfo(modPack);
            if (!modPackDirResult.Success)
            {
                return modPackDirResult;
            }

            var modPackDir = modPackDirResult.Value!;

            var downloadResult = await _modPortalService.GetDownloadUrls(fileNames);
            if (!downloadResult.Success)
            {
                return downloadResult;
            }

            IReadOnlyList<GetModDownloadResult> downloadInfos = downloadResult.Value!;
            var errors = new List<Error>();

            foreach (var downloadInfo in downloadInfos)
            {
                if (downloadInfo.Status != GetModDownloadResultStatus.Success)
                {
                    errors.Add(GetDownloadUrlError(downloadInfo.Status, downloadInfo.FileName));
                    continue;
                }

                var targetFileInfo = new FileInfo(Path.Combine(modPackDir.FullName, downloadInfo.FileName));
                if (targetFileInfo.Exists)
                {
                    errors.Add(new Error(Constants.FileAlreadyExistsErrorKey, $"File {downloadInfo.FileName} already exists."));
                    continue;
                }

                var downloadStream = await _modPortalService.DownloadMod(downloadInfo.DownloadUrl!);
                if (downloadStream == null)
                {
                    errors.Add(new Error(Constants.InvalidHttpResponseErrorKey, $"Failed to download {downloadInfo.FileName}"));
                    continue;
                }

                using (downloadStream)
                using (var writeStream = targetFileInfo.OpenWrite())
                {
                    await downloadStream.CopyToAsync(writeStream);
                    await writeStream.FlushAsync();
                }

                RaiseModPackFileChanged(modPack, modPackDir, targetFileInfo);
            }

            if (errors.Count != 0)
            {
                return Result.Failure(errors);
            }

            return Result.OK;
        }

        private void RaiseModPackFileChanged(string modPack, DirectoryInfo modPackDirectory, FileInfo fileInfo)
        {
            void Raise()
            {
                modPackDirectory.Refresh();
                var data = new ModPackMetaData()
                {
                    Name = modPack,
                    CreatedTime = modPackDirectory.CreationTimeUtc,
                    LastModifiedTime = modPackDirectory.LastWriteTimeUtc
                };

                fileInfo.Refresh();
                var fileMetaData = new ModPackFileMetaData()
                {
                    Name = fileInfo.Name,
                    CreatedTime = fileInfo.CreationTimeUtc,
                    LastModifiedTime = fileInfo.LastWriteTimeUtc,
                    Size = fileInfo.Length
                };

                var packEventArgs = CollectionChangedData.Add(new[] { data });
                var filesChangedData = CollectionChangedData.Add(new[] { fileMetaData });
                var filesEventArgs = new ModPackFilesChangedEventArgs(modPack, filesChangedData);

                ModPackChanged?.Invoke(this, packEventArgs);
                ModPackFilesChanged?.Invoke(this, filesEventArgs);
            }

            _ = Task.Run(Raise);
        }

        private Result<DirectoryInfo> TryGetModPackDirectoryInfo(string modPack)
        {
            var dir = new DirectoryInfo(_factorioServerDataService.ModsDirectoryPath);

            if (!dir.Exists)
            {
                dir.Create();
                return Result<DirectoryInfo>.Failure(Constants.MissingFileErrorKey, $"Mod pack {modPack} does not exist.");
            }

            string safeModPackName = Path.GetFileName(modPack);
            string modPackPath = Path.Combine(dir.FullName, safeModPackName);
            var modPackDir = new DirectoryInfo(modPackPath);

            if (!modPackDir.Exists)
            {
                return Result<DirectoryInfo>.Failure(Constants.MissingFileErrorKey, $"Mod pack {modPack} does not exist.");
            }
            if (modPackDir.Parent.FullName != dir.FullName)
            {
                return Result<DirectoryInfo>.Failure(Constants.MissingFileErrorKey, $"Mod pack {modPack} does not exist.");
            }

            return Result<DirectoryInfo>.OK(modPackDir);
        }

        private static Error GetDownloadUrlError(GetModDownloadResultStatus status, string fileName)
        {
            switch (status)
            {
                case GetModDownloadResultStatus.InvalidModName:
                    return new Error(Constants.InvalidModNameKeyErrorKey, $"File Name: {fileName} is an invalid mod name.");
                case GetModDownloadResultStatus.InvalidHttpResponse:
                    return new Error(Constants.InvalidHttpResponseErrorKey, $"Unsuccessful http code - File Name: {fileName}");
                case GetModDownloadResultStatus.InvalidReleaseData:
                    return new Error(Constants.InvalidReleaseDataErrorKey, $"File Name: {fileName} returned invalid releases data.");
                case GetModDownloadResultStatus.MissingMod:
                    return new Error(Constants.MissingModErrorKey, $"File Name: {fileName} mod name was not found on the mod portal.");
                case GetModDownloadResultStatus.MissingVersion:
                    return new Error(Constants.MissingVersionErrorKey, $"File Name: {fileName} version was not found on the mod portal.");
                default:
                    throw new ArgumentException(nameof(status));
            }
        }
    }
}

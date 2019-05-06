using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Models
{
    public class FactorioModManager
    {
        private readonly ILogger<FactorioModManager> _logger;

        public FactorioModManager(ILogger<FactorioModManager> logger)
        {
            _logger = logger;
        }

        public ModPackMetaData[] GetModPacks()
        {
            try
            {
                var dir = new DirectoryInfo(FactorioServerData.ModsDirectoryPath);

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
                        LastModifiedTime = x.LastAccessTimeUtc
                    })
                    .ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, nameof(GetModPacks));
                return Array.Empty<ModPackMetaData>();
            }
        }

        public Result CreateModPack(string name)
        {
            try
            {
                var dir = new DirectoryInfo(FactorioServerData.ModsDirectoryPath);

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

                Directory.CreateDirectory(modPackPath);
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
                var dir = new DirectoryInfo(FactorioServerData.ModsDirectoryPath);

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

                modPackDir.Delete(true);
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
                var dir = new DirectoryInfo(FactorioServerData.ModsDirectoryPath);

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

                modPackDir.MoveTo(modPackNewPath);
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
                var dir = new DirectoryInfo(FactorioServerData.ModsDirectoryPath);

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
                            LastModifiedTime = x.LastAccessTimeUtc,
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
            try
            {
                var dir = new DirectoryInfo(FactorioServerData.ModsDirectoryPath);

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
                    if (string.IsNullOrWhiteSpace(file) || file.Contains(" "))
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

                    fileInfo.Delete();
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
            var dir = new DirectoryInfo(FactorioServerData.ModsDirectoryPath);

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
                if (string.IsNullOrWhiteSpace(fileName) || fileName.Contains(" "))
                {
                    errors.Add(new Error(Constants.InvalidFileNameErrorKey, fileName ?? ""));
                    continue;
                }

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

        public FileInfo GetModPackFile(string modPack, string fileName)
        {
            try
            {
                var dir = new DirectoryInfo(FactorioServerData.ModsDirectoryPath);

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

                if (string.IsNullOrWhiteSpace(fileName) || fileName.Contains(" "))
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
    }
}

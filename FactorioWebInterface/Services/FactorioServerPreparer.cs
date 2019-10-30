using FactorioWebInterface.Data;
using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Shared;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services
{
    public interface IFactorioServerPreparer
    {
        Result CanResume(string tempSavesDirectoryPath);
        Task<Result<ProcessStartInfo>> PrepareResume(FactorioServerMutableData mutableData);
        Result CanLoadSave(string serverId, string directoryName, string fileName);
        Task<Result<ProcessStartInfo>> PrepareLoadSave(FactorioServerMutableData mutableData, string directoryName, string fileName);
        Result CanStartScenario(string scenarioName);
        Task<Result<ProcessStartInfo>> PrepareStartScenario(FactorioServerMutableData mutableData, string scenarioName);
    }

    public class FactorioServerPreparer : IFactorioServerPreparer
    {
        private readonly IFactorioServerDataService _factorioServerDataService;
        private readonly IFactorioAdminService _factorioAdminService;
        private readonly IFactorioModManager _factorioModManager;
        private readonly IFactorioBanService _factorioBanService;
        private readonly IHubContext<FactorioControlHub, IFactorioControlClientMethods> _factorioControlHub;
        private readonly IFactorioFileManager _factorioFileManager;
        private readonly ILogger<FactorioServerPreparer> _logger;

        public FactorioServerPreparer
        (
            IFactorioServerDataService factorioServerDataService,
            IFactorioAdminService factorioAdminService,
            IFactorioModManager factorioModManager,
            IFactorioBanService factorioBanService,
            IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub,
            IFactorioFileManager factorioFileManager,
            ILogger<FactorioServerPreparer> logger
        )
        {
            _factorioServerDataService = factorioServerDataService;
            _factorioAdminService = factorioAdminService;
            _factorioModManager = factorioModManager;
            _factorioBanService = factorioBanService;
            _factorioControlHub = factorioControlHub;
            _factorioFileManager = factorioFileManager;
            _logger = logger;
        }

        public Result CanResume(string tempSavesDirectoryPath)
        {
            if (!_factorioFileManager.HasTempSaveFiles(tempSavesDirectoryPath))
            {
                return Result<ProcessStartInfo>.Failure(Constants.MissingFileErrorKey, "No file to resume server from.");
            }

            return Result.OK;
        }

        public async Task<Result<ProcessStartInfo>> PrepareResume(FactorioServerMutableData mutableData)
        {
            var result = CanResume(mutableData.TempSavesDirectoryPath);
            if (!result.Success)
            {
                return Result<ProcessStartInfo>.FromResult(result);
            }

            return await PrepareWithStatusChange(mutableData, () =>
            {
                _factorioFileManager.EnsureScenarioDirectoryRemoved(mutableData.LocalScenarioDirectoryPath);

                return PrepareServerCommon(mutableData, Constants.FactorioLoadLatestSaveFlag);
            });
        }

        public Result CanLoadSave(string serverId, string directoryName, string fileName)
        {
            var saveFile = _factorioFileManager.GetSaveFile(serverId, directoryName, fileName);
            if (saveFile == null)
            {
                return Result.Failure(Constants.MissingFileErrorKey, $"File {Path.Combine(directoryName, fileName)} not found.");
            }

            return Result.OK;
        }

        public async Task<Result<ProcessStartInfo>> PrepareLoadSave(FactorioServerMutableData mutableData, string directoryName, string fileName)
        {
            var saveFile = _factorioFileManager.GetSaveFile(mutableData.ServerId, directoryName, fileName);
            if (saveFile == null)
            {
                return Result<ProcessStartInfo>.Failure(Constants.MissingFileErrorKey, $"File {Path.Combine(directoryName, fileName)} not found.");
            }

            Result<string> CopySaveFile()
            {
                switch (saveFile!.Directory.Name)
                {
                    case Constants.GlobalSavesDirectoryName:
                    case Constants.LocalSavesDirectoryName:
                        FactorioServerUtils.SendOutputMessage(mutableData, _factorioControlHub, $"Copying save file {saveFile.Directory.Name}/{saveFile.Name} into Temp Saves.");

                        string copyToPath = Path.Combine(mutableData.TempSavesDirectoryPath, saveFile.Name);
                        var fi = saveFile.CopyTo(copyToPath, true);

                        fi.LastWriteTimeUtc = DateTime.UtcNow;

                        var data = new FileMetaData()
                        {
                            Name = fi.Name,
                            CreatedTime = fi.CreationTimeUtc,
                            LastModifiedTime = fi.LastWriteTimeUtc,
                            Size = fi.Length,
                            Directory = Constants.TempSavesDirectoryName
                        };
                        var changeData = CollectionChangedData.Add(new[] { data });
                        var ev = new FilesChangedEventArgs(mutableData.ServerId, changeData);

                        _factorioFileManager.RaiseTempFilesChanged(ev);

                        return Result<string>.OK(copyToPath);
                    case Constants.TempSavesDirectoryName:
                        return Result<string>.OK(saveFile.Name);
                    default:
                        return Result<string>.Failure(Constants.InvalidDirectoryErrorKey, $"Directory name: {directoryName}, File name: {fileName}");
                }
            }

            return await PrepareWithStatusChange(mutableData, () =>
            {
                var copySaveResult = CopySaveFile();
                if (!copySaveResult.Success)
                {
                    return Task.FromResult(Result<ProcessStartInfo>.Failure(copySaveResult.Errors));
                }

                _factorioFileManager.EnsureScenarioDirectoryRemoved(mutableData.LocalScenarioDirectoryPath);

                return PrepareServerCommon(mutableData, $"{Constants.FactorioLoadSaveFlag} {copySaveResult.Value}");
            });
        }

        public Result CanStartScenario(string scenarioName)
        {
            if (!_factorioFileManager.ScenarioExists(scenarioName))
            {
                return Result<ProcessStartInfo>.Failure(Constants.MissingDirectoryErrorKey, $"Scenario {scenarioName} not found.");
            }

            return Result.OK;
        }

        public async Task<Result<ProcessStartInfo>> PrepareStartScenario(FactorioServerMutableData mutableData, string scenarioName)
        {
            var result = CanStartScenario(scenarioName);
            if (!result.Success)
            {
                return Result<ProcessStartInfo>.FromResult(result);
            }

            return await PrepareWithStatusChange(mutableData, () =>
            {
                _factorioFileManager.EnsureScenarioDirectoryCreated(mutableData.LocalScenarioDirectoryPath);

                return PrepareServerCommon(mutableData, $"{Constants.FactorioStartScenarioFlag} {scenarioName}");
            });
        }

        internal async Task<Result> BuildBanList(FactorioServerMutableData mutableData)
        {
            if (!mutableData.ServerExtraSettings.BuildBansFromDatabaseOnStart)
            {
                // If we don't want the database bans, the assumption is we should leave the
                // server banlist alone with whatever bans are in there.
                return Result.OK;
            }

            _ = FactorioServerUtils.SendOutputMessage(mutableData, _factorioControlHub, "Building Ban list.");

            var result = await _factorioBanService.BuildBanList(mutableData.ServerBanListPath);

            if (!result.Success)
            {
                _ = FactorioServerUtils.SendErrorMessage(mutableData, _factorioControlHub, $"Error building Ban list: {result}");
            }

            return result;
        }

        internal async Task<Result> BuildAdminList(FactorioServerMutableData mutableData)
        {
            var settings = mutableData.ServerSettings;

            if (!(settings?.UseDefaultAdmins ?? true))
            {
                // If we are not using the default admins, we use whatever admins are already in the admin list.
                return Result.OK;
            }

            _ = FactorioServerUtils.SendOutputMessage(mutableData, _factorioControlHub, "Building Admin list.");

            var result = await _factorioAdminService.BuildAdminList(mutableData);

            if (!result.Success)
            {
                _ = FactorioServerUtils.SendErrorMessage(mutableData, _factorioControlHub, $"Error building Admin list: {result}");
            }

            return result;
        }

        internal async Task<Result> RotateLogs(FactorioServerMutableData mutableData)
        {
            _ = FactorioServerUtils.SendOutputMessage(mutableData, _factorioControlHub, "Rotating logs.");

            var result = await Task.Run(() => Result.Combine
            (
                _factorioFileManager.RotateFactorioLogs(mutableData),
                _factorioFileManager.RotateChatLogs(mutableData)
            ));

            if (!result.Success)
            {
                _ = FactorioServerUtils.SendErrorMessage(mutableData, _factorioControlHub, $"Error rotating logs: {result}");
            }

            return result;
        }

        internal ProcessStartInfo MakeStartInfo(FactorioServerMutableData mutableData, string startTypeArguments)
        {
            string modDirPath = PrepareModDirectory(mutableData);
            string modDirPathArg = string.IsNullOrWhiteSpace(modDirPath) ? "" : $"--mod-directory {modDirPath}";
            // The order of these arguments matters. The wrapper expects serverId first and executablePath second.
            string arguments = $"{_factorioServerDataService.FactorioWrapperPath} {mutableData.ServerId} {mutableData.ExecutablePath} {startTypeArguments} --server-settings {mutableData.ServerSettingsPath} --port {mutableData.Port} {modDirPathArg}";

            return new ProcessStartInfo() { FileName = Constants.DotNetPath, Arguments = arguments };
        }

        private void ResetData(FactorioServerMutableData mutableData)
        {
            mutableData.TrackingDataSets.Clear();

            mutableData.OnlinePlayers.Clear();
            mutableData.OnlinePlayerCount = 0;

            mutableData.StopCallback = null;
            mutableData.LastTempFilesChecked = DateTime.UtcNow;
        }

        private string PrepareModDirectory(FactorioServerMutableData mutableData)
        {
            var dir = _factorioModManager.GetModPackDirectoryInfo(mutableData.ModPack);
            if (dir == null)
            {
                mutableData.ModPack = "";
                return "";
            }
            else
            {
                return dir.FullName;
            }
        }

        private async Task<Result<ProcessStartInfo>> PrepareServerCommon(FactorioServerMutableData mutableData, string startTypeArguments)
        {
            var banTask = BuildBanList(mutableData);
            var adminTask = BuildAdminList(mutableData);
            var logTask = RotateLogs(mutableData);

            ResetData(mutableData);
            var startInfo = MakeStartInfo(mutableData, startTypeArguments);

            var results = await Task.WhenAll(banTask, adminTask, logTask);
            if (results.Any(x => !x.Success))
            {
                return Result<ProcessStartInfo>.FromResult(Result.Combine(results));
            }

            return Result<ProcessStartInfo>.OK(startInfo);
        }

        private async Task<Result<ProcessStartInfo>> PrepareWithStatusChange(FactorioServerMutableData mutableData, Func<Task<Result<ProcessStartInfo>>> callback)
        {
            var afterStatus = FactorioServerStatus.Errored;

            try
            {
                _ = FactorioServerUtils.ChangeStatus(mutableData, _factorioControlHub, FactorioServerStatus.Preparing);

                var result = await callback();
                if (result.Success)
                {
                    afterStatus = FactorioServerStatus.Prepared;
                }

                return result;
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(PrepareWithStatusChange));
                return Result<ProcessStartInfo>.Failure(Constants.UnexpectedErrorKey, e.Message);
            }
            finally
            {
                _ = FactorioServerUtils.ChangeStatus(mutableData, _factorioControlHub, afterStatus);
            }
        }
    }
}

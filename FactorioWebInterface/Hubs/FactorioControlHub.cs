using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FactorioWebInterface.Hubs
{
    [Authorize]
    public class FactorioControlHub : Hub<IFactorioControlClientMethods>, IFactorioControlServerMethods
    {
        private IFactorioServerManager _factorioServerManager;
        private FactorioModManager _factorioModManager;

        public FactorioControlHub(IFactorioServerManager factorioServerManager, FactorioModManager factorioModManager)
        {
            _factorioServerManager = factorioServerManager;
            _factorioModManager = factorioModManager;
        }

        public async Task<FactorioContorlClientData> SetServerId(string serverId)
        {
            string connectionId = Context.ConnectionId;

            string oldServerId = Context.GetDataOrDefault<string>();
            if (oldServerId != null)
            {
                await Groups.RemoveFromGroupAsync(connectionId, oldServerId);
            }

            Context.SetData(serverId);

            await Groups.AddToGroupAsync(connectionId, serverId);

            return new FactorioContorlClientData()
            {
                Status = (await _factorioServerManager.GetStatus(serverId)).ToString(),
                Messages = await _factorioServerManager.GetFactorioControlMessagesAsync(serverId)
            };
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            string connectionId = Context.ConnectionId;
            if (Context.TryGetData(out string serverId))
            {
                Groups.RemoveFromGroupAsync(connectionId, serverId);
            }

            return base.OnDisconnectedAsync(exception);
        }

        public Task<Result> ForceStop()
        {
            string serverId = Context.GetDataOrDefault<string>();
            string name = Context.User.Identity.Name;

            return _factorioServerManager.ForceStop(serverId, name);
        }

        public Task GetStatus()
        {
            string serverId = Context.GetDataOrDefault<string>();

            return _factorioServerManager.RequestStatus(serverId);
        }

        public Task<Result> Load(string directoryName, string fileName)
        {
            string serverId = Context.GetDataOrDefault<string>();
            string userName = Context.User.Identity.Name;

            return _factorioServerManager.Load(serverId, directoryName, fileName, userName);
        }

        public Task SendToFactorio(string data)
        {
            string serverId = Context.GetDataOrDefault<string>();
            string userName = Context.User.Identity.Name;

            return _factorioServerManager.FactorioControlDataReceived(serverId, data, userName);
        }

        public Task<Result> Resume()
        {
            string serverId = Context.GetDataOrDefault<string>();
            string name = Context.User.Identity.Name;

            return _factorioServerManager.Resume(serverId, name);
        }

        public Task<Result> StartScenario(string scenarioName)
        {
            string serverId = Context.GetDataOrDefault<string>();
            string name = Context.User.Identity.Name;

            return _factorioServerManager.StartScenario(serverId, scenarioName, name);
        }

        public Task<Result> Stop()
        {
            string serverId = Context.GetDataOrDefault<string>();
            string name = Context.User.Identity.Name;

            return _factorioServerManager.Stop(serverId, name);
        }

        public Task<MessageData[]> GetMesssages()
        {
            string serverId = Context.GetDataOrDefault<string>();

            return _factorioServerManager.GetFactorioControlMessagesAsync(serverId);
        }

        public Task<FileMetaData[]> GetTempSaveFiles()
        {
            string serverId = Context.GetDataOrDefault<string>();

            var files = _factorioServerManager.GetTempSaveFiles(serverId);
            return Task.FromResult(files);
        }

        public Task<FileMetaData[]> GetLocalSaveFiles()
        {
            string serverId = Context.GetDataOrDefault<string>();

            var files = _factorioServerManager.GetLocalSaveFiles(serverId);
            return Task.FromResult(files);
        }

        public Task<FileMetaData[]> GetGlobalSaveFiles()
        {
            return Task.FromResult(_factorioServerManager.GetGlobalSaveFiles());
        }

        public Task<List<FileMetaData>> GetLogFiles()
        {
            string serverId = Context.GetDataOrDefault<string>();

            var files = _factorioServerManager.GetLogs(serverId);
            return Task.FromResult(files);
        }

        public Task<List<FileMetaData>> GetChatLogFiles()
        {
            string serverId = Context.GetDataOrDefault<string>();

            var files = _factorioServerManager.GetChatLogs(serverId);
            return Task.FromResult(files);
        }

        public Task<Result> DeleteFiles(List<string> filePaths)
        {
            if (filePaths == null)
            {
                return Task.FromResult(Result.Failure(Constants.MissingFileErrorKey, "No file."));
            }

            return Task.FromResult(_factorioServerManager.DeleteFiles(filePaths));
        }

        public Task<Result> MoveFiles(string destination, List<string> filePaths)
        {
            if (destination == null)
            {
                return Task.FromResult(Result.Failure(Constants.FileErrorKey, "Invalid destination."));
            }

            if (filePaths == null)
            {
                return Task.FromResult(Result.Failure(Constants.MissingFileErrorKey, "No file."));
            }

            return Task.FromResult(_factorioServerManager.MoveFiles(destination, filePaths));
        }

        public Task<Result> CopyFiles(string destination, List<string> filePaths)
        {
            if (destination == null)
            {
                return Task.FromResult(Result.Failure(Constants.FileErrorKey, "Invalid destination."));
            }

            if (filePaths == null)
            {
                return Task.FromResult(Result.Failure(Constants.MissingFileErrorKey, "No file."));
            }

            return _factorioServerManager.CopyFiles(destination, filePaths);
        }

        public Task<Result> RenameFile(string directoryPath, string fileName, string newFileName)
        {
            if (directoryPath == null || fileName == null || newFileName == null)
            {
                return Task.FromResult(Result.Failure(Constants.FileErrorKey, "Invalid file."));
            }

            return Task.FromResult(_factorioServerManager.RenameFile(directoryPath, fileName, newFileName));
        }

        public Task<FactorioServerSettingsWebEditable> GetServerSettings()
        {
            string serverId = Context.GetDataOrDefault<string>();

            return _factorioServerManager.GetEditableServerSettings(serverId);
        }

        public async Task<Result> SaveServerSettings(FactorioServerSettingsWebEditable settings)
        {
            string serverId = Context.GetDataOrDefault<string>();

            return await _factorioServerManager.SaveEditableServerSettings(serverId, settings);
        }

        public Task<FactorioServerExtraSettings> GetServerExtraSettings()
        {
            string serverId = Context.GetDataOrDefault<string>();

            return _factorioServerManager.GetExtraServerSettings(serverId);
        }

        public async Task<Result> SaveServerExtraSettings(FactorioServerExtraSettings settings)
        {
            string serverId = Context.GetDataOrDefault<string>();

            return await _factorioServerManager.SaveExtraServerSettings(serverId, settings);
        }

        public Task<Result> Save()
        {
            string serverId = Context.GetDataOrDefault<string>();
            string name = Context.User.Identity.Name;

            return _factorioServerManager.Save(serverId, name, "currently-running.zip");
        }

        public Task<ScenarioMetaData[]> GetScenarios()
        {
            return Task.FromResult(_factorioServerManager.GetScenarios());
        }

        public Task<Result> DeflateSave(string directoryPath, string fileName, string newFileName)
        {
            return Task.FromResult(_factorioServerManager.DeflateSave(Context.ConnectionId, directoryPath, fileName, newFileName));
        }

        public async Task<Result> Update(string version = "latest")
        {
            string serverId = Context.GetDataOrDefault<string>();
            string name = Context.User.Identity.Name;

            return await _factorioServerManager.Install(serverId, name, version);
        }

        public Task RequestGetDownloadableVersions()
        {
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(async () =>
             {
                 var result = await _factorioServerManager.GetDownloadableVersions();
                 _ = client.SendDownloadableVersions(result);
             });

            return Task.FromResult(0);
        }

        public Task RequestGetCachedVersions()
        {
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(async () =>
            {
                var result = await _factorioServerManager.GetCachedVersions();
                _ = client.SendCachedVersions(result);
            });

            return Task.FromResult(0);
        }

        public Task DeleteCachedVersion(string version)
        {
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(async () =>
            {
                _ = _factorioServerManager.DeleteCachedVersion(version);

                var result = await _factorioServerManager.GetCachedVersions();
                _ = client.SendCachedVersions(result);
            });

            return Task.FromResult(0);
        }

        public Task<string> GetVersion()
        {
            string serverId = Context.GetDataOrDefault<string>();

            return Task.FromResult(_factorioServerManager.GetVersion(serverId));
        }

        public Task<ModPackMetaData[]> GetModPacks()
        {
            return Task.FromResult(_factorioModManager.GetModPacks());
        }

        public Task<string> GetModPack()
        {
            string serverId = Context.GetDataOrDefault<string>();
            return _factorioServerManager.GetModPack(serverId);
        }

        public async Task SetModPack(string modPack)
        {
            string serverId = Context.GetDataOrDefault<string>();
            await _factorioServerManager.SetModPack(serverId, modPack);

            _ = Clients.Group(serverId).SendSelectedModPack(modPack);
        }
    }
}

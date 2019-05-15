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
        private readonly IFactorioServerManager _factorioServerManager;
        private readonly FactorioFileManager _factorioFileManager;
        private readonly FactorioModManager _factorioModManager;

        public FactorioControlHub(IFactorioServerManager factorioServerManager, FactorioFileManager factorioFileManager, FactorioModManager factorioModManager)
        {
            _factorioServerManager = factorioServerManager;
            _factorioFileManager = factorioFileManager;
            _factorioModManager = factorioModManager;
        }

        public async Task<FactorioContorlClientData> SetServerId(string serverId)
        {
            string connectionId = Context.ConnectionId;

            if (Context.TryGetData(out string oldServerId))
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
            string serverId = Context.GetDataOrDefault("");
            string name = Context.User.Identity.Name;

            return _factorioServerManager.ForceStop(serverId, name);
        }

        public Task GetStatus()
        {
            string serverId = Context.GetDataOrDefault("");

            return _factorioServerManager.RequestStatus(serverId);
        }

        public Task<Result> Load(string directoryName, string fileName)
        {
            string serverId = Context.GetDataOrDefault("");
            string userName = Context.User.Identity.Name;

            return _factorioServerManager.Load(serverId, directoryName, fileName, userName);
        }

        public Task SendToFactorio(string data)
        {
            string serverId = Context.GetDataOrDefault("");
            string actor = Context.User.Identity.Name;

            return _factorioServerManager.FactorioControlDataReceived(serverId, data, actor);
        }

        public Task<Result> Resume()
        {
            string serverId = Context.GetDataOrDefault("");
            string name = Context.User.Identity.Name;

            return _factorioServerManager.Resume(serverId, name);
        }

        public Task<Result> StartScenario(string scenarioName)
        {
            string serverId = Context.GetDataOrDefault("");
            string name = Context.User.Identity.Name;

            return _factorioServerManager.StartScenario(serverId, scenarioName, name);
        }

        public Task<Result> Stop()
        {
            string serverId = Context.GetDataOrDefault("");
            string name = Context.User.Identity.Name;

            return _factorioServerManager.Stop(serverId, name);
        }

        public Task<MessageData[]> GetMesssages()
        {
            string serverId = Context.GetDataOrDefault("");

            return _factorioServerManager.GetFactorioControlMessagesAsync(serverId);
        }

        public Task RequestTempSaveFiles()
        {
            string serverId = Context.GetDataOrDefault("");
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(() =>
            {
                var data = _factorioServerManager.GetTempSaveFiles(serverId);

                var tableData = new TableData<FileMetaData>()
                {
                    Type = TableDataType.Reset,
                    Rows = data
                };

                _ = client.SendTempSavesFiles(serverId, tableData);
            });

            return Task.CompletedTask;
        }

        public Task RequestLocalSaveFiles()
        {
            string serverId = Context.GetDataOrDefault("");
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(() =>
            {
                var data = _factorioServerManager.GetLocalSaveFiles(serverId);

                var tableData = new TableData<FileMetaData>()
                {
                    Type = TableDataType.Reset,
                    Rows = data
                };

                _ = client.SendLocalSaveFiles(serverId, tableData);
            });

            return Task.CompletedTask;
        }

        public Task RequestGlobalSaveFiles()
        {
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(() =>
            {
                var data = _factorioServerManager.GetGlobalSaveFiles();

                var tableData = new TableData<FileMetaData>()
                {
                    Type = TableDataType.Reset,
                    Rows = data
                };

                _ = client.SendGlobalSaveFiles(tableData);
            });

            return Task.CompletedTask;
        }

        public Task RequestScenarios()
        {
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(() =>
            {
                var data = _factorioServerManager.GetScenarios();

                var tableData = new TableData<ScenarioMetaData>()
                {
                    Type = TableDataType.Reset,
                    Rows = data
                };

                _ = client.SendScenarios(tableData);
            });

            return Task.CompletedTask;
        }

        public Task RequestModPacks()
        {
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(() =>
            {
                var data = _factorioModManager.GetModPacks();

                var tableData = new TableData<ModPackMetaData>()
                {
                    Type = TableDataType.Reset,
                    Rows = data
                };

                _ = client.SendModPacks(tableData);
            });

            return Task.CompletedTask;
        }

        public Task RequestLogFiles()
        {
            string serverId = Context.GetDataOrDefault("");
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(() =>
            {
                var data = _factorioServerManager.GetLogs(serverId);

                var tableData = new TableData<FileMetaData>()
                {
                    Type = TableDataType.Reset,
                    Rows = data
                };

                _ = client.SendLogFiles(serverId, tableData);
            });

            return Task.CompletedTask;
        }

        public Task RequestChatLogFiles()
        {
            string serverId = Context.GetDataOrDefault("");
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(() =>
            {
                var data = _factorioServerManager.GetChatLogs(serverId);

                var tableData = new TableData<FileMetaData>()
                {
                    Type = TableDataType.Reset,
                    Rows = data
                };

                _ = client.SendChatLogFiles(serverId, tableData);
            });

            return Task.CompletedTask;
        }

        public Task<Result> DeleteFiles(List<string> filePaths)
        {
            if (filePaths == null)
            {
                return Task.FromResult(Result.Failure(Constants.MissingFileErrorKey, "No file."));
            }

            string serverId = Context.GetDataOrDefault("");

            return Task.FromResult(_factorioFileManager.DeleteFiles(serverId, filePaths));
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

            string serverId = Context.GetDataOrDefault("");

            return Task.FromResult(_factorioFileManager.MoveFiles(serverId, destination, filePaths));
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

            string serverId = Context.GetDataOrDefault("");

            return Task.FromResult(_factorioFileManager.CopyFiles(serverId, destination, filePaths));
        }

        public Task<Result> RenameFile(string directoryPath, string fileName, string newFileName)
        {
            if (directoryPath == null || fileName == null || newFileName == null)
            {
                return Task.FromResult(Result.Failure(Constants.FileErrorKey, "Invalid file."));
            }

            string serverId = Context.GetDataOrDefault("");

            return Task.FromResult(_factorioFileManager.RenameFile(serverId, directoryPath, fileName, newFileName));
        }

        public Task<FactorioServerSettingsWebEditable> GetServerSettings()
        {
            string serverId = Context.GetDataOrDefault("");

            return _factorioServerManager.GetEditableServerSettings(serverId);
        }

        public async Task<Result> SaveServerSettings(FactorioServerSettingsWebEditable settings)
        {
            string serverId = Context.GetDataOrDefault("");

            return await _factorioServerManager.SaveEditableServerSettings(serverId, settings);
        }

        public Task<FactorioServerExtraSettings> GetServerExtraSettings()
        {
            string serverId = Context.GetDataOrDefault("");

            return _factorioServerManager.GetExtraServerSettings(serverId);
        }

        public async Task<Result> SaveServerExtraSettings(FactorioServerExtraSettings settings)
        {
            string serverId = Context.GetDataOrDefault("");

            return await _factorioServerManager.SaveExtraServerSettings(serverId, settings);
        }

        public Task<Result> Save()
        {
            string serverId = Context.GetDataOrDefault("");
            string name = Context.User.Identity.Name;

            return _factorioServerManager.Save(serverId, name, "currently-running.zip");
        }

        public Task<Result> DeflateSave(string directoryPath, string fileName, string newFileName)
        {
            string serverId = Context.GetDataOrDefault("");

            return Task.FromResult(_factorioServerManager.DeflateSave(Context.ConnectionId, serverId, directoryPath, fileName, newFileName));
        }

        public async Task<Result> Update(string version = "latest")
        {
            string serverId = Context.GetDataOrDefault("");
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
            string serverId = Context.GetDataOrDefault("");

            return Task.FromResult(_factorioServerManager.GetVersion(serverId));
        }

        public Task RequestSelectedModPack()
        {
            string serverId = Context.GetDataOrDefault("");
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(async () =>
            {
                var data = await _factorioServerManager.GetSelectedModPack(serverId);
                _ = client.SendSelectedModPack(data);
            });

            return Task.CompletedTask;
        }

        public Task SetSelectedModPack(string modPack)
        {
            string serverId = Context.GetDataOrDefault("");

            _ = _factorioServerManager.SetSelectedModPack(serverId, modPack);

            return Task.CompletedTask;
        }
    }
}

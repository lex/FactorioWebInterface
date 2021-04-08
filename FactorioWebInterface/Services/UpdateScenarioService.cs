using FactorioWebInterface.Models;
using FactorioWebInterface.Models.CodeDeflate;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.IO.Abstractions;
using System.Threading;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services
{
    public interface IUpdateScenarioService
    {
        Task<Result> UpdateScenarios();
    }

    public class UpdateScenarioService : IUpdateScenarioService
    {
        private readonly IDownloadGitHubScenarioService _downloadGitHubScenarioService;
        private readonly IFactorioFileManager _factorioFileManager;

        private readonly string scenarioTemplateDirectoryName;
        private readonly SemaphoreSlim updateLock = new SemaphoreSlim(1);

        public UpdateScenarioService(
            IDownloadGitHubScenarioService downloadGitHubScenarioService,
            IFactorioFileManager factorioFileManager,
            IConfiguration config)
        {
            _downloadGitHubScenarioService = downloadGitHubScenarioService;
            _factorioFileManager = factorioFileManager;

            scenarioTemplateDirectoryName = config[Constants.ScenarioTemplatesDirectoryNameKey] ?? Constants.DefaultScenarioTemplatesDirectoryName;
        }

        public async Task<Result> UpdateScenarios()
        {
            await updateLock.WaitAsync();

            try
            {
                return await DoUpdateScenario();
            }
            catch (Exception ex)
            {
                return Result.FromException(ex);
            }
            finally
            {
                updateLock.Release();
            }
        }

        private async Task<Result> DoUpdateScenario()
        {
            Result<Stream> downloadResult = await _downloadGitHubScenarioService.Download();
            if (!downloadResult.Success)
            {
                return downloadResult;
            }

            IDirectoryInfo scenariosDirectory = _factorioFileManager.GetScenariosDirectory();

            try
            {
                using Stream baseScenario = downloadResult.Value!;
                ScenarioBuilder.BuildFromTemplates(baseScenario, scenarioTemplateDirectoryName, scenariosDirectory);

                return Result.OK;
            }
            finally
            {
                _factorioFileManager.NotifyScenariosChanged();
            }
        }
    }
}

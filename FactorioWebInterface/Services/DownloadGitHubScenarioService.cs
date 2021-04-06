using FactorioWebInterface.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services
{
    public interface IDownloadGitHubScenarioService
    {
        Task<Result<Stream>> Download();
    }

    public class DownloadGitHubScenarioService : IDownloadGitHubScenarioService
    {
        private readonly IHttpClientFactory _httpClientFactory;

        private readonly string scenarioDownloadUrl;

        public DownloadGitHubScenarioService(IHttpClientFactory httpClientFactory, IConfiguration config)
        {
            _httpClientFactory = httpClientFactory;

            scenarioDownloadUrl = config[Constants.ScenarioDownloadUrlKey];
        }

        public async Task<Result<Stream>> Download()
        {
            if (string.IsNullOrWhiteSpace(scenarioDownloadUrl))
            {
                return Result<Stream>.Failure(Constants.MissingConfigurationErrorKey, $"{Constants.ScenarioDownloadUrlKey} has not been configured in 'appsettings.json'.");
            }

            try
            {
                using HttpClient client = _httpClientFactory.CreateClient();
                HttpResponseMessage download = await client.GetAsync(scenarioDownloadUrl);

                if (!download.IsSuccessStatusCode)
                {
                    return Result<Stream>.Failure(Constants.DownloadErrorKey, download.StatusCode.ToString());
                }

                var stream = await download.Content.ReadAsStreamAsync();
                return Result<Stream>.OK(stream);
            }
            catch (Exception ex)
            {
                return Result<Stream>.Failure(Constants.UnexpectedErrorKey, ex.Message);
            }
        }
    }
}

using FactorioWebInterface.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using FactorioWebInterface.Data.FactorioModPortal;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FactorioWebInterface.Services
{
    public interface IFactorioModPortalService
    {
        Task<Stream?> DownloadMod(string downloadUrl);
        Task<Result<IReadOnlyList<GetModDownloadResult>>> GetDownloadUrls(IReadOnlyList<string> fileNames);
    }

    public class FactorioModPortalService : IFactorioModPortalService
    {
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _clientFactory;
        private readonly ILogger<FactorioModPortalService> _logger;

        public FactorioModPortalService(IConfiguration configuration, IHttpClientFactory clientFactory, ILogger<FactorioModPortalService> logger)
        {
            _configuration = configuration;
            _clientFactory = clientFactory;
            _logger = logger;
        }

        public async Task<Stream?> DownloadMod(string downloadUrl)
        {
            try
            {
                string url = $"{Constants.ModPortalUrl}{downloadUrl}?username={_configuration[Constants.ServerSettingsUsernameKey]}&token={_configuration[Constants.ServerSettingsTokenKey]}";

                using var client = _clientFactory.CreateClient();
                var download = await client.GetAsync(url);

                if (!download.IsSuccessStatusCode)
                {
                    return null;
                }

                return await download.Content.ReadAsStreamAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, nameof(DownloadMod));
                return null;
            }
        }

        public async Task<Result<IReadOnlyList<GetModDownloadResult>>> GetDownloadUrls(IReadOnlyList<string> fileNames)
        {
            var result = new List<GetModDownloadResult>();
            var fileNameToModAndVersionMap = new Dictionary<string, (string modName, string version)>();

            foreach (var fileName in fileNames)
            {
                if (ModParser.TryGetNameAndVersion(fileName, out string? modName, out string? version))
                {
                    fileNameToModAndVersionMap[fileName] = (modName, version);
                }
                else
                {
                    result.Add(GetModDownloadResult.Failure(fileName, GetModDownloadResultStatus.InvalidModName));
                }
            }

            if (fileNameToModAndVersionMap.Count == 0)
            {
                return Result<IReadOnlyList<GetModDownloadResult>>.OK(result);
            }

            var modNames = fileNameToModAndVersionMap.Values.Select(x => x.modName).Distinct();
            string url = $"{Constants.ModPortalApi}?page_size=max&namelist={string.Join(',', modNames)}";

            ModListResponse data;
            try
            {
                using var client = _clientFactory.CreateClient();
                var response = await client.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    return Result<IReadOnlyList<GetModDownloadResult>>.Failure(Constants.InvalidHttpResponseErrorKey, $"Http error: {response.StatusCode} when requesting mod data from mod portal.");
                }

                data = await JsonSerializer.DeserializeAsync<ModListResponse>(await response.Content.ReadAsStreamAsync()) ?? new ModListResponse();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, nameof(GetDownloadUrls));
                return Result<IReadOnlyList<GetModDownloadResult>>.Failure(Constants.UnexpectedErrorKey, ex.Message);
            }

            Dictionary<string, Release[]> lookup = data.Results.ToDictionary(x => x.Name, x => x.Releases);

            foreach (var entry in fileNameToModAndVersionMap)
            {
                string fileName = entry.Key;
                (string modName, string version) = entry.Value;

                if (!lookup.TryGetValue(modName, out Release[]? releases))
                {
                    result.Add(GetModDownloadResult.Failure(fileName, GetModDownloadResultStatus.MissingMod));
                    continue;
                }

                if (!(releases.FirstOrDefault(x => x.Version == version) is Release release))
                {
                    result.Add(GetModDownloadResult.Failure(fileName, GetModDownloadResultStatus.MissingVersion));
                    continue;
                }

                if (string.IsNullOrWhiteSpace(release.FileName) || string.IsNullOrWhiteSpace(release.DownloadUrl))
                {
                    result.Add(GetModDownloadResult.Failure(fileName, GetModDownloadResultStatus.InvalidReleaseData));
                    continue;
                }

                result.Add(GetModDownloadResult.Success(release.FileName, release.DownloadUrl ?? ""));
            }

            return Result<IReadOnlyList<GetModDownloadResult>>.OK(result);
        }
    }
}

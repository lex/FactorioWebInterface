using FactorioWebInterface.Data.GitHub;
using FactorioWebInterface.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services
{
    public interface IGitHubService
    {
        Task<Result> ProcessEvent(string @event, PushEvent data);
    }

    public class GitHubService : IGitHubService
    {
        private readonly IUpdateScenarioService _updateScenarioService;

        public GitHubService(IUpdateScenarioService updateScenarioService, ILogger<IGitHubService> logger)
        {
            _updateScenarioService = updateScenarioService;
        }

        public async Task<Result> ProcessEvent(string @event, PushEvent data)
        {
            if (IsPush(@event) && IsDefaultBranch(data))
            {
                return await _updateScenarioService.UpdateScenarios();
            }

            return Result.OK;
        }

        private static bool IsPush(string @event) => string.Equals(@event, "push", StringComparison.OrdinalIgnoreCase);

        private static bool IsDefaultBranch(PushEvent data)
        {
            const string refsPrefix = "refs/heads/";

            if (data is null)
            {
                return false;
            }

            if (data.Ref is not string @ref || !@ref.StartsWith(refsPrefix))
            {
                return false;
            }

            if (data.Repository?.DefaultBranch is not string defaultBranch || string.IsNullOrWhiteSpace(defaultBranch))
            {
                return false;
            }

            var branch = @ref.AsSpan(refsPrefix.Length);

            return branch.Equals(defaultBranch.AsSpan(), StringComparison.OrdinalIgnoreCase);
        }
    }
}

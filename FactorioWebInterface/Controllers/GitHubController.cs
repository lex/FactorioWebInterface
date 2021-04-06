using FactorioWebInterface.Data.GitHub;
using FactorioWebInterface.Services;
using FactorioWebInterface.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebHooks;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace FactorioWebInterface.Controllers
{
    public class GitHubController : ControllerBase
    {
        private readonly IGitHubService _githubService;
        private readonly ILogger<GitHubController> _logger;

        public GitHubController(IGitHubService githubService, ILogger<GitHubController> logger)
        {
            _githubService = githubService;
            _logger = logger;
        }

        [GitHubWebHook]
        public IActionResult GitHub(string? id, string @event, PushEvent data)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            Task.Run(() => _githubService.ProcessEvent(@event, data))
                .LogErrorsAndExceptions(_logger);

            return Ok();
        }
    }
}
using FactorioWebInterface.Data.GitHub;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Moq;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.GitHubServiceTests
{
    public class ProcessEvent
    {
        [Theory]
        [InlineData("refs/heads/develop", "develop")]
        [InlineData("refs/heads/develop", "DEVELOP")]
        public async Task UpdateScenariosWhenDefaultBranch(string @ref, string defaultBranch)
        {
            // Arrange.
            Mock<IUpdateScenarioService> scenarioService = MakeScenarioService(Result.OK);
            var logger = new TestLogger<IGitHubService>();

            var service = new GitHubService(scenarioService.Object, logger);

            var pushData = new PushEvent()
            {
                Ref = @ref,
                Repository = new Repository() { DefaultBranch = defaultBranch }
            };

            // Act.
            Result result = await service.ProcessEvent("push", pushData);

            // Assert.
            Assert.True(result.Success);
            scenarioService.Verify();
        }

        [Theory]
        [InlineData("", "")]
        [InlineData("refs/heads/", "")]
        [InlineData("refs/heads/", "develop")]
        [InlineData("refs/heads/other_branch", "develop")]
        public async Task DoesNotUpdateScenariosWhenNotDefaultBranch(string @ref, string defaultBranch)
        {
            // Arrange.
            var scenarioService = new Mock<IUpdateScenarioService>(MockBehavior.Strict);
            var logger = new TestLogger<IGitHubService>();

            var service = new GitHubService(scenarioService.Object, logger);

            var pushData = new PushEvent()
            {
                Ref = @ref,
                Repository = new Repository() { DefaultBranch = defaultBranch }
            };

            // Act
            Result result = await service.ProcessEvent("push", pushData);

            // Assert.
            Assert.True(result.Success);
            Assert.Empty(logger.Invocations);
        }

        [Fact]
        public async Task DoesNotUpdateScenariosWhenNotPushEvent()
        {
            // Arrange.
            var scenarioService = new Mock<IUpdateScenarioService>(MockBehavior.Strict);
            var logger = new TestLogger<IGitHubService>();

            var service = new GitHubService(scenarioService.Object, logger);

            // Act
            Result result = await service.ProcessEvent("other_event", new PushEvent());

            // Assert.
            Assert.True(result.Success);
            Assert.Empty(logger.Invocations);
        }

        [Fact]
        public async Task DoesNotUpdatesScenariosWhenPushEventEmpty()
        {
            // Arrange.
            var scenarioService = new Mock<IUpdateScenarioService>(MockBehavior.Strict);
            var logger = new TestLogger<IGitHubService>();

            var service = new GitHubService(scenarioService.Object, logger);

            // Act
            Result result = await service.ProcessEvent("push", new PushEvent());

            // Assert.
            Assert.True(result.Success);
            Assert.Empty(logger.Invocations);
        }

        [Fact]
        public async Task ReturnsErrorFromUpdateScenarios()
        {
            // Arrange.
            Result error = Result.Failure("some_error");
            Mock<IUpdateScenarioService> scenarioService = MakeScenarioService(error);
            var logger = new TestLogger<IGitHubService>();

            var service = new GitHubService(scenarioService.Object, logger);

            var pushData = new PushEvent()
            {
                Ref = "refs/heads/develop",
                Repository = new Repository() { DefaultBranch = "develop" }
            };

            // Act.
            Result result = await service.ProcessEvent("push", pushData);

            // Assert.
            Assert.Equal(error, result);
            scenarioService.Verify();
        }

        private static Mock<IUpdateScenarioService> MakeScenarioService(Result result)
        {
            var service = new Mock<IUpdateScenarioService>(MockBehavior.Strict);
            service.Setup(x => x.UpdateScenarios())
                .Returns(Task.FromResult(result))
                .Verifiable();

            return service;
        }
    }
}

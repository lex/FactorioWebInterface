using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioFileManagerTests
{
    public class SaveServerExtraData : FactorioFileManagerTestBase
    {
        [Fact]
        public async Task DataIsSavedToFile()
        {
            // Arrange.
            FactorioServerMutableData data = ServerDataHelper.MakeMutableData();
            data.ModPack = "mod_pack";

            var service = MakeFactorioFileManager();

            // Act.
            await service.SaveServerExtraData(data);

            // Assert.
            AssertSavedData(data);
        }

        [Fact]
        public async Task LogError()
        {
            // Arrange.
            FactorioServerMutableData data = ServerDataHelper.MakeMutableData(baseFactorioDirectoryPath: "|illegalPath|");
            data.ModPack = "mod_pack";

            var service = MakeFactorioFileManager();

            // Act.
            await service.SaveServerExtraData(data);

            // Assert.
            Logger.AssertContainsLog(LogLevel.Error, nameof(FactorioFileManager.SaveServerExtraData));
        }

        private void AssertSavedData(FactorioServerMutableData data)
        {
            string text = FileSystem.File.ReadAllText(data.ServerExtraDataPath);
            FactorioServerExtraData storedData = JsonSerializer.Deserialize<FactorioServerExtraData>(text)!;

            Assert.Equal(data.ModPack, storedData.SelectedModPack);
        }
    }
}

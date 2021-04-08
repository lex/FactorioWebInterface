using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Moq;
using System.IO.Abstractions.TestingHelpers;

namespace FactorioWebInterfaceTests.Services.FactorioFileManagerTests
{
    public class FactorioFileManagerTestBase
    {
        public TestLogger<IFactorioFileManager> Logger { get; } = new TestLogger<IFactorioFileManager>();
        public Mock<IFactorioServerDataService> FactorioServerDataService { get; set; } = new Mock<IFactorioServerDataService>(MockBehavior.Strict);
        public MockFileSystem FileSystem { get; set; } = new MockFileSystem();

        public FactorioFileManager MakeFactorioFileManager()
        {
            return new FactorioFileManager(Logger, FactorioServerDataService.Object, FileSystem);
        }
    }
}

using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
using FactorioWebInterfaceTests.Utils;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioAdminServiceTests
{
    public class BuildAdminList : AdminServiceTestBase
    {
        public static object[][] DoesBuildAdminListTestCases => new object[][]
        {
            new object[]{ new string[] { } },
            new object[]{ new[] { "abc" } },
            new object[]{ new[] { "abc", "def", "ghi" } },
        };

        [Theory]
        [MemberData(nameof(DoesBuildAdminListTestCases))]
        public async Task DoesBuildAdminList(string[] names)
        {
            // Arrange.
            string expectedOutput = JsonConvert.SerializeObject(names, Formatting.Indented);
            var expectedChangedDataNewItems = new Dictionary<string, object>()
            {
                { nameof(FactorioServerSettingsWebEditable.Admins), names }
            };

            var data = ServerDataHelper.MakeMutableData();
            data.ServerWebEditableSettings = new FactorioServerSettingsWebEditable();

            var admins = names.Select(name => new Admin() { Name = name });

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.Admins.AddRange(admins);
            await db.SaveChangesAsync();

            FileSystem.Directory.CreateDirectory(data.BaseDirectoryPath);

            var changedDataSource = new TaskCompletionSource<FactorioAdminListChangedEventArgs>();
            AdminService.AdminListChanged += (_, e) => changedDataSource.SetResult(e);

            // Act.
            var result = await AdminService.BuildAdminList(data);
            var eventArgs = await changedDataSource.Task.TimeoutAfter(1000);

            // Assert.
            Assert.True(result.Success);

            var actualOutput = await FileSystem.File.ReadAllTextAsync(data.ServerAdminListPath);
            Assert.Equal(expectedOutput, actualOutput);

            Assert.Equal(data.ServerId, eventArgs.ServerId);
            var changedData = eventArgs.ChangedData;
            Assert.Equal(CollectionChangeType.Add, changedData.Type);
            Assert.Equal(expectedChangedDataNewItems, changedData.NewItems);
        }
    }
}

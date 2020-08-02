using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using Microsoft.EntityFrameworkCore;
using Nito.AsyncEx;
using System.Threading.Tasks;
using Xunit;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using FactorioWebInterface.Utils;
using System.Runtime.InteropServices;

namespace FactorioWebInterfaceTests.Services.FactorioAdminServiceTests
{
    public class AddAdmins : AdminServiceTestBase
    {
        public static object[][] DoesAddTestCases => new object[][]
        {
            new object[]{"abc", new Admin[] { new Admin() { Name = "abc" } } },
            new object[]{" abc ", new Admin[] { new Admin() { Name = "abc" } } },
            new object[]{"abc,def,ghi", new Admin[] { new Admin() { Name = "abc" }, new Admin() { Name = "def" }, new Admin() { Name = "ghi" } } },
            new object[]{"abc , def , ghi", new Admin[] { new Admin() { Name = "abc" }, new Admin() { Name = "def" }, new Admin() { Name = "ghi" } } },
            new object[]{"abc, abc ", new Admin[] { new Admin() { Name = "abc" } } }
        };

        [Theory]
        [MemberData(nameof(DoesAddTestCases))]
        public async Task DoesAdd(string names, Admin[] expectedAdmins)
        {
            // Arrange.
            var changedDataSource = new TaskCompletionSource<CollectionChangedData<Admin>>();
            AdminService.AdminsChanged += (_, e) => changedDataSource.SetResult(e);

            // Act.
            var result = await AdminService.AddAdmins(names);
            var changedData = await changedDataSource.Task.TimeoutAfter(1000);

            // Assert.
            Assert.True(result.Success);

            var db = DbContextFactory.Create<ApplicationDbContext>();
            var actualAdmins = await db.Admins.ToArrayAsync();
            Assert.Equal(expectedAdmins, actualAdmins);

            Assert.Equal(CollectionChangeType.Add, changedData.Type);
            Assert.Equal(expectedAdmins, changedData.NewItems);
        }

        [Fact]
        public async Task DoesNotAddDuplicates()
        {
            // Arrange.
            var admin = new Admin() { Name = "abc" };

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.Admins.Add(admin);
            await db.SaveChangesAsync();

            // Act.
            var result = await AdminService.AddAdmins(admin.Name);

            // Assert.
            Assert.True(result.Success);

            db = DbContextFactory.Create<ApplicationDbContext>();
            var actualAdmins = await db.Admins.ToArrayAsync();
            Assert.Equal(new Admin[] { admin }, actualAdmins);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData(" ")]
        [InlineData(",")]
        [InlineData(" , ")]
        [InlineData(" , , , ")]
        public async Task EmptyDataIsOK(string data)
        {
            // Act.
            var result = await AdminService.AddAdmins(data);

            // Assert.
            Assert.True(result.Success);

            var db = DbContextFactory.Create<ApplicationDbContext>();
            var actualAdmins = await db.Admins.ToArrayAsync();
            Assert.Empty(actualAdmins);
        }
    }
}

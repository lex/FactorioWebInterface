using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioAdminServiceTests
{
    public class RemoveAdmin : AdminServiceTestBase
    {
        [Fact]
        public async Task DoesRemoveAdmin()
        {
            // Arrange.
            var admin = new Admin() { Name = "abc" };

            var changedDataSource = new TaskCompletionSource<CollectionChangedData<Admin>>();
            AdminService.AdminsChanged += (_, e) => changedDataSource.SetResult(e);

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.Admins.Add(admin);
            await db.SaveChangesAsync();

            // Act.
            var result = await AdminService.RemoveAdmin(admin.Name);
            var changedData = await changedDataSource.Task.TimeoutAfter(1000);

            // Assert.
            Assert.True(result.Success);

            db = DbContextFactory.Create<ApplicationDbContext>();
            var actualAdmins = await db.Admins.ToArrayAsync();
            Assert.Empty(actualAdmins);

            Assert.Equal(CollectionChangeType.Remove, changedData.Type);
            Assert.Equal(new[] { admin }, changedData.OldItems);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData(" ")]
        public async Task NotFoundAdminIsOK(string name)
        {
            // Act.
            var result = await AdminService.RemoveAdmin(name);

            // Assert.
            Assert.True(result.Success);

            var db = DbContextFactory.Create<ApplicationDbContext>();
            var actualAdmins = await db.Admins.ToArrayAsync();
            Assert.Empty(actualAdmins);
        }
    }
}

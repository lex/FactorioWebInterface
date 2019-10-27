using FactorioWebInterface.Data;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioAdminServiceTests
{
    public class GetAdmins : AdminServiceTestBase
    {
        [Fact]
        public async Task DoesGetAdmins()
        {
            // Arrange.
            var admins = new Admin[]
            {
                new Admin(){Name = "abc"},
                new Admin(){Name = "def"},
                new Admin(){Name = "ghi"},
            };

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.Admins.AddRange(admins);
            await db.SaveChangesAsync();

            // Act.
            var actual = await AdminService.GetAdmins();

            // Assert.
            Assert.Equal(admins, actual);
        }

        [Fact]
        public async Task GetAdmins_NoAdmins()
        {
            // Act.
            var actual = await AdminService.GetAdmins();

            // Assert.
            Assert.Empty(actual);
        }
    }
}

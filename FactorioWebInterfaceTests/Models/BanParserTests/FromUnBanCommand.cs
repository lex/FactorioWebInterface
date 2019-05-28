using Xunit;
using FactorioWebInterface.Models;

namespace FactorioWebInterfaceTests.Models.BanParserTests
{
    public class FromUnBanCommand
    {
        [Theory]
        [InlineData("/unban grilledham", "admin", "grilledham")]
        [InlineData("/unban grilledham ", "admin", "grilledham")]
        public void GetsUsername(string content, string actor, string expected)
        {
            var ban = BanParser.FromUnBanCommand(content, actor);

            Assert.NotNull(ban);
            Assert.Equal(expected, ban.Username);
        }

        [Fact]
        public void GetsAdmin()
        {
            string admin = "admin";

            var ban = BanParser.FromUnBanCommand("/unban grilledham", admin);

            Assert.NotNull(ban);
            Assert.Equal(admin, ban.Admin);
        }

        [Theory]
        [InlineData("/unban", "admin")]
        [InlineData("/unban ", "admin")]
        [InlineData("/unban grilled ham", "admin")]
        public void ReturnsNullForInvalidContent(string content, string actor)
        {
            var ban = BanParser.FromUnBanCommand(content, actor);

            Assert.Null(ban);
        }
    }
}

using Xunit;
using FactorioWebInterface.Models;

namespace FactorioWebInterfaceTests.Models.BanParserTests
{
    public class FromBanCommand
    {
        [Theory]
        [InlineData("/ban grilledham", "admin", "grilledham")]
        [InlineData("/ban grilledham was naughty", "admin", "grilledham")]
        public void GetsUsername(string content, string actor, string expected)
        {
            var ban = BanParser.FromBanCommand(content, actor);

            Assert.NotNull(ban);
            Assert.Equal(expected, ban.Username);
        }

        [Theory]
        [InlineData("/ban grilledham", "admin", "unspecified.")]
        [InlineData("/ban grilledham was naughty", "admin", "was naughty.")]
        public void GetsReason(string content, string actor, string expected)
        {
            var ban = BanParser.FromBanCommand(content, actor);

            Assert.NotNull(ban);
            Assert.Equal(expected, ban.Reason);
        }

        [Fact]
        public void GetsAdmin()
        {
            string admin = "admin";

            var ban = BanParser.FromBanCommand("/ban grilledham", admin);

            Assert.NotNull(ban);
            Assert.Equal(admin, ban.Admin);
        }

        [Theory]
        [InlineData("/ban", "admin")]
        [InlineData("/ban ", "admin")]
        public void ReturnsNullForInvalidContent(string content, string actor)
        {
            var ban = BanParser.FromBanCommand(content, actor);

            Assert.Null(ban);
        }
    }
}

using Xunit;
using FactorioWebInterface.Models;

namespace FactorioWebInterfaceTests.Models.BanParserTests
{
    public class FromUnBanGameOutput
    {
        [Theory]
        [InlineData("grilledham was unbanned by admin.", "grilledham")]
        [InlineData(" grilledham was unbanned by admin.", "grilledham")]
        [InlineData(" grilledham was unbanned by admin [Cat].", "grilledham")]
        public void GetsUsername(string content, string expected)
        {
            var ban = BanParser.FromUnBanGameOutput(content);

            Assert.NotNull(ban);
            Assert.Equal(expected, ban!.Username);
        }

        [Theory]
        [InlineData("grilled ham was unbanned by admin.", "grilled ham")]
        [InlineData(" grilled ham was unbanned by admin.", "grilled ham")]
        [InlineData(" grilled ham was unbanned by admin [Cat].", "grilled ham")]
        public void GetsUsername_UsernameContainsSpace(string content, string expected)
        {
            var ban = BanParser.FromUnBanGameOutput(content);

            Assert.NotNull(ban);
            Assert.Equal(expected, ban!.Username);
        }

        [Theory]
        [InlineData("grilledham was unbanned by admin.", "admin")]
        [InlineData(" grilledham was unbanned by admin.", "admin")]
        public void GetsAdmin(string content, string expected)
        {
            var ban = BanParser.FromUnBanGameOutput(content);

            Assert.NotNull(ban);
            Assert.Equal(expected, ban!.Admin);
        }

        [Theory]
        [InlineData("")]
        [InlineData(" grilledham admin.")]
        public void ReturnsNullOnInvalidContent(string content)
        {
            var ban = BanParser.FromUnBanGameOutput(content);

            Assert.Null(ban);
        }
    }
}

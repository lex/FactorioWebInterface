using Xunit;
using FactorioWebInterface.Models;

namespace FactorioWebInterfaceTests.Models.BanParserTests
{
    public class NameFromUnBanCommand
    {
        [Theory]
        [InlineData("/unban grilledham", "grilledham")]
        [InlineData("/unban grilledham ", "grilledham")]
        public void GetsUsername(string content, string expected)
        {
            // Act.
            var player = BanParser.NameFromUnBanCommand(content);

            // Assert.
            Assert.NotNull(player);
            Assert.Equal(expected, player);
        }

        [Theory]
        [InlineData("/unban")]
        [InlineData("/unban ")]
        [InlineData("/unban grilled ham")]
        public void ReturnsNullForInvalidContent(string content)
        {
            // Act.
            var ban = BanParser.NameFromUnBanCommand(content);

            // Assert.
            Assert.Null(ban);
        }
    }
}

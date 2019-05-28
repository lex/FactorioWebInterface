using Xunit;
using FactorioWebInterface.Models;

namespace FactorioWebInterfaceTests.Models.BanParserTests
{
    public class FromGameOutput
    {
        [Theory]
        [InlineData("grilledham was banned by admin. Reason: unspecified.", "grilledham")]
        [InlineData(" grilledham was banned by admin. Reason: unspecified.", "grilledham")]
        [InlineData(" grilledham. was banned by admin. Reason: unspecified.", "grilledham.")]
        [InlineData(" grilledham (not on map) was banned by admin. Reason: unspecified.", "grilledham")]
        public void GetsUsername(string content, string expected)
        {
            var ban = BanParser.FromGameOutput(content);

            Assert.NotNull(ban);
            Assert.Equal(expected, ban.Username);
        }

        [Theory]
        [InlineData("grilledham was banned by admin [Dog]. Reason: unspecified.", "grilledham")]
        [InlineData(" grilledham was banned by admin [Dog]. Reason: unspecified.", "grilledham")]
        [InlineData(" grilledham (not on map) was banned by admin [Dog]. Reason: unspecified.", "grilledham")]
        [InlineData(" grilledham was banned by admin. [Dog]. Reason: unspecified.", "grilledham")]
        [InlineData(" grilledham was banned by admin [Dog Cat]. Reason: unspecified.", "grilledham")]
        [InlineData(" grilledham was banned by admin [[Dog]]. Reason: unspecified.", "grilledham")]
        public void GetsUsername_AdminHasTag(string content, string expected)
        {
            var ban = BanParser.FromGameOutput(content);

            Assert.NotNull(ban);
            Assert.Equal(expected, ban.Username);
        }

        [Theory]
        [InlineData("grilled ham was banned by admin. Reason: unspecified.", "grilled ham")]
        [InlineData(" grilled ham was banned by admin. Reason: unspecified.", "grilled ham")]
        [InlineData(" grilled ham (not on map) was banned by admin. Reason: unspecified.", "grilled ham")]
        [InlineData("grilled ham  was banned by admin. Reason: unspecified.", "grilled ham")]
        [InlineData("  grilled ham was banned by admin. Reason: unspecified.", "grilled ham")]
        public void GetsUsername_UsernameHasSpace(string content, string expected)
        {
            var ban = BanParser.FromGameOutput(content);

            Assert.NotNull(ban);
            Assert.Equal(expected, ban.Username);
        }

        [Theory]
        [InlineData("grilledham was banned by admin. Reason: unspecified.", "admin")]
        [InlineData(" grilledham was banned by admin. Reason: unspecified.", "admin")]
        [InlineData(" grilledham (not on map) was banned by admin. Reason: unspecified.", "admin")]
        [InlineData(" grilledham. was banned by admin. Reason: unspecified.", "admin")]
        [InlineData(" grilledham. was banned by admin.. Reason: unspecified.", "admin.")]
        public void GetsAdmin(string content, string expected)
        {
            var ban = BanParser.FromGameOutput(content);

            Assert.NotNull(ban);
            Assert.Equal(expected, ban.Admin);
        }

        [Theory]
        [InlineData("grilledham was banned by admin [Dog]. Reason: unspecified.", "admin")]
        [InlineData(" grilledham was banned by admin [Dog]. Reason: unspecified.", "admin")]
        [InlineData(" grilledham (not on map) was banned by admin [Dog]. Reason: unspecified.", "admin")]
        [InlineData(" grilledham was banned by admin. [Dog]. Reason: unspecified.", "admin.")]
        [InlineData(" grilledham was banned by admin [Dog Cat]. Reason: unspecified.", "admin")]
        [InlineData(" grilledham was banned by admin [[Dog]]. Reason: unspecified.", "admin")]
        public void GetsAdmin_AdminHasTag(string content, string expected)
        {
            var ban = BanParser.FromGameOutput(content);

            Assert.NotNull(ban);
            Assert.Equal(expected, ban.Admin);
        }

        [Theory]
        [InlineData("grilled ham was banned by admin. Reason: unspecified.", "admin")]
        [InlineData(" grilled ham was banned by admin. Reason: unspecified.", "admin")]
        [InlineData(" grilled ham (not on map) was banned by admin. Reason: unspecified.", "admin")]
        [InlineData("grilled ham  was banned by admin. Reason: unspecified.", "admin")]
        [InlineData("  grilled ham was banned by admin. Reason: unspecified.", "admin")]
        public void GetsAdmin_UsernameHasSpace(string content, string expected)
        {
            var ban = BanParser.FromGameOutput(content);

            Assert.NotNull(ban);
            Assert.Equal(expected, ban.Admin);
        }

        [Theory]
        [InlineData(" grilledham was banned by admin. Reason: unspecified.", "unspecified.")]
        [InlineData(" grilledham (not on map) was banned by admin. Reason: unspecified.", "unspecified.")]
        [InlineData(" grilledham was banned by admin. Reason: was naughty.", "was naughty.")]
        [InlineData(" grilledham. was banned by admin. Reason: smells of old socks.", "smells of old socks.")]
        [InlineData(" grilledham. was banned by admin.. Reason: puts. full. stops. at. end. of. words..", "puts. full. stops. at. end. of. words.")]
        public void GetsReason(string content, string expected)
        {
            var ban = BanParser.FromGameOutput(content);

            Assert.NotNull(ban);
            Assert.Equal(expected, ban.Reason);
        }

        [Theory]
        [InlineData(" grilledham was banned by admin [Dog]. Reason: unspecified.", "unspecified.")]
        [InlineData(" grilledham (not on map) was banned by admin [Dog]. Reason: unspecified.", "unspecified.")]
        [InlineData(" grilledham was banned by admin. [Dog]. Reason: unspecified.", "unspecified.")]
        [InlineData(" grilledham was banned by admin [Dog Cat]. Reason: unspecified.", "unspecified.")]
        [InlineData(" grilledham was banned by admin [[Dog]]. Reason: unspecified.", "unspecified.")]
        public void GetsReason_AdminHasTag(string content, string expected)
        {
            var ban = BanParser.FromGameOutput(content);

            Assert.NotNull(ban);
            Assert.Equal(expected, ban.Reason);
        }

        [Theory]
        [InlineData("grilled ham was banned by admin. Reason: unspecified.", "unspecified.")]
        [InlineData(" grilled ham was banned by admin. Reason: unspecified.", "unspecified.")]
        [InlineData(" grilled ham (not on map) was banned by admin. Reason: unspecified.", "unspecified.")]
        [InlineData("grilled ham  was banned by admin. Reason: unspecified.", "unspecified.")]
        [InlineData("  grilled ham was banned by admin. Reason: unspecified.", "unspecified.")]
        public void GetsReason_UsernameHasSpace(string content, string expected)
        {
            var ban = BanParser.FromGameOutput(content);

            Assert.NotNull(ban);
            Assert.Equal(expected, ban.Reason);
        }

        [Theory]
        [InlineData("")]
        [InlineData(" grilledham was banned by admin.")]
        [InlineData(" grilledham was banned Reason: unspecified.")]
        [InlineData(" (not on map)")]
        public void ReturnsNullOnInvalidContent(string content)
        {
            var ban = BanParser.FromGameOutput(content);

            Assert.Null(ban);
        }

        [Theory]
        [InlineData(" grilledham was banned by <server>. Reason: unspecified.")]
        [InlineData(" grilledham (not on map) was banned by <server>. Reason: unspecified.")]
        [InlineData(" grilled ham was banned by <server>. Reason: unspecified.")]
        [InlineData(" grilled ham (not on map) was banned by <server>. Reason: unspecified.")]
        public void ReturnsNullOnServerAdmin(string content)
        {
            var ban = BanParser.FromGameOutput(content);

            Assert.Null(ban);
        }
    }
}

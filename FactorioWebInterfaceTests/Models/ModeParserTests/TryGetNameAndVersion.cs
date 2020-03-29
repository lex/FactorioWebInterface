using Xunit;
using FactorioWebInterface.Models;

namespace FactorioWebInterfaceTests.Models.ModeParserTests
{
    public class TryGetNameAndVersion
    {
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData(" ")]
        [InlineData("_")]
        [InlineData(".zip")]
        [InlineData("_.zip")]
        [InlineData("abc")]
        [InlineData("abc_")]
        [InlineData("abc_.zip")]
        [InlineData("abc1.2.3")]
        [InlineData("_1.2.3")]
        [InlineData(" _1.2.3")]
        [InlineData("abc1.2.3.zip")]
        [InlineData("abc 1.2.3")]
        [InlineData("abc_12.3")]
        [InlineData("abc_1.2.3.4")]
        [InlineData("abc_-1.2.3")]
        [InlineData("abc_65536.2.3")]
        [InlineData("mod-list.json")]
        [InlineData("mod-settings.dat")]
        public void InvalidFileName_ReturnsFalse(string fileName)
        {
            bool result = ModParser.TryGetNameAndVersion(fileName, out string? modName, out string? version);

            Assert.False(result);
            Assert.Null(modName);
            Assert.Null(version);
        }

        [Theory]
        [InlineData("abc_1.2.3", "abc", "1.2.3")]
        [InlineData("abc_1.2.3.zip", "abc", "1.2.3")]
        [InlineData("abc_def_1.2.3.zip", "abc_def", "1.2.3")]
        [InlineData("abc def_1.2.3", "abc def", "1.2.3")]
        [InlineData("what-is-it-really-used-for_2.5.12.zip", "what-is-it-really-used-for", "2.5.12")]
        [InlineData("bobtech_0.18.3.zip", "bobtech", "0.18.3")]
        [InlineData("Squeak Through_1.8.0.zip", "Squeak Through", "1.8.0")]
        public void ValidFileName_ReturnsSuccess(string fileName, string expectedName, string expectedVersion)
        {
            bool result = ModParser.TryGetNameAndVersion(fileName, out string? modName, out string? version);

            Assert.True(result);
            Assert.Equal(expectedName, modName);
            Assert.Equal(expectedVersion, version);
        }
    }
}


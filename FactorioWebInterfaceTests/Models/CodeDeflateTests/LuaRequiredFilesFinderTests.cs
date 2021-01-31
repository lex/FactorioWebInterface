using FactorioWebInterface.Models.CodeDeflate;
using System;
using System.Collections.Generic;
using System.IO;
using Xunit;

namespace FactorioWebInterfaceTests.Models.CodeDeflateTests
{
    public sealed class LuaRequiredFilesFinderTests
    {
        [Fact]
        public void Empty()
        {
            var lines = Array.Empty<string>();
            var files = Array.Empty<string>();

            RunGetAllRequiredFiles(lines, files);
        }

        /// <summary>
        /// Mostly to test that certain strings don't cause an exception.
        /// </summary>        
        [Theory]
        [InlineData("")]
        [InlineData(" ")]
        [InlineData("   ")]
        [InlineData("\t")]
        [InlineData(" \t ")]
        [InlineData("", " ", "\t")]
        [InlineData("abc")]
        [InlineData("abc def")]
        [InlineData("abc,def")]
        [InlineData("abc", "def")]
        [InlineData("_abc")]
        [InlineData("abc_")]
        [InlineData("abc_def")]
        [InlineData("1abc")]
        [InlineData("abc1")]
        [InlineData("abc1def")]
        [InlineData(@"''")]
        [InlineData(@"'\''")]
        [InlineData(@"'\\''")]
        [InlineData(@"'\\\''")]
        [InlineData(@"'\\\\''")]
        [InlineData(@"""""")]
        [InlineData(@"""\""""")]
        [InlineData(@"""\\""""")]
        [InlineData(@"""\\\""""")]
        [InlineData(@"""\\\\""""")]
        [InlineData(@"'""'")]
        [InlineData(@"""'""")]
        [InlineData(@"'abc'")]
        [InlineData(@"""abc""")]
        [InlineData(@"'a\'bc'")]
        [InlineData(@"""a\""bc""")]
        [InlineData(@"[[]]")]
        [InlineData(@"[=[]=]")]
        [InlineData(@"[[abc]]")]
        [InlineData(@"[=[abc]=]")]
        [InlineData(@"--")]
        [InlineData(@"-")]
        [InlineData(@"- -")]
        [InlineData(@"----")]
        [InlineData(@"-- ")]
        [InlineData(@" --")]
        [InlineData(@"--abc")]
        [InlineData(@"-- abc ")]
        [InlineData(@"--abc--def")]
        [InlineData(@"--abc--[[]]def")]
        [InlineData(@"--[[]]")]
        [InlineData(@"--[[")]
        [InlineData(@"---[[]]")]
        [InlineData(@"----[[]]")]
        [InlineData(@"--[[--[[]]]]")]
        [InlineData(@"--[[]]--[[]]")]
        [InlineData(@"--[[--[[]]--]]")]
        [InlineData(@"--[[abc]]")]
        [InlineData(@"--[[abc", @"def]]")]
        [InlineData(@"--[[", @"abc", @"", @"def", @"]]")]
        [InlineData(@"--[[", @"abc--def", @"]]")]
        [InlineData(@"--[[", @"abc--[[def", @"]]")]
        [InlineData(@"--[[abc--]]")]
        [InlineData(@"--""")]
        [InlineData(@"--'")]
        [InlineData(@"--\""")]
        [InlineData(@"--\'")]
        [InlineData(@"--\\""")]
        [InlineData(@"--\\'")]
        [InlineData(@"""--""")]
        [InlineData(@"'--'")]
        [InlineData(@"""--[[]]""")]
        [InlineData(@"'--[[]]'")]
        [InlineData(@"""--[['']]""")]
        [InlineData(@"'--[[""""]]'")]
        [InlineData(@"[[--]]")]
        [InlineData(@"[[--[[]]]]")]
        [InlineData(@"--[[[=[]=]]]")]
        [InlineData(@"[[[[]]]]")]
        [InlineData(@"1")]
        [InlineData(@"123")]
        [InlineData(@"1,2,3")]
        [InlineData(@"1", @"2", @"3")]
        [InlineData(@"_1")]
        [InlineData(@"1_")]
        [InlineData(@"_1_")]
        [InlineData(@"_")]
        [InlineData(@"__")]
        [InlineData(@"'")]
        [InlineData(@"""")]
        [InlineData(@"'\")]
        [InlineData(@"""\")]
        [InlineData(@"'\'")]
        [InlineData(@"""\""")]
        [InlineData(@"[")]
        [InlineData(@"[[")]
        [InlineData(@"[[]")]
        [InlineData(@"[=[]=")]
        [InlineData(@"[ ")]
        [InlineData(@"[-")]
        [InlineData(@"[--")]
        [InlineData(@"[abc")]
        [InlineData(@"[ [")]
        [InlineData(@"[ [] ]")]
        [InlineData(@"require'")]
        [InlineData(@"require""")]
        [InlineData(@"require'\")]
        [InlineData(@"require""\")]
        [InlineData(@"require'\'")]
        [InlineData(@"require""\""")]
        public void SimpleCase(params string[] lines)
        {
            RunGetAllRequiredFiles(lines, Array.Empty<string>());
        }

        [Theory]
        [InlineData(@"require")]
        [InlineData(@"require()")]
        [InlineData(@"--require'some.file'")]
        [InlineData(@"--require 'some.file'")]
        [InlineData(@"-- require'some.file'")]
        [InlineData(@"-- --require'some.file'")]
        [InlineData(@"--[[require'some.file']]")]
        [InlineData(@"--[[require'some.file'")]
        [InlineData(@"--[[", @"require'some.file'", @"]]")]
        [InlineData(@"--[[", @"require'some.file'")]
        [InlineData(@"r'some.file'")]
        [InlineData(@"re'some.file'")]
        [InlineData(@"req'some.file'")]
        [InlineData(@"requ'some.file'")]
        [InlineData(@"requi'some.file'")]
        [InlineData(@"requir'some.file'")]
        [InlineData(@"_require'some.file'")]
        [InlineData(@"require1'some.file'")]
        [InlineData(@"require_'some.file'")]
        [InlineData(@"rrequire'some.file'")]
        [InlineData(@"rerequire'some.file'")]
        [InlineData(@"reqrequire'some.file'")]
        [InlineData(@"requrequire'some.file'")]
        [InlineData(@"requirequire'some.file'")]
        [InlineData(@"requirrequire'some.file'")]
        [InlineData(@"requirerequire'some.file'")]
        [InlineData(@"'require\'some.file\''")]
        [InlineData(@"""require'some.file'""")]
        [InlineData(@"[[require'some.file']]")]
        [InlineData(@"--[[", @"[=[]=]", @"require'some.file'")]
        [InlineData(@"-- [[]]require'some.file'")]
        [InlineData(@"                  ----require'some.file'")]
        [InlineData(@"['require""some.file""']")]
        public void NoRequire(params string[] lines)
        {
            RunGetAllRequiredFiles(lines, Array.Empty<string>());
        }

        [Theory]
        [InlineData(@"require'some.file'")]
        [InlineData(@"require""some.file""")]
        [InlineData(@"require[[some.file]]")]
        [InlineData(@"require[=[some.file]=]")]
        [InlineData(@"require[==[some.file]==]")]
        [InlineData(@"require[===[some.file]===]")]
        [InlineData(@" require'some.file'")]
        [InlineData(@" require""some.file""")]
        [InlineData(@"1,require'some.file'")]
        [InlineData(@"1,require""some.file""")]
        [InlineData(@"require 'some.file'")]
        [InlineData(@"require ""some.file""")]
        [InlineData(@"require('some.file')")]
        [InlineData(@"require(""some.file"")")]
        [InlineData(@"require(('some.file'))")]
        [InlineData(@"require((""some.file""))")]
        [InlineData(@"require ('some.file')")]
        [InlineData(@"require (""some.file"")")]
        [InlineData(@"require  'some.file'")]
        [InlineData(@"require  ""some.file""")]
        [InlineData(@"require   'some.file'")]
        [InlineData(@"require   ""some.file""")]
        [InlineData(@"require  ('some.file')")]
        [InlineData(@"require  (""some.file"")")]
        [InlineData(@"require   ('some.file')")]
        [InlineData(@"require   (""some.file"")")]
        [InlineData(@"require'some\z.file'")]
        [InlineData(@"require'some\z .file'")]
        [InlineData(@"require'some\z  .file'")]
        [InlineData(@"require'some\z    .file'")]
        [InlineData(@"require'some\z", @".file'")]
        [InlineData(@"require'some\z ", @".file'")]
        [InlineData(@"require'some\z ", @" .file'")]
        [InlineData(@"--[[]]require'some.file'")]
        [InlineData(@"--[[abc]]require'some.file'")]
        [InlineData(@"--[[--]]require'some.file'")]
        [InlineData(@"--[[]]--[[]]require'some.file'")]
        [InlineData(@"--[[--[[]]--[[]]require'some.file'")]
        [InlineData(@"'--',require'some.file'")]
        [InlineData(@"'--[[',require'some.file'")]
        [InlineData(@"""--"",require'some.file'")]
        [InlineData(@"""--[["",require'some.file'")]
        [InlineData(@"[[--]],require'some.file'")]
        [InlineData(@"[[--]]require'some.file'")]
        [InlineData(@"[[--[[]],require'some.file'")]
        [InlineData(@"[===[--]===],require'some.file'")]
        [InlineData(@"[===[--[[]===],require'some.file'")]
        [InlineData(@"require--[[]]'some.file'")]
        [InlineData(@"require--[[abc]]'some.file'")]
        [InlineData(@"require--[[--]]'some.file'")]
        [InlineData(@"require--[[]]--[[]]'some.file'")]
        [InlineData(@"require--[[--[[]]--[[]]'some.file'")]
        [InlineData(@"require", @"'some.file'")]
        [InlineData(@"require", @"", @"'some.file'")]
        [InlineData(@"require", @" ", @"'some.file'")]
        [InlineData(@"require", @"  ", @"'some.file'")]
        [InlineData(@"require", @"--", @"'some.file'")]
        [InlineData(@"require", @"--[[]]", @"'some.file'")]
        [InlineData(@"--[[", @"]]", @"require'some.file'")]
        [InlineData(@"--[[abc", @"]]", @"require'some.file'")]
        [InlineData(@"--[[", @"def]]", @"require'some.file'")]
        [InlineData(@"--[[abc", @"def]]", @"require'some.file'")]
        [InlineData(@"--[[", @"--", @"]]", @"require'some.file'")]
        [InlineData(@"--[[", @"require'some.file2'", @"]]", @"require'some.file'")]
        [InlineData(@"--[[", @"]=]", @"require'some.file2'", @"]]", @"require'some.file'")]
        [InlineData(@"--[[", @"]--]", @"require'some.file2'", @"]]", @"require'some.file'")]
        [InlineData(@"--[[", @"--[[", @"require'some.file2'", @"]]", @"require'some.file'")]
        [InlineData(@"--[[", @"]]--[[", @"require'some.file2'", @"]]", @"require'some.file'")]
        [InlineData(@"--[[", @"--[[", @"]]", @"require'some.file'")]
        [InlineData(@"--[[", @"[[", @"]]", @"[[]]", @"require'some.file'")]
        [InlineData(@"local x = require'some.file'")]
        [InlineData(@"local y = require""some.file""")]
        [InlineData(@"x = require'some.file'")]
        [InlineData(@"y = require""some.file""")]
        [InlineData(@"require require'some.file'")]
        [InlineData(@"require'some.file' require")]
        [InlineData(@"require'some.file'--require'some.file2'")]
        [InlineData(@"require'some.file'--[[require'some.file2']]")]
        [InlineData(@"--[[require'some.file2']]require'some.file'")]
        [InlineData(@"{require'some.file'}")]
        [InlineData(@"{", @"require'some.file'", @"}")]
        [InlineData(@"{", @"'abc,'", @"require'some.file'", @"'def'", @"}")]
        [InlineData(@"require[[", @"some.file]]")]
        [InlineData("require[[\nsome.file]]")]
        [InlineData("require[[\rsome.file]]")]
        [InlineData("require[[\n\rsome.file]]")]
        [InlineData("require[[\r\nsome.file]]")]
        [InlineData(@"[[--[[", @"--]],require'some.file'")]
        [InlineData(@"  ----[[", @"require'some.file'")]
        [InlineData(@"[require'some.file']")]
        [InlineData(@"[''], require'some.file'")]
        [InlineData(@"-require'some.file']")]
        public void SingleRequire(params string[] lines)
        {
            RunGetAllRequiredFiles(lines, new[] { "some/file" });
        }

        [Theory]
        [InlineData(@"some/file", '/', @"require'some.file'")]
        [InlineData(@"some/file", '/', @"require'some/file'")]
        [InlineData(@"some/file", '/', @"require'some\\file'")]
        [InlineData(@"some\file", '\\', @"require'some.file'")]
        [InlineData(@"some\file", '\\', @"require'some/file'")]
        [InlineData(@"some\file", '\\', @"require'some\\file'")]
        [InlineData(@"'some/file'", '/', @"require'\'some.file\''")]
        [InlineData(@"""some/file""", '/', @"require'\""some.file\""'")]
        [InlineData(@"""some/file""", '/', @"require'""some.file""'")]
        [InlineData(@"[[some/file]]", '/', @"require'[[some.file]]'")]
        [InlineData(@"[[some/file]]", '/', @"require""[[some.file]]""")]
        [InlineData(@"'some/file'", '/', @"require[['some.file']]")]
        [InlineData(@"""some/file""", '/', @"require[[""some.file""]]")]
        [InlineData(@"some/'/file", '/', @"require'some\\\'\\file'")]
        [InlineData(@"somez/file", '/', @"require'somez.file'")]
        [InlineData(@"some/z/file", '/', @"require'some\\z.file'")]
        [InlineData(@"some--/file", '/', @"require'some--.file'")]
        [InlineData(@"some--[[/file", '/', @"require'some--[[.file'")]
        [InlineData(@"some--/file", '/', @"require""some--.file""")]
        [InlineData(@"some--[[/file", '/', @"require""some--[[.file""")]
        [InlineData(@"some--/file", '/', @"require[[some--.file]]")]
        [InlineData(@"some--[[/file", '/', @"require[[some--[[.file]]")]
        [InlineData("\nsome/file", '/', "require[[\n\nsome.file]]")]
        [InlineData(" some/file", '/', "require[[ some.file]]")]
        [InlineData(" \nsome/file", '/', "require[[ \nsome.file]]")]
        [InlineData(" \n\nsome/file", '/', "require[[ \n\nsome.file]]")]
        public void SingleRequireComplex(string expected, char directorySeparatorChar, params string[] lines)
        {
            RunGetAllRequiredFiles(lines, new[] { expected }, directorySeparatorChar);
        }

        [Fact]
        public void MultipleRequiresOnSameLine()
        {
            var lines = new string[] { @"require'some.file1' require'some.file2'" };
            var files = new string[] { "some/file1", "some/file2" };

            RunGetAllRequiredFiles(lines, files);
        }

        [Fact]
        public void MultipleRequires()
        {
            var lines = new string[]
            {
                @"require'some.file1'",
                @"require""some.file2""",
                @"require('some.file3')",
                @"require(""some.file4"")",
                @"require 'some.file5'",
                @"require ""some.file6""",
                @"require[[some.file7]]",
                @"require([[some.file8]])",
            };
            var files = new string[]
            {
                "some/file1",
                "some/file2",
                "some/file3",
                "some/file4",
                "some/file5",
                "some/file6",
                "some/file7",
                "some/file8"
            };

            RunGetAllRequiredFiles(lines, files);
        }

        private static int[] bufferSizes = new[] { 1, 2, 4, 8, 16, 32, 64, 128, 256, 8192 };

        private static void RunGetAllRequiredFiles(string[] lines, string[] expectedFiles, char directorySeparatorChar = '/')
        {
            Stream stream = GetStream(lines);

            foreach (int bufferSize in bufferSizes)
            {
                stream.Position = 0;
                List<string> actualFiles = LuaRequiredFilesFinder.GetAllRequiredFiles(stream, directorySeparatorChar, bufferSize);
                Assert.Equal(expectedFiles, actualFiles);
            }
        }

        private static Stream GetStream(string[] lines)
        {
            var memoryStream = new MemoryStream();

            using (var sw = new StreamWriter(memoryStream, leaveOpen: true))
            {
                foreach (var line in lines)
                {
                    sw.WriteLine(line);
                }
            }

            memoryStream.Position = 0;
            return memoryStream;
        }
    }
}


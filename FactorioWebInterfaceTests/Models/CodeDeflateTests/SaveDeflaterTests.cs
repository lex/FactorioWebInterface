using FactorioWebInterface.Models.CodeDeflate;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using Xunit;

namespace FactorioWebInterfaceTests.Models.CodeDeflateTests
{
    public sealed class SaveDeflaterTests
    {
        [Fact]
        public void RequiredFilesAreKept()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "require 'file1' require 'file2'",
                ["scenario/file1.lua"] = "",
                ["scenario/file2.lua"] = "",
            };

            var expectedFiles = new[]
            {
                "scenario/control.lua",
                "scenario/file1.lua",
                "scenario/file2.lua"
            };

            using var zip = CreateZip(files);

            // Act.
            SaveDeflater.Deflate(zip);

            // Assert.
            AssertExpectedFiles(zip, expectedFiles);
        }

        [Fact]
        public void MultipleRequiredsForSameFile()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "require 'file1' require 'file2'",
                ["scenario/file1.lua"] = "require 'file2'",
                ["scenario/file2.lua"] = "",
            };

            var expectedFiles = new[]
            {
                "scenario/control.lua",
                "scenario/file1.lua",
                "scenario/file2.lua"
            };

            using var zip = CreateZip(files);

            // Act.
            SaveDeflater.Deflate(zip);

            // Assert.
            AssertExpectedFiles(zip, expectedFiles);
        }

        [Fact]
        public void IndirectRequiredFilesAreKept()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "require 'file1' require 'file2' require 'features.file2'",
                ["scenario/file1.lua"] = "require 'features.file1'",
                ["scenario/file2.lua"] = "require 'features.gui.file1'",
                ["scenario/features/file1.lua"] = "",
                ["scenario/features/file2.lua"] = "",
                ["scenario/features/gui/file1.lua"] = "",
            };

            var expectedFiles = new[]
            {
                "scenario/control.lua",
                "scenario/file1.lua",
                "scenario/file2.lua",
                "scenario/features/file1.lua",
                "scenario/features/file2.lua",
                "scenario/features/gui/file1.lua"
            };

            using var zip = CreateZip(files);

            // Act.
            SaveDeflater.Deflate(zip);

            // Assert.
            AssertExpectedFiles(zip, expectedFiles);
        }

        [Fact]
        public void NonRequiredLuaFilesAreRemoved()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "require 'file1' require 'features.file2'",
                ["scenario/file1.lua"] = "require 'features.file1'",
                ["scenario/file2.lua"] = "require 'features.gui.file1'",
                ["scenario/features/file1.lua"] = "",
                ["scenario/features/file2.lua"] = "",
                ["scenario/features/gui/file1.lua"] = "",
            };

            var expectedFiles = new[]
            {
                "scenario/control.lua",
                "scenario/file1.lua",                
                "scenario/features/file1.lua",
                "scenario/features/file2.lua",                
            };

            using var zip = CreateZip(files);

            // Act.
            SaveDeflater.Deflate(zip);

            // Assert.
            AssertExpectedFiles(zip, expectedFiles);
        }

        [Fact]
        public void NonLuaFilesAreKept()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "",
                ["scenario/readme.md"] = "",
                ["scenario/license"] = "",
                ["scenario/info.json"] = "",
                ["scenario/level-init.dat"] = "",
                ["scenario/level.dat0"] = "",
                ["scenario/level.dat1"] = "",
                ["scenario/level.datmetadata"] = "",
                ["scenario/script.dat"] = "",
                ["scenario/locale/en/text.cfg"] = "",
                ["scenario/image.png"] = "",
                ["scenario/image.jpg"] = "",
            };

            var expectedFiles = new[]
            {
                "scenario/control.lua",
                "scenario/readme.md",
                "scenario/license",
                "scenario/info.json",
                "scenario/level-init.dat",
                "scenario/level.dat0",
                "scenario/level.dat1",
                "scenario/level.datmetadata",
                "scenario/script.dat",
                "scenario/locale/en/text.cfg",
                "scenario/image.png",
                "scenario/image.jpg"
            };

            using var zip = CreateZip(files);

            // Act.
            SaveDeflater.Deflate(zip);

            // Assert.
            AssertExpectedFiles(zip, expectedFiles);
        }

        [Fact]
        public void PreviewAndGitBannerAreRemoved()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "",
                ["scenario/preview.jpg"] = "",
                ["scenario/redmew_git_banner.png"] = "",
            };

            var expectedFiles = new[]
            {
                "scenario/control.lua"
            };

            using var zip = CreateZip(files);

            // Act.
            SaveDeflater.Deflate(zip);

            // Assert.
            AssertExpectedFiles(zip, expectedFiles);
        }

        [Fact]
        public void MissingRequiresDoNotCauseErrors()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "require 'file1' require '' require '.' require '..' require '../' require '../../'",
            };

            var expectedFiles = new[]
            {
                "scenario/control.lua"
            };

            using var zip = CreateZip(files);

            // Act.
            SaveDeflater.Deflate(zip);

            // Assert.
            AssertExpectedFiles(zip, expectedFiles);
        }

        private static void AssertExpectedFiles(Stream stream, IEnumerable<string> expectedFiles)
        {
            stream.Position = 0;
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: true);

            var actualFiles = archive.Entries.Select(x => x.FullName).OrderBy(x => x);
            expectedFiles = expectedFiles.OrderBy(x => x);
            Assert.Equal(expectedFiles, actualFiles);
        }

        private static Stream CreateZip(Dictionary<string, string> files)
        {
            var memory = new MemoryStream();
            using var archive = new ZipArchive(memory, ZipArchiveMode.Update, leaveOpen: true);

            foreach (var file in files)
            {
                using var stream = archive.CreateEntry(file.Key).Open();
                using var streamWriter = new StreamWriter(stream, leaveOpen: true);
                streamWriter.Write(file.Value);
            }

            memory.Position = 0;
            return memory;
        }
    }
}

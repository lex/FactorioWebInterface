using FactorioWebInterface.Models.CodeDeflate;
using FactorioWebInterfaceTests.Utils;
using System.Collections.Generic;
using System.IO;
using System.IO.Abstractions;
using System.IO.Abstractions.TestingHelpers;
using System.Linq;
using Xunit;

namespace FactorioWebInterfaceTests.Models.CodeDeflateTests
{
    public class ScenarioBuilderTests
    {
        [Fact]
        public void BuildFromTemplates_EmptyWhenZipIsEmpty()
        {
            // Arrange.
            var files = new Dictionary<string, string>();
            using Stream stream = FileHelper.StreamFromZipFiles(files);

            var fileSystem = new MockFileSystem();
            IDirectoryInfo scenarioDirectory = fileSystem.DirectoryInfo.FromDirectoryName("/scenarios");

            // Act.
            ScenarioBuilder.BuildFromTemplates(stream, "scenario_templates", scenarioDirectory);

            // Assert.
            var expectedFiles = new Dictionary<string, string>();

            AssertExpectedFiles(fileSystem, expectedFiles);
            AssertNoExtraFiles(fileSystem, "/scenarios", expectedFiles);
        }

        [Fact]
        public void BuildFromTemplates_EmptyWhenNoTemplates()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "require 'file1'",
            };
            using Stream stream = FileHelper.StreamFromZipFiles(files);

            var fileSystem = new MockFileSystem();
            IDirectoryInfo scenarioDirectory = fileSystem.DirectoryInfo.FromDirectoryName("/scenarios");

            // Act.
            ScenarioBuilder.BuildFromTemplates(stream, "scenario_templates", scenarioDirectory);

            // Assert.
            var expectedFiles = new Dictionary<string, string>();

            AssertExpectedFiles(fileSystem, expectedFiles);
            AssertNoExtraFiles(fileSystem, "/scenarios", expectedFiles);
        }

        [Fact]
        public void BuildFromTemplates_EmptyWhenEmptyTemplates()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "require 'file1'",
                ["scenario/scenario_templates/scenario1/"] = ""
            };
            using Stream stream = FileHelper.StreamFromZipFiles(files);

            var fileSystem = new MockFileSystem();
            IDirectoryInfo scenarioDirectory = fileSystem.DirectoryInfo.FromDirectoryName("/scenarios");

            // Act.
            ScenarioBuilder.BuildFromTemplates(stream, "scenario_templates", scenarioDirectory);

            // Assert.
            var expectedFiles = new Dictionary<string, string>();

            AssertExpectedFiles(fileSystem, expectedFiles);
            AssertNoExtraFiles(fileSystem, "/scenarios", expectedFiles);
        }

        [Fact]
        public void BuildFromTemplates_OneTemplateWithLuaFiles()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "require 'file1'",
                ["scenario/file1.lua"] = "base",
                ["scenario/scenario_templates/scenario1/file1.lua"] = "scenario1"
            };
            using Stream stream = FileHelper.StreamFromZipFiles(files);

            var fileSystem = new MockFileSystem();
            IDirectoryInfo scenarioDirectory = fileSystem.DirectoryInfo.FromDirectoryName("/scenarios");

            // Act.
            ScenarioBuilder.BuildFromTemplates(stream, "scenario_templates", scenarioDirectory);

            // Assert.
            var expectedFiles = new Dictionary<string, string>()
            {
                ["/scenarios/scenario1/control.lua"] = "require 'file1'",
                ["/scenarios/scenario1/file1.lua"] = "scenario1",
            };

            AssertExpectedFiles(fileSystem, expectedFiles);
            AssertNoExtraFiles(fileSystem, "/scenarios", expectedFiles);
        }

        [Fact]
        public void BuildFromTemplates_OneTemplateWithNonLuaFiles()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "base",
                ["scenario/file1.txt"] = "base",
                ["scenario/scenario_templates/scenario1/file1.txt"] = "scenario1"
            };
            using Stream stream = FileHelper.StreamFromZipFiles(files);

            var fileSystem = new MockFileSystem();
            IDirectoryInfo scenarioDirectory = fileSystem.DirectoryInfo.FromDirectoryName("/scenarios");

            // Act.
            ScenarioBuilder.BuildFromTemplates(stream, "scenario_templates", scenarioDirectory);

            // Assert.
            var expectedFiles = new Dictionary<string, string>()
            {
                ["/scenarios/scenario1/control.lua"] = "base",
                ["/scenarios/scenario1/file1.txt"] = "scenario1",
            };

            AssertExpectedFiles(fileSystem, expectedFiles);
            AssertNoExtraFiles(fileSystem, "/scenarios", expectedFiles);
        }

        [Fact]
        public void BuildFromTemplates_OneTemplateWithExtraNonLuaFiles()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "base",
                ["scenario/file1.txt"] = "base",
                ["scenario/scenario_templates/scenario1/file2.txt"] = "scenario1"
            };
            using Stream stream = FileHelper.StreamFromZipFiles(files);

            var fileSystem = new MockFileSystem();
            IDirectoryInfo scenarioDirectory = fileSystem.DirectoryInfo.FromDirectoryName("/scenarios");

            // Act.
            ScenarioBuilder.BuildFromTemplates(stream, "scenario_templates", scenarioDirectory);

            // Assert.
            var expectedFiles = new Dictionary<string, string>()
            {
                ["/scenarios/scenario1/control.lua"] = "base",
                ["/scenarios/scenario1/file1.txt"] = "base",
                ["/scenarios/scenario1/file2.txt"] = "scenario1",
            };

            AssertExpectedFiles(fileSystem, expectedFiles);
            AssertNoExtraFiles(fileSystem, "/scenarios", expectedFiles);
        }

        [Fact]
        public void BuildFromTemplates_UnusedLuaFileAreIgnored()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "require 'file1'",
                ["scenario/file1.lua"] = "base",
                ["scenario/scenario_templates/scenario1/control.lua"] = "scenario1"
            };
            using Stream stream = FileHelper.StreamFromZipFiles(files);

            var fileSystem = new MockFileSystem();
            IDirectoryInfo scenarioDirectory = fileSystem.DirectoryInfo.FromDirectoryName("/scenarios");

            // Act.
            ScenarioBuilder.BuildFromTemplates(stream, "scenario_templates", scenarioDirectory);

            // Assert.
            var expectedFiles = new Dictionary<string, string>()
            {
                ["/scenarios/scenario1/control.lua"] = "scenario1"
            };

            AssertExpectedFiles(fileSystem, expectedFiles);
            AssertNoExtraFiles(fileSystem, "/scenarios", expectedFiles);
        }

        [Fact]
        public void BuildFromTemplates_UnusedLuaFileInTemplateAreIgnored()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "base",
                ["scenario/scenario_templates/scenario1/file1.lua"] = "scenario1"
            };
            using Stream stream = FileHelper.StreamFromZipFiles(files);

            var fileSystem = new MockFileSystem();
            IDirectoryInfo scenarioDirectory = fileSystem.DirectoryInfo.FromDirectoryName("/scenarios");

            // Act.
            ScenarioBuilder.BuildFromTemplates(stream, "scenario_templates", scenarioDirectory);

            // Assert.
            var expectedFiles = new Dictionary<string, string>()
            {
                ["/scenarios/scenario1/control.lua"] = "base"
            };

            AssertExpectedFiles(fileSystem, expectedFiles);
            AssertNoExtraFiles(fileSystem, "/scenarios", expectedFiles);
        }

        [Fact]
        public void BuildFromTemplates_CanUseFilesThatAreOnlyInTemplate()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "require 'file1' require 'folder.file2'",
                ["scenario/scenario_templates/scenario1/file1.lua"] = "require 'file3'",
                ["scenario/scenario_templates/scenario1/folder/file2.lua"] = "require 'folder.file4'",
                ["scenario/scenario_templates/scenario1/file3.lua"] = "scenario1",
                ["scenario/scenario_templates/scenario1/folder/file4.lua"] = "scenario1",
            };
            using Stream stream = FileHelper.StreamFromZipFiles(files);

            var fileSystem = new MockFileSystem();
            IDirectoryInfo scenarioDirectory = fileSystem.DirectoryInfo.FromDirectoryName("/scenarios");

            // Act.
            ScenarioBuilder.BuildFromTemplates(stream, "scenario_templates", scenarioDirectory);

            // Assert.
            var expectedFiles = new Dictionary<string, string>()
            {
                ["/scenarios/scenario1/control.lua"] = "require 'file1' require 'folder.file2'",
                ["/scenarios/scenario1/file1.lua"] = "require 'file3'",
                ["/scenarios/scenario1/folder/file2.lua"] = "require 'folder.file4'",
                ["/scenarios/scenario1/file3.lua"] = "scenario1",
                ["/scenarios/scenario1/folder/file4.lua"] = "scenario1",
            };

            AssertExpectedFiles(fileSystem, expectedFiles);
            AssertNoExtraFiles(fileSystem, "/scenarios", expectedFiles);
        }

        [Fact]
        public void BuildFromTemplates_MissingRequiredLuaFilesAreIgnored()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "require 'file1' require 'file2'",
                ["scenario/scenario_templates/scenario1/file1.lua"] = "require 'file3'"
            };
            using Stream stream = FileHelper.StreamFromZipFiles(files);

            var fileSystem = new MockFileSystem();
            IDirectoryInfo scenarioDirectory = fileSystem.DirectoryInfo.FromDirectoryName("/scenarios");

            // Act.
            ScenarioBuilder.BuildFromTemplates(stream, "scenario_templates", scenarioDirectory);

            // Assert.
            var expectedFiles = new Dictionary<string, string>()
            {
                ["/scenarios/scenario1/control.lua"] = "require 'file1' require 'file2'",
                ["/scenarios/scenario1/file1.lua"] = "require 'file3'"
            };

            AssertExpectedFiles(fileSystem, expectedFiles);
            AssertNoExtraFiles(fileSystem, "/scenarios", expectedFiles);
        }

        [Fact]
        public void BuildFromTemplates_TwoTemplates()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "require 'file1'",
                ["scenario/file1.lua"] = "require 'folder.file2'",
                ["scenario/folder/file2.lua"] = "base",
                ["scenario/locale/en/file.cfg"] = "base",
                ["scenario/scenario_templates/scenario1/file1.lua"] = "scenario1",
                ["scenario/scenario_templates/scenario1/locale/en/file2.cfg"] = "scenario1",
                ["scenario/scenario_templates/scenario2/folder/file2.lua"] = "scenario2",
                ["scenario/scenario_templates/scenario2/locale/en/file.cfg"] = "scenario2"
            };
            using Stream stream = FileHelper.StreamFromZipFiles(files);

            var fileSystem = new MockFileSystem();
            IDirectoryInfo scenarioDirectory = fileSystem.DirectoryInfo.FromDirectoryName("/scenarios");

            // Act.
            ScenarioBuilder.BuildFromTemplates(stream, "scenario_templates", scenarioDirectory);

            // Assert.
            var expectedFiles = new Dictionary<string, string>()
            {
                ["/scenarios/scenario1/control.lua"] = "require 'file1'",
                ["/scenarios/scenario1/file1.lua"] = "scenario1",
                ["/scenarios/scenario1/locale/en/file.cfg"] = "base",
                ["/scenarios/scenario1/locale/en/file2.cfg"] = "scenario1",
                ["/scenarios/scenario2/control.lua"] = "require 'file1'",
                ["/scenarios/scenario2/file1.lua"] = "require 'folder.file2'",
                ["/scenarios/scenario2/folder/file2.lua"] = "scenario2",
                ["/scenarios/scenario2/locale/en/file.cfg"] = "scenario2",
            };

            AssertExpectedFiles(fileSystem, expectedFiles);
            AssertNoExtraFiles(fileSystem, "/scenarios", expectedFiles);
        }

        [Fact]
        public void BuildFromTemplates_IgnoreHiddenFilesAndDirectories()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "base",
                ["scenario/.hiddenfile.lua"] = "base",
                ["scenario/.hiddenfile.txt"] = "base",
                ["scenario/.hiddenFolder/file.lua"] = "base",
                ["scenario/.hiddenFolder/file.txt"] = "base",
                ["scenario/scenario_templates/scenario1/control.lua"] = "scenario1",
            };
            using Stream stream = FileHelper.StreamFromZipFiles(files);

            var fileSystem = new MockFileSystem();
            IDirectoryInfo scenarioDirectory = fileSystem.DirectoryInfo.FromDirectoryName("/scenarios");

            // Act.
            ScenarioBuilder.BuildFromTemplates(stream, "scenario_templates", scenarioDirectory);

            // Assert.
            var expectedFiles = new Dictionary<string, string>()
            {
                ["/scenarios/scenario1/control.lua"] = "scenario1"
            };

            AssertExpectedFiles(fileSystem, expectedFiles);
            AssertNoExtraFiles(fileSystem, "/scenarios", expectedFiles);
        }

        [Fact]
        public void BuildFromTemplates_IgnoreHiddenFilesAndDirectoriesInTemplate()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/control.lua"] = "base",
                ["scenario/scenario_templates/scenario1/control.lua"] = "scenario1",
                ["scenario/scenario_templates/scenario1/.hiddenfile.lua"] = "scenario1",
                ["scenario/scenario_templates/scenario1/.hiddenfile.txt"] = "scenario1",
                ["scenario/scenario_templates/scenario1/.hiddenFolder/file.lua"] = "scenario1",
                ["scenario/scenario_templates/scenario1/.hiddenFolder/file.txt"] = "scenario1",
            };
            using Stream stream = FileHelper.StreamFromZipFiles(files);

            var fileSystem = new MockFileSystem();
            IDirectoryInfo scenarioDirectory = fileSystem.DirectoryInfo.FromDirectoryName("/scenarios");

            // Act.
            ScenarioBuilder.BuildFromTemplates(stream, "scenario_templates", scenarioDirectory);

            // Assert.
            var expectedFiles = new Dictionary<string, string>()
            {
                ["/scenarios/scenario1/control.lua"] = "scenario1"
            };

            AssertExpectedFiles(fileSystem, expectedFiles);
            AssertNoExtraFiles(fileSystem, "/scenarios", expectedFiles);
        }

        private static void AssertExpectedFiles(IFileSystem fileSystem, Dictionary<string, string> expectedFiles)
        {
            foreach (var file in expectedFiles)
            {
                Assert.True(fileSystem.File.Exists(file.Key), $"File '{file.Key}' does not exist.");

                string actual = fileSystem.File.ReadAllText(file.Key);
                Assert.Equal(file.Value, actual);
            }
        }

        private static void AssertNoExtraFiles(IFileSystem fileSystem, string searchDirectory, Dictionary<string, string> expectedFiles)
        {
            IDirectoryInfo diretory = fileSystem.DirectoryInfo.FromDirectoryName(searchDirectory);

            IEnumerable<string> foundFiles;
            if (diretory.Exists)
            {
                foundFiles = diretory.EnumerateFiles("*", SearchOption.AllDirectories)
                .Select(x => x.FullName)
                .OrderBy(x => x);
            }
            else
            {
                foundFiles = Enumerable.Empty<string>();
            }

            var sortedExpectedFiles = expectedFiles.Keys
                .Select(x => fileSystem.Path.GetFullPath(x))
                .OrderBy(x => x);

            Assert.Equal(sortedExpectedFiles, foundFiles);
        }
    }
}

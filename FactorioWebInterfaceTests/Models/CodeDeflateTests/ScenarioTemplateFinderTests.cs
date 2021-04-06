using FactorioWebInterface.Models.CodeDeflate;
using FactorioWebInterfaceTests.Utils;
using System.Collections.Generic;
using System.IO.Compression;
using System.Linq;
using Xunit;

namespace FactorioWebInterfaceTests.Models.CodeDeflateTests
{
    public class ScenarioTemplateFinderTests
    {
        [Fact]
        public void GetScenarioTemplates_NoFiles()
        {
            // Arrange.
            var files = new Dictionary<string, string>();

            using ZipArchive zip = FileHelper.MakeZipArchive(files);

            // Act.
            IEnumerable<ScenarioTemplate> result = ScenarioTemplateFinder.GetScenarioTemplates(zip, "scenario_templates", "scenario");

            // Assert.
            Assert.Empty(result);
        }

        [Fact]
        public void GetScenarioTemplates_MissingTemplates()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/map_selection.lua"] = ""
            };

            using ZipArchive zip = FileHelper.MakeZipArchive(files);

            // Act.
            IEnumerable<ScenarioTemplate> result = ScenarioTemplateFinder.GetScenarioTemplates(zip, "scenario_templates", "scenario");

            // Assert.
            Assert.Empty(result);
        }

        [Fact]
        public void GetScenarioTemplates_NoTemplates()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/map_selection.lua"] = ""
            };

            using ZipArchive zip = FileHelper.MakeZipArchive(files);
            zip.CreateEntry("scenario/scenario_templates/");

            // Act.
            IEnumerable<ScenarioTemplate> result = ScenarioTemplateFinder.GetScenarioTemplates(zip, "scenario_templates", "scenario");

            // Assert.
            Assert.Empty(result);
        }

        [Theory]
        [InlineData("scenario_templates", "scenario")]
        [InlineData("scenario_templates/", "scenario")]
        [InlineData("scenario_templates", "scenario/")]
        [InlineData("scenario_templates/", "scenario/")]
        public void GetScenarioTemplates_TwoTemplates(string scenarioTemplatesDirectory, string directoryPrefix)
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/map_selection.lua"] = "",
                ["scenario/scenario_templates/scenario1/map_selection.lua"] = "",
                ["scenario/scenario_templates/scenario2/folder/file1.lua"] = "",
                ["scenario/scenario_templates/scenario2/folder/file2.lua"] = ""
            };

            using ZipArchive zip = FileHelper.MakeZipArchive(files);

            // Act.
            IEnumerable<ScenarioTemplate> result = ScenarioTemplateFinder.GetScenarioTemplates(zip, scenarioTemplatesDirectory, directoryPrefix);

            // Assert.
            ScenarioTemplate[] templates = result.OrderBy(t => t.ScenarioName).ToArray();

            var scenario1FileOverrides = new Dictionary<string, string>()
            {
                ["scenario/map_selection.lua"] = "scenario/scenario_templates/scenario1/map_selection.lua"
            };
            AssertScenarioTemplate(templates[0], "scenario1", scenario1FileOverrides, new Dictionary<string, string>());

            var scenario2FileOverrides = new Dictionary<string, string>()
            {
                ["scenario/folder/file1.lua"] = "scenario/scenario_templates/scenario2/folder/file1.lua",
                ["scenario/folder/file2.lua"] = "scenario/scenario_templates/scenario2/folder/file2.lua"
            };
            AssertScenarioTemplate(templates[1], "scenario2", scenario2FileOverrides, new Dictionary<string, string>());
        }

        [Fact]
        public void GetScenarioTemplates_EmptyTemplatesAreIgnored()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/map_selection.lua"] = "",
            };

            using ZipArchive zip = FileHelper.MakeZipArchive(files);
            zip.CreateEntry("scenario/scenario_templates/scenario1/");

            // Act.
            IEnumerable<ScenarioTemplate> result = ScenarioTemplateFinder.GetScenarioTemplates(zip, "scenario_templates", "scenario");

            // Assert.
            Assert.Empty(result);
        }

        [Theory]
        [InlineData("scenario_templates", "scenario/wrong_folder/scenario1/map_selection.lua")]
        [InlineData("scenario_templates", "scenario/wrong_folder/scenario_templates/scenario1/map_selection.lua")]
        [InlineData("scenario_templates2", "scenario/scenario_templates/scenario1/map_selection.lua")]
        [InlineData("scenario_templates", "scenario/scenario_templates2/scenario1/map_selection.lua")]
        [InlineData("2scenario_templates2", "scenario/scenario_templates/scenario1/map_selection.lua")]
        [InlineData("scenario_templates", "scenario/2scenario_templates/scenario1/map_selection.lua")]
        public void GetScenarioTemplates_TemplatesInWrongFolderAreIgnored(string templatesName, string templateFile)
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/map_selection.lua"] = "",
                [templateFile] = "",
            };

            using ZipArchive zip = FileHelper.MakeZipArchive(files);
            zip.CreateEntry("scenario/scenario_templates/scenario1/");

            // Act.
            IEnumerable<ScenarioTemplate> result = ScenarioTemplateFinder.GetScenarioTemplates(zip, templatesName, "scenario");

            // Assert.
            Assert.Empty(result);
        }

        [Fact]
        public void GetScenarioTemplates_NonLuaFiles()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/map_selection.lua"] = "",
                ["scenario/image.png"] = "",
                ["scenario/scenario_templates/scenario1/image.png"] = "",
                ["scenario/scenario_templates/scenario2/folder/image1.png"] = "",
                ["scenario/scenario_templates/scenario2/folder/image2.png"] = ""
            };

            using ZipArchive zip = FileHelper.MakeZipArchive(files);

            // Act.
            IEnumerable<ScenarioTemplate> result = ScenarioTemplateFinder.GetScenarioTemplates(zip, "scenario_templates", "scenario");

            // Assert.
            ScenarioTemplate[] templates = result.OrderBy(t => t.ScenarioName).ToArray();

            var scenario1FileOverrides = new Dictionary<string, string>()
            {
                ["scenario/image.png"] = "scenario/scenario_templates/scenario1/image.png"
            };
            AssertScenarioTemplate(templates[0], "scenario1", new Dictionary<string, string>(), scenario1FileOverrides);

            var scenario2FileOverrides = new Dictionary<string, string>()
            {
                ["scenario/folder/image1.png"] = "scenario/scenario_templates/scenario2/folder/image1.png",
                ["scenario/folder/image2.png"] = "scenario/scenario_templates/scenario2/folder/image2.png"
            };
            AssertScenarioTemplate(templates[1], "scenario2", new Dictionary<string, string>(), scenario2FileOverrides);
        }

        [Fact]
        public void GetScenarioTemplates_MissingExtensionFiles()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/map_selection.lua"] = "",
                ["scenario/file"] = "",
                ["scenario/scenario_templates/scenario1/file"] = ""
            };

            using ZipArchive zip = FileHelper.MakeZipArchive(files);

            // Act.
            IEnumerable<ScenarioTemplate> result = ScenarioTemplateFinder.GetScenarioTemplates(zip, "scenario_templates", "scenario");

            // Assert.
            ScenarioTemplate[] templates = result.OrderBy(t => t.ScenarioName).ToArray();

            var scenarioFileOverrides = new Dictionary<string, string>()
            {
                ["scenario/file"] = "scenario/scenario_templates/scenario1/file"
            };
            AssertScenarioTemplate(templates[0], "scenario1", new Dictionary<string, string>(), scenarioFileOverrides);
        }

        [Fact]
        public void GetScenarioTemplates_IgnoreHiddenFilesAndDirectories()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/map_selection.lua"] = "",
                ["scenario/.file.lua"] = "",
                ["scenario/.file.txt"] = "",
                ["scenario/.folder/file.lua"] = "",
                ["scenario/.folder/file.txt"] = "",
                ["scenario/scenario_templates/scenario1/map_selection.lua"] = ""
            };

            using ZipArchive zip = FileHelper.MakeZipArchive(files);

            // Act.
            IEnumerable<ScenarioTemplate> result = ScenarioTemplateFinder.GetScenarioTemplates(zip, "scenario_templates", "scenario");

            // Assert.
            ScenarioTemplate[] templates = result.OrderBy(t => t.ScenarioName).ToArray();

            var scenarioFileOverrides = new Dictionary<string, string>()
            {
                ["scenario/map_selection.lua"] = "scenario/scenario_templates/scenario1/map_selection.lua"
            };
            AssertScenarioTemplate(templates[0], "scenario1", scenarioFileOverrides, new Dictionary<string, string>());
        }

        [Fact]
        public void GetScenarioTemplates_IgnoreHiddenFilesAndDirectoriesInTemplate()
        {
            // Arrange.
            var files = new Dictionary<string, string>()
            {
                ["scenario/map_selection.lua"] = "",
                ["scenario/scenario_templates/scenario1/.file.lua"] = "",
                ["scenario/scenario_templates/scenario1/.file.txt"] = "",
                ["scenario/scenario_templates/scenario1/.folder/file.lua"] = "",
                ["scenario/scenario_templates/scenario1/.folder/file.txt"] = "",
                ["scenario/scenario_templates/scenario1/map_selection.lua"] = ""
            };

            using ZipArchive zip = FileHelper.MakeZipArchive(files);

            // Act.
            IEnumerable<ScenarioTemplate> result = ScenarioTemplateFinder.GetScenarioTemplates(zip, "scenario_templates", "scenario");

            // Assert.
            ScenarioTemplate[] templates = result.OrderBy(t => t.ScenarioName).ToArray();

            var scenarioFileOverrides = new Dictionary<string, string>()
            {
                ["scenario/map_selection.lua"] = "scenario/scenario_templates/scenario1/map_selection.lua"
            };
            AssertScenarioTemplate(templates[0], "scenario1", scenarioFileOverrides, new Dictionary<string, string>());
        }

        private static void AssertScenarioTemplate(ScenarioTemplate template, string scenarioName, Dictionary<string, string> luaFileOverrides, Dictionary<string, string> nonLuaFileOverrides)
        {
            Assert.Equal(scenarioName, template.ScenarioName);
            Assert.Equal(luaFileOverrides, template.LuaFileOverrides);
            Assert.Equal(nonLuaFileOverrides, template.NonLuaFileOverrides);
        }
    }
}

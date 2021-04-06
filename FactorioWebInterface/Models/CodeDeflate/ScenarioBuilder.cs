using FactorioWebInterface.Utils;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.IO.Abstractions;
using System.IO.Compression;
using System.Linq;

namespace FactorioWebInterface.Models.CodeDeflate
{
    public sealed class ScenarioBuilder : IDisposable
    {
        private readonly HashSet<string> usedLuaFiles = new();
        private readonly Queue<string> luaFileQueue = new();

        private string directoryPrefix = "";
        private readonly ZipArchive archive;

        private IEnumerable<ScenarioTemplate> scenarioTemplates = Enumerable.Empty<ScenarioTemplate>();
        private List<string> baseNonLuaFiles = new List<string>();

        private readonly LuaRequiredFilesFinder parser = new LuaRequiredFilesFinder(directorySeparatorChar: '/', bufferSize: 8192);

        private ScenarioBuilder(Stream source, string templateDirectory)
        {
            archive = new ZipArchive(source, ZipArchiveMode.Read, leaveOpen: true);

            FirstTimeSetup(templateDirectory);
        }

        public void Dispose()
        {
            archive.Dispose();
        }

        public static void BuildFromTemplates(Stream source, string templateDirectory, IDirectoryInfo targetDirectory)
        {
            using var scenarioBuilder = new ScenarioBuilder(source, templateDirectory);
            scenarioBuilder.BuildFromTemplates(targetDirectory);
        }

        private void BuildFromTemplates(IDirectoryInfo targetDirectory)
        {
            foreach (ScenarioTemplate template in scenarioTemplates)
            {
                Setup(template, targetDirectory);
                ProcessQueue(template);
                CopyScenarioFiles(template, targetDirectory);
            }
        }

        private void FirstTimeSetup(string templateDirectory)
        {
            ReadOnlyCollection<ZipArchiveEntry> entries = archive.Entries;
            if (entries.Count == 0)
            {
                return;
            }

            string fullName = entries[0].FullName;
            int end = fullName.IndexOf('/');

            if (end > 0)
            {
                directoryPrefix = fullName.Substring(0, end + 1);
            }

            scenarioTemplates = ScenarioTemplateFinder.GetScenarioTemplates(archive, templateDirectory, directoryPrefix);

            string templateDirectoryPrefix = directoryPrefix + templateDirectory;

            HashSet<string> removeFiles = new();
            removeFiles.Add($"{directoryPrefix}preview.jpg");
            removeFiles.Add($"{directoryPrefix}redmew_git_banner.png");

            foreach (ZipArchiveEntry entry in entries)
            {
                string name = entry.Name;
                if (string.IsNullOrWhiteSpace(name) || name.EndsWith(".lua", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                string entryFullName = entry.FullName;
                if (removeFiles.Contains(entryFullName) || entryFullName.StartsWith(templateDirectoryPrefix))
                {
                    continue;
                }

                // Filter out hidden directories and files that start with a dot (.)
                if (entryFullName.Contains("/.", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                baseNonLuaFiles.Add(entryFullName);
            }
        }

        private void Setup(ScenarioTemplate template, IDirectoryInfo targetDirectory)
        {
            IFileSystem fileSystem = targetDirectory.FileSystem;

            string targetScenarioDirectory = fileSystem.Path.Combine(targetDirectory.FullName, template.ScenarioName);
            fileSystem.DeleteDirectoryIfExists(targetScenarioDirectory);

            usedLuaFiles.Clear();
            luaFileQueue.Clear();

            AddFileToQueue("control.lua");
        }

        private void ProcessQueue(ScenarioTemplate template)
        {
            Dictionary<string, string> luaFileOverrides = template.LuaFileOverrides;

            while (luaFileQueue.Count > 0)
            {
                string fileName = luaFileQueue.Dequeue();
                if (luaFileOverrides.TryGetValue(fileName, out string? overrideFileName))
                {
                    fileName = overrideFileName;
                }

                if (archive.GetEntry(fileName) is ZipArchiveEntry entry)
                {
                    using var stream = entry.Open();
                    ProcessFile(stream);
                }
            }

            void ProcessFile(Stream file)
            {
                parser.ParseStream(file);
                foreach (string fileName in parser.Requires)
                {
                    AddFileToQueue(fileName);
                }
            }
        }

        private void CopyScenarioFiles(ScenarioTemplate template, IDirectoryInfo targetDirectory)
        {
            Dictionary<string, string> fileOverrides = template.LuaFileOverrides;
            string scenarioName = template.ScenarioName;

            foreach (string baseFilePath in usedLuaFiles)
            {
                fileOverrides.TryGetValue(baseFilePath, out string? templateFilePath);
                string sourceFilePath = templateFilePath ?? baseFilePath;

                CopyFile(baseFilePath, sourceFilePath, scenarioName, targetDirectory);
            }

            foreach (string baseFilePath in baseNonLuaFiles)
            {
                CopyFile(baseFilePath, baseFilePath, scenarioName, targetDirectory);
            }

            foreach (KeyValuePair<string, string> file in template.NonLuaFileOverrides)
            {
                CopyFile(file.Key, file.Value, scenarioName, targetDirectory);
            }
        }

        private void CopyFile(string baseFilePath, string sourceFilePath, string scenarioName, IDirectoryInfo targetDirectory)
        {
            IFileSystem fileSystem = targetDirectory.FileSystem;

            if (archive.GetEntry(sourceFilePath) is ZipArchiveEntry entry)
            {
                string relativePath = baseFilePath.Substring(directoryPrefix.Length);
                string newPath = fileSystem.Path.Combine(targetDirectory.FullName, scenarioName, relativePath);

                entry.TryCopyToFile(newPath, fileSystem);
            }
        }

        private void AddFileToQueue(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return;
            }

            string fullName = $"{directoryPrefix}{fileName}{(fileName.EndsWith(".lua") ? "" : ".lua")}";
            if (usedLuaFiles.Add(fullName))
            {
                luaFileQueue.Enqueue(fullName);
            }
        }
    }
}

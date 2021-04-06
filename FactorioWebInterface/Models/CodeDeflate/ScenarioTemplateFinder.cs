using System;
using System.Collections.Generic;
using System.IO.Compression;
using System.Linq;

namespace FactorioWebInterface.Models.CodeDeflate
{
    public class ScenarioTemplateFinder
    {
        public static IEnumerable<ScenarioTemplate> GetScenarioTemplates(ZipArchive archive, string templateDirectory, string directoryPrefix)
        {
            if (string.IsNullOrWhiteSpace(templateDirectory))
            {
                return Enumerable.Empty<ScenarioTemplate>();
            }

            directoryPrefix = directoryPrefix ?? "";
            if (!directoryPrefix.EndsWith('/'))
            {
                directoryPrefix += '/';
            }

            string templateDirectoryPrefix = directoryPrefix + templateDirectory;

            if (!templateDirectoryPrefix.EndsWith('/'))
            {
                templateDirectoryPrefix += '/';
            }

            Dictionary<string, Dictionary<string, string>> templateFiles = new();

            foreach (ZipArchiveEntry entry in archive.Entries)
            {
                // Entries that are directories have empty string for Name.
                if (string.IsNullOrWhiteSpace(entry.Name))
                {
                    continue;
                }

                string fullName = entry.FullName;
                if (!fullName.StartsWith(templateDirectoryPrefix))
                {
                    continue;
                }

                // Filter out hidden directories and files that start with a dot (.)
                if (fullName.Contains("/.", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                string relativePath = fullName.Substring(templateDirectoryPrefix.Length);
                int end = relativePath.IndexOf('/');
                if (end == -1)
                {
                    continue;
                }

                string templateName = relativePath.Substring(0, end);
                string relativeFilePath = relativePath.Substring(end + 1);
                string filePath = directoryPrefix + relativeFilePath;

                AddOrCreate(templateFiles, templateName, filePath, fullName);
            }

            return BuildTemplates(templateFiles);

            static void AddOrCreate(Dictionary<string, Dictionary<string, string>> templateFiles, string templateName, string filePath, string overrideFilePath)
            {
                if (!templateFiles.TryGetValue(templateName, out Dictionary<string, string>? fileOverrides))
                {
                    fileOverrides = new Dictionary<string, string>();
                    templateFiles.Add(templateName, fileOverrides);
                }

                fileOverrides[filePath] = overrideFilePath;
            }

            static List<ScenarioTemplate> BuildTemplates(Dictionary<string, Dictionary<string, string>> templateFiles)
            {
                List<ScenarioTemplate> scenarioTemplates = new(templateFiles.Count);

                foreach (KeyValuePair<string, Dictionary<string, string>> template in templateFiles)
                {
                    Dictionary<string, string> luaFiles = new();
                    Dictionary<string, string> nonLuaFiles = new();

                    foreach (KeyValuePair<string, string> file in template.Value)
                    {
                        var fileDict = file.Key.EndsWith(".lua", System.StringComparison.OrdinalIgnoreCase)
                            ? luaFiles
                            : nonLuaFiles;

                        fileDict[file.Key] = file.Value;
                    }

                    scenarioTemplates.Add(new ScenarioTemplate(template.Key, luaFiles, nonLuaFiles));
                }

                return scenarioTemplates;
            }
        }
    }
}

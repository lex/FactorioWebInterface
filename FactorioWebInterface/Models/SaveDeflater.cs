using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Text.RegularExpressions;

namespace FactorioWebInterface.Models
{
    public class SaveDeflater
    {
        private static readonly string FILE_MISSING_MESSAGE = "error('File was removed to decrease save file size. Please visit https://github.com/Refactorio/RedMew if you wish to download this scenario.')";
        private static readonly Regex luaPathRegex = new Regex(@"(?<=.*/)(.*)", RegexOptions.Compiled);
        private static readonly Regex lineRegex = new Regex(@"(^.*?(?=(--)))|^((?!--).)*", RegexOptions.Compiled);
        private static readonly Regex pathRegex = new Regex(@"(?<=require\s*\(?\s*('|""))((\w|/|\.|_|-)+)", RegexOptions.Compiled);
        private static readonly Regex dirRegex = new Regex(@"(.*/)(?<=\w*)", RegexOptions.Compiled);

        private Dictionary<string, string[]> luaFileRequirePaths;
        private Dictionary<string, bool> requiredFiles;

        public SaveDeflater()
        {
            luaFileRequirePaths = new Dictionary<string, string[]>();
            requiredFiles = new Dictionary<string, bool>();
        }

        public void Deflate(string path)
        {
            var success = readRequirePaths(path);

            if (success)
            {
                traverse("control");
                removeNotRequiredFiles(path);
            }
        }

        private bool readRequirePaths(string path)
        {
            try
            {
                using (ZipArchive archive = ZipFile.OpenRead(path))
                {
                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        var luaPath = luaPathRegex.Match(entry.FullName).ToString().Trim();
                        if (luaPath.EndsWith(".lua"))
                        {
                            var paths = getExecutablePaths(entry);
                            luaFileRequirePaths.Add(luaPath.Remove(luaPath.Length - 4), paths);
                        }
                    }
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("There was an error while reading Archive: " + e);
                return false;
            }
            return true;
        }
        private void removeNotRequiredFiles(string path)
        {
            try
            {
                using (ZipArchive archive = ZipFile.Open(path, ZipArchiveMode.Update))
                {
                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        var luaPath = luaPathRegex.Match(entry.FullName).ToString().Trim();
                        if (!luaPath.EndsWith(".cfg") && !luaPath.EndsWith(".dat") && !luaPath.Equals("LICENSE") && !luaPath.Equals("preview.png") && !luaPath.EndsWith(".json"))
                        {
                            var luaDir = getDir(luaPath);
                            if (!requiredFiles.ContainsKey(luaDir) && !requiredFiles.ContainsKey(luaPath.Remove(luaPath.Length - 4)))
                            {
                                using (Stream stream = entry.Open())
                                {
                                    stream.SetLength(FILE_MISSING_MESSAGE.Length);
                                    using (StreamWriter writer = new StreamWriter(stream))
                                    {
                                        try
                                        {
                                            writer.Write(FILE_MISSING_MESSAGE);
                                        }
                                        catch (IOException)
                                        {
                                            Console.WriteLine("Could not override file: " + entry.FullName);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception)
            {
                Console.WriteLine("Could not open archive: " + path);
            }
        }
        private void traverse(string file)
        {
            if (requiredFiles.ContainsKey(file))
                return;
            requiredFiles.Add(file, true);
            string[] RequirePaths;
            if (luaFileRequirePaths.TryGetValue(file, out RequirePaths))
            {
                foreach (string requiredPath in RequirePaths)
                {
                    if (requiredPath.EndsWith("/"))
                    {
                        foreach (string path in luaFileRequirePaths.Keys)
                        {
                            var dir = getDir(path);
                            if (dir.Equals(requiredPath))
                            {
                                traverse(path);
                            }

                        }
                    }
                    else
                        traverse(requiredPath);
                }

            }
        }

        /// <exception cref="IOException">This exception is thrown if there was an error reading entry</exception>
        /// <exception cref="OutOfMemoryException">This exception if you ran out of memory reading entry</exception>
        private string[] getExecutablePaths(ZipArchiveEntry entry)
        {
            var lines = new List<string>();
            using (Stream stream = entry.Open())
            {
                using (StreamReader reader = new StreamReader(stream))
                {
                    string line;
                    while ((line = reader.ReadLine()) != null) // Do not catch IO error. We want to handl
                    {
                        var lineMatch = lineRegex.Match(line).ToString().Trim(); //match everything upto -- or lines not containing --
                        var pathMatch = pathRegex.Match(lineMatch).ToString().Trim();
                        if (!"".Equals(pathMatch))
                        {
                            lines.Add(pathMatch.Replace(".", "/"));
                        }
                    }
                }
            }
            return lines.ToArray();
        }

        private string getDir(string file)
        {
            return dirRegex.Match(file).ToString().Trim();
        }
    }
}

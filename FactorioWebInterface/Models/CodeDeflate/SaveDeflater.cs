using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.IO.Compression;
using System.Linq;

namespace FactorioWebInterface.Models.CodeDeflate
{
    public sealed class SaveDeflater : IDisposable
    {
        private readonly HashSet<string> usedFiles = new();
        private readonly Queue<string> fileQueue = new();

        private readonly HashSet<string> removeFiles = new();

        private string directoryPrefix = "";
        private readonly ZipArchive archive;

        private readonly LuaRequiredFilesFinder parser = new LuaRequiredFilesFinder(directorySeparatorChar: '/', bufferSize: 8192);

        private SaveDeflater(Stream stream)
        {
            archive = new ZipArchive(stream, ZipArchiveMode.Update, leaveOpen: true);
        }

        public void Dispose()
        {
            archive.Dispose();
        }

        public static void Deflate(string filePath)
        {
            using (var fileStream = File.Open(filePath, FileMode.Open))
            {
                Deflate(fileStream);
            }
        }

        public static void Deflate(Stream stream)
        {
            using var saveDeflater = new SaveDeflater(stream);
            saveDeflater.Setup();
            saveDeflater.ProcessQueue();
            saveDeflater.RemoveUnusedFiles();
        }

        private void Setup()
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

            removeFiles.Add($"{directoryPrefix}preview.jpg");
            removeFiles.Add($"{directoryPrefix}redmew_git_banner.png");

            AddFileToQueue("control.lua");
        }

        private void ProcessQueue()
        {
            while (fileQueue.Count > 0)
            {
                string fileName = fileQueue.Dequeue();
                if (archive.GetEntry(fileName) is ZipArchiveEntry entry)
                {
                    ProcessFile(entry);
                }
            }

            void ProcessFile(ZipArchiveEntry entry)
            {
                using (var stream = entry.Open())
                {
                    parser.ParseStream(stream);
                }

                foreach (string fileName in parser.Requires)
                {
                    AddFileToQueue(fileName);
                }
            }
        }

        private void RemoveUnusedFiles()
        {
            foreach (ZipArchiveEntry entry in archive.Entries.ToArray())
            {
                if (ShouldRemoveFile(entry.FullName))
                {
                    entry.Delete();
                }
            }

            bool ShouldRemoveFile(string fullName)
            {
                if (usedFiles.Contains(fullName))
                {
                    return false;
                }

                if (removeFiles.Contains(fullName))
                {
                    return true;
                }

                return fullName.EndsWith(".lua");
            }
        }

        private void AddFileToQueue(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return;
            }

            string fullName = $"{directoryPrefix}{fileName}{(fileName.EndsWith(".lua") ? "" : ".lua")}";
            if (usedFiles.Add(fullName))
            {
                fileQueue.Enqueue(fullName);
            }
        }
    }
}

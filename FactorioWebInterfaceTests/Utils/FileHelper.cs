using System.Collections.Generic;
using System.IO;
using System.IO.Compression;

namespace FactorioWebInterfaceTests.Utils
{
    public static class FileHelper
    {
        public static ZipArchive MakeZipArchive(Dictionary<string, string> filesNamesAndContent, MemoryStream? memory = null)
        {
            memory = memory ?? new MemoryStream();
            var archive = new ZipArchive(memory, ZipArchiveMode.Update, leaveOpen: true);

            foreach (KeyValuePair<string, string> file in filesNamesAndContent)
            {
                using Stream stream = archive.CreateEntry(file.Key).Open();
                using var streamWriter = new StreamWriter(stream, leaveOpen: true);
                streamWriter.Write(file.Value);
            }

            return archive;
        }

        public static Stream StreamFromZipFiles(Dictionary<string, string> filesNamesAndContent)
        {
            var memory = new MemoryStream();
            using var zip = MakeZipArchive(filesNamesAndContent, memory);

            memory.Position = 0;
            return memory;
        }
    }
}

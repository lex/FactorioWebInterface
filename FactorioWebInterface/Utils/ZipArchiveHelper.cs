using System.IO.Abstractions;
using System.IO.Compression;

namespace FactorioWebInterface.Utils
{
    public static class ZipArchiveHelper
    {
        public static bool TryCopyToFile(this ZipArchiveEntry entry, string targetFilePath, IFileSystem fileSystem)
        {
            try
            {
                IFileInfo fileInfo = fileSystem.FileInfo.FromFileName(targetFilePath);
                fileInfo.Directory.Create();

                using var fileStream = fileInfo.Open(System.IO.FileMode.OpenOrCreate, System.IO.FileAccess.Write);
                using var entryStream = entry.Open();

                entryStream.CopyTo(fileStream);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}

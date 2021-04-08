using System;
using System.IO.Abstractions;
using System.Threading.Tasks;

namespace FactorioWebInterface.Utils
{
    public static class FileSystemHelpers
    {
        public static bool DeleteDirectoryIfExists(this IFileSystem fileSystem, string path)
        {
            try
            {
                var dir = fileSystem.DirectoryInfo.FromDirectoryName(path);
                if (dir.Exists)
                {
                    dir.Delete(recursive: true);
                }

                return true;
            }
            catch
            {
                return false;
            }
        }

        public static Task WriteAllBytesAsync(this IFileSystem fileSystem, string filePath, byte[] bytes)
        {
            try
            {
                IFileInfo fi = fileSystem.FileInfo.FromFileName(filePath);
                fi.Directory.Create();

                return fileSystem.File.WriteAllBytesAsync(fi.FullName, bytes);
            }
            catch (Exception ex)
            {
                return Task.FromException(ex);
            }
        }
    }
}

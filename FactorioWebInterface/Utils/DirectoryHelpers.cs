using System.IO.Abstractions;

namespace FactorioWebInterface.Utils
{
    public static class DirectoryHelpers
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
    }
}

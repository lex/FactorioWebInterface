using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Utils
{
    public static class DirectoryHelpers
    {
        public static void DeleteIfExists(string path)
        {
            try
            {
                var dir = new DirectoryInfo(path);
                if (dir.Exists)
                {
                    dir.Delete(true);
                }
            }
            catch
            {
            }
        }
    }
}

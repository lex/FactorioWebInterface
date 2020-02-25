using FactorioWebInterface.Utils;
using System.IO;

namespace FactorioWebInterface.Models
{
    public static class FactorioVersionFinder
    {
        private const string errorMesssage = "No version (use Manage Version)";

        public static string GetVersionString(string pathToExecutable)
        {
            if (!File.Exists(pathToExecutable))
            {
                return errorMesssage;
            }

            var result = ProcessHelper.RunProcessReadAll(pathToExecutable, "--version");

            if (result.ExitCode != 0)
            {
                return errorMesssage;
            }

            string[] words = result.Output.Split(' ');

            if (words.Length < 2)
            {
                return errorMesssage;
            }

            return words[1];
        }
    }
}

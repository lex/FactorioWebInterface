using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;

namespace FactorioWebInterface.Models
{
    public static class ModParser
    {
        public static bool TryGetNameAndVersion(string fileName, [NotNullWhen(true)]  out string? modName, [NotNullWhen(true)] out string? version)
        {
            modName = null;
            version = null;

            if (string.IsNullOrWhiteSpace(fileName))
            {
                return false;
            }

            string? extension = Path.GetExtension(fileName);

            string nameWithoutExtension;
            if ((extension?.StartsWith('.') ?? false) && !extension.Skip(1).Any(c => !char.IsDigit(c)))
            {
                nameWithoutExtension = fileName;
            }
            else
            {
                nameWithoutExtension = Path.GetFileNameWithoutExtension(fileName);
            }

            int lastUnderscore = nameWithoutExtension.LastIndexOf('_');
            if (lastUnderscore < 0)
            {
                return false;
            }

            string foundModName = nameWithoutExtension[0..lastUnderscore];
            if (string.IsNullOrWhiteSpace(foundModName))
            {
                return false;
            }

            string foundVersion = nameWithoutExtension[(lastUnderscore + 1)..^0];
            string[] versionParts = foundVersion.Split('.');
            if (versionParts.Length != 3)
            {
                return false;
            }

            if (!versionParts.All(s => ushort.TryParse(s, out _)))
            {
                return false;
            }

            modName = foundModName;
            version = foundVersion;
            return true;
        }
    }
}

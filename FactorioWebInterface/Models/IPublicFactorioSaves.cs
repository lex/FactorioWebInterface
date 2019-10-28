using System.IO;

namespace FactorioWebInterface.Models
{
    public interface IPublicFactorioSaves
    {
        FileInfo GetFile(string directoryName, string fileName);
        FileMetaData[] GetFiles(string directoryName);
    }
}
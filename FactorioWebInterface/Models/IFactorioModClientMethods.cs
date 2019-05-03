using System.Threading.Tasks;

namespace FactorioWebInterface.Models
{
    public interface IFactorioModClientMethods
    {
        Task SendModPacks(ModPackMetaData[] modPacks);
        Task SendModPackFiles(string modPack, ModPackFileMetaData[] files);
    }
}

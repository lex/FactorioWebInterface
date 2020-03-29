using FactorioWebInterface.Models;
using System.Threading.Tasks;

namespace FactorioWebInterface.Hubs
{
    public interface IFactorioModClientMethods
    {
        Task SendModPacks(CollectionChangedData<ModPackMetaData> data);
        Task SendModPackFiles(string modPack, CollectionChangedData<ModPackFileMetaData> data);
        Task EndDownloadFromModPortal(Result result);
    }
}

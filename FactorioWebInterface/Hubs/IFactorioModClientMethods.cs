using FactorioWebInterface.Models;
using System.Threading.Tasks;

namespace FactorioWebInterface.Hubs
{
    public interface IFactorioModClientMethods
    {
        Task SendModPacks(TableData<ModPackMetaData> data);
        Task SendModPackFiles(string modPack, TableData<ModPackFileMetaData> data);
    }
}

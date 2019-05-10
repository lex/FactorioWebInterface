using System.Threading.Tasks;

namespace FactorioWebInterface.Models
{
    public interface IFactorioModClientMethods
    {
        Task SendModPacks(TableData<ModPackMetaData> data);
        Task SendModPackFiles(string modPack, TableData<ModPackFileMetaData> data);
    }
}

using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using System.Threading.Tasks;

namespace FactorioWebInterface.Hubs
{
    public interface IFactorioBanClientMethods
    {
        Task SendBans(CollectionChangedData<Ban> data);
    }
}

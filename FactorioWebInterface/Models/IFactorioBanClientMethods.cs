using FactorioWebInterface.Data;
using System.Threading.Tasks;

namespace FactorioWebInterface.Models
{
    public interface IFactorioBanClientMethods
    {
        Task SendBans(TableData<Ban> data);
    }
}

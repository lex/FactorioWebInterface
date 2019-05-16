using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using System.Threading.Tasks;

namespace FactorioWebInterface.Hubs
{
    public interface IFactorioAdminClientMethods
    {
        Task SendAdmins(TableData<Admin> data);
    }
}

using FactorioWebInterface.Data;
using System.Threading.Tasks;

namespace FactorioWebInterface.Models
{
    public interface IFactorioAdminClientMethods
    {
        Task SendAdmins(TableData<Admin> data);
    }
}

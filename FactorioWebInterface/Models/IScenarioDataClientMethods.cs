using FactorioWebInterface.Data;
using System.Threading.Tasks;

namespace FactorioWebInterface.Models
{
    public interface IScenarioDataClientMethods
    {
        Task SendDataSets(string[] dataSets);
        Task SendEntries(string dataSet, TableData<ScenarioDataKeyValue> data);
    }
}

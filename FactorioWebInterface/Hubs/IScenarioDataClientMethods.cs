using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using System.Threading.Tasks;

namespace FactorioWebInterface.Hubs
{
    public interface IScenarioDataClientMethods
    {
        Task SendDataSets(string[] dataSets);
        Task SendEntries(string dataSet, CollectionChangedData<ScenarioDataKeyValue> data);
    }
}

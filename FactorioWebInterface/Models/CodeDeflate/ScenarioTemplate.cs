using System.Collections.Generic;

namespace FactorioWebInterface.Models.CodeDeflate
{
    public record ScenarioTemplate(string ScenarioName, Dictionary<string, string> LuaFileOverrides, Dictionary<string, string> NonLuaFileOverrides)
    {
    }
}

using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Text;

namespace FactorioWebInterfaceTests.Services.FactorioServerDataServiceTests
{
    public static class FactorioServerDataServiceHelper
    {
        public static IServiceCollection AddFactorioServerDataService(this IServiceCollection serviceCollection)
        {
            return serviceCollection.AddFactorioServerDataServiceDependencies().AddSingleton<IFactorioServerDataService, FactorioServerDataService>();
        }

        public static IServiceCollection AddFactorioServerDataServiceDependencies(this IServiceCollection serviceCollection)
        {
            return serviceCollection.AddSingleton<FactorioServerDataConfiguration>();
        }
    }
}

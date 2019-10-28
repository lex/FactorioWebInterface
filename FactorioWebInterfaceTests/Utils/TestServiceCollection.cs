using Castle.Core.Logging;
using FactorioWebInterface.Data;
using FactorioWebInterface.Hubs;
using FactorioWebInterface.Utils.ProcessAbstractions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.Web.CodeGeneration;
using System;
using System.Collections.Generic;
using System.IO.Abstractions.TestingHelpers;
using System.Text;

namespace FactorioWebInterfaceTests.Utils
{
    public class TestServiceCollection : ServiceCollection
    {
        public TestServiceCollection() : base()
        {
            this.AddEntityFrameworkInMemoryDatabase()
                .AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseInMemoryDatabase("InMemoryDbForTesting");
                })
                .AddSingleton<IDbContextFactory, DbContextFactory>()
                .AddSingleton(typeof(ILogger<>), typeof(TestLogger<>))
                .AddSingleton<System.IO.Abstractions.IFileSystem, MockFileSystem>()
                .AddSingleton<IProcessSystem, TestProcessSystem>()
                .AddSingleton<IHubContext<FactorioControlHub, IFactorioControlClientMethods>, TestFactorioControlHub>();
        }
    }
}

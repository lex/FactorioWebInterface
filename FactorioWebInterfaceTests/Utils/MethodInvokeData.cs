using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using Xunit;
using Xunit.Sdk;

namespace FactorioWebInterfaceTests.Utils
{
    public class MethodInvokeData
    {
        public string Name { get; }
        public object[] Arguments { get; }

        public MethodInvokeData(string name, object[] arguments)
        {
            Name = name;
            Arguments = arguments;
        }
    }
}

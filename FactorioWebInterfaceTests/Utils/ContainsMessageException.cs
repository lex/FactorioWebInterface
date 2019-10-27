using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using Microsoft.AspNetCore.SignalR;
using Shared;
using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using Xunit;
using Xunit.Sdk;

namespace FactorioWebInterfaceTests.Utils
{
    public class ContainsMessageException : Exception
    {
        public ContainsMessageException(string message) : base(message)
        {
        }

        public ContainsMessageException(string message, Exception innerException) : base(message, innerException)
        {
        }

        public ContainsMessageException()
        {
        }
    }
}

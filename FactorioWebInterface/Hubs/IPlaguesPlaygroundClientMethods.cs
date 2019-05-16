using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Hubs
{
    public interface IPlaguesPlaygroundClientMethods
    {
        Task Send(string message);
    }
}

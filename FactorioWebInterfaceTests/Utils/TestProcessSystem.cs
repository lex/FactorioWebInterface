using FactorioWebInterface.Utils.ProcessAbstractions;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Security;
using System.Text;

namespace FactorioWebInterfaceTests.Utils
{
    public class TestProcessSystem : IProcessSystem
    {
        public void EnterDebugMode()
        {
            throw new NotImplementedException();
        }

        public IProcess GetCurrentProcess()
        {
            throw new NotImplementedException();
        }

        public IProcess GetProcessById(int processId, string machineName)
        {
            throw new NotImplementedException();
        }

        public IProcess GetProcessById(int processId)
        {
            throw new NotImplementedException();
        }

        public IProcess[] GetProcesses(string machineName)
        {
            throw new NotImplementedException();
        }

        public IProcess[] GetProcesses()
        {
            throw new NotImplementedException();
        }

        public IProcess[] GetProcessesByName(string processName, string machineName)
        {
            throw new NotImplementedException();
        }

        public IProcess[] GetProcessesByName(string processName)
        {
            throw new NotImplementedException();
        }

        public void LeaveDebugMode()
        {
            throw new NotImplementedException();
        }

        public IProcess Start(string fileName)
        {
            throw new NotImplementedException();
        }

        public IProcess Start(string fileName, string arguments)
        {
            throw new NotImplementedException();
        }

        public IProcess Start(string fileName, string userName, SecureString password, string domain)
        {
            throw new NotImplementedException();
        }

        public IProcess Start(string fileName, string arguments, string userName, SecureString password, string domain)
        {
            throw new NotImplementedException();
        }

        public IProcess Start(ProcessStartInfo startInfo)
        {
            throw new NotImplementedException();
        }
    }
}

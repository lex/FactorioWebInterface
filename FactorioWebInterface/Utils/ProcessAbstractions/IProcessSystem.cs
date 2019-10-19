using System.Diagnostics;
using System.Security;

namespace FactorioWebInterface.Utils.ProcessAbstractions
{
    public interface IProcessSystem
    {
        void EnterDebugMode();
        IProcess GetCurrentProcess();
        IProcess GetProcessById(int processId, string machineName);
        IProcess GetProcessById(int processId);
        IProcess[] GetProcesses(string machineName);
        IProcess[] GetProcesses();
        IProcess[] GetProcessesByName(string processName, string machineName);
        IProcess[] GetProcessesByName(string processName);
        void LeaveDebugMode();
        IProcess Start(string fileName);
        IProcess Start(string fileName, string arguments);
        IProcess Start(string fileName, string userName, SecureString password, string domain);
        IProcess Start(string fileName, string arguments, string userName, SecureString password, string domain);
        IProcess Start(ProcessStartInfo startInfo);
    }
}

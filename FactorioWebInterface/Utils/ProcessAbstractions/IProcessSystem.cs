using System.Diagnostics;
using System.Linq;
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

    public class ProcessSystem : IProcessSystem
    {
        public void EnterDebugMode() => System.Diagnostics.Process.EnterDebugMode();
        public IProcess GetCurrentProcess() => new PhysicalProcess(System.Diagnostics.Process.GetCurrentProcess());
        public IProcess GetProcessById(int processId, string machineName) => new PhysicalProcess(System.Diagnostics.Process.GetProcessById(processId, machineName));
        public IProcess GetProcessById(int processId) => new PhysicalProcess(System.Diagnostics.Process.GetProcessById(processId));
        public IProcess[] GetProcesses(string machineName) => System.Diagnostics.Process.GetProcesses(machineName).Select(x => new PhysicalProcess(x)).ToArray();
        public IProcess[] GetProcesses() => System.Diagnostics.Process.GetProcesses().Select(x => new PhysicalProcess(x)).ToArray();
        public IProcess[] GetProcessesByName(string processName, string machineName) => System.Diagnostics.Process.GetProcessesByName(processName, machineName).Select(x => new PhysicalProcess(x)).ToArray();
        public IProcess[] GetProcessesByName(string processName) => System.Diagnostics.Process.GetProcessesByName(processName).Select(x => new PhysicalProcess(x)).ToArray();
        public void LeaveDebugMode() => System.Diagnostics.Process.LeaveDebugMode();
        public IProcess Start(System.Diagnostics.ProcessStartInfo startInfo) => new PhysicalProcess(System.Diagnostics.Process.Start(startInfo));
        public IProcess Start(string fileName) => new PhysicalProcess(System.Diagnostics.Process.Start(fileName));
        public IProcess Start(string fileName, string arguments) => new PhysicalProcess(System.Diagnostics.Process.Start(fileName, arguments));
        public IProcess Start(string fileName, string userName, SecureString password, string domain) => new PhysicalProcess(System.Diagnostics.Process.Start(fileName, userName, password, domain));
        public IProcess Start(string fileName, string arguments, string userName, SecureString password, string domain) => new PhysicalProcess(System.Diagnostics.Process.Start(fileName, arguments, userName, password, domain));
    }
}

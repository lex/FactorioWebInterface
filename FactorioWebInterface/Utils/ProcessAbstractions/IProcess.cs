using Microsoft.Win32.SafeHandles;
using System;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;

namespace FactorioWebInterface.Utils.ProcessAbstractions
{
    public interface IProcess
    {
        IntPtr MinWorkingSet { get; set; }
        IntPtr MaxWorkingSet { get; set; }
        ProcessModule MainModule { get; }
        IntPtr Handle { get; }
        int HandleCount { get; }
        IntPtr MainWindowHandle { get; }
        string MainWindowTitle { get; }
        string MachineName { get; }
        bool Responding { get; }
        ISynchronizeInvoke SynchronizingObject { get; set; }
        int BasePriority { get; }
        bool EnableRaisingEvents { get; set; }
        int ExitCode { get; }
        DateTime ExitTime { get; }
        ProcessModuleCollection Modules { get; }
        long NonpagedSystemMemorySize64 { get; }
        long PagedMemorySize64 { get; }
        long PagedSystemMemorySize64 { get; }
        long WorkingSet64 { get; }
        long VirtualMemorySize64 { get; }
        TimeSpan UserProcessorTime { get; }
        TimeSpan TotalProcessorTime { get; }
        ProcessThreadCollection Threads { get; }
        DateTime StartTime { get; }
        ProcessStartInfo StartInfo { get; set; }
        StreamReader StandardOutput { get; }
        StreamWriter StandardInput { get; }
        bool HasExited { get; }
        StreamReader StandardError { get; }
        SafeProcessHandle SafeHandle { get; }
        IntPtr ProcessorAffinity { get; set; }
        string ProcessName { get; }
        TimeSpan PrivilegedProcessorTime { get; }
        long PrivateMemorySize64 { get; }
        ProcessPriorityClass PriorityClass { get; set; }
        bool PriorityBoostEnabled { get; set; }
        long PeakWorkingSet64 { get; }
        long PeakVirtualMemorySize64 { get; }
        long PeakPagedMemorySize64 { get; }
        int SessionId { get; }
        int Id { get; }
        event DataReceivedEventHandler ErrorDataReceived;
        event DataReceivedEventHandler OutputDataReceived;
        event EventHandler Exited;
        void BeginErrorReadLine();
        void BeginOutputReadLine();
        void CancelErrorRead();
        void CancelOutputRead();
        void Close();
        bool CloseMainWindow();
        void Kill();
        void Refresh();
        bool Start();
        void WaitForExit();
        bool WaitForExit(int milliseconds);
        bool WaitForInputIdle(int milliseconds);
        bool WaitForInputIdle();
    }
}

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
        string ToString();
        void WaitForExit();
        bool WaitForExit(int milliseconds);
        bool WaitForInputIdle(int milliseconds);
        bool WaitForInputIdle();
    }

    public class PhysicalProcess : IProcess
    {
        public System.Diagnostics.Process Process { get; }
        public IntPtr MinWorkingSet { get => Process.MinWorkingSet; set => Process.MinWorkingSet = value; }
        public IntPtr MaxWorkingSet { get => Process.MaxWorkingSet; set => Process.MaxWorkingSet = value; }
        public ProcessModule MainModule { get => Process.MainModule; }
        public IntPtr Handle { get => Process.Handle; }
        public int HandleCount { get => Process.HandleCount; }
        public IntPtr MainWindowHandle { get => Process.MainWindowHandle; }
        public string MainWindowTitle { get => Process.MainWindowTitle; }
        public string MachineName { get => Process.MachineName; }
        public bool Responding { get => Process.Responding; }
        public ISynchronizeInvoke SynchronizingObject { get => Process.SynchronizingObject; set => Process.SynchronizingObject = value; }
        public int BasePriority { get => Process.BasePriority; }
        public bool EnableRaisingEvents { get => Process.EnableRaisingEvents; set => Process.EnableRaisingEvents = value; }
        public int ExitCode { get => Process.ExitCode; }
        public DateTime ExitTime { get => Process.ExitTime; }
        public ProcessModuleCollection Modules { get => Process.Modules; }
        public long NonpagedSystemMemorySize64 { get => Process.NonpagedSystemMemorySize64; }
        public long PagedMemorySize64 { get => Process.PagedMemorySize64; }
        public long PagedSystemMemorySize64 { get => Process.PagedSystemMemorySize64; }
        public long WorkingSet64 { get => Process.WorkingSet64; }
        public long VirtualMemorySize64 { get => Process.VirtualMemorySize64; }
        public TimeSpan UserProcessorTime { get => Process.UserProcessorTime; }
        public TimeSpan TotalProcessorTime { get => Process.TotalProcessorTime; }
        public ProcessThreadCollection Threads { get => Process.Threads; }
        public DateTime StartTime { get => Process.StartTime; }
        public ProcessStartInfo StartInfo { get => Process.StartInfo; set => Process.StartInfo = value; }
        public StreamReader StandardOutput { get => Process.StandardOutput; }
        public StreamWriter StandardInput { get => Process.StandardInput; }
        public bool HasExited { get => Process.HasExited; }
        public StreamReader StandardError { get => Process.StandardError; }
        public SafeProcessHandle SafeHandle { get => Process.SafeHandle; }
        public IntPtr ProcessorAffinity { get => Process.ProcessorAffinity; set => Process.ProcessorAffinity = value; }
        public string ProcessName { get => Process.ProcessName; }
        public TimeSpan PrivilegedProcessorTime { get => Process.PrivilegedProcessorTime; }
        public long PrivateMemorySize64 { get => Process.PrivateMemorySize64; }
        public ProcessPriorityClass PriorityClass { get => Process.PriorityClass; set => Process.PriorityClass = value; }
        public bool PriorityBoostEnabled { get => Process.PriorityBoostEnabled; set => Process.PriorityBoostEnabled = value; }
        public long PeakWorkingSet64 { get => Process.PeakWorkingSet64; }
        public long PeakVirtualMemorySize64 { get => Process.PeakVirtualMemorySize64; }
        public long PeakPagedMemorySize64 { get => Process.PeakPagedMemorySize64; }
        public int SessionId { get => Process.SessionId; }
        public int Id { get => Process.Id; }

        public event DataReceivedEventHandler ErrorDataReceived { add => Process.ErrorDataReceived += value; remove => Process.ErrorDataReceived -= value; }
        public event DataReceivedEventHandler OutputDataReceived { add => Process.OutputDataReceived += value; remove => Process.OutputDataReceived -= value; }
        public event EventHandler Exited { add => Process.Exited += value; remove => Process.Exited -= value; }

        public PhysicalProcess(System.Diagnostics.Process process)
        {
            Process = process;
        }

        public void BeginErrorReadLine() => Process.BeginErrorReadLine();
        public void BeginOutputReadLine() => Process.BeginOutputReadLine();
        public void CancelErrorRead() => Process.CancelErrorRead();
        public void CancelOutputRead() => Process.CancelOutputRead();
        public void Close() => Process.Close();
        public bool CloseMainWindow() => Process.CloseMainWindow();
        public void Kill() => Process.Kill();
        public void Refresh() => Process.Refresh();
        public bool Start() => Process.Start();
        public void WaitForExit() => Process.WaitForExit();
        public bool WaitForExit(int milliseconds) => Process.WaitForExit(milliseconds);
        public bool WaitForInputIdle(int milliseconds) => Process.WaitForInputIdle(milliseconds);
        public bool WaitForInputIdle() => Process.WaitForInputIdle();
    }
}

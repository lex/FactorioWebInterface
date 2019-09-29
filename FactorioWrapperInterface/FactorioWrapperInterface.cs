using Microsoft.CodeAnalysis.CSharp.Syntax;
using System;
using System.Threading.Tasks;

namespace Shared
{
    public enum FactorioServerStatus
    {
        Unknown,
        WrapperStarting,
        WrapperStarted,
        Starting,
        Running,
        Stopping,
        Stopped,
        Killing,
        Killed,
        Crashed,
        Updating,
        Updated,
        Preparing,
        Prepared,
        Errored
    }

    public static class FactorioServerStatusExtensions
    {
        /// <summary>
        /// Returns true if the server's status allows starting the server.
        /// </summary>        
        public static bool IsStartable(this FactorioServerStatus status)
        {
            switch (status)
            {
                case FactorioServerStatus.Unknown:
                case FactorioServerStatus.Stopped:
                case FactorioServerStatus.Killed:
                case FactorioServerStatus.Crashed:
                case FactorioServerStatus.Updated:
                case FactorioServerStatus.Errored:
                    return true;
                default:
                    return false;
            }
        }

        /// <summary>
        /// Returns true if the server's status allows stopping the server.
        /// </summary>
        public static bool IsStoppable(this FactorioServerStatus status)
        {
            switch (status)
            {
                case FactorioServerStatus.Unknown:
                case FactorioServerStatus.WrapperStarted:
                case FactorioServerStatus.Starting:
                case FactorioServerStatus.Running:
                    return true;
                default:
                    return false;
            }
        }

        /// <summary>
        /// Returns true if the server's status allows force stopping the server.
        /// </summary>
        public static bool IsForceStoppable(this FactorioServerStatus status)
        {
            switch (status)
            {
                case FactorioServerStatus.Unknown:
                case FactorioServerStatus.WrapperStarted:
                case FactorioServerStatus.Starting:
                case FactorioServerStatus.Running:
                    return true;
                default:
                    return false;
            }
        }

        /// <summary>
        /// Returns true if the server's status allows updating the server.
        /// </summary>
        public static bool IsUpdatable(this FactorioServerStatus status)
        {
            switch (status)
            {
                case FactorioServerStatus.Unknown:
                case FactorioServerStatus.Stopped:
                case FactorioServerStatus.Killed:
                case FactorioServerStatus.Crashed:
                case FactorioServerStatus.Updated:
                case FactorioServerStatus.Errored:
                    return true;
                default:
                    return false;
            }
        }
    }

    public interface IFactorioProcessClientMethods
    {
        Task SendToFactorio(string data);
        Task Stop();
        Task ForceStop();
        Task GetStatus();
    }

    public interface IFactorioProcessServerMethods
    {
        Task RegisterServerIdWithDateTime(string serverId, DateTime dateTime);
        Task SendFactorioOutputDataWithDateTime(string data, DateTime dateTime);
        Task SendWrapperDataWithDateTime(string data, DateTime dateTime);
        Task StatusChangedWithDateTime(FactorioServerStatus newStatus, FactorioServerStatus oldStatus, DateTime dateTime);
    }
}

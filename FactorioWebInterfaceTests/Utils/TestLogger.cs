using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Net.NetworkInformation;
using System.Runtime.CompilerServices;
using System.Text;

namespace FactorioWebInterfaceTests.Utils
{
    public class ContainsLogException : Exception
    {
        public ContainsLogException(string message) : base(message)
        {
        }

        public ContainsLogException(string message, Exception innerException) : base(message, innerException)
        {
        }

        public ContainsLogException()
        {
        }
    }

    public sealed class TestLogger<T> : ILogger<T>, IDisposable
    {
        private Action<LogLevel, object> callback;

        private List<MethodInvokeData> invocations = new List<MethodInvokeData>();
        public IReadOnlyList<MethodInvokeData> Invocations => invocations;

        public TestLogger(Action<LogLevel, object> callback = null)
        {
            this.callback = callback;
        }

        public IDisposable BeginScope<TState>(TState state)
        {
            return this;
        }

        public bool IsEnabled(LogLevel logLevel)
        {
            return true;
        }

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception exception, Func<TState, Exception, string> formatter)
        {
            RecordInvoke(nameof(Log), logLevel, eventId, state, exception, formatter);
            callback?.Invoke(logLevel, state);
        }

        public void Dispose()
        {
            callback = null;
        }

        private void RecordInvoke([CallerMemberName] string name = "", params object[] arguments)
        {
            invocations.Add(new MethodInvokeData(name, arguments));
        }

        public void AssertContainsLog(LogLevel logLevel, string state)
        {
            foreach (var invocation in Invocations)
            {
                var arguments = invocation.Arguments;

                if (arguments.Length == 5
                    && Equals(arguments[0], logLevel)
                    && Equals(arguments[2].ToString(), state))
                {
                    return;
                }
            }

            throw new ContainsLogException($"Log with {nameof(logLevel)}: {logLevel} and {nameof(state)}: {state} not found.");
        }
    }
}

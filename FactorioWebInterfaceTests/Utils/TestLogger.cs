using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace FactorioWebInterfaceTests.Utils
{
    public class TestLogger<T> : ILogger<T>, IDisposable
    {
        private readonly Action<LogLevel, object> callback;

        public TestLogger(Action<LogLevel, object> callback)
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
            callback(logLevel, state);
        }

        public void Dispose()
        {
        }
    }
}

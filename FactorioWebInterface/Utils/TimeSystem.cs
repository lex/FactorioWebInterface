using System;
using System.Threading;
using System.Threading.Tasks;

namespace FactorioWebInterface.Utils
{
    public interface ITimeSystem
    {
        Task Delay(TimeSpan timeSpan);
        Task Delay(TimeSpan timeSpan, CancellationToken cancellationToken);

        public Task Delay(int milliseconds) => Delay(TimeSpan.FromMilliseconds(milliseconds));
        public Task Delay(int milliseconds, CancellationToken cancellationToken) => Delay(TimeSpan.FromMilliseconds(milliseconds), cancellationToken);
    }

    public class TimeSystem : ITimeSystem
    {
        public Task Delay(TimeSpan timeSpan) => Task.Delay(timeSpan);
        public Task Delay(TimeSpan timeSpan, CancellationToken cancellationToken) => Task.Delay(timeSpan, cancellationToken);
    }
}

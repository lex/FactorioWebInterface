using Nito.AsyncEx;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FactorioWebInterfaceTests.Utils
{
    public static class AsyncManualResetEventExtensions
    {
        public static async Task WaitAsyncWithTimeout(this AsyncManualResetEvent self, int timeout)
        {
            using (var cts = new CancellationTokenSource(timeout))
            {
                await self.WaitAsync(cts.Token).ConfigureAwait(false);
            }
        }
    }
}

using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Shared;
using System;
using System.Diagnostics;

namespace FactorioWebInterface.Services
{
    public interface IFactorioServerRunner
    {
        Result Run(FactorioServerMutableData mutableData, ProcessStartInfo startInfo);
    }

    public class FactorioServerRunner : IFactorioServerRunner
    {
        private readonly IHubContext<FactorioControlHub, IFactorioControlClientMethods> _factorioControlHub;
        private readonly ILogger<FactorioServerRunner> _logger;

        public FactorioServerRunner(IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub, ILogger<FactorioServerRunner> logger)
        {
            _factorioControlHub = factorioControlHub;
            _logger = logger;
        }

        public Result Run(FactorioServerMutableData mutableData, ProcessStartInfo startInfo)
        {
            var afterStatus = FactorioServerStatus.Errored;

            try
            {
                Process.Start(startInfo);
                _logger.LogError("Wrapper process started, fileName: {fileName}, arguments: {arguments}", startInfo.FileName, startInfo.Arguments);

                afterStatus = FactorioServerStatus.WrapperStarting;
                return Result.OK;
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error starting wrapper process, fileName: {fileName}, arguments: {arguments}", startInfo.FileName, startInfo.Arguments);
                return Result.Failure(Constants.WrapperProcessErrorKey, "Wrapper process failed to start.");
            }
            finally
            {
                _ = FactorioServerUtils.ChangeStatus(mutableData, _factorioControlHub, afterStatus);
            }
        }
    }
}

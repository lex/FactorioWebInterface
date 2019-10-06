using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
using FactorioWebInterface.Utils.ProcessAbstractions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Shared;
using System;
using System.Diagnostics;
using System.IO.Abstractions;

namespace FactorioWebInterface.Services
{
    public interface IFactorioServerRunner
    {
        Result Run(FactorioServerMutableData mutableData, ProcessStartInfo startInfo);
    }

    public class FactorioServerRunner : IFactorioServerRunner
    {
        private readonly IHubContext<FactorioControlHub, IFactorioControlClientMethods> _factorioControlHub;
        private readonly IProcessSystem _processSystem;
        private readonly ILogger<FactorioServerRunner> _logger;

        public FactorioServerRunner(IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub, IProcessSystem processSystem, ILogger<FactorioServerRunner> logger)
        {
            _factorioControlHub = factorioControlHub;
            _processSystem = processSystem;
            _logger = logger;
        }

        public Result Run(FactorioServerMutableData mutableData, ProcessStartInfo startInfo)
        {
            var afterStatus = FactorioServerStatus.Errored;

            try
            {
                _processSystem.Start(startInfo);
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

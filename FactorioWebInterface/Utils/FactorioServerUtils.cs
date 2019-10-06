using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using Microsoft.AspNetCore.SignalR;
using Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Utils
{
    public static class FactorioServerUtils
    {
        public static Task ChangeStatus(FactorioServerMutableData mutableData,
            IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub,
            FactorioServerStatus status,
            string byUser = "")
        {
            string serverId = mutableData.ServerId;
            var oldStatus = mutableData.Status;
            mutableData.Status = status;

            string oldStatusString = oldStatus.ToString();
            string newStatusString = status.ToString();

            MessageData message;
            if (string.IsNullOrWhiteSpace(byUser))
            {
                message = new MessageData()
                {
                    ServerId = serverId,
                    MessageType = MessageType.Status,
                    Message = $"[STATUS] Change from {oldStatusString} to {newStatusString}"
                };
            }
            else
            {
                message = new MessageData()
                {
                    ServerId = serverId,
                    MessageType = MessageType.Status,
                    Message = $"[STATUS] Change from {oldStatusString} to {newStatusString} by user {byUser}"
                };
            }

            var group = factorioControlHub.Clients.Groups(serverId);

            return Task.WhenAll(group.FactorioStatusChanged(newStatusString, oldStatusString), group.SendMessage(message));
        }

        public static Task SendMessage(FactorioServerMutableData mutableData,
            IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub,
            MessageData message)
        {
            mutableData.ControlMessageBuffer.Add(message);
            return factorioControlHub.Clients.Group(mutableData.ServerId).SendMessage(message);
        }

        public static Task SendMessage(FactorioServerMutableData mutableData,
            IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub,
            string message,
            MessageType messageType)
        {
            var data = new MessageData()
            {
                ServerId = mutableData.ServerId,
                MessageType = messageType,
                Message = message
            };

            return SendMessage(mutableData, factorioControlHub, data);
        }

        public static Task SendOutputMessage(FactorioServerMutableData mutableData,
            IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub,
            string message)
        {
            return SendMessage(mutableData, factorioControlHub, message, MessageType.Output);
        }

        public static Task SendWrapperMessage(FactorioServerMutableData mutableData,
            IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub,
            string message)
        {
            return SendMessage(mutableData, factorioControlHub, message, MessageType.Wrapper);
        }

        public static Task SendControlMessage(FactorioServerMutableData mutableData,
            IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub,
            string message)
        {
            return SendMessage(mutableData, factorioControlHub, message, MessageType.Control);
        }

        public static Task SendDiscordMessage(FactorioServerMutableData mutableData,
            IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub,
            string message)
        {
            return SendMessage(mutableData, factorioControlHub, message, MessageType.Discord);
        }

        public static Task SendErrorMessage(FactorioServerMutableData mutableData,
            IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub,
            string message)
        {
            return SendMessage(mutableData, factorioControlHub, message, MessageType.Error);
        }
    }
}

using Discord;
using Discord.Commands;
using Discord.WebSocket;
using FactorioWebInterface.Utils;
using System;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services.Discord
{
    /// <summary>
    /// Routes Discord messages, if the message is a command raises <see cref="CommandReceived"/> else <see cref="MessageReceived"/>.
    /// </summary>
    public interface IDiscordMessageHandlingService
    {
        event EventHandler<IDiscordMessageHandlingService, MessageReceivedEventArgs> MessageReceived;
        event EventHandler<IDiscordMessageHandlingService, (SocketUserMessage message, int argPos)> CommandReceived;
    }

    /// <inheritdoc/>
    public class DiscordMessageHandlingService : IDiscordMessageHandlingService
    {
        private readonly DiscordSocketClient _client;

        public event EventHandler<IDiscordMessageHandlingService, MessageReceivedEventArgs>? MessageReceived;
        public event EventHandler<IDiscordMessageHandlingService, (SocketUserMessage message, int argPos)>? CommandReceived;

        public DiscordMessageHandlingService(DiscordSocketClient client)
        {
            _client = client;
            _client.MessageReceived += OnMessageReceived;
        }

        private Task OnMessageReceived(SocketMessage rawMessage)
        {
            if (rawMessage.Author.Id == _client.CurrentUser.Id)
            {
                return Task.CompletedTask;
            }

            if ((rawMessage is SocketUserMessage message) && message.Source == MessageSource.User)
            {
                var argPos = 0;
                if (message.HasStringPrefix(Constants.DiscordBotCommandPrefix, ref argPos) || message.HasMentionPrefix(_client.CurrentUser, ref argPos))
                {
                    CommandReceived?.Invoke(this, (message, argPos));
                    return Task.CompletedTask;
                }
            }

            MessageReceived?.Invoke(this, new MessageReceivedEventArgs(rawMessage.Channel, rawMessage.Author, rawMessage.Content));
            return Task.CompletedTask;
        }
    }
}

using Discord.Commands;
using System.Threading.Tasks;

namespace FactorioWebInterfaceTests.Services.Discord
{
    public class TestCommands : ModuleBase<SocketCommandContext>
    {
        [Command(nameof(CommandOne))]
        public Task CommandOne()
        {
            return Task.CompletedTask;
        }

        [Command(nameof(CommandTwo))]
        public Task CommandTwo()
        {
            return Task.CompletedTask;
        }
    }
}

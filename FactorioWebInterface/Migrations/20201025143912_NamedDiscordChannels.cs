using Microsoft.EntityFrameworkCore.Migrations;

namespace FactorioWebInterface.Migrations
{
    public partial class NamedDiscordChannels : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NamedDiscordServers");

            migrationBuilder.CreateTable(
                name: "NamedDiscordChannels",
                columns: table => new
                {
                    Name = table.Column<string>(type: "TEXT COLLATE NOCASE", nullable: false),
                    DiscordChannelId = table.Column<ulong>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NamedDiscordChannels", x => x.Name);
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NamedDiscordChannels");

            migrationBuilder.CreateTable(
                name: "NamedDiscordServers",
                columns: table => new
                {
                    DiscordChannelId = table.Column<ulong>(nullable: false),
                    Name = table.Column<string>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NamedDiscordServers", x => new { x.DiscordChannelId, x.Name });
                });
        }
    }
}

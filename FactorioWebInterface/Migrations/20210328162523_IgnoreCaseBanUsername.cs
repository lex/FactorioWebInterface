using Microsoft.EntityFrameworkCore.Migrations;

namespace FactorioWebInterface.Migrations
{
    public partial class IgnoreCaseBanUsername : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Username",
                table: "Bans",
                type: "TEXT COLLATE NOCASE",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "TEXT");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Username",
                table: "Bans",
                type: "TEXT",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "TEXT COLLATE NOCASE");
        }
    }
}

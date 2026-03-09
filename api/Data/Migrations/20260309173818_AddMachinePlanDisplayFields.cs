using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoffeeShop.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMachinePlanDisplayFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Badge",
                table: "MachinePlans",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DepositNote",
                table: "MachinePlans",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tag",
                table: "MachinePlans",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TagColor",
                table: "MachinePlans",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetDesc",
                table: "MachinePlans",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Badge",
                table: "MachinePlans");

            migrationBuilder.DropColumn(
                name: "DepositNote",
                table: "MachinePlans");

            migrationBuilder.DropColumn(
                name: "Tag",
                table: "MachinePlans");

            migrationBuilder.DropColumn(
                name: "TagColor",
                table: "MachinePlans");

            migrationBuilder.DropColumn(
                name: "TargetDesc",
                table: "MachinePlans");
        }
    }
}

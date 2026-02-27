using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoffeeShop.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSpecJsonFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SpecData",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SpecTemplate",
                table: "Categories",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SpecData",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SpecTemplate",
                table: "Categories");
        }
    }
}

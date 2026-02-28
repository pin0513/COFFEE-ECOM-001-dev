using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoffeeShop.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPurchaseModeAndVariantsToProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BulkOptions",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ParentProductId",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubscriptionOptions",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VariantLabel",
                table: "Products",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BulkOptions",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ParentProductId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SubscriptionOptions",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "VariantLabel",
                table: "Products");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoffeeShop.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInquiryProductFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PreferredPeriod",
                table: "BusinessInquiries",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProductName",
                table: "BusinessInquiries",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Quantity",
                table: "BusinessInquiries",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PreferredPeriod",
                table: "BusinessInquiries");

            migrationBuilder.DropColumn(
                name: "ProductName",
                table: "BusinessInquiries");

            migrationBuilder.DropColumn(
                name: "Quantity",
                table: "BusinessInquiries");
        }
    }
}

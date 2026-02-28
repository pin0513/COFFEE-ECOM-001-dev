using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoffeeShop.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddImageUrlToStoresAndTestimonials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Testimonials",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Testimonials");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Stores");
        }
    }
}

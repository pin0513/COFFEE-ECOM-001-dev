namespace CoffeeShop.Api.Models;

public class Testimonial
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public int Rating { get; set; } = 5;        // 1-5
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsVisible { get; set; } = true;
    public int SortOrder { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

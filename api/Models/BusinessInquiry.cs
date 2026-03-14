namespace CoffeeShop.Api.Models;

public class BusinessInquiry
{
    public int Id { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Company { get; set; }
    /// <summary>bulk | hotel-restaurant | machine-rental | general</summary>
    public string InquiryType { get; set; } = "general";
    public string? SelectedPlan { get; set; }
    public string? Message { get; set; }
    /// <summary>new | contacted | closed</summary>
    public string Status { get; set; } = "new";
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? ProductName { get; set; }
    public int? Quantity { get; set; }
    public string? PreferredPeriod { get; set; }
}

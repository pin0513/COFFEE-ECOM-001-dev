namespace CoffeeShop.Api.Models;

/// <summary>咖啡機租賃/銷售方案</summary>
public class MachinePlan
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    /// <summary>office | cafe | hotel</summary>
    public string Category { get; set; } = "office";
    public string? Description { get; set; }
    /// <summary>月租費（NT$）</summary>
    public decimal? MonthlyPrice { get; set; }
    /// <summary>季租費（NT$）</summary>
    public decimal? QuarterlyPrice { get; set; }
    /// <summary>年租費（NT$）</summary>
    public decimal? AnnualPrice { get; set; }
    /// <summary>押金（NT$）</summary>
    public decimal? DepositAmount { get; set; }
    /// <summary>方案特色 JSON string[]</summary>
    public string? Features { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<BusinessSubscription> Subscriptions { get; set; } = new List<BusinessSubscription>();
}

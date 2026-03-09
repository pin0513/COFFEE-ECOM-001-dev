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
    /// <summary>方案標籤文字，例如：最受歡迎、效能升級</summary>
    public string? Tag { get; set; }
    /// <summary>標籤顏色代碼：hot | upgrade | cafe | hotel | default</summary>
    public string? TagColor { get; set; }
    /// <summary>目標客群描述，例如：10 ~ 30 人辦公室</summary>
    public string? TargetDesc { get; set; }
    /// <summary>推薦 Badge 文字，例如：推薦方案（留空=不顯示）</summary>
    public string? Badge { get; set; }
    /// <summary>押金說明文字，例如：免押金、押金 NT$ 10,000</summary>
    public string? DepositNote { get; set; }
    /// <summary>方案特色 JSON string[]</summary>
    public string? Features { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<BusinessSubscription> Subscriptions { get; set; } = new List<BusinessSubscription>();
}

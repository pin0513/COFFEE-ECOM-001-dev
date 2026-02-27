namespace CoffeeShop.Api.Models;

/// <summary>
/// 商品批次 (用於效期管理)
/// </summary>
public class ProductBatch
{
    /// <summary>
    /// 批次 ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 商品 ID
    /// </summary>
    public int ProductId { get; set; }

    /// <summary>
    /// 商品導覽屬性
    /// </summary>
    public Product? Product { get; set; }

    /// <summary>
    /// 批次號碼
    /// </summary>
    public string BatchNumber { get; set; } = string.Empty;

    /// <summary>
    /// 進貨日期
    /// </summary>
    public DateTime ReceivedDate { get; set; }

    /// <summary>
    /// 效期 (到期日)
    /// </summary>
    public DateTime ExpiryDate { get; set; }

    /// <summary>
    /// 批次數量
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// 剩餘數量
    /// </summary>
    public int RemainingQuantity { get; set; }

    /// <summary>
    /// 進貨成本
    /// </summary>
    public decimal Cost { get; set; }

    /// <summary>
    /// 是否為即期品
    /// </summary>
    public bool IsNearExpiry { get; set; } = false;

    /// <summary>
    /// 自動降價幅度 (%)
    /// </summary>
    public decimal? DiscountPercentage { get; set; }

    /// <summary>
    /// 建立時間
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新時間
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}

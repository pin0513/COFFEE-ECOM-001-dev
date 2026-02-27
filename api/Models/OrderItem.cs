namespace CoffeeShop.Api.Models;

/// <summary>
/// 訂單明細
/// </summary>
public class OrderItem
{
    /// <summary>
    /// 明細 ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 訂單 ID
    /// </summary>
    public int OrderId { get; set; }

    /// <summary>
    /// 訂單導覽屬性
    /// </summary>
    public Order? Order { get; set; }

    /// <summary>
    /// 商品 ID
    /// </summary>
    public int ProductId { get; set; }

    /// <summary>
    /// 商品導覽屬性
    /// </summary>
    public Product? Product { get; set; }

    /// <summary>
    /// 商品名稱 (快照，避免商品改名後訂單資料不一致)
    /// </summary>
    public string ProductName { get; set; } = string.Empty;

    /// <summary>
    /// 商品 SKU (快照)
    /// </summary>
    public string ProductSku { get; set; } = string.Empty;

    /// <summary>
    /// 單價 (快照)
    /// </summary>
    public decimal UnitPrice { get; set; }

    /// <summary>
    /// 數量
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// 折扣金額
    /// </summary>
    public decimal DiscountAmount { get; set; } = 0;

    /// <summary>
    /// 小計 (單價 * 數量 - 折扣)
    /// </summary>
    public decimal Subtotal { get; set; }

    /// <summary>
    /// 批次 ID (如果有指定批次)
    /// </summary>
    public int? BatchId { get; set; }

    /// <summary>
    /// 批次導覽屬性
    /// </summary>
    public ProductBatch? Batch { get; set; }
}

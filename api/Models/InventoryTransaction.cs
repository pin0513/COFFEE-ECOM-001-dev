namespace CoffeeShop.Api.Models;

/// <summary>
/// 庫存異動記錄（審計用）
/// </summary>
public class InventoryTransaction
{
    /// <summary>
    /// 異動 ID
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
    /// 批次 ID (可選)
    /// </summary>
    public int? BatchId { get; set; }

    /// <summary>
    /// 批次導覽屬性
    /// </summary>
    public ProductBatch? Batch { get; set; }

    /// <summary>
    /// 異動類型 (purchase: 進貨, sale: 銷售, adjustment: 盤點調整, return: 退貨)
    /// </summary>
    public TransactionType TransactionType { get; set; }

    /// <summary>
    /// 異動數量 (正數為入庫,負數為出庫)
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// 參考類型 (order, purchase_order, manual)
    /// </summary>
    public string? ReferenceType { get; set; }

    /// <summary>
    /// 參考 ID (關聯 order_id 或其他 ID)
    /// </summary>
    public int? ReferenceId { get; set; }

    /// <summary>
    /// 備註
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// 建立時間
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 操作人員 (Phase 3 可擴展)
    /// </summary>
    public int? CreatedBy { get; set; }
}

/// <summary>
/// 庫存異動類型
/// </summary>
public enum TransactionType
{
    Purchase = 1,    // 進貨
    Sale = 2,        // 銷售
    Adjustment = 3,  // 盤點調整
    Return = 4       // 退貨
}

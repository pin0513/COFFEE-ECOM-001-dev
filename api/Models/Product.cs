namespace CoffeeShop.Api.Models;

/// <summary>
/// 商品主檔
/// </summary>
public class Product
{
    /// <summary>
    /// 商品 ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 商品編號 (SKU)
    /// </summary>
    public string Sku { get; set; } = string.Empty;

    /// <summary>
    /// 商品名稱
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 商品描述
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 分類 ID
    /// </summary>
    public int CategoryId { get; set; }

    /// <summary>
    /// 分類導覽屬性
    /// </summary>
    public Category? Category { get; set; }

    /// <summary>
    /// 售價
    /// </summary>
    public decimal Price { get; set; }

    /// <summary>
    /// 成本
    /// </summary>
    public decimal? Cost { get; set; }

    /// <summary>
    /// 庫存數量
    /// </summary>
    public int StockQuantity { get; set; }

    /// <summary>
    /// 單位 (磅/公克/個)
    /// </summary>
    public string Unit { get; set; } = "磅";

    /// <summary>
    /// 商品圖片 URL
    /// </summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// 是否啟用
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// 是否為精選商品
    /// </summary>
    public bool IsFeatured { get; set; } = false;

    /// <summary>
    /// 產品敘述（v3.2，取代產地標籤）
    /// </summary>
    public string? ShortDescription { get; set; }

    /// <summary>
    /// 可下單（預設 true）
    /// </summary>
    public bool IsOrderable { get; set; } = true;

    /// <summary>
    /// 啟用庫存管理（預設 false，選擇性啟用）
    /// </summary>
    public bool InventoryEnabled { get; set; } = false;

    /// <summary>
    /// 商品規格數值（JSON Object），對應分類的 SpecTemplate 欄位
    /// 範例：{"origin":"衣索比亞","roast":"淺焙","process":"水洗"}
    /// </summary>
    public string? SpecData { get; set; }

    /// <summary>
    /// 排序
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// 建立時間
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新時間
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 商品屬性
    /// </summary>
    public List<ProductAttribute> Attributes { get; set; } = new();

    /// <summary>
    /// 批次庫存 (含效期)
    /// </summary>
    public List<ProductBatch> Batches { get; set; } = new();
}

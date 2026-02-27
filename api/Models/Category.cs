namespace CoffeeShop.Api.Models;

/// <summary>
/// 商品分類
/// </summary>
public class Category
{
    /// <summary>
    /// 分類 ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 分類名稱
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 分類代碼
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// 分類描述
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 父分類 ID (用於多層分類)
    /// </summary>
    public int? ParentId { get; set; }

    /// <summary>
    /// 分類圖示
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// 分類顏色 (Hex)
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// 是否需要效期管理
    /// </summary>
    public bool RequiresExpiryManagement { get; set; } = true;

    /// <summary>
    /// 商品規格欄位定義（JSON Array），格式範例：
    /// [{"key":"origin","label":"產地","type":"text"},{"key":"roast","label":"烘焙度","type":"select","options":["淺焙","中焙","深焙"]}]
    /// </summary>
    public string? SpecTemplate { get; set; }

    /// <summary>
    /// 排序
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// 是否啟用
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// 建立時間
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新時間
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 子分類
    /// </summary>
    public List<Category> SubCategories { get; set; } = new();

    /// <summary>
    /// 分類下的商品
    /// </summary>
    public List<Product> Products { get; set; } = new();
}

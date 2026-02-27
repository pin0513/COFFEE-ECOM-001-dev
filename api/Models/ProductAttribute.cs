namespace CoffeeShop.Api.Models;

/// <summary>
/// 商品屬性 (處理法、產地、海拔等)
/// </summary>
public class ProductAttribute
{
    /// <summary>
    /// 屬性 ID
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
    /// 屬性名稱 (處理法/產地/海拔/烘焙度)
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 屬性值
    /// </summary>
    public string Value { get; set; } = string.Empty;

    /// <summary>
    /// 排序
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// 是否顯示
    /// </summary>
    public bool IsVisible { get; set; } = true;
}

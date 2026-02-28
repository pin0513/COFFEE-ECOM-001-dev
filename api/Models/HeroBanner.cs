namespace CoffeeShop.Api.Models;

/// <summary>
/// 首頁 Hero 輪播橫幅
/// </summary>
public class HeroBanner
{
    public int Id { get; set; }

    /// <summary>
    /// 主標題（大字）
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 副標題（小字）
    /// </summary>
    public string? SubTitle { get; set; }

    /// <summary>
    /// CTA 按鈕文字（null = 不顯示按鈕）
    /// </summary>
    public string? ButtonText { get; set; }

    /// <summary>
    /// CTA 按鈕連結（null = 導向商品頁）
    /// </summary>
    public string? ButtonUrl { get; set; }

    /// <summary>
    /// 背景圖片 URL（支援 JPG/PNG/WebP/SVG）
    /// </summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// 排序（數字小的排前面）
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// 是否啟用
    /// </summary>
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

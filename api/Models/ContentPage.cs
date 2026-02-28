namespace CoffeeShop.Api.Models;

/// <summary>
/// 靜態內容頁面（關於我們、聯絡我們、常見問題等）
/// i18n-ready：目前僅 zh-TW，未來可擴充多語系欄位
/// </summary>
public class ContentPage
{
    public int Id { get; set; }

    /// <summary>
    /// URL slug（唯一識別），例如 "about", "contact", "faq"
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// 繁體中文標題
    /// </summary>
    public string TitleZhTW { get; set; } = string.Empty;

    /// <summary>
    /// 繁體中文內容（支援 Markdown / HTML）
    /// </summary>
    public string BodyZhTW { get; set; } = string.Empty;

    /// <summary>
    /// 是否已發佈（false = 草稿，不顯示在前台）
    /// </summary>
    public bool IsPublished { get; set; } = true;

    /// <summary>
    /// 排序（越小越前）
    /// </summary>
    public int SortOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

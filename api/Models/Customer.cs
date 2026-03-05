namespace CoffeeShop.Api.Models;

/// <summary>
/// 客戶資料
/// </summary>
public class Customer
{
    /// <summary>
    /// 客戶 ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 客戶編號
    /// </summary>
    public string CustomerNumber { get; set; } = string.Empty;

    /// <summary>
    /// 姓名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Email
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 電話
    /// </summary>
    public string Phone { get; set; } = string.Empty;

    /// <summary>
    /// 客戶類型 (B2C 一般客戶 / B2B 經銷商)
    /// </summary>
    public CustomerType Type { get; set; } = CustomerType.B2C;

    /// <summary>
    /// 會員等級 (一般/VIP/經銷商)
    /// </summary>
    public MemberLevel Level { get; set; } = MemberLevel.Regular;

    /// <summary>
    /// 密碼雜湊
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// Google 登入 sub
    /// </summary>
    public string? GoogleId { get; set; }

    /// <summary>
    /// LINE 登入 userId
    /// </summary>
    public string? LineId { get; set; }

    /// <summary>
    /// 地址
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// 公司名稱 (B2B)
    /// </summary>
    public string? CompanyName { get; set; }

    /// <summary>
    /// 統一編號 (B2B)
    /// </summary>
    public string? TaxId { get; set; }

    /// <summary>
    /// 是否啟用
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Email 驗證狀態
    /// </summary>
    public bool IsEmailVerified { get; set; } = false;

    /// <summary>
    /// 註冊日期
    /// </summary>
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 最後登入時間
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>
    /// 建立時間
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新時間
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 訂單
    /// </summary>
    public List<Order> Orders { get; set; } = new();
}

/// <summary>
/// 客戶類型
/// </summary>
public enum CustomerType
{
    B2C = 1,    // 一般消費者
    B2B = 2     // 經銷商
}

/// <summary>
/// 會員等級
/// </summary>
public enum MemberLevel
{
    Regular = 1,    // 一般會員
    Vip = 2,        // VIP
    Dealer = 3      // 經銷商
}

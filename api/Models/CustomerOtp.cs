namespace CoffeeShop.Api.Models;

public class CustomerOtp
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;       // 4 位數字
    public DateTime ExpiresAt { get; set; }                // 10 分鐘有效
    public bool IsUsed { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

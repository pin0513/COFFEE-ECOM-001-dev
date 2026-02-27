namespace CoffeeShop.Api.Models;

/// <summary>
/// 訂單主檔
/// </summary>
public class Order
{
    /// <summary>
    /// 訂單 ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 訂單編號
    /// </summary>
    public string OrderNumber { get; set; } = string.Empty;

    /// <summary>
    /// 客戶 ID
    /// </summary>
    public int CustomerId { get; set; }

    /// <summary>
    /// 客戶導覽屬性
    /// </summary>
    public Customer? Customer { get; set; }

    /// <summary>
    /// 訂單狀態 (待付款/已付款/處理中/已出貨/已完成/已取消)
    /// </summary>
    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    /// <summary>
    /// 訂單總額 (未稅)
    /// </summary>
    public decimal Subtotal { get; set; }

    /// <summary>
    /// 運費
    /// </summary>
    public decimal ShippingFee { get; set; }

    /// <summary>
    /// 折扣金額
    /// </summary>
    public decimal DiscountAmount { get; set; } = 0;

    /// <summary>
    /// 訂單總額 (含稅)
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// 付款方式 (信用卡/貨到付款/轉帳)
    /// </summary>
    public PaymentMethod PaymentMethod { get; set; }

    /// <summary>
    /// 付款狀態
    /// </summary>
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;

    /// <summary>
    /// 收件人姓名
    /// </summary>
    public string RecipientName { get; set; } = string.Empty;

    /// <summary>
    /// 收件人電話
    /// </summary>
    public string RecipientPhone { get; set; } = string.Empty;

    /// <summary>
    /// 收件地址
    /// </summary>
    public string ShippingAddress { get; set; } = string.Empty;

    /// <summary>
    /// 備註
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// 銀行轉帳後五碼（轉帳付款時必填）
    /// </summary>
    public string? TransferCode { get; set; }

    /// <summary>
    /// 訂單日期
    /// </summary>
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 出貨日期
    /// </summary>
    public DateTime? ShippedDate { get; set; }

    /// <summary>
    /// 完成日期
    /// </summary>
    public DateTime? CompletedDate { get; set; }

    /// <summary>
    /// 建立時間
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新時間
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 訂單明細
    /// </summary>
    public List<OrderItem> Items { get; set; } = new();
}

/// <summary>
/// 訂單狀態
/// </summary>
public enum OrderStatus
{
    Pending = 0,        // 待付款
    Paid = 1,           // 已付款
    Processing = 2,     // 處理中
    Shipped = 3,        // 已出貨
    Completed = 4,      // 已完成
    Cancelled = 5       // 已取消
}

/// <summary>
/// 付款方式
/// </summary>
public enum PaymentMethod
{
    CreditCard = 1,     // 信用卡
    CashOnDelivery = 2, // 貨到付款
    BankTransfer = 3,   // 轉帳
    LinePay = 4         // Line Pay
}

/// <summary>
/// 付款狀態
/// </summary>
public enum PaymentStatus
{
    Unpaid = 0,         // 未付款
    Paid = 1,           // 已付款
    Refunded = 2        // 已退款
}

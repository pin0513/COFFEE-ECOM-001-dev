namespace CoffeeShop.Api.Models;

/// <summary>商業客戶訂閱 CRM 記錄</summary>
public class BusinessSubscription
{
    public int Id { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Company { get; set; }

    // 目前方案
    public int? MachinePlanId { get; set; }
    public MachinePlan? MachinePlan { get; set; }

    /// <summary>monthly | quarterly | annual</summary>
    public string BillingCycle { get; set; } = "monthly";

    public DateTime? StartDate { get; set; }
    public DateTime? RenewalDate { get; set; }

    /// <summary>pending | active | suspended | cancelled</summary>
    public string Status { get; set; } = "pending";

    /// <summary>內部備忘錄</summary>
    public string? InternalNotes { get; set; }

    /// <summary>異動歷史 JSON: [{date, action, fromPlan, toPlan, note}]</summary>
    public string? ChangeHistory { get; set; }

    /// <summary>來源詢問單（可選）</summary>
    public int? SourceInquiryId { get; set; }
    public BusinessInquiry? SourceInquiry { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

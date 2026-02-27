using BCrypt.Net;
using CoffeeShop.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CoffeeShop.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();

        await SeedAdminsAsync(db);
        await SeedCategoriesAsync(db);
        await SeedSiteSettingsAsync(db);

        await db.SaveChangesAsync();
    }

    private static async Task SeedAdminsAsync(AppDbContext db)
    {
        if (await db.Admins.AnyAsync()) return;

        db.Admins.Add(new Admin
        {
            Email = "pin0513@gmail.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test1234"),
            Name = "超級管理員",
            Role = "superadmin",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });
    }

    private static async Task SeedCategoriesAsync(AppDbContext db)
    {
        if (await db.Categories.AnyAsync()) return;

        var categories = new List<Category>
        {
            new() { Name = "精品咖啡豆", Code = "SPECIALTY_BEANS", Description = "精選世界各地精品咖啡豆", Icon = "☕", Color = "#8B4513", SortOrder = 1 },
            new() { Name = "商業配方豆", Code = "COMMERCIAL_BLEND", Description = "商業用途咖啡配方", Icon = "🏢", Color = "#A0522D", SortOrder = 2 },
            new() { Name = "即溶/二合一/三合一", Code = "INSTANT_COFFEE", Description = "即溶咖啡系列", Icon = "⚡", Color = "#CD853F", SortOrder = 3 },
            new() { Name = "茶葉/花草茶", Code = "TEA", Description = "精選茶葉與花草茶", Icon = "🍵", Color = "#228B22", SortOrder = 4 },
            new() { Name = "咖啡機/沖煮器材", Code = "EQUIPMENT", Description = "咖啡機及沖煮相關器材", Icon = "⚙️", Color = "#708090", SortOrder = 5 },
            new() { Name = "奶精/奶粉", Code = "CREAMER", Description = "奶精與奶粉系列", Icon = "🥛", Color = "#F5F5DC", SortOrder = 6 },
            new() { Name = "糖漿/醬料", Code = "SYRUP", Description = "風味糖漿與醬料", Icon = "🍯", Color = "#DAA520", SortOrder = 7 },
            new() { Name = "糖/代糖", Code = "SUGAR", Description = "各類糖及代糖產品", Icon = "🍬", Color = "#FFB6C1", SortOrder = 8 },
            new() { Name = "其他", Code = "OTHER", Description = "其他咖啡相關產品", Icon = "📦", Color = "#9E9E9E", SortOrder = 9 },
        };

        db.Categories.AddRange(categories);
    }

    private static async Task SeedSiteSettingsAsync(AppDbContext db)
    {
        if (await db.SiteSettings.AnyAsync()) return;

        var settings = new List<SiteSetting>
        {
            new() { Key = "site_name", Value = "品皇咖啡" },
            new() { Key = "site_subtitle", Value = "專業烘焙，極致品味" },
            new() { Key = "contact_phone", Value = "02-2999-0000" },
            new() { Key = "contact_email", Value = "service@pinhung.com.tw" },
            new() { Key = "contact_address", Value = "新北市三重區重新路五段609巷12號" },
            new() { Key = "branch_info", Value = "[]" },
            new() { Key = "line_client_url", Value = "https://line.me/R/ti/p/@pinhung" },
            new() { Key = "footer_text", Value = "© 2026 品皇咖啡 Pin Huang Coffee. All rights reserved." },
            new() { Key = "logo_url", Value = "" },
            new() { Key = "payment_bank_transfer_enabled", Value = "true" },
            new() { Key = "payment_cash_enabled", Value = "true" },
            new() { Key = "bank_account_info", Value = "{\"bankName\":\"台灣銀行\",\"branch\":\"三重分行\",\"accountNumber\":\"請洽客服\",\"accountName\":\"品皇咖啡\"}" },
            new() { Key = "order_notification_email", Value = "" },
            new() { Key = "checkout_enabled", Value = "false" },
        };

        db.SiteSettings.AddRange(settings);
    }
}

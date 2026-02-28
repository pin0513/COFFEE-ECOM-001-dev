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
        await SeedTestimonialsAsync(db);
        await SeedStoresAsync(db);

        await db.SaveChangesAsync();

        // 分類 SpecTemplate 補充（SaveChangesAsync 後執行，確保分類已存在）
        await SeedCategorySpecTemplatesAsync(db);
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
            new() { Key = "brand_story_title", Value = "品皇咖啡的故事" },
            new() { Key = "brand_story_content", Value = "自 2010 年創立以來，品皇咖啡秉持著「專業烘焙，極致品味」的理念，精選世界各地最優質的咖啡豆，透過專業烘焙師的精湛技藝，為您呈現每一杯完美的咖啡。我們相信，好的咖啡不僅是一種飲品，更是一種生活態度，一種對品質的堅持。" },
        };

        db.SiteSettings.AddRange(settings);
    }

    private static async Task SeedTestimonialsAsync(AppDbContext db)
    {
        if (await db.Testimonials.AnyAsync()) return;

        var testimonials = new List<Testimonial>
        {
            new()
            {
                Content = "品質非常優良，每次購買都很滿意。咖啡豆新鮮烘焙，香氣十足，值得推薦！",
                AuthorName = "李先生",
                Rating = 5,
                IsVisible = true,
                SortOrder = 1,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Content = "送貨速度很快，包裝完整。客服態度親切，解答很詳細，購物體驗非常好！",
                AuthorName = "王小姐",
                Rating = 5,
                IsVisible = true,
                SortOrder = 2,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Content = "服務非常親切，商品品質穩定。已經回購多次，是我最信賴的咖啡供應商！",
                AuthorName = "陳先生",
                Rating = 5,
                IsVisible = true,
                SortOrder = 3,
                CreatedAt = DateTime.UtcNow
            },
        };

        db.Testimonials.AddRange(testimonials);
    }

    private static async Task SeedCategorySpecTemplatesAsync(AppDbContext db)
    {
        // 用 ExecuteSqlRawAsync 直接 UPDATE，避免 AnyAsync() 跳過的問題
        var templates = new Dictionary<string, string>
        {
            ["精品咖啡豆"] = """[{"key":"origin","label":"產地","type":"text"},{"key":"altitude","label":"海拔高度","type":"text"},{"key":"process","label":"處理法","type":"select","options":["日曬","水洗","蜜處理","厭氧"]},{"key":"roast","label":"烘焙度","type":"select","options":["淺焙","中淺焙","中焙","中深焙","深焙"]},{"key":"flavor","label":"風味描述","type":"text"},{"key":"body","label":"醇厚度","type":"select","options":["輕盈","中等","厚實"]},{"key":"acidity","label":"酸度","type":"select","options":["低","中","高"]},{"key":"brew","label":"推薦沖煮","type":"text"}]""",
            ["商業配方豆"] = """[{"key":"origin","label":"產地","type":"text"},{"key":"roast","label":"烘焙度","type":"select","options":["淺焙","中焙","中深焙","深焙"]},{"key":"flavor","label":"風味描述","type":"text"},{"key":"brew","label":"適合沖煮方式","type":"text"},{"key":"spec","label":"規格說明","type":"text"}]""",
            ["即溶/二合一/三合一"] = """[{"key":"brand","label":"品牌","type":"text"},{"key":"spec","label":"規格","type":"text"},{"key":"flavor","label":"口味","type":"text"},{"key":"sugar","label":"含糖量","type":"select","options":["無糖","微糖","半糖","全糖"]},{"key":"count","label":"數量/盒","type":"text"}]""",
            ["茶葉/花草茶"] = """[{"key":"teaType","label":"茶種","type":"select","options":["綠茶","紅茶","烏龍茶","普洱茶","白茶","花草茶","抹茶"]},{"key":"origin","label":"產地","type":"text"},{"key":"grade","label":"等級","type":"text"},{"key":"flavor","label":"風味描述","type":"text"},{"key":"brew","label":"沖泡建議","type":"text"}]""",
            ["咖啡機/沖煮器材"] = """[{"key":"brand","label":"品牌","type":"text"},{"key":"capacity","label":"適用容量","type":"text"},{"key":"material","label":"材質","type":"text"},{"key":"brewMethod","label":"適合沖煮方式","type":"select","options":["手沖","義式","法壓","虹吸","摩卡壺","冷萃","其他"]},{"key":"spec","label":"規格說明","type":"text"}]""",
            ["奶精/奶粉"] = """[{"key":"brand","label":"品牌","type":"text"},{"key":"spec","label":"規格","type":"text"},{"key":"target","label":"適用對象","type":"text"},{"key":"ingredient","label":"成分說明","type":"text"}]""",
            ["糖漿/醬料"] = """[{"key":"flavor","label":"口味","type":"text"},{"key":"volume","label":"容量","type":"text"},{"key":"ingredient","label":"成分說明","type":"text"},{"key":"usage","label":"使用建議","type":"text"}]""",
            ["糖/代糖"] = """[{"key":"brand","label":"品牌","type":"text"},{"key":"spec","label":"規格","type":"text"},{"key":"target","label":"適用對象","type":"text"}]""",
            ["其他"] = """[{"key":"brand","label":"品牌","type":"text"},{"key":"spec","label":"規格說明","type":"text"},{"key":"target","label":"適用對象","type":"text"}]""",
        };

        foreach (var (name, template) in templates)
        {
            // 只有 SpecTemplate 為 NULL 時才更新，避免覆蓋後台手動設定
            await db.Database.ExecuteSqlRawAsync(
                $"UPDATE \"Categories\" SET \"SpecTemplate\" = {{0}} WHERE \"Name\" = {{1}} AND \"SpecTemplate\" IS NULL",
                template, name);
        }
    }

    private static async Task SeedStoresAsync(AppDbContext db)
    {
        if (await db.Stores.AnyAsync()) return;

        db.Stores.Add(new Store
        {
            Name = "品皇咖啡 三重本店",
            Address = "新北市三重區重新路五段609巷12號",
            Phone = "02-2999-0000",
            BusinessHours = "週一至週六 09:00–18:00",
            IsVisible = true,
            SortOrder = 1,
            CreatedAt = DateTime.UtcNow
        });
    }
}

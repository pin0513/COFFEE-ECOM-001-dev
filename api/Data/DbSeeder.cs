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
        await SeedContentPagesAsync(db);

        await db.SaveChangesAsync();

        // 需依賴已存在的 Category ID，故在 SaveChangesAsync 之後執行
        await SeedProductsAsync(db);

        // 分類 SpecTemplate 補充（SaveChangesAsync 後執行，確保分類已存在）
        await SeedCategorySpecTemplatesAsync(db);

        // 補充既有 DB 缺少的 footer 連結設定（升級用，不影響新 DB）
        await EnsureFooterLinksAsync(db);
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
            new() { Key = "footer_links_shopping", Value = "[{\"label\":\"商品列表\",\"url\":\"/products\"},{\"label\":\"購物車\",\"url\":\"/cart\"},{\"label\":\"配送說明\",\"url\":\"/pages/shipping\"}]" },
            new() { Key = "footer_links_service", Value = "[{\"label\":\"聯絡我們\",\"url\":\"/pages/contact\"},{\"label\":\"常見問題\",\"url\":\"/pages/faq\"},{\"label\":\"關於我們\",\"url\":\"/pages/about\"}]" },
            new() { Key = "footer_social_facebook", Value = "" },
            new() { Key = "footer_social_instagram", Value = "" },
        };

        db.SiteSettings.AddRange(settings);
    }

    // 補充既有 DB 缺少的 footer 連結 key（升級用）
    private static async Task EnsureFooterLinksAsync(AppDbContext db)
    {
        var defaults = new Dictionary<string, string>
        {
            ["footer_links_shopping"] = "[{\"label\":\"商品列表\",\"url\":\"/products\"},{\"label\":\"購物車\",\"url\":\"/cart\"},{\"label\":\"配送說明\",\"url\":\"/pages/shipping\"}]",
            ["footer_links_service"]  = "[{\"label\":\"聯絡我們\",\"url\":\"/pages/contact\"},{\"label\":\"常見問題\",\"url\":\"/pages/faq\"},{\"label\":\"關於我們\",\"url\":\"/pages/about\"}]",
            ["footer_social_facebook"] = "",
            ["footer_social_instagram"] = "",
        };
        foreach (var (key, val) in defaults)
        {
            if (!await db.SiteSettings.AnyAsync(s => s.Key == key))
            {
                db.SiteSettings.Add(new SiteSetting { Key = key, Value = val, UpdatedAt = DateTime.UtcNow });
            }
        }
        await db.SaveChangesAsync();
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

    private static async Task SeedContentPagesAsync(AppDbContext db)
    {
        if (await db.ContentPages.AnyAsync()) return;

        var pages = new List<ContentPage>
        {
            new()
            {
                Slug = "about",
                TitleZhTW = "關於我們",
                BodyZhTW = """
## 品皇咖啡的故事

自 2010 年創立以來，品皇咖啡秉持著「專業烘焙，極致品味」的理念，精選世界各地最優質的咖啡豆，透過專業烘焙師的精湛技藝，為您呈現每一杯完美的咖啡。

### 我們的理念

我們相信，好的咖啡不僅是一種飲品，更是一種生活態度，一種對品質的堅持。

- **嚴選原料**：直接與世界各地咖啡農場合作，確保豆源品質
- **專業烘焙**：擁有超過 15 年經驗的烘焙師團隊，掌握每一批豆子的最佳風味
- **快速出貨**：烘焙後 48 小時內出貨，確保咖啡新鮮度

### 聯絡資訊

- 電話：02-2999-0000
- 地址：新北市三重區重新路五段609巷12號
- 營業時間：週一至週六 09:00–18:00
""",
                IsPublished = true,
                SortOrder = 1,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Slug = "contact",
                TitleZhTW = "聯絡我們",
                BodyZhTW = """
## 聯絡我們

有任何問題或需要協助，歡迎透過以下方式與我們聯繫。

### 聯絡方式

| 方式 | 資訊 |
|------|------|
| 電話 | 02-2999-0000 |
| Email | service@pinhung.com.tw |
| LINE | 請搜尋 @pinhung |

### 門市地址

**品皇咖啡 三重本店**
新北市三重區重新路五段609巷12號
營業時間：週一至週六 09:00–18:00

### 回覆時間

我們通常在一個工作天內回覆，週末與國定假日不在服務時間內。
若有緊急需求，建議透過電話或 LINE 聯繫我們。
""",
                IsPublished = true,
                SortOrder = 2,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Slug = "faq",
                TitleZhTW = "常見問題",
                BodyZhTW = """
## 常見問題

### 訂購相關

**Q：如何下單？**
在商品頁面選擇商品，加入購物車後前往結帳，填寫收件資訊即可完成訂購。

**Q：可以修改或取消訂單嗎？**
訂單成立後若需修改或取消，請於 24 小時內聯絡我們，出貨後恕無法取消。

**Q：有最低訂購金額嗎？**
目前沒有最低訂購金額限制。

---

### 付款相關

**Q：支援哪些付款方式？**
目前支援貨到付款與銀行轉帳兩種方式。

**Q：銀行轉帳帳號是哪個？**
下單時選擇銀行轉帳，系統會顯示帳號資訊，轉帳後請填寫後5碼以利核帳。

---

### 配送相關

**Q：何時出貨？**
一般商品通常在 1-2 個工作天內出貨，烘焙訂製商品需 3-5 個工作天。

**Q：有配送到全台嗎？**
是的，我們配送至全台灣，使用黑貓宅急便運送。

**Q：運費是多少？**
目前運費為固定費率，詳情請參考配送說明頁面。
""",
                IsPublished = true,
                SortOrder = 3,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Slug = "shipping",
                TitleZhTW = "配送說明",
                BodyZhTW = """
## 配送說明

### 配送範圍

配送至全台灣本島、澎湖、金門、馬祖。

### 出貨時間

| 商品類型 | 出貨時間 |
|---------|---------|
| 一般現貨商品 | 1-2 個工作天 |
| 烘焙訂製商品 | 3-5 個工作天 |
| 促銷限量商品 | 確認付款後 1-2 個工作天 |

> 注意：假日及國定假日不出貨，出貨時間順延。

### 運費說明

- 黑貓宅急便統一運費
- 詳細金額請洽客服確認

### 配送注意事項

1. 收件資訊請填寫正確，以免延誤配送
2. 若遇無人在家，物流公司將留通知單，請依指示辦理
3. 生鮮或冷藏商品請確保收件時有人在場

### 退換貨說明

收到商品後如有問題，請於 7 天內聯絡我們，我們將協助您處理。
退換貨需保持商品原包裝完整，開封後之食品恕無法退換。
""",
                IsPublished = true,
                SortOrder = 4,
                CreatedAt = DateTime.UtcNow
            },
        };

        db.ContentPages.AddRange(pages);
    }

    /// <summary>
    /// 測試商品（僅在空 DB 時執行，涵蓋所有前台功能情境）
    /// </summary>
    private static async Task SeedProductsAsync(AppDbContext db)
    {
        if (await db.Products.AnyAsync()) return;

        var catSpecialty  = await db.Categories.Where(c => c.Code == "SPECIALTY_BEANS").Select(c => c.Id).FirstOrDefaultAsync();
        var catCommercial = await db.Categories.Where(c => c.Code == "COMMERCIAL_BLEND").Select(c => c.Id).FirstOrDefaultAsync();
        var catInstant    = await db.Categories.Where(c => c.Code == "INSTANT_COFFEE").Select(c => c.Id).FirstOrDefaultAsync();
        var catEquipment  = await db.Categories.Where(c => c.Code == "EQUIPMENT").Select(c => c.Id).FirstOrDefaultAsync();
        var catSyrup      = await db.Categories.Where(c => c.Code == "SYRUP").Select(c => c.Id).FirstOrDefaultAsync();
        var catOther      = await db.Categories.Where(c => c.Code == "OTHER").Select(c => c.Id).FirstOrDefaultAsync();

        if (catSpecialty == 0 || catCommercial == 0) return; // 分類不存在則跳過

        var now = DateTime.UtcNow;

        var products = new List<Product>
        {
            // 1. 精選商品 + 大量購買（首頁展示用）
            new()
            {
                Sku = "TEST-001",
                Name = "衣索比亞 耶加雪菲 日曬",
                ShortDescription = "草莓果醬、茉莉花香、柑橘酸",
                Description = "來自耶加雪菲產區，日曬處理法帶出奔放果香，是精品咖啡入門首選。",
                CategoryId = catSpecialty,
                Price = 480, Unit = "半磅",
                IsActive = true, IsOrderable = true, IsFeatured = true,
                SortOrder = 1, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=750&fit=crop",
                BulkOptions = """[{"qty":3,"label":"3包","discount":8},{"qty":6,"label":"6包","discount":15}]""",
            },

            // 2. 定期訂購商品
            new()
            {
                Sku = "TEST-002",
                Name = "哥倫比亞 薇拉 水洗",
                ShortDescription = "焦糖、堅果、奶油餘韻",
                Description = "南美洲精品豆代表作，水洗處理呈現乾淨甜感，適合各種沖煮方式。",
                CategoryId = catSpecialty,
                Price = 420, Unit = "半磅",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 2, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=600&h=750&fit=crop",
                SubscriptionOptions = """{"discount":10,"frequencies":["每週","每兩週","每月"],"defaultFrequency":"每兩週"}""",
            },

            // 3. 促銷倒數 + 需預付款（即期特惠情境）
            new()
            {
                Sku = "TEST-003",
                Name = "肯亞 AA 日曬 即期特惠",
                ShortDescription = "黑醋栗、熱帶水果、莓果酸",
                Description = "肯亞 AA 等級，限量即期品，以優惠價讓您體驗頂級風味。",
                CategoryId = catSpecialty,
                Price = 320, Unit = "半磅",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 3, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&h=750&fit=crop",
                PromotionTag = "即期特惠",
                RequirePrePayment = true,
                PromotionEndAt = now.AddDays(3),
            },

            // 4. 大量購買優惠（商業配方豆）
            new()
            {
                Sku = "TEST-004",
                Name = "品皇 精選配方豆",
                ShortDescription = "均衡甜感，適合義式/手沖",
                Description = "品皇招牌配方，多年調配心血，適合餐廳、辦公室大量採購。",
                CategoryId = catCommercial,
                Price = 380, Unit = "1磅",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 4, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=750&fit=crop",
                BulkOptions = """[{"qty":5,"label":"5包","discount":10},{"qty":10,"label":"10包","discount":18},{"qty":20,"label":"20包","discount":25}]""",
            },

            // 5. 週末特惠促銷（標籤 + 倒數）
            new()
            {
                Sku = "TEST-005",
                Name = "瓜地馬拉 安提瓜 中深焙",
                ShortDescription = "黑巧克力、煙燻焦糖、奶甜",
                Description = "瓜地馬拉火山土壤孕育，中深焙帶出醇厚甜感，是美式咖啡愛好者首選。",
                CategoryId = catSpecialty,
                Price = 450, Unit = "半磅",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 5, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=750&fit=crop",
                PromotionTag = "週末限定",
                PromotionEndAt = now.AddDays(2),
            },

            // 6. 暫停販售（isOrderable = false）
            new()
            {
                Sku = "TEST-006",
                Name = "巴西 喜拉朵 日曬",
                ShortDescription = "堅果、黑巧克力、低酸甜感",
                Description = "巴西代表豆款，目前補貨中，暫停販售。",
                CategoryId = catSpecialty,
                Price = 360, Unit = "半磅",
                IsActive = true, IsOrderable = false, IsFeatured = false,
                SortOrder = 6, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1539167430869-89e80df698b4?w=600&h=750&fit=crop",
            },

            // 7. 未設定售價（price = 0，前台禁止加入購物車）
            new()
            {
                Sku = "TEST-007",
                Name = "品皇 商業配方 B（詢價）",
                ShortDescription = "大宗訂購專用，請洽客服報價",
                CategoryId = catCommercial,
                Price = 0, Unit = "公斤",
                IsActive = true, IsOrderable = false, IsFeatured = false,
                SortOrder = 7, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&h=750&fit=crop",
            },

            // 8. 大量優惠 + 定期訂購（雙重優惠）
            new()
            {
                Sku = "TEST-008",
                Name = "品皇 商業配方 C（訂閱＋批購）",
                ShortDescription = "醇厚低酸，辦公室最愛",
                Description = "適合長期合作客戶，支援定期配送與批量採購雙重優惠。",
                CategoryId = catCommercial,
                Price = 280, Unit = "1磅",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 8, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=750&fit=crop",
                BulkOptions = """[{"qty":5,"label":"5包","discount":8},{"qty":10,"label":"10包","discount":15}]""",
                SubscriptionOptions = """{"discount":5,"frequencies":["每月","每季"],"defaultFrequency":"每月"}""",
            },

            // 9. 精選禮盒 + 訂閱
            new()
            {
                Sku = "TEST-009",
                Name = "品皇 精選入門禮盒",
                ShortDescription = "三種風格豆款，初探精品咖啡",
                Description = "精心挑選淺、中、深三種烘焙度，讓您輕鬆探索咖啡世界。",
                CategoryId = catSpecialty,
                Price = 860, Unit = "禮盒",
                IsActive = true, IsOrderable = true, IsFeatured = true,
                SortOrder = 9, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1504627298434-2b6fb7adc609?w=600&h=750&fit=crop",
                SubscriptionOptions = """{"discount":8,"frequencies":["每月","每季"],"defaultFrequency":"每月"}""",
            },

            // 10. 即溶咖啡（不同分類）
            new()
            {
                Sku = "TEST-010",
                Name = "品皇 二合一咖啡（30入）",
                ShortDescription = "方便即沖，香醇不苦澀",
                CategoryId = catInstant,
                Price = 180, Unit = "盒",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 10, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=750&fit=crop",
                BulkOptions = """[{"qty":3,"label":"3盒","discount":5}]""",
            },

            // --- 以下為擴充商品（TEST-011 ~ TEST-024）---

            // 11. 手沖濾掛組合包 - 精選濾掛，有 BulkOptions，isFeatured=true
            new()
            {
                Sku = "TEST-011",
                Name = "品皇 手沖濾掛組合包（10入）",
                ShortDescription = "精選三款風味，旅行辦公皆適用",
                Description = "精選衣索比亞、哥倫比亞、瓜地馬拉三款風味濾掛，每包獨立封裝，新鮮鎖香，沖泡簡便不失品味。",
                CategoryId = catOther,
                Price = 650, Unit = "盒",
                IsActive = true, IsOrderable = true, IsFeatured = true,
                SortOrder = 11, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=400&q=80",
                BulkOptions = """[{"qty":2,"label":"2盒","discount":5},{"qty":4,"label":"4盒","discount":10}]""",
            },

            // 12. 耶加雪菲膠囊咖啡 - 膠囊，有 SubscriptionOptions（月訂/每兩月）
            new()
            {
                Sku = "TEST-012",
                Name = "品皇 耶加雪菲膠囊咖啡（10顆）",
                ShortDescription = "果香明亮，相容 Nespresso 膠囊機",
                Description = "採用衣索比亞耶加雪菲精品豆，精密萃取封裝，相容 Nespresso Original Line 膠囊機，一鍵享受精品咖啡。",
                CategoryId = catInstant,
                Price = 520, Unit = "盒",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 12, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&q=80",
                SubscriptionOptions = """{"discount":10,"frequencies":["每月","每兩月"],"defaultFrequency":"每月"}""",
            },

            // 13. 阿拉比卡精選咖啡豆 - 精品豆，promotionTag 買一送一，限時 5 天
            new()
            {
                Sku = "TEST-013",
                Name = "阿拉比卡 精選綜合咖啡豆",
                ShortDescription = "多產區混豆，層次豐富，均衡易飲",
                Description = "嚴選中南美洲、非洲三大產區阿拉比卡豆，中焙調和，呈現焦糖甜感與柔和果酸，是每日飲用的好選擇。",
                CategoryId = catSpecialty,
                Price = 799, Unit = "半磅",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 13, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1611564494260-6f21b80af7ea?w=400&q=80",
                PromotionTag = "買一送一",
                PromotionEndAt = now.AddDays(5),
            },

            // 14. 品皇手沖濾杯套組 - 器材，IsOrderable=true，無特殊
            new()
            {
                Sku = "TEST-014",
                Name = "品皇 陶瓷手沖濾杯套組",
                ShortDescription = "V60 造型，導流均勻，入門首選",
                Description = "品皇自選陶瓷手沖濾杯，附不鏽鋼支架與濾紙 30 張，導流設計精準控制水流，輕鬆沖出均勻萃取風味，適合手沖新手與進階玩家。",
                CategoryId = catEquipment,
                Price = 1200, Unit = "組",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 14, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1556742031-c6961e8560b0?w=400&q=80",
            },

            // 15. 黑糖咖啡糖漿 - 糖漿，promotionTag 新品上市
            new()
            {
                Sku = "TEST-015",
                Name = "品皇 黑糖咖啡風味糖漿",
                ShortDescription = "台灣黑糖煉製，濃郁香甜不膩",
                Description = "選用台灣在地黑糖熬製，帶有自然甘蔗香氣與焦糖尾韻，適合加入拿鐵、美式或手搖飲，賦予咖啡獨特的台灣風味。",
                CategoryId = catSyrup,
                Price = 280, Unit = "瓶",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 15, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1609951651556-5334e2706168?w=400&q=80",
                PromotionTag = "新品上市",
            },

            // 16. 淺焙衣索比亞 1kg - 精品豆，BulkOptions，isFeatured=true
            new()
            {
                Sku = "TEST-016",
                Name = "衣索比亞 淺焙 耶加雪菲 淨重 1kg",
                ShortDescription = "大容量划算裝，草莓藍莓果香",
                Description = "衣索比亞 Kochere 產區，海拔 1900m，日曬淺焙，展現奔放莓果與花香風味。1kg 大容量適合重度咖啡愛好者或小型咖啡館採購。",
                CategoryId = catSpecialty,
                Price = 960, Unit = "1公斤",
                IsActive = true, IsOrderable = true, IsFeatured = true,
                SortOrder = 16, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1606791422814-b32c705e3e2f?w=400&q=80",
                BulkOptions = """[{"qty":2,"label":"2件","discount":5},{"qty":3,"label":"3件","discount":10}]""",
            },

            // 17. 品皇經典馬克杯 - 周邊，無特殊
            new()
            {
                Sku = "TEST-017",
                Name = "品皇 經典馬克杯",
                ShortDescription = "320ml 陶瓷杯，印有品皇 Logo",
                Description = "品皇咖啡官方周邊，高品質陶瓷燒製，320ml 容量，厚實保溫，簡約設計適合日常使用或作為伴手禮。",
                CategoryId = catOther,
                Price = 350, Unit = "個",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 17, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80",
            },

            // 18. 薩爾瓦多 水洗 中烘 - 精品豆，SubscriptionOptions（週訂/月訂）
            new()
            {
                Sku = "TEST-018",
                Name = "薩爾瓦多 聖塔安娜 水洗 中烘",
                ShortDescription = "奶油感、柑橘酸、甜感細膩",
                Description = "來自薩爾瓦多聖塔安娜火山產區，水洗處理法呈現乾淨果酸與柑橘香，中焙保留明亮甜感，適合手沖與拿鐵，是每日固定飲用的好選擇。",
                CategoryId = catSpecialty,
                Price = 580, Unit = "半磅",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 18, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1580933073521-dc49ac0d4e6a?w=400&q=80",
                SubscriptionOptions = """{"discount":8,"frequencies":["每週","每月"],"defaultFrequency":"每月"}""",
            },

            // 19. 台灣高山咖啡豆 - 精品豆，promotionTag 台灣之光，requirePrePayment，限時 7 天
            new()
            {
                Sku = "TEST-019",
                Name = "台灣 阿里山 高山咖啡豆",
                ShortDescription = "海拔 1600m，蜜處理，花香甜感",
                Description = "嘉義阿里山產區，海拔 1600m 以上，當季採收，蜜處理法保留果皮甜感，呈現烏龍茶香、柑橘蜜糖風味，台灣精品咖啡之光。限量供應，預購需預付款。",
                CategoryId = catSpecialty,
                Price = 1200, Unit = "半磅",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 19, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80",
                PromotionTag = "台灣之光",
                RequirePrePayment = true,
                PromotionEndAt = now.AddDays(7),
            },

            // 20. 濾掛綜合 30 入 - 有 BulkOptions 2-tier + SubscriptionOptions，isFeatured=true
            new()
            {
                Sku = "TEST-020",
                Name = "品皇 濾掛咖啡 綜合口味 30入",
                ShortDescription = "輕焙/中焙/深焙各 10 包，天天不重複",
                Description = "集結品皇三款經典烘焙度濾掛咖啡，每日輪替品飲，輕鬆感受咖啡風味的多變層次。獨立封裝，攜帶方便，支援定期訂閱讓您永遠不斷貨。",
                CategoryId = catOther,
                Price = 420, Unit = "盒",
                IsActive = true, IsOrderable = true, IsFeatured = true,
                SortOrder = 20, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1559525839-8a0fde8b38f3?w=400&q=80",
                BulkOptions = """[{"qty":2,"label":"2盒","discount":5},{"qty":4,"label":"4盒","discount":10}]""",
                SubscriptionOptions = """{"discount":8,"frequencies":["每月","每季"],"defaultFrequency":"每月"}""",
            },

            // 21. 品皇商業豆 10kg 裝 - 商業豆，BulkOptions 3-tier，requirePrePayment
            new()
            {
                Sku = "TEST-021",
                Name = "品皇 商業配方豆 10kg 裝",
                ShortDescription = "餐廳、辦公室大宗採購首選",
                Description = "品皇專業商業配方，適合義式咖啡機萃取，穩定均衡風味確保出杯品質一致。10kg 大裝適合餐廳、連鎖飲料店、辦公室大量採購，需預付款後安排出貨。",
                CategoryId = catCommercial,
                Price = 2800, Unit = "10公斤",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 21, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80",
                BulkOptions = """[{"qty":2,"label":"2袋","discount":5},{"qty":3,"label":"3袋","discount":8},{"qty":5,"label":"5袋","discount":12}]""",
                RequirePrePayment = true,
            },

            // 22. 咖啡知識禮盒組 - 禮盒，isFeatured=false，普通商品
            new()
            {
                Sku = "TEST-022",
                Name = "品皇 咖啡知識禮盒組",
                ShortDescription = "精品豆 ×2 + 手沖量杯 + 風味輪卡",
                Description = "送禮自用兩相宜，禮盒內含精品咖啡豆兩款（各半磅）、專業手沖量杯及精美咖啡風味輪卡一套，附品皇咖啡知識手冊，是送給咖啡愛好者的最佳禮物。",
                CategoryId = catOther,
                Price = 1580, Unit = "禮盒",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 22, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=400&q=80",
            },

            // 23. 肯亞 AA 即期 5 折 - 精品豆，promotionTag，requirePrePayment，限時 1 天
            new()
            {
                Sku = "TEST-023",
                Name = "肯亞 AA 特選 即期下殺",
                ShortDescription = "黑醋栗、莓果酸、熱帶果香",
                Description = "頂級肯亞 AA 等級，即期優惠出清，原價 NT$480，限時以半價供應。需預付款，庫存有限售完為止，把握機會以實惠價格體驗非洲精品風味。",
                CategoryId = catSpecialty,
                Price = 240, Unit = "半磅",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 23, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&q=80",
                PromotionTag = "即期5折",
                RequirePrePayment = true,
                PromotionEndAt = now.AddDays(1),
            },

            // 24. 品皇濃縮膠囊 - 膠囊，SubscriptionOptions（月訂）+ BulkOptions
            new()
            {
                Sku = "TEST-024",
                Name = "品皇 濃縮義式膠囊咖啡（10顆）",
                ShortDescription = "深烘義式風味，濃郁醇厚，一鍵萃取",
                Description = "採用深焙配方豆，高壓萃取封裝，呈現義式濃縮的醇厚焦糖香與持久 Crema，相容 Nespresso Original Line 膠囊機，搭配月訂方案享有長期折扣。",
                CategoryId = catInstant,
                Price = 720, Unit = "盒",
                IsActive = true, IsOrderable = true, IsFeatured = false,
                SortOrder = 24, CreatedAt = now,
                ImageUrl = "https://images.unsplash.com/photo-1522992319-0365e5f11656?w=400&q=80",
                BulkOptions = """[{"qty":2,"label":"2盒","discount":5},{"qty":4,"label":"4盒","discount":10}]""",
                SubscriptionOptions = """{"discount":10,"frequencies":["每月"],"defaultFrequency":"每月"}""",
            },
        };

        db.Products.AddRange(products);
        await db.SaveChangesAsync();
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

# api/ — 後端 Claude 工作上下文

## 技術棧
ASP.NET Core 8 Minimal API + EF Core 8 + PostgreSQL 16 + BCrypt.Net-Next + JWT Bearer

## 啟動

```bash
# PostgreSQL 需先啟動（在上上層目錄執行 docker compose up db -d）
dotnet run --urls http://localhost:5000

# 首次建立 DB schema
dotnet ef database update
```

## 關鍵檔案

| 檔案 | 說明 |
|------|------|
| `Program.cs` | 所有端點定義（Minimal API，單一檔案） |
| `Data/AppDbContext.cs` | EF Core DbContext |
| `Data/DbSeeder.cs` | Seed 資料（9 個分類、site-settings、admin 帳號） |
| `appsettings.json` | 本地設定（DB、JWT、UploadPath） |
| `appsettings.Production.json` | 生產設定（由 VM .env 覆蓋） |

## Models

| Model | 說明 |
|-------|------|
| `Admin` | 後台管理員（BCrypt 密碼） |
| `Product` | 商品（含 SpecData JSON、IsOrderable、InventoryEnabled） |
| `Category` | 分類（含 SpecTemplate JSON） |
| `SiteSetting` | 網站設定 key-value |
| `Order` / `OrderItem` / `Customer` | 訂單系統 |
| `InventoryTransaction` | 庫存異動（Phase 2 備用） |

## SiteSetting Keys
```
site_name, site_subtitle, contact_phone, contact_email, contact_address,
branch_info, line_client_url, footer_text, logo_url,
checkout_enabled, payment_bank_transfer_enabled, payment_cash_enabled,
bank_account_info, order_notification_email
```

## DB 連線（本地）
```
Host=localhost;Port=5433;Database=coffeeShopDB;Username=postgres;Password=CoffeeShop2026!
```

## Migrations
```bash
# 新增 migration
dotnet ef migrations add MigrationName

# 套用
dotnet ef database update
```

## API 回應格式
- 商品列表: `{ data[], page, pageSize, totalCount, totalPages }` （camelCase）
- 通用錯誤: `{ error: "message" }` 或 `{ message: "..." }`

## 上傳路徑
- 本地: `data/uploads/`（相對於 api/ 執行目錄）
- VM: `/mnt/ecweb/uploads/`（bind mount）

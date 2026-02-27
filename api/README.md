# 小葉咖啡店 API

**技術棧**: ASP.NET Core 8.0 Minimal API
**狀態**: Mock System (第一階段)
**版本**: v1.0

## 專案說明

此為小葉咖啡店電商平台的後端 API，採用 **Minimal API + Mock System 策略**：
- 使用 .NET 8.0 Minimal API 架構（輕量、高效能）
- 所有端點定義在 `Program.cs` 中，無需 Controllers
- 使用 Mock Data 模擬資料回應
- 前端可先串接開發，不需等待資料庫實作
- 後續階段將整合 SQL Azure Edge + Firestore

## 專案結構

```
Api/
├── Models/                 # 資料模型
│   ├── Product.cs
│   ├── Category.cs
│   ├── ProductBatch.cs
│   ├── ProductAttribute.cs
│   ├── Order.cs
│   ├── OrderItem.cs
│   └── Customer.cs
├── DTOs/                   # 資料傳輸物件
│   ├── ProductDto.cs
│   ├── CategoryDto.cs
│   └── OrderDto.cs
├── MockData/               # Mock 資料產生器
│   └── MockDataSeeder.cs
├── Services/               # 業務邏輯 (待實作)
├── Data/                   # 資料存取 (待實作)
├── Program.cs              # 應用程式進入點 + 所有 API 端點定義
└── appsettings.json        # 設定檔
```

**Minimal API 優點**：
- ✅ 程式碼簡潔（直接在 Program.cs 定義端點）
- ✅ 效能更好（減少抽象層）
- ✅ 學習曲線平緩（不需要理解 Controller 機制）
- ✅ 更適合輕量 API 與微服務

## API 端點

### 商品 API (`/api/products`)

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/products` | 取得商品列表 |
| GET | `/api/products/{id}` | 取得商品詳細資訊 |
| GET | `/api/products/near-expiry` | 取得即期商品列表 |

**查詢參數**:
- `categoryId` (int): 篩選分類
- `featured` (bool): 只顯示精選商品

**回應範例** (`GET /api/products/1`):
```json
{
  "id": 1,
  "sku": "COFFEE-001",
  "name": "衣索比亞 耶加雪菲",
  "description": "淺焙，花香果香，柔順酸感",
  "categoryId": 1,
  "categoryName": "咖啡豆",
  "price": 480,
  "discountPrice": 240,
  "stockQuantity": 50,
  "unit": "磅",
  "imageUrl": "/images/products/yirgacheffe.jpg",
  "isActive": true,
  "isFeatured": true,
  "isNearExpiry": true,
  "attributes": [
    { "name": "處理法", "value": "水洗" },
    { "name": "產地", "value": "衣索比亞" },
    { "name": "烘焙度", "value": "淺焙" }
  ]
}
```

---

### 分類 API (`/api/categories`)

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/categories` | 取得分類列表 |
| GET | `/api/categories/{id}` | 取得分類詳細資訊 |

**回應範例** (`GET /api/categories`):
```json
[
  {
    "id": 1,
    "name": "咖啡豆",
    "code": "COFFEE_BEANS",
    "description": "新鮮烘焙的精品咖啡豆",
    "icon": "☕",
    "color": "#6F4E37",
    "sortOrder": 1,
    "productCount": 3
  }
]
```

---

### 訂單 API (`/api/orders`)

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/orders` | 取得訂單列表 |
| GET | `/api/orders/{id}` | 取得訂單詳細資訊 |
| POST | `/api/orders` | 建立新訂單 (Mock) |

**查詢參數**:
- `customerId` (int): 篩選客戶
- `status` (string): 篩選訂單狀態

**建立訂單請求範例** (`POST /api/orders`):
```json
{
  "customerId": 1,
  "paymentMethod": "CreditCard",
  "recipientName": "王小明",
  "recipientPhone": "0912345678",
  "shippingAddress": "台北市中正區羅斯福路一段100號",
  "notes": "請盡快出貨",
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}
```

## 快速開始

### 前置需求
- .NET 8.0 SDK
- 任一 IDE (Visual Studio / Rider / VS Code)

### 執行步驟

```bash
# 1. 進入 Api 目錄
cd Api

# 2. 還原套件
dotnet restore

# 3. 執行專案
dotnet run

# 4. 開啟瀏覽器訪問 Swagger UI
# https://localhost:5001
```

### 開發模式執行 (Hot Reload)

```bash
dotnet watch run
```

## Mock Data 說明

目前 API 使用 `MockDataSeeder` 提供測試資料：

### 商品資料
- 6 個商品 (咖啡豆、器材、調味品、糖漿)
- 含商品屬性 (處理法、產地、海拔、烘焙度)

### 批次資料 (效期管理)
- 5 個批次
- 包含新鮮批次、即期批次、接近即期批次
- 自動降價機制 (50%/40%)

### 客戶資料
- 3 個客戶 (B2C 一般/VIP、B2B 經銷商)

### 訂單資料
- 3 筆訂單 (已完成、處理中、B2B 大量訂單)

## 開發規範

### Coding Style
遵循 [coding-style.md](/Users/paul_huang/AgentProjects/claude-global/rules/coding-style.md) 規範：
- Classes/Methods/Properties: PascalCase
- Private fields: _camelCase
- Minimal API 使用 `//` 註解（XML 註解不適用於 lambda 表達式）

### API 設計原則
- RESTful 風格
- 使用 Minimal API 端點定義（`app.MapGet()`, `app.MapPost()` 等）
- 使用 DTO 避免過度暴露 Model
- 統一錯誤回應格式
- HTTP Status Code 正確使用
- 使用 `Results.Ok()`, `Results.NotFound()` 等標準回應

### 回應格式範例

**成功回應**:
```json
{
  "data": { ... }
}
```

**錯誤回應**:
```json
{
  "message": "找不到商品 ID: 999"
}
```

## 下一階段：資料庫整合

### 待實作項目
- [ ] Entity Framework Core 設定
- [ ] SQL Azure Edge 連線
- [ ] Migration 機制
- [ ] Repository Pattern
- [ ] Unit of Work
- [ ] Firestore 檔案上傳

### 資料庫設計
詳見 [database-design.md](/Users/paul_huang/DEV/小葉咖啡店-電商平台/docs/database-design.md)

## Swagger UI

API 文件使用 Swagger UI 自動生成，啟動專案後訪問根路徑即可查看完整 API 規格。

**URL**: https://localhost:5001

## 問題排查

### 問題 1: CORS 錯誤
**症狀**: 前端無法存取 API
**解決**: 確認 Program.cs 中 CORS 設定的前端 port 是否正確

### 問題 2: Swagger 無法顯示 XML 註解
**症狀**: API 說明文字沒出現
**解決**: 確認 .csproj 已啟用 `GenerateDocumentationFile`

## 相關文件

- [專案總覽](/Users/paul_huang/DEV/小葉咖啡店-電商平台/README.md)
- [API 規格文檔](/Users/paul_huang/DEV/小葉咖啡店-電商平台/docs/api-spec.md)
- [資料庫設計](/Users/paul_huang/DEV/小葉咖啡店-電商平台/docs/database-design.md)

## License

© 2026 Super Case Company. All rights reserved.

# 小葉咖啡店 - 電商前台 (Web)

## 專案說明

這是小葉咖啡店電商平台的前台網站，使用 React + TypeScript + Vite 開發，展示完整的購物流程。

## 技術棧

- **框架**: React 19 + TypeScript
- **建置工具**: Vite 7
- **UI 框架**: Ant Design 6
- **路由**: React Router 7
- **狀態管理**: Zustand
- **HTTP 客戶端**: Axios

## 功能展示

### 完整購物流程

1. **首頁** (`/`) - 品牌介紹與特色展示
2. **商品列表** (`/products`) - 瀏覽所有商品，支援分類篩選
3. **商品詳情** (`/products/:id`) - 查看商品詳細資訊，加入購物車
4. **購物車** (`/cart`) - 管理購物車商品，調整數量
5. **結帳** (`/checkout`) - 填寫收件資訊，選擇付款方式
6. **訂單完成** (`/order-success`) - 顯示訂單確認資訊

### 使用 Mock 資料

目前版本使用 Mock 資料展示流程，不需要真實的後端 API。

- 商品資料：`src/data/mockProducts.ts`
- 購物車狀態：`src/stores/cartStore.ts` (Zustand)

## 本機開發

### 前置需求

- Node.js 20+
- pnpm 10+

### 安裝與執行

```bash
# 安裝依賴
pnpm install

# 開發模式
pnpm dev

# 建置
pnpm build

# 預覽建置結果
pnpm preview
```

開發模式預設在 `http://localhost:5173`

## Docker 建置

```bash
# 建置 Docker image
docker build -t coffee-web .

# 執行容器
docker run -p 8080:80 coffee-web
```

存取 `http://localhost:8080`

## 部署到 GCP Cloud Run

### 手動部署

```bash
# 1. 設定 GCP 專案
gcloud config set project coffee-ecom-001

# 2. 建置並推送到 Artifact Registry
IMAGE_TAG=asia-east1-docker.pkg.dev/coffee-ecom-001/coffee-ecom/coffee-web:latest
docker build -t $IMAGE_TAG .
docker push $IMAGE_TAG

# 3. 部署到 Cloud Run
gcloud run deploy coffee-web \
  --image $IMAGE_TAG \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1
```

### 自動部署 (GitHub Actions)

推送到 `main` 分支且影響 `Web/**` 時，會自動觸發部署。

需要設定 GitHub Secret:
- `GCP_SA_KEY`: GCP Service Account 金鑰 (JSON 格式)

## 專案結構

```
Web/
├── src/
│   ├── pages/              # 頁面組件
│   │   ├── HomePage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── CartPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   └── OrderSuccessPage.tsx
│   ├── stores/             # 狀態管理
│   │   └── cartStore.ts
│   ├── data/               # Mock 資料
│   │   └── mockProducts.ts
│   ├── App.tsx             # 路由設定
│   └── main.tsx            # 入口點
├── Dockerfile              # Docker 建置檔
├── nginx.conf              # Nginx 設定
└── package.json
```

## 環境變數

目前版本不需要環境變數，未來整合真實 API 時可能需要：

```env
VITE_API_BASE_URL=https://api.coffee-shop.com
```

## 已知限制 (MVP)

- 使用 Mock 資料，沒有真實的後端 API
- 沒有使用者認證
- 訂單資料不會保存
- 沒有金流整合

## 下一步規劃

1. 整合真實的後端 API
2. 加入使用者認證 (登入/註冊)
3. 金流整合 (信用卡、Line Pay)
4. 會員功能 (訂單歷史、收藏商品)
5. 效能優化 (Code Splitting、圖片優化)

## License

© 2026 Super Case Company. All rights reserved.

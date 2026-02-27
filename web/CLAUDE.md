# web/ — 前台 Claude 工作上下文

## 技術棧
React 19 + Vite + TypeScript + Ant Design v6 + Zustand

## 頁面對應

| 路由 | 檔案 | 設計稿 |
|------|------|--------|
| `/` | `HomePage.tsx` | P001 |
| `/products` | `ProductsPage.tsx` | P002 |
| `/products/:id` | `ProductDetailPage.tsx` | P003 |
| `/cart` | `CartPage.tsx` | P004 |
| `/checkout` | `CheckoutPage.tsx` | P005 |
| `/order-success` | `OrderSuccessPage.tsx` | P006 |

> `AdminDashboardPage`, `AdminLoginPage` 等是孤立佔位頁，無路由，不需維護。

## 重要檔案

| 檔案 | 說明 |
|------|------|
| `src/stores/cartStore.ts` | 購物車狀態（Zustand） |
| `src/config/api.ts` | API base URL + `getImageUrl()` |
| `src/services/productService.ts` | 商品 API 呼叫 |
| `src/services/siteSettingsService.ts` | 網站設定 API |
| `src/services/orderService.ts` | 訂單 API |
| `src/contexts/AuthContext.tsx` | Firebase Auth（前台訪客） |
| `src/components/Layout.tsx` | 全站 Layout（含 LINE 浮動按鈕） |
| `src/styles/design-tokens.css` | 設計 token（必須在 main.tsx import） |

## 已知陷阱
- `main.tsx` 必須 `import './styles/design-tokens.css'`，否則 CSS 全壞
- `App.css` / `index.css` 不能有 Vite 預設模板殘留（`body { display: flex }` 等）
- `ProductsPage` Select onChange 的 `v` 型別是 `string | number`，要 cast 為 `number`
- API 回應是 camelCase：`{ data, page, pageSize, totalCount, totalPages }`

## 與設計稿對稿
```bash
pnpm build && pnpm preview   # http://localhost:4173
# 對照 ../../designs/ 目錄下的 HTML 設計稿
```

## checkout_enabled 邏輯
`site-settings` 的 `checkout_enabled=false` 時：
- CartPage: 顯示警告，禁用結帳按鈕
- ProductDetailPage: 隱藏加入購物車
- 0元商品: 永遠禁用加入購物車

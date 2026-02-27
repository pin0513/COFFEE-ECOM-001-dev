# admin/ — 後台 Claude 工作上下文

## 技術棧
React 19 + Vite + TypeScript + Ant Design v6 + Zustand

## 頁面對應

| 路由 | 檔案 | 設計稿 |
|------|------|--------|
| `/login` | `LoginPage.tsx` | — |
| `/` | `Dashboard.tsx` | A001 |
| `/orders` | `OrderManagement.tsx` | A002 |
| `/products` | `ProductManagement.tsx` | A003 |
| `/categories` | `CategoryManagement.tsx` | — |
| `/settings` | `SiteSettings.tsx` | A005 |
| `/admins` | `AdminManagement.tsx` | A006 |

## 重要檔案

| 檔案 | 說明 |
|------|------|
| `src/contexts/AuthContext.tsx` | JWT Auth（完全替換 Firebase） |
| `src/config/api.ts` | API base URL |
| `src/pages/ProductManagement.tsx` | 商品 CRUD + 圖片上傳 + 批次操作 + CSV 匯入 |
| `src/pages/SiteSettings.tsx` | 全站設定（含付款、LINE 客服、checkout 開關） |
| `src/data/mockData.ts` | 測試/開發用 mock 資料（非正式資料） |

## Auth 機制
- JWT 存 localStorage: `auth_token`, `auth_user`
- 登入帳號: `pin0513@gmail.com` / `Test1234`
- `ProtectedRoute.tsx` 保護所有後台路由
- Firebase 已完全移除（後台不再用 Firebase）

## Ant Design v6 注意
- `Divider orientation="left"` 不合法（已移除），用 `orientation="center"` 或拿掉
- Upload component 需 `customRequest` 覆寫預設行為

## 已知陷阱
- `mockApi.ts` 中的 Product 型別要與 `productService.ts` 的 interface 保持同步
- 批次操作 API: `POST /api/products/batch`（body: `{ ids, action }`）

## 與設計稿對稿
```bash
pnpm build && pnpm preview   # http://localhost:4174
# 對照 ../../designs/ 目錄下的 A0xx 設計稿
```

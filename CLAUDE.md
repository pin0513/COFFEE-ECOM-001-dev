# dev/ — Claude 工作上下文

## 概覽
品皇咖啡電商平台程式碼。三個子專案獨立運作，透過 API 串接。

| 子專案 | 路徑 | 技術 | Port | 說明 |
|--------|------|------|------|------|
| 前台 | `web/` | React + Vite + Ant Design | 5173 | 客戶購物前台 |
| 後台 | `admin/` | React + Vite + Ant Design | 5174 | 商家管理後台 |
| API | `api/` | ASP.NET Core 8 + EF Core | 5000 | 後端 API + PostgreSQL |

## 啟動順序

```bash
# 1. 啟動 PostgreSQL（用上層目錄的 docker-compose）
cd .. && docker compose up db -d

# 2. 啟動 API
cd api && dotnet run --urls http://localhost:5000

# 3. 啟動前台
cd web && pnpm dev   # http://localhost:5173

# 4. 啟動後台
cd admin && pnpm dev  # http://localhost:5174
```

## Git 資訊
- Repo: https://github.com/pin0513/COFFEE-ECOM-001-dev.git
- 主分支: `main`（持續開發）
- 斷點: `releases/20260226_V0.3` / tag `v0.3`

## 重要設定
- JWT: localStorage key `auth_token`, `auth_user`
- Admin 帳號: `pin0513@gmail.com` / `Test1234`
- PostgreSQL: port 5433（本地）/ 5432（Docker 內部）
- 圖片上傳路徑: `data/uploads/`（本地），VM 上為 `/mnt/ecweb/uploads/`

## 關鍵架構決策
- 前台狀態管理: Zustand `cartStore`（不用 React context）
- 前台 Auth: Firebase（訪客功能）
- 後台 Auth: JWT Bearer（完全替換 Firebase）
- SiteSetting: key-value table（9 個設定 key）
- 商品: `isOrderable`（可下單）、`inventoryEnabled`（選擇性庫存追蹤，預設 false）

## 目前版本對應
- 程式: Phase 1 V0.3（2026-02-26）
- 設計: v3.2（2026-02-20）
- 詳細進度: `../spec/PROGRESS_CHECKLIST.md`

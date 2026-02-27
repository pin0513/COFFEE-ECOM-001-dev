# 產品圖片目錄

## 目錄結構

```
products/
├── beans/          # 咖啡豆產品圖片
├── equipment/      # 器材產品圖片
├── syrups/         # 糖漿產品圖片
└── featured/       # 精選商品圖片
```

## 使用方式

### Mock 階段（目前）
使用 Placeholder URL 作為圖片來源：

```tsx
// React 組件中使用
<img
  src="https://placehold.co/800x800/d4a574/ffffff/webp?text=Espresso+Blend"
  alt="品皇義式濃縮綜合豆"
  loading="lazy"
  width={800}
  height={800}
/>
```

### 正式版階段
將實際產品圖片放置於對應分類目錄：

```
products/beans/espresso-blend.webp
products/equipment/espresso-machine.webp
```

## 圖片規格

- **格式**：WebP（壓縮優化）
- **尺寸**：800x800px（1:1 正方形）
- **檔案大小**：< 100KB
- **命名規則**：小寫英文，連字符分隔（例：`espresso-blend.webp`）

## Mock 產品清單

完整產品清單與規格請參考：
📄 `/docs/design/mock-products.json`

## 設計風格

參考 Blue Bottle Coffee 極簡風格：
- 乾淨背景，產品為主角
- 溫暖咖啡色調（#d4a574, #8c6236）
- 留白充足
- 統一構圖

詳細說明請參考：
📄 `/docs/design/image-sources.md`

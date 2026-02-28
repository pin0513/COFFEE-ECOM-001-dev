// 注意：這是舊版 cartStore 商品格式（已棄用），僅保留作為靜態測試資料
interface LegacyCartProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

export const mockProducts: LegacyCartProduct[] = [
  {
    id: 'coffee-001',
    name: '衣索比亞 耶加雪菲',
    price: 450,
    image: 'https://via.placeholder.com/300x300?text=Yirgacheffe',
    category: '咖啡豆',
    description: '帶有花香與水果香氣，口感清新明亮，適合淺焙愛好者'
  },
  {
    id: 'coffee-002',
    name: '哥倫比亞 薇拉',
    price: 420,
    image: 'https://via.placeholder.com/300x300?text=Colombia',
    category: '咖啡豆',
    description: '甜感豐富，帶有焦糖與堅果香氣，平衡度極佳'
  },
  {
    id: 'coffee-003',
    name: '巴西 喜拉朵',
    price: 380,
    image: 'https://via.placeholder.com/300x300?text=Brazil',
    category: '咖啡豆',
    description: '濃郁巧克力風味，低酸度，適合義式咖啡'
  },
  {
    id: 'coffee-004',
    name: '曼特寧 黃金',
    price: 480,
    image: 'https://via.placeholder.com/300x300?text=Mandheling',
    category: '咖啡豆',
    description: '醇厚度高，帶有草本與泥土香氣，適合深焙'
  },
  {
    id: 'equipment-001',
    name: 'Hario V60 手沖壺',
    price: 850,
    image: 'https://via.placeholder.com/300x300?text=V60',
    category: '烘焙器材',
    description: '經典手沖壺，不銹鋼材質，容量 600ml'
  },
  {
    id: 'equipment-002',
    name: '虹吸壺 3人份',
    price: 1200,
    image: 'https://via.placeholder.com/300x300?text=Syphon',
    category: '烘焙器材',
    description: '日式虹吸壺，玻璃材質，完美展現咖啡香氣'
  },
  {
    id: 'syrup-001',
    name: '香草風味糖漿',
    price: 180,
    image: 'https://via.placeholder.com/300x300?text=Vanilla',
    category: '風味糖漿',
    description: '天然香草萃取，不含人工添加物，300ml'
  },
  {
    id: 'syrup-002',
    name: '焦糖風味糖漿',
    price: 180,
    image: 'https://via.placeholder.com/300x300?text=Caramel',
    category: '風味糖漿',
    description: '濃郁焦糖香氣，適合拿鐵與美式咖啡，300ml'
  }
];

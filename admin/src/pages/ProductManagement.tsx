import { useEffect, useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, InputNumber, Select,
  Switch, Space, message, Upload, Tag, Dropdown, Divider, Checkbox, DatePicker,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, ImportOutlined, LoadingOutlined, DownOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { apiClient } from '../config/api';

interface SpecField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number';
  options?: string[];
}

interface Category {
  id: number;
  name: string;
  specTemplate?: string | null;
}

interface BulkTier {
  qty: number;
  label: string;
  discount: number;
}

interface Product {
  id: number;
  sku: string;
  name: string;
  shortDescription: string | null;
  brand: string | null;
  categoryId: number;
  categoryName: string | null;
  price: number;
  unit: string;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  isOrderable: boolean;
  inventoryEnabled: boolean;
  stockQuantity: number;
  specData: string | null;
  bulkOptions: string | null;
  subscriptionOptions: string | null;
  parentProductId: number | null;
  variantLabel: string | null;
  promotionTag: string | null;
  requirePrePayment: boolean;
  promotionEndAt: string | null;
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isImportVisible, setIsImportVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [importFile, setImportFile] = useState<UploadFile[]>([]);
  const [importResult, setImportResult] = useState<{ inserted: number; updated: number; errors: string[] } | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [allowBulk, setAllowBulk] = useState(false);
  const [bulkTiers, setBulkTiers] = useState<BulkTier[]>([]);
  const [allowSubscription, setAllowSubscription] = useState(false);
  const [subDiscount, setSubDiscount] = useState(10);
  const [subFreqs, setSubFreqs] = useState<string[]>(['每兩週', '每月']);
  const [subDefault, setSubDefault] = useState('每兩週');
  const [requirePrePayment, setRequirePrePayment] = useState(false);
  const [form] = Form.useForm();

  const fetchProducts = async (p = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/products', { params: { page: p, pageSize: 20 } });
      setProducts(res.data.data || []);
      setTotal(res.data.totalCount || 0);
    } catch {
      message.error('載入商品失敗');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      setCategories(res.data || []);
    } catch {
      console.error('Failed to fetch categories');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // 取得目前選擇分類的 SpecTemplate 欄位
  const getSpecFields = (categoryId: number | null): SpecField[] => {
    if (!categoryId) return [];
    const cat = categories.find(c => c.id === categoryId);
    if (!cat?.specTemplate) return [];
    try {
      return JSON.parse(cat.specTemplate) as SpecField[];
    } catch {
      return [];
    }
  };

  const specFields = getSpecFields(selectedCategoryId);

  const handleToggle = async (id: number, field: string, value: boolean) => {
    try {
      await apiClient.patch(`/products/${id}/toggles`, { [field]: value });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    } catch {
      message.error('更新失敗');
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '確認刪除',
      content: '確定要刪除這個商品嗎？',
      onOk: async () => {
        try {
          await apiClient.delete(`/products/${id}`);
          message.success('商品已刪除');
          fetchProducts(page);
        } catch {
          message.error('刪除失敗');
        }
      },
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setPreviewImageUrl(product.imageUrl || null);
    setSelectedCategoryId(product.categoryId);

    // 解析 specData 填入表單
    let specValues: Record<string, string> = {};
    if (product.specData) {
      try { specValues = JSON.parse(product.specData); } catch { /* ignore */ }
    }

    // 解析購買模式
    if (product.bulkOptions) {
      try {
        setAllowBulk(true);
        setBulkTiers(JSON.parse(product.bulkOptions));
      } catch { setAllowBulk(false); setBulkTiers([]); }
    } else {
      setAllowBulk(false);
      setBulkTiers([]);
    }

    if (product.subscriptionOptions) {
      try {
        const opts = JSON.parse(product.subscriptionOptions);
        setAllowSubscription(true);
        setSubDiscount(opts.discount ?? 10);
        setSubFreqs(opts.frequencies ?? ['每兩週', '每月']);
        setSubDefault(opts.defaultFrequency ?? '每兩週');
      } catch { setAllowSubscription(false); }
    } else {
      setAllowSubscription(false);
      setSubDiscount(10);
      setSubFreqs(['每兩週', '每月']);
      setSubDefault('每兩週');
    }

    setRequirePrePayment(product.requirePrePayment ?? false);

    form.setFieldsValue({
      sku: product.sku,
      name: product.name,
      shortDescription: product.shortDescription,
      brand: product.brand ?? undefined,
      categoryId: product.categoryId,
      price: product.price,
      unit: product.unit,
      imageUrl: product.imageUrl,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isOrderable: product.isOrderable,
      inventoryEnabled: product.inventoryEnabled,
      parentProductId: product.parentProductId ?? undefined,
      variantLabel: product.variantLabel ?? undefined,
      promotionTag: product.promotionTag ?? undefined,
      ...Object.fromEntries(Object.entries(specValues).map(([k, v]) => [`spec_${k}`, v])),
    });
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setPreviewImageUrl(null);
    setSelectedCategoryId(null);
    setAllowBulk(false);
    setBulkTiers([]);
    setAllowSubscription(false);
    setSubDiscount(10);
    setSubFreqs(['每兩週', '每月']);
    setSubDefault('每兩週');
    setRequirePrePayment(false);
    form.resetFields();
    form.setFieldsValue({ isActive: true, isOrderable: true, inventoryEnabled: false, unit: '磅' });
    setIsModalVisible(true);
  };

  const handleImageUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    setImageUploading(true);
    const formData = new FormData();
    formData.append('file', file as File);
    try {
      const productId = editingProduct?.id;
      const endpoint = productId
        ? `/uploads/products/${productId}`
        : '/uploads/products';
      const res = await apiClient.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url: string = res.data.url;
      form.setFieldValue('imageUrl', url);
      setPreviewImageUrl(url);
      onSuccess?.(res.data);
      message.success('圖片上傳成功');
    } catch {
      onError?.(new Error('上傳失敗'));
      message.error('圖片上傳失敗');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    // 收集 spec_ 前綴的欄位，組成 specData JSON
    const specData: Record<string, string> = {};
    const cleanValues: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (k.startsWith('spec_') && v !== undefined && v !== '') {
        specData[k.slice(5)] = String(v);
      } else {
        cleanValues[k] = v;
      }
    }
    cleanValues.specData = Object.keys(specData).length > 0 ? JSON.stringify(specData) : null;

    // 購買模式序列化
    cleanValues.bulkOptions = allowBulk && bulkTiers.length > 0
      ? JSON.stringify(bulkTiers) : '';
    cleanValues.subscriptionOptions = allowSubscription
      ? JSON.stringify({ discount: subDiscount, frequencies: subFreqs, defaultFrequency: subDefault }) : '';

    // Variants
    cleanValues.parentProductId = (cleanValues.parentProductId as number | undefined) ?? 0;
    cleanValues.variantLabel = (cleanValues.variantLabel as string | undefined) ?? '';

    // 促銷標籤 + 需預付款
    cleanValues.promotionTag = (cleanValues.promotionTag as string | undefined) ?? '';
    cleanValues.requirePrePayment = requirePrePayment;
    // promotionEndAt: DatePicker 回傳 dayjs，轉 ISO string
    const endAtVal = cleanValues.promotionEndAt as { toISOString?: () => string } | undefined;
    cleanValues.promotionEndAt = endAtVal?.toISOString ? endAtVal.toISOString() : null;

    try {
      if (editingProduct) {
        await apiClient.put(`/products/${editingProduct.id}`, cleanValues);
        message.success('商品已更新');
      } else {
        await apiClient.post('/products', cleanValues);
        message.success('商品已新增');
      }
      setIsModalVisible(false);
      fetchProducts(page);
    } catch {
      message.error('儲存失敗');
    }
  };

  const handleImport = async () => {
    if (importFile.length === 0) { message.error('請選擇檔案'); return; }
    const formData = new FormData();
    const file = importFile[0].originFileObj as File;
    formData.append('file', file);
    try {
      const res = await apiClient.post('/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      message.success(`匯入完成：新增 ${res.data.inserted}，更新 ${res.data.updated}`);
      fetchProducts(1);
      setPage(1);
    } catch {
      message.error('匯入失敗');
    }
  };

  const handleBatchUpdate = async (fields: Record<string, unknown>) => {
    if (selectedRowKeys.length === 0) { message.warning('請先勾選商品'); return; }
    try {
      const res = await apiClient.post('/products/batch', { ids: selectedRowKeys, ...fields });
      message.success(`已更新 ${res.data.updated} 筆商品`);
      setSelectedRowKeys([]);
      fetchProducts(page);
    } catch {
      message.error('批次更新失敗');
    }
  };

  const getImageSrc = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = (apiClient.defaults.baseURL ?? '').replace(/\/api$/, '');
    return `${base}${url}`;
  };

  const columns = [
    {
      title: '圖',
      dataIndex: 'imageUrl',
      key: 'image',
      width: 56,
      render: (url: string | null) => {
        const src = getImageSrc(url);
        return src
          ? <img src={src} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
          : <div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#bbb' }}>無圖</div>;
      },
    },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    { title: '商品名稱', dataIndex: 'name', key: 'name' },
    { title: '分類', dataIndex: 'categoryName', key: 'categoryName', width: 120 },
    { title: '價格', dataIndex: 'price', key: 'price', width: 90, render: (p: number) => `NT$ ${p}` },
    {
      title: '可下單',
      dataIndex: 'isOrderable',
      key: 'isOrderable',
      width: 80,
      render: (val: boolean, record: Product) => (
        <Switch size="small" checked={val} onChange={(v) => handleToggle(record.id, 'isOrderable', v)} />
      ),
    },
    {
      title: '庫存管理',
      dataIndex: 'inventoryEnabled',
      key: 'inventoryEnabled',
      width: 90,
      render: (val: boolean, record: Product) => (
        <Switch size="small" checked={val} onChange={(v) => handleToggle(record.id, 'inventoryEnabled', v)} />
      ),
    },
    {
      title: '狀態',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (val: boolean) => <Tag color={val ? 'green' : 'red'}>{val ? '啟用' : '停用'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      render: (_: unknown, record: Product) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>編輯</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>刪除</Button>
        </Space>
      ),
    },
  ];

  const batchMenuItems = [
    { key: 'orderable-on', label: '批次開放可下單', onClick: () => handleBatchUpdate({ isOrderable: true }) },
    { key: 'orderable-off', label: '批次停用可下單', onClick: () => handleBatchUpdate({ isOrderable: false }) },
    { type: 'divider' as const },
    { key: 'active-on', label: '批次啟用', onClick: () => handleBatchUpdate({ isActive: true }) },
    { key: 'active-off', label: '批次停用', onClick: () => handleBatchUpdate({ isActive: false }) },
    { type: 'divider' as const },
    { key: 'featured-on', label: '批次設為精選', onClick: () => handleBatchUpdate({ isFeatured: true }) },
    { key: 'featured-off', label: '批次取消精選', onClick: () => handleBatchUpdate({ isFeatured: false }) },
  ];

  return (
    <Card
      title="商品管理"
      extra={
        <Space>
          {selectedRowKeys.length > 0 && (
            <Dropdown menu={{ items: batchMenuItems }} trigger={['click']}>
              <Button>
                批次操作（已選 {selectedRowKeys.length} 筆）<DownOutlined />
              </Button>
            </Dropdown>
          )}
          <Button icon={<ImportOutlined />} onClick={() => { setImportFile([]); setImportResult(null); setIsImportVisible(true); }}>
            匯入商品
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增商品</Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as number[]),
        }}
        pagination={{ current: page, pageSize: 20, total, onChange: (p) => { setPage(p); fetchProducts(p); } }}
      />

      {/* 商品表單 Modal */}
      <Modal
        title={editingProduct ? '編輯商品' : '新增商品'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={620}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="SKU / 倉編號" name="sku">
            <Input placeholder="留空自動產生" />
          </Form.Item>
          <Form.Item label="商品名稱" name="name" rules={[{ required: true, message: '請輸入商品名稱' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="產品敘述" name="shortDescription">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="品牌" name="brand">
            <Input placeholder="選填，如：品皇、XXX" />
          </Form.Item>
          <Form.Item label="分類" name="categoryId" rules={[{ required: true, message: '請選擇分類' }]}>
            <Select
              options={categories.map(c => ({ label: c.name, value: c.id }))}
              onChange={(val) => {
                setSelectedCategoryId(val as number);
                // 切換分類時清空舊的 spec 欄位值
                const oldFields = getSpecFields(selectedCategoryId);
                oldFields.forEach(f => form.setFieldValue(`spec_${f.key}`, undefined));
              }}
            />
          </Form.Item>
          <Form.Item label="售價" name="price">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="單位" name="unit">
            <Select options={[
              { label: '磅', value: '磅' }, { label: '公克', value: '公克' },
              { label: '個', value: '個' }, { label: '包', value: '包' },
              { label: '瓶', value: '瓶' }, { label: '盒', value: '盒' },
            ]} />
          </Form.Item>
          <Form.Item label="商品圖片" name="imageUrl">
            <Input placeholder="圖片 URL（上傳後自動填入）" style={{ marginBottom: 8 }} />
          </Form.Item>
          <Form.Item label=" " colon={false} style={{ marginTop: -16 }}>
            <Space align="start">
              <Upload
                accept=".jpg,.jpeg,.png,.webp"
                showUploadList={false}
                customRequest={handleImageUpload}
              >
                <Button icon={imageUploading ? <LoadingOutlined /> : <UploadOutlined />} disabled={imageUploading}>
                  {imageUploading ? '上傳中...' : '上傳圖片'}
                </Button>
              </Upload>
              {previewImageUrl && getImageSrc(previewImageUrl) && (
                <img
                  src={getImageSrc(previewImageUrl)!}
                  alt="商品預覽"
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #d9d9d9' }}
                />
              )}
            </Space>
          </Form.Item>

          {/* 動態規格欄位（根據分類 SpecTemplate） */}
          {specFields.length > 0 && (
            <>
              <Divider style={{ margin: '8px 0 16px' }}>商品規格</Divider>
              {specFields.map(field => (
                <Form.Item key={field.key} label={field.label} name={`spec_${field.key}`}>
                  {field.type === 'select' && field.options ? (
                    <Select
                      allowClear
                      placeholder={`選擇${field.label}`}
                      options={field.options.map(o => ({ label: o, value: o }))}
                    />
                  ) : field.type === 'number' ? (
                    <InputNumber style={{ width: '100%' }} placeholder={`輸入${field.label}`} />
                  ) : (
                    <Input placeholder={`輸入${field.label}`} />
                  )}
                </Form.Item>
              ))}
            </>
          )}

          {/* 購買模式設定 */}
          <Divider style={{ margin: '8px 0 16px' }}>購買模式設定</Divider>
          <div style={{ marginBottom: 12 }}>
            <Space align="center" style={{ marginBottom: 8 }}>
              <Switch checked disabled size="small" />
              <span style={{ color: '#666' }}>一次購買（永遠開啟）</span>
            </Space>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Space align="center" style={{ marginBottom: allowBulk ? 8 : 0 }}>
              <Switch checked={allowBulk} onChange={setAllowBulk} size="small" />
              <span>大量購買優惠</span>
            </Space>
            {allowBulk && (
              <div style={{ marginLeft: 32, marginTop: 8 }}>
                <Table
                  dataSource={bulkTiers}
                  rowKey={(_, i) => String(i)}
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '數量', dataIndex: 'qty', width: 80, render: (v, _, i) => (
                      <InputNumber size="small" value={v} min={1} style={{ width: 70 }}
                        onChange={(val) => setBulkTiers(t => t.map((r, idx) => idx === i ? { ...r, qty: val ?? 1 } : r))} />
                    )},
                    { title: '顯示文字', dataIndex: 'label', render: (v, _, i) => (
                      <Input size="small" value={v}
                        onChange={(e) => setBulkTiers(t => t.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))} />
                    )},
                    { title: '折扣%', dataIndex: 'discount', width: 90, render: (v, _, i) => (
                      <InputNumber size="small" value={v} min={1} max={99} style={{ width: 80 }}
                        onChange={(val) => setBulkTiers(t => t.map((r, idx) => idx === i ? { ...r, discount: val ?? 1 } : r))} />
                    )},
                    { title: '', width: 40, render: (_, __, i) => (
                      <Button type="text" danger size="small" icon={<MinusCircleOutlined />}
                        onClick={() => setBulkTiers(t => t.filter((_, idx) => idx !== i))} />
                    )},
                  ]}
                />
                <Button size="small" style={{ marginTop: 8 }} icon={<PlusOutlined />}
                  onClick={() => setBulkTiers(t => [...t, { qty: 3, label: '3包優惠', discount: 5 }])}>
                  新增方案
                </Button>
              </div>
            )}
          </div>
          <div style={{ marginBottom: 12 }}>
            <Space align="center" style={{ marginBottom: allowSubscription ? 8 : 0 }}>
              <Switch checked={allowSubscription} onChange={setAllowSubscription} size="small" />
              <span>定期訂購</span>
            </Space>
            {allowSubscription && (
              <div style={{ marginLeft: 32, marginTop: 8 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <span>訂購折扣：</span>
                    <InputNumber value={subDiscount} min={1} max={99} onChange={v => setSubDiscount(v ?? 10)} />
                    <span>%</span>
                  </Space>
                  <div>
                    <span>可選頻率：</span>
                    <Checkbox.Group
                      value={subFreqs}
                      options={['每週', '每兩週', '每月']}
                      onChange={(vals) => {
                        setSubFreqs(vals as string[]);
                        if (!vals.includes(subDefault)) setSubDefault(vals[0] as string ?? '每月');
                      }}
                    />
                  </div>
                  <Space>
                    <span>預設頻率：</span>
                    <Select
                      value={subDefault}
                      onChange={setSubDefault}
                      style={{ width: 120 }}
                      options={subFreqs.map(f => ({ label: f, value: f }))}
                    />
                  </Space>
                </Space>
              </div>
            )}
          </div>

          {/* 促銷設定 */}
          <Divider style={{ margin: '8px 0 16px' }}>促銷設定</Divider>
          <Form.Item label="促銷標籤文字" name="promotionTag" help="如：即期特惠、限時特賣（留空不顯示）">
            <Input placeholder="留空不顯示促銷標籤" />
          </Form.Item>
          <Form.Item label="促銷截止時間" name="promotionEndAt" help="設定後前台商品卡顯示倒數計時，留空無倒數">
            <DatePicker showTime style={{ width: '100%' }} placeholder="選填，設定促銷結束時間" />
          </Form.Item>
          <div style={{ marginBottom: 12 }}>
            <Space align="center">
              <Switch checked={requirePrePayment} onChange={setRequirePrePayment} size="small" />
              <span>需預付款</span>
              <span style={{ color: '#999', fontSize: 12 }}>（開啟後購物車僅允許銀行轉帳付款）</span>
            </Space>
          </div>

          {/* 商品群組 / 變體 */}
          <Divider style={{ margin: '8px 0 16px' }}>商品群組（變體）</Divider>
          <Space style={{ width: '100%' }}>
            <Form.Item label="父商品 ID" name="parentProductId" style={{ marginBottom: 0, flex: 1 }}>
              <InputNumber placeholder="留空 = 無群組" style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item label="變體標籤" name="variantLabel" style={{ marginBottom: 0, flex: 1 }}>
              <Input placeholder="如：半磅 / 1磅 / 整豆" />
            </Form.Item>
          </Space>

          <Divider style={{ margin: '16px 0 12px' }} />
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Form.Item label="啟用" name="isActive" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch />
            </Form.Item>
            <Form.Item label="精選" name="isFeatured" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch />
            </Form.Item>
            <Form.Item label="可下單" name="isOrderable" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch />
            </Form.Item>
            <Form.Item label="啟用庫存管理" name="inventoryEnabled" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">儲存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 匯入 Modal */}
      <Modal
        title="匯入商品"
        open={isImportVisible}
        onCancel={() => setIsImportVisible(false)}
        onOk={handleImport}
        okText="開始匯入"
      >
        <p>支援格式：xlsx、xls、csv</p>
        <p>欄位：倉編號（必填）、商品名稱（必填）、分類、售價、單位、產品敘述</p>
        <Upload
          beforeUpload={() => false}
          fileList={importFile}
          onChange={({ fileList }) => setImportFile(fileList.slice(-1))}
          accept=".xlsx,.xls,.csv"
        >
          <Button icon={<UploadOutlined />}>選擇檔案</Button>
        </Upload>

        {importResult && (
          <div style={{ marginTop: 16 }}>
            <p>✅ 新增：{importResult.inserted} 筆</p>
            <p>🔄 更新：{importResult.updated} 筆</p>
            {importResult.errors.length > 0 && (
              <details>
                <summary>錯誤 {importResult.errors.length} 筆</summary>
                <ul>{importResult.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
              </details>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}

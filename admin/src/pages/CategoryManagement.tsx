import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message, Tag, Tooltip } from 'antd';
import { EditOutlined, QuestionCircleOutlined } from '@ant-design/icons';
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
  code: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  productCount: number;
  specTemplate: string | null;
}

const DEFAULT_TEMPLATES: Record<string, SpecField[]> = {
  SPECIALTY_BEANS: [
    { key: 'origin', label: '產地', type: 'text' },
    { key: 'variety', label: '品種/品系', type: 'text' },
    { key: 'process', label: '處理法', type: 'select', options: ['水洗', '日曬', '蜜處理', '厭氧', '其他'] },
    { key: 'roast', label: '烘焙度', type: 'select', options: ['淺焙', '淺中焙', '中焙', '中深焙', '深焙'] },
    { key: 'altitude', label: '海拔', type: 'text' },
    { key: 'flavor', label: '風味描述', type: 'text' },
  ],
  COMMERCIAL_BLEND: [
    { key: 'origin', label: '配方產地', type: 'text' },
    { key: 'roast', label: '烘焙度', type: 'select', options: ['淺焙', '中焙', '深焙'] },
    { key: 'flavor', label: '風味描述', type: 'text' },
  ],
  INSTANT_COFFEE: [
    { key: 'brand', label: '品牌', type: 'text' },
    { key: 'serving', label: '份量/規格', type: 'text' },
    { key: 'type', label: '類型', type: 'select', options: ['即溶', '二合一', '三合一'] },
  ],
  TEA: [
    { key: 'type', label: '茶種類型', type: 'select', options: ['紅茶', '綠茶', '烏龍', '花草茶', '其他'] },
    { key: 'origin', label: '產地', type: 'text' },
    { key: 'brand', label: '品牌', type: 'text' },
    { key: 'serving', label: '規格', type: 'text' },
  ],
  EQUIPMENT: [
    { key: 'brand', label: '品牌', type: 'text' },
    { key: 'model', label: '型號', type: 'text' },
    { key: 'capacity', label: '容量', type: 'text' },
    { key: 'material', label: '材質', type: 'text' },
  ],
  CREAMER: [
    { key: 'brand', label: '品牌', type: 'text' },
    { key: 'serving', label: '規格', type: 'text' },
  ],
  SYRUP: [
    { key: 'brand', label: '品牌', type: 'text' },
    { key: 'flavor', label: '口味', type: 'text' },
    { key: 'volume', label: '容量', type: 'text' },
  ],
  SUGAR: [
    { key: 'brand', label: '品牌', type: 'text' },
    { key: 'type', label: '類型', type: 'select', options: ['白砂糖', '紅糖/黑糖', '果糖', '代糖', '其他'] },
    { key: 'serving', label: '規格', type: 'text' },
  ],
  OTHER: [
    { key: 'brand', label: '品牌', type: 'text' },
    { key: 'serving', label: '規格', type: 'text' },
  ],
};

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [specJson, setSpecJson] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/categories');
      setCategories(res.data);
    } catch {
      message.error('載入分類失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleEdit = (cat: Category) => {
    setEditingCat(cat);
    form.setFieldsValue({ name: cat.name, description: cat.description, icon: cat.icon });
    const template = cat.specTemplate || JSON.stringify(DEFAULT_TEMPLATES[cat.code] || [], null, 2);
    setSpecJson(template);
    setJsonError('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!editingCat) return;
    try {
      JSON.parse(specJson); // validate JSON
    } catch {
      setJsonError('JSON 格式錯誤，請修正後再儲存');
      return;
    }

    try {
      const values = await form.validateFields();
      await apiClient.put(`/categories/${editingCat.id}`, {
        name: values.name,
        description: values.description,
        icon: values.icon,
        specTemplate: specJson,
      });
      message.success('分類已更新');
      setModalVisible(false);
      fetchCategories();
    } catch {
      message.error('更新失敗');
    }
  };

  const handleApplyDefault = () => {
    if (!editingCat) return;
    const def = DEFAULT_TEMPLATES[editingCat.code] || [];
    setSpecJson(JSON.stringify(def, null, 2));
    setJsonError('');
  };

  const handleJsonChange = (val: string) => {
    setSpecJson(val);
    try {
      JSON.parse(val);
      setJsonError('');
    } catch {
      setJsonError('JSON 格式錯誤');
    }
  };

  const columns = [
    { title: '圖示', dataIndex: 'icon', key: 'icon', width: 50, render: (v: string) => v || '—' },
    { title: '分類名稱', dataIndex: 'name', key: 'name', width: 160 },
    { title: '代碼', dataIndex: 'code', key: 'code', width: 140, render: (v: string) => <Tag>{v}</Tag> },
    { title: '商品數', dataIndex: 'productCount', key: 'productCount', width: 80 },
    {
      title: (
        <span>
          規格欄位{' '}
          <Tooltip title="定義此分類商品的規格欄位（SpecJSON），商品編輯時可填入對應值">
            <QuestionCircleOutlined />
          </Tooltip>
        </span>
      ),
      key: 'specTemplate',
      render: (_: unknown, cat: Category) => {
        if (!cat.specTemplate) return <Tag color="orange">未設定</Tag>;
        try {
          const fields: SpecField[] = JSON.parse(cat.specTemplate);
          return <span style={{ fontSize: 12, color: '#666' }}>{fields.map(f => f.label).join('、')}</span>;
        } catch {
          return <Tag color="red">JSON 錯誤</Tag>;
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, cat: Category) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(cat)}>編輯</Button>
      ),
    },
  ];

  return (
    <Card title="分類管理">
      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={`編輯分類：${editingCat?.name}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        width={700}
        okText="儲存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="分類名稱" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="圖示（Emoji）" name="icon">
            <Input placeholder="例：☕" style={{ width: 100 }} />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong>規格欄位定義（SpecTemplate JSON）</strong>
            <Button size="small" onClick={handleApplyDefault}>套用預設欄位</Button>
          </div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
            格式：<code>{'[{"key":"origin","label":"產地","type":"text"}]'}</code>
            　type 可為 text / select / number，select 需加 options 陣列
          </div>
          <Input.TextArea
            value={specJson}
            onChange={e => handleJsonChange(e.target.value)}
            rows={10}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
            status={jsonError ? 'error' : undefined}
          />
          {jsonError && <div style={{ color: '#ff4d4f', marginTop: 4, fontSize: 12 }}>{jsonError}</div>}
        </div>
      </Modal>
    </Card>
  );
}

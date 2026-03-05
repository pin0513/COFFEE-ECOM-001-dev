import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message, Tag, Tooltip, Select } from 'antd';
import { EditOutlined, QuestionCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { apiClient } from '../config/api';

interface SpecField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number';
  options?: string[];
}

interface ChildCategory {
  id: number;
  name: string;
  code: string;
  icon: string | null;
  sortOrder: number;
  productCount: number;
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
  parentId?: number | null;
  children?: ChildCategory[];
}

// 展平後的表格行
interface TableRow {
  id: number;
  name: string;
  code: string;
  icon: string | null;
  sortOrder: number;
  productCount: number;
  specTemplate: string | null;
  parentId?: number | null;
  isChild: boolean;
  _raw?: Category | ChildCategory;
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
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);

  // 編輯
  const [editingRow, setEditingRow] = useState<TableRow | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [specJson, setSpecJson] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [form] = Form.useForm();

  // 新增
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();

  const flattenTree = (tree: Category[]): TableRow[] => {
    const rows: TableRow[] = [];
    for (const cat of tree) {
      rows.push({
        id: cat.id,
        name: cat.name,
        code: cat.code,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        productCount: cat.productCount,
        specTemplate: cat.specTemplate,
        parentId: null,
        isChild: false,
        _raw: cat,
      });
      for (const child of cat.children ?? []) {
        rows.push({
          id: child.id,
          name: child.name,
          code: child.code,
          icon: child.icon,
          sortOrder: child.sortOrder,
          productCount: child.productCount,
          specTemplate: null,
          parentId: cat.id,
          isChild: true,
          _raw: child,
        });
      }
    }
    return rows;
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/categories');
      const tree: Category[] = res.data;
      setCategories(tree);
      setTableRows(flattenTree(tree));
    } catch {
      message.error('載入分類失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleEdit = (row: TableRow) => {
    setEditingRow(row);
    form.setFieldsValue({
      name: row.name,
      description: (row._raw as Category)?.description ?? '',
      icon: row.icon,
      parentId: row.parentId ?? undefined,
    });
    const template = row.specTemplate || JSON.stringify(DEFAULT_TEMPLATES[row.code] || [], null, 2);
    setSpecJson(template);
    setJsonError('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!editingRow) return;
    if (!editingRow.isChild) {
      try {
        JSON.parse(specJson);
      } catch {
        setJsonError('JSON 格式錯誤，請修正後再儲存');
        return;
      }
    }

    try {
      const values = await form.validateFields();
      const payload: Record<string, unknown> = {
        name: values.name,
        description: values.description,
        icon: values.icon,
      };
      if (!editingRow.isChild) {
        payload.specTemplate = specJson;
      }
      // parentId: 0 = 清除（升至頂層）
      if (values.parentId !== undefined) {
        payload.parentId = values.parentId;
      }
      await apiClient.put(`/categories/${editingRow.id}`, payload);
      message.success('分類已更新');
      setModalVisible(false);
      fetchCategories();
    } catch {
      message.error('更新失敗');
    }
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      await apiClient.post('/categories', {
        name: values.name,
        code: values.code,
        description: values.description || '',
        icon: values.icon || '',
        color: '',
        parentId: values.parentId ?? null,
        sortOrder: values.sortOrder ?? 99,
        specTemplate: null,
      });
      message.success('分類已建立');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchCategories();
    } catch {
      message.error('建立失敗');
    }
  };

  const handleApplyDefault = () => {
    if (!editingRow) return;
    const def = DEFAULT_TEMPLATES[editingRow.code] || [];
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
    {
      title: '圖示',
      dataIndex: 'icon',
      key: 'icon',
      width: 50,
      render: (v: string) => v || '—',
    },
    {
      title: '分類名稱',
      key: 'name',
      width: 180,
      render: (_: unknown, row: TableRow) =>
        row.isChild
          ? <span style={{ paddingLeft: 16, color: '#888', fontSize: 13 }}>└ {row.name}</span>
          : <span style={{ fontWeight: 600 }}>{row.name}</span>,
    },
    {
      title: '代碼',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (v: string, row: TableRow) => <Tag color={row.isChild ? 'default' : 'blue'}>{v}</Tag>,
    },
    {
      title: '商品數',
      dataIndex: 'productCount',
      key: 'productCount',
      width: 80,
    },
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
      render: (_: unknown, row: TableRow) => {
        if (row.isChild) return <span style={{ color: '#ccc', fontSize: 12 }}>繼承父分類</span>;
        if (!row.specTemplate) return <Tag color="orange">未設定</Tag>;
        try {
          const fields: SpecField[] = JSON.parse(row.specTemplate);
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
      render: (_: unknown, row: TableRow) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(row)}>編輯</Button>
      ),
    },
  ];

  return (
    <Card
      title="分類管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateModalVisible(true); }}>
          新增分類
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={tableRows}
        rowKey="id"
        loading={loading}
        pagination={false}
        rowClassName={(row: TableRow) => row.isChild ? 'cat-row-child' : ''}
      />

      {/* 編輯 Modal */}
      <Modal
        title={`編輯分類：${editingRow?.name}`}
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
          <Form.Item label="父分類（留空 = 頂層）" name="parentId">
            <Select allowClear placeholder="選擇父分類（設為子分類）">
              {categories.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.icon} {c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>

        {!editingRow?.isChild && (
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
        )}
      </Modal>

      {/* 新增 Modal */}
      <Modal
        title="新增分類"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreate}
        okText="建立"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item label="分類名稱" name="name" rules={[{ required: true, message: '請輸入分類名稱' }]}>
            <Input placeholder="例：全自動咖啡機" />
          </Form.Item>
          <Form.Item label="代碼（英文大寫）" name="code" rules={[{ required: true, message: '請輸入代碼' }]}>
            <Input placeholder="例：AUTO_MACHINE" style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item label="父分類（留空 = 頂層分類）" name="parentId">
            <Select allowClear placeholder="選擇父分類（設為子分類）">
              {categories.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.icon} {c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="圖示（Emoji）" name="icon">
            <Input placeholder="例：🤖" style={{ width: 100 }} />
          </Form.Item>
          <Form.Item label="排序（數字越小越前）" name="sortOrder">
            <Input type="number" placeholder="99" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={2} placeholder="選填" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

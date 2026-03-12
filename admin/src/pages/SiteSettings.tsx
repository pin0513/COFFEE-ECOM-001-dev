import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, message, Space, Divider, Upload, Switch, Row, Col } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { apiClient } from '../config/api';

interface FooterLink { label: string; url: string; }

interface SettingsForm {
  site_name: string;
  site_subtitle: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  line_client_url: string;
  footer_text: string;
  logo_url: string;
  order_notification_email: string;
  checkout_enabled: boolean;
  payment_bank_transfer_enabled: boolean;
  payment_cash_enabled: boolean;
  payment_ecpay_enabled: boolean;
  payment_linepay_enabled: boolean;
  machine_direct_checkout_enabled: boolean;
  machine_installment_enabled: boolean;
  machine_onetime_enabled: boolean;
  // bank account fields (stored as JSON under bank_account_info)
  bank_name: string;
  bank_branch: string;
  bank_account: string;
  bank_account_name: string;
  // brand story
  brand_story_title: string;
  brand_story_content: string;
  // social links
  footer_social_facebook: string;
  footer_social_instagram: string;
}

export default function SiteSettings() {
  const [form] = Form.useForm<SettingsForm>();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<UploadFile[]>([]);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string>('');
  const [shoppingLinks, setShoppingLinks] = useState<FooterLink[]>([]);
  const [serviceLinks, setServiceLinks] = useState<FooterLink[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/site-settings');
        const data: Record<string, string> = res.data;

        let bankInfo = { bankName: '', branch: '', accountNumber: '', accountName: '' };
        if (data.bank_account_info) {
          try { bankInfo = JSON.parse(data.bank_account_info); } catch { /* ignore */ }
        }

        if (data.footer_links_shopping) {
          try { setShoppingLinks(JSON.parse(data.footer_links_shopping)); } catch { /* ignore */ }
        }
        if (data.footer_links_service) {
          try { setServiceLinks(JSON.parse(data.footer_links_service)); } catch { /* ignore */ }
        }

        form.setFieldsValue({
          site_name: data.site_name || '',
          site_subtitle: data.site_subtitle || '',
          contact_phone: data.contact_phone || '',
          contact_email: data.contact_email || '',
          contact_address: data.contact_address || '',
          line_client_url: data.line_client_url || '',
          footer_text: data.footer_text || '',
          logo_url: data.logo_url || '',
          order_notification_email: data.order_notification_email || '',
          checkout_enabled: data.checkout_enabled !== 'false',
          payment_bank_transfer_enabled: data.payment_bank_transfer_enabled !== 'false',
          payment_cash_enabled: data.payment_cash_enabled !== 'false',
          payment_ecpay_enabled: data.payment_ecpay_enabled === 'true',
          payment_linepay_enabled: data.payment_linepay_enabled === 'true',
          machine_direct_checkout_enabled: data.machine_direct_checkout_enabled === 'true',
          machine_installment_enabled: data.machine_installment_enabled !== 'false',
          machine_onetime_enabled: data.machine_onetime_enabled !== 'false',
          bank_name: bankInfo.bankName || '',
          bank_branch: bankInfo.branch || '',
          bank_account: bankInfo.accountNumber || '',
          bank_account_name: bankInfo.accountName || '',
          brand_story_title: data.brand_story_title || '品皇咖啡的故事',
          brand_story_content: data.brand_story_content || '',
          footer_social_facebook: data.footer_social_facebook || '',
          footer_social_instagram: data.footer_social_instagram || '',
        });
        setCurrentLogoUrl(data.logo_url || '');
      } catch {
        message.error('載入設定失敗');
      }
    };
    fetchSettings();
  }, [form]);

  const handleLogoUpload = async () => {
    if (logoFile.length === 0) return;
    const formData = new FormData();
    formData.append('file', logoFile[0].originFileObj as File);
    try {
      const res = await apiClient.post('/uploads/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.url;
      form.setFieldValue('logo_url', url);
      setCurrentLogoUrl(url);
      message.success('Logo 上傳成功');
      setLogoFile([]);
    } catch {
      message.error('Logo 上傳失敗');
    }
  };

  const handleSave = async (values: SettingsForm) => {
    setLoading(true);
    try {
      const bankInfo = JSON.stringify({
        bankName: values.bank_name || '',
        branch: values.bank_branch || '',
        accountNumber: values.bank_account || '',
        accountName: values.bank_account_name || '',
      });

      const items = [
        { key: 'site_name', value: values.site_name },
        { key: 'site_subtitle', value: values.site_subtitle },
        { key: 'contact_phone', value: values.contact_phone },
        { key: 'contact_email', value: values.contact_email },
        { key: 'contact_address', value: values.contact_address },
        { key: 'line_client_url', value: values.line_client_url },
        { key: 'footer_text', value: values.footer_text },
        { key: 'logo_url', value: values.logo_url },
        { key: 'order_notification_email', value: values.order_notification_email },
        { key: 'checkout_enabled', value: values.checkout_enabled ? 'true' : 'false' },
        { key: 'payment_bank_transfer_enabled', value: values.payment_bank_transfer_enabled ? 'true' : 'false' },
        { key: 'payment_cash_enabled', value: values.payment_cash_enabled ? 'true' : 'false' },
        { key: 'payment_ecpay_enabled', value: values.payment_ecpay_enabled ? 'true' : 'false' },
        { key: 'payment_linepay_enabled', value: values.payment_linepay_enabled ? 'true' : 'false' },
        { key: 'machine_direct_checkout_enabled', value: values.machine_direct_checkout_enabled ? 'true' : 'false' },
        { key: 'machine_installment_enabled', value: values.machine_installment_enabled ? 'true' : 'false' },
        { key: 'machine_onetime_enabled', value: values.machine_onetime_enabled ? 'true' : 'false' },
        { key: 'bank_account_info', value: bankInfo },
        { key: 'brand_story_title', value: values.brand_story_title || '' },
        { key: 'brand_story_content', value: values.brand_story_content || '' },
        { key: 'footer_links_shopping', value: JSON.stringify(shoppingLinks.filter(l => l.label || l.url)) },
        { key: 'footer_links_service', value: JSON.stringify(serviceLinks.filter(l => l.label || l.url)) },
        { key: 'footer_social_facebook', value: values.footer_social_facebook || '' },
        { key: 'footer_social_instagram', value: values.footer_social_instagram || '' },
      ];

      await apiClient.put('/site-settings', items);
      message.success('設定已儲存');
    } catch {
      message.error('儲存失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="網站設定">
      <Form form={form} layout="vertical" onFinish={handleSave}>

        <Divider>Logo</Divider>
        {currentLogoUrl && (
          <div style={{ marginBottom: 16 }}>
            <img src={`http://localhost:5000${currentLogoUrl}`} alt="Logo" style={{ height: 60 }} />
          </div>
        )}
        <Space style={{ marginBottom: 16 }}>
          <Upload
            beforeUpload={() => false}
            fileList={logoFile}
            onChange={({ fileList }) => setLogoFile(fileList.slice(-1))}
            accept=".jpg,.jpeg,.png,.webp"
          >
            <Button icon={<UploadOutlined />}>選擇 Logo</Button>
          </Upload>
          {logoFile.length > 0 && (
            <Button onClick={handleLogoUpload} type="primary">上傳</Button>
          )}
        </Space>
        <Form.Item label="Logo URL" name="logo_url">
          <Input disabled />
        </Form.Item>

        <Divider>基本資訊</Divider>
        <Form.Item label="網站名稱" name="site_name" rules={[{ required: true, message: '請輸入網站名稱' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="副標題" name="site_subtitle">
          <Input />
        </Form.Item>

        <Divider>聯絡資訊</Divider>
        <Form.Item label="聯絡電話" name="contact_phone">
          <Input />
        </Form.Item>
        <Form.Item label="Email" name="contact_email">
          <Input />
        </Form.Item>
        <Form.Item label="地址" name="contact_address">
          <Input />
        </Form.Item>

        <Divider>社群 / 客服</Divider>
        <Form.Item label="LINE 客服連結" name="line_client_url">
          <Input placeholder="https://line.me/R/ti/p/@..." />
        </Form.Item>

        <Divider>頁尾</Divider>
        <Form.Item label="頁尾文字" name="footer_text">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Divider>結帳 / 付款設定</Divider>
        <Form.Item label="開放結帳功能" name="checkout_enabled" valuePropName="checked">
          <Switch checkedChildren="開放" unCheckedChildren="關閉" />
        </Form.Item>
        <Form.Item label="開放付款方式" style={{ marginBottom: 0 }}>
          <Row gutter={24}>
            <Col>
              <Form.Item label="貨到付款" name="payment_cash_enabled" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item label="銀行轉帳" name="payment_bank_transfer_enabled" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item label="綠界（信用卡/ATM/超商）" name="payment_ecpay_enabled" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item label="LINE Pay" name="payment_linepay_enabled" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
          ⚠️ 綠界／LINE Pay API 金鑰請在 VM 的 <code>appsettings.Production.json</code> 設定，不在後台 UI 設定
        </div>

        <Divider>咖啡機詢購設定</Divider>
        <Form.Item label="咖啡機直接詢購模式" style={{ marginBottom: 0 }}>
          <Row gutter={24}>
            <Col>
              <Form.Item
                label="啟用直接詢購（不走購物車）"
                name="machine_direct_checkout_enabled"
                valuePropName="checked"
                extra="開啟後，商用咖啡機頁面顯示「立即詢購」按鈕，不需加入購物車"
              >
                <Switch checkedChildren="開啟" unCheckedChildren="關閉" />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item label="開放一次買斷" name="machine_onetime_enabled" valuePropName="checked">
                <Switch checkedChildren="開放" unCheckedChildren="關閉" />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item label="開放信用卡分期（6/12/18期）" name="machine_installment_enabled" valuePropName="checked">
                <Switch checkedChildren="開放" unCheckedChildren="關閉" />
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>

        <Divider dashed>銀行轉帳帳號</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="銀行名稱" name="bank_name">
              <Input placeholder="例：台灣銀行" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="分行" name="bank_branch">
              <Input placeholder="例：三重分行" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="帳號" name="bank_account">
              <Input placeholder="例：000-000-000000" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="戶名" name="bank_account_name">
              <Input placeholder="例：品皇咖啡有限公司" />
            </Form.Item>
          </Col>
        </Row>

        <Divider>訂單通知</Divider>
        <Form.Item
          label="訂單通知 Email"
          name="order_notification_email"
          extra="每筆新訂單建立後，系統會寄送通知到此信箱（需設定 SMTP）"
        >
          <Input placeholder="例：orders@pinhung.com.tw" />
        </Form.Item>

        <Divider>品牌故事</Divider>
        <Form.Item label="品牌故事標題" name="brand_story_title">
          <Input placeholder="品皇咖啡的故事" />
        </Form.Item>
        <Form.Item label="品牌故事內容" name="brand_story_content">
          <Input.TextArea rows={4} placeholder="輸入品牌故事文案..." />
        </Form.Item>

        <Divider>頁尾連結管理</Divider>
        <Row gutter={32}>
          <Col span={12}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>購物資訊連結</div>
            {shoppingLinks.map((link, i) => (
              <Space key={i} style={{ display: 'flex', marginBottom: 8 }}>
                <Input
                  placeholder="連結名稱"
                  value={link.label}
                  onChange={e => {
                    const updated = [...shoppingLinks];
                    updated[i] = { ...updated[i], label: e.target.value };
                    setShoppingLinks(updated);
                  }}
                  style={{ width: 120 }}
                />
                <Input
                  placeholder="/products 或 https://..."
                  value={link.url}
                  onChange={e => {
                    const updated = [...shoppingLinks];
                    updated[i] = { ...updated[i], url: e.target.value };
                    setShoppingLinks(updated);
                  }}
                  style={{ width: 220 }}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setShoppingLinks(shoppingLinks.filter((_, idx) => idx !== i))}
                />
              </Space>
            ))}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              size="small"
              onClick={() => setShoppingLinks([...shoppingLinks, { label: '', url: '' }])}
            >
              新增連結
            </Button>
          </Col>
          <Col span={12}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>客戶服務連結</div>
            {serviceLinks.map((link, i) => (
              <Space key={i} style={{ display: 'flex', marginBottom: 8 }}>
                <Input
                  placeholder="連結名稱"
                  value={link.label}
                  onChange={e => {
                    const updated = [...serviceLinks];
                    updated[i] = { ...updated[i], label: e.target.value };
                    setServiceLinks(updated);
                  }}
                  style={{ width: 120 }}
                />
                <Input
                  placeholder="/pages/contact 或 https://..."
                  value={link.url}
                  onChange={e => {
                    const updated = [...serviceLinks];
                    updated[i] = { ...updated[i], url: e.target.value };
                    setServiceLinks(updated);
                  }}
                  style={{ width: 220 }}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setServiceLinks(serviceLinks.filter((_, idx) => idx !== i))}
                />
              </Space>
            ))}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              size="small"
              onClick={() => setServiceLinks([...serviceLinks, { label: '', url: '' }])}
            >
              新增連結
            </Button>
          </Col>
        </Row>

        <Divider dashed>社群媒體連結</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Facebook 連結" name="footer_social_facebook">
              <Input placeholder="https://www.facebook.com/..." />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Instagram 連結" name="footer_social_instagram">
              <Input placeholder="https://www.instagram.com/..." />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} size="large">
            儲存設定
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

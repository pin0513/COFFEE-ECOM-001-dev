import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, message, Space, Divider, Upload, Switch, Row, Col } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { apiClient } from '../config/api';

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
  // bank account fields (stored as JSON under bank_account_info)
  bank_name: string;
  bank_branch: string;
  bank_account: string;
  bank_account_name: string;
}

export default function SiteSettings() {
  const [form] = Form.useForm<SettingsForm>();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<UploadFile[]>([]);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string>('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/site-settings');
        const data: Record<string, string> = res.data;

        let bankInfo = { bankName: '', branch: '', accountNumber: '', accountName: '' };
        if (data.bank_account_info) {
          try { bankInfo = JSON.parse(data.bank_account_info); } catch { /* ignore */ }
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
          bank_name: bankInfo.bankName || '',
          bank_branch: bankInfo.branch || '',
          bank_account: bankInfo.accountNumber || '',
          bank_account_name: bankInfo.accountName || '',
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
        { key: 'bank_account_info', value: bankInfo },
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

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} size="large">
            儲存設定
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

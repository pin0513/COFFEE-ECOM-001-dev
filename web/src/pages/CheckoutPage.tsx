import { Typography, Button, Card, Form, Input, Select, Divider, List, message, Grid, BackTop, Alert } from 'antd';
import { LeftOutlined, UpOutlined, BankOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useState, useEffect } from 'react';
import { createOrder } from '../services/orderService';
import { getSiteSettings } from '../services/siteSettingsService';

const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

interface BankAccountInfo {
  bankName: string;
  branch: string;
  accountNumber: string;
  accountName: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [bankTransferEnabled, setBankTransferEnabled] = useState(true);
  const [cashEnabled, setCashEnabled] = useState(true);
  const [bankInfo, setBankInfo] = useState<BankAccountInfo | null>(null);
  const [form] = Form.useForm();

  // 購物車含需預付款商品 → 鎖定銀行轉帳
  const hasPrePayRequired = items.some(item => item.requirePrePayment);

  useEffect(() => {
    getSiteSettings().then(settings => {
      const bankOn = settings.payment_bank_transfer_enabled !== 'false';
      const cashOn = settings.payment_cash_enabled !== 'false';
      setBankTransferEnabled(bankOn);
      setCashEnabled(cashOn);

      // 預設付款方式
      if (cashOn && !hasPrePayRequired) setPaymentMethod('cash');
      else if (bankOn) setPaymentMethod('transfer');

      if (settings.bank_account_info) {
        try {
          setBankInfo(JSON.parse(settings.bank_account_info));
        } catch { /* ignore */ }
      }
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 若購物車含預付款商品，且目前選了 COD，自動切換到轉帳
  useEffect(() => {
    if (hasPrePayRequired && paymentMethod === 'cash') {
      setPaymentMethod('transfer');
    }
  }, [hasPrePayRequired, paymentMethod]);

  const onFinish = async (values: Record<string, string>) => {
    if (paymentMethod === 'transfer' && !values.transferCode) {
      message.error('請填寫轉帳後5碼');
      return;
    }

    try {
      setLoading(true);

      const order = await createOrder({
        customerEmail: values.email,
        items: items.map(item => ({
          productId: parseInt(item.id, 10),
          quantity: item.quantity,
        })),
        discountAmount: 0,
        paymentMethod: paymentMethod === 'transfer' ? 'BankTransfer' : 'Cash',
        recipientName: values.name,
        recipientPhone: values.phone,
        shippingAddress: values.address,
        notes: values.note || undefined,
        transferCode: paymentMethod === 'transfer' ? values.transferCode : undefined,
      });

      message.success(`訂單已成立！訂單編號：${order.orderNumber}`);
      clearCart();
      navigate('/order-success', { state: { order } });

    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      if (err.response?.data?.message) {
        message.error(`訂單建立失敗：${err.response.data.message}`);
      } else {
        message.error('訂單建立失敗，請稍後再試');
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  // 含預付款商品時禁用 COD
  const paymentOptions = [
    ...(cashEnabled && !hasPrePayRequired ? [{ label: '貨到付款', value: 'cash' }] : []),
    ...(bankTransferEnabled ? [{ label: '銀行轉帳', value: 'transfer' }] : []),
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: screens.xs ? '16px' : screens.sm ? '24px' : '40px 40px 80px', width: '100%' }}>
        <Button icon={<LeftOutlined />} onClick={() => navigate('/cart')} style={{ marginBottom: 20 }}>
          返回購物車
        </Button>

        <Title level={2}>結帳</Title>

        <div style={{
          display: 'grid',
          gridTemplateColumns: screens.md ? '1fr 1fr' : '1fr',
          gap: 24
        }}>
          <Card title="收件 / 付款資訊">
            <Form layout="vertical" form={form} onFinish={onFinish}>
              <Form.Item label="收件人姓名" name="name" rules={[{ required: true, message: '請輸入收件人姓名' }]}>
                <Input placeholder="請輸入姓名" />
              </Form.Item>

              <Form.Item label="聯絡電話" name="phone" rules={[{ required: true, message: '請輸入聯絡電話' }]}>
                <Input placeholder="請輸入電話" />
              </Form.Item>

              <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: '請輸入正確的 Email' }]}>
                <Input placeholder="請輸入 Email" />
              </Form.Item>

              <Form.Item label="收件地址" name="address" rules={[{ required: true, message: '請輸入收件地址' }]}>
                <Input.TextArea placeholder="請輸入完整地址" rows={3} />
              </Form.Item>

              {hasPrePayRequired && (
                <Alert
                  type="warning"
                  showIcon
                  message="您的購物車含促銷限量商品，需完成付款後才能出貨，僅支援「銀行轉帳」付款"
                  style={{ marginBottom: 16 }}
                />
              )}

              <Form.Item label="付款方式" name="paymentMethod" initialValue={paymentOptions[0]?.value}>
                <Select
                  options={paymentOptions}
                  value={paymentMethod}
                  onChange={v => setPaymentMethod(v)}
                />
              </Form.Item>

              {/* 銀行轉帳說明 */}
              {paymentMethod === 'transfer' && (
                <>
                  {bankInfo && (
                    <Alert
                      type="info"
                      icon={<BankOutlined />}
                      showIcon
                      style={{ marginBottom: 16 }}
                      message="轉帳帳號資訊"
                      description={
                        <div>
                          <div>銀行：{bankInfo.bankName} {bankInfo.branch}</div>
                          <div>帳號：<strong>{bankInfo.accountNumber}</strong></div>
                          <div>戶名：{bankInfo.accountName}</div>
                          <div style={{ marginTop: 8, color: '#666' }}>
                            ⚠️ 轉帳完成後，請將轉帳後5碼填入下方欄位，以利核帳
                          </div>
                        </div>
                      }
                    />
                  )}
                  <Form.Item
                    label="轉帳後5碼（必填）"
                    name="transferCode"
                    rules={[
                      { required: true, message: '請填寫轉帳後5碼' },
                      { len: 5, message: '請輸入正好5碼數字' },
                      { pattern: /^\d{5}$/, message: '請輸入5碼數字' },
                    ]}
                  >
                    <Input placeholder="例：12345" maxLength={5} style={{ width: 160 }} />
                  </Form.Item>
                </>
              )}

              <Form.Item label="備註" name="note">
                <Input.TextArea placeholder="其他需求（選填）" rows={2} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                  確認送出訂單
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Card title="訂單明細">
            <List
              dataSource={items}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.name}
                    description={`NT$ ${item.price} x ${item.quantity}`}
                  />
                  <div>NT$ {item.price * item.quantity}</div>
                </List.Item>
              )}
            />
            <Divider />
            <div style={{ textAlign: 'right' }}>
              <Title level={4}>
                總計：<span style={{ color: '#ff4d4f' }}>NT$ {getTotalPrice()}</span>
              </Title>
            </div>
            {paymentMethod === 'transfer' && (
              <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
                選擇銀行轉帳：請在收到確認通知後完成付款，並填寫轉帳後5碼
              </Paragraph>
            )}
          </Card>
        </div>
      <BackTop visibilityHeight={300}>
        <div style={{
          height: 40, width: 40, lineHeight: '40px', borderRadius: '50%',
          backgroundColor: '#d4a574', color: '#fff', textAlign: 'center',
          fontSize: 20, boxShadow: '0 4px 12px rgba(212,165,116,0.4)', cursor: 'pointer',
        }}>
          <UpOutlined />
        </div>
      </BackTop>
    </div>
  );
}

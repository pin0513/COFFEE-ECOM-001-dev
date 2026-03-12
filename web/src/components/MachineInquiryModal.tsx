import { Modal, Form, Input, Button, message, Radio } from 'antd';
import { CreditCardOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { createOrder, createEcpayCheckout } from '../services/orderService';

interface Props {
  open: boolean;
  onClose: () => void;
  product: { id: number; name: string; price: number; sku: string | null };
  installmentEnabled: boolean;
  onetimeEnabled: boolean;
}

export default function MachineInquiryModal({ open, onClose, product, installmentEnabled, onetimeEnabled }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<'onetime' | 'installment'>(onetimeEnabled ? 'onetime' : 'installment');
  const [installmentPeriod, setInstallmentPeriod] = useState<number>(12);

  const showBothOptions = installmentEnabled && onetimeEnabled;

  const handleSubmit = async (values: { name: string; phone: string; email: string; address?: string }) => {
    setLoading(true);
    try {
      const period = paymentType === 'installment' && installmentEnabled ? installmentPeriod : undefined;
      const order = await createOrder({
        customerEmail: values.email,
        items: [{ productId: product.id, quantity: 1 }],
        discountAmount: 0,
        paymentMethod: 'CreditCard',
        recipientName: values.name,
        recipientPhone: values.phone,
        shippingAddress: values.address || '洽談中，待確認',
        notes: `咖啡機詢購 | ${period ? `信用卡 ${period} 期分期` : '一次買斷'}`,
      });

      const { formHtml } = await createEcpayCheckout(order.id, period);
      const div = document.createElement('div');
      div.innerHTML = formHtml;
      document.body.appendChild(div);
      const f = div.querySelector('form');
      if (f) { f.submit(); return; }
      message.success('訂單建立成功，即將前往付款');
    } catch {
      message.error('送出失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="咖啡機詢購 / 分期申請"
      footer={null}
      width={520}
      destroyOnClose
    >
      {/* 商品資訊 */}
      <div style={{
        background: '#faf7f4',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{product.name}</span>
        <span style={{ color: '#e8293b', fontWeight: 700, fontSize: 17 }}>
          NT${product.price.toLocaleString()}
        </span>
      </div>

      {/* 付款方式選擇 */}
      {showBothOptions && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>付款方式</div>
          <Radio.Group value={paymentType} onChange={e => setPaymentType(e.target.value)} buttonStyle="solid">
            <Radio.Button value="onetime"><ShoppingOutlined /> 一次買斷</Radio.Button>
            <Radio.Button value="installment"><CreditCardOutlined /> 信用卡分期</Radio.Button>
          </Radio.Group>
        </div>
      )}

      {/* 分期期數選擇 */}
      {paymentType === 'installment' && installmentEnabled && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>分期期數</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[6, 12, 18].map(n => (
              <button
                key={n}
                onClick={() => setInstallmentPeriod(n)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  border: `2px solid ${installmentPeriod === n ? '#e8293b' : '#d9d9d9'}`,
                  background: installmentPeriod === n ? '#fff0f0' : '#fff',
                  color: installmentPeriod === n ? '#e8293b' : '#333',
                  cursor: 'pointer',
                  fontWeight: installmentPeriod === n ? 600 : 400,
                  fontSize: 13,
                }}
              >
                {n} 期<br />
                <span style={{ fontSize: 11, color: '#888' }}>約 NT${Math.ceil(product.price / n).toLocaleString()}/期</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 聯絡資料 */}
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="姓名"
          name="name"
          rules={[{ required: true, message: '請輸入姓名' }]}
        >
          <Input placeholder="請輸入姓名" />
        </Form.Item>
        <Form.Item
          label="聯絡電話"
          name="phone"
          rules={[{ required: true, message: '請輸入聯絡電話' }]}
        >
          <Input placeholder="請輸入電話" />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, type: 'email', message: '請輸入正確的 Email' }]}
        >
          <Input placeholder="請輸入 Email" />
        </Form.Item>
        <Form.Item label="送貨地址（選填）" name="address">
          <Input placeholder="可稍後確認" />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
          style={{ background: '#e8293b', borderColor: '#e8293b', marginTop: 4 }}
        >
          {paymentType === 'installment' && installmentEnabled
            ? `前往分期付款（${installmentPeriod} 期 · 約 NT$${Math.ceil(product.price / installmentPeriod).toLocaleString()}/期）`
            : `前往付款 NT$${product.price.toLocaleString()}`}
        </Button>
        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#888' }}>
          付款由綠界金流（ECPay）安全處理
        </p>
      </Form>
    </Modal>
  );
}

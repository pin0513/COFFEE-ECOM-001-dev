import { useEffect, useState } from 'react';
import { Button, Result, Spin } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../config/api';

export default function PaymentReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'fail'>('loading');
  const [message, setMessage] = useState('');

  const method  = searchParams.get('method') ?? '';
  const type    = searchParams.get('type') ?? '';
  const rtnCode = searchParams.get('rtnCode') ?? '';
  const orderId = searchParams.get('orderId') ?? '';
  const transactionId = searchParams.get('transactionId') ?? '';
  const isCancelPage = window.location.pathname.includes('/payment/cancel');

  useEffect(() => {
    if (isCancelPage) {
      setStatus('fail');
      setMessage('您已取消此次付款，如需重新付款請聯絡客服。');
      return;
    }

    // ECPay 同步返回（由 API redirect 帶 status 參數）
    if (method === 'ecpay' || rtnCode) {
      if (rtnCode === '1' || searchParams.get('status') === 'success') {
        setStatus('success');
        setMessage('付款成功，訂單已確認。');
      } else {
        setStatus('fail');
        setMessage(`付款失敗（代碼：${rtnCode || '未知'}），請重試或聯絡客服。`);
      }
      return;
    }

    // LINE Pay confirm
    if (type === 'linepay' && transactionId && orderId) {
      apiClient.get(`/payment/linepay/confirm?transactionId=${transactionId}&orderId=${orderId}`)
        .then(res => {
          if (res.data?.success) {
            setStatus('success');
            setMessage('LINE Pay 付款成功，訂單已確認。');
          } else {
            setStatus('fail');
            setMessage(`LINE Pay 付款失敗（${res.data?.returnCode ?? ''}），請聯絡客服。`);
          }
        })
        .catch(() => {
          setStatus('fail');
          setMessage('付款確認失敗，請聯絡客服。');
        });
      return;
    }

    // 未知情況 — 預設成功（部分付款方式直接導回）
    setStatus('success');
    setMessage('感謝您的訂購！');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="確認付款中..." />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <Result
        status={status === 'success' ? 'success' : 'error'}
        title={status === 'success' ? '付款成功 ✓' : '付款失敗'}
        subTitle={message}
        extra={[
          status === 'success' ? (
            <Button type="primary" key="products" onClick={() => navigate('/products')}>
              繼續購物
            </Button>
          ) : (
            <Button type="primary" key="retry" onClick={() => navigate('/cart')}>
              返回購物車
            </Button>
          ),
          <Button key="home" onClick={() => navigate('/')}>
            返回首頁
          </Button>
        ]}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { message } from 'antd';
import { apiClient } from '../config/api';
import './BusinessPage.css';

// ── API 型別 ────────────────────────────────────────────────────
interface MachinePlanApi {
  id: number;
  name: string;
  category: string;
  description?: string;
  tag?: string;
  tagColor?: string;
  targetDesc?: string;
  badge?: string;
  depositNote?: string;
  monthlyPrice?: number;
  quarterlyPrice?: number;
  annualPrice?: number;
  depositAmount?: number;
  features?: string; // JSON string[]
  sortOrder: number;
}

function getPlanFeatures(plan: MachinePlanApi): string[] {
  try { return JSON.parse(plan.features || '[]'); } catch { return []; }
}

// ── 應用場景 ────────────────────────────────────────────────────
const SCENARIOS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    title: '辦公室',
    desc: '提升員工活力，讓每個早晨從一杯好咖啡開始',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2h18v20H3z"/><path d="M9 22V12h6v10"/><path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01"/>
      </svg>
    ),
    title: '咖啡廳',
    desc: '讓專業機器的穩定出杯，成為您口碑的最佳後盾',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
    title: '餐廳',
    desc: '飯後一杯精品咖啡，讓客人留下最完美的句點',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: '飯店',
    desc: '從大廳到客房，五星咖啡體驗是品牌印象的一部分',
  },
];

// ── 詢問表單 ────────────────────────────────────────────────────
interface InquiryFormProps {
  preselectedPlan?: string;
  inquiryType: string;
  onSuccess: () => void;
  machinePlans: MachinePlanApi[];
}

function InquiryForm({ preselectedPlan, inquiryType, onSuccess, machinePlans }: InquiryFormProps) {
  const [form, setForm] = useState({
    contactName: '',
    phone: '',
    email: '',
    company: '',
    selectedPlan: preselectedPlan || '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contactName.trim() || !form.phone.trim()) {
      message.warning('請填寫姓名與聯絡電話');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/inquiries', {
        contactName: form.contactName,
        phone: form.phone,
        email: form.email || null,
        company: form.company || null,
        inquiryType,
        selectedPlan: form.selectedPlan || null,
        message: form.message || null,
      });
      onSuccess();
    } catch {
      message.error('送出失敗，請稍後再試或直接致電專線');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="biz-form" onSubmit={handleSubmit}>
      <div className="biz-form-row">
        <div className="biz-form-field">
          <label>姓名 <span className="req">*</span></label>
          <input
            type="text"
            placeholder="您的姓名"
            value={form.contactName}
            onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
          />
        </div>
        <div className="biz-form-field">
          <label>聯絡電話 <span className="req">*</span></label>
          <input
            type="tel"
            placeholder="0912-345-678"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          />
        </div>
      </div>
      <div className="biz-form-row">
        <div className="biz-form-field">
          <label>Email</label>
          <input
            type="email"
            placeholder="name@company.com（選填）"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div className="biz-form-field">
          <label>公司 / 店名</label>
          <input
            type="text"
            placeholder="品皇咖啡館（選填）"
            value={form.company}
            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
          />
        </div>
      </div>
      <div className="biz-form-field">
        <label>有興趣的方案</label>
        <select
          value={form.selectedPlan}
          onChange={e => setForm(f => ({ ...f, selectedPlan: e.target.value }))}
        >
          <option value="">── 請選擇（選填）──</option>
          {machinePlans.map(p => (
            <option key={p.id} value={String(p.id)}>{p.name}</option>
          ))}
          <option value="bulk-purchase">大量採購咖啡豆</option>
          <option value="hotel-restaurant-supply">飯店 / 餐廳豆源供應</option>
        </select>
      </div>
      <div className="biz-form-field">
        <label>需求說明</label>
        <textarea
          placeholder="例如：辦公室約 50 人、希望提供義式咖啡與手沖選項..."
          rows={4}
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
        />
      </div>
      <button type="submit" className="biz-submit-btn" disabled={submitting}>
        {submitting ? '送出中...' : '送出詢問，等待專人回覆'}
      </button>
      <p className="biz-form-note">通常於 1 個工作日內回覆，急件請直接撥打專線</p>
    </form>
  );
}

// ── 主頁面 ────────────────────────────────────────────────────────
export default function BusinessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [machinePlans, setMachinePlans] = useState<MachinePlanApi[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const isBulk = location.hash === '#bulk';
  const inquiryType = isBulk ? 'hotel-restaurant' : 'machine-rental';

  useEffect(() => {
    apiClient.get('/machine-plans')
      .then(res => { setMachinePlans(res.data); })
      .catch(() => { /* keep empty */ })
      .finally(() => setPlansLoading(false));
  }, []);

  return (
    <>
      <Helmet>
        <title>商業合作方案 | 品皇咖啡</title>
        <meta name="description" content="品皇咖啡提供辦公室、咖啡廳、餐廳、飯店的咖啡機租賃與大量採購方案，專業配置、免維護、直接起飛。" />
      </Helmet>

      <div className="biz-page">

        {/* Hero */}
        <section className="biz-hero">
          <div className="biz-hero-overlay" />
          <div className="biz-hero-content">
            <p className="biz-hero-label">BUSINESS SOLUTIONS</p>
            <h1 className="biz-hero-title">
              為您的空間帶來<br />完美的咖啡體驗
            </h1>
            <p className="biz-hero-sub">
              從辦公室到五星飯店，品皇咖啡提供一站式解決方案<br />
              機器 × 豆源 × 維護，全包搞定，您只需要享受好咖啡
            </p>
            <div className="biz-hero-ctas">
              <a href="#plans" className="biz-hero-btn primary">查看方案</a>
              <a href="#inquiry" className="biz-hero-btn outline">立即詢問</a>
            </div>
            <div className="biz-hotline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.57 4.9 2 2 0 0 1 3.55 2.72h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.31a16 16 0 0 0 5.91 5.91l1.78-1.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              商業專線：<strong>02-2999-0000</strong>（週一至週五 09:00–18:00）
            </div>
          </div>
        </section>

        {/* 大量採購 & 飯店餐飲區（#bulk） */}
        <section id="bulk" className="biz-bulk-section">
          <div className="biz-container">
            <div className="biz-section-header">
              <h2>大量採購・飯店餐飲豆源供應</h2>
              <p>為企業量身訂製的咖啡採購方案，含商業配送與專屬服務</p>
            </div>
            <div className="biz-bulk-cards">
              <div className="biz-bulk-card">
                <div className="biz-bulk-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>
                  </svg>
                </div>
                <h3>企業大量採購</h3>
                <p>月採購 20 箱以上，享批發優惠，附專屬業務顧問、商業配送到府，不限單品或配方豆。</p>
                <ul className="biz-bulk-perks">
                  <li>批發優惠價（月量越大折扣越高）</li>
                  <li>固定配送日，庫存無煩惱</li>
                  <li>客製化混豆比例</li>
                  <li>季度烘焙品嚐日</li>
                </ul>
                <a href="#inquiry" className="biz-bulk-cta" onClick={() => setActivePlanId('bulk-purchase')}>
                  詢問採購方案
                </a>
              </div>
              <div className="biz-bulk-card featured">
                <div className="biz-bulk-badge">最完整</div>
                <div className="biz-bulk-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <h3>飯店・餐廳豆源合作</h3>
                <p>與飯店、連鎖餐廳長期合作，提供穩定頂級豆源，搭配品牌故事卡、服務員沖泡訓練，讓咖啡成為你的口碑亮點。</p>
                <ul className="biz-bulk-perks">
                  <li>頂級莊園豆穩定供應</li>
                  <li>品牌定制包裝（加購）</li>
                  <li>服務人員沖泡培訓</li>
                  <li>季度新豆品嚐會</li>
                  <li>專屬業務 1 對 1 服務</li>
                </ul>
                <a href="#inquiry" className="biz-bulk-cta" onClick={() => setActivePlanId('hotel-restaurant-supply')}>
                  詢問合作方案
                </a>
              </div>
              <div className="biz-bulk-card">
                <div className="biz-bulk-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="1"/><path d="M13 19h2m2 0h2"/>
                  </svg>
                </div>
                <h3>辦公室固定配送</h3>
                <p>小批量也享企業價，每月固定出貨，讓辦公室咖啡不再斷糧，省去採購煩惱。</p>
                <ul className="biz-bulk-perks">
                  <li>最低 5 箱起訂</li>
                  <li>每月固定配送日</li>
                  <li>搭配咖啡機租賃更划算</li>
                  <li>線上帳戶一鍵補貨</li>
                </ul>
                <a href="#inquiry" className="biz-bulk-cta" onClick={() => setActivePlanId('bulk-purchase')}>
                  詢問採購方案
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 機器方案 */}
        <section id="plans" className="biz-plans-section">
          <div className="biz-container">
            <div className="biz-section-header">
              <h2>咖啡機租賃 / 購買方案</h2>
              <p>月租即享頂規設備，零維護、零壓力，隨時升級換新</p>
            </div>
            {plansLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>載入方案中...</div>
            ) : (
              <div className="biz-plans-grid">
                {machinePlans.map(plan => (
                  <div
                    key={plan.id}
                    className={`biz-plan-card${plan.badge ? ' recommended' : ''}`}
                  >
                    {plan.badge && <div className="biz-plan-badge">{plan.badge}</div>}
                    <div className={`biz-plan-tag ${plan.tagColor || 'default'}`}>{plan.tag}</div>
                    <h3 className="biz-plan-name">{plan.name}</h3>
                    <p className="biz-plan-target">{plan.targetDesc}</p>
                    <div className="biz-plan-price">
                      {plan.monthlyPrice ? (
                        <>
                          <span className="biz-plan-fee">NT$ {plan.monthlyPrice.toLocaleString()}</span>
                          <span className="biz-plan-period"> / 月</span>
                        </>
                      ) : (
                        <span className="biz-plan-fee custom">客製報價</span>
                      )}
                      <span className="biz-plan-deposit">{plan.depositNote}</span>
                    </div>
                    <ul className="biz-plan-features">
                      {getPlanFeatures(plan).map(f => (
                        <li key={f}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      className="biz-plan-cta"
                      onClick={() => {
                        setActivePlanId(String(plan.id));
                        document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      選擇此方案
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 應用場景 */}
        <section className="biz-scenarios-section">
          <div className="biz-container">
            <div className="biz-section-header">
              <h2>適合哪些場景？</h2>
              <p>無論您的空間大小，我們都有適合的方案</p>
            </div>
            <div className="biz-scenarios-grid">
              {SCENARIOS.map(s => (
                <div key={s.title} className="biz-scenario-chip">
                  <span className="biz-scenario-icon">{s.icon}</span>
                  <div>
                    <div className="biz-scenario-title">{s.title}</div>
                    <div className="biz-scenario-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 詢問表單 */}
        <section id="inquiry" className="biz-inquiry-section">
          <div className="biz-container biz-inquiry-inner">
            <div className="biz-inquiry-left">
              <h2>聯絡我們，取得專屬報價</h2>
              <p>填寫以下資訊，我們的商業顧問將於 <strong>1 個工作日內</strong>與您聯絡，為您量身規劃最合適的咖啡方案。</p>
              <div className="biz-contact-info">
                <div className="biz-contact-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.57 4.9 2 2 0 0 1 3.55 2.72h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.31a16 16 0 0 0 5.91 5.91l1.78-1.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>商業專線：<strong>02-2999-0000</strong></span>
                </div>
                <div className="biz-contact-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span>信箱：<strong>business@pinhung.com</strong></span>
                </div>
                <div className="biz-contact-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>服務時間：週一至週五 09:00–18:00</span>
                </div>
              </div>
              <button className="biz-back-btn" onClick={() => navigate('/')}>
                ← 回到首頁
              </button>
            </div>
            <div className="biz-inquiry-right">
              {submitted ? (
                <div className="biz-success">
                  <div className="biz-success-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <h3>詢問單已送出！</h3>
                  <p>我們將於 1 個工作日內透過電話與您聯繫，感謝您對品皇咖啡的信任。</p>
                  <button className="biz-submit-btn" onClick={() => setSubmitted(false)}>
                    重新填寫
                  </button>
                </div>
              ) : (
                <InquiryForm
                  preselectedPlan={activePlanId || undefined}
                  inquiryType={inquiryType}
                  onSuccess={() => setSubmitted(true)}
                  machinePlans={machinePlans}
                />
              )}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}

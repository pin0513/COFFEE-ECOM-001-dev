import { useState } from 'react';
import './MachinePlanPage.css';

export default function MachinePlanPage() {
  const [formSuccess, setFormSuccess] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setFormSubmitting(true);
    setFormError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: fd.get('contactName') as string,
          phone: fd.get('phone') as string,
          email: fd.get('email') as string || undefined,
          company: fd.get('company') as string || undefined,
          message: [
            `店型：${fd.get('storeType')}`,
            `感興趣方案：${fd.get('plan')}`,
            `月預估咖啡豆用量：${fd.get('beanUsage')} kg`,
            fd.get('note') ? `備註：${fd.get('note')}` : '',
          ].filter(Boolean).join('\n'),
          inquiryType: 'machine-rental',
          selectedPlan: fd.get('plan') as string,
        }),
      });
      if (!res.ok) throw new Error();
      setFormSuccess(true);
    } catch {
      setFormError('送出失敗，請稍後再試或直接來電');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero 區塊 */}
      <section className="mp-hero">
        <div className="mp-hero-bg" />
        <div className="mp-hero-overlay" />
        <div className="mp-hero-content container">
          <p className="mp-hero-eyebrow">品皇咖啡 × 商用機器</p>
          <h1 className="mp-hero-title">免費使用商用咖啡機</h1>
          <p className="mp-hero-subtitle">
            低價租售・免費借機・分期買斷<br />
            唯一條件：咖啡豆、茶葉、原物料跟我們買
          </p>
          <button
            className="mp-hero-cta"
            onClick={() => document.getElementById('mp-form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            立即申請方案
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section className="mp-how container">
        <h2 className="mp-section-title">如何運作？</h2>
        <div className="mp-how-steps">
          {[
            { num: '01', title: '選擇機型', desc: '依您的場域、日產杯數選擇合適機型' },
            { num: '02', title: '簽訂合約', desc: '確認每月咖啡豆採購量，機器即可免費或優惠取得' },
            { num: '03', title: '開始使用', desc: '安裝、教學、維護一站包含，豆子定期送到' },
          ].map(s => (
            <div key={s.num} className="mp-how-step">
              <span className="mp-how-num">{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 三方案卡片 */}
      <section className="mp-plans container">
        <h2 className="mp-section-title">三種合作方式</h2>
        <div className="mp-plan-cards">
          {[
            {
              tag: '最受歡迎',
              title: '免費借機',
              price: 'NT$0',
              unit: '機器費用',
              desc: '機器完全免費提供使用，每月固定採購咖啡豆即可',
              items: ['機器安裝費 NT$0', '維護保養費 NT$0', '每月固定採購咖啡豆', '合約期滿可續約'],
              highlight: true,
            },
            {
              tag: '靈活彈性',
              title: '低價租售',
              price: '月租優惠',
              unit: '遠低於市價',
              desc: '象徵性月租金取得機器使用權，豆子跟我們買享進一步折扣',
              items: ['超低月租金', '機器維護包含', '咖啡豆享批發價', '無長期鎖定壓力'],
              highlight: false,
            },
            {
              tag: '自主擁有',
              title: '分期買斷',
              price: '信用卡分期',
              unit: '最長 24 期',
              desc: '分期買斷機器，同時採購咖啡豆享有專屬批發優惠',
              items: ['6 / 12 / 18 / 24 期', '機器完全所有權', '咖啡豆批發優惠', '維護保固期內免費'],
              highlight: false,
            },
          ].map(plan => (
            <div key={plan.title} className={`mp-plan-card${plan.highlight ? ' mp-plan-card--highlight' : ''}`}>
              {plan.highlight && <span className="mp-plan-tag">{plan.tag}</span>}
              <h3 className="mp-plan-title">{plan.title}</h3>
              <div className="mp-plan-price">{plan.price}</div>
              <div className="mp-plan-unit">{plan.unit}</div>
              <p className="mp-plan-desc">{plan.desc}</p>
              <ul className="mp-plan-items">
                {plan.items.map(item => <li key={item}>{item}</li>)}
              </ul>
              <button
                className="mp-plan-btn"
                onClick={() => document.getElementById('mp-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                申請此方案
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 唯一條件強調區 */}
      <section className="mp-condition">
        <div className="container">
          <h2 className="mp-condition-title">唯一的條件</h2>
          <p className="mp-condition-desc">
            咖啡豆・茶葉・糖漿・奶精・清潔耗材，<br />
            向品皇咖啡採購，機器就是您的。
          </p>
          <div className="mp-condition-items">
            {['精品咖啡豆', '特調茶葉', '飲品糖漿', '奶精耗材', '機器清潔品', '紙杯周邊'].map(item => (
              <span key={item} className="mp-condition-tag">{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 方案申請表單 */}
      <section id="mp-form" className="mp-form-section">
        <div className="container">
          <div className="mp-form-wrap">
            {formSuccess ? (
              <div className="mp-success">
                <div className="mp-success-icon">✓</div>
                <div className="mp-success-title">申請已送出，業務將盡快聯繫您</div>
                <div className="mp-success-sub">通常於 1 個工作日內回覆</div>
              </div>
            ) : (
              <>
                <h2 className="mp-form-title">填寫方案申請</h2>
                <p className="mp-form-subtitle">填寫後業務將於 1 個工作日內聯繫您</p>
                <form onSubmit={handleFormSubmit}>
                  <div className="mp-field-row">
                    <div className="mp-field">
                      <label htmlFor="storeType">店型</label>
                      <select name="storeType" id="storeType">
                        <option value="咖啡廳">咖啡廳</option>
                        <option value="餐廳">餐廳</option>
                        <option value="飲料店">飲料店</option>
                        <option value="辦公室">辦公室</option>
                        <option value="飯店">飯店</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                    <div className="mp-field">
                      <label htmlFor="plan">感興趣方案</label>
                      <select name="plan" id="plan">
                        <option value="免費借機">免費借機</option>
                        <option value="低價租售">低價租售</option>
                        <option value="分期買斷">分期買斷</option>
                        <option value="尚未決定">尚未決定</option>
                      </select>
                    </div>
                  </div>
                  <div className="mp-field">
                    <label htmlFor="beanUsage">每月預估咖啡豆用量</label>
                    <select name="beanUsage" id="beanUsage">
                      <option value="5 kg 以下">5 kg 以下</option>
                      <option value="5–10 kg">5–10 kg</option>
                      <option value="10–30 kg">10–30 kg</option>
                      <option value="30 kg 以上">30 kg 以上</option>
                    </select>
                  </div>
                  <div className="mp-field-row">
                    <div className="mp-field">
                      <label htmlFor="contactName">聯絡人姓名 *</label>
                      <input type="text" name="contactName" id="contactName" required />
                    </div>
                    <div className="mp-field">
                      <label htmlFor="phone">聯絡電話 *</label>
                      <input type="tel" name="phone" id="phone" required />
                    </div>
                  </div>
                  <div className="mp-field-row">
                    <div className="mp-field">
                      <label htmlFor="email">Email</label>
                      <input type="email" name="email" id="email" />
                    </div>
                    <div className="mp-field">
                      <label htmlFor="company">店名 / 公司</label>
                      <input type="text" name="company" id="company" />
                    </div>
                  </div>
                  <div className="mp-field">
                    <label htmlFor="note">備註</label>
                    <textarea name="note" id="note" rows={3} />
                  </div>
                  {formError && (
                    <p style={{ color: '#e8293b', fontSize: 13, marginBottom: 8 }}>{formError}</p>
                  )}
                  <button type="submit" className="mp-submit" disabled={formSubmitting}>
                    {formSubmitting ? '送出中...' : '送出申請'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Spin, Button } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiClient } from '../config/api';
import './PagesPage.css';

interface ContentPage {
  id: number;
  slug: string;
  titleZhTW: string;
  bodyZhTW: string;
  updatedAt: string | null;
}

export default function PagesPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    setLoading(true);
    setNotFound(false);
    apiClient.get<ContentPage>(`/pages/${slug}`)
      .then(res => setPage(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="cp-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="cp-not-found">
        <h2>頁面不存在</h2>
        <p>您要找的頁面不存在或尚未發佈。</p>
        <Button onClick={() => navigate('/')}>回到首頁</Button>
      </div>
    );
  }

  return (
    <>
    <Helmet>
      <title>{page.titleZhTW} | 品皇咖啡</title>
      <meta name="description" content={page.bodyZhTW.replace(/[#*\[\]]/g, '').substring(0, 160)} />
    </Helmet>
    <div className="cp-page">
      <div className="cp-container">
        <Button
          icon={<LeftOutlined />}
          onClick={() => navigate(-1)}
          className="cp-back-btn"
        >
          返回
        </Button>

        <h1 className="cp-title">{page.titleZhTW}</h1>

        <article className="cp-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {page.bodyZhTW.replace(/^#[^\n]*\n+/, '')}
          </ReactMarkdown>
        </article>

        {page.updatedAt && (
          <p className="cp-updated">
            最後更新：{new Date(page.updatedAt).toLocaleDateString('zh-TW')}
          </p>
        )}
      </div>
    </div>
    </>
  );
}

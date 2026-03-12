import { apiClient } from '../config/api';

export interface SiteSettings {
  site_name: string;
  site_subtitle: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  branch_info: string;
  line_client_url: string;
  footer_text: string;
  logo_url: string;
  payment_bank_transfer_enabled: string;
  payment_cash_enabled: string;
  payment_ecpay_enabled: string;
  payment_linepay_enabled: string;
  bank_account_info: string;
  order_notification_email: string;
  checkout_enabled: string;
  brand_story_title: string;
  brand_story_content: string;
  // Footer links (JSON strings)
  footer_links_shopping: string;
  footer_links_service: string;
  footer_social_facebook: string;
  footer_social_instagram: string;
  // 咖啡機直接詢購設定
  machine_direct_checkout_enabled: string; // 'true' | 'false'
  machine_installment_enabled: string;     // 'true' | 'false'
  machine_onetime_enabled: string;         // 'true' | 'false'
}

export const getSiteSettings = async (): Promise<SiteSettings> => {
  const res = await apiClient.get<SiteSettings>('/site-settings');
  return res.data;
};

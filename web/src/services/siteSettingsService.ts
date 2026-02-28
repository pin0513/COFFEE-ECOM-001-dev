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
  bank_account_info: string;
  order_notification_email: string;
  checkout_enabled: string;
  brand_story_title: string;
  brand_story_content: string;
}

export const getSiteSettings = async (): Promise<SiteSettings> => {
  const res = await apiClient.get<SiteSettings>('/site-settings');
  return res.data;
};

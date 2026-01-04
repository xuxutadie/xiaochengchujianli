
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Verification Service
 * Handles code validation and cross-device synchronization logic using Supabase.
 */

export interface VerificationResult {
  success: boolean;
  message?: string;
}

const USED_CODES_KEY = 'smart-resume-used-codes-v1';

class VerificationService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    if (supabaseUrl && supabaseAnonKey) {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    } else if (backendUrl) {
      // If we have a custom backend URL, we'll use it in the verifyCode method
    }
  }

  /**
   * Validates a code. 
   * Priority: 
   * 1. Custom Backend (Zeabur/Custom) if VITE_BACKEND_URL is set
   * 2. Supabase (Cross-device) if configured
   * 3. Local (codes.json + localStorage) as fallback
   */
  async verifyCode(code: string): Promise<VerificationResult> {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    if (backendUrl) {
      return this.verifyWithBackend(code, backendUrl);
    }
    
    if (this.supabase) {
      return this.verifyWithSupabase(code);
    }
    return this.verifyLocal(code);
  }

  /**
   * Custom Backend validation (Zeabur/Custom)
   */
  private async verifyWithBackend(code: string, baseUrl: string): Promise<VerificationResult> {
    try {
      const response = await fetch(`${baseUrl}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Backend verification failed:', error);
      return { success: false, message: '后端服务不可用' };
    }
  }

  /**
   * Remote validation using Supabase (Cross-device support)
   */
  private async verifyWithSupabase(code: string): Promise<VerificationResult> {
    if (!this.supabase) return { success: false, message: '数据库未连接' };

    try {
      // 1. Check if code exists and is not used
      const { data, error } = await this.supabase
        .from('verification_codes')
        .select('*')
        .eq('code', code)
        .single();

      if (error || !data) {
        return { success: false, message: '验证码无效' };
      }

      if (data.is_used) {
        return { success: false, message: '该验证码已被使用' };
      }

      // 2. Mark as used
      const { error: updateError } = await this.supabase
        .from('verification_codes')
        .update({ 
          is_used: true, 
          used_at: new Date().toISOString() 
        })
        .eq('code', code);

      if (updateError) {
        console.error('Update failed:', updateError);
        return { success: false, message: '兑换失败，请稍后再试' };
      }

      return { success: true };
    } catch (error) {
      console.error('Supabase verification failed:', error);
      return { success: false, message: '网络异常，请重试' };
    }
  }

  /**
   * Local validation (Fallback)
   */
  private async verifyLocal(code: string): Promise<VerificationResult> {
    try {
      const response = await fetch('/codes.json');
      const data = await response.json();
      const codes = data.codes || [];
      const remoteUsed = data.used || [];
      
      const localUsed = JSON.parse(localStorage.getItem(USED_CODES_KEY) || '[]');
      
      if (remoteUsed.includes(code) || localUsed.includes(code)) {
        return { success: false, message: '该验证码已被使用' };
      }
      
      if (codes.includes(code)) {
        const newLocalUsed = [...localUsed, code];
        localStorage.setItem(USED_CODES_KEY, JSON.stringify(newLocalUsed));
        return { success: true };
      }
      
      return { success: false, message: '验证码无效' };
    } catch (error) {
      console.error('Local verification failed:', error);
      return { success: false, message: '验证失败，请稍后再试' };
    }
  }
}

export const verificationService = new VerificationService();

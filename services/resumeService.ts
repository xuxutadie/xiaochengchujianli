/**
 * Resume Data Service
 * Handles saving and loading resume data to/from backend server
 * Also supports localStorage as fallback
 */

export interface ResumeData {
  // This interface matches the ResumeData type in types.ts
  [key: string]: any;
}

class ResumeService {
  private backendUrl: string;
  private storageKey = 'smart-resume-kid-data-v1';
  private codeKey = 'smart-resume-current-code';

  constructor() {
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  }

  /**
   * Get current verification code from localStorage
   */
  getCurrentCode(): string | null {
    return localStorage.getItem(this.codeKey);
  }

  /**
   * Set current verification code
   */
  setCurrentCode(code: string): void {
    localStorage.setItem(this.codeKey, code);
  }

  /**
   * Save resume data to server
   * @param code - Verification code used as identifier
   * @param data - Resume data to save
   * @param saveToLocalToo - Also save to localStorage as backup
   */
  async saveResume(code: string, data: ResumeData, saveToLocalToo: boolean = true): Promise<{ success: boolean; message: string }> {
    try {
      const finalUrl = this.backendUrl.replace(/\/$/, '') + '/api/resume/save';
      
      const response = await fetch(finalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          data
        })
      });

      const result = await response.json();

      if (result.success) {
        // Also save to localStorage as backup
        if (saveToLocalToo) {
          localStorage.setItem(this.storageKey, JSON.stringify(data));
          localStorage.setItem(this.codeKey, code);
        }
        return { success: true, message: '数据已保存到服务器' };
      } else {
        // If server save fails, at least save locally
        if (saveToLocalToo) {
          localStorage.setItem(this.storageKey, JSON.stringify(data));
          localStorage.setItem(this.codeKey, code);
        }
        return { success: true, message: '已保存到本地（服务器保存失败）' };
      }
    } catch (error) {
      console.error('Save resume error:', error);
      // Fallback to localStorage
      if (saveToLocalToo) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        localStorage.setItem(this.codeKey, code);
      }
      return { success: true, message: '已保存到本地（网络错误）' };
    }
  }

  /**
   * Load resume data from server
   * @param code - Verification code used as identifier
   * @returns Resume data or null if not found
   */
  async loadResume(code: string): Promise<{ success: boolean; data: ResumeData | null; message: string }> {
    try {
      const finalUrl = this.backendUrl.replace(/\/$/, '') + '/api/resume/load/' + code;
      
      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Save to localStorage as backup
        localStorage.setItem(this.storageKey, JSON.stringify(result.data));
        localStorage.setItem(this.codeKey, code);
        return { success: true, data: result.data, message: '从服务器加载成功' };
      }

      // If no data on server, try localStorage
      const localData = localStorage.getItem(this.storageKey);
      const localCode = localStorage.getItem(this.codeKey);
      
      if (localData && localCode === code) {
        return { success: true, data: JSON.parse(localData), message: '从本地加载成功' };
      }

      return { success: true, data: null, message: '未找到保存的数据' };
    } catch (error) {
      console.error('Load resume error:', error);
      
      // Fallback to localStorage
      const localData = localStorage.getItem(this.storageKey);
      const localCode = localStorage.getItem(this.codeKey);
      
      if (localData && localCode === code) {
        return { success: true, data: JSON.parse(localData), message: '从本地加载成功（网络错误）' };
      }

      return { success: false, data: null, message: '加载失败' };
    }
  }

  /**
   * Load from localStorage only (for initial app load)
   */
  loadFromLocal(): ResumeData | null {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Load from local error:', error);
    }
    return null;
  }

  /**
   * Save to localStorage only
   */
  saveToLocal(data: ResumeData): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Save to local error:', error);
    }
  }
}

export const resumeService = new ResumeService();
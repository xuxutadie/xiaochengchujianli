export const compressImage = (base64Str: string, maxWidth = 1600, maxHeight = 1600, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      // 快速检查：如果原图已经小于设定尺寸，且体积可控，可跳过重绘以提速
      // 但由于我们要统一转为 jpeg 且控制质量，通常还是需要重绘一次
      
      let width = img.width;
      let height = img.height;

      // 1. 调整分辨率：1600px 宽度对于 A4 打印（300DPI）来说是性能与清晰度的平衡点
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height *= maxWidth / width;
          width = maxWidth;
        } else {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false }); // 禁用 alpha 通道提速
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // 2. 优化渲染设置：medium 在大多数浏览器中比 high 快得多，且肉眼难辨差异
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // 3. 异步导出：toBlob 通常比 toDataURL 更高效（尤其在移动端）
      // 这里为了兼容现有代码返回 string，我们依然使用 toDataURL，但降低质量参数
      // 0.8 是 web 优化的黄金比例，能大幅减少 CPU 编码时间
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (error) => reject(error);
  });
};

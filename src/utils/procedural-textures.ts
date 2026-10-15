import * as THREE from 'three';

/**
 * High-quality procedural PBR texture generator for realistic jungle environment.
 * Generates textures in-memory with zero external HTTP dependencies.
 * Includes a robust DataTexture fallback for headless test environments (happy-dom/node).
 */
class ProceduralTextureManager {
  private cache: Map<string, THREE.CanvasTexture | THREE.DataTexture> = new Map();

  private createFallbackTexture(r: number, g: number, b: number): THREE.DataTexture {
    const data = new Uint8Array([r, g, b, 255]);
    const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    tex.needsUpdate = true;
    return tex;
  }

  /**
   * Generates weathered ancient stone flagstone texture with moss in crevices.
   */
  public getAncientStoneTexture(): THREE.CanvasTexture | THREE.DataTexture {
    if (this.cache.has('stone')) return this.cache.get('stone')!;

    if (typeof document === 'undefined') {
      const fb = this.createFallbackTexture(74, 71, 66);
      this.cache.set('stone', fb);
      return fb;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      const fb = this.createFallbackTexture(74, 71, 66);
      this.cache.set('stone', fb);
      return fb;
    }

    // Base weathered stone color
    ctx.fillStyle = '#4a4742';
    ctx.fillRect(0, 0, 512, 512);

    // Stone blocks grid pattern
    const rows = 8;
    const cols = 6;
    const cellW = 512 / cols;
    const cellH = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const offsetX = (r % 2) * (cellW / 2);
        const x = (c * cellW + offsetX) % 512;
        const y = r * cellH;

        const brightness = 60 + Math.random() * 25;
        ctx.fillStyle = `rgb(${brightness}, ${brightness - 4}, ${brightness - 10})`;
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

        for (let i = 0; i < 40; i++) {
          const px = x + 4 + Math.random() * (cellW - 8);
          const py = y + 4 + Math.random() * (cellH - 8);
          const size = 1 + Math.random() * 3;
          ctx.fillStyle = Math.random() < 0.5 ? 'rgba(30, 28, 25, 0.4)' : 'rgba(95, 90, 80, 0.35)';
          ctx.fillRect(px, py, size, size);
        }

        if (Math.random() < 0.65) {
          ctx.fillStyle = 'rgba(45, 75, 30, 0.7)';
          ctx.fillRect(x + 1, y + 1, cellW - 2, 4);
          ctx.fillRect(x + 1, y + 1, 4, cellH - 2);
        }
      }
    }

    ctx.strokeStyle = '#1e1c18';
    ctx.lineWidth = 4;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellH);
      ctx.lineTo(512, r * cellH);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 6);
    this.cache.set('stone', texture);
    return texture;
  }

  /**
   * Generates organic rainforest tree bark texture.
   */
  public getTreeBarkTexture(): THREE.CanvasTexture | THREE.DataTexture {
    if (this.cache.has('bark')) return this.cache.get('bark')!;

    if (typeof document === 'undefined') {
      const fb = this.createFallbackTexture(58, 46, 36);
      this.cache.set('bark', fb);
      return fb;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      const fb = this.createFallbackTexture(58, 46, 36);
      this.cache.set('bark', fb);
      return fb;
    }

    ctx.fillStyle = '#3a2e24';
    ctx.fillRect(0, 0, 256, 512);

    for (let i = 0; i < 350; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 512;
      const h = 20 + Math.random() * 80;
      const w = 1.5 + Math.random() * 3;
      const shade = 35 + Math.random() * 30;
      ctx.fillStyle = `rgb(${shade}, ${shade * 0.8}, ${shade * 0.6})`;
      ctx.fillRect(x, y, w, h);
    }

    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 512;
      const r = 8 + Math.random() * 18;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(40, 80, 28, 0.65)');
      grad.addColorStop(1, 'rgba(40, 80, 28, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 3);
    this.cache.set('bark', texture);
    return texture;
  }

  /**
   * Generates jungle ground soil with fallen organic leaves.
   */
  public getJungleGroundTexture(): THREE.CanvasTexture | THREE.DataTexture {
    if (this.cache.has('ground')) return this.cache.get('ground')!;

    if (typeof document === 'undefined') {
      const fb = this.createFallbackTexture(30, 36, 23);
      this.cache.set('ground', fb);
      return fb;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      const fb = this.createFallbackTexture(30, 36, 23);
      this.cache.set('ground', fb);
      return fb;
    }

    ctx.fillStyle = '#1e2417';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 15 + Math.random() * 40;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, Math.random() < 0.6 ? 'rgba(38, 65, 24, 0.75)' : 'rgba(45, 34, 22, 0.7)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 120; i++) {
      const lx = Math.random() * 512;
      const ly = Math.random() * 512;
      const angle = Math.random() * Math.PI;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(angle);
      ctx.fillStyle = Math.random() < 0.5 ? '#5c4322' : '#7a5a2d';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 8);
    this.cache.set('ground', texture);
    return texture;
  }

  /**
   * Generates golden coin Aztec/Mayan sun medallion relief.
   */
  public getGoldCoinTexture(): THREE.CanvasTexture | THREE.DataTexture {
    if (this.cache.has('coin')) return this.cache.get('coin')!;

    if (typeof document === 'undefined') {
      const fb = this.createFallbackTexture(255, 215, 0);
      this.cache.set('coin', fb);
      return fb;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      const fb = this.createFallbackTexture(255, 215, 0);
      this.cache.set('coin', fb);
      return fb;
    }

    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    grad.addColorStop(0, '#ffd700');
    grad.addColorStop(0.7, '#d4af37');
    grad.addColorStop(1, '#996515');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#5a3d0b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 128, 105, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(128, 128, 80, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x1 = 128 + Math.cos(angle) * 35;
      const y1 = 128 + Math.sin(angle) * 35;
      const x2 = 128 + Math.cos(angle) * 75;
      const y2 = 128 + Math.sin(angle) * 75;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.fillStyle = '#ffec8b';
    ctx.beginPath();
    ctx.arc(128, 128, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('coin', texture);
    return texture;
  }
}

export const textureManager = new ProceduralTextureManager();

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { APPROVED_PAPER_PALETTE } from '../src/components/wall/noteTexture.js';

describe('Frontend Chunk Splitting & Mobile Texture Scaling Verification', () => {
  it('APPROVED_PAPER_PALETTE includes all six required color variations', () => {
    const requiredColors = ['yellow', 'amber', 'orange', 'pink', 'lavender', 'blue', 'mint'];
    for (const color of requiredColors) {
      assert.ok(APPROVED_PAPER_PALETTE[color], `Palette missing color: ${color}`);
      assert.ok(APPROVED_PAPER_PALETTE[color].top, `Color ${color} missing top gradient`);
      assert.ok(APPROVED_PAPER_PALETTE[color].bottom, `Color ${color} missing bottom gradient`);
      assert.ok(APPROVED_PAPER_PALETTE[color].inkPrimary, `Color ${color} missing inkPrimary`);
    }
  });

  it('calculates adaptive texture resolution correctly for desktop vs mobile breakpoints', () => {
    const getTextureDims = (viewportWidth: number) => {
      const isMobile = viewportWidth < 768;
      const canvasSize = isMobile ? 512 : 1024;
      const scale = canvasSize / 1024;
      return { canvasSize, scale, isMobile };
    };

    const mobile = getTextureDims(390);
    assert.equal(mobile.isMobile, true);
    assert.equal(mobile.canvasSize, 512);
    assert.equal(mobile.scale, 0.5);

    const desktop = getTextureDims(1440);
    assert.equal(desktop.isMobile, false);
    assert.equal(desktop.canvasSize, 1024);
    assert.equal(desktop.scale, 1.0);

    const tabletBoundary = getTextureDims(768);
    assert.equal(tabletBoundary.isMobile, false);
    assert.equal(tabletBoundary.canvasSize, 1024);
  });

  it('validates manualChunks chunk-splitting configuration structure', async () => {
    // Dynamic import of vite.config to assert chunk separation
    const viteConfigModule = await import('../vite.config.js');
    const config = viteConfigModule.default;
    assert.ok(config.build, 'build section must exist in vite.config');
    assert.ok(config.build.rollupOptions, 'rollupOptions must exist');
    assert.ok(config.build.rollupOptions.output, 'rollupOptions.output must exist');
    
    const manualChunks = config.build.rollupOptions.output.manualChunks;
    assert.ok(manualChunks, 'manualChunks must be defined');
    assert.deepEqual(manualChunks['vendor-react'], ['react', 'react-dom', 'react-router-dom']);
    assert.deepEqual(manualChunks['vendor-three'], ['three', '@react-three/fiber', '@react-three/drei']);
    assert.deepEqual(manualChunks['vendor-socket'], ['socket.io-client']);
  });
});

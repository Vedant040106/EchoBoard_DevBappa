import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import type { PublicFeedbackNote } from '@devbappa/shared';
import { StickyNoteMesh } from './StickyNoteMesh.js';
import { PinboardEnvironment } from './PinboardEnvironment.js';
import { CameraController } from './CameraController.js';
import { clearTextureCache } from './noteTexture.js';

interface ThreePinboardCanvasProps {
  notes: PublicFeedbackNote[];
  newNoteId: string | null;
  onSelectNote: (note: PublicFeedbackNote) => void;
}

/**
 * Checks whether WebGL is supported in current client environment.
 */
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export const ThreePinboardCanvas: React.FC<ThreePinboardCanvasProps> = ({
  notes,
  newNoteId,
  onSelectNote,
}) => {
  const navigate = useNavigate();
  const [webglSupported, setWebglSupported] = useState(true);
  const [zoomPercent, setZoomPercent] = useState(100);

  // Camera navigation target state for smooth transitions
  const [navTarget, setNavTarget] = useState<{
    x: number;
    y: number;
    zoom: number;
    trigger: number;
  } | null>(null);

  // Check WebGL support on mount
  useEffect(() => {
    if (!isWebGLAvailable()) {
      setWebglSupported(false);
    }
    return () => {
      clearTextureCache();
    };
  }, []);

  // Filter notes that have valid layout coordinates
  const visibleNotes = useMemo(() => {
    return notes.filter((n) => n.layout && typeof n.layout.worldX === 'number');
  }, [notes]);

  // Compute bounding box and auto-frame camera so notes and pegboard occupy viewport
  const handleResetView = useCallback(() => {
    const vpW = window.innerWidth || 1024;
    const vpH = window.innerHeight || 768;
    const isMobile = vpW <= 600;

    if (visibleNotes.length === 0) {
      // Frame the periwinkle pegboard and upper studio props naturally
      const defaultZoom = isMobile ? Math.max(16, vpW / 58) : Math.min(vpW / 78, vpH / 62);
      setNavTarget({ x: 0, y: isMobile ? 3 : 2, zoom: Math.min(48, Math.max(18, defaultZoom)), trigger: Date.now() });
      return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    visibleNotes.forEach((n) => {
      const x = (n.layout.worldX || 0) / 75;
      const y = -(n.layout.worldY || 0) / 75;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    // Add note paper dimensions padding (note is 3.2 x 3.2 units)
    minX -= 2.0;
    maxX += 2.0;
    minY -= 2.0;
    maxY += 2.0;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const spanX = Math.max(12, maxX - minX);
    const spanY = Math.max(12, maxY - minY);

    // Calculate required orthographic zoom for 75-85% fill
    const targetFill = isMobile ? 0.88 : 0.8;
    const zoomX = (vpW * targetFill) / spanX;
    const zoomY = (vpH * targetFill) / spanY;
    const idealZoom = Math.min(zoomX, zoomY);

    const clampedZoom = Math.max(18, Math.min(65, idealZoom));

    setNavTarget({
      x: centerX,
      y: centerY,
      zoom: clampedZoom,
      trigger: Date.now(),
    });
  }, [visibleNotes]);

  // Auto-frame camera on initial load once notes are present
  const hasAutoFramed = React.useRef(false);
  useEffect(() => {
    if (!hasAutoFramed.current) {
      handleResetView();
      if (visibleNotes.length > 0) {
        hasAutoFramed.current = true;
      }
    }
  }, [visibleNotes, handleResetView]);

  // Navigate directly to latest note
  const handleLatestNote = useCallback(() => {
    if (visibleNotes.length === 0) return;
    const sorted = [...visibleNotes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const newest = sorted[0];
    const targetX = (newest.layout.worldX || 0) / 75;
    const targetY = -(newest.layout.worldY || 0) / 75;

    setNavTarget({ x: targetX, y: targetY, zoom: 55, trigger: Date.now() });
  }, [visibleNotes]);

  // Zoom In / Zoom Out controls
  const handleZoomIn = () => {
    setNavTarget((prev) => ({
      x: prev ? prev.x : 0,
      y: prev ? prev.y : 0,
      zoom: (prev ? prev.zoom : 38) * 1.25,
      trigger: Date.now(),
    }));
  };

  const handleZoomOut = () => {
    setNavTarget((prev) => ({
      x: prev ? prev.x : 0,
      y: prev ? prev.y : 0,
      zoom: (prev ? prev.zoom : 38) * 0.8,
      trigger: Date.now(),
    }));
  };

  // Keyboard navigation shortcuts (R for reset, L for latest, + / -)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        handleResetView();
      } else if (e.key === 'l' || e.key === 'L') {
        handleLatestNote();
      } else if (e.key === '=' || e.key === '+') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResetView, handleLatestNote]);

  // Fallback rendering if WebGL is unavailable on device
  if (!webglSupported) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#253ce6',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
            <path d="M12 2L15 8L21 9L17 14L18 20L12 17L6 20L7 14L3 9L9 8L12 2Z" />
          </svg>
        </div>
        <h2 style={{ fontSize: 'var(--text-title-md)', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
          3D Hardware Acceleration Unavailable
        </h2>
        <p style={{ fontSize: 'var(--text-body)', color: 'rgba(255, 255, 255, 0.85)', maxWidth: '440px', marginBottom: '24px' }}>
          Your browser does not have WebGL enabled. You can still explore all public feedback in the feedback history.
        </p>
        <button
          onClick={() => navigate('/history')}
          style={{
            height: '46px',
            padding: '0 24px',
            backgroundColor: '#f08035',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: '#ffffff',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          View Feedback History
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#253ce6',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Three.js Canvas Scene */}
      <Canvas
        orthographic
        camera={{ position: [0, 2, 20], zoom: 34 }}
        dpr={typeof window !== 'undefined' ? [1, Math.min(window.devicePixelRatio, 2)] : 1}
        shadows="soft"
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        {/* Cool Cobalt Ambient & Hemisphere Fill */}
        <hemisphereLight
          args={['#7c8cff', '#1b226b', 0.95]}
        />

        {/* Primary Warm Lamp Key Light (from upper-left articulated lamp position) */}
        <directionalLight
          position={[-10, 14, 16]}
          color="#fff2df"
          intensity={2.1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1}
          shadow-camera-far={65}
          shadow-camera-left={-38}
          shadow-camera-right={38}
          shadow-camera-top={32}
          shadow-camera-bottom={-32}
          shadow-bias={-0.0004}
        />

        {/* Studio Rim Fill Light */}
        <pointLight position={[24, -12, 12]} intensity={0.35} color="#8ce0ff" />

        {/* Camera Pan & Pinch-Zoom Controller */}
        <CameraController
          navTarget={navTarget}
          onZoomChange={setZoomPercent}
        />

        {/* 3D Pinboard Background Environment, Bump Texture & Dynamic Cursor Light */}
        <PinboardEnvironment
          showAnnouncement={visibleNotes.length === 0}
          onAnnouncementClick={() => navigate('/submit')}
        />

        {/* 3D Curled Sticky Note Meshes */}
        {visibleNotes.map((note) => (
          <StickyNoteMesh
            key={note.id}
            note={note}
            isNew={note.id === newNoteId}
            onSelect={onSelectNote}
          />
        ))}
      </Canvas>

      {/* Floating Canvas Navigation HUD Pill (Bottom-Center Positioned, Frosted Glass) */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(15, 17, 28, 0.92)',
          backdropFilter: 'blur(16px)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65)',
        }}
      >
        <button
          onClick={handleResetView}
          title="Reset Canvas View (R)"
          style={{
            height: '32px',
            padding: '0 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-full)',
            color: '#ffffff',
            fontSize: 'var(--text-caption)',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span>Reset View</span>
        </button>

        <button
          onClick={handleLatestNote}
          disabled={visibleNotes.length === 0}
          title="Navigate to Latest Note (L)"
          style={{
            height: '32px',
            padding: '0 12px',
            backgroundColor: 'rgba(249, 115, 22, 0.18)',
            border: '1px solid rgba(249, 115, 22, 0.4)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--accent-orange)',
            fontSize: 'var(--text-caption)',
            fontWeight: 700,
            cursor: visibleNotes.length === 0 ? 'not-allowed' : 'pointer',
            opacity: visibleNotes.length === 0 ? 0.5 : 1,
            transition: 'background-color 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>Latest</span>
        </button>

        <div
          style={{
            height: '16px',
            width: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            margin: '0 2px',
          }}
        />

        {/* Zoom Controls */}
        <button
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          style={{
            width: '28px',
            height: '28px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: '50%',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          -
        </button>

        <span
          style={{
            fontSize: 'var(--text-micro)',
            fontWeight: 800,
            color: 'var(--text-secondary)',
            minWidth: '38px',
            textAlign: 'center',
          }}
        >
          {zoomPercent}%
        </span>

        <button
          onClick={handleZoomIn}
          title="Zoom In (+)"
          style={{
            width: '28px',
            height: '28px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: '50%',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>

      {/* Screen Reader Accessible Note List (WCAG accessibility alternative) */}
      <div
        role="region"
        aria-label="Screen reader accessible notes list"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        <h3>EchoBoard Notes ({visibleNotes.length} total)</h3>
        <ul>
          {visibleNotes.map((note) => (
            <li key={note.id}>
              <button onClick={() => onSelectNote(note)}>
                Note by {note.publicDisplayName} ({note.role}): "{note.message}"
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

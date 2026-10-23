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

  // Navigate to overview of all notes
  const handleResetView = useCallback(() => {
    if (visibleNotes.length === 0) {
      setNavTarget({ x: 0, y: 0, zoom: 38, trigger: Date.now() });
      return;
    }

    // Calculate bounds of existing notes
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

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setNavTarget({ x: centerX, y: centerY, zoom: 34, trigger: Date.now() });
  }, [visibleNotes]);

  // Navigate to latest note
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
      zoom: (prev ? prev.zoom : 38) * 1.3,
      trigger: Date.now(),
    }));
  };

  const handleZoomOut = () => {
    setNavTarget((prev) => ({
      x: prev ? prev.x : 0,
      y: prev ? prev.y : 0,
      zoom: (prev ? prev.zoom : 38) * 0.77,
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

  // Fallback rendering if WebGL is unavailable on older device
  if (!webglSupported) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'var(--bg-outer)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📌</div>
        <h2 style={{ fontSize: 'var(--text-title-md)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          3D Hardware Acceleration Unavailable
        </h2>
        <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', maxWidth: '440px', marginBottom: '24px' }}>
          Your browser does not have WebGL enabled. You can still explore all public feedback in the feedback history.
        </p>
        <button
          onClick={() => navigate('/history')}
          style={{
            height: '46px',
            padding: '0 24px',
            backgroundColor: 'var(--accent-orange)',
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
        backgroundColor: '#090a10',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Three.js Canvas Scene */}
      <Canvas
        orthographic
        camera={{ position: [0, 0, 20], zoom: 38 }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        {/* Lights Setup */}
        <ambientLight intensity={0.88} />
        <directionalLight
          position={[12, 18, 24]}
          intensity={1.35}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={1}
          shadow-camera-far={60}
          shadow-camera-left={-28}
          shadow-camera-right={28}
          shadow-camera-top={24}
          shadow-camera-bottom={-24}
          shadow-bias={-0.0008}
        />
        {/* Warm Accent Rim Bounce Light */}
        <pointLight position={[-16, -14, 12]} intensity={0.45} color="#f97316" />
        <pointLight position={[16, -14, 12]} intensity={0.35} color="#38bdf8" />

        {/* Camera Pan & Pinch-Zoom Controller */}
        <CameraController
          navTarget={navTarget}
          onZoomChange={setZoomPercent}
        />

        {/* 3D Pinboard Background Environment & Particles */}
        <PinboardEnvironment
          showAnnouncement={visibleNotes.length === 0}
          onAnnouncementClick={() => navigate('/submit')}
        />

        {/* 3D Sticky Note Meshes */}
        {visibleNotes.map((note) => (
          <StickyNoteMesh
            key={note.id}
            note={note}
            isNew={note.id === newNoteId}
            onSelect={onSelectNote}
          />
        ))}
      </Canvas>

      {/* Floating Canvas Navigation Controls (Responsive & Frosted Glass) */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '20px',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--bg-surface-glass)',
          backdropFilter: 'blur(12px)',
          padding: '6px 10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.55)',
        }}
      >
        <button
          onClick={handleResetView}
          title="Reset Canvas View (R)"
          style={{
            height: '34px',
            padding: '0 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-xs)',
            color: '#ffffff',
            fontSize: 'var(--text-caption)',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
        >
          Reset View
        </button>

        <button
          onClick={handleLatestNote}
          disabled={visibleNotes.length === 0}
          title="Navigate to Latest Note (L)"
          style={{
            height: '34px',
            padding: '0 12px',
            backgroundColor: 'rgba(249, 115, 22, 0.16)',
            border: '1px solid rgba(249, 115, 22, 0.35)',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--accent-orange)',
            fontSize: 'var(--text-caption)',
            fontWeight: 700,
            cursor: visibleNotes.length === 0 ? 'not-allowed' : 'pointer',
            opacity: visibleNotes.length === 0 ? 0.5 : 1,
            transition: 'background-color 0.15s ease',
          }}
        >
          Latest
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
            width: '32px',
            height: '32px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: 'var(--radius-xs)',
            color: '#ffffff',
            fontSize: '18px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          −
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
            width: '32px',
            height: '32px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: 'var(--radius-xs)',
            color: '#ffffff',
            fontSize: '18px',
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
        <h3>Live Feedback Wall Notes ({visibleNotes.length} total)</h3>
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

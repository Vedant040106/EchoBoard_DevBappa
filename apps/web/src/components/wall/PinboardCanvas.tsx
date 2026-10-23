import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { PublicFeedbackNote } from '@devbappa/shared';
import { StickyNote } from '../sticky-note/StickyNote.js';

interface PinboardCanvasProps {
  notes: PublicFeedbackNote[];
  newNoteId?: string | null;
  onSelectNote: (note: PublicFeedbackNote) => void;
}

export const PinboardCanvas: React.FC<PinboardCanvasProps> = ({
  notes,
  newNoteId,
  onSelectNote,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight - 60 });

  // Viewport transform: pan (offset from center) and zoom scale
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Interaction tracking refs
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastTouchDistanceRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef(0);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute bounding box of all notes for "Reset View"
  const bounds = useMemo(() => {
    if (notes.length === 0) return { minX: -400, maxX: 400, minY: -300, maxY: 300 };
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const n of notes) {
      const { worldX, worldY, width = 240, height = 240 } = n.layout;
      if (worldX < minX) minX = worldX;
      if (worldX + width > maxX) maxX = worldX + width;
      if (worldY < minY) minY = worldY;
      if (worldY + height > maxY) maxY = worldY + height;
    }

    return { minX, maxX, minY, maxY };
  }, [notes]);

  // Reset View function: fit all notes into screen
  const handleResetView = useCallback(() => {
    if (notes.length === 0) {
      setPan({ x: 0, y: 0 });
      setZoom(1);
      return;
    }

    const contentWidth = bounds.maxX - bounds.minX + 200;
    const contentHeight = bounds.maxY - bounds.minY + 200;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const scaleX = dimensions.width / contentWidth;
    const scaleY = dimensions.height / contentHeight;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.2);

    setZoom(newZoom);
    setPan({
      x: -centerX * newZoom,
      y: -centerY * newZoom,
    });
  }, [bounds, dimensions, notes.length]);

  // Center once on initial mount
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!hasInitializedRef.current && notes.length > 0 && dimensions.width > 0) {
      handleResetView();
      hasInitializedRef.current = true;
    }
  }, [handleResetView, notes.length, dimensions.width]);

  // "Latest" action: pan directly to newest note
  const handlePanToLatest = useCallback(() => {
    if (notes.length === 0) return;
    // Find note with highest layer_order or latest createdAt
    const latestNote = [...notes].sort(
      (a, b) => (b.layout.layerOrder || 0) - (a.layout.layerOrder || 0)
    )[0];

    if (latestNote) {
      const targetZoom = 1;
      setZoom(targetZoom);
      setPan({
        x: -latestNote.layout.worldX * targetZoom,
        y: -latestNote.layout.worldY * targetZoom,
      });
    }
  }, [notes]);

  // Spatial culling / Virtualization: only render notes currently visible in viewport + buffer
  const visibleNotes = useMemo(() => {
    const buffer = 400; // 400px buffer zone around viewport
    const halfW = dimensions.width / 2;
    const halfH = dimensions.height / 2;

    const minWorldX = (-halfW - pan.x) / zoom - buffer;
    const maxWorldX = (halfW - pan.x) / zoom + buffer;
    const minWorldY = (-halfH - pan.y) / zoom - buffer;
    const maxWorldY = (halfH - pan.y) / zoom + buffer;

    return notes.filter((n) => {
      const x = n.layout.worldX;
      const y = n.layout.worldY;
      const w = n.layout.width || 240;
      const h = n.layout.height || 240;

      return x + w >= minWorldX && x <= maxWorldX && y + h >= minWorldY && y <= maxWorldY;
    });
  }, [notes, dimensions, pan, zoom]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.25), 2.5);

    // Zoom toward pointer
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left - dimensions.width / 2;
    const mouseY = e.clientY - rect.top - dimensions.height / 2;

    const dx = mouseX - pan.x;
    const dy = mouseY - pan.y;

    const newPanX = mouseX - dx * (newZoom / zoom);
    const newPanY = mouseY - dy * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Mouse drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with left mouse button when not clicking a note
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Touch gesture handling: 1-finger pan, 2-finger pinch zoom, double-tap zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Check for double tap
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        // Double tap: zoom in on tap position
        const touch = e.touches[0];
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const touchX = touch.clientX - rect.left - dimensions.width / 2;
          const touchY = touch.clientY - rect.top - dimensions.height / 2;
          const nextZoom = zoom > 1.2 ? 0.8 : 1.4;
          setZoom(nextZoom);
          setPan({
            x: -touchX * nextZoom,
            y: -touchY * nextZoom,
          });
        }
        lastTapTimeRef.current = 0;
        return;
      }
      lastTapTimeRef.current = now;

      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
      lastTouchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      // 2-finger pinch
      isDraggingRef.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistanceRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      setPan({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    } else if (e.touches.length === 2 && lastTouchDistanceRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const ratio = currentDist / lastTouchDistanceRef.current;

      const newZoom = Math.min(Math.max(zoom * ratio, 0.25), 2.5);
      setZoom(newZoom);
      lastTouchDistanceRef.current = currentDist;
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    lastTouchDistanceRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="pinboard-surface"
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 60px)',
        overflow: 'hidden',
        cursor: isDraggingRef.current ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Logical Canvas World Plane */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 0,
          height: 0,
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDraggingRef.current ? 'none' : 'transform 0.05s linear',
          willChange: 'transform',
        }}
      >
        {visibleNotes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            isNew={note.id === newNoteId}
            onClick={onSelectNote}
          />
        ))}
      </div>

      {/* Empty State when no notes exist */}
      {notes.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            padding: '32px',
            backgroundColor: 'rgba(19, 20, 31, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            maxWidth: '380px',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📌</div>
          <h3
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}
          >
            The pinboard is waiting for your voice!
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Be the first visitor at the Tech Expo to pin your thoughts and feedback onto the live
            wall.
          </p>
        </div>
      )}

      {/* Navigation Controls: Reset View and Latest */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          gap: '8px',
          zIndex: 40,
        }}
      >
        <button
          onClick={handleResetView}
          style={{
            padding: '8px 14px',
            backgroundColor: 'rgba(19, 20, 31, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 32, 48, 0.95)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(19, 20, 31, 0.9)')}
          title="Zoom out and fit all notes in view"
        >
          Reset View
        </button>

        <button
          onClick={handlePanToLatest}
          disabled={notes.length === 0}
          style={{
            padding: '8px 14px',
            backgroundColor: 'var(--accent-orange)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 700,
            cursor: notes.length === 0 ? 'not-allowed' : 'pointer',
            opacity: notes.length === 0 ? 0.5 : 1,
            boxShadow: '0 4px 12px var(--accent-glow)',
            transition: 'all 0.2s',
          }}
          title="Pan to latest pinned feedback"
        >
          Latest
        </button>
      </div>

      {/* Zoom readout indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'var(--text-muted)',
          fontSize: '11px',
          fontWeight: 600,
          pointerEvents: 'none',
        }}
      >
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};

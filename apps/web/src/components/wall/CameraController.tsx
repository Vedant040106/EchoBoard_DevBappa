import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';

interface CameraControllerProps {
  navTarget: {
    x: number;
    y: number;
    zoom: number;
    trigger: number;
  } | null;
  onZoomChange?: (zoomPercent: number) => void;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  navTarget,
  onZoomChange,
}) => {
  const { camera, gl } = useThree();

  // Internal smooth target references
  const targetPos = useRef(new THREE.Vector2(0, 0));
  const targetZoom = useRef<number>(camera.zoom || 38);

  // Gesture tracking
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const initialPinchDist = useRef<number | null>(null);
  const pinchStartZoom = useRef<number>(38);
  const lastTapTime = useRef<number>(0);

  // Bounds limits
  const MIN_ZOOM = 18;
  const MAX_ZOOM = 85;
  const BOUNDS_X = 35;
  const BOUNDS_Y = 25;

  // Sync external nav targets (e.g. Reset View, Latest Note)
  useEffect(() => {
    if (navTarget) {
      targetPos.current.set(navTarget.x, navTarget.y);
      targetZoom.current = THREE.MathUtils.clamp(navTarget.zoom, MIN_ZOOM, MAX_ZOOM);
    }
  }, [navTarget]);

  // Handle pointer down, move, up, wheel, touch
  useEffect(() => {
    const domElement = gl.domElement;

    // --- Pointer / Mouse Drag to Pan ---
    const handlePointerDown = (e: PointerEvent) => {
      // Don't intercept if secondary button or outside
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      isDragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      // Double-tap or double-click to zoom into target
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        // Double clicked! Zoom toward cursor
        targetZoom.current = THREE.MathUtils.clamp(targetZoom.current * 1.45, MIN_ZOOM, MAX_ZOOM);
      }
      lastTapTime.current = now;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;

      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      // Scale pan displacement inversely with current zoom
      const currentZoom = camera.zoom || 38;
      const panFactor = 1 / currentZoom;

      targetPos.current.x = THREE.MathUtils.clamp(
        targetPos.current.x - dx * panFactor,
        -BOUNDS_X,
        BOUNDS_X
      );
      targetPos.current.y = THREE.MathUtils.clamp(
        targetPos.current.y + dy * panFactor,
        -BOUNDS_Y,
        BOUNDS_Y
      );
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    // --- Mouse Wheel to Zoom ---
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.14 : 0.88;
      targetZoom.current = THREE.MathUtils.clamp(
        targetZoom.current * zoomFactor,
        MIN_ZOOM,
        MAX_ZOOM
      );
    };

    // --- Touch Pinch to Zoom ---
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isDragging.current = false;
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialPinchDist.current = dist;
        pinchStartZoom.current = targetZoom.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDist.current !== null) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = dist / initialPinchDist.current;
        targetZoom.current = THREE.MathUtils.clamp(
          pinchStartZoom.current * scale,
          MIN_ZOOM,
          MAX_ZOOM
        );
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        initialPinchDist.current = null;
      }
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    domElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('touchstart', handleTouchStart);
      domElement.removeEventListener('touchmove', handleTouchMove);
      domElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [camera, gl]);

  // Frame loop for smooth camera lerp & zoom update
  useFrame(() => {
    // Lerp position
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetPos.current.x, 0.16);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetPos.current.y, 0.16);

    // Lerp zoom
    const orthoCam = camera as THREE.OrthographicCamera;
    if (orthoCam.isOrthographicCamera) {
      orthoCam.zoom = THREE.MathUtils.lerp(orthoCam.zoom, targetZoom.current, 0.16);
      orthoCam.updateProjectionMatrix();

      // Notify parent of zoom readout percentage
      if (onZoomChange) {
        const percent = Math.round((orthoCam.zoom / 38) * 100);
        onZoomChange(percent);
      }
    }
  });

  return null;
};

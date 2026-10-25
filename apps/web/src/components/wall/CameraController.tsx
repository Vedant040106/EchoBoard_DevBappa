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
  isOpeningDolly?: boolean;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  navTarget,
  onZoomChange,
  isOpeningDolly = false,
}) => {
  const { camera, gl } = useThree();

  // Internal smooth target references
  const targetPos = useRef(new THREE.Vector2(0, isOpeningDolly ? 3.8 : 2));
  const targetZoom = useRef<number>(isOpeningDolly ? 24 : ((camera as THREE.OrthographicCamera).zoom || 38));

  // Velocity tracking for pan inertia and dynamic depth parallax
  const panVelocity = useRef(new THREE.Vector2(0, 0));
  const zoomVelocity = useRef<number>(0);
  const isFlightActive = useRef(false);
  const flightStartTime = useRef(0);

  // Gesture tracking
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastPointerTime = useRef<number>(0);
  const initialPinchDist = useRef<number | null>(null);
  const lastPinchDist = useRef<number | null>(null);
  const lastTapTime = useRef<number>(0);

  // Board boundaries
  const MIN_ZOOM = 18;
  const MAX_ZOOM = 85;
  const BOUNDS_X = 35;
  const BOUNDS_Y = 25;

  // Sync external nav targets (Reset View, Latest Note) with cinematic flight damping
  useEffect(() => {
    if (navTarget) {
      targetPos.current.set(navTarget.x, navTarget.y);
      targetZoom.current = THREE.MathUtils.clamp(navTarget.zoom, MIN_ZOOM, MAX_ZOOM);
      isFlightActive.current = true;
      flightStartTime.current = performance.now();
      panVelocity.current.set(0, 0);
    }
  }, [navTarget]);

  // Handle pointer down, move, up, wheel, touch
  useEffect(() => {
    const domElement = gl.domElement;

    // --- Pointer / Mouse Drag to Pan ---
    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      isDragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      lastPointerTime.current = performance.now();
      panVelocity.current.set(0, 0);
      isFlightActive.current = false;

      // Double-click / double-tap to zoom into cursor point
      const now = performance.now();
      if (now - lastTapTime.current < 280) {
        const rect = domElement.getBoundingClientRect();
        const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const currentZoom = targetZoom.current;
        const nextZoom = THREE.MathUtils.clamp(currentZoom * 1.45, MIN_ZOOM, MAX_ZOOM);

        const orthoCam = camera as THREE.OrthographicCamera;
        const halfFrustumW = (orthoCam.right - orthoCam.left) / 2;
        const halfFrustumH = (orthoCam.top - orthoCam.bottom) / 2;

        const diff = (1 / currentZoom) - (1 / nextZoom);
        targetPos.current.x = THREE.MathUtils.clamp(
          targetPos.current.x + ndcX * halfFrustumW * diff,
          -BOUNDS_X,
          BOUNDS_X
        );
        targetPos.current.y = THREE.MathUtils.clamp(
          targetPos.current.y + ndcY * halfFrustumH * diff,
          -BOUNDS_Y,
          BOUNDS_Y
        );

        targetZoom.current = nextZoom;
        zoomVelocity.current = (nextZoom - currentZoom) * 0.5;
      }
      lastTapTime.current = now;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;

      const now = performance.now();
      const dt = Math.max(1, now - lastPointerTime.current);
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      lastPointerTime.current = now;

      // Scale pan displacement inversely with current camera zoom
      const currentZoom = (camera as THREE.OrthographicCamera).zoom || 38;
      const panFactor = 1 / currentZoom;
      const deltaWorldX = -dx * panFactor;
      const deltaWorldY = dy * panFactor;

      targetPos.current.x = THREE.MathUtils.clamp(
        targetPos.current.x + deltaWorldX,
        -BOUNDS_X,
        BOUNDS_X
      );
      targetPos.current.y = THREE.MathUtils.clamp(
        targetPos.current.y + deltaWorldY,
        -BOUNDS_Y,
        BOUNDS_Y
      );

      // Track pan velocity for release inertia (moving average in world units per second)
      const instantVx = (deltaWorldX / (dt / 1000));
      const instantVy = (deltaWorldY / (dt / 1000));
      panVelocity.current.x = THREE.MathUtils.lerp(panVelocity.current.x, instantVx, 0.45);
      panVelocity.current.y = THREE.MathUtils.lerp(panVelocity.current.y, instantVy, 0.45);
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      // If movement ceased before mouseup, cancel inertia
      if (performance.now() - lastPointerTime.current > 70) {
        panVelocity.current.set(0, 0);
      }
    };

    // --- Normalized Mouse Wheel & Trackpad Cursor-Anchored Zoom ---
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      isFlightActive.current = false;

      // Normalized delta across high-frequency trackpads (deltaMode === 0) & notched mouse wheels (deltaMode === 1)
      const normalizedDelta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 60) * 0.0018;
      const currentZoom = targetZoom.current;
      const zoomMultiplier = Math.exp(-normalizedDelta * 2.5);
      const nextZoom = THREE.MathUtils.clamp(currentZoom * zoomMultiplier, MIN_ZOOM, MAX_ZOOM);

      if (Math.abs(nextZoom - currentZoom) > 0.001) {
        // Cursor-Anchored Zoom-to-Point (Figma / Apple Maps Behavior):
        const rect = domElement.getBoundingClientRect();
        const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const orthoCam = camera as THREE.OrthographicCamera;
        const halfFrustumW = (orthoCam.right - orthoCam.left) / 2;
        const halfFrustumH = (orthoCam.top - orthoCam.bottom) / 2;

        const diff = (1 / currentZoom) - (1 / nextZoom);
        targetPos.current.x = THREE.MathUtils.clamp(
          targetPos.current.x + ndcX * halfFrustumW * diff,
          -BOUNDS_X,
          BOUNDS_X
        );
        targetPos.current.y = THREE.MathUtils.clamp(
          targetPos.current.y + ndcY * halfFrustumH * diff,
          -BOUNDS_Y,
          BOUNDS_Y
        );

        targetZoom.current = nextZoom;
        // Capture zoom velocity for dynamic depth parallax pitch
        zoomVelocity.current = (nextZoom - currentZoom);
      }
    };

    // --- Touch Pinch-to-Zoom with Midpoint Anchoring ---
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isDragging.current = false;
        panVelocity.current.set(0, 0);
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialPinchDist.current = dist;
        lastPinchDist.current = dist;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastPinchDist.current !== null) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const ratio = dist / lastPinchDist.current;
        lastPinchDist.current = dist;

        const currentZoom = targetZoom.current;
        const nextZoom = THREE.MathUtils.clamp(currentZoom * ratio, MIN_ZOOM, MAX_ZOOM);

        if (Math.abs(nextZoom - currentZoom) > 0.001) {
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          const rect = domElement.getBoundingClientRect();
          const ndcX = ((midX - rect.left) / rect.width) * 2 - 1;
          const ndcY = -((midY - rect.top) / rect.height) * 2 + 1;

          const orthoCam = camera as THREE.OrthographicCamera;
          const halfFrustumW = (orthoCam.right - orthoCam.left) / 2;
          const halfFrustumH = (orthoCam.top - orthoCam.bottom) / 2;

          const diff = (1 / currentZoom) - (1 / nextZoom);
          targetPos.current.x = THREE.MathUtils.clamp(
            targetPos.current.x + ndcX * halfFrustumW * diff,
            -BOUNDS_X,
            BOUNDS_X
          );
          targetPos.current.y = THREE.MathUtils.clamp(
            targetPos.current.y + ndcY * halfFrustumH * diff,
            -BOUNDS_Y,
            BOUNDS_Y
          );

          targetZoom.current = nextZoom;
          zoomVelocity.current = (nextZoom - currentZoom) * 0.4;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        initialPinchDist.current = null;
        lastPinchDist.current = null;
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

  // Frame-Rate Independent Exponential Damping Loop
  useFrame((_state, delta) => {
    // Apply pan velocity inertia on release with friction decay
    if (!isDragging.current) {
      const friction = Math.pow(0.92, delta * 60);
      panVelocity.current.x *= friction;
      panVelocity.current.y *= friction;

      if (Math.abs(panVelocity.current.x) > 0.002 || Math.abs(panVelocity.current.y) > 0.002) {
        targetPos.current.x = THREE.MathUtils.clamp(
          targetPos.current.x + panVelocity.current.x * delta,
          -BOUNDS_X,
          BOUNDS_X
        );
        targetPos.current.y = THREE.MathUtils.clamp(
          targetPos.current.y + panVelocity.current.y * delta,
          -BOUNDS_Y,
          BOUNDS_Y
        );
      } else {
        panVelocity.current.set(0, 0);
      }
    }

    // Determine damping factor: lambda = 5.5 for smooth camera flights, 7.5 for direct interaction
    let lambda = 7.5;
    if (isFlightActive.current) {
      lambda = 5.5;
      if (performance.now() - flightStartTime.current > 1400) {
        isFlightActive.current = false;
      }
    }

    // Exponential frame-rate independent position damping
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetPos.current.x, lambda, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetPos.current.y, lambda, delta);

    // Exponential zoom damping
    const orthoCam = camera as THREE.OrthographicCamera;
    if (orthoCam.isOrthographicCamera) {
      orthoCam.zoom = THREE.MathUtils.damp(orthoCam.zoom, targetZoom.current, lambda, delta);
      orthoCam.updateProjectionMatrix();

      // Readout percentage for HUD
      if (onZoomChange) {
        const percent = Math.round((orthoCam.zoom / 38) * 100);
        onZoomChange(percent);
      }
    }

    // Dynamic depth parallax: subtle coupled camera pitch revealing 3D curled bottom edge & hole depth
    zoomVelocity.current = THREE.MathUtils.damp(zoomVelocity.current, 0, 7.0, delta);
    const targetPitch = THREE.MathUtils.clamp(zoomVelocity.current * 0.008, -0.05, 0.05);
    camera.rotation.x = THREE.MathUtils.damp(camera.rotation.x, targetPitch, 6.0, delta);
  });

  return null;
};

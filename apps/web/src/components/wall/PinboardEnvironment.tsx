import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { createAnnouncementTexture } from './noteTexture.js';

interface PinboardEnvironmentProps {
  showAnnouncement: boolean;
  onAnnouncementClick?: () => void;
}

/**
 * Procedural woven felt & fine cork bump texture generator.
 * Creates physical micro-texture depth under directional and point lights.
 */
function createFeltBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;

  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const idx = (y * 256 + x) * 4;
      // Woven fiber modulation:
      const weave = Math.sin(x * 0.8) * Math.cos(y * 0.8) * 18;
      // High-frequency cork noise:
      const noise = (Math.random() - 0.5) * 36;
      const val = Math.min(255, Math.max(0, 128 + weave + noise));

      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 9);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural spatial coordinate crosshairs texture.
 */
function createGridCrosshairsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 512, 512);

  // Subtle coordinate crosshair at center (256, 256)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;

  // Cross lines
  ctx.beginPath();
  ctx.moveTo(246, 256);
  ctx.lineTo(266, 256);
  ctx.moveTo(256, 246);
  ctx.lineTo(256, 266);
  ctx.stroke();

  // Subtle corner dots
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(0, 0, 2, 2);
  ctx.fillRect(510, 0, 2, 2);
  ctx.fillRect(0, 510, 2, 2);
  ctx.fillRect(510, 510, 2, 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 12);
  texture.needsUpdate = true;
  return texture;
}

export const PinboardEnvironment: React.FC<PinboardEnvironmentProps> = ({
  showAnnouncement,
  onAnnouncementClick,
}) => {
  const { camera, pointer } = useThree();
  const cursorLightRef = useRef<THREE.PointLight>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const bumpMap = useMemo(() => createFeltBumpTexture(), []);
  const gridTexture = useMemo(() => createGridCrosshairsTexture(), []);
  const announcementTexture = useMemo(() => createAnnouncementTexture(), []);

  // Subtle atmospheric floating dust particles
  const particleCount = 80;
  const { particlePositions, particleVelocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel: Array<{ vx: number; vy: number; vz: number }> = [];

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 44;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 32;
      pos[i * 3 + 2] = Math.random() * 4.5 + 0.5;

      vel.push({
        vx: (Math.random() - 0.5) * 0.006,
        vy: (Math.random() - 0.5) * 0.006,
        vz: (Math.random() - 0.5) * 0.003,
      });
    }

    return { particlePositions: pos, particleVelocities: vel };
  }, []);

  // Frame loop: update dynamic cursor light position and gentle particle drift
  useFrame(() => {
    // 1. Position interactive cursor 3D pointLight
    if (cursorLightRef.current) {
      // Map normalized pointer coordinates (-1 to +1) to approximate 3D world space
      const orthoCam = camera as THREE.OrthographicCamera;
      const zoom = orthoCam.zoom || 38;
      const viewportHalfWidth = (window.innerWidth / (2 * zoom));
      const viewportHalfHeight = (window.innerHeight / (2 * zoom));

      const worldCursorX = camera.position.x + pointer.x * viewportHalfWidth;
      const worldCursorY = camera.position.y + pointer.y * viewportHalfHeight;

      cursorLightRef.current.position.x = THREE.MathUtils.lerp(
        cursorLightRef.current.position.x,
        worldCursorX,
        0.25
      );
      cursorLightRef.current.position.y = THREE.MathUtils.lerp(
        cursorLightRef.current.position.y,
        worldCursorY,
        0.25
      );
      cursorLightRef.current.position.z = 2.4;
    }

    // 2. Drift particles
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const v = particleVelocities[i];
        array[i * 3] += v.vx;
        array[i * 3 + 1] += v.vy;
        array[i * 3 + 2] += v.vz;

        if (array[i * 3] > 24) array[i * 3] = -24;
        if (array[i * 3] < -24) array[i * 3] = 24;
        if (array[i * 3 + 1] > 18) array[i * 3 + 1] = -18;
        if (array[i * 3 + 1] < -18) array[i * 3 + 1] = 18;
        if (array[i * 3 + 2] > 5) array[i * 3 + 2] = 0.5;
        if (array[i * 3 + 2] < 0.5) array[i * 3 + 2] = 5;
      }

      posAttr.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Dynamic Cursor Light: Illuminates nearby paper curl and pushpins as visitor moves pointer */}
      <pointLight
        ref={cursorLightRef}
        intensity={0.65}
        distance={12}
        decay={2}
        color="#fed7aa"
      />

      {/* 1. Main Tactile Midnight Blue-Violet Pinboard Plane with Woven Felt Bump */}
      <mesh position={[0, 0, -0.06]} receiveShadow>
        <planeGeometry args={[90, 68]} />
        <meshStandardMaterial
          color="#161a33"
          bumpMap={bumpMap}
          bumpScale={0.045}
          roughness={0.92}
          metalness={0.04}
        />
      </mesh>

      {/* 2. Coordinate Crosshairs Overlay Plane */}
      <mesh position={[0, 0, -0.055]}>
        <planeGeometry args={[90, 68]} />
        <meshBasicMaterial
          map={gridTexture}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* 3. Deep Beveled Pinboard Frame Border */}
      <mesh position={[0, 0, -0.07]}>
        <planeGeometry args={[93, 71]} />
        <meshStandardMaterial
          color="#23284c"
          roughness={0.88}
          metalness={0.08}
        />
      </mesh>

      {/* 4. Deep Void Back-Plane (Prevents any edge gaps) */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[260, 200]} />
        <meshBasicMaterial color="#090a10" />
      </mesh>

      {/* 5. Center Announcement Note (when wall is currently empty) */}
      {showAnnouncement && (
        <group position={[0, 0, 0.04]} rotation={[0, 0, -0.02]}>
          {/* Paper shadow */}
          <mesh position={[0.08, -0.08, -0.01]}>
            <planeGeometry args={[4.5, 4.5]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.35} />
          </mesh>

          <mesh
            castShadow
            receiveShadow
            onClick={(e) => {
              e.stopPropagation();
              onAnnouncementClick?.();
            }}
            onPointerOver={() => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default';
            }}
          >
            <planeGeometry args={[4.4, 4.4]} />
            <meshStandardMaterial
              map={announcementTexture}
              roughness={0.82}
              metalness={0.04}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Sculpted Pushpin on announcement note */}
          <group position={[0, 2.02, 0.06]}>
            <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.035, 0.035, 0.25, 16]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
            </mesh>
            <mesh position={[0, 0, 0.2]} castShadow>
              <sphereGeometry args={[0.18, 24, 24]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.92} roughness={0.18} />
            </mesh>
          </group>
        </group>
      )}

      {/* 6. Ambient warm dust motes */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color="#fde68a"
          transparent
          opacity={0.22}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
};

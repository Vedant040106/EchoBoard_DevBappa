import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { createAnnouncementTexture } from './noteTexture.js';

interface PinboardEnvironmentProps {
  showAnnouncement: boolean;
  onAnnouncementClick?: () => void;
}

export const PinboardEnvironment: React.FC<PinboardEnvironmentProps> = ({
  showAnnouncement,
  onAnnouncementClick,
}) => {
  const particlesRef = useRef<THREE.Points>(null);

  // Announcement note texture
  const announcementTexture = useMemo(() => createAnnouncementTexture(), []);

  // Generate subtle atmospheric floating particles (dust motes in warm expo lighting)
  const particleCount = 90;
  const { particlePositions, particleVelocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel: Array<{ vx: number; vy: number; vz: number }> = [];

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = Math.random() * 4.5 + 0.5;

      vel.push({
        vx: (Math.random() - 0.5) * 0.008,
        vy: (Math.random() - 0.5) * 0.008,
        vz: (Math.random() - 0.5) * 0.004,
      });
    }

    return { particlePositions: pos, particleVelocities: vel };
  }, []);

  // Frame loop for gentle particle drift
  useFrame(() => {
    if (!particlesRef.current) return;
    const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const v = particleVelocities[i];
      array[i * 3] += v.vx;
      array[i * 3 + 1] += v.vy;
      array[i * 3 + 2] += v.vz;

      // Wrap around bounds
      if (array[i * 3] > 22) array[i * 3] = -22;
      if (array[i * 3] < -22) array[i * 3] = 22;
      if (array[i * 3 + 1] > 18) array[i * 3 + 1] = -18;
      if (array[i * 3 + 1] < -18) array[i * 3 + 1] = 18;
      if (array[i * 3 + 2] > 5) array[i * 3 + 2] = 0.5;
      if (array[i * 3 + 2] < 0.5) array[i * 3 + 2] = 5;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <group>
      {/* 1. Main Blue-Violet Pinboard Plane */}
      <mesh position={[0, 0, -0.06]} receiveShadow>
        <planeGeometry args={[75, 55]} />
        <meshStandardMaterial
          color="#191735"
          roughness={0.92}
          metalness={0.05}
        />
      </mesh>

      {/* 2. Deep beveled pinboard frame */}
      <mesh position={[0, 0, -0.07]}>
        <planeGeometry args={[78, 58]} />
        <meshStandardMaterial color="#282452" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* 3. Deep space outer back-plane (prevents any edge bleed) */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[200, 160]} />
        <meshBasicMaterial color="#090a10" />
      </mesh>

      {/* 4. Center Announcement Master Parchment Note (when wall has 0 notes) */}
      {showAnnouncement && (
        <group position={[0, 0, 0.04]} rotation={[0, 0, -0.02]}>
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
            <boxGeometry args={[4.4, 4.4, 0.05]} />
            <meshStandardMaterial
              map={announcementTexture}
              roughness={0.82}
              metalness={0.04}
            />
          </mesh>

          {/* Brass Pushpin on master announcement note */}
          <group position={[0, 2.05, 0.08]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.25, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.2]} castShadow>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        </group>
      )}

      {/* 5. Subtle ambient floating dust motes */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color="#fbbf24"
          transparent
          opacity={0.25}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
};

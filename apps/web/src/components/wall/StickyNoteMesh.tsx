import React, { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { PublicFeedbackNote } from '@devbappa/shared';
import { createNoteTexture } from './noteTexture.js';

interface StickyNoteMeshProps {
  note: PublicFeedbackNote;
  isNew: boolean;
  onSelect: (note: PublicFeedbackNote) => void;
}

/**
 * Builds a subdivided 24x24 plane deformed with physical paper curvature.
 * Top adhesive strip (v > 0.82) stays flush against pinboard (z = 0).
 * Lower body curls smoothly outwards (+Z) with an asymmetric corner peel.
 */
function createCurledGeometry(width = 3.2, height = 3.2, curlHeight = 0.36): THREE.BufferGeometry {
  const geom = new THREE.PlaneGeometry(width, height, 24, 24);
  const pos = geom.attributes.position;
  const uv = geom.attributes.uv;

  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i); // In Three.js PlaneGeometry, v goes from 1 (top) to 0 (bottom)

    if (v <= 0.82) {
      // Parabolic curvature factor from adhesive fold to bottom edge
      const t = (0.82 - v) / 0.82;
      // Asymmetric lower-right corner peel factor (natural paper memory lift)
      const cornerPeel = 1.0 + (u - 0.45) * 0.4;
      const zLift = Math.pow(t, 2.1) * curlHeight * cornerPeel;
      pos.setZ(i, zLift);
    } else {
      pos.setZ(i, 0);
    }
  }

  geom.computeVertexNormals();
  return geom;
}

export const StickyNoteMesh: React.FC<StickyNoteMeshProps> = ({ note, isNew, onSelect }) => {
  const meshGroupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const hoverTilt = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Spatial coordinates: worldX and worldY scaled into Three.js units (1/75)
  const targetX = useMemo(() => (note.layout.worldX || 0) / 75, [note.layout.worldX]);
  const targetY = useMemo(() => -(note.layout.worldY || 0) / 75, [note.layout.worldY]);
  const baseRotationZ = useMemo(
    () => ((note.layout.rotation || 0) * Math.PI) / 180,
    [note.layout.rotation]
  );

  // Live pin-drop entrance animation (drops from Z = +4.5 and spring-settles)
  const [animProgress, setAnimProgress] = useState(isNew ? 0 : 1);
  const [impactRingScale, setImpactRingScale] = useState(0);

  useEffect(() => {
    if (isNew) {
      setAnimProgress(0);
      setImpactRingScale(0);
    }
  }, [isNew]);

  // Sharp procedural high-DPI canvas texture
  const texture = useMemo(() => createNoteTexture(note), [note]);

  // Curled 3D paper geometry
  const curledPaperGeometry = useMemo(() => createCurledGeometry(3.2, 3.2, 0.38), []);

  // Sculpted pushpin materials
  const pinDomeMaterial = useMemo(() => {
    const variant = note.pinVariant || 'brass';
    switch (variant) {
      case 'brass':
        return new THREE.MeshStandardMaterial({
          color: '#fbbf24',
          metalness: 0.92,
          roughness: 0.18,
        });
      case 'silver':
        return new THREE.MeshStandardMaterial({
          color: '#f1f5f9',
          metalness: 0.96,
          roughness: 0.12,
        });
      case 'copper':
        return new THREE.MeshStandardMaterial({
          color: '#ea580c',
          metalness: 0.88,
          roughness: 0.22,
        });
      default:
        return new THREE.MeshStandardMaterial({
          color: '#fbbf24',
          metalness: 0.9,
          roughness: 0.2,
        });
    }
  }, [note.pinVariant]);

  // Frame loop: smooth hover interpolation, tilt physics, and pin-drop physics
  useFrame((_, delta) => {
    if (!meshGroupRef.current) return;

    if (animProgress < 1) {
      // Spring settling physics
      const nextProgress = Math.min(1, animProgress + delta * 2.2);
      setAnimProgress(nextProgress);
      if (nextProgress > 0.85) {
        setImpactRingScale((prev) => Math.min(1.8, prev + delta * 3.5));
      }
    }

    // Live pin-drop Z offset: drops from +4.5 down to 0
    const dropZ = (1 - animProgress) * 4.5;
    const hoverZ = hovered ? 0.35 : 0;
    const targetZ = dropZ + hoverZ;

    // Smooth Z position lerp
    meshGroupRef.current.position.z = THREE.MathUtils.lerp(
      meshGroupRef.current.position.z,
      targetZ,
      0.18
    );

    // Subtle 3D tilt on hover towards pointer
    const targetRotX = hovered ? hoverTilt.current.y * 0.15 : 0;
    const targetRotY = hovered ? hoverTilt.current.x * 0.15 : 0;

    meshGroupRef.current.rotation.x = THREE.MathUtils.lerp(
      meshGroupRef.current.rotation.x,
      targetRotX,
      0.15
    );
    meshGroupRef.current.rotation.y = THREE.MathUtils.lerp(
      meshGroupRef.current.rotation.y,
      targetRotY,
      0.15
    );

    // Subtle hover scale bounce
    const hoverScale = hovered ? 1.035 : 1.0;
    meshGroupRef.current.scale.lerp(
      new THREE.Vector3(hoverScale, hoverScale, hoverScale),
      0.18
    );
  });

  return (
    <group
      ref={meshGroupRef}
      position={[targetX, targetY, 0]}
      rotation={[0, 0, baseRotationZ]}
    >
      {/* 1. Impact shockwave ring for live socket arrival */}
      {isNew && animProgress > 0.7 && impactRingScale < 1.7 && (
        <mesh position={[0, 0, -0.015]}>
          <ringGeometry args={[1.5 * impactRingScale, (1.5 * impactRingScale) + 0.18, 32]} />
          <meshBasicMaterial
            color="#f97316"
            transparent
            opacity={Math.max(0, 0.7 - (impactRingScale * 0.35))}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 2. Dual-Stage 3D Shadows */}
      {/* Tight contact shadow under pinned top edge */}
      <mesh position={[0, 1.35, -0.01]}>
        <planeGeometry args={[3.2, 0.5]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>

      {/* Skewed soft drop shadow under curled bottom edge */}
      <mesh position={[0.12, -0.85, -0.02]} rotation={[0, 0, -0.02]}>
        <planeGeometry args={[3.3, 2.2]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>

      {/* 3. True 3D Curled Sticky Note Paper Mesh */}
      <mesh
        geometry={curledPaperGeometry}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (e.point) {
            hoverTilt.current = {
              x: Math.max(-1, Math.min(1, (e.point.x - targetX) / 1.6)),
              y: Math.max(-1, Math.min(1, (e.point.y - targetY) / 1.6)),
            };
          }
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'default';
          hoverTilt.current = { x: 0, y: 0 };
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          pointerDownPos.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          if (pointerDownPos.current) {
            const travel = Math.hypot(
              e.clientX - pointerDownPos.current.x,
              e.clientY - pointerDownPos.current.y
            );
            // Strict travel threshold < 6px: prevents tap selection when dragging to pan
            if (travel < 6) {
              onSelect(note);
            }
          }
          pointerDownPos.current = null;
        }}
      >
        <meshStandardMaterial
          map={texture}
          roughness={0.82}
          metalness={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4. 3D Sculpted Pushpin Mesh (Top-Center) */}
      <group position={[0, 1.44, 0.04]}>
        {/* Contact shadow on paper under pin head */}
        <mesh position={[0.04, -0.04, 0.01]}>
          <circleGeometry args={[0.16, 20]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.38} />
        </mesh>

        {/* Metallic pin stem neck */}
        <mesh
          position={[0, 0, 0.08]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.028, 0.028, 0.22, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.96} roughness={0.15} />
        </mesh>

        {/* Sculpted specular dome head */}
        <mesh
          position={[0, 0, 0.18]}
          material={pinDomeMaterial}
          castShadow
        >
          <sphereGeometry args={[0.15, 24, 24]} />
        </mesh>
      </group>
    </group>
  );
};

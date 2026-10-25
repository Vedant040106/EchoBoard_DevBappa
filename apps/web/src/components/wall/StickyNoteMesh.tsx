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
 * Deterministic hash of string ID into positive integer.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Builds a subdivided 28x28 square plane deformed with physical paper curvature.
 * - Top adhesive strip (uv.y > 0.82) stays flush against pegboard (z = 0.01).
 * - Parabolic lower body lift (uv.y <= 0.82): z = Math.pow(1 - uv.y, 1.95) * liftAmount (0.22 - 0.38).
 * - Asymmetric corner curl: upward curl on bottom-right or bottom-left corner + S-curve across X.
 * - Vertex normals recomputed for studio lighting reflections.
 */
function createCurledStickyGeometry(
  noteId: string,
  width = 3.2,
  height = 3.2
): THREE.BufferGeometry {
  const geom = new THREE.PlaneGeometry(width, height, 28, 28);
  const pos = geom.attributes.position;
  const uv = geom.attributes.uv;

  const hashVal = hashString(noteId || 'default');
  // liftAmount varies deterministically between 0.22 and 0.38
  const liftAmount = 0.22 + ((hashVal % 100) / 100) * (0.38 - 0.22);
  // Deterministic choice of which corner curls more (bottom-right vs bottom-left)
  const curlRightCorner = (hashVal % 2) === 0;

  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i); // 0 (left) to 1 (right)
    const v = uv.getY(i); // 1 (top) to 0 (bottom)

    if (v <= 0.82) {
      // Normalized distance from adhesive line (0 at v=0.82 down to 1 at bottom edge v=0)
      const t = (0.82 - v) / 0.82;
      // Parabolic lower-body outward curvature
      const parabolicLift = Math.pow(t, 1.95) * liftAmount;

      // Asymmetric corner curl
      const cornerX = curlRightCorner ? u : 1.0 - u;
      const cornerCurl = Math.pow(t, 2.4) * Math.pow(cornerX, 1.8) * 0.25;

      // Subtle concave/convex S-curve across the paper width
      const sCurve = Math.sin((u - 0.5) * Math.PI) * 0.035 * t;

      pos.setZ(i, 0.01 + parabolicLift + cornerCurl + sCurve);
    } else {
      // Adhesive strip sits flush against the pegboard surface
      pos.setZ(i, 0.01);
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

  // Stagger overlapping notes along Z-axis by layer_order * 0.035
  const layerZ = useMemo(
    () => (note.layout.layerOrder || 0) * 0.035,
    [note.layout.layerOrder]
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

  // Sharp procedural 1024x1024 high-DPI canvas texture
  const texture = useMemo(() => createNoteTexture(note), [note]);

  // Subdivided 28x28 curled 3D paper geometry
  const curledPaperGeometry = useMemo(
    () => createCurledStickyGeometry(note.id, 3.2, 3.2),
    [note.id]
  );

  // Frame loop: smooth hover interpolation, tilt physics, and entrance physics
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

    // Live socket drop Z offset: drops from +4.5 down to 0
    const dropZ = (1 - animProgress) * 4.5;
    const hoverZ = hovered ? 0.35 : 0;
    const baseElevation = 0.04;
    const targetZ = baseElevation + layerZ + dropZ + hoverZ;

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

  const baseElevation = 0.04;

  return (
    <group
      ref={meshGroupRef}
      position={[targetX, targetY, baseElevation + layerZ]}
      rotation={[0, 0, baseRotationZ]}
    >
      {/* 1. Impact shockwave ring for live socket arrival */}
      {isNew && animProgress > 0.7 && impactRingScale < 1.7 && (
        <mesh position={[0, 0, -0.015]}>
          <ringGeometry args={[1.5 * impactRingScale, 1.5 * impactRingScale + 0.18, 32]} />
          <meshBasicMaterial
            color="#f08035"
            transparent
            opacity={Math.max(0, 0.7 - impactRingScale * 0.35)}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 2. Top adhesive strip contact shadow onto surface */}
      <mesh position={[0, 1.35, -0.005]}>
        <planeGeometry args={[3.2, 0.3]} />
        <meshBasicMaterial color="#1a1838" transparent opacity={0.3} />
      </mesh>

      {/* 3. True 3D Curled Square Post-it Note Paper Mesh */}
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
          roughness={0.78}
          metalness={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

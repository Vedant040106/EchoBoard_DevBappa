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

export const StickyNoteMesh: React.FC<StickyNoteMeshProps> = ({ note, isNew, onSelect }) => {
  const meshGroupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  // Position coordinates in Three.js world space
  // Base database layout is in pixels (-1400 to +1400 roughly). We scale by 1/75 for Three.js units.
  const targetX = useMemo(() => (note.layout.worldX || 0) / 75, [note.layout.worldX]);
  const targetY = useMemo(() => -(note.layout.worldY || 0) / 75, [note.layout.worldY]); // Inverted Y for 3D coordinates
  const targetRotationZ = useMemo(() => ((note.layout.rotation || 0) * Math.PI) / 180, [note.layout.rotation]);

  // Entrance animation state for newly received live notes
  const [animProgress, setAnimProgress] = useState(isNew ? 0 : 1);

  useEffect(() => {
    if (isNew) {
      setAnimProgress(0);
    }
  }, [isNew]);

  // Create or retrieve canvas texture
  const texture = useMemo(() => createNoteTexture(note), [note]);

  // Pushpin material based on pinVariant ('copper' | 'brass' | 'silver')
  const pinMaterial = useMemo(() => {
    const variant = note.pinVariant || 'brass';
    switch (variant) {
      case 'brass':
        return new THREE.MeshStandardMaterial({
          color: '#fbbf24',
          metalness: 0.9,
          roughness: 0.22,
        });
      case 'silver':
        return new THREE.MeshStandardMaterial({
          color: '#e2e8f0',
          metalness: 0.95,
          roughness: 0.15,
        });
      case 'copper':
        return new THREE.MeshStandardMaterial({
          color: '#b45309',
          metalness: 0.85,
          roughness: 0.28,
        });
      default:
        return new THREE.MeshStandardMaterial({
          color: '#fbbf24',
          metalness: 0.85,
          roughness: 0.25,
        });
    }
  }, [note.pinVariant]);

  // Reusable geometry for note paper (3.2 x 3.2 x 0.04)
  const paperGeometry = useMemo(() => new THREE.BoxGeometry(3.2, 3.2, 0.04), []);
  const pinStemGeometry = useMemo(() => new THREE.CylinderGeometry(0.025, 0.025, 0.22, 12), []);
  const pinHeadGeometry = useMemo(() => new THREE.SphereGeometry(0.14, 16, 16), []);

  // Frame loop for smooth hover lift and entrance animation
  useFrame((_, delta) => {
    if (!meshGroupRef.current) return;

    if (animProgress < 1) {
      const nextProgress = Math.min(1, animProgress + delta * 2.8);
      setAnimProgress(nextProgress);
    }

    // Base position with entrance drop
    const dropOffset = (1 - animProgress) * 3.5;
    const hoverZ = hovered ? 0.35 : 0;
    const targetZ = hoverZ + dropOffset;

    // Smooth lerp to target Z
    meshGroupRef.current.position.z = THREE.MathUtils.lerp(
      meshGroupRef.current.position.z,
      targetZ,
      0.18
    );

    // Subtle scale bounce on hover or new entrance
    const hoverScale = hovered ? 1.04 : 1.0;
    const entranceScale = THREE.MathUtils.lerp(0.5, 1.0, Math.sin(animProgress * Math.PI * 0.5));
    const targetScale = hoverScale * entranceScale;

    meshGroupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.18);
  });

  return (
    <group
      ref={meshGroupRef}
      position={[targetX, targetY, 0]}
      rotation={[0, 0, targetRotationZ]}
    >
      {/* Glow highlight frame for live newly pinned note */}
      {isNew && (
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[3.6, 3.6]} />
          <meshBasicMaterial
            color="#f97316"
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Sticky Note Paper Mesh */}
      <mesh
        geometry={paperGeometry}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          pointerDownPos.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          if (pointerDownPos.current) {
            const dist = Math.hypot(
              e.clientX - pointerDownPos.current.x,
              e.clientY - pointerDownPos.current.y
            );
            // Threshold check: only treat as a click if pointer didn't drag to pan
            if (dist < 10) {
              onSelect(note);
            }
          }
          pointerDownPos.current = null;
        }}
      >
        <meshStandardMaterial
          map={texture}
          roughness={0.78}
          metalness={0.04}
        />
      </mesh>

      {/* 3D Pushpin on top edge of note */}
      <group position={[0, 1.48, 0.08]}>
        {/* Pin stem */}
        <mesh
          geometry={pinStemGeometry}
          position={[0, 0, 0.08]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Pin head */}
        <mesh
          geometry={pinHeadGeometry}
          material={pinMaterial}
          position={[0, 0, 0.18]}
          castShadow
        />
      </group>
    </group>
  );
};

import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { createAnnouncementTexture } from './noteTexture.js';

interface PinboardEnvironmentProps {
  showAnnouncement: boolean;
  onAnnouncementClick?: () => void;
}

/**
 * Mid-Century Wall Clock with live moving hands.
 */
const MidCenturyWallClock: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const secondHandRef = useRef<THREE.Group>(null);
  const minuteHandRef = useRef<THREE.Group>(null);
  const hourHandRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const now = new Date();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;

    if (secondHandRef.current) {
      secondHandRef.current.rotation.z = -((seconds / 60) * Math.PI * 2);
    }
    if (minuteHandRef.current) {
      minuteHandRef.current.rotation.z = -((minutes / 60) * Math.PI * 2);
    }
    if (hourHandRef.current) {
      hourHandRef.current.rotation.z = -((hours / 12) * Math.PI * 2);
    }
  });

  // 12 hour tick marks
  const hourTicks = useMemo(() => {
    const ticks: Array<{ angle: number; isMajor: boolean }> = [];
    for (let i = 0; i < 12; i++) {
      ticks.push({ angle: (i / 12) * Math.PI * 2, isMajor: i % 3 === 0 });
    }
    return ticks;
  }, []);

  return (
    <group position={position}>
      {/* Clock Outer Terracotta-Orange Case */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.4, 3.4, 0.55, 36]} />
        <meshStandardMaterial color="#e05a2b" roughness={0.48} metalness={0.06} />
      </mesh>

      {/* Recessed Inner Dial Face */}
      <mesh position={[0, 0, 0.26]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[2.95, 2.95, 0.08, 36]} />
        <meshStandardMaterial color="#fdfbf7" roughness={0.72} metalness={0.02} />
      </mesh>

      {/* Hour Tick Markers */}
      {hourTicks.map((tick, i) => (
        <group key={i} rotation={[0, 0, -tick.angle]} position={[0, 0, 0.31]}>
          <mesh position={[0, 2.35, 0]}>
            <boxGeometry args={[tick.isMajor ? 0.22 : 0.12, tick.isMajor ? 0.6 : 0.38, 0.04]} />
            <meshStandardMaterial color={tick.isMajor ? '#1a162b' : '#786d8a'} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Hour Hand */}
      <group ref={hourHandRef} position={[0, 0, 0.33]}>
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[0.18, 1.5, 0.04]} />
          <meshStandardMaterial color="#1a162b" roughness={0.3} />
        </mesh>
      </group>

      {/* Minute Hand */}
      <group ref={minuteHandRef} position={[0, 0, 0.35]}>
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[0.12, 2.1, 0.04]} />
          <meshStandardMaterial color="#1a162b" roughness={0.3} />
        </mesh>
      </group>

      {/* Red-Orange Second Hand */}
      <group ref={secondHandRef} position={[0, 0, 0.37]}>
        <mesh position={[0, 1.15, 0]}>
          <boxGeometry args={[0.06, 2.4, 0.02]} />
          <meshStandardMaterial color="#f03a24" roughness={0.2} />
        </mesh>
      </group>

      {/* Center Pin Cap */}
      <mesh position={[0, 0, 0.39]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#1a162b" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

/**
 * Top-Left Studio Shelf with Articulated Architect Lamp & Coral Sphere.
 */
const TopLeftStudioShelf: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Matte Violet Floating Shelf */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[14, 0.6, 3.4]} />
        <meshStandardMaterial color="#6e54e8" roughness={0.55} metalness={0.05} />
      </mesh>

      {/* Two Cylindrical Wall Brackets */}
      <mesh position={[-4.5, -1.1, -0.2]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 1.8, 16]} />
        <meshStandardMaterial color="#4e38b3" roughness={0.6} />
      </mesh>
      <mesh position={[4.5, -1.1, -0.2]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 1.8, 16]} />
        <meshStandardMaterial color="#4e38b3" roughness={0.6} />
      </mesh>

      {/* Speckled Coral-Pink Sphere */}
      <mesh position={[-4.2, 1.6, 0.3]} castShadow receiveShadow>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial color="#ff626e" roughness={0.45} metalness={0.04} />
      </mesh>

      {/* Glossy Red-Orange Articulated Desk Lamp */}
      <group position={[2.5, 0.3, 0.2]}>
        {/* Heavy Circular Base */}
        <mesh position={[0, 0.15, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.3, 1.4, 0.3, 24]} />
          <meshStandardMaterial color="#f03a24" roughness={0.22} metalness={0.12} />
        </mesh>

        {/* Lower Arm Pivot Ball */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshStandardMaterial color="#d42c18" roughness={0.3} metalness={0.2} />
        </mesh>

        {/* Lower Articulated Arm (angled towards right/center) */}
        <group position={[0, 0.45, 0]} rotation={[0, 0, -0.45]}>
          <mesh position={[0, 1.9, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 3.8, 16]} />
            <meshStandardMaterial color="#f03a24" roughness={0.22} metalness={0.12} />
          </mesh>

          {/* Elbow Joint Ball */}
          <mesh position={[0, 3.8, 0]} castShadow>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#d42c18" roughness={0.3} metalness={0.2} />
          </mesh>

          {/* Upper Arm (angled down towards pegboard) */}
          <group position={[0, 3.8, 0]} rotation={[0, 0, 1.05]}>
            <mesh position={[0, 1.6, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.09, 3.2, 16]} />
              <meshStandardMaterial color="#f03a24" roughness={0.22} metalness={0.12} />
            </mesh>

            {/* Lamp Shade Socket */}
            <mesh position={[0, 3.2, 0]} castShadow>
              <sphereGeometry args={[0.26, 16, 16]} />
              <meshStandardMaterial color="#d42c18" roughness={0.3} metalness={0.2} />
            </mesh>

            {/* Angled Lampshade pointing down at pegboard */}
            <group position={[0, 3.2, 0]} rotation={[0, 0, 0.5]}>
              <mesh position={[0, 1.1, 0]} castShadow>
                <coneGeometry args={[1.35, 2.0, 24, 1, true]} />
                <meshStandardMaterial
                  color="#f03a24"
                  roughness={0.22}
                  metalness={0.12}
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* Glowing Warm Emissive Bulb */}
              <mesh position={[0, 0.65, 0]}>
                <sphereGeometry args={[0.42, 16, 16]} />
                <meshStandardMaterial
                  color="#fff5d6"
                  emissive="#fff5d6"
                  emissiveIntensity={3.2}
                  roughness={0.1}
                />
              </mesh>

              {/* Warm Spot illumination from lamp bulb */}
              <pointLight
                position={[0, 0.8, 0]}
                intensity={1.8}
                distance={18}
                color="#fff5d6"
                decay={2}
              />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

/**
 * Top-Right Mini Shelf & Planter with Stylized Foliage.
 */
const TopRightStudioShelf: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Compact Violet Wall Ledge */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[11, 0.6, 3.2]} />
        <meshStandardMaterial color="#6e54e8" roughness={0.55} metalness={0.05} />
      </mesh>

      {/* Wall Brackets */}
      <mesh position={[-3.5, -1.0, -0.2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 1.6, 16]} />
        <meshStandardMaterial color="#4e38b3" roughness={0.6} />
      </mesh>
      <mesh position={[3.5, -1.0, -0.2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 1.6, 16]} />
        <meshStandardMaterial color="#4e38b3" roughness={0.6} />
      </mesh>

      {/* Matte White Cylindrical Planter Pot */}
      <group position={[1.5, 0.3, 0.2]}>
        <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.35, 1.05, 2.0, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.02} />
        </mesh>

        {/* Soil Layer */}
        <mesh position={[0, 1.95, 0]}>
          <cylinderGeometry args={[1.25, 1.25, 0.15, 24]} />
          <meshStandardMaterial color="#382923" roughness={0.9} />
        </mesh>

        {/* Stylized Foliage Leaves */}
        <mesh position={[0, 2.5, 0.1]} rotation={[0.2, 0, 0.15]} castShadow>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshStandardMaterial color="#22c55e" roughness={0.6} />
        </mesh>
        <mesh position={[-0.6, 2.3, -0.2]} rotation={[-0.3, 0.4, -0.2]} castShadow>
          <sphereGeometry args={[0.75, 16, 16]} />
          <meshStandardMaterial color="#16a34a" roughness={0.6} />
        </mesh>
        <mesh position={[0.7, 2.4, 0.3]} rotation={[0.4, -0.3, 0.3]} castShadow>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color="#34d399" roughness={0.6} />
        </mesh>
      </group>

      {/* Stacked Decorative Studio Books */}
      <group position={[-2.8, 0.3, 0.2]}>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.5, 2.1]} />
          <meshStandardMaterial color="#ffd166" roughness={0.5} />
        </mesh>
        <mesh position={[0.1, 0.7, 0]} rotation={[0, 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.45, 1.9]} />
          <meshStandardMaterial color="#ff5d68" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
};

export const PinboardEnvironment: React.FC<PinboardEnvironmentProps> = ({
  showAnnouncement,
  onAnnouncementClick,
}) => {
  const { camera, pointer } = useThree();
  const cursorLightRef = useRef<THREE.PointLight>(null);
  const pegHolesMeshRef = useRef<THREE.InstancedMesh>(null);

  const announcementTexture = useMemo(() => createAnnouncementTexture(), []);

  // Recessed Pegboard Holes Grid Layout Setup
  // Pegboard dimensions: 64 wide x 44 high. Step = 2.4.
  // Generates crisp regular grid of dark-indigo recessed cylindrical holes.
  const pegHolesCount = useMemo(() => {
    let count = 0;
    for (let x = -29; x <= 29; x += 2.4) {
      for (let y = -19; y <= 19; y += 2.4) {
        count++;
      }
    }
    return count;
  }, []);

  useEffect(() => {
    if (!pegHolesMeshRef.current) return;
    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let x = -29; x <= 29; x += 2.4) {
      for (let y = -19; y <= 19; y += 2.4) {
        // Position cylindrical holes slightly sunken into the periwinkle pegboard
        dummy.position.set(x, y, 0.17);
        dummy.rotation.set(Math.PI / 2, 0, 0);
        dummy.updateMatrix();
        pegHolesMeshRef.current.setMatrixAt(idx, dummy.matrix);
        idx++;
      }
    }
    pegHolesMeshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  // Frame loop: update dynamic cursor light position
  useFrame(() => {
    if (cursorLightRef.current) {
      const orthoCam = camera as THREE.OrthographicCamera;
      const zoom = orthoCam.zoom || 38;
      const viewportHalfWidth = window.innerWidth / (2 * zoom);
      const viewportHalfHeight = window.innerHeight / (2 * zoom);

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
  });

  return (
    <group>
      {/* Dynamic Cursor Light: Gently illuminates paper curls as visitor moves pointer */}
      <pointLight
        ref={cursorLightRef}
        intensity={0.8}
        distance={12}
        decay={2}
        color="#fff0d4"
      />

      {/* ============================================================== */}
      {/* 1. STUDIO WALL BACKGROUND (Rich Saturated Cobalt/Ultramarine)  */}
      {/* ============================================================== */}
      <mesh position={[0, 4, -0.6]} receiveShadow>
        <planeGeometry args={[190, 130]} />
        <meshStandardMaterial
          color="#253ce6"
          roughness={0.85}
          metalness={0.04}
        />
      </mesh>

      {/* Clean White Architectural Baseboard Trim along bottom edge */}
      <group position={[0, -29, -0.05]}>
        {/* Main Baseboard Board */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[190, 3.2, 0.65]} />
          <meshStandardMaterial color="#ffffff" roughness={0.32} metalness={0.02} />
        </mesh>
        {/* Upper Molded Trim Lip */}
        <mesh position={[0, 1.7, 0.1]} castShadow receiveShadow>
          <boxGeometry args={[190, 0.45, 0.85]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.02} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 2. RAISED 3D PERIWINKLE PEGBOARD                              */}
      {/* ============================================================== */}
      {/* Deep Soft Indigo Drop Shadow cast onto Cobalt Wall behind */}
      <mesh position={[1.4, -1.4, -0.45]}>
        <planeGeometry args={[68, 48]} />
        <meshBasicMaterial color="#141a5a" transparent opacity={0.42} />
      </mesh>

      {/* Beveled Perimeter Frame Border */}
      <mesh position={[0, 0, -0.08]} castShadow receiveShadow>
        <boxGeometry args={[66.2, 46.2, 0.35]} />
        <meshStandardMaterial color="#5c48e0" roughness={0.7} metalness={0.04} />
      </mesh>

      {/* Main Raised 3D Periwinkle Pegboard Slab */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[64, 44, 0.35]} />
        <meshStandardMaterial
          color="#705cf0"
          roughness={0.68}
          metalness={0.03}
        />
      </mesh>

      {/* ============================================================== */}
      {/* 3. RECESSED PEGBOARD HOLES (InstancedMesh of dark cylinders)   */}
      {/* ============================================================== */}
      <instancedMesh
        ref={pegHolesMeshRef}
        args={[undefined, undefined, pegHolesCount]}
        receiveShadow
      >
        <cylinderGeometry args={[0.18, 0.18, 0.36, 16]} />
        <meshStandardMaterial
          color="#23215a"
          roughness={0.92}
          metalness={0.08}
        />
      </instancedMesh>

      {/* ============================================================== */}
      {/* 4. 3D STUDIO FRAMING PROPS (Mounted on Cobalt Wall Above)       */}
      {/* ============================================================== */}
      {/* Top-Left Shelf & Articulated Architect Lamp */}
      <TopLeftStudioShelf position={[-20, 27.5, 0.2]} />

      {/* Top-Center Mid-Century Wall Clock */}
      <MidCenturyWallClock position={[0, 28.5, 0.1]} />

      {/* Top-Right Mini Shelf & Planter */}
      <TopRightStudioShelf position={[20, 27.5, 0.2]} />

      {/* ============================================================== */}
      {/* 5. CENTER ANNOUNCEMENT NOTE (When wall is empty)               */}
      {/* ============================================================== */}
      {showAnnouncement && (
        <group position={[0, 0, 0.25]} rotation={[0, 0, -0.015]}>
          {/* Top adhesive contact shadow */}
          <mesh position={[0, 1.8, -0.01]}>
            <planeGeometry args={[4.4, 0.4]} />
            <meshBasicMaterial color="#1a1838" transparent opacity={0.32} />
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
              roughness={0.78}
              metalness={0.02}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

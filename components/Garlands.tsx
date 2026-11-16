import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode } from '../types';
import { COLORS, TREE } from './sceneTheme';

interface GarlandsProps {
  mode: TreeMode;
}

const createGarlandGeometry = (offset: number, turns: number, thickness: number) => {
  const points: THREE.Vector3[] = [];
  const segments = 140;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const yNorm = 0.06 + t * 0.84;
    const angle = offset + t * Math.PI * 2 * turns;
    const radius = TREE.radius * (1 - yNorm) * 1.015 + 0.16;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      yNorm * TREE.height,
      Math.sin(angle) * radius,
    ));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, 180, thickness, 6, false);
};

export const Garlands: React.FC<GarlandsProps> = ({ mode }) => {
  const groupRef = useRef<THREE.Group>(null);
  const goldMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const redMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const progressRef = useRef(mode === TreeMode.FORMED ? 1 : 0);
  const goldGeometry = useMemo(() => createGarlandGeometry(0, 3.7, 0.055), []);
  const redGeometry = useMemo(() => createGarlandGeometry(Math.PI, 3.25, 0.038), []);

  useFrame((_, delta) => {
    progressRef.current = THREE.MathUtils.damp(
      progressRef.current,
      mode === TreeMode.FORMED ? 1 : 0,
      1.3,
      delta,
    );

    const progress = progressRef.current;
    if (groupRef.current) {
      const easedScale = 0.82 + progress * 0.18;
      groupRef.current.scale.set(easedScale, progress, easedScale);
      groupRef.current.rotation.y = (1 - progress) * Math.PI * 0.4;
      groupRef.current.visible = progress > 0.01;
    }
    if (goldMaterialRef.current) goldMaterialRef.current.opacity = progress * 0.92;
    if (redMaterialRef.current) redMaterialRef.current.opacity = progress * 0.76;
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={goldGeometry}>
        <meshStandardMaterial
          ref={goldMaterialRef}
          color={COLORS.champagneGold}
          emissive={COLORS.antiqueGold}
          emissiveIntensity={0.16}
          metalness={0.75}
          roughness={0.22}
          transparent
        />
      </mesh>
      <mesh geometry={redGeometry}>
        <meshStandardMaterial
          ref={redMaterialRef}
          color={COLORS.velvetRed}
          metalness={0.12}
          roughness={0.72}
          transparent
        />
      </mesh>
    </group>
  );
};

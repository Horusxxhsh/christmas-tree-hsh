import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode } from '../types';
import { COLORS } from './sceneTheme';

interface TreeStarProps {
  mode: TreeMode;
}

export const TreeStar: React.FC<TreeStarProps> = ({ mode }) => {
  const starRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const frontMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const sideMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const revealRef = useRef(mode === TreeMode.FORMED ? 1 : 0);

  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 0.92;
    const innerRadius = 0.38;

    for (let i = 0; i < 10; i++) {
      const angle = i * Math.PI / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  const extrudeSettings = useMemo(() => ({
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.09,
    bevelSize: 0.085,
    bevelSegments: 3,
  }), []);
  const formedPos = useMemo(() => new THREE.Vector3(0, 13, 0), []);
  const chaosPos = useMemo(() => new THREE.Vector3(7.5, 17, -7), []);

  useFrame((state, delta) => {
    if (!starRef.current) return;
    const isFormed = mode === TreeMode.FORMED;
    revealRef.current = THREE.MathUtils.damp(revealRef.current, isFormed ? 1 : 0, 0.9, delta);
    const reveal = revealRef.current;
    const step = 1 - Math.exp(-delta * (isFormed ? 0.9 : 1.35));
    starRef.current.position.lerp(isFormed ? formedPos : chaosPos, step);
    starRef.current.scale.setScalar(0.72 + reveal * 0.28);

    const time = state.clock.elapsedTime;
    starRef.current.rotation.y = time * (isFormed ? 0.22 : 0.8);
    starRef.current.rotation.z = Math.sin(time * 0.55) * 0.055 + (1 - reveal) * time * 0.18;

    const glint = Math.pow(Math.max(0, Math.sin(time * 1.25)), 12);
    const intensity = 0.72 + reveal * 1.15 + glint * 1.3;
    if (frontMaterialRef.current) frontMaterialRef.current.emissiveIntensity = intensity;
    if (sideMaterialRef.current) sideMaterialRef.current.emissiveIntensity = intensity * 0.72;
    if (lightRef.current) lightRef.current.intensity = reveal * (1.4 + glint * 1.4);
  });

  return (
    <group ref={starRef} position={[0, 13, 0]}>
      <mesh>
        <extrudeGeometry args={[starShape, extrudeSettings]} />
        <meshStandardMaterial
          ref={frontMaterialRef}
          color={COLORS.champagneGold}
          emissive={COLORS.warmGold}
          emissiveIntensity={1.6}
          metalness={0.88}
          roughness={0.16}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} scale={[0.78, 0.78, 0.78]}>
        <extrudeGeometry args={[starShape, extrudeSettings]} />
        <meshStandardMaterial
          ref={sideMaterialRef}
          color={COLORS.antiqueGold}
          emissive={COLORS.champagneGold}
          emissiveIntensity={1.1}
          metalness={0.9}
          roughness={0.2}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={lightRef} color={COLORS.warmGold} intensity={2} distance={7} decay={2} />
    </group>
  );
};

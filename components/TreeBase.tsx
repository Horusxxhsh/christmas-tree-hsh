import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode } from '../types';
import { COLORS } from './sceneTheme';

interface TreeBaseProps {
  mode: TreeMode;
}

interface GiftData {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  color: THREE.Color;
}

export const TreeBase: React.FC<TreeBaseProps> = ({ mode }) => {
  const groupRef = useRef<THREE.Group>(null);
  const boxesRef = useRef<THREE.InstancedMesh>(null);
  const verticalRibbonsRef = useRef<THREE.InstancedMesh>(null);
  const horizontalRibbonsRef = useRef<THREE.InstancedMesh>(null);
  const progressRef = useRef(mode === TreeMode.FORMED ? 1 : 0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const gifts = useMemo<GiftData[]>(() => {
    const palette = [COLORS.velvetRed, COLORS.deepGreen, COLORS.antiqueGold, '#183B5B'];
    return Array.from({ length: 11 }, (_, index) => {
      const angle = index / 11 * Math.PI * 2 + (index % 2) * 0.24;
      const distance = 1.5 + (index % 3) * 0.62;
      const width = 0.65 + Math.random() * 0.72;
      const height = 0.52 + Math.random() * 0.78;
      const depth = 0.62 + Math.random() * 0.7;
      return {
        position: new THREE.Vector3(Math.cos(angle) * distance, height * 0.5, Math.sin(angle) * distance),
        rotation: new THREE.Euler(0, -angle + Math.random() * 0.45, 0),
        scale: new THREE.Vector3(width, height, depth),
        color: new THREE.Color(palette[index % palette.length]),
      };
    });
  }, []);

  useLayoutEffect(() => {
    gifts.forEach((gift, index) => {
      dummy.position.copy(gift.position);
      dummy.rotation.copy(gift.rotation);

      dummy.scale.copy(gift.scale);
      dummy.updateMatrix();
      boxesRef.current?.setMatrixAt(index, dummy.matrix);
      boxesRef.current?.setColorAt(index, gift.color);

      dummy.scale.set(gift.scale.x * 0.18, gift.scale.y * 1.03, gift.scale.z * 1.04);
      dummy.updateMatrix();
      verticalRibbonsRef.current?.setMatrixAt(index, dummy.matrix);

      dummy.scale.set(gift.scale.x * 1.03, gift.scale.y * 0.18, gift.scale.z * 1.04);
      dummy.updateMatrix();
      horizontalRibbonsRef.current?.setMatrixAt(index, dummy.matrix);
    });

    [boxesRef, verticalRibbonsRef, horizontalRibbonsRef].forEach((ref) => {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    });
    if (boxesRef.current?.instanceColor) boxesRef.current.instanceColor.needsUpdate = true;
  }, [dummy, gifts]);

  useFrame((_, delta) => {
    progressRef.current = THREE.MathUtils.damp(
      progressRef.current,
      mode === TreeMode.FORMED ? 1 : 0,
      1.45,
      delta,
    );
    if (!groupRef.current) return;
    const progress = progressRef.current;
    groupRef.current.scale.setScalar(progress);
    groupRef.current.rotation.y = (1 - progress) * -0.45;
    groupRef.current.visible = progress > 0.01;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.58, 2.1, 12]} />
        <meshStandardMaterial color={COLORS.trunk} roughness={0.92} metalness={0.02} />
      </mesh>

      <instancedMesh ref={boxesRef} args={[undefined, undefined, gifts.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="white" roughness={0.5} metalness={0.18} />
      </instancedMesh>
      <instancedMesh ref={verticalRibbonsRef} args={[undefined, undefined, gifts.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={COLORS.champagneGold} roughness={0.24} metalness={0.68} />
      </instancedMesh>
      <instancedMesh ref={horizontalRibbonsRef} args={[undefined, undefined, gifts.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={COLORS.champagneGold} roughness={0.24} metalness={0.68} />
      </instancedMesh>
    </group>
  );
};

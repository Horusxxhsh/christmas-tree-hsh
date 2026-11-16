import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode } from '../types';
import { COLORS, TREE } from './sceneTheme';

interface OrnamentsProps {
  mode: TreeMode;
  count: number;
}

type OrnamentType = 'ball' | 'bell' | 'drop';

interface InstanceData {
  chaosPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  currentPos: THREE.Vector3;
  type: OrnamentType;
  color: THREE.Color;
  scale: number;
  speed: number;
  seed: number;
  rotationOffset: THREE.Euler;
}

export const Ornaments: React.FC<OrnamentsProps> = ({ mode, count }) => {
  const ballsRef = useRef<THREE.InstancedMesh>(null);
  const bellsRef = useRef<THREE.InstancedMesh>(null);
  const dropsRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const destination = useMemo(() => new THREE.Vector3(), []);

  const { ballsData, bellsData, dropsData } = useMemo(() => {
    const balls: InstanceData[] = [];
    const bells: InstanceData[] = [];
    const drops: InstanceData[] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const palette = [
      new THREE.Color(COLORS.champagneGold),
      new THREE.Color(COLORS.champagneGold),
      new THREE.Color(COLORS.velvetRed),
      new THREE.Color(COLORS.pearl),
      new THREE.Color(COLORS.antiqueGold),
    ];

    for (let i = 0; i < count; i++) {
      const typeRoll = Math.random();
      const type: OrnamentType = typeRoll < 0.68 ? 'ball' : typeRoll < 0.86 ? 'bell' : 'drop';
      const yNorm = 0.06 + Math.random() * 0.82;
      const angle = i * goldenAngle + Math.random() * 0.4;
      const radius = TREE.radius * (1 - yNorm) * (0.91 + Math.random() * 0.13) + 0.08;
      const targetPos = new THREE.Vector3(
        Math.cos(angle) * radius,
        yNorm * TREE.height,
        Math.sin(angle) * radius,
      );

      const chaosRadius = 15 + Math.random() * 15;
      const chaosTheta = Math.random() * Math.PI * 2;
      const chaosPhi = Math.acos(2 * Math.random() - 1);
      const chaosPos = new THREE.Vector3(
        chaosRadius * Math.sin(chaosPhi) * Math.cos(chaosTheta),
        chaosRadius * Math.sin(chaosPhi) * Math.sin(chaosTheta) + 5,
        chaosRadius * Math.cos(chaosPhi),
      );

      const data: InstanceData = {
        chaosPos,
        targetPos,
        currentPos: mode === TreeMode.FORMED ? targetPos.clone() : chaosPos.clone(),
        type,
        color: palette[Math.floor(Math.random() * palette.length)].clone(),
        scale: type === 'ball' ? 0.18 + Math.random() * 0.22 : 0.2 + Math.random() * 0.16,
        speed: 1.1 + Math.random() * 1.25,
        seed: Math.random() * 100,
        rotationOffset: new THREE.Euler(Math.random() * 0.4, Math.random() * Math.PI * 2, Math.random() * 0.25),
      };

      if (type === 'ball') balls.push(data);
      else if (type === 'bell') bells.push(data);
      else drops.push(data);
    }

    return { ballsData: balls, bellsData: bells, dropsData: drops };
  }, [count]);

  useLayoutEffect(() => {
    const initialize = (ref: React.RefObject<THREE.InstancedMesh | null>, data: InstanceData[]) => {
      if (!ref.current) return;
      data.forEach((item, index) => {
        dummy.position.copy(item.currentPos);
        dummy.rotation.copy(item.rotationOffset);
        dummy.scale.setScalar(item.scale);
        dummy.updateMatrix();
        ref.current!.setMatrixAt(index, dummy.matrix);
        ref.current!.setColorAt(index, item.color);
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    };

    initialize(ballsRef, ballsData);
    initialize(bellsRef, bellsData);
    initialize(dropsRef, dropsData);
  }, [ballsData, bellsData, dropsData, dummy]);

  useFrame((state, delta) => {
    const isFormed = mode === TreeMode.FORMED;
    const time = state.clock.elapsedTime;

    const update = (ref: React.RefObject<THREE.InstancedMesh | null>, data: InstanceData[]) => {
      if (!ref.current) return;

      data.forEach((item, index) => {
        destination.copy(isFormed ? item.targetPos : item.chaosPos);
        if (!isFormed) {
          const swirl = time * 0.12 + item.seed;
          destination.x += Math.cos(swirl) * 0.5;
          destination.z += Math.sin(swirl) * 0.5;
        }

        const step = 1 - Math.exp(-delta * item.speed);
        item.currentPos.lerp(destination, step);
        dummy.position.copy(item.currentPos);

        if (isFormed) {
          dummy.rotation.set(
            item.rotationOffset.x + Math.sin(time * 0.7 + item.seed) * 0.035,
            Math.atan2(item.targetPos.x, item.targetPos.z),
            item.rotationOffset.z + Math.cos(time * 0.6 + item.seed) * 0.04,
          );
        } else {
          dummy.rotation.set(
            item.rotationOffset.x + time * 0.32,
            item.rotationOffset.y + time * 0.45,
            item.rotationOffset.z + time * 0.18,
          );
        }

        dummy.scale.setScalar(item.scale);
        dummy.updateMatrix();
        ref.current!.setMatrixAt(index, dummy.matrix);
      });

      ref.current.instanceMatrix.needsUpdate = true;
    };

    update(ballsRef, ballsData);
    update(bellsRef, bellsData);
    update(dropsRef, dropsData);
  });

  return (
    <>
      <instancedMesh ref={ballsRef} args={[undefined, undefined, ballsData.length]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="white" roughness={0.14} metalness={0.88} envMapIntensity={1.35} />
      </instancedMesh>

      <instancedMesh ref={bellsRef} args={[undefined, undefined, bellsData.length]}>
        <cylinderGeometry args={[0.52, 0.92, 1.25, 12, 1, false]} />
        <meshStandardMaterial color="white" roughness={0.2} metalness={0.82} envMapIntensity={1.25} />
      </instancedMesh>

      <instancedMesh ref={dropsRef} args={[undefined, undefined, dropsData.length]}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="white" roughness={0.24} metalness={0.75} envMapIntensity={1.2} />
      </instancedMesh>
    </>
  );
};

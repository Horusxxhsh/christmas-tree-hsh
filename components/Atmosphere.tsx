import React, { useMemo, useRef } from 'react';
import { Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from './sceneTheme';

interface AtmosphereProps {
  snowCount: number;
}

export const Atmosphere: React.FC<AtmosphereProps> = ({ snowCount }) => {
  const snowRef = useRef<THREE.Points>(null);

  const { positions, speeds, drifts } = useMemo(() => {
    const positionArray = new Float32Array(snowCount * 3);
    const speedArray = new Float32Array(snowCount);
    const driftArray = new Float32Array(snowCount);

    for (let i = 0; i < snowCount; i++) {
      positionArray[i * 3] = (Math.random() - 0.5) * 32;
      positionArray[i * 3 + 1] = Math.random() * 24 - 8;
      positionArray[i * 3 + 2] = (Math.random() - 0.5) * 30;
      speedArray[i] = 0.22 + Math.random() * 0.42;
      driftArray[i] = Math.random() * Math.PI * 2;
    }

    return { positions: positionArray, speeds: speedArray, drifts: driftArray };
  }, [snowCount]);

  useFrame((state, delta) => {
    if (!snowRef.current) return;
    const attribute = snowRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < snowCount; i++) {
      array[i * 3] += Math.sin(time * 0.3 + drifts[i]) * delta * 0.035;
      array[i * 3 + 1] -= speeds[i] * delta;
      if (array[i * 3 + 1] < -8) {
        array[i * 3 + 1] = 16;
        array[i * 3] = (Math.random() - 0.5) * 32;
        array[i * 3 + 2] = (Math.random() - 0.5) * 30;
      }
    }
    attribute.needsUpdate = true;
  });

  return (
    <>
      <points ref={snowRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#F4F1E8" size={0.045} transparent opacity={0.38} depthWrite={false} />
      </points>
      <Sparkles
        count={260}
        scale={[18, 18, 18]}
        size={2.2}
        speed={0.18}
        opacity={0.28}
        color={COLORS.champagneGold}
        position={[0, 2, 0]}
      />
    </>
  );
};

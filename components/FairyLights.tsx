import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode } from '../types';
import { TREE } from './sceneTheme';

interface FairyLightsProps {
  mode: TreeMode;
  count: number;
}

const vertexShader = `
  uniform float uTime;
  uniform float uProgress;
  attribute vec3 aChaosPos;
  attribute vec3 aTargetPos;
  attribute float aPhase;
  varying float vGlow;
  varying float vWarmth;

  void main() {
    float staged = clamp(uProgress * 1.42 - aPhase * 0.42, 0.0, 1.0);
    staged = staged * staged * (3.0 - 2.0 * staged);
    vec3 positionNow = mix(aChaosPos, aTargetPos, staged);
    vec4 mvPosition = modelViewMatrix * vec4(positionNow, 1.0);
    float twinkle = 0.82 + sin(uTime * (1.6 + aPhase) + aPhase * 30.0) * 0.18;
    vGlow = twinkle * mix(0.45, 1.0, staged);
    vWarmth = aPhase;
    gl_PointSize = (5.0 + aPhase * 2.5) * (20.0 / max(1.0, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vGlow;
  varying float vWarmth;

  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    float halo = pow(max(0.0, 1.0 - r * 2.0), 1.8);
    vec3 champagne = vec3(1.0, 0.82, 0.48);
    vec3 pearl = vec3(1.0, 0.95, 0.78);
    vec3 color = mix(champagne, pearl, smoothstep(0.55, 1.0, vWarmth));
    gl_FragColor = vec4(color * (1.1 + vGlow * 0.8), halo * vGlow);
  }
`;

export const FairyLights: React.FC<FairyLightsProps> = ({ mode, count }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const progressRef = useRef(mode === TreeMode.FORMED ? 1 : 0);

  const { positions, chaosPositions, targetPositions, phases } = useMemo(() => {
    const positionArray = new Float32Array(count * 3);
    const chaos = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const phaseArray = new Float32Array(count);
    const strands = 4;
    const perStrand = Math.ceil(count / strands);

    for (let i = 0; i < count; i++) {
      const strand = i % strands;
      const indexOnStrand = Math.floor(i / strands);
      const yNorm = Math.min(0.96, 0.04 + indexOnStrand / perStrand * 0.9);
      const angle = yNorm * Math.PI * 2 * 4.35 + strand * Math.PI * 0.5;
      const radius = TREE.radius * (1 - yNorm) * 0.96 + 0.18;

      target[i * 3] = Math.cos(angle) * radius;
      target[i * 3 + 1] = yNorm * TREE.height;
      target[i * 3 + 2] = Math.sin(angle) * radius;

      const chaosRadius = 12 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      chaos[i * 3] = Math.cos(theta) * chaosRadius;
      chaos[i * 3 + 1] = (Math.random() - 0.35) * 24;
      chaos[i * 3 + 2] = Math.sin(theta) * chaosRadius;

      positionArray[i * 3] = chaos[i * 3];
      positionArray[i * 3 + 1] = chaos[i * 3 + 1];
      positionArray[i * 3 + 2] = chaos[i * 3 + 2];
      phaseArray[i] = Math.random();
    }

    return { positions: positionArray, chaosPositions: chaos, targetPositions: target, phases: phaseArray };
  }, [count]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: progressRef.current },
  }), []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const material = pointsRef.current.material as THREE.ShaderMaterial;
    progressRef.current = THREE.MathUtils.damp(
      progressRef.current,
      mode === TreeMode.FORMED ? 1 : 0,
      1.25,
      delta,
    );
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uProgress.value = progressRef.current;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aChaosPos" args={[chaosPositions, 3]} />
        <bufferAttribute attach="attributes-aTargetPos" args={[targetPositions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
};

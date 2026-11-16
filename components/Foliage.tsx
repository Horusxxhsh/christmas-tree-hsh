import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode } from '../types';
import { TREE } from './sceneTheme';

interface FoliageProps {
  mode: TreeMode;
  count: number;
}

const vertexShader = `
  uniform float uTime;
  uniform float uProgress;

  attribute vec3 aChaosPos;
  attribute vec3 aTargetPos;
  attribute float aRandom;

  varying vec3 vColor;
  varying float vAlpha;

  float cubicInOut(float t) {
    return t < 0.5
      ? 4.0 * t * t * t
      : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    float localProgress = clamp(uProgress * 1.18 - aRandom * 0.18, 0.0, 1.0);
    float easedProgress = cubicInOut(localProgress);
    vec3 newPos = mix(aChaosPos, aTargetPos, easedProgress);

    if (easedProgress > 0.92) {
      float breeze = smoothstep(0.92, 1.0, easedProgress);
      newPos.x += sin(uTime * 0.75 + newPos.y * 1.35 + aRandom * 8.0) * 0.018 * breeze;
      newPos.z += cos(uTime * 0.62 + newPos.y * 1.15 + aRandom * 6.0) * 0.018 * breeze;
    }

    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    gl_PointSize = (2.2 + aRandom * 3.2) * (20.0 / max(1.0, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;

    vec3 chaosGold = vec3(0.90, 0.70, 0.30);
    vec3 deepGreen = vec3(0.012, 0.176, 0.125);
    vec3 emerald = vec3(0.027, 0.357, 0.239);
    vec3 highlight = vec3(0.102, 0.541, 0.357);
    vec3 formedColor = mix(deepGreen, emerald, smoothstep(0.12, 0.82, aRandom));
    formedColor = mix(formedColor, highlight, step(0.93, aRandom) * 0.55);

    float sparkleMask = smoothstep(0.90, 1.0, aRandom);
    float sparkleWave = sin(uTime * 1.45 + aRandom * 180.0) * 0.5 + 0.5;
    float sparkle = sparkleMask * smoothstep(0.18, 0.92, sparkleWave) * 0.32;
    vColor = mix(chaosGold, formedColor, easedProgress) + sparkle * vec3(0.24, 0.19, 0.08);
    vAlpha = mix(0.72, 1.0, easedProgress);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    float glow = pow(max(0.0, 1.0 - r * 2.0), 1.35);
    gl_FragColor = vec4(vColor, vAlpha * glow);
  }
`;

export const Foliage: React.FC<FoliageProps> = ({ mode, count }) => {
  const meshRef = useRef<THREE.Points>(null);
  const progressRef = useRef(mode === TreeMode.FORMED ? 1 : 0);

  const { chaosPositions, targetPositions, randoms } = useMemo(() => {
    const chaos = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      const random = Math.random();
      const chaosRadius = 14 + Math.random() * 16;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      chaos[i * 3] = chaosRadius * Math.sin(phi) * Math.cos(theta);
      chaos[i * 3 + 1] = chaosRadius * Math.sin(phi) * Math.sin(theta) + 5;
      chaos[i * 3 + 2] = chaosRadius * Math.cos(phi);

      const yNorm = (i + Math.random() * 0.8) / count;
      const tierPosition = (yNorm * TREE.tiers) % 1;
      const tierProfile = 0.72 + (1 - tierPosition) * 0.3;
      const outerRadius = TREE.radius * (1 - yNorm) * tierProfile;
      const radialDepth = 0.52 + Math.sqrt(Math.random()) * 0.48;
      const radius = outerRadius * radialDepth;
      const angle = i * goldenAngle + Math.random() * 0.18;
      const droop = Math.pow(radialDepth, 2) * 0.22;

      target[i * 3] = Math.cos(angle) * radius;
      target[i * 3 + 1] = yNorm * TREE.height - droop + (Math.random() - 0.5) * 0.12;
      target[i * 3 + 2] = Math.sin(angle) * radius;
      rnd[i] = random;
    }

    return { chaosPositions: chaos, targetPositions: target, randoms: rnd };
  }, [count]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: progressRef.current },
  }), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.ShaderMaterial;
    const target = mode === TreeMode.FORMED ? 1 : 0;
    progressRef.current = THREE.MathUtils.damp(progressRef.current, target, 1.7, delta);
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uProgress.value = progressRef.current;
  });

  return (
    <points ref={meshRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[chaosPositions, 3]} />
        <bufferAttribute attach="attributes-aChaosPos" args={[chaosPositions, 3]} />
        <bufferAttribute attach="attributes-aTargetPos" args={[targetPositions, 3]} />
        <bufferAttribute attach="attributes-aRandom" args={[randoms, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

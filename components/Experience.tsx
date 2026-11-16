
import React, { useRef } from 'react';
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useFrame, useThree } from '@react-three/fiber';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { FairyLights } from './FairyLights';
import { Garlands } from './Garlands';
import { TreeBase } from './TreeBase';
import { Atmosphere } from './Atmosphere';
import { TreeStar } from './TreeStar';
import { TreeMode } from '../types';
import { COLORS } from './sceneTheme';

interface ExperienceProps {
  mode: TreeMode;
  isMobile: boolean;
  handPosition: {
    current: { x: number; y: number; detected: boolean };
  };
}

export const Experience: React.FC<ExperienceProps> = ({ mode, handPosition, isMobile }) => {
  const controlsRef = useRef<any>(null);
  const { size } = useThree();
  const isCompact = isMobile || size.width < 768;
  const foliageCount = isCompact ? 3500 : 12000;
  const ornamentCount = isCompact ? 180 : 420;
  const lightCount = isCompact ? 240 : 900;
  const snowCount = isCompact ? 200 : 900;
  const sparkleCount = isCompact ? 80 : 260;

  // Update camera rotation based on hand position
  useFrame((_, delta) => {
    const currentHandPosition = handPosition.current;
    if (controlsRef.current && currentHandPosition.detected) {
      const controls = controlsRef.current;
      
      // Map hand position to spherical coordinates
      // x: 0 (left) to 1 (right) -> azimuthal angle (horizontal rotation)
      // y: 0 (top) to 1 (bottom) -> polar angle (vertical tilt)
      
      // Target azimuthal angle: increased range for larger rotation
      const targetAzimuth = (currentHandPosition.x - 0.5) * Math.PI * 3; // Increased from 2 to 3
      
      // Adjust Y mapping so natural hand position gives best view
      // Offset Y so hand at 0.4-0.5 range gives centered view
      const adjustedY = (currentHandPosition.y - 0.2) * 2.0; // Increased sensitivity from 1.5 to 2.0
      const clampedY = Math.max(0, Math.min(1, adjustedY)); // Clamp to 0-1
      
      // Target polar angle: PI/4 to PI/1.8 (constrained vertical angle)
      const minPolar = Math.PI / 4;
      const maxPolar = Math.PI / 1.8;
      const targetPolar = minPolar + clampedY * (maxPolar - minPolar);
      
      // Get current angles
      const currentAzimuth = controls.getAzimuthalAngle();
      const currentPolar = controls.getPolarAngle();
      
      // Calculate angle differences (handle wrapping for azimuth)
      let azimuthDiff = targetAzimuth - currentAzimuth;
      if (azimuthDiff > Math.PI) azimuthDiff -= Math.PI * 2;
      if (azimuthDiff < -Math.PI) azimuthDiff += Math.PI * 2;
      
      // Smoothly interpolate angles
      const lerpSpeed = 8; // Increased from 5 to 8 for faster response
      const newAzimuth = currentAzimuth + azimuthDiff * delta * lerpSpeed;
      const newPolar = currentPolar + (targetPolar - currentPolar) * delta * lerpSpeed;
      
      // Calculate new camera position in spherical coordinates
      const radius = controls.getDistance();
      const targetY = 4; // Tree center height
      
      const x = radius * Math.sin(newPolar) * Math.sin(newAzimuth);
      const y = targetY + radius * Math.cos(newPolar);
      const z = radius * Math.sin(newPolar) * Math.cos(newAzimuth);
      
      // Update camera position and target
      controls.object.position.set(x, y, z);
      controls.target.set(0, targetY, 0);
      controls.update();
    }
  });
  return (
    <>
      <color attach="background" args={[COLORS.background]} />
      <fog attach="fog" args={[COLORS.background, 24, 52]} />
      <OrbitControls 
        ref={controlsRef}
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={10}
        maxDistance={30}
        enableDamping
        dampingFactor={0.05}
        enabled={true}
      />

      {/* Lighting Setup for Maximum Luxury */}
      <Environment preset="lobby" background={false} blur={0.8} />
      
      <ambientLight intensity={0.24} color={COLORS.deepGreen} />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.2} 
        penumbra={1} 
        intensity={1.75}
        color={COLORS.pearl}
        castShadow={!isCompact}
      />
      <pointLight position={[-10, 5, -10]} intensity={0.9} color={COLORS.champagneGold} />
      <pointLight position={[0, 1, 8]} intensity={0.55} color={COLORS.velvetRed} />

      <group position={[0, -5, 0]}>
        <TreeBase mode={mode} />
        <Foliage mode={mode} count={foliageCount} />
        <Garlands mode={mode} />
        <Ornaments mode={mode} count={ornamentCount} />
        <FairyLights mode={mode} count={lightCount} />
        <TreeStar mode={mode} />
        
        {/* Floor Reflections */}
        <ContactShadows 
          opacity={isCompact ? 0.5 : 0.7}
          scale={30} 
          blur={2} 
          far={4.5} 
          color="#000000"
          frames={isCompact ? 1 : Infinity}
          resolution={isCompact ? 256 : 512}
        />
      </group>

      <Atmosphere snowCount={snowCount} sparkleCount={sparkleCount} />

      {!isCompact && (
        <EffectComposer enableNormalPass={false}>
          <Bloom
            luminanceThreshold={0.9}
            mipmapBlur
            intensity={1.15}
            radius={0.52}
          />
          <Vignette eskil={false} offset={0.12} darkness={0.74} />
          <Noise opacity={0.012} blendFunction={BlendFunction.OVERLAY} />
        </EffectComposer>
      )}
    </>
  );
};

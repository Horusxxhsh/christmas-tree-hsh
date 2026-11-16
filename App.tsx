
import React, { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Experience } from './components/Experience';
import { UIOverlay } from './components/UIOverlay';
import { GestureController } from './components/GestureController';
import { TreeMode } from './types';

// Simple Error Boundary to catch 3D resource loading errors (like textures)
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Error loading 3D scene:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can customize this fallback UI
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 text-[#D4AF37] font-serif p-8 text-center">
          <div>
            <h2 className="text-2xl mb-2">3D scene unavailable</h2>
            <p className="opacity-70">The scene could not start on this device. Refresh the page or try again.</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [mode, setMode] = useState<TreeMode>(TreeMode.FORMED);
  const handPosition = useRef({ x: 0.5, y: 0.5, detected: false });
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 767px), (pointer: coarse)').matches
      : false
  );

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px), (pointer: coarse)');
    const updateMobileState = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    setIsMobile(mobileQuery.matches);
    mobileQuery.addEventListener('change', updateMobileState);
    return () => mobileQuery.removeEventListener('change', updateMobileState);
  }, []);

  const handleHandPosition = useCallback((x: number, y: number, detected: boolean) => {
    handPosition.current = { x, y, detected };
  }, []);

  return (
    <div className="w-full h-screen relative bg-gradient-to-b from-black via-[#001a0d] to-[#0a2f1e]">
      <ErrorBoundary>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 4, 20], fov: 45 }}
          gl={{ antialias: false, stencil: false, alpha: false }}
          shadows={!isMobile}
        >
          <Suspense fallback={null}>
            <Experience mode={mode} handPosition={handPosition} isMobile={isMobile} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
      
      <Loader 
        containerStyles={{ background: '#000' }} 
        innerStyles={{ width: '300px', height: '10px', background: '#333' }}
        barStyles={{ background: '#D4AF37', height: '10px' }}
        dataStyles={{ color: '#D4AF37', fontFamily: 'Cinzel' }}
      />
      
      <UIOverlay />
      
      {/* Gesture Control Module */}
      <GestureController currentMode={mode} onModeChange={setMode} onHandPosition={handleHandPosition} />
    </div>
  );
}

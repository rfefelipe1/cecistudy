import React from 'react';
import { MotionConfig } from 'framer-motion';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { BootSplash } from './components/ui/BootSplash';

import { MobileAppShell } from './shells/MobileAppShell';
import { MobileOverlays } from './overlays/MobileOverlays';
import { MotionPreferenceGate } from './components/motion/MotionPreferenceGate';
import { MobileAppProvider } from '../apps/mobile/src/MobileAppProvider';
import { GlimmThemeAnimationProvider } from './components/ui/glimm-theme-animation-provider';

/**
 * Raiz da experiência web (PWA responsiva + nativo Capacitor Android/iOS).
 * É mobile-first: web e nativo compartilham a mesma casca `MobileAppShell`.
 *
 * Sem preload global de telas (spec-performance §7 Fase 3): o chunk da Home
 * vem do boot (`route-prefetch`) e os demais por intenção/prefetch com
 * política (`screenPrefetch`).
 */
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <GlimmThemeAnimationProvider>
          <MobileAppProvider>
            <MotionPreferenceGate>
              <BootSplash />
              <MobileAppShell />
              <MobileOverlays />
            </MotionPreferenceGate>
          </MobileAppProvider>
        </GlimmThemeAnimationProvider>
      </ErrorBoundary>
    </MotionConfig>
  );
}

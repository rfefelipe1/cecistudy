import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ceci.study.app',
  appName: 'cecistudy',
  webDir: 'dist',
  backgroundColor: '#FFFCF8',
  android: {
    backgroundColor: '#FFFCF8',
  },
  ios: {
    backgroundColor: '#FFFCF8',
    contentInset: 'automatic',
    scrollEnabled: true,
  },
  plugins: {
    // OTA self-hosted: atualizações web via @capgo/capacitor-updater (modo manual,
    // dirigido pelo JS em src/lib/ota.ts — endpoint estático no GitHub Pages).
    CapacitorUpdater: {
      autoUpdate: 'off',
    },
<<<<<<< HEAD
=======
    // Device: detecção de modelo/plataforma para otimizações de layout suaves
    // (ex.: iPhone 16e). Nunca bloqueia o app se falhar.
    Device: {},
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: true,
      backgroundColor: '#fef6eb',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#FFFCF8',
      overlaysWebView: false,
    },
  },
};

export default config;

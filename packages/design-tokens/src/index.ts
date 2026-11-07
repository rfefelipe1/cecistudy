// Source of truth: src/index.css @theme block.
// This barrel exists so tooling and packages can reference the token contract
// without importing React or UI components.
export const DESIGN_TOKENS = {
  colors: {
    canvas: '#FFFCF8',
    surfaceDefault: '#FFFFFF',
    surfaceSubtle: '#FFF8F1',
    surfaceMuted: '#FAF8F5',
    surfaceRose: '#FFF5F7',
    surfaceBlue: '#F3F9FC',
    ceciPrimary: '#40383A',
    ceciSecondary: '#6D6366',
    ceciTertiary: '#918689',
    ceciMuted: '#ADA3A5',
    ceciBrand: '#D85F79',
    ceciBrandStrong: '#B94862',
    ceciAcademic: '#4A879F',
    ceciAcademicStrong: '#396D82',
    ceciBorderSubtle: '#F2EBE8',
    ceciBorderDefault: '#E9DFDC',
    ceciBorderStrong: '#DCCFCA',
    ceciBorderBrand: '#FFD3DD',
    ceciBorderAcademic: '#CEE7F0',
  } as const,
<<<<<<< HEAD
} satisfies Record<string, Readonly<Record<string, string>>>;

export type DesignTokenColor = (typeof DESIGN_TOKENS.colors)[keyof typeof DESIGN_TOKENS.colors];
=======

  /** Contrato de tokens de movimento (Spec §6). Valores em segundos, exceto
   *  curvas (arrays de 4 números de bézier cubico) e springs (objetos de física).
   *  Espelha `src/lib/motion/tokens.ts` (BASE_D, EASE, BASE_T) sem depender
   *  de framer-motion nem de React, para que pacotes puros possam ler o
   *  contrato sem importar a camada de UI. */
  motion: {
    durations: {
      screenEnter: 0.26,
      screenExit: 0.18,
      screenRest: 0.3,
      morph: 0.32,
      shade: 0.26,
      replace: 0.16,
      tab: 0.14,
      overlay: 0.18,
      sheet: 0.28,
      step: 0.24,
      stepExit: 0.16,
      listItem: 0.18,
      listStagger: 0.03,
      navBar: 0.24,
      fab: 0.22,
      fabStagger: 0.02,
      toast: 0.2,
      micro: 0.12,
      pressIn: 0.08,
      pressOut: 0.12,
      contentFade: 0.14,
      iconSwap: 0.18,
      selection: 0.18,
      contextBar: 0.28,
      contextMenu: 0.24,
      contextMenuClose: 0.18,
      contextStagger: 0.03,
      ambient: 12,
    },
    easing: {
      enter: [0.16, 1, 0.3, 1],
      exit: [0.4, 0, 1, 1],
      standard: [0.4, 0, 0.2, 1],
      emphasized: [0.2, 0, 0, 1],
    },
    springs: {
      gesture: { stiffness: 700, damping: 50, mass: 0.8 },
      navBar: { stiffness: 600, damping: 40, mass: 0.8 },
      fab: { stiffness: 520, damping: 34, mass: 0.7 },
      sheet: { stiffness: 420, damping: 40, mass: 0.9 },
    },
  } as const,
} satisfies Record<string, Readonly<Record<string, unknown>>>;

export type DesignTokenColor = (typeof DESIGN_TOKENS.colors)[keyof typeof DESIGN_TOKENS.colors];
export type MotionTokens = typeof DESIGN_TOKENS.motion;
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

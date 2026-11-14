"use client"

import * as React from "react"
import { accentChain } from "glimm"
import { GlimmScope, type GlimmScopeHandle } from "glimm/react"

/** Palette do burst de animação (cores do efeito, independe do tema do app). */
const palette = accentChain(["#FF8D28", "#FF2D55", "#CB30E0", "#6155F5"])

interface GlimmThemeAnimationProviderProps {
  children: React.ReactNode
}

type GlimmThemeAnimationCtx = {
  /** Troca o tema (`change`) quando a banda começa a descer. */
  play: (change: () => void) => void
}

/**
 * Fora do provider a animação é opcional: `DataClientProvider` é usado por
 * consumidores sem a casca visual (testes, entrypoints próprios), e um throw
 * ali derrubava o app inteiro por causa de um efeito decorativo. Sem animação,
 * o tema troca na hora.
 */
const GlimmThemeAnimationCtx = React.createContext<GlimmThemeAnimationCtx>({
  play: (change) => change(),
})

export function GlimmThemeAnimationProvider({
  children,
}: GlimmThemeAnimationProviderProps) {
  const scope = React.useRef<GlimmScopeHandle>(null)

  const play = React.useCallback((change: () => void) => {
    // `change` roda no início da banda (e na hora se o movimento estiver
    // reduzido); a transição de cor do tema acompanha a descida.
    if (scope.current) scope.current.play({ change })
    else change()
  }, [])

  const value = React.useMemo(() => ({ play }), [play])

  return (
    <GlimmThemeAnimationCtx.Provider value={value}>
      {/* Faixa decorativa por cima de tudo (z-index acima da casca, que usa
          z-10/z-40): o tema muda e a banda atravessa a tela.
          pointer-events none mantém scroll/clique. */}
      <GlimmScope
        ref={scope}
        palette={palette}
        sweepMs={2700}
        // Só a banda decorativa: o page effect do HTML-in-Canvas cobre a tela
        // inteira com um canvas fixo e pisca preto durante scroll/navegação.
        pageEffect={false}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 9999,
        }}
      >
        <span style={{ display: "none" }} />
      </GlimmScope>
      {children}
    </GlimmThemeAnimationCtx.Provider>
  )
}

export function useGlimmThemeAnimation() {
  return React.useContext(GlimmThemeAnimationCtx)
}

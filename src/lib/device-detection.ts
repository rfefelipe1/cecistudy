import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

/** Resultado da detecção de dispositivo. Tudo opcional: se falhar, devolve
 *  valores indefinidos e o app continua com o layout padrão (fallback
 *  silencioso, sem travar). */
export interface DeviceInfo {
  /** 'ios' | 'android' | 'web' — vindo do Capacitor. */
  platform: string | undefined;
  /** Nome do modelo, ex.: 'iPhone 16e'. */
  model: string | undefined;
  /** Versão do sistema, ex.: '18.0'. */
  osVersion: string | undefined;
  /** Verdadeiro quando o dispositivo parece ser um iPhone 16e. */
  isIPhone16e: boolean;
  /** Verdadeiro quando é um iPhone com tela compacta (~6,1" ou menos), com
   *  base na largura CSS do viewport em retrato. */
  isCompactIPhone: boolean;
}

/** Largura CSS do iPhone 16e em retrato (aproximada, em px). */
const IPHONE_16E_WIDTH_CSS = 390;

/** Lê o modelo do dispositivo via plugin nativo do Capacitor, com fallback
 *  para user agent em web. Nunca lança: qualquer erro resulta em valores
 *  indefinidos e `isIPhone16e = false`. */
export async function detectDevice(): Promise<DeviceInfo> {
  const base: DeviceInfo = {
    platform: undefined,
    model: undefined,
    osVersion: undefined,
    isIPhone16e: false,
    isCompactIPhone: false,
  };

  if (!Capacitor.isNativePlatform()) {
    // Web: tenta inferir pelo user agent, sem precisar de plugin nativo.
    base.platform = 'web';
    base.isCompactIPhone =
      /iPhone/.test(navigator.userAgent) && window.innerWidth <= IPHONE_16E_WIDTH_CSS;
    return base;
  }

  try {
    const info = await Device.getInfo();
    base.platform = info.platform;
    base.model = info.model;
    base.osVersion = info.osVersion;

    const modelLower = (info.model ?? '').toLowerCase();
    base.isIPhone16e = modelLower.includes('iphone 16e');

    // iPhone com tela compacta: modelo contém "iPhone" e a largura do
    // viewport está no range do iPhone 16e (~390px CSS).
    base.isCompactIPhone =
      /iphone/.test(modelLower) && window.innerWidth <= IPHONE_16E_WIDTH_CSS;
  } catch {
    // Falha silenciosa: plugin não disponível, erro de permissão, etc.
    // O app continua com o layout padrão.
  }

  return base;
}

/** Hook síncrono para uso em componentes: lê a largura do viewport e
 *  devolve se parece ser um iPhone compacto. Não depende de plugin nativo,
 *  só de `window.innerWidth`. Seguro para SSR/web/nativo. */
export function isCompactIPhoneViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= IPHONE_16E_WIDTH_CSS;
}

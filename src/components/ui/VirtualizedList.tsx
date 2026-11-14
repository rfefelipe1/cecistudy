import React, { useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedListProps<T> {
  items: T[];
  /** Altura estimada de um item (px). Ajuste conforme o conteúdo real da lista. */
  estimateSize: number | ((index: number) => number);
  /** Renderiza um item. Recebe estilo absoluto para posicionamento no container. */
  renderItem: (props: {
    item: T;
    index: number;
    style: React.CSSProperties;
  }) => React.ReactNode;
  className?: string;
  containerClassName?: string;
  /** Número de itens renderizados antes/depois da janela visível. */
  overscan?: number;
  horizontal?: boolean;
}

/**
 * Lista virtualizada (windowed). Renderiza apenas os itens visíveis +
 * overscan, reduzindo DOM, memória e layout no iPhone 16e (GPU 4-core,
 * tela 60 Hz).
 *
 * Uso típico para listas longas (leituras, flashcards, histórico, busca).
 */
export function VirtualizedList<T>({
  items,
  estimateSize,
  renderItem,
  className,
  containerClassName,
  overscan = 10,
  horizontal = false,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const estimateSizeFn = useCallback(
    (index: number): number =>
      typeof estimateSize === 'number' ? estimateSize : estimateSize(index),
    [estimateSize],
  );

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    horizontal,
    estimateSize: estimateSizeFn,
    overscan,
  });

  const totalStyle = virtualizer.getTotalSize();
  const totalStyleProps = horizontal
    ? { width: totalStyle, height: '100%', minWidth: totalStyle }
    : { height: totalStyle, width: '100%', minHeight: totalStyle };

  const handleScroll = useCallback(() => {
    virtualizer.measure();
  }, [virtualizer]);

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className={containerClassName ?? 'overflow-y-auto'}
    >
      <div style={totalStyleProps} className={className}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index];
          const itemStyle = (horizontal
            ? {
                position: 'absolute' as const,
                left: virtualItem.start,
                top: 0,
                width: virtualItem.size,
                height: '100%',
              }
            : {
                position: 'absolute' as const,
                top: virtualItem.start,
                left: 0,
                width: '100%',
                height: virtualItem.size,
              }) as React.CSSProperties;

          return (
            <div key={virtualItem.key} style={itemStyle}>
              {renderItem({ item, index: virtualItem.index, style: itemStyle })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

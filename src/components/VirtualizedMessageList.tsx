import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2 } from 'lucide-react';

export interface VirtualizedMessageListProps {
  items: any[];
  estimateSize?: number;
  overscan?: number;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
}

export interface VirtualizedMessageListHandle {
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  scrollToIndex: (index: number) => void;
  isNearBottom: () => boolean;
}

export const VirtualizedMessageList = forwardRef<
  VirtualizedMessageListHandle,
  VirtualizedMessageListProps
>(({
  items,
  estimateSize = 80,
  overscan = 5,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  renderItem,
  className = '',
}, ref) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const prevItemsLengthRef = useRef(0);
  const isAtBottomRef = useRef(true);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: (index) => items[index]?.id || index,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Handle scroll to bottom when new messages arrive
  useEffect(() => {
    if (items.length > prevItemsLengthRef.current && isAtBottomRef.current) {
      // Slight delay to ensure DOM is updated
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(items.length - 1, { align: 'end' });
      });
    }
    prevItemsLengthRef.current = items.length;
  }, [items.length, virtualizer]);

  // Initial scroll to bottom
  useEffect(() => {
    if (items.length > 0) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(items.length - 1, { align: 'end' });
      });
    }
  }, []);

  // Track scroll position
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    
    // Load more when scrolling near the top
    if (scrollTop < 200 && hasMore && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  useImperativeHandle(ref, () => ({
    scrollToBottom: (behavior: 'auto' | 'smooth' = 'smooth') => {
      if (items.length > 0) {
        virtualizer.scrollToIndex(items.length - 1, { 
          align: 'end',
          behavior: behavior as any
        });
      }
    },
    scrollToIndex: (index: number) => {
      virtualizer.scrollToIndex(index, { align: 'center' });
    },
    isNearBottom: () => isAtBottomRef.current,
  }));

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className={`overflow-y-auto overscroll-contain ${className}`}
      style={{ contain: 'strict' }}
    >
      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando mensagens anteriores...</span>
        </div>
      )}
      
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
});

VirtualizedMessageList.displayName = 'VirtualizedMessageList';

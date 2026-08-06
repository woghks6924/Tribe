import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * zustand persist(localStorage) 상태는 서버에서 알 수 없으므로,
 * 하이드레이션 전에는 서버와 동일한 값을 렌더링해 mismatch를 피한다.
 */
export function useHasMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

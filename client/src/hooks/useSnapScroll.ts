// import { useCallback, useEffect, useRef, useState } from 'react';

// type Direction = 'up' | 'down';

// export function useSnapScroll<T extends HTMLElement>() {
//   const containerRef = useRef<T>(null);
//   const [hasPrev, setHasPrev] = useState(false);
//   const [hasNext, setHasNext] = useState(false);

//   // Update hasNext / hasPrev based on scroll position
//   const updateScrollState = useCallback(() => {
//     const el = containerRef.current;
//     if (!el) return;
//     const { scrollTop, scrollHeight, clientHeight } = el;
//     setHasPrev(scrollTop > 0);
//     setHasNext(scrollTop + clientHeight < scrollHeight - 1);
//   }, []);

//   // Scroll by container height
//   const scrollTo = useCallback(
//     (direction: Direction) => {
//       const el = containerRef.current;
//       if (!el) return;
//       const delta = direction === 'up' ? -1 : 1;
//       el.scrollBy({
//         top: delta * el.clientHeight,
//         behavior: 'smooth',
//       });
//     },
//     []
//   );

//   useEffect(() => {
//     const el = containerRef.current;
//     if (!el) return;

//     updateScrollState();

//     const onScroll = () => {
//       updateScrollState();
//     };

//     el.addEventListener('scroll', onScroll);
//     return () => el.removeEventListener('scroll', onScroll);
//   }, [updateScrollState]);

//   return {
//     ref: containerRef,
//     scrollTo,
//     hasPrev,
//     hasNext,
//   };
// }

import { useCallback, useEffect, useRef, useState } from "react";

type Direction = "up" | "down";

export function useSnapScroll<T extends HTMLElement>(throttleDelay = 600) {
  const containerRef = useRef<T>(null);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const scrollLock = useRef(false); // Prevent rapid fire

  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setHasPrev(scrollTop > 0);
    setHasNext(scrollTop + clientHeight < scrollHeight - 1);
  }, []);

  const scrollTo = useCallback(
    (direction: Direction) => {
      const el = containerRef.current;
      if (!el || scrollLock.current) return;

      scrollLock.current = true;
      const delta = direction === "up" ? -1 : 1;
      el.scrollBy({
        top: delta * el.clientHeight,
        behavior: "smooth",
      });

      // Reset lock after delay
      setTimeout(() => {
        scrollLock.current = false;
      }, throttleDelay);
    },
    [throttleDelay]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScrollState();

    const onScroll = () => {
      updateScrollState();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); // prevent native scroll
      if (e.deltaY > 0) scrollTo("down");
      else if (e.deltaY < 0) scrollTo("up");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          scrollTo("up");
          break;
        case "ArrowDown":
          e.preventDefault();
          scrollTo("down");
          break;
      }
    };

    el.addEventListener("scroll", onScroll);
    el.addEventListener("wheel", onWheel, { passive: false }); // to allow preventDefault

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [scrollTo, updateScrollState]);

  return {
    ref: containerRef,
    scrollTo,
    hasPrev,
    hasNext,
  };
}

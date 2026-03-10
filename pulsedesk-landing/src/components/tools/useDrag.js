import { useState, useRef, useCallback } from "react";

/**
 * Drag hook: devuelve pos { x, y } y onMouseDown para aplicar al handle.
 * Limita el movimiento a los bordes de la ventana.
 */
export function useDrag(initial) {
  const [pos, setPos] = useState(initial);
  const posRef = useRef(initial);

  const onMouseDown = useCallback((e) => {
    // Solo botón izquierdo
    if (e.button !== 0) return;
    e.preventDefault();

    const startX = e.clientX - posRef.current.x;
    const startY = e.clientY - posRef.current.y;

    const onMove = (e) => {
      const next = {
        x: Math.max(0, Math.min(window.innerWidth - 60, e.clientX - startX)),
        y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - startY)),
      };
      posRef.current = next;
      setPos({ ...next });
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  return { pos, onMouseDown };
}

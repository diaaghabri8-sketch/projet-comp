import { useRef, useEffect } from 'react';

export default function useMagnetic(strength = 0.5) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = el.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // If within 100px of center
      if (distance < 100) {
        el.style.transform = `translate3d(${deltaX * strength}px, ${deltaY * strength}px, 0)`;
      } else {
        el.style.transform = `translate3d(0, 0, 0)`;
      }
    };

    const handleMouseLeave = () => {
      el.style.transform = `translate3d(0, 0, 0)`;
    };

    window.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);

  return ref;
}

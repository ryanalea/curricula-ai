import { useEffect } from 'react';
import { useUI } from '../context/UIContext';

export function useScrollSpy(dependencies = []) {
  const { setActiveSubSection } = useUI();

  useEffect(() => {
    const handleScrollSpy = () => {
      const sectionElements = Array.from(document.querySelectorAll('[id^="step7-sec-"]'));
      if (!sectionElements.length) return;

      const scrollPos = window.scrollY + 220;
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (scrollPos >= top) {
          const secId = el.id.replace('step7-sec-', '');
          setActiveSubSection(secId);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    handleScrollSpy();

    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, dependencies);
}

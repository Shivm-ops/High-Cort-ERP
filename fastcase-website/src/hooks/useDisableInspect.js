import { useEffect } from 'react';

/**
 * Hook to deter basic inspecting by disabling right-click context menu
 * and common developer tool keyboard shortcuts (F12, Ctrl+Shift+I, etc.)
 */
export function useDisableInspect() {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // Disable developer keyboard shortcuts
    const handleKeyDown = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (
        // F12
        e.key === 'F12' ||
        // Ctrl+Shift+I or Cmd+Option+I (Inspect)
        (isCtrlOrCmd && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
        // Ctrl+Shift+J or Cmd+Option+J (Console)
        (isCtrlOrCmd && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
        // Ctrl+Shift+C (Element inspector)
        (isCtrlOrCmd && e.shiftKey && (e.key === 'C' || e.key === 'c')) ||
        // Ctrl+U or Cmd+U (View Source)
        (isCtrlOrCmd && (e.key === 'u' || e.key === 'U')) ||
        // Ctrl+S (Save Page)
        (isCtrlOrCmd && (e.key === 's' || e.key === 'S'))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}

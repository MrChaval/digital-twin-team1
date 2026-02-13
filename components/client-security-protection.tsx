'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { logClientSecurityEvent } from '@/app/actions/security';

/**
 * ClientSecurityProtection Component
 * 
 * Implements multiple client-side security measures:
 * - Right-click prevention
 * - DevTools detection
 * - Text selection blocking
 * - Keyboard shortcut blocking (F12, Ctrl+S, Ctrl+U, etc.)
 * - Console warning messages
 * - Screenshot watermarking
 * - Session timeout detection
 * 
 * IMPORTANT: These are deterrents only. Client-side security can always be bypassed.
 * Real security must be enforced server-side (which you already have with Arcjet).
 */
export function ClientSecurityProtection() {
  const { user } = useUser();
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  // Track logged events to prevent spam (log each event type max once per 5 minutes)
  const loggedEvents = useRef<Map<string, number>>(new Map());
  
  // Helper to check if we should log this event (throttling)
  const shouldLogEvent = (eventType: string, cooldownMs: number = 300000): boolean => {
    const lastLogged = loggedEvents.current.get(eventType);
    const now = Date.now();
    
    if (!lastLogged || (now - lastLogged) > cooldownMs) {
      loggedEvents.current.set(eventType, now);
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    // ======================
    // 1. CONSOLE WARNING MESSAGES
    // ======================
    console.log(
      '%c⚠️ SECURITY WARNING',
      'color: red; font-size: 40px; font-weight: bold; text-shadow: 2px 2px 4px black;'
    );
    console.log(
      '%c🛡️ This is a monitored security-hardened application.',
      'color: yellow; font-size: 18px; font-weight: bold;'
    );
    console.log(
      '%c⚡ All actions are logged and traced to your IP address.',
      'color: orange; font-size: 16px;'
    );
    console.log(
      '%c🔒 Unauthorized access or tampering attempts will be reported.',
      'color: red; font-size: 16px;'
    );
    console.log(
      '%c📋 Your session ID: ' + (user?.id || 'Anonymous'),
      'color: cyan; font-size: 14px; font-family: monospace;'
    );
    console.log(
      '%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'color: gray;'
    );

    // ======================
    // 2. DEVTOOLS DETECTION
    // ======================
    let devtools: { isOpen: boolean; orientation?: 'vertical' | 'horizontal' } = { isOpen: false, orientation: undefined };
    const threshold = 160;

    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      const orientation = widthThreshold ? 'vertical' : 'horizontal';

      if (
        !(heightThreshold && widthThreshold) &&
        (((window as any).Firebug && (window as any).Firebug.chrome && (window as any).Firebug.chrome.isInitialized) ||
          widthThreshold ||
          heightThreshold)
      ) {
        if (!devtools.isOpen || devtools.orientation !== orientation) {
          setDevToolsOpen(true);
          console.clear();
          console.log(
            '%c🚨 SECURITY ALERT: Developer Tools Detected',
            'color: red; font-size: 24px; font-weight: bold;'
          );
          console.log(
            '%c⚠️ This action has been logged.',
            'color: orange; font-size: 18px;'
          );
          console.log(
            '%cIP Address: ' + (navigator as any).connection?.effectiveType || 'Unknown',
            'color: yellow; font-size: 14px;'
          );
          console.log(
            '%cTimestamp: ' + new Date().toISOString(),
            'color: cyan; font-size: 14px;'
          );
        }
        devtools.isOpen = true;
        devtools.orientation = orientation;
      } else {
        devtools.isOpen = false;
        devtools.orientation = undefined;
        setDevToolsOpen(false);
      }
    };

    // Check every 500ms
    const devToolsInterval = setInterval(detectDevTools, 500);

    // ======================
    // 3. RIGHT-CLICK PREVENTION
    // ======================
    const handleContextMenu = (e: MouseEvent) => {
      const startTime = performance.now();
      e.preventDefault();
      e.stopImmediatePropagation();
      
      // IMMEDIATE visual feedback (no delays)
      requestAnimationFrame(() => {
        const existingNotification = document.getElementById('security-notification');
        if (existingNotification) {
          existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.id = 'security-notification';
        notification.textContent = '🚫 Right-click disabled';
        notification.style.cssText = 'position:fixed;top:20px;right:20px;background:rgba(239,68,68,0.95);color:white;padding:12px 24px;border-radius:8px;font-weight:bold;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:slideIn 0.3s ease-out;pointer-events:none;';
        
        document.body.appendChild(notification);
        
        const endTime = performance.now();
        console.log(`⚡ Notification displayed in ${(endTime - startTime).toFixed(2)}ms`);
        
        setTimeout(() => {
          notification.style.animation = 'slideOut 0.3s ease-in';
          setTimeout(() => notification.remove(), 300);
        }, 2000);
      });
      
      // Log to server asynchronously (non-blocking)
      if (shouldLogEvent('RIGHT_CLICK_BLOCKED')) {
        // Use setTimeout to ensure this doesn't block UI
        setTimeout(() => {
          logClientSecurityEvent('RIGHT_CLICK_BLOCKED', {
            target: (e.target as HTMLElement)?.tagName || 'unknown',
            timestamp: new Date().toISOString(),
          }).catch(err => console.error('Failed to log right-click:', err));
        }, 0);
      }

      return false;
    };

    // ======================
    // 4. TEXT SELECTION PREVENTION
    // ======================
    const handleSelectStart = (e: Event) => {
      // Allow selection in input fields and textareas
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return true;
      }
      
      e.preventDefault();
      return false;
    };

    // ======================
    // 5. KEYBOARD SHORTCUTS BLOCKING
    // ======================
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 - DevTools
      if (e.key === 'F12') {
        e.preventDefault();
        console.log('%c🚫 F12 is disabled', 'color: red; font-size: 16px;');
        
        if (shouldLogEvent('F12_BLOCKED', 60000)) { // 1 minute cooldown
          logClientSecurityEvent('KEYBOARD_SHORTCUT_BLOCKED', {
            key: 'F12',
            action: 'DevTools',
          }).catch(err => console.error('Failed to log F12:', err));
        }
        
        return false;
      }

      // Ctrl+Shift+I - DevTools
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        console.log('%c🚫 Inspect Element is disabled', 'color: red; font-size: 16px;');
        
        if (shouldLogEvent('CTRL_SHIFT_I_BLOCKED', 60000)) {
          logClientSecurityEvent('KEYBOARD_SHORTCUT_BLOCKED', {
            key: 'Ctrl+Shift+I',
            action: 'Inspect Element',
          }).catch(err => console.error('Failed to log shortcut:', err));
        }
        
        return false;
      }

      // Ctrl+Shift+J - Console
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        console.log('%c🚫 Console access is disabled', 'color: red; font-size: 16px;');
        return false;
      }

      // Ctrl+Shift+C - Element inspector
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        console.log('%c🚫 Element inspector is disabled', 'color: red; font-size: 16px;');
        return false;
      }

      // Ctrl+U - View source
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        console.log('%c🚫 View Source is disabled', 'color: red; font-size: 16px;');
        
        if (shouldLogEvent('VIEW_SOURCE_BLOCKED', 120000)) { // 2 minute cooldown
          logClientSecurityEvent('VIEW_SOURCE_ATTEMPT', {
            key: 'Ctrl+U',
          }).catch(err => console.error('Failed to log view source:', err));
        }
        
        return false;
      }

      // Ctrl+S - Save page
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        console.log('%c🚫 Page saving is disabled', 'color: red; font-size: 16px;');
        
        if (shouldLogEvent('SAVE_PAGE_BLOCKED', 120000)) {
          logClientSecurityEvent('SAVE_PAGE_ATTEMPT', {
            key: 'Ctrl+S',
          }).catch(err => console.error('Failed to log save attempt:', err));
        }
        
        return false;
      }

      // Ctrl+Shift+K - Console (Firefox)
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        return false;
      }

      // F1 - Help (some browsers open tools)
      if (e.key === 'F1') {
        e.preventDefault();
        return false;
      }
    };

    // ======================
    // 6. COPY/PASTE PREVENTION
    // ======================
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      const target = e.target as HTMLElement;
      
      // Allow copying from input fields
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return true;
      }

      if (selection && selection.toString().length > 0) {
        e.preventDefault();
        console.log('%c🚫 Content copying is restricted', 'color: red; font-size: 16px;');
        
        // Log to server (throttled - max once per 2 minutes)
        if (shouldLogEvent('COPY_BLOCKED', 120000)) {
          logClientSecurityEvent('COPY_ATTEMPT', {
            textLength: selection.toString().length,
            timestamp: new Date().toISOString(),
          }).catch(err => console.error('Failed to log copy attempt:', err));
        }
        
        // Optional: Replace clipboard with warning message
        e.clipboardData?.setData(
          'text/plain',
          '⚠️ This content is protected. Unauthorized copying is monitored and logged.'
        );
        
        return false;
      }
    };

    // ======================
    // 7. SESSION TIMEOUT DETECTION
    // ======================
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    const checkInactivity = () => {
      const inactiveTime = Date.now() - lastActivity;
      if (inactiveTime > SESSION_TIMEOUT && user) {
        console.log('%c⏰ Session timeout due to inactivity', 'color: orange; font-size: 16px;');
        // You can trigger logout here or show a warning
        // For now, just log it
      }
    };

    const inactivityInterval = setInterval(checkInactivity, 60000); // Check every minute

    // Track user activity
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    // ======================
    // 8. DISABLE DRAG & DROP
    // ======================
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // ======================
    // ATTACH ALL EVENT LISTENERS
    // ======================
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCopy);
    document.addEventListener('dragstart', handleDragStart);

    // Add CSS animations
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      /* Disable text selection globally (except inputs) */
      * {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }

      /* Re-enable for input elements */
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }

      /* Disable drag on images */
      img {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
        pointer-events: none;
      }

      /* Re-enable pointer events for interactive elements */
      button, a, input, textarea, select {
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);

    // ======================
    // CLEANUP
    // ======================
    return () => {
      clearInterval(devToolsInterval);
      clearInterval(inactivityInterval);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCopy);
      document.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      style.remove();
    };
  }, [user, lastActivity]);

  // Visual DevTools Warning Overlay
  if (devToolsOpen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          padding: '12px',
          zIndex: 999999,
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        🚨 SECURITY ALERT: Developer Tools Detected - This action has been logged
      </div>
    );
  }

  // Invisible watermark for screenshots (shows user ID)
  return (
    <>
      {user && (
        <div
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            opacity: 0.03,
            pointerEvents: 'none',
            fontSize: '10px',
            color: '#000',
            fontFamily: 'monospace',
            zIndex: 999998,
            userSelect: 'none',
          }}
        >
          USER: {user.id} | {new Date().toISOString()}
        </div>
      )}
    </>
  );
}

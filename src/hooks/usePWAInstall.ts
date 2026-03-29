import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Check if event was captured globally before React mounted
    if ((window as any).deferredPWAEvent) {
      console.log("PWA: Found global deferred event");
      setDeferredPrompt((window as any).deferredPWAEvent);
      setIsInstallable(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log("PWA: beforeinstallprompt caught in hook");
      (window as any).deferredPWAEvent = e;
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log("PWA: App was installed");
      setIsInstallable(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as any).deferredPWAEvent = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredPWAEvent;
    if (!promptEvent) {
      console.log("PWA: No deferred prompt available to trigger");
      return;
    }
    
    try {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      console.log(`PWA: User install outcome: ${outcome}`);
      if (outcome === 'accepted') {
        setIsInstallable(false);
        (window as any).deferredPWAEvent = null;
      }
    } catch (error) {
      console.error("PWA: Error prompting install:", error);
    }
    
    setDeferredPrompt(null);
  };

  return { isInstallable, isInstalled, promptInstall };
}

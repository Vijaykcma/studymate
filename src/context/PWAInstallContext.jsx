import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PWAInstallContext = createContext(null);

export const PWAInstallProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [platform, setPlatform] = useState('desktop');

  // Detect platform & standalone mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already running as standalone PWA / WebAPK
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isNavigatorStandalone = window.navigator.standalone === true;
      const isAndroidApp = document.referrer.includes('android-app://');
      return Boolean(isStandaloneMedia || isNavigatorStandalone || isAndroidApp);
    };

    setIsInstalled(checkStandalone());

    // Listen for display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e) => {
      setIsInstalled(e.matches);
    };
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    // Platform detection
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const isIOSDevice =
      (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /Android/i.test(ua);

    if (isIOSDevice) {
      setPlatform('ios');
    } else if (isAndroidDevice) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Capture beforeinstallprompt event (Chrome, Edge, Samsung Internet, Android WebAPK)
    const handleBeforeInstallPrompt = (e) => {
      // Prevent automatic mini-infobar so our custom UI controls the flow
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // App installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowInstallModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const openInstallModal = useCallback(() => {
    setShowInstallModal(true);
  }, []);

  const closeInstallModal = useCallback(() => {
    setShowInstallModal(false);
  }, []);

  // Trigger native 1-click install prompt
  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      // If prompt not available (e.g. iOS or already installed or unsupported browser), open the guidance modal
      openInstallModal();
      return false;
    }

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        setShowInstallModal(false);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Install prompt error:', err);
      return false;
    }
  }, [deferredPrompt, openInstallModal]);

  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';
  const isMobile = isIOS || isAndroid;

  return (
    <PWAInstallContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isIOS,
        isAndroid,
        isMobile,
        platform,
        installApp,
        showInstallModal,
        openInstallModal,
        closeInstallModal,
        deferredPrompt,
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
};

export const usePWAInstall = () => {
  const context = useContext(PWAInstallContext);
  if (!context) {
    return {
      isInstallable: false,
      isInstalled: false,
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      platform: 'desktop',
      installApp: async () => false,
      showInstallModal: false,
      openInstallModal: () => {},
      closeInstallModal: () => {},
      deferredPrompt: null,
    };
  }
  return context;
};


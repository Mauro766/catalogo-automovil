import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Outlet, useBlocker, useLocation } from 'react-router-dom';
import './route-transitions.css';

type TransitionPhase = 'idle' | 'covering' | 'revealing';

const INITIAL_PRELOADER_COLORS = {
  darkBlue: '#182e88',
  brandBlue: '#2343C4',
  loader: '#DCE6F5',
};

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isAdminRoute = (pathname: string): boolean => pathname.startsWith('/admin');

const hasPendingRouteFallback = (): boolean =>
  Array.from(document.querySelectorAll('.dp-route-content [role="status"]')).some(
    (element) => ['Cargando página…', 'Cargando panel…'].includes(element.textContent?.trim() ?? ''),
  );

const waitForInitialRoute = async (): Promise<void> => {
  const content = document.querySelector('.dp-route-content');
  if (!content || !hasPendingRouteFallback()) {
    return;
  }

  await new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (!hasPendingRouteFallback()) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(content, { childList: true, subtree: true, characterData: true });
    if (!hasPendingRouteFallback()) {
      observer.disconnect();
      resolve();
    }
  });
};

const waitForEssentialVisuals = async (): Promise<void> => {
  await waitForInitialRoute();
  await document.fonts.ready;
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

  const visibleImages = Array.from(document.images).filter((image) => {
    const bounds = image.getBoundingClientRect();
    return (
      bounds.width > 0 &&
      bounds.height > 0 &&
      bounds.bottom > 0 &&
      bounds.top < window.innerHeight &&
      bounds.right > 0 &&
      bounds.left < window.innerWidth
    );
  });

  await Promise.allSettled(
    visibleImages.map((image) =>
      image.complete
        ? Promise.resolve()
        : Promise.resolve().then(() => image.decode()),
    ),
  );
};

export const RouteTransitionRoot = () => {
  const location = useLocation();
  const [preloaderVisible, setPreloaderVisible] = useState(() =>
    Boolean(document.getElementById('dp-initial-preloader')),
  );
  const preloaderVisibleRef = useRef(preloaderVisible);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !preloaderVisibleRef.current &&
      currentLocation.pathname !== nextLocation.pathname &&
      !(isAdminRoute(currentLocation.pathname) && isAdminRoute(nextLocation.pathname)),
  );
  const blockerRef = useRef(blocker);
  const contentRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const preloaderTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const backgroundTweenRef = useRef<gsap.core.Tween | null>(null);
  const phaseRef = useRef<TransitionPhase>('idle');
  const previousLocationKey = useRef(location.key);
  const isBlocked = blocker.state === 'blocked';

  useLayoutEffect(() => {
    if (!preloaderVisible) {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const restoreScroll = () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };

    return restoreScroll;
  }, [preloaderVisible]);

  useEffect(() => {
    const overlay = document.getElementById('dp-initial-preloader');
    const loader = overlay?.querySelector<HTMLDivElement>('.loader') ?? null;
    const reveal = overlay?.querySelector<HTMLDivElement>('.dp-initial-reveal') ?? null;
    let active = true;

    if (!overlay || !loader || !reveal) {
      preloaderVisibleRef.current = false;
      document.documentElement.classList.remove('dp-preloading');
      return;
    }

    gsap.set(overlay, { backgroundColor: INITIAL_PRELOADER_COLORS.darkBlue });
    gsap.set(overlay, { '--reveal-radius': '0px' });
    gsap.set(loader, { autoAlpha: 1 });
    gsap.set(reveal, { autoAlpha: 0, scale: 0 });

    if (!prefersReducedMotion()) {
      backgroundTweenRef.current = gsap.to(overlay, {
        backgroundColor: INITIAL_PRELOADER_COLORS.brandBlue,
        duration: 1.6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    }

    const finishPreloader = () => {
      preloaderVisibleRef.current = false;
      document.documentElement.classList.remove('dp-preloading');
      overlay.remove();
      setPreloaderVisible(false);
    };

    const revealPage = () => {
      gsap.set(overlay, { backgroundColor: INITIAL_PRELOADER_COLORS.brandBlue });
      gsap.set(reveal, {
        autoAlpha: 1,
        backgroundColor: 'transparent',
        transformOrigin: 'center center',
      });
      preloaderTimelineRef.current = gsap
        .timeline({ onComplete: finishPreloader })
        .to(loader, {
          autoAlpha: 0,
          duration: 0.32,
          ease: 'power1.out',
          onComplete: () => {
            loader.style.animation = 'none';
          },
        })
        .to(reveal, {
          scale: 1,
          duration: 1.05,
          ease: 'power3.inOut',
          onUpdate: () => {
            const scale = Number(gsap.getProperty(reveal, 'scaleX'));
            const radius = (Math.hypot(window.innerWidth, window.innerHeight) / 2) * scale;
            overlay.style.setProperty('--reveal-radius', `${radius}px`);
          },
        });
    };

    const completeImmediately = () => {
      gsap.set(overlay, { backgroundColor: INITIAL_PRELOADER_COLORS.brandBlue });
      gsap.set(loader, { autoAlpha: 0 });
      loader.style.animation = 'none';
      gsap.set(reveal, {
        autoAlpha: 1,
        scale: 1,
        backgroundColor: 'transparent',
      });
      finishPreloader();
    };

    void waitForEssentialVisuals().then(() => {
      if (!active) {
        return;
      }

      backgroundTweenRef.current?.kill();
      backgroundTweenRef.current = null;

      if (prefersReducedMotion()) {
        completeImmediately();
      } else {
        revealPage();
      }
    });

    return () => {
      active = false;
      backgroundTweenRef.current?.kill();
      backgroundTweenRef.current = null;
      preloaderTimelineRef.current?.kill();
      preloaderTimelineRef.current = null;
    };
  }, []);

  useEffect(() => {
    blockerRef.current = blocker;
  }, [blocker]);

  useLayoutEffect(() => {
    if (location.key === previousLocationKey.current) {
      return;
    }

    previousLocationKey.current = location.key;

    if (/^\/vehiculos\/[^/]+\/?$/.test(location.pathname)) {
      window.scrollTo(0, 0);
    }

    const curtain = curtainRef.current;
    if (!curtain || phaseRef.current === 'idle') {
      if (contentRef.current) {
        contentRef.current.inert = false;
      }
      return;
    }

    animationRef.current?.kill();
    phaseRef.current = 'revealing';
    animationRef.current = gsap.to(curtain, {
      scaleY: 0,
      autoAlpha: 0,
      duration: 0.72,
      ease: 'power3.inOut',
      transformOrigin: 'top center',
      onComplete: () => {
        phaseRef.current = 'idle';
        animationRef.current = null;
        if (contentRef.current) {
          contentRef.current.inert = false;
        }
      },
    });
  }, [location.key, location.pathname]);

  useEffect(() => {
    if (!isBlocked) {
      return;
    }

    if (prefersReducedMotion()) {
      animationRef.current?.kill();
      animationRef.current = null;
      phaseRef.current = 'idle';
      if (contentRef.current) {
        contentRef.current.inert = false;
      }
      if (curtainRef.current) {
        gsap.set(curtainRef.current, {
          scaleY: 0,
          autoAlpha: 0,
          pointerEvents: 'none',
          transformOrigin: 'bottom center',
        });
      }

      const currentBlocker = blockerRef.current;
      if (currentBlocker.state === 'blocked') {
        currentBlocker.proceed();
      }
      return;
    }

    const curtain = curtainRef.current;
    if (!curtain) {
      const currentBlocker = blockerRef.current;
      if (currentBlocker.state === 'blocked') {
        currentBlocker.proceed();
      }
      return;
    }
    if (phaseRef.current === 'covering') {
      return;
    }

    const coverOrigin = phaseRef.current === 'revealing' ? 'top center' : 'bottom center';
    animationRef.current?.kill();
    phaseRef.current = 'covering';
    if (contentRef.current) {
      contentRef.current.inert = true;
    }
    gsap.set(curtain, {
      autoAlpha: 1,
      pointerEvents: 'auto',
      transformOrigin: coverOrigin,
    });
    animationRef.current = gsap.to(curtain, {
      scaleY: 1,
      duration: 0.72,
      ease: 'power3.inOut',
      onComplete: () => {
        const currentBlocker = blockerRef.current;
        if (currentBlocker.state === 'blocked') {
          currentBlocker.proceed();
        }
      },
    });
  }, [isBlocked]);

  useEffect(
    () => () => {
      animationRef.current?.kill();
      backgroundTweenRef.current?.kill();
      preloaderTimelineRef.current?.kill();
    },
    [],
  );

  return (
    <>
      <div ref={contentRef} className="dp-route-content" inert={preloaderVisible}>
        <Outlet />
      </div>
      <div ref={curtainRef} className="dp-route-curtain" aria-hidden="true" />
    </>
  );
};

import React, { useState, useEffect, useRef, useCallback } from "react";
import Button from "../../../../components/Button/Button";
import "./HeroSection.css";

// Section components for inline rendering
import ProfileSection from "../02-ProfileSection/ProfileSection";
import LedgerSection from "../03-LedgerSection/LedgerSection";
import PostJobSection from "../04-PostJobSection/PostJobSection";
import DirectContractSection from "../05-DirectContractSection/DirectContractSection";
import JobProgressSection from "../06-JobProgressSection/JobProgressSection";
import DisputeSection from "../07-DisputeSection/DisputeSection";
import EarnTokenSection from "../08-EarnTokenSection/EarnTokenSection";
import GovernanceSection from "../09-GovernanceSection/GovernanceSection";
import MultiChainSection from "../10-MultiChainSection/MultiChainSection";
import ArchitectureSection from "../11-ArchitectureSection/ArchitectureSection";
import RevolutionSection from "../12-RevolutionSection/RevolutionSection";
import ContactSection from "../13-ContactSection/ContactSection";

const HeroSection = () => {
  //  const Mobile = window.matchMedia('(max-width: 480px)').matches;
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeIcon, setActiveIcon] = useState(null);
  // displayedIcon is the content currently shown - changes AFTER exit animation
  const [displayedIcon, setDisplayedIcon] = useState(null);
  const [transitionDirection, setTransitionDirection] = useState("down"); // 'down' = top-to-bottom, 'up' = bottom-to-top
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth > 1024;
  });

  // Map icon names to their section components
  const sectionComponents = {
    home: HeroSection,
    "set-profile": ProfileSection,
    discoverable: LedgerSection,
    "post-job": PostJobSection,
    "direct-contract": DirectContractSection,
    "job-progress": JobProgressSection,
    "raise-dispute": DisputeSection,
    "earn-token": EarnTokenSection,
    dao: GovernanceSection,
    multichain: MultiChainSection,
    architecture: ArchitectureSection,
    revolution: RevolutionSection,
    contact: ContactSection,
  };

  const iconConfigs = [
    {
      name: "set-profile",
      label: "Set Profile",
      sectionId: "lp-2-section",
      icon: "/assets/icons/setprofile.svg",
      className: "icon-set-profile",
    },
    {
      name: "discoverable",
      label: "Discoverable",
      sectionId: "lp-3-section",
      icon: "/assets/icons/discoverable.svg",
      className: "icon-discoverable",
    },
    {
      name: "post-job",
      label: "Post Job",
      sectionId: "lp-4-section",
      icon: "/assets/icons/postjob.svg",
      className: "icon-post-job",
    },
    {
      name: "direct-contract",
      label: "Direct Contract",
      sectionId: "lp-5-section",
      icon: "/assets/icons/directcontract.svg",
      className: "icon-direct-contract",
    },
    {
      name: "job-progress",
      label: "Job Progress",
      sectionId: "lp-6-section",
      icon: "/assets/icons/jobprogress.svg",
      className: "icon-job-progress",
    },
    {
      name: "raise-dispute",
      label: "Raise Dispute",
      sectionId: "lp-7-section",
      icon: "/assets/icons/raisedispute.svg",
      className: "icon-raise-dispute",
    },
    {
      name: "earn-token",
      label: "Earn Token",
      sectionId: "lp-8-section",
      icon: "/assets/icons/earntoken.svg",
      className: "icon-earn-token",
    },
    {
      name: "dao",
      label: "DAO",
      sectionId: "lp-9-section",
      icon: "/assets/icons/dao.svg",
      className: "icon-dao",
    },
    {
      name: "multichain",
      label: "Multi Chain",
      sectionId: "lp-10-section",
      icon: "/assets/icons/multichain.svg",
      className: "icon-multichain",
    },
    {
      name: "architecture",
      label: "Architecture",
      sectionId: "lp-11-section",
      icon: "/assets/icons/architecture.svg",
      className: "icon-architecture",
    },
    {
      name: "revolution",
      label: "Revolution",
      sectionId: "lp-12-section",
      icon: "/assets/icons/revolution.svg",
      className: "icon-revolution",
    },
  ];

  const iconOrder = iconConfigs.map((icon) => icon.name);
  const defaultCenterIndex = Math.max(0, iconOrder.indexOf("direct-contract"));
  const [activeIndex, setActiveIndex] = useState(defaultCenterIndex);

  // Ref to track scroll cooldown to prevent rapid section changes
  const scrollCooldownRef = useRef(false);
  const lastScrollTimeRef = useRef(0);

  const sectionMap = iconConfigs.reduce((map, icon) => {
    map[icon.sectionId] = icon.name;
    return map;
  }, {});

  const sectionOrder = iconConfigs.map((icon) => icon.sectionId);

  const CENTER_SLOT_INDEX = 2;
  const curveSlots = [
    // { left: 108, top: '4%' },
    { left: 360, top: "1%" },
    { left: 210, top: "30%" },

    { left: 195, top: "46%" },
    { left: 210, top: "59%" },
    { left: 235, top: "67%" },
    { left: 259, top: "74%" },
    { left: 279, top: "95%" },
    { left: 74, top: "122%" },
    { left: 296, top: "136%" },
    { left: 218, top: "150%" },
  ];

  const getIconStyle = (iconIndex) => {
    if (!isExpanded) return undefined;
    const slotIndex = iconIndex - activeIndex + CENTER_SLOT_INDEX;

    if (slotIndex >= 0 && slotIndex < curveSlots.length) {
      const slot = curveSlots[slotIndex];
      return {
        left: `${slot.left}px`,
        top: slot.top,
        opacity: 1,
      };
    }

    const offscreenSlot =
      slotIndex < 0 ? curveSlots[0] : curveSlots[curveSlots.length - 1];
    return {
      left: `${slotIndex < 0 ? offscreenSlot.left - 20 : offscreenSlot.left + 20}px`,
      top: slotIndex < 0 ? "-10%" : "135%",
      opacity: 0,
    };
  };

  // Auto-expand sidebar and detect active section based on scroll
  // DISABLED: Icons should only move when clicked, not on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!isDesktop) {
        setIsExpanded(false);
        setActiveIcon(null);
        return;
      }

      // Only collapse when scrolling back to hero section, don't auto-expand or move icons on scroll
      const heroSection = document.querySelector(".lp-1-section");
      if (heroSection) {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        const scrollPosition = window.scrollY;

        // If scrolled back to hero section, collapse
        if (scrollPosition < heroBottom - 200) {
          setIsExpanded(false);
          setActiveIcon(null);
        }
        // Don't auto-expand or change active icon on scroll down
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDesktop]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Add class to body when sidebar is expanded
  useEffect(() => {
    if (isExpanded) {
      document.body.classList.add("sidebar-expanded");
    } else {
      document.body.classList.remove("sidebar-expanded");
    }
    return () => document.body.classList.remove("sidebar-expanded");
  }, [isExpanded]);

  // Listen for header logo clicks from other components (dispatches 'openwork-home')
  useEffect(() => {
    const handleExternalHome = () => {
      // Collapse expanded content and reset active states (same as clicking Home)
      setIsExpanded(false);
      setActiveIcon(null);
      setDisplayedIcon(null);

      // Scroll to hero section to match header behavior
      const hero = document.getElementById("lp-1-section");
      if (hero) {
        const target = Math.max(hero.offsetTop - 80, 0);
        window.scrollTo({ top: target, behavior: "smooth" });
      }
    };

    window.addEventListener("openwork-home", handleExternalHome);
    return () =>
      window.removeEventListener("openwork-home", handleExternalHome);
  }, []);

  const getMobileNavOffset = () => {
    if (typeof window === "undefined") return 0;
    const isMobile = window.matchMedia("(max-width: 480px)").matches;
    if (!isMobile) return 0;
    const header = document.querySelector(".landing-header");
    const headerHeight = header ? header.offsetHeight : 0;
    return headerHeight + 16;
  };

  const handleIconClick = (iconName, sectionId) => {
    // On mobile/tablet (≤1024px), scroll to section instead of expanding
    // Don't set active state so labels only show on hover
    if (!isDesktop) {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    if (activeIcon === iconName) {
      setIsExpanded(false);
      setActiveIcon(null);
      return;
    }

    let newIndex = iconOrder.indexOf(iconName);
    // Handle contact icon specially (it's at index 11, after all iconConfigs)
    if (iconName === "contact") {
      newIndex = 11;
    }

    // Determine direction based on previous vs new index
    // If no previous activeIcon (first click), always come from right
    if (newIndex !== -1) {
      const prevIndex = activeIcon
        ? activeIcon === "contact"
          ? 11
          : iconOrder.indexOf(activeIcon)
        : -1;
      const direction =
        prevIndex === -1 || newIndex > prevIndex ? "down" : "up";
      setTransitionDirection(direction);
      setActiveIndex(newIndex);
    }

    // For first click (no activeIcon yet), add a small delay to let expanded styles apply first
    // This prevents laggy first transition by allowing CSS transitions to kick in
    if (!isExpanded) {
      setIsExpanded(true);
      // Double requestAnimationFrame ensures browser has painted the expanded state
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setActiveIcon(iconName);
        });
      });
    } else {
      // Already expanded, just switch icons immediately
      setActiveIcon(iconName);
    }
  };

  // Add sliding transition class to expanded content based on direction
  useEffect(() => {
    const contentArea = document.querySelector(".expanded-content-area");
    let cleanup = null;

    // If this is the first time expanding (no previous content), wait for the glow transition
    // to finish on desktop so content does not appear earlier than the glow/sidebar.
    if (!displayedIcon && activeIcon) {
      const iconToShow = activeIcon;

      if (isExpanded) {
        const glowEl = document.querySelector(".radiant-glow-container");
        let fallbackTimer = null;

        const showContent = () => {
          // Ensure user hasn't changed selection or collapsed in the meantime
          if (!isExpanded || activeIcon !== iconToShow) return;

          setDisplayedIcon(iconToShow);

          // Wait until after render, then animate the new content in
          requestAnimationFrame(() => {
            const newContentArea = document.querySelector(
              ".expanded-content-area",
            );
            if (newContentArea) {
              newContentArea.classList.add("slide-in-right");
              const removeClass = () => {
                newContentArea.classList.remove("slide-in-right");
                newContentArea.removeEventListener("animationend", removeClass);
              };
              newContentArea.addEventListener("animationend", removeClass);
            }
          });
        };

        if (glowEl) {
          // Start content slightly after expansion begins so it overlaps with the glow forming.
          // This gives the appearance of content coming in from the right while the glow expands.
          const earlyDelay = 10; // ms overlap before glow completes
          const earlyTimer = setTimeout(() => {
            if (!isExpanded || activeIcon !== iconToShow) return;
            // Only show if we haven't already
            if (!displayedIcon) showContent();
          }, earlyDelay);

          const onTransitionEnd = (e) => {
            // Wait specifically for width/height transition that indicates expansion finished
            if (e.target !== glowEl) return;
            if (e.propertyName === "width" || e.propertyName === "height") {
              if (!displayedIcon) showContent();
              glowEl.removeEventListener("transitionend", onTransitionEnd);
              if (fallbackTimer) clearTimeout(fallbackTimer);
            }
          };

          glowEl.addEventListener("transitionend", onTransitionEnd);

          // Fallback: in case transitionend doesn't fire (browser quirks), show after 700ms
          fallbackTimer = setTimeout(() => {
            if (!displayedIcon) showContent();
            glowEl.removeEventListener("transitionend", onTransitionEnd);
          }, 700);

          cleanup = () => {
            glowEl.removeEventListener("transitionend", onTransitionEnd);
            if (fallbackTimer) clearTimeout(fallbackTimer);
            clearTimeout(earlyTimer);
          };
        } else {
          // No glow element found — fallback to a small early timeout so content still overlaps
          const t = setTimeout(() => showContent(), 160);
          cleanup = () => clearTimeout(t);
        }
      } else {
        // Not expanded (mobile/tablet): show immediately
        setDisplayedIcon(iconToShow);
        if (contentArea) {
          contentArea.classList.add("slide-in-right");
          const removeClass = () => {
            contentArea.classList.remove("slide-in-right");
            contentArea.removeEventListener("animationend", removeClass);
          };
          contentArea.addEventListener("animationend", removeClass);
        }
      }

      return () => {
        if (cleanup) cleanup();
      };
    }

    // If activeIcon changed and we have existing content, animate the transition
    if (
      contentArea &&
      displayedIcon &&
      activeIcon &&
      activeIcon !== displayedIcon
    ) {
      // Remove any existing animation classes
      contentArea.classList.remove(
        "slide-in-right",
        "slide-in-left",
        "slide-out-left",
        "slide-out-right",
      );

      // Force reflow to restart animation
      void contentArea.offsetWidth;

      // Determine animation classes based on direction
      // Going DOWN: old content exits LEFT, new content enters from RIGHT
      // Going UP: old content exits RIGHT, new content enters from LEFT
      const exitClass =
        transitionDirection === "down" ? "slide-out-left" : "slide-out-right";
      const enterClass =
        transitionDirection === "down" ? "slide-in-right" : "slide-in-left";

      // Apply exit animation to CURRENT (old) content
      contentArea.classList.add(exitClass);

      // After exit animation, swap content and apply enter animation
      setTimeout(() => {
        // Now swap to the new content
        setDisplayedIcon(activeIcon);

        // Wait for React to render the new content, then animate it in
        requestAnimationFrame(() => {
          const newContentArea = document.querySelector(
            ".expanded-content-area",
          );
          if (newContentArea) {
            newContentArea.classList.remove(exitClass);
            void newContentArea.offsetWidth; // Force reflow
            newContentArea.classList.add(enterClass);

            const removeClass = () => {
              newContentArea.classList.remove(
                "slide-in-right",
                "slide-in-left",
                "slide-out-left",
                "slide-out-right",
              );
              newContentArea.removeEventListener("animationend", removeClass);
            };
            newContentArea.addEventListener("animationend", removeClass);
          }
        });
      }, 400); // Wait for exit animation to mostly complete
    }

    // Handle closing (going back to hero)
    if (!activeIcon && displayedIcon) {
      if (contentArea) {
        contentArea.classList.add("slide-out-left");
        setTimeout(() => {
          setDisplayedIcon(null);
        }, 400);
      } else {
        setDisplayedIcon(null);
      }
    }
  }, [activeIcon, transitionDirection, displayedIcon, isExpanded]);

  // Old scroll-based navigation (disabled)
  const handleIconClickOld = (iconName, sectionId) => {
    setActiveIcon(iconName);
    const targetSection = document.getElementById(sectionId);

    if (targetSection) {
      // Find current visible section
      const allSections = document.querySelectorAll(".lp-section");
      const currentScrollY = window.scrollY;
      const targetSectionTop = targetSection.offsetTop;
      const scrollOffset = getMobileNavOffset();
      const targetScrollY = Math.max(targetSectionTop - scrollOffset, 0);

      let currentSection = null;
      allSections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;
        if (
          currentScrollY >= sectionTop - 100 &&
          currentScrollY < sectionBottom - 100
        ) {
          currentSection = section;
        }
      });

      // Skip if clicking on current section
      if (currentSection === targetSection) return;

      // Determine direction
      const isGoingDown = targetSectionTop > currentScrollY;

      // Check if we're in hero section
      const isFromHero = currentSection?.classList.contains("lp-1-section");

      // Clean up any existing animation classes
      allSections.forEach((section) => {
        section.classList.remove(
          "page-transition-down",
          "page-transition-up",
          "page-slide-out-left",
          "page-slide-out-right",
          "page-transition-from-hero",
        );
      });

      // If from hero, just expand the sidebar (don't slide hero out)
      if (isFromHero) {
        setIsExpanded(true);

        // Instant scroll to target
        window.scrollTo({
          top: targetScrollY,
          behavior: "instant",
        });

        // Animate target section expanding from center
        void targetSection.offsetWidth;
        targetSection.classList.add("page-transition-from-hero");

        // Clean up after animation
        setTimeout(() => {
          allSections.forEach((section) => {
            section.classList.remove("page-transition-from-hero");
          });
        }, 600);
        return;
      } else if (currentSection) {
        // Animate current section sliding out (not hero)
        currentSection.classList.add(
          isGoingDown ? "page-slide-out-left" : "page-slide-out-right",
        );
      }

      // Instant scroll to target
      window.scrollTo({
        top: targetScrollY,
        behavior: "instant",
      });

      // Animate target section sliding in
      void targetSection.offsetWidth;
      targetSection.classList.add(
        isGoingDown ? "page-transition-down" : "page-transition-up",
      );

      // Clean up after animation
      setTimeout(() => {
        allSections.forEach((section) => {
          section.classList.remove(
            "page-transition-down",
            "page-transition-up",
            "page-slide-out-left",
            "page-slide-out-right",
          );
        });
      }, 600);
    }
  };

  const handleLearnMore = () => {
    const learnMoreSection = document.getElementById("lp-2-section");
    if (!learnMoreSection) return;
    const scrollOffset = getMobileNavOffset();
    const target = Math.max(learnMoreSection.offsetTop - scrollOffset, 0);
    window.scrollTo({
      top: target,
      behavior: "smooth",
    });
  };

  const handleBotClick = () => {
    window.open("https://app.openwork.technology/oppy", "_blank");
  };

  const handleHomeClick = () => {
    // Collapse expanded state (no scrolling needed since we stay in hero)
    setIsExpanded(false);
    setActiveIcon(null);
  };

  // Handle scroll/wheel events to navigate between sections
  const handleWheelNavigation = useCallback(
    (e) => {
      // Only handle wheel events on desktop
      if (!isDesktop) return;

      // Check cooldown to prevent rapid navigation
      const now = Date.now();
      if (scrollCooldownRef.current || now - lastScrollTimeRef.current < 600) {
        e.preventDefault();
        return;
      }

      // Determine scroll direction
      const delta = e.deltaY;
      if (Math.abs(delta) < 30) return; // Ignore small scroll movements

      e.preventDefault();
      scrollCooldownRef.current = true;
      lastScrollTimeRef.current = now;

      // If not expanded and scrolling down, expand and go to first section (set-profile)
      if (!isExpanded && delta > 0) {
        const firstIcon = iconConfigs[0];
        handleIconClick(firstIcon.name, firstIcon.sectionId);
        setTimeout(() => {
          scrollCooldownRef.current = false;
        }, 500);
        return;
      }

      // If not expanded and scrolling up, do nothing
      if (!isExpanded) {
        scrollCooldownRef.current = false;
        return;
      }

      // Get current index in iconConfigs (contact is special case at end)
      const allSections = [...iconOrder, "contact"];
      const currentIndex =
        activeIcon === "contact"
          ? allSections.length - 1
          : iconOrder.indexOf(activeIcon);

      let newIndex;
      if (delta > 0) {
        // Scrolling down - go to next section
        newIndex = Math.min(currentIndex + 1, allSections.length - 1);
      } else {
        // Scrolling up - go to previous section
        newIndex = Math.max(currentIndex - 1, -1);
      }

      // If going before first section, collapse to home
      if (newIndex < 0) {
        setIsExpanded(false);
        setActiveIcon(null);
        scrollCooldownRef.current = false;
        return;
      }

      const newIconName = allSections[newIndex];
      const newSectionId =
        newIconName === "contact"
          ? "lp-13-section"
          : iconConfigs[newIndex]?.sectionId;

      if (newIconName && newIconName !== activeIcon) {
        // Trigger the same behavior as clicking an icon
        handleIconClick(newIconName, newSectionId);
      }

      // Reset cooldown after animation completes
      setTimeout(() => {
        scrollCooldownRef.current = false;
      }, 500);
    },
    [isExpanded, isDesktop, activeIcon, iconOrder, iconConfigs],
  );

  // Add wheel event listener for section navigation
  useEffect(() => {
    if (!isDesktop) return;

    const mainElement = document.querySelector(".landing-main");
    if (!mainElement) return;

    const wheelHandler = (e) => handleWheelNavigation(e);

    // Use passive: false to allow preventDefault
    mainElement.addEventListener("wheel", wheelHandler, { passive: false });

    return () => {
      mainElement.removeEventListener("wheel", wheelHandler);
    };
  }, [handleWheelNavigation, isDesktop]);

  return (
    <section id="lp-1-section" className="lp-section lp-1-section">
      <main className={`landing-main ${isExpanded ? "expanded" : ""}`}>
        {/* Glow Wrapper with Mask */}
        <div className="glow-wrapper">
          {/* Radiant Glow Background */}
          <div className="radiant-glow-container"></div>
        </div>

        {/* Background Circle Group */}
        <div className="circle-group">
          {/* Main Circle */}
          <img
            src="/assets/f0a5bddf438bec766e653cd0886722bed6ea4ee3.svg"
            alt=""
            className="main-circle-bg"
          />
          {/* Rotating Arc Border */}
          <div className="circle-arc" aria-hidden="true">
            <svg
              viewBox="0 0 600 600"
              className="circle-arc-svg"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient
                  id="arcGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#1246FF" stopOpacity="1" />
                  <stop offset="100%" stopColor="#1246FF" stopOpacity="1" />
                </linearGradient>
                <filter
                  id="arcGlow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="6" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* top arc only */}
              <path
                d="M 24 300 A 276 276 0 0 1 576 300"
                stroke="url(#arcGradient)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                filter="url(#arcGlow)"
              />
            </svg>
          </div>
        </div>

        {/* Floating Icon Buttons - Icons move along the curve, active icon at center */}
        <div
          className={`floating-icons ${isExpanded ? `active-pos-${activeIndex}` : ""}`}
        >
          {/* Traveling glow elements for curves */}
          <div className="traveling-glow"></div>
          <div className="traveling-glow-bottom"></div>
          {iconConfigs.map((icon, index) => (
            <Button
              key={icon.name}
              icon={icon.icon}
              buttonCss={`icon-btn ${icon.className} ${activeIcon === icon.name ? "active" : ""}`}
              label={icon.label}
              onClick={() => handleIconClick(icon.name, icon.sectionId)}
              style={getIconStyle(index)}
            />
          ))}

          {/* Home icon - visible only when sidebar is expanded (hidden in hero) */}
          <Button
            icon={
              "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M6 14V9.06666C6 8.69329 6 8.5066 6.07266 8.364C6.13658 8.23855 6.23857 8.13657 6.36401 8.07265C6.50661 7.99999 6.6933 7.99999 7.06667 7.99999H8.93333C9.3067 7.99999 9.49339 7.99999 9.63599 8.07265C9.76144 8.13657 9.86342 8.23855 9.92734 8.364C10 8.5066 10 8.69329 10 9.06666V14M7.34513 1.84267L2.82359 5.35942C2.52135 5.5945 2.37022 5.71204 2.26135 5.85924C2.16491 5.98963 2.09307 6.13652 2.04935 6.2927C2 6.46901 2 6.66046 2 7.04337V11.8667C2 12.6134 2 12.9868 2.14532 13.272C2.27316 13.5229 2.47713 13.7268 2.72801 13.8547C3.01323 14 3.3866 14 4.13333 14H11.8667C12.6134 14 12.9868 14 13.272 13.8547C13.5229 13.7268 13.7268 13.5229 13.8547 13.272C14 12.9868 14 12.6134 14 11.8667V7.04337C14 6.66046 14 6.46901 13.9506 6.2927C13.9069 6.13652 13.8351 5.98963 13.7386 5.85924C13.6298 5.71204 13.4787 5.5945 13.1764 5.35942L8.65487 1.84267C8.42065 1.6605 8.30354 1.56941 8.17423 1.5344C8.06013 1.50351 7.93987 1.50351 7.82577 1.5344C7.69646 1.56941 7.57935 1.6605 7.34513 1.84267Z' stroke='%23535353' stroke-width='0.666667' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"
            }
            buttonCss={`icon-btn icon-home ${activeIcon === "home" ? "active" : ""}`}
            label="Home"
            onClick={() => handleHomeClick()}
          />

          {/* Contact icon - visible only when sidebar is expanded, at bottom */}
          <Button
            icon={
              "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M21 5H3a2 2 0 00-2 2v10a2 2 0 002 2h18a2 2 0 002-2V7a2 2 0 00-2-2z' stroke='%231246FF' stroke-width='1.6' fill='none'/%3E%3Cpath d='M3 7l9 6 9-6' stroke='%231246FF' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E"
            }
            buttonCss={`icon-btn icon-contact ${activeIcon === "contact" ? "active" : ""}`}
            label="Contact"
            onClick={() => handleIconClick("contact", "lp-13-section")}
          />
        </div>

        {/* Navbar Floating Icons for Mobile */}
        <div className="navbar-floating-icons">
          <Button
            icon="/assets/f424bb301166452f1d2aae2badd19051c2788323.svg"
            buttonCss="navbar-icon-btn navbar-icon-bot"
            onClick={handleBotClick}
          />
          <Button
            icon="/assets/203519ed928f5759c5c5434e7d71de7598f55b96.svg"
            buttonCss="navbar-icon-btn navbar-icon-2"
            onClick={() =>
              window.open(
                "https://app.openwork.technology/docs",
                "_blank",
              )
            }
          />
          <Button
            icon="/assets/141ae2395558d7fc65c358b46cf1beaa163ad655.svg"
            buttonCss="navbar-icon-btn navbar-icon-3"
            onClick={() =>
              window.open("https://drive.google.com/file/d/1tdpuAM3UqiiP_TKJMa5bFtxOG4bU_6ts/view", "_blank")
            }
          />
        </div>

        {/* Center Content */}
        <div className="center-content">
          <div className="text-content">
            <h1 className="main-heading">
              The future of work is decentralised.
            </h1>
            <p className="main-description">
              OpenWork is a decentralised work protocol, allowing people & bots
              to work directly with each other using blockchain technology, with
              decentralised governance.
            </p>
          </div>

          <button
            className={isDesktop ? "lp-blue-button" : "lp-blue-button-1"}
            onClick={handleLearnMore}
          >
            {isDesktop ? "Get Started" : "Learn More"}
            <img
              src="/assets/b16a6ff87b2913f8bdc303dda7816c024bd687cb.svg"
              alt=""
              className="lp-button-icon lp-button-icon-home"
            />
          </button>
        </div>

        {/* Expanded Content Area - renders section content inside hero */}
        {/* Use displayedIcon (not activeIcon) so content changes AFTER exit animation */}
        {isExpanded && displayedIcon && sectionComponents[displayedIcon] && (
          <div className="expanded-content-area">
            {React.createElement(sectionComponents[displayedIcon])}
          </div>
        )}
      </main>
    </section>
  );
};

export default HeroSection;

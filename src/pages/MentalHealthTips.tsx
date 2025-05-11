import React, { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

// Mental health tips data with images
const mentalHealthTips = [
  {
    id: 1,
    title: "Practice Mindfulness",
    description: "Take a few minutes each day to sit quietly and focus on your breath. Mindfulness can help reduce stress and improve your mental clarity.",
    image: "/assets/img/1.jpeg",
    caption: "Find your center",
    subtitle: "Mindfulness Practice"
  },
  {
    id: 2,
    title: "Stay Connected",
    description: "Maintain regular contact with friends and family. Social connections are vital for emotional well-being and provide support during difficult times.",
    image: "/assets/img/2.jpeg",
    caption: "We're stronger together",
    subtitle: "Social Connection"
  },
  {
    id: 3,
    title: "Physical Activity",
    description: "Regular exercise releases endorphins that improve mood and reduce stress. Even a short daily walk can make a significant difference.",
    image: "/assets/img/3.jpeg",
    caption: "Move your body, clear your mind",
    subtitle: "Active Lifestyle"
  }
];

// CSS for Codrops-style animations - Exact copy from demo1.css and shared.css
const carouselCSS = `
  /* Base styles */
  * {
    min-width: 0;
    min-height: 0;
  }

  :root {
    background: var(--color-bg);
  }

  a {
    font-weight: 500;
  }

  a:not(:hover,:focus-visible,[aria-current="page"]) {
    color: color-mix(in srgb, currentColor 60%, transparent);
  }

  /* Page loader */
  :root[data-js][data-loading] body::before,
  :root[data-js][data-loading] body::after {
    content: '';
    position: absolute;
    z-index: 30;
  }

  :root[data-js][data-loading] body::before {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--color-bg);
  }

  :root[data-js][data-loading] body::after {
    top: 50%;
    left: 50%;
    width: 60px;
    height: 60px;
    margin: -30px 0 0 -30px;
    border-radius: 50%;
    opacity: 0.4;
    background: currentColor;
    animation: loaderAnim 0.7s linear infinite alternate forwards;
  }

  @keyframes loaderAnim {
    to {
      opacity: 1;
      transform: scale3d(0.5,0.5,1);
    }
  }

  /* Utility classes */
  .overlap {
    display: grid;
    grid-template-areas: "overlap";
  }

  .overlap > * {
    grid-area: overlap;
  }

  .scrollbar-hidden {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hidden::-webkit-scrollbar {
    display: none;
  }

  /* Animation classes */
  .animate-grow {
    animation: grow linear both;
  }

  .animate-page {
    animation: page linear both;
  }

  .animate-progress {
    animation: progress linear both;
  }

  .animate-text {
    animation: text linear both;
  }

  .animate-text-up {
    animation: text-up linear both;
  }

  /* Keyframes */
  @keyframes grow {
    0% {
      clip-path: inset(0 25% round 35cqmin);
      transform: translateX(70%) scale(0.15);
    }
    58.75% {
      clip-path: inset(0 round 0);
      transform: none;
    }
    100% {
      transform: scale(1.5) translateX(-16%);
    }
  }

  @keyframes page {
    0%, 100% {
      opacity: 0.5
    }
    58% {
      opacity: 1;
    }
  }

  @keyframes progress {
    from {
      transform: scaleX(calc(1/var(--slides)));
    }
  }

  @keyframes text {
    0%, 25% {
      opacity: 0;
    }
    50% {
      opacity: 1;
      transform: none;
    }
    75%, 100% {
      opacity: 0;
    }
  }

  @keyframes text-up {
    0%, 25% {
      opacity: 0.5;
      transform: translateY(105%);
    }
    50% {
      opacity: 1;
      transform: none;
    }
    75%, 100% {
      opacity: 0.5;
      transform: translateY(-105%);
    }
  }
`;

const MentalHealthTips = () => {
  const { theme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Add CSS and setup scroll-driven animations - Exact implementation from the demo
  useEffect(() => {
    // Create a style element for the carousel CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = carouselCSS;
    document.head.appendChild(styleElement);

    // Add the necessary attributes to the document for the carousel animation
    document.documentElement.setAttribute('data-js', '');
    document.documentElement.classList.add('[--color-bg:theme(colors.black)]', 'text-white', 'antialiased');
    document.documentElement.setAttribute('data-loading', '');

    // Remove loading attribute when component is mounted
    const timeout = setTimeout(() => {
      document.documentElement.removeAttribute('data-loading');
    }, 500);

    // Check for scroll-driven animations support
    const supportsScrollDrivenAnimations = CSS.supports('animation-timeline: scroll()') ||
      CSS.supports('animation-timeline: view()');

    if (supportsScrollDrivenAnimations) {
      document.documentElement.classList.add('supports-sda');
    }

    return () => {
      // Clean up when component unmounts
      document.head.removeChild(styleElement);
      clearTimeout(timeout);
      document.documentElement.removeAttribute('data-js');
      document.documentElement.removeAttribute('data-loading');
      document.documentElement.classList.remove('[--color-bg:theme(colors.black)]', 'text-white', 'antialiased', 'supports-sda');
    };
  }, []);

  // Handle scroll events for manual navigation
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const handleScroll = () => {
      const slideWidth = scroller.scrollWidth / mentalHealthTips.length;
      const currentIndex = Math.round(scroller.scrollLeft / slideWidth);
      if (currentIndex !== currentSlide && currentIndex >= 0 && currentIndex < mentalHealthTips.length) {
        setCurrentSlide(currentIndex);
      }
    };

    scroller.addEventListener('scroll', handleScroll);
    return () => {
      scroller.removeEventListener('scroll', handleScroll);
    };
  }, [currentSlide]);

  // Navigate to a specific slide
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    const slideElement = document.getElementById(`slide-${index + 1}`);
    if (slideElement) {
      slideElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold mb-6">Mental Health Tips</h1>
        <p className="text-muted-foreground mb-8 max-w-3xl">
          Explore these evidence-based strategies to improve your mental well-being and emotional resilience.
        </p>

        {/* Exact copy of the Codrops carousel structure */}
        <div
          className="@container min-h-screen relative isolate flex flex-col gap-8 supports-sda:pointer-events-none overflow-clip rounded-xl mb-12"
          style={{
            timelineScope: "--scroller, --slide-1, --slide-2, --slide-3",
            "--slides": "3"
          }}
        >
          {/* Background Images */}
          {mentalHealthTips.map((tip, index) => (
            <img
              key={tip.id}
              className="absolute hidden supports-sda:block -z-20 inset-0 h-full w-full object-cover animate-grow"
              style={{ animationTimeline: `--slide-${index + 1}` }}
              src={tip.image}
              alt={tip.title}
            />
          ))}

          {/* Scroll Container */}
          <div
            ref={scrollerRef}
            className="absolute hidden supports-sda:block -z-10 inset-0 h-full w-full overflow-x-auto snap-mandatory scroll-smooth snap-x scrollbar-hidden pointer-events-auto"
            style={{ scrollTimeline: "--scroller x" }}
          >
            <div className="grid grid-flow-col auto-cols-[70cqw] pr-[30cqw] h-full w-fit">
              {mentalHealthTips.map((tip, index) => (
                <div
                  key={tip.id}
                  id={`slide-${index + 1}`}
                  role="none"
                  className="snap-start"
                  style={{ viewTimeline: `--slide-${index + 1} x` }}
                ></div>
              ))}
            </div>
          </div>

          {/* Header with Navigation */}
          <header className="frame relative z-50 mx-7 flex max-lg:flex-col justify-between py-6 border-b gap-2 border-white/60 pointer-events-auto">
            <div className="whitespace-nowrap">
              <h1 className="font-bold inline align-middle">Mental Health Tips</h1>
            </div>
            <nav className="flex items-center gap-10">
              {mentalHealthTips.map((_, index) => (
                <a
                  key={index}
                  href={`#slide-${index + 1}`}
                  className="animate-page !text-white pointer-events-auto"
                  style={{ animationTimeline: `--slide-${index + 1}`, animationRangeStart: "30cqw" }}
                  aria-current={index === currentSlide ? "page" : undefined}
                >
                  {String(index + 1).padStart(2, '0')}
                </a>
              ))}
            </nav>
          </header>

          {/* Main Content */}
          <div className="flex-1 px-7 relative hidden supports-sda:flex flex-col gap-[inherit]">
            {/* Slides */}
            <div className="overlap w-[17rem]">
              {mentalHealthTips.map((tip, index) => (
                <p
                  key={tip.id}
                  className="animate-text translate-y-[50%] skew-y-[1.5deg]"
                  style={{ animationTimeline: `--slide-${index + 1}`, animationRangeStart: "30cqw" }}
                >
                  {tip.description}
                </p>
              ))}
            </div>

            {/* Indicator */}
            <div className="w-60 my-auto">
              <nav className="flex font-medium text-sm gap-5">
                {mentalHealthTips.map((_, index) => (
                  <a
                    key={index}
                    href={`#slide-${index + 1}`}
                    className="animate-page !text-white pointer-events-auto"
                    style={{ animationTimeline: `--slide-${index + 1}`, animationRangeStart: "30cqw" }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </a>
                ))}
              </nav>
              <div className="bg-white/60 mt-2">
                <div
                  ref={progressRef}
                  className="bg-white h-0.5 animate-progress origin-left"
                  style={{ animationTimeline: "--scroller" }}
                ></div>
              </div>
            </div>

            {/* Captions */}
            <div className="overlap items-end w-[31rem]">
              {mentalHealthTips.map((tip, index) => (
                <div key={tip.id}>
                  <span className="block overflow-clip">
                    <span
                      className="block uppercase font-medium tracking-widest mb-4 animate-text-up"
                      style={{ animationTimeline: `--slide-${index + 1}`, animationRangeStart: "30cqw" }}
                    >
                      {tip.subtitle}
                    </span>
                  </span>
                  <p
                    className="pb-7 font-serif text-8xl animate-text translate-y-[205%] skew-y-6"
                    style={{ animationTimeline: `--slide-${index + 1}`, animationRangeStart: "30cqw" }}
                  >
                    {tip.caption}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Fallback for browsers that don't support scroll-driven animations */}
          <div className="supports-sda:hidden px-7 pb-7">
            Your browser does not support scroll-driven animations. See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations" target="_blank" rel="noopener noreferrer">MDN</a> for browser compatibility tables.
          </div>
        </div>

        {/* Additional Mental Health Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Daily Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-xl">🌱</span>
                  <span>Start a gratitude journal</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-xl">🧠</span>
                  <span>Practice positive self-talk</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-xl">🌿</span>
                  <span>Spend time in nature</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-xl">📝</span>
                  <span>Set realistic goals</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Stress Management</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-xl">🧘</span>
                  <span>Deep breathing exercises</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-xl">🎵</span>
                  <span>Listen to calming music</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-xl">🛀</span>
                  <span>Take relaxing baths</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-xl">🧩</span>
                  <span>Engage in creative hobbies</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>When to Seek Help</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">It's important to recognize when professional help is needed. Consider reaching out if you experience:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <span>Persistent feelings of sadness</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <span>Overwhelming anxiety</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <span>Significant changes in sleep or appetite</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default MentalHealthTips;

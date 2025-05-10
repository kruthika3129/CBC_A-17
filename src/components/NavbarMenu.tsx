
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

type MenuItemType = {
  title: string;
  href: string;
  description?: string;
};

const featuredItems: MenuItemType[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Track your emotional well-being and progress"
  },
  {
    title: "Journal",
    href: "/journal",
    description: "Document your thoughts and feelings"
  },
  {
    title: "About",
    href: "/about",
    description: "Learn more about PsyTrack"
  },
];

const resourceItems: MenuItemType[] = [
  {
    title: "Mental Health Tips",
    href: "#mental-health-tips",
    description: "Expert advice for your well-being"
  },
  {
    title: "Guided Sessions",
    href: "#guided-sessions",
    description: "Follow along with therapeutic exercises"
  },
  {
    title: "Community",
    href: "#community",
    description: "Connect with others on similar journeys"
  },
];

export function NavbarMenu({ className }: { className?: string }) {
  const [activeItem, setActiveItem] = useState<MenuItemType | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-center gap-2">
        <button
          onMouseEnter={() => {
            setIsMenuOpen(true);
            setActiveItem(featuredItems[0]);
          }}
          onClick={() => {
            setIsMenuOpen(!isMenuOpen);
            if (!isMenuOpen) setActiveItem(featuredItems[0]);
          }}
          className="px-4 py-2 rounded-md hover:bg-white/10 transition-colors text-sm font-medium"
        >
          Features
        </button>
        <button
          onMouseEnter={() => {
            setIsMenuOpen(true);
            setActiveItem(resourceItems[0]);
          }}
          onClick={() => {
            setIsMenuOpen(!isMenuOpen);
            if (!isMenuOpen) setActiveItem(resourceItems[0]);
          }}
          className="px-4 py-2 rounded-md hover:bg-white/10 transition-colors text-sm font-medium"
        >
          Resources
        </button>
      </div>

      {isMenuOpen && (
        <div
          onMouseLeave={() => setIsMenuOpen(false)}
          className="absolute top-full left-0 w-full mt-2 glass-morphism neo-blur rounded-xl overflow-hidden z-50"
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex w-full"
          >
            <div className="w-1/4 bg-black/20 p-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium opacity-60">Features</p>
                {featuredItems.map((item) => (
                  <button
                    key={item.title}
                    onMouseEnter={() => setActiveItem(item)}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      activeItem?.title === item.title
                        ? "bg-white/20 text-white"
                        : "hover:bg-white/10 text-white/70 hover:text-white"
                    )}
                  >
                    <span>{item.title}</span>
                  </button>
                ))}
                <div className="mt-2">
                  <p className="text-sm font-medium opacity-60">Resources</p>
                  {resourceItems.map((item) => (
                    <button
                      key={item.title}
                      onMouseEnter={() => setActiveItem(item)}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        activeItem?.title === item.title
                          ? "bg-white/20 text-white"
                          : "hover:bg-white/10 text-white/70 hover:text-white"
                      )}
                    >
                      <span>{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="w-3/4 p-6">
              {activeItem && (
                <div className="w-full h-full">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="flex flex-col gap-2"
                  >
                    <h3 className="text-xl font-medium">{activeItem.title}</h3>
                    <p className="text-sm opacity-70">{activeItem.description}</p>
                    <Link
                      to={activeItem.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="mt-4 px-4 py-2 bg-gradient-to-r from-psytrack-purple to-psytrack-deep-purple rounded-md text-white text-sm font-medium hover:opacity-90 transition-opacity inline-block w-max"
                    >
                      Explore {activeItem.title}
                    </Link>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default NavbarMenu;


import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sun, Moon, Menu, User } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import NavbarMenu from '@/components/NavbarMenu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled ? 'py-3 glass shadow-md' : 'py-5 bg-transparent'
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-[#403E43] flex items-center justify-center">
            <span className="text-white font-bold">P</span>
          </div>
          <span className="text-xl font-bold tracking-tighter">PsyTrack</span>
        </Link>
        
        {/* Desktop Navigation with NavbarMenu */}
        <div className="hidden md:flex items-center space-x-2">
          <NavbarMenu />
          <Link to="/" className="px-4 py-2 rounded-md hover:bg-white/10 transition-colors">
            Home
          </Link>
          <Link to="/about" className="px-4 py-2 rounded-md hover:bg-white/10 transition-colors">
            About
          </Link>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full" size="icon">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mr-4 bg-black/80 backdrop-blur-md border border-white/10">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-morphism neo-blur animate-fade-in absolute top-full left-0 w-full px-4 py-4 flex flex-col space-y-2">
          <Link to="/" className="px-4 py-2 rounded-md hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <Link to="/dashboard" className="px-4 py-2 rounded-md hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(false)}>
            Dashboard
          </Link>
          <Link to="/journal" className="px-4 py-2 rounded-md hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(false)}>
            Journal
          </Link>
          <Link to="/about" className="px-4 py-2 rounded-md hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(false)}>
            About
          </Link>
          <div className="p-2">
            <h3 className="px-4 py-2 font-medium">Features</h3>
            <Link to="/dashboard" className="px-6 py-2 block rounded-md hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </Link>
            <Link to="/journal" className="px-6 py-2 block rounded-md hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(false)}>
              Journal
            </Link>
          </div>
          <div className="p-2">
            <h3 className="px-4 py-2 font-medium">Resources</h3>
            <Link to="#mental-health-tips" className="px-6 py-2 block rounded-md hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(false)}>
              Mental Health Tips
            </Link>
            <Link to="#guided-sessions" className="px-6 py-2 block rounded-md hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(false)}>
              Guided Sessions
            </Link>
            <Link to="#community" className="px-6 py-2 block rounded-md hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(false)}>
              Community
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

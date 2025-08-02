'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Bot, ChevronsRight, LayoutDashboard, TestTube, Github } from 'lucide-react';

// Define the type for the connection status prop
interface HeaderProps {
  connectionStatus?: 'connected' | 'disconnected' | 'connecting';
}

export default function Header({ connectionStatus }: HeaderProps) {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState('');

  // Safely set the time only on the client-side
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { href: '/', label: 'Home', icon: Zap },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/demo/paradise-fire', label: 'Paradise Fire Demo', icon: TestTube },
    { href: '/classiq', label: 'Classiq Platform', icon: Bot },
  ];

  const getStatusIndicator = () => {
    switch (connectionStatus) {
      case 'connected':
        return <div className="w-3 h-3 bg-green-500 rounded-full" title="Connected"></div>;
      case 'connecting':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" title="Connecting"></div>;
      case 'disconnected':
      default:
        return <div className="w-3 h-3 bg-red-500 rounded-full" title="Disconnected"></div>;
    }
  };

  return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-lg font-bold text-gray-100 hover:text-orange-400 transition-colors">
                <Zap className="text-orange-400" />
                <span>QuantumFire</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center space-x-1 bg-gray-900/50 border border-gray-700 rounded-full px-2">
              {navItems.map((item) => (
                  <Link key={item.href} href={item.href} passHref>
                    <motion.div
                        className="relative px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                        animate={{ color: pathname === item.href ? '#FFFFFF' : '#D1D5DB' }}
                    >
                      {item.label}
                      {pathname === item.href && (
                          <motion.div
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                              layoutId="underline"
                              initial={false}
                              animate={{ opacity: 1 }}
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                      )}
                    </motion.div>
                  </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2 bg-gray-900/50 border border-gray-700 rounded-full px-3 py-1.5">
                {getStatusIndicator()}
                <span className="font-mono text-gray-400">{currentTime}</span>
              </div>
              <a
                  href="https://github.com/skandaka/QuantumForestFire"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  title="View on GitHub"
              >
                <Github size={20} />
              </a>
            </div>
          </div>
        </div>
      </header>
  );
}
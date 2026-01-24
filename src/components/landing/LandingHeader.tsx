import { Link } from '@tanstack/react-router'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

export function LandingHeader() {
  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(false)
  const isMobile = useIsMobile()

  // Transform values based on scroll
  const headerWidth = useTransform(
    scrollY,
    [0, 100],
    isMobile ? ['100%', '100%'] : ['100%', '90%'],
  )
  const headerTop = useTransform(scrollY, [0, 100], isMobile ? [0, 0] : [0, 12])
  const headerBorderRadius = useTransform(
    scrollY,
    [0, 100],
    isMobile ? [0, 0] : [0, 16],
  )

  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setIsScrolled(latest > 50)
    })
    return unsubscribe
  }, [scrollY])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const navItems = [
    { id: 'features', label: 'Features' },
    { id: 'showcase', label: 'Showcase' },
    { id: 'models', label: 'Models' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'faq', label: 'FAQ' },
  ]

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <motion.header
        style={{
          width: headerWidth,
          top: headerTop,
          borderRadius: headerBorderRadius,
        }}
        className={cn(
          'pointer-events-auto transition-all duration-300 ease-in-out',
          isScrolled
            ? 'bg-background/80 backdrop-blur-xl shadow-lg border border-border/50'
            : 'bg-transparent backdrop-blur-none',
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-md transition-transform group-hover:scale-105 flex items-center justify-center text-primary-foreground font-bold text-sm">
              D
            </div>
            <span className="text-xl font-bold">DirectorAI</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={cn(
                  'text-sm font-medium transition-colors cursor-pointer relative group',
                  isScrolled
                    ? 'text-muted-foreground hover:text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </motion.header>
    </div>
  )
}

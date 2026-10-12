import { useEffect, useState } from 'react'

const SPLASH_KEY = 'golfc.splashSeen'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter')

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('hold'), 150)
    const holdTimer = setTimeout(() => setPhase('exit'), 2400)
    const exitTimer = setTimeout(() => {
      try {
        localStorage.setItem(SPLASH_KEY, '1')
      } catch {
        /* sin storage */
      }
      onComplete()
    }, 3000)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(holdTimer)
      clearTimeout(exitTimer)
    }
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
      aria-hidden={phase === 'exit'}
      style={{ perspective: '1200px' }}
    >
      {/* Fondo idéntico a la página web: cancha nocturna con iluminación de estadio */}
      <div className="absolute inset-0 bg-pitch-vignette" />
      
      {/* Textura de la cancha */}
      <div className="pointer-events-none absolute inset-0 bg-pitch-lines opacity-50" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-grass-stripes opacity-35" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-stadium-beams" aria-hidden />

      {/* Orbes de luz (igual que en la página web) */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-team-a/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 -right-24 size-96 rounded-full bg-team-b/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-24 top-1/3 size-72 rounded-full bg-primary/15 blur-3xl" aria-hidden />

      {/* Vinetas superior e inferior */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />

      {/* Contenido con efecto 3D */}
      <div 
        className="relative flex flex-col items-center gap-12"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Logo con efecto 3D */}
        <div
          className={`relative transition-all duration-1000 ease-out ${
            phase === 'enter' ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            transform: phase === 'enter' 
              ? 'rotateX(-30deg) scale(0.8) translateZ(-100px)' 
              : 'rotateX(0deg) scale(1) translateZ(0px)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Sombra del logo en el "suelo" */}
          <div 
            className="absolute -bottom-8 left-1/2 h-8 w-32 -translate-x-1/2 rounded-full bg-black/40 blur-xl"
            style={{ transform: 'translateZ(-50px)' }}
          />
          
          {/* Anillos 3D */}
          <div 
            className="absolute -inset-10 rounded-full border-2 border-team-a/30"
            style={{ 
              transform: 'translateZ(-30px)',
              animation: 'pulse 3s ease-in-out infinite'
            }}
          />
          <div 
            className="absolute -inset-16 rounded-full border border-team-b/20"
            style={{ 
              transform: 'translateZ(-60px)',
              animation: 'pulse 3s ease-in-out infinite 1s'
            }}
          />
          
          {/* Logo principal con sombra 3D */}
          <div className="relative" style={{ transform: 'translateZ(50px)' }}>
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-br from-team-a/20 to-team-b/20 blur-2xl"
              style={{ transform: 'translateZ(-20px)' }}
            />
            <img
              src="/icon-512.svg"
              alt="Gol FC"
              className="relative h-40 w-40 drop-shadow-[0_25px_50px_rgba(0,0,0,0.6)]"
              style={{
                filter: 'drop-shadow(0 10px 20px rgba(190, 242, 100, 0.2))'
              }}
            />
          </div>
        </div>

        {/* Nombre con efecto 3D */}
        <div
          className={`text-center transition-all duration-1000 delay-300 ${
            phase === 'enter' ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            transform: phase === 'enter' 
              ? 'rotateX(20deg) translateY(30px) translateZ(-50px)' 
              : 'rotateX(0deg) translateY(0) translateZ(0px)',
            transformStyle: 'preserve-3d'
          }}
        >
          <h1 
            className="font-display text-8xl uppercase tracking-[0.08em] text-white text-shadow-hero"
            style={{
              textShadow: `
                0 1px 0 #0b5c3b,
                0 2px 0 #0b5c3b,
                0 3px 0 #07432b,
                0 4px 0 #07432b,
                0 5px 0 #04100a,
                0 6px 14px rgba(0,0,0,0.85),
                0 0 40px rgba(190, 242, 100, 0.2)
              `
            }}
          >
            Gol <span className="text-team-a">FC</span>
          </h1>
          <div className="mt-4 flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-team-a/60" />
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-white/80">
              El club de tu barrio
            </p>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-team-a/60" />
          </div>
        </div>

        {/* Barra de progreso con efecto 3D */}
        <div
          className={`transition-opacity duration-500 ${
            phase === 'exit' ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ transform: 'translateZ(30px)' }}
        >
          <div 
            className="h-1.5 w-64 overflow-hidden rounded-full bg-white/10"
            style={{
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <div
              className={`h-full rounded-full transition-all ease-out ${
                phase === 'enter' ? 'w-0' : 'w-full'
              }`}
              style={{ 
                transitionDuration: phase === 'hold' ? '2000ms' : '0ms',
                background: 'linear-gradient(90deg, #bef264, #2dd4bf, #38bdf8)',
                boxShadow: '0 0 20px rgba(190, 242, 100, 0.4)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Marca de agua inferior */}
      <div
        className={`absolute bottom-10 transition-all duration-1000 delay-500 ${
          phase === 'enter' ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
        }`}
      >
        <p className="text-xs font-medium uppercase tracking-[0.5em] text-white/40">
          Fundado con pasión
        </p>
      </div>

      {/* Partículas flotantes 3D (como polvo en el aire del estadio) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-team-a/30"
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 4) * 20}%`,
              animation: `float ${4 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function shouldShowSplash(): boolean {
  try {
    return localStorage.getItem(SPLASH_KEY) !== '1'
  } catch {
    return true
  }
}

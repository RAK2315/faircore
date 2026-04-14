import { motion } from 'framer-motion'

interface RadarProps {
  className?: string
  size?: number
  rings?: number
  label?: string
}

export function Radar({ className = '', size = 300, rings = 6, label = 'ANALYZING' }: RadarProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <style>{`
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .radar-sweep {
          animation: radar-sweep 3s linear infinite;
          transform-origin: left center;
        }
        @keyframes radar-ping {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.5); }
        }
      `}</style>

      {/* Concentric rings */}
      {Array.from({ length: rings }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className="absolute rounded-full border border-fc-yellow"
          style={{
            width: `${((i + 1) / rings) * 100}%`,
            height: `${((i + 1) / rings) * 100}%`,
            opacity: 1 - (i / rings) * 0.7,
            borderColor: i === rings - 1 ? '#eaea00' : `rgba(234,234,0,${0.4 - i * 0.05})`,
          }}
        />
      ))}

      {/* Crosshairs */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-px bg-fc-yellow opacity-15" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-full w-px bg-fc-yellow opacity-15" />
      </div>

      {/* Sweep line */}
      <div
        className="radar-sweep absolute left-1/2 top-1/2"
        style={{ width: size / 2, height: 2, transformOrigin: 'left center' }}
      >
        <div
          className="h-full w-full"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(234,234,0,0.8))',
          }}
        />
        {/* Sweep trail */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'conic-gradient(from 0deg, rgba(234,234,0,0.15), transparent 60deg)',
            transformOrigin: 'left center',
          }}
        />
      </div>

      {/* Center dot */}
      <div className="absolute w-3 h-3 bg-fc-yellow z-10" />
      <div
        className="absolute w-3 h-3 bg-fc-yellow z-10"
        style={{ animation: 'radar-ping 2s ease-out infinite' }}
      />

      {/* Label */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="font-mono text-xs text-fc-yellow uppercase tracking-[0.3em]">
          {label}
          <span className="animate-blink">_</span>
        </span>
      </div>
    </div>
  )
}

export function AnalysisLoadingScreen() {
  const steps = [
    'LOADING MODEL ARTIFACT',
    'PARSING DATASET STRUCTURE',
    'DETECTING PROTECTED ATTRIBUTES',
    'RUNNING SHAP ATTRIBUTION',
    'COMPUTING FAIRNESS METRICS',
    'EXECUTING DEBIASING PROTOCOL',
    'GENERATING GEMINI AUDIT REPORT',
    'FINALIZING RESULTS',
  ]

  return (
    <div className="fixed inset-0 bg-fc-black z-50 flex flex-col items-center justify-center industrial-grid">
      <div className="absolute inset-0 industrial-grid opacity-30" />

      <div className="relative z-10 flex flex-col items-center gap-16">
        <div className="font-bungee text-4xl text-fc-white tracking-tighter">
          FAIR<span className="text-fc-yellow">CORE</span>
        </div>

        <Radar size={280} rings={7} label="INTERROGATING MODEL" />

        <div className="w-80 space-y-3 mt-8">
          {steps.map((step, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.8, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.8 + 0.2 }}
                className="w-2 h-2 bg-fc-yellow flex-shrink-0"
              />
              <span className="font-mono text-xs text-fc-muted uppercase tracking-widest">{step}</span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.8 + 0.4 }}
                className="font-mono text-xs text-fc-yellow ml-auto"
              >
                OK
              </motion.span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

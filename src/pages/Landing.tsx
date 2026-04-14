import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TextScramble } from '@/components/ui/TextScramble'
import { Marquee } from '@/components/ui/Marquee'

const MARQUEE_ITEMS = [
  'BIAS DETECTION',
  'ADVERSARIAL DEBIASING',
  'SHAP ATTRIBUTION',
  'FAIRNESS METRICS',
  'GEMINI AUDIT REPORTS',
  'DEMOGRAPHIC PARITY',
  'EQUALIZED ODDS',
  'DISPARATE IMPACT',
]

const STATS = [
  { value: '6', unit: 'ANALYSES', label: 'Bias vectors measured per run' },
  { value: '2', unit: 'DEBIAS', label: 'Debiasing algorithms, auto-selected' },
  { value: '∞', unit: 'MODELS', label: 'Any sklearn Pipeline or estimator' },
  { value: '0', unit: 'COST', label: 'Free tier — Gemini + Cloud Run' },
]

const HOW_IT_WORKS = [
  {
    num: '01',
    title: 'UPLOAD_ARTIFACT',
    desc: 'Drop your trained sklearn model (.pkl) and the dataset it was trained on. No labeling needed.',
    icon: 'upload_file',
  },
  {
    num: '02',
    title: 'DETECT_BIAS',
    desc: 'FairCore auto-detects protected attributes and measures demographic parity, equalized odds, and disparate impact.',
    icon: 'manage_search',
  },
  {
    num: '03',
    title: 'DEBIAS_MODEL',
    desc: 'Reweighting and prejudice remover algorithms retrain your model with verified fairness improvement.',
    icon: 'manufacturing',
  },
  {
    num: '04',
    title: 'EXPORT_RESULTS',
    desc: 'Download your debiased model + a Gemini-generated plain-English audit report. Ready to deploy.',
    icon: 'download',
  },
]

const WHY_ITEMS = [
  {
    title: 'HIRING MODELS',
    stat: '31%',
    desc: 'Average disparity in automated hiring systems against protected groups',
    color: 'fc-error',
  },
  {
    title: 'LOAN DECISIONS',
    stat: '2.4×',
    desc: 'More likely for AI systems to deny loans to minority applicants',
    color: 'fc-yellow',
  },
  {
    title: 'MEDICAL AI',
    stat: '56%',
    desc: 'Of medical AI systems show racial bias in diagnostic recommendations',
    color: 'fc-error',
  },
]

export default function Landing() {
  return (
    <div className="bg-fc-surface">
      {/* HERO */}
      <section className="relative min-h-screen flex flex-col justify-center industrial-grid overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-fc-yellow opacity-[0.02]" />
        <div className="absolute bottom-0 left-0 w-px h-2/3 bg-fc-yellow opacity-30" />
        <div className="absolute top-0 right-64 w-px h-full bg-fc-white opacity-5" />

        {/* Timeline dots */}
        <div className="hidden xl:block absolute right-10 top-1/4 h-1/2 w-px bg-fc-white opacity-20">
          <div className="absolute top-10 -right-2 w-4 h-4 bg-fc-yellow rotate-45" />
          <div className="absolute top-1/3 -left-2 w-4 h-4 bg-fc-surface-higher border-2 border-fc-white -rotate-12" />
          <div className="absolute top-2/3 -right-2 w-4 h-4 bg-fc-white rotate-12" />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24">
          <div className="grid grid-cols-12 gap-6 items-center">
            <div className="col-span-12 lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="fc-badge-yellow mb-6 text-[10px]">SYSTEM_STATUS: INTERROGATOR_ACTIVE</div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-bungee text-[clamp(4rem,12vw,10rem)] leading-none tracking-tighter text-fc-white mb-6 uppercase"
              >
                FAIR
                <span className="text-outline-yellow">CORE</span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <p className="font-headline text-xl md:text-2xl text-fc-muted font-light max-w-2xl leading-relaxed mb-4">
                  Upload any ML classifier. Get back a{' '}
                  <span className="text-fc-yellow font-bold">debiased model</span> and a plain-English
                  audit report — automatically.
                </p>
                <p className="font-mono text-xs text-fc-outline uppercase tracking-widest">
                  // Powered by SHAP · AIF360 · Google Gemini · Google Cloud Run
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap gap-4 mt-10"
              >
                <Link to="/investigate" className="fc-btn-primary text-base">
                  INITIALIZE_AUDIT
                </Link>
                <Link to="/about" className="fc-btn-secondary text-base">
                  READ_EVIDENCE
                </Link>
              </motion.div>
            </div>

            {/* Right — stats cluster */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="col-span-12 lg:col-span-4 space-y-0"
            >
              <div className="bg-fc-yellow text-fc-black p-6 border-4 border-fc-black shadow-hard shard-cut-corner">
                <p className="font-headline font-black text-2xl uppercase">SYSTEM READY</p>
                <p className="font-mono text-xs mt-1">Latency: &lt;200ms | Integrity: 100%</p>
              </div>
              <div className="bg-fc-surface-high border-4 border-fc-white p-6 space-y-4 -mt-1">
                {STATS.slice(0, 2).map((s) => (
                  <div key={s.unit} className="border-b border-fc-surface-higher pb-4">
                    <div className="flex items-end gap-2">
                      <span className="font-bungee text-4xl text-fc-white">{s.value}</span>
                      <span className="font-mono text-xs text-fc-yellow uppercase tracking-widest mb-1">{s.unit}</span>
                    </div>
                    <p className="font-body text-xs text-fc-outline mt-1">{s.label}</p>
                  </div>
                ))}
                {STATS.slice(2).map((s) => (
                  <div key={s.unit}>
                    <div className="flex items-end gap-2">
                      <span className="font-bungee text-4xl text-fc-white">{s.value}</span>
                      <span className="font-mono text-xs text-fc-yellow uppercase tracking-widest mb-1">{s.unit}</span>
                    </div>
                    <p className="font-body text-xs text-fc-outline mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] text-fc-outline uppercase tracking-widest">SCROLL_DOWN</span>
          <div className="w-px h-12 bg-gradient-to-b from-fc-yellow to-transparent" />
        </div>
      </section>

      {/* MARQUEE */}
      <Marquee items={MARQUEE_ITEMS} />

      {/* WHY BIAS MATTERS */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="mb-16">
          <div className="fc-badge mb-4">THE_PROBLEM</div>
          <h2 className="font-bungee text-5xl md:text-7xl text-fc-white leading-none tracking-tighter uppercase">
            BIAS IS <span className="text-fc-yellow">NOT</span><br />ABSTRACT
          </h2>
          <p className="font-body text-fc-muted mt-6 max-w-2xl text-lg">
            AI systems make life-changing decisions about who gets hired, who gets loans, who gets medical care. When trained on flawed historical data, they repeat and amplify discrimination at scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-4 border-fc-white shadow-hard-white">
          {WHY_ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`p-8 ${i < WHY_ITEMS.length - 1 ? 'border-r-4 border-fc-white' : ''} relative overflow-hidden group`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-fc-yellow" />
              <p className="font-mono text-[10px] text-fc-outline uppercase tracking-widest mb-4">{item.title}</p>
              <div className={`font-bungee text-6xl ${item.color === 'fc-error' ? 'text-fc-error' : 'text-fc-yellow'} mb-4`}>
                {item.stat}
              </div>
              <p className="font-body text-fc-muted text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-fc-black border-y-4 border-fc-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-16">
            <div className="fc-badge-yellow mb-4">PROTOCOL</div>
            <h2 className="font-bungee text-5xl md:text-7xl text-fc-white leading-none tracking-tighter uppercase">
              HOW IT<br /><TextScramble text="WORKS" className="text-fc-yellow" autoPlay delay={500} />
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-4 border-fc-white">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className={`p-8 relative bg-fc-surface-high group hover:bg-fc-surface-higher transition-colors
                  ${i % 2 === 0 ? 'border-r-4 border-fc-white' : ''}
                  ${i < 2 ? 'border-b-4 border-fc-white' : ''}
                `}
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="font-bungee text-6xl text-fc-outline opacity-30">{step.num}</span>
                  <span className="material-symbols-outlined text-4xl text-fc-yellow">{step.icon}</span>
                </div>
                <h3 className="font-headline font-black text-xl text-fc-white uppercase tracking-tight mb-3">
                  {step.title}
                </h3>
                <p className="font-body text-fc-muted text-sm leading-relaxed">{step.desc}</p>
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-fc-yellow group-hover:w-full transition-all duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MARQUEE reverse */}
      <Marquee items={MARQUEE_ITEMS} reverse speed="30s" />

      {/* TECH STACK */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-8 items-center">
          <div className="col-span-12 md:col-span-5">
            <div className="fc-badge mb-4">ARSENAL</div>
            <h2 className="font-bungee text-4xl md:text-6xl text-fc-white leading-none tracking-tighter uppercase mb-6">
              THE TECH<br />BEHIND IT
            </h2>
            <p className="font-body text-fc-muted leading-relaxed">
              Every component chosen for a reason. No API wrappers masquerading as AI. Real ML, real fairness metrics, real debiasing — running on Google Cloud.
            </p>
            <Link to="/investigate" className="fc-btn-primary mt-8 inline-block">
              START_INVESTIGATION
            </Link>
          </div>

          <div className="col-span-12 md:col-span-7">
            <div className="grid grid-cols-2 gap-0 border-4 border-fc-white shadow-hard-yellow">
              {[
                { name: 'AIF360', role: 'Fairness Metrics + Debiasing', layer: 'ML CORE' },
                { name: 'SHAP', role: 'Feature Attribution Engine', layer: 'EXPLAINABILITY' },
                { name: 'GEMINI', role: 'Plain-English Audit Reports', layer: 'AI REPORTS' },
                { name: 'CLOUD RUN', role: 'Scalable Google Cloud Deploy', layer: 'INFRA' },
                { name: 'FASTAPI', role: 'High-Performance REST Backend', layer: 'BACKEND' },
                { name: 'SKLEARN', role: 'Any Classifier Supported', layer: 'COMPATIBLE' },
              ].map((tech, i) => (
                <div
                  key={tech.name}
                  className={`p-6 bg-fc-surface-high relative group hover:bg-fc-surface-higher transition-colors
                    ${i % 2 === 0 ? 'border-r-4 border-fc-white' : ''}
                    ${i < 4 ? 'border-b-4 border-fc-white' : ''}
                  `}
                >
                  <span className="font-mono text-[9px] text-fc-yellow uppercase tracking-widest block mb-2">{tech.layer}</span>
                  <span className="font-headline font-black text-lg text-fc-white block">{tech.name}</span>
                  <span className="font-body text-xs text-fc-outline">{tech.role}</span>
                  <div className="absolute top-0 right-0 w-0 h-1 bg-fc-yellow group-hover:w-full transition-all duration-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 px-6 md:px-12 border-t-4 border-fc-white overflow-hidden">
        <div className="absolute inset-0 industrial-grid-yellow opacity-30" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="font-mono text-xs text-fc-yellow uppercase tracking-[0.4em] mb-6">
            EXECUTE_INVESTIGATION
          </div>
          <h2 className="font-bungee text-6xl md:text-9xl text-fc-white leading-none tracking-tighter uppercase mb-6">
            IS YOUR<br />MODEL<br /><span className="text-fc-yellow">FAIR?</span>
          </h2>
          <p className="font-body text-fc-muted text-lg mb-10 max-w-xl mx-auto">
            Upload it. Find out in under 60 seconds. Get a debiased version back.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/investigate" className="fc-btn-primary text-lg px-12 py-5">
              CONFIRM & START
            </Link>
          </div>
          <p className="font-mono text-[10px] text-fc-outline uppercase tracking-widest mt-6">
            Once initialized, the audit process cannot be paused or reverted.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-fc-black border-t-4 border-fc-white px-6 md:px-12 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <span className="font-bungee text-2xl text-fc-yellow italic">FAIRCORE</span>
            <p className="font-mono text-[10px] text-fc-outline uppercase tracking-widest mt-1">
              ML Bias Detection & Debiasing Engine
            </p>
          </div>
          <div className="flex gap-8">
            <Link to="/investigate" className="font-mono text-xs text-fc-outline hover:text-fc-yellow uppercase tracking-widest transition-colors">
              INVESTIGATE
            </Link>
            <Link to="/about" className="font-mono text-xs text-fc-outline hover:text-fc-yellow uppercase tracking-widest transition-colors">
              ABOUT
            </Link>
            <a href="https://github.com/RAK2315" target="_blank" rel="noreferrer" className="font-mono text-xs text-fc-outline hover:text-fc-yellow uppercase tracking-widest transition-colors">
              GITHUB
            </a>
          </div>
          <p className="font-mono text-[10px] text-fc-outline uppercase tracking-widest">
            © 2026 FAIRCORE. GOOGLE SOLUTION CHALLENGE.
          </p>
        </div>
      </footer>
    </div>
  )
}

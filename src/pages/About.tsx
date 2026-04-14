import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { TextScramble } from '@/components/ui/TextScramble'
import { Marquee } from '@/components/ui/Marquee'

const PAPERS = [
  {
    title: 'Fairness and Abstraction in Sociotechnical Systems',
    authors: 'Selbst et al.',
    venue: 'FAccT 2019',
    relevance: 'Foundational work on why fairness is context-dependent and cannot be abstracted away from social systems.',
  },
  {
    title: 'A Reductions Approach to Fair Classification',
    authors: 'Agarwal et al.',
    venue: 'ICML 2018',
    relevance: 'Core algorithm behind prejudice remover — reducing fairness to cost-sensitive classification.',
  },
  {
    title: 'Certifying and Removing Disparate Impact',
    authors: 'Feldman et al.',
    venue: 'KDD 2015',
    relevance: 'Establishes the 80% rule (disparate impact ratio) — the primary fairness threshold FairCore measures.',
  },
  {
    title: 'Why Does My Model Fail? Contrastive Local Explanations for Retail Forecasting',
    authors: 'Lundberg & Lee',
    venue: 'NeurIPS 2017',
    relevance: 'SHAP (SHapley Additive exPlanations) — the attribution method powering FairCore\'s proxy discrimination detection.',
  },
  {
    title: 'Data Preprocessing Techniques for Classification without Discrimination',
    authors: 'Kamiran & Calders',
    venue: 'KAIS 2012',
    relevance: 'The reweighting algorithm implemented in FairCore\'s primary debiasing pipeline.',
  },
]

const METRICS_EXPLAINED = [
  {
    name: 'DEMOGRAPHIC PARITY',
    formula: 'P(Ŷ=1|A=0) = P(Ŷ=1|A=1)',
    plain: 'The model should predict positive outcomes at equal rates across demographic groups.',
    threshold: 'Difference < 0.05 = low bias',
    icon: 'balance',
  },
  {
    name: 'EQUALIZED ODDS',
    formula: 'TPR_A = TPR_B and FPR_A = FPR_B',
    plain: 'True positive and false positive rates should be equal across groups — the model should be equally accurate for everyone.',
    threshold: 'Difference < 0.05 = low bias',
    icon: 'rule',
  },
  {
    name: 'DISPARATE IMPACT',
    formula: 'P(Ŷ=1|A=minority) / P(Ŷ=1|A=majority) ≥ 0.8',
    plain: 'The 80% rule from US employment law — minority groups must receive positive outcomes at least 80% as often as the majority group.',
    threshold: 'Ratio ≥ 0.8 = passes',
    icon: 'gavel',
  },
]

const TIMELINE = [
  { year: '2014', event: 'Amazon builds hiring AI trained on 10 years of male-dominated resumes. System learns to penalize words like "women\'s" chess club.' },
  { year: '2016', event: 'ProPublica analysis of COMPAS reveals Black defendants scored nearly twice as likely to be falsely flagged as high-risk compared to white defendants.' },
  { year: '2019', event: 'Google Photos facial recognition misidentifies Black users. Healthcare algorithm favors white patients 2:1 for extra medical care.' },
  { year: '2021', event: 'NIST study finds most commercial facial recognition systems have error rates 10-100x higher for Black and Asian faces.' },
  { year: '2024', event: 'EU AI Act passes. High-risk AI systems legally required to undergo bias audits before deployment.' },
  { year: '2026', event: 'FairCore: automated bias detection and debiasing for any ML classifier — no ML expertise required.' },
]

export default function About() {
  return (
    <div className="min-h-screen bg-fc-surface pb-24">
      {/* HERO */}
      <section className="px-6 md:px-12 py-16 industrial-grid border-b-4 border-fc-white relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-fc-yellow opacity-[0.02]" />
        <div className="max-w-5xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <span className="fc-badge-yellow text-[10px] mb-6 inline-block">THE_EVIDENCE</span>
            <h1 className="font-bungee text-6xl md:text-8xl leading-none tracking-tighter text-fc-white uppercase mb-6">
              WHY THIS<br />
              <TextScramble text="MATTERS" className="text-fc-yellow" autoPlay delay={400} />
            </h1>
            <p className="font-body text-fc-muted text-lg max-w-2xl leading-relaxed">
              Algorithmic bias is not a hypothetical. It is happening in hiring systems, loan approvals,
              medical diagnostics, and criminal sentencing — right now, at scale. FairCore is built to
              detect and fix it before deployment.
            </p>
          </motion.div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="px-6 md:px-12 py-16 border-b-4 border-fc-white">
        <div className="max-w-5xl mx-auto">
          <div className="fc-badge mb-8">AUDIT_TRAIL — DOCUMENTED_FAILURES</div>
          <div className="relative">
            <div className="absolute left-16 top-0 bottom-0 w-px bg-fc-white opacity-20" />
            <div className="space-y-0">
              {TIMELINE.map((item, i) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className={`flex gap-8 p-6 border-b-2 border-fc-surface-higher relative group hover:bg-fc-surface-high transition-colors ${
                    i === TIMELINE.length - 1 ? 'border-fc-yellow bg-fc-surface-high' : ''
                  }`}
                >
                  <div className="w-20 flex-shrink-0 relative">
                    <div className={`absolute right-0 top-1/2 w-3 h-3 -translate-y-1/2 rotate-45 ${i === TIMELINE.length - 1 ? 'bg-fc-yellow' : 'bg-fc-white'}`} />
                    <span className={`font-bungee text-xl ${i === TIMELINE.length - 1 ? 'text-fc-yellow' : 'text-fc-outline'}`}>{item.year}</span>
                  </div>
                  <p className={`font-body text-sm leading-relaxed ${i === TIMELINE.length - 1 ? 'text-fc-yellow font-bold' : 'text-fc-muted'}`}>
                    {item.event}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Marquee items={['DEMOGRAPHIC PARITY', 'EQUALIZED ODDS', 'DISPARATE IMPACT', 'SHAP ATTRIBUTION', 'PROXY DISCRIMINATION', 'REWEIGHTING', 'PREJUDICE REMOVER', 'EU AI ACT']} />

      {/* FAIRNESS METRICS EXPLAINED */}
      <section className="px-6 md:px-12 py-16 border-b-4 border-fc-white">
        <div className="max-w-5xl mx-auto">
          <div className="fc-badge mb-4">INTERROGATION_VECTORS</div>
          <h2 className="font-bungee text-4xl md:text-6xl text-fc-white leading-none tracking-tighter uppercase mb-12">
            THE 3 FAIRNESS<br />METRICS WE USE
          </h2>

          <div className="space-y-0 border-4 border-fc-white">
            {METRICS_EXPLAINED.map((metric, i) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`grid grid-cols-12 gap-0 ${i < METRICS_EXPLAINED.length - 1 ? 'border-b-4 border-fc-white' : ''}`}
              >
                <div className="col-span-1 bg-fc-yellow flex items-center justify-center border-r-4 border-fc-black">
                  <span className="material-symbols-outlined text-fc-black text-2xl">{metric.icon}</span>
                </div>
                <div className="col-span-11 p-6 bg-fc-surface-high">
                  <div className="flex flex-wrap gap-4 items-start justify-between mb-3">
                    <h3 className="font-headline font-black text-lg text-fc-white uppercase">{metric.name}</h3>
                    <span className="font-mono text-[9px] text-fc-yellow bg-fc-black px-3 py-1 uppercase tracking-widest">{metric.threshold}</span>
                  </div>
                  <code className="font-mono text-xs text-fc-yellow block mb-3 bg-fc-black px-3 py-2">{metric.formula}</code>
                  <p className="font-body text-sm text-fc-muted leading-relaxed">{metric.plain}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S NOVEL */}
      <section className="px-6 md:px-12 py-16 bg-fc-black border-b-4 border-fc-white">
        <div className="max-w-5xl mx-auto">
          <div className="fc-badge-yellow mb-4">NOVEL_CONTRIBUTION</div>
          <h2 className="font-bungee text-4xl md:text-6xl text-fc-white leading-none tracking-tighter uppercase mb-12">
            WHAT MAKES<br />FAIRCORE DIFFERENT
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-4 border-fc-white">
            {[
              {
                num: '01',
                title: 'AUTO-DETECTION',
                desc: 'No manual labeling of protected attributes. FairCore uses mutual information and chi-squared tests to automatically find demographic columns — even when they\'re not labeled as such.',
                tag: 'NOVEL',
              },
              {
                num: '02',
                title: 'CLOSED-LOOP VERIFY',
                desc: 'After debiasing, FairCore re-evaluates fairness metrics and only accepts the result if improvement is verified within your accuracy threshold. Most tools skip this step entirely.',
                tag: 'NOVEL',
              },
              {
                num: '03',
                title: 'CAUSAL EXPLANATION',
                desc: 'Gemini audit reports are grounded in SHAP values — not templates. FairCore explains which features acted as proxies for protected attributes and why the bias existed causally.',
                tag: 'NOVEL',
              },
            ].map((item, i) => (
              <div key={item.num} className={`p-8 relative ${i < 2 ? 'border-r-4 border-fc-white' : ''}`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-fc-yellow" />
                <span className="fc-badge-yellow text-[9px] mb-4 inline-block">{item.tag}</span>
                <span className="font-bungee text-5xl text-fc-outline opacity-30 block mb-4">{item.num}</span>
                <h3 className="font-headline font-black text-xl text-fc-white uppercase mb-3">{item.title}</h3>
                <p className="font-body text-sm text-fc-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESEARCH PAPERS */}
      <section className="px-6 md:px-12 py-16 border-b-4 border-fc-white">
        <div className="max-w-5xl mx-auto">
          <div className="fc-badge mb-4">PRIOR_ART — REFERENCES</div>
          <h2 className="font-bungee text-4xl md:text-6xl text-fc-white leading-none tracking-tighter uppercase mb-12">
            THE SCIENCE<br />BEHIND IT
          </h2>

          <div className="space-y-0 border-4 border-fc-white">
            {PAPERS.map((paper, i) => (
              <motion.div
                key={paper.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className={`p-6 bg-fc-surface-high hover:bg-fc-surface-higher transition-colors ${i < PAPERS.length - 1 ? 'border-b-4 border-fc-white' : ''}`}
              >
                <div className="flex flex-wrap gap-4 justify-between items-start mb-2">
                  <h3 className="font-headline font-bold text-fc-white text-sm max-w-xl">{paper.title}</h3>
                  <div className="flex gap-2 flex-shrink-0">
                    <span className="font-mono text-[9px] text-fc-black bg-fc-yellow px-2 py-1 uppercase">{paper.venue}</span>
                  </div>
                </div>
                <p className="font-mono text-[10px] text-fc-yellow mb-2 uppercase">{paper.authors}</p>
                <p className="font-body text-xs text-fc-muted leading-relaxed">{paper.relevance}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="px-6 md:px-12 py-16 border-b-4 border-fc-white">
        <div className="max-w-5xl mx-auto">
          <div className="fc-badge mb-4">INTERROGATORS</div>
          <h2 className="font-bungee text-4xl md:text-6xl text-fc-white leading-none tracking-tighter uppercase mb-12">
            BUILT BY
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-4 border-fc-white shadow-hard-yellow">
            <div className="p-8 border-r-4 border-fc-white">
              <span className="fc-badge-yellow text-[9px] mb-4 inline-block">LEAD_ENGINEER</span>
              <h3 className="font-headline font-black text-2xl text-fc-white uppercase mb-1">REHAAN AK</h3>
              <p className="font-mono text-xs text-fc-yellow uppercase tracking-widest mb-4">B.Tech CS (AI & ML) · JSS University Noida</p>
              <p className="font-body text-sm text-fc-muted mb-6 leading-relaxed">
                Grand Finalist — India AI Impact Buildathon 2026 (Top 850 / 38,000+ teams). Specialist in ML pipelines, NLP, CV, and agentic AI systems.
              </p>
              <div className="flex gap-3">
                <a href="https://github.com/RAK2315" target="_blank" rel="noreferrer" className="font-mono text-[10px] text-fc-outline hover:text-fc-yellow uppercase tracking-widest transition-colors border border-fc-outline hover:border-fc-yellow px-3 py-2">
                  GITHUB
                </a>
                <a href="https://linkedin.com/in/rehaanak" target="_blank" rel="noreferrer" className="font-mono text-[10px] text-fc-outline hover:text-fc-yellow uppercase tracking-widest transition-colors border border-fc-outline hover:border-fc-yellow px-3 py-2">
                  LINKEDIN
                </a>
              </div>
            </div>
            <div className="p-8 bg-fc-surface-higher">
              <span className="fc-badge text-[9px] mb-4 inline-block">STACK_USED</span>
              <div className="space-y-2 mt-4">
                {[
                  ['FRONTEND', 'React + TypeScript + Tailwind'],
                  ['BACKEND', 'FastAPI + Python 3.10'],
                  ['ML CORE', 'scikit-learn + AIF360 + SHAP'],
                  ['AI REPORTS', 'Google Gemini 1.5 Flash'],
                  ['DEPLOY', 'Google Cloud Run + Streamlit Cloud'],
                  ['COMPETITION', 'Google Solution Challenge 2026'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-fc-surface-high pb-2">
                    <span className="font-mono text-[9px] text-fc-outline uppercase tracking-widest">{label}</span>
                    <span className="font-mono text-[10px] text-fc-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-12 py-16">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-bungee text-5xl md:text-7xl text-fc-white leading-none tracking-tighter uppercase mb-6">
            READY TO AUDIT<br />YOUR <span className="text-fc-yellow">MODEL?</span>
          </h2>
          <Link to="/investigate" className="fc-btn-primary text-lg px-12 py-5 inline-block mt-4">
            INITIALIZE_INVESTIGATION
          </Link>
        </div>
      </section>
    </div>
  )
}

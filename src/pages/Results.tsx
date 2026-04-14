import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAnalysis } from '@/lib/AnalysisContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const BIAS_COLORS: Record<string, string> = {
  severe: '#ff4444',
  high: '#ff8800',
  moderate: '#ffcc00',
  low: '#eaea00',
}

function MetricCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`p-6 border-4 border-fc-white relative ${accent ? 'bg-fc-yellow text-fc-black' : 'bg-fc-surface-high'}`}>
      <p className={`font-mono text-[10px] uppercase tracking-widest mb-2 ${accent ? 'text-fc-black opacity-60' : 'text-fc-outline'}`}>{label}</p>
      <p className={`font-bungee text-4xl ${accent ? 'text-fc-black' : 'text-fc-white'}`}>{value}</p>
      {sub && <p className={`font-mono text-[10px] mt-1 ${accent ? 'text-fc-black opacity-50' : 'text-fc-muted'}`}>{sub}</p>}
    </div>
  )
}

function BiasBarChart({ attr, metrics, afterMetrics }: { attr: string; metrics: any; afterMetrics: any }) {
  const data = [
    {
      name: 'Dem. Parity',
      before: Number((metrics?.demographic_parity?.difference || 0).toFixed(3)),
      after: Number((afterMetrics?.demographic_parity?.difference || 0).toFixed(3)),
    },
    {
      name: 'TPR Diff',
      before: Number((metrics?.equalized_odds?.tpr_difference || 0).toFixed(3)),
      after: Number((afterMetrics?.equalized_odds?.tpr_difference || 0).toFixed(3)),
    },
    {
      name: 'FPR Diff',
      before: Number((metrics?.equalized_odds?.fpr_difference || 0).toFixed(3)),
      after: Number((afterMetrics?.equalized_odds?.fpr_difference || 0).toFixed(3)),
    },
    {
      name: 'DI (inv.)',
      before: Number((1 - (metrics?.disparate_impact?.ratio || 1)).toFixed(3)),
      after: Number((1 - (afterMetrics?.disparate_impact?.ratio || 1)).toFixed(3)),
    },
  ]

  return (
    <div className="fc-card p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="fc-badge-yellow text-[9px] mb-2">PROTECTED_ATTRIBUTE</span>
          <h3 className="font-headline font-black text-xl text-fc-white uppercase mt-1">{attr}</h3>
        </div>
        <div className="flex gap-4 text-[10px] font-mono">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-fc-error inline-block" /> BEFORE</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-fc-yellow inline-block" /> AFTER</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="0" stroke="#1e1e1e" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#939277', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#939277', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
          <Tooltip
            contentStyle={{ background: '#1e1e1e', border: '2px solid #eaea00', borderRadius: 0, fontFamily: 'IBM Plex Mono', fontSize: 11 }}
            labelStyle={{ color: '#eaea00' }}
            itemStyle={{ color: '#cac8aa' }}
          />
          <Bar dataKey="before" fill="#ff4444" name="Before" />
          <Bar dataKey="after" fill="#eaea00" name="After" />
        </BarChart>
      </ResponsiveContainer>

      {/* Group rates table */}
      <div className="mt-4 border-t-2 border-fc-surface-higher pt-4">
        <p className="font-mono text-[9px] text-fc-outline uppercase tracking-widest mb-3">GROUP_PREDICTION_RATES</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(metrics?.demographic_parity?.group_rates || {}).map(([group, rate]) => (
            <div key={group} className="bg-fc-surface-higher p-2">
              <p className="font-mono text-[9px] text-fc-outline uppercase truncate">{group}</p>
              <p className="font-headline font-bold text-fc-white">{((rate as number) * 100).toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SHAPChart({ data }: { data: Record<string, number> }) {
  const items = Object.entries(data)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value: Number(value.toFixed(4)) }))
    .sort((a, b) => b.value - a.value)

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={items} layout="vertical" barCategoryGap="20%">
        <CartesianGrid strokeDasharray="0" stroke="#1e1e1e" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#939277', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fill: '#cac8aa', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} width={120} />
        <Tooltip
          contentStyle={{ background: '#1e1e1e', border: '2px solid #eaea00', borderRadius: 0, fontFamily: 'IBM Plex Mono', fontSize: 11 }}
          labelStyle={{ color: '#eaea00' }}
        />
        <Bar dataKey="value" name="SHAP Value">
          {items.map((_, i) => (
            <Cell key={i} fill={i === 0 ? '#ff4444' : i < 3 ? '#ffaa00' : '#eaea00'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function Results() {
  const { result } = useAnalysis()
  const navigate = useNavigate()

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-12">
        <div className="fc-card p-12 text-center max-w-lg">
          <span className="material-symbols-outlined text-5xl text-fc-outline mb-4">search_off</span>
          <h2 className="font-headline font-black text-2xl text-fc-white uppercase mb-4">NO_ACTIVE_INQUEST</h2>
          <p className="font-body text-fc-muted mb-8">No analysis results found. Run an investigation first.</p>
          <button onClick={() => navigate('/investigate')} className="fc-btn-primary w-full">
            INITIALIZE_AUDIT
          </button>
        </div>
      </div>
    )
  }

  const { before, after, dataset_info, audit_report, session_id } = result
  const biasLevel = before.overall_bias_score.level
  const biasScore = before.overall_bias_score.score
  const biasColor = BIAS_COLORS[biasLevel] || '#eaea00'

  const handleDownloadModel = async () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
    const res = await fetch(`${backendUrl}/download/${session_id}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `faircore_debiased_${session_id.slice(0, 8)}.pkl`
    a.click()
  }

  const handleDownloadReport = () => {
    const blob = new Blob([audit_report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `faircore_report_${session_id.slice(0, 8)}.txt`
    a.click()
  }

  return (
    <div className="min-h-screen bg-fc-surface p-6 md:p-12 pb-24">
      {/* Page header */}
      <section className="mb-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="fc-badge-error mb-4 text-[10px]">
            SYSTEM_STATUS: {biasLevel.toUpperCase()}_BIAS_DETECTED
          </div>
          <h1 className="font-bungee text-5xl md:text-8xl leading-none tracking-tighter text-fc-white uppercase">
            BIAS AUDIT <span style={{ color: biasColor }}>OVERVIEW</span>
          </h1>
        </motion.div>

        {/* Top metadata strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-4 border-fc-white shadow-hard mt-8">
          <div className="p-5 bg-fc-surface-high border-r-4 border-fc-white">
            <label className="font-mono text-[9px] text-fc-outline uppercase tracking-widest block mb-1">AUDIT_ID</label>
            <span className="font-headline font-bold text-fc-white">#{session_id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="p-5 bg-fc-surface-high border-r-4 border-fc-white">
            <label className="font-mono text-[9px] text-fc-outline uppercase tracking-widest block mb-1">DATASET</label>
            <span className="font-headline font-bold text-fc-white">{dataset_info.n_samples} rows · {dataset_info.n_features} features</span>
          </div>
          <div className="p-5 bg-fc-error-container">
            <label className="font-mono text-[9px] text-fc-on-error uppercase tracking-widest block mb-1">OVERALL_RISK_INDEX</label>
            <span className="font-bungee text-3xl text-fc-on-error">{(biasScore * 100).toFixed(1)} / 100</span>
          </div>
        </div>
      </section>

      {/* OVERVIEW METRICS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-0 border-4 border-fc-white mb-12">
        <MetricCard label="BIAS_LEVEL" value={biasLevel.toUpperCase()} sub={`score: ${biasScore}`} accent />
        <MetricCard label="ACCURACY_BEFORE" value={`${(before.accuracy * 100).toFixed(1)}%`} />
        <MetricCard label="ACCURACY_AFTER" value={`${(after.after_accuracy * 100).toFixed(1)}%`} sub={`drop: ${(after.verification.accuracy_drop * 100).toFixed(2)}%`} />
        <MetricCard label="METHOD_USED" value={after.method_used.replace('_', ' ').toUpperCase().slice(0, 10)} sub={after.verification.debiasing_successful ? '✓ verified' : '⚠ partial'} />
      </section>

      {/* ALERTS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-fc-yellow text-fc-black p-8 border-4 border-fc-black shadow-hard relative overflow-hidden"
        >
          <div className="absolute -right-8 -top-8 opacity-10">
            <span className="material-symbols-outlined text-[150px]">warning</span>
          </div>
          <h3 className="font-bungee text-2xl mb-3 uppercase">CRITICAL_ALERT</h3>
          <p className="font-headline font-bold text-lg leading-tight mb-4">
            {biasLevel.toUpperCase()} BIAS DETECTED ACROSS {before.protected_attributes_detected.length} PROTECTED ATTRIBUTES: {before.protected_attributes_detected.map(a => a.toUpperCase()).join(', ')}.
          </p>
          <div className="flex flex-wrap gap-2">
            {before.protected_attributes_detected.map(attr => (
              <span key={attr} className="bg-fc-black text-fc-white px-3 py-1 font-mono text-[10px] font-bold uppercase border border-fc-black">
                {attr}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-fc-white text-fc-black p-8 border-4 border-fc-black shadow-hard"
        >
          <h3 className="font-bungee text-2xl mb-4 uppercase">MITIGATION_STATUS</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b-2 border-fc-black pb-3">
              <span className="font-headline font-bold uppercase text-sm">Method Applied</span>
              <span className="font-headline font-bold text-xl">{after.method_used.replace('_', ' ').toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-end border-b-2 border-fc-black pb-3">
              <span className="font-headline font-bold uppercase text-sm">Attrs Improved</span>
              <span className={`font-headline font-bold text-xl ${after.verification.improved_attributes.length > 0 ? 'text-green-700' : 'text-fc-error-container'}`}>
                {after.verification.improved_attributes.length} / {before.protected_attributes_detected.length}
              </span>
            </div>
            <div className="flex justify-between items-end border-b-2 border-fc-black pb-3">
              <span className="font-headline font-bold uppercase text-sm">Accuracy Impact</span>
              <span className="font-headline font-bold text-xl">-{(after.verification.accuracy_drop * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="font-headline font-bold uppercase text-sm">Status</span>
              <span className={`font-headline font-bold text-xl ${after.verification.debiasing_successful ? 'text-green-700' : 'text-orange-600'}`}>
                {after.verification.debiasing_successful ? 'SUCCESS' : 'PARTIAL'}
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* BIAS METRICS PER ATTRIBUTE */}
      <section className="mb-12">
        <div className="fc-badge mb-4">BIAS_METRICS — BEFORE VS AFTER</div>
        {before.protected_attributes_detected.map((attr) => (
          <BiasBarChart
            key={attr}
            attr={attr}
            metrics={before.bias_metrics[attr]}
            afterMetrics={after.after_metrics[attr] || {}}
          />
        ))}
      </section>

      {/* SHAP */}
      <section className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="fc-card p-6">
            <div className="fc-badge mb-4">FEATURE_ATTRIBUTION — SHAP</div>
            <p className="font-body text-xs text-fc-muted mb-6 leading-relaxed">
              SHAP values show which features drive model decisions. High values for features correlated with protected attributes indicate proxy discrimination.
            </p>
            <SHAPChart data={before.shap_importance.top_features} />
            <p className="font-mono text-[9px] text-fc-outline mt-3 uppercase">Method: {before.shap_importance.method}</p>
          </div>

          <div className="fc-card p-6">
            <div className="fc-badge mb-4">INTERROGATION_SUMMARY</div>
            <div className="space-y-3">
              {[
                { label: 'Target Column', value: before.target_column || dataset_info.target_col },
                { label: 'Samples Analyzed', value: before.n_samples?.toString() || dataset_info.n_samples.toString() },
                { label: 'Features Evaluated', value: before.n_features?.toString() || dataset_info.n_features.toString() },
                { label: 'Protected Attrs Found', value: before.protected_attributes_detected.join(', ') },
                { label: 'Disparate Impact Rule', value: Object.values(before.bias_metrics)[0]?.disparate_impact?.passes_80_percent_rule ? 'PASS' : 'FAIL' },
                { label: 'Debiasing Verified', value: after.verification.debiasing_successful ? 'YES' : 'PARTIAL' },
                { label: 'Tradeoff Warning', value: after.verification.tradeoff_warning ? 'YES' : 'NO' },
                { label: 'Attrs Removed', value: after.protected_attrs_removed.length > 0 ? after.protected_attrs_removed.join(', ') : 'NONE (reweighting)' },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-start border-b border-fc-surface-higher pb-2">
                  <span className="font-mono text-[10px] text-fc-outline uppercase tracking-wide">{row.label}</span>
                  <span className="font-headline font-bold text-fc-white text-sm text-right max-w-xs">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COUNTERFACTUAL */}
      {result.counterfactual && !('error' in result.counterfactual) && (
        <section className="mb-12">
          <div className="fc-badge-yellow mb-2">COUNTERFACTUAL_ANALYSIS</div>
          <p className="font-body text-xs text-fc-muted mb-6">If we change only a person's demographic attribute, does the model prediction change? This measures proxy discrimination directly.</p>
          <div className="space-y-4">
            {Object.entries(result.counterfactual).map(([attr, cf]: [string, any]) => (
              <div key={attr} className="fc-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-headline font-black text-lg text-fc-white uppercase">{attr}</h3>
                  <div className="text-right">
                    <span className="font-bungee text-3xl text-fc-yellow">{cf.pct_affected}%</span>
                    <p className="font-mono text-[9px] text-fc-outline uppercase">of sample affected</p>
                  </div>
                </div>
                <p className="font-body text-sm text-fc-muted mb-4 leading-relaxed border-l-4 border-fc-yellow pl-4">{cf.interpretation}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(cf.flip_counts_by_group).map(([group, count]: [string, any]) => (
                    <div key={group} className="bg-fc-surface-higher p-3">
                      <p className="font-mono text-[9px] text-fc-outline uppercase truncate">{group}</p>
                      <p className="font-bungee text-2xl text-fc-yellow">{count}</p>
                      <p className="font-mono text-[9px] text-fc-outline">flipped predictions</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* INTERSECTIONAL */}
      {result.intersectional && !('error' in result.intersectional) && (
        <section className="mb-12">
          <div className="fc-badge mb-2">INTERSECTIONAL_BIAS</div>
          <p className="font-body text-xs text-fc-muted mb-6">Bias compounds at intersections — Black women may face different treatment than Black men or white women. IBM AIF360 doesn't measure this by default.</p>
          <div className="space-y-4">
            {Object.entries(result.intersectional)
              .filter(([, v]: [string, any]) => v.type === 'intersection')
              .map(([key, inter]: [string, any]) => (
                <div key={key} className="fc-card p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-headline font-black text-lg text-fc-white uppercase">{key}</h3>
                      <p className="font-mono text-[9px] text-fc-outline">Max disparity: {(inter.max_disparity * 100).toFixed(1)}%</p>
                    </div>
                    {inter.worst_group && (
                      <div className="text-right">
                        <p className="font-mono text-[9px] text-fc-error uppercase">Worst group</p>
                        <p className="font-headline font-bold text-fc-error text-sm">{inter.worst_group}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {Object.entries(inter.groups)
                      .sort((a: any, b: any) => b[1].positive_rate - a[1].positive_rate)
                      .slice(0, 8)
                      .map(([group, stats]: [string, any]) => (
                        <div key={group} className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-fc-muted w-40 truncate flex-shrink-0">{group}</span>
                          <div className="flex-1 bg-fc-surface-higher h-5 relative">
                            <div className="h-full bg-fc-yellow opacity-80" style={{ width: `${stats.positive_rate * 100}%` }} />
                          </div>
                          <span className="font-mono text-[10px] text-fc-white w-12 text-right">{(stats.positive_rate * 100).toFixed(1)}%</span>
                          <span className="font-mono text-[9px] text-fc-outline w-12 text-right">n={stats.n}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* THRESHOLD SWEEP */}
      {result.threshold_analysis && !result.threshold_analysis.error && result.threshold_analysis.thresholds && (
        <section className="mb-12">
          <div className="fc-badge mb-2">THRESHOLD_SWEEP — ACCURACY VS FAIRNESS</div>
          <p className="font-body text-xs text-fc-muted mb-6">Sweeping the decision threshold shows the accuracy-fairness tradeoff. You can improve fairness without retraining by picking a fairer threshold.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-4 border-fc-white mb-6">
            <div className="p-6 border-r-4 border-fc-white">
              <p className="font-mono text-[9px] text-fc-outline uppercase tracking-widest mb-1">DEFAULT THRESHOLD (0.5)</p>
              <p className="font-bungee text-3xl text-fc-white">{(result.threshold_analysis.accuracy_at_default * 100).toFixed(1)}% acc</p>
              <p className="font-mono text-xs text-fc-error mt-1">Fairness score: {(result.threshold_analysis.fairness_at_default * 100).toFixed(1)}%</p>
            </div>
            <div className="p-6 bg-fc-surface-higher">
              <p className="font-mono text-[9px] text-fc-yellow uppercase tracking-widest mb-1">OPTIMAL THRESHOLD ({result.threshold_analysis.optimal_threshold})</p>
              <p className="font-bungee text-3xl text-fc-white">{(result.threshold_analysis.optimal_accuracy * 100).toFixed(1)}% acc</p>
              <p className="font-mono text-xs text-fc-yellow mt-1">Fairness improves by {(result.threshold_analysis.improvement * 100).toFixed(1)}%</p>
            </div>
          </div>
          <div className="fc-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-fc-white text-fc-black">
                  {['THRESHOLD', 'ACCURACY', 'FAIRNESS SCORE', 'POSITIVE RATE'].map(h => (
                    <th key={h} className="p-3 text-left font-mono text-[9px] uppercase tracking-widest border-r border-fc-black last:border-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.threshold_analysis.thresholds.filter((_, i) => i % 2 === 0).map((row) => (
                  <tr key={row.threshold} className={`border-t-2 border-fc-surface-higher ${row.threshold === result.threshold_analysis.optimal_threshold ? 'bg-fc-yellow text-fc-black' : 'hover:bg-fc-surface-higher'}`}>
                    <td className="p-3 font-mono text-xs border-r border-fc-surface-higher">{row.threshold}{row.threshold === result.threshold_analysis.optimal_threshold ? ' ★ OPTIMAL' : ''}</td>
                    <td className="p-3 font-mono text-xs border-r border-fc-surface-higher">{(row.accuracy * 100).toFixed(1)}%</td>
                    <td className="p-3 font-mono text-xs border-r border-fc-surface-higher">{(row.overall_fairness_score * 100).toFixed(1)}%</td>
                    <td className="p-3 font-mono text-xs">{(row.positive_rate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* GEMINI REPORT */}
      <section className="mb-12">
        <div className="fc-badge-yellow mb-4">GEMINI_AUDIT_REPORT</div>
        <div className="fc-card p-8 border-l-8 border-fc-yellow">
          <pre className="font-body text-sm text-fc-muted leading-relaxed whitespace-pre-wrap">{audit_report}</pre>
        </div>
      </section>

      {/* TRANSPARENCY BANNER */}
      <section className="h-40 relative bg-fc-surface-higher border-4 border-fc-white shadow-hard mb-12 overflow-hidden">
        <div className="absolute inset-0 industrial-grid-yellow opacity-40" />
        <div className="relative z-10 px-8 flex flex-col justify-center h-full">
          <h4 className="font-bungee text-3xl md:text-5xl text-fc-white opacity-40 select-none uppercase">TRANSPARENCY_IS_MANDATORY</h4>
          <p className="font-mono font-black uppercase tracking-[0.3em] text-fc-yellow text-xs mt-2">
            NOISE_THRESHOLD: 0.002% // SYSTEM_TRUST: HIGH // AUDIT_COMPLETE
          </p>
        </div>
      </section>

      {/* DOWNLOADS */}
      <section className="border-t-8 border-fc-white pt-10">
        <div className="fc-badge mb-6">EXPORT_ARTIFACTS</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="fc-card p-6">
            <span className="material-symbols-outlined text-4xl text-fc-yellow mb-4 block">model_training</span>
            <h3 className="font-headline font-black text-xl text-fc-white uppercase mb-2">Debiased Model</h3>
            <p className="font-body text-xs text-fc-muted mb-6">Drop-in replacement for your original model. Same interface, fairer predictions.</p>
            <button onClick={handleDownloadModel} className="fc-btn-primary w-full text-sm">
              ⬇ DOWNLOAD_MODEL.PKL
            </button>
          </div>

          <div className="fc-card p-6">
            <span className="material-symbols-outlined text-4xl text-fc-yellow mb-4 block">description</span>
            <h3 className="font-headline font-black text-xl text-fc-white uppercase mb-2">Audit Report</h3>
            <p className="font-body text-xs text-fc-muted mb-6">Plain-English bias audit generated by Gemini. Ready for stakeholders and compliance teams.</p>
            <button onClick={handleDownloadReport} className="fc-btn-secondary w-full text-sm">
              ⬇ DOWNLOAD_REPORT.TXT
            </button>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button onClick={() => navigate('/investigate')} className="fc-btn-secondary text-sm">
            NEW_INVESTIGATION
          </button>
        </div>
      </section>
    </div>
  )
}

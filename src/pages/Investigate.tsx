import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAnalysis } from '@/lib/AnalysisContext'
import { AnalysisLoadingScreen } from '@/components/ui/Radar'

export default function Investigate() {
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [dataFile, setDataFile] = useState<File | null>(null)
  const [preprocessorFile, setPreprocessorFile] = useState<File | null>(null)
  const [targetCol, setTargetCol] = useState('')
  const [accuracyThreshold, setAccuracyThreshold] = useState(0.05)
  const [modelDrag, setModelDrag] = useState(false)
  const [dataDrag, setDataDrag] = useState(false)
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const modelRef = useRef<HTMLInputElement>(null)
  const dataRef = useRef<HTMLInputElement>(null)
  const prepRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { setResult, setIsLoading, isLoading, backendUrl } = useAnalysis()

  const handleDrop = useCallback((e: React.DragEvent, type: 'model' | 'data') => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (type === 'model') { setModelFile(file); setModelDrag(false) }
    else { setDataFile(file); setDataDrag(false) }
  }, [])

  const handleSubmit = async () => {
    if (!modelFile || !dataFile) {
      setError('Both model artifact and dataset are required.')
      return
    }
    setError('')
    setIsLoading(true)

    const form = new FormData()
    form.append('model_file', modelFile)
    form.append('data_file', dataFile)
    if (preprocessorFile) form.append('preprocessor_file', preprocessorFile)
    form.append('target_column', targetCol)
    form.append('accuracy_threshold', String(accuracyThreshold))

    try {
      const res = await fetch(`${backendUrl}/analyze`, { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Analysis failed')
      }
      const data = await res.json()
      setResult(data)
      navigate('/results')
    } catch (e: any) {
      setError(e.message || 'Connection failed. Is backend running?')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <AnalysisLoadingScreen />

  return (
    <div className="min-h-screen bg-fc-surface p-6 md:p-12 pb-24">
      {/* Page header */}
      <section className="mb-12 relative">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-bungee text-6xl md:text-8xl leading-none tracking-tighter text-fc-white uppercase">
            INITIALIZE<br />AUDIT
          </h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute top-0 right-0 bg-fc-yellow text-fc-black p-4 shard-cut border-4 border-fc-black shadow-hard"
        >
          <p className="font-headline font-black text-lg uppercase">SYSTEM READY</p>
          <p className="font-mono text-[10px]">Smart Ingestion v2.1 | Pipeline-Aware</p>
        </motion.div>
      </section>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-fc-error-container border-4 border-fc-error p-4 flex items-center gap-4"
        >
          <span className="material-symbols-outlined text-fc-error">error</span>
          <span className="font-mono text-sm text-fc-on-error uppercase">{error}</span>
        </motion.div>
      )}

      {/* Smart ingestion info banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-8 bg-fc-surface-high border-2 border-fc-outline p-4 flex flex-wrap gap-6"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-fc-yellow" />
          <span className="font-mono text-[10px] text-fc-muted uppercase tracking-widest">Pipeline auto-detected</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-fc-yellow" />
          <span className="font-mono text-[10px] text-fc-muted uppercase tracking-widest">SHAP auto-selected per model type</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-fc-yellow" />
          <span className="font-mono text-[10px] text-fc-muted uppercase tracking-widest">Binary target auto-encoded (Yes/No → 1/0)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-fc-yellow" />
          <span className="font-mono text-[10px] text-fc-muted uppercase tracking-widest">Feature mismatch auto-resolved</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* LEFT: uploads */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* MODEL ARTIFACT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="fc-card p-8"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-fc-yellow" />
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="fc-badge text-[10px] mb-3">MODULE 01</span>
                <h3 className="font-headline font-black text-3xl text-fc-white uppercase mt-3">MODEL ARTIFACT</h3>
                <p className="font-body text-xs text-fc-outline mt-1">
                  Accepts: RandomForest, GradientBoosting, LogisticRegression, XGBoost (sklearn wrapper), SVM, Pipeline · .pkl or .joblib
                </p>
              </div>
              <span className="material-symbols-outlined text-5xl text-fc-yellow-dim">deployed_code</span>
            </div>

            <div
              onDrop={(e) => handleDrop(e, 'model')}
              onDragOver={(e) => { e.preventDefault(); setModelDrag(true) }}
              onDragLeave={() => setModelDrag(false)}
              onClick={() => modelRef.current?.click()}
              className={`border-4 border-dashed p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 ${
                modelDrag ? 'border-fc-yellow bg-fc-yellow bg-opacity-10' : 'border-fc-outline hover:border-fc-white hover:bg-fc-surface-higher'
              }`}
            >
              <span className={`material-symbols-outlined text-5xl mb-4 transition-transform ${modelDrag ? 'scale-110 text-fc-yellow' : 'text-fc-outline'}`}>
                upload_file
              </span>
              {modelFile ? (
                <div>
                  <p className="font-headline font-black text-fc-yellow uppercase">{modelFile.name}</p>
                  <p className="font-mono text-xs text-fc-outline mt-1">{(modelFile.size / 1024).toFixed(1)} KB · ARTIFACT_LOADED</p>
                </div>
              ) : (
                <div>
                  <p className="font-headline font-bold text-fc-white uppercase">DRAG AND DROP .PKL / .JOBLIB</p>
                  <p className="font-mono text-xs text-fc-outline mt-2">Raw model or sklearn Pipeline — both supported</p>
                </div>
              )}
            </div>
            <input ref={modelRef} type="file" accept=".pkl,.joblib" className="hidden" onChange={(e) => setModelFile(e.target.files?.[0] || null)} />
          </motion.div>

          {/* VALIDATION DATASET */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="fc-card p-8 -rotate-[0.3deg]"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-fc-yellow" />
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="fc-badge text-[10px] mb-3">MODULE 02</span>
                <h3 className="font-headline font-black text-3xl text-fc-white uppercase mt-3">VALIDATION DATASET</h3>
                <p className="font-body text-xs text-fc-outline mt-1">
                  Any tabular CSV · Binary target (0/1 or Yes/No auto-encoded) · String columns auto-label-encoded · Min ~200 rows recommended
                </p>
              </div>
              <span className="material-symbols-outlined text-5xl text-fc-yellow-dim">database</span>
            </div>

            <div
              onDrop={(e) => handleDrop(e, 'data')}
              onDragOver={(e) => { e.preventDefault(); setDataDrag(true) }}
              onDragLeave={() => setDataDrag(false)}
              onClick={() => dataRef.current?.click()}
              className={`border-4 border-dashed p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 ${
                dataDrag ? 'border-fc-yellow bg-fc-yellow bg-opacity-10' : 'border-fc-outline hover:border-fc-white hover:bg-fc-surface-higher'
              }`}
            >
              <span className={`material-symbols-outlined text-5xl mb-4 transition-transform ${dataDrag ? 'scale-110 text-fc-yellow' : 'text-fc-outline'}`}>
                table_chart
              </span>
              {dataFile ? (
                <div>
                  <p className="font-headline font-black text-fc-yellow uppercase">{dataFile.name}</p>
                  <p className="font-mono text-xs text-fc-outline mt-1">{(dataFile.size / 1024).toFixed(1)} KB · DATASET_LOADED</p>
                </div>
              ) : (
                <div>
                  <p className="font-headline font-bold text-fc-white uppercase">DRAG AND DROP .CSV</p>
                  <p className="font-mono text-xs text-fc-outline mt-2">Raw strings OK — FairCore auto-encodes</p>
                </div>
              )}
            </div>
            <input ref={dataRef} type="file" accept=".csv" className="hidden" onChange={(e) => setDataFile(e.target.files?.[0] || null)} />
          </motion.div>

          {/* OPTIONAL PREPROCESSOR */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="fc-card p-6 border-dashed"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="fc-badge text-[10px] mb-2">MODULE 03 — OPTIONAL</span>
                <h3 className="font-headline font-black text-xl text-fc-white uppercase mt-2">PREPROCESSOR ARTIFACT</h3>
                <p className="font-body text-xs text-fc-outline mt-1">
                  Upload StandardScaler, MinMaxScaler, OneHotEncoder, or ColumnTransformer saved separately · Only needed if feature count mismatches · Leave blank for auto-detect
                </p>
              </div>
              <span className="material-symbols-outlined text-3xl text-fc-outline">tune</span>
            </div>

            <div
              onClick={() => prepRef.current?.click()}
              className="border-2 border-dashed border-fc-outline p-6 flex items-center justify-center gap-4 cursor-pointer hover:border-fc-white hover:bg-fc-surface-higher transition-all"
            >
              {preprocessorFile ? (
                <div className="text-center">
                  <p className="font-headline font-black text-fc-yellow uppercase text-sm">{preprocessorFile.name}</p>
                  <p className="font-mono text-[10px] text-fc-outline mt-1">PREPROCESSOR_LOADED</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPreprocessorFile(null) }}
                    className="font-mono text-[10px] text-fc-error uppercase mt-2 hover:underline"
                  >
                    REMOVE
                  </button>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl text-fc-outline">add_circle</span>
                  <div>
                    <p className="font-mono text-xs text-fc-muted uppercase">Upload scaler.pkl / encoder.pkl / preprocessor.pkl</p>
                    <p className="font-mono text-[9px] text-fc-outline mt-1">Leave empty for auto-detect mode</p>
                  </div>
                </>
              )}
            </div>
            <input ref={prepRef} type="file" accept=".pkl,.joblib" className="hidden" onChange={(e) => setPreprocessorFile(e.target.files?.[0] || null)} />
          </motion.div>
        </div>

        {/* RIGHT: parameters */}
        <div className="col-span-12 lg:col-span-4 space-y-6 lg:mt-16">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-fc-yellow text-fc-black border-4 border-fc-black shadow-hard shard-cut-rev p-8"
          >
            <h4 className="font-headline font-black text-xl uppercase italic mb-6">Audit Parameters</h4>

            <div className="space-y-6">
              <div>
                <label className="block font-mono text-[10px] font-black uppercase tracking-widest mb-2">
                  Target Column <span className="opacity-50">(auto-detect if blank)</span>
                </label>
                <input
                  type="text"
                  value={targetCol}
                  onChange={(e) => setTargetCol(e.target.value)}
                  placeholder="e.g. Churn, two_year_recid"
                  className="w-full bg-fc-black text-fc-white border-2 border-fc-black p-3 font-mono text-sm placeholder-fc-outline focus:outline-none focus:border-fc-white"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] font-black uppercase tracking-widest mb-2">
                  Max Accuracy Drop: <span className="text-fc-black font-bold">{(accuracyThreshold * 100).toFixed(0)}%</span>
                </label>
                <input
                  type="range"
                  min={0.01}
                  max={0.15}
                  step={0.01}
                  value={accuracyThreshold}
                  onChange={(e) => setAccuracyThreshold(Number(e.target.value))}
                  className="w-full h-4 bg-fc-black appearance-none border-2 border-fc-black accent-fc-black cursor-pointer"
                />
                <div className="flex justify-between font-mono text-[9px] font-black mt-1">
                  <span>LOW_TOLERANCE</span>
                  <span>CRITICAL</span>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] font-black uppercase tracking-widest mb-2">
                  Protected Attribute Detection
                </label>
                <div className="bg-fc-black px-4 py-2 border-2 border-fc-black inline-block">
                  <span className="font-mono text-[10px] text-fc-yellow uppercase tracking-widest">AUTO-DETECT ENABLED</span>
                </div>
                <p className="font-mono text-[9px] mt-2 opacity-60">
                  Via mutual information + chi-squared test
                </p>
              </div>
            </div>
          </motion.div>

          {/* Status shard */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-fc-surface-higher border-4 border-fc-white p-6 rotate-[0.5deg]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-3 h-3 ${modelFile && dataFile ? 'bg-fc-yellow animate-pulse-slow' : 'bg-fc-outline'}`} />
              <span className="font-headline font-black text-sm text-fc-white uppercase">
                {modelFile && dataFile ? 'INTERROGATOR_READY' : 'AWAITING_ARTIFACTS'}
              </span>
            </div>
            <div className="space-y-2 mt-3">
              {[
                { label: 'MODEL', loaded: !!modelFile, name: modelFile?.name },
                { label: 'DATASET', loaded: !!dataFile, name: dataFile?.name },
                { label: 'PREPROCESSOR', loaded: !!preprocessorFile, name: preprocessorFile?.name || 'AUTO-DETECT', optional: true },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${item.loaded ? 'text-fc-yellow' : item.optional ? 'text-fc-outline' : 'text-fc-outline'}`}>
                    {item.loaded ? '✓' : item.optional ? '○' : '○'}
                  </span>
                  <span className="font-mono text-[9px] text-fc-outline uppercase">{item.label}_</span>
                  <span className={`font-mono text-[9px] uppercase truncate max-w-24 ${item.loaded ? 'text-fc-yellow' : 'text-fc-outline'}`}>
                    {item.loaded ? item.name : item.optional ? 'OPTIONAL' : 'PENDING'}
                  </span>
                </div>
              ))}
            </div>

            {/* Smart mode indicators */}
            <div className="mt-4 pt-4 border-t border-fc-surface-high space-y-1">
              <p className="font-mono text-[9px] text-fc-outline uppercase tracking-widest mb-2">SMART_INGESTION_MODE</p>
              <div className="font-mono text-[9px] text-fc-yellow uppercase">
                {preprocessorFile ? '→ EXTERNAL_PREPROCESSOR' : '→ AUTO_DETECT + ENCODE'}
              </div>
              <div className="font-mono text-[9px] text-fc-muted uppercase">
                SHAP: TREE → LINEAR → KERNEL → COEF
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* EXECUTE */}
      <section className="mt-16 flex flex-col md:flex-row items-center gap-8 border-t-8 border-fc-white pt-10">
        <div className="flex-grow">
          <p className="font-bungee text-3xl md:text-4xl text-fc-white uppercase">EXECUTE_INVESTIGATION</p>
          <p className="font-mono text-xs text-fc-outline uppercase tracking-widest mt-2">
            Once initialized, the audit process cannot be paused or reverted.
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!modelFile || !dataFile}
          className={`font-headline font-black text-2xl md:text-3xl px-10 py-6 border-4 uppercase italic transition-all duration-100 ${
            modelFile && dataFile
              ? 'bg-fc-yellow text-fc-black border-fc-black shadow-hard-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer'
              : 'bg-fc-surface-higher text-fc-outline border-fc-outline cursor-not-allowed'
          }`}
        >
          Confirm & Start
        </button>
      </section>
    </div>
  )
}
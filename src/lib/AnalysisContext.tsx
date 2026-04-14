import { createContext, useContext, useState, ReactNode } from 'react'

export interface AnalysisResult {
  status: string
  session_id: string
  dataset_info: {
    n_samples: number
    n_features: number
    target_col: string
    target_classes: number
    categorical_features: string[]
    numerical_features: string[]
    columns: string[]
  }
  before: {
    accuracy: number
    protected_attributes_detected: string[]
    bias_metrics: Record<string, {
      demographic_parity: { group_rates: Record<string, number>; difference: number }
      equalized_odds: { tpr_by_group: Record<string, number>; fpr_by_group: Record<string, number>; tpr_difference: number; fpr_difference: number }
      disparate_impact: { group_rates: Record<string, number>; ratio: number; passes_80_percent_rule: boolean }
    }>
    shap_importance: { top_features: Record<string, number>; method: string }
    overall_bias_score: { score: number; level: string }
    target_column: string
    n_samples: number
    n_features: number
  }
  after: {
    method_used: string
    after_accuracy: number
    after_metrics: Record<string, any>
    verification: {
      improved_attributes: string[]
      degraded_attributes: string[]
      accuracy_drop: number
      debiasing_successful: boolean
      tradeoff_warning: boolean
    }
    protected_attrs_removed: string[]
  }
  counterfactual: Record<string, {
    flip_counts_by_group: Record<string, number>
    flip_rates_by_group: Record<string, number>
    total_affected: number
    sample_size: number
    pct_affected: number
    interpretation: string
  }>
  intersectional: Record<string, {
    type: string
    groups: Record<string, { n: number; positive_rate: number }>
    max_disparity: number
    worst_group?: string
    best_group?: string
  }>
  threshold_analysis: {
    thresholds: Array<{
      threshold: number
      accuracy: number
      overall_fairness_score: number
      positive_rate: number
    }>
    default_threshold: number
    optimal_threshold: number
    optimal_fairness_score: number
    optimal_accuracy: number
    accuracy_at_default: number
    fairness_at_default: number
    improvement: number
    error?: string
  }
  audit_report: string
  debiased_model_b64: string
}

interface AnalysisContextType {
  result: AnalysisResult | null
  setResult: (r: AnalysisResult) => void
  isLoading: boolean
  setIsLoading: (v: boolean) => void
  backendUrl: string
}

const AnalysisContext = createContext<AnalysisContextType | null>(null)

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  return (
    <AnalysisContext.Provider value={{ result, setResult, isLoading, setIsLoading, backendUrl }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext)
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider')
  return ctx
}

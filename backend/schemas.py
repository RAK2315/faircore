from pydantic import BaseModel
from typing import Optional, Any


class HealthResponse(BaseModel):
    status: str
    version: str


class DatasetInfo(BaseModel):
    n_samples: int
    n_features: int
    target_col: str
    target_classes: int
    categorical_features: list[str]
    numerical_features: list[str]
    missing_values: dict[str, int]
    columns: list[str]


class CompatibilityCheck(BaseModel):
    compatible: bool
    issues: list[str]
    n_features_in_data: int
    n_features_in_model: Optional[int]
    target_col: str
    n_samples: int


class GroupRates(BaseModel):
    group_rates: dict[str, float]
    difference: Optional[float] = None
    ratio: Optional[float] = None
    passes_80_percent_rule: Optional[bool] = None


class EqualizedOdds(BaseModel):
    tpr_by_group: dict[str, float]
    fpr_by_group: dict[str, float]
    tpr_difference: float
    fpr_difference: float


class AttributeBiasMetrics(BaseModel):
    demographic_parity: GroupRates
    equalized_odds: EqualizedOdds
    disparate_impact: GroupRates


class OverallBiasScore(BaseModel):
    score: float
    level: str


class SHAPResult(BaseModel):
    top_features: dict[str, float]
    method: str


class BiasAnalysisResult(BaseModel):
    accuracy: float
    protected_attributes_detected: list[str]
    bias_metrics: dict[str, AttributeBiasMetrics]
    shap_importance: SHAPResult
    overall_bias_score: OverallBiasScore
    target_column: str
    n_samples: int
    n_features: int


class VerificationResult(BaseModel):
    improved_attributes: list[str]
    degraded_attributes: list[str]
    accuracy_drop: float
    accuracy_drop_threshold: float
    accuracy_acceptable: bool
    debiasing_successful: bool
    tradeoff_warning: bool


class DebiasingResult(BaseModel):
    method_used: str
    after_accuracy: float
    after_metrics: dict[str, Any]
    verification: VerificationResult
    features_used: list[str]
    protected_attrs_removed: list[str]


class FullAnalysisResponse(BaseModel):
    status: str
    dataset_info: DatasetInfo
    compatibility: CompatibilityCheck
    before: BiasAnalysisResult
    after: DebiasingResult
    audit_report: str
    debiased_model_b64: str
    session_id: str


class ErrorResponse(BaseModel):
    status: str
    error: str
    detail: Optional[str] = None

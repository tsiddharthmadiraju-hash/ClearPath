export type Urgency = 'immediate' | 'this_week' | 'no_deadline';
export type Confidence = 'high' | 'medium' | 'low';

export interface ChecklistStep {
  step: number;
  action: string;
  deadline: string | null;
  urgency: Urgency;
  detail: string;
}

export interface Resource {
  name: string;
  type: string;
  what_they_do: string;
  phone: string | null;
  website: string | null;
  call_script: string;
}

export interface Analysis {
  document_type: string;
  plain_explanation: string;
  action_checklist: ChecklistStep[];
  resources: Resource[];
  confidence: Confidence;
  confidence_reason: string;
  disclaimer: string;
  _meta?: { mode: string; model: string; inputMethod: string; issues: string[] };
}

export interface AnalyzeInput {
  text?: string;
  image?: string;
  mediaType?: string;
  pdfBase64?: string;
  location?: string;
  inputMethod?: string;
  language?: string;
}

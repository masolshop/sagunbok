
export enum ModuleType {
  CORP_TAX = 'corp_tax',
  PERSONAL_TAX = 'personal_tax',
  WELFARE_CONVERSION = 'welfare_conversion',
  RAISE_TO_FUND = 'raise_to_fund',
  PAYDOCTOR_NET = 'paydoctor_net',
  CEO_TAX = 'ceo_tax'
}

export interface CalculationResult {
  module: ModuleType;
  inputs: any;
  result: any;
  timestamp: string;
}

export interface DiagnosisResult {
  overall: number;
  results: Array<{
    key: string;
    title: string;
    score: number;
    level: string;
    answers: number[];
  }>;
  top3: Array<{
    title: string;
    score: number;
  }>;
}

export interface CompanyContext {
  companyName: string;
  region: string;
  employeeCount: number | null;
  avgSalary: number | null;
  welfareTotal: number | null;
  dueFromCeo: number | null;
  retainedEarnings: number | null;
}

export interface ReportSubmission {
  id: string;
  companyName: string;
  companyContext: CompanyContext;
  diagnosisResult: DiagnosisResult | null;
  calcResults: CalculationResult[];
  aiAnalysis: any | null;
  submittedAt: string;
}

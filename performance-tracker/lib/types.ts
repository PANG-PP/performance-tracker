export type EvaluationCycle = "1" | "2";

export interface Category {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkRecord {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  startDate: string;
  endDate: string;
  fiscalYear: number;
  cycle: EvaluationCycle;
  evidenceUrl: string;
  details: string;
  createdAt: string;
  updatedAt: string;
}

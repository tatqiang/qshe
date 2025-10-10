// Supabase type helpers to resolve 'never' type issues
export type SupabaseResponse<T = any> = {
  data: T[] | T | null;
  error: any;
  status: number;
  statusText: string;
};

export type SupabaseQueryBuilder<T = any> = {
  select: (columns?: string) => SupabaseQueryBuilder<T>;
  insert: (values: any | any[]) => SupabaseQueryBuilder<T>;
  update: (values: any) => SupabaseQueryBuilder<T>;
  delete: () => SupabaseQueryBuilder<T>;
  eq: (column: string, value: any) => SupabaseQueryBuilder<T>;
  neq: (column: string, value: any) => SupabaseQueryBuilder<T>;
  gt: (column: string, value: any) => SupabaseQueryBuilder<T>;
  gte: (column: string, value: any) => SupabaseQueryBuilder<T>;
  lt: (column: string, value: any) => SupabaseQueryBuilder<T>;
  lte: (column: string, value: any) => SupabaseQueryBuilder<T>;
  like: (column: string, pattern: string) => SupabaseQueryBuilder<T>;
  ilike: (column: string, pattern: string) => SupabaseQueryBuilder<T>;
  is: (column: string, value: any) => SupabaseQueryBuilder<T>;
  in: (column: string, values: any[]) => SupabaseQueryBuilder<T>;
  contains: (column: string, value: any) => SupabaseQueryBuilder<T>;
  containedBy: (column: string, value: any) => SupabaseQueryBuilder<T>;
  rangeGt: (column: string, range: string) => SupabaseQueryBuilder<T>;
  rangeGte: (column: string, range: string) => SupabaseQueryBuilder<T>;
  rangeLt: (column: string, range: string) => SupabaseQueryBuilder<T>;
  rangeLte: (column: string, range: string) => SupabaseQueryBuilder<T>;
  rangeAdjacent: (column: string, range: string) => SupabaseQueryBuilder<T>;
  overlaps: (column: string, value: any) => SupabaseQueryBuilder<T>;
  textSearch: (column: string, query: string) => SupabaseQueryBuilder<T>;
  match: (query: Record<string, any>) => SupabaseQueryBuilder<T>;
  not: (column: string, operator: string, value: any) => SupabaseQueryBuilder<T>;
  or: (filters: string) => SupabaseQueryBuilder<T>;
  filter: (column: string, operator: string, value: any) => SupabaseQueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) => SupabaseQueryBuilder<T>;
  limit: (count: number) => SupabaseQueryBuilder<T>;
  range: (from: number, to: number) => SupabaseQueryBuilder<T>;
  single: () => Promise<SupabaseResponse<T>>;
  maybeSingle: () => Promise<SupabaseResponse<T | null>>;
  csv: () => Promise<SupabaseResponse<string>>;
  then: (onfulfilled?: (value: SupabaseResponse<T[]>) => any) => Promise<any>;
};

// Type assertion helpers
export const asSupabaseQuery = <T = any>(query: any): SupabaseQueryBuilder<T> => query as SupabaseQueryBuilder<T>;
export const asSupabaseResponse = <T = any>(response: any): SupabaseResponse<T> => response as SupabaseResponse<T>;

// Common table types
export interface SafetyPatrol {
  id: string;
  title: string;
  description: string;
  patrol_type: string;
  project_id: string;
  main_area: string;
  sub_area1?: string;
  sub_area2?: string;
  specific_location: string;
  likelihood: number;
  severity: number;
  immediate_hazard: boolean;
  work_stopped: boolean;
  legal_requirement: boolean;
  regulation_reference?: string;
  patrol_number: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CorrectiveAction {
  id: string;
  patrol_id: string;
  action_number: string;
  description: string;
  action_type: string;
  root_cause_analysis: string;
  assigned_to: string;
  due_date: string;
  status: string;
  estimated_cost: number;
  resources_required: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectData {
  id: string;
  name: string;
  code: string;
  status: string;
  created_at: string;
  updated_at: string;
}

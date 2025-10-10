// Global type declarations to fix Supabase 'never' type issues
declare module '@supabase/supabase-js' {
  export interface PostgrestFilterBuilder<
    Schema extends Record<string, Record<string, unknown>>,
    Row extends Record<string, unknown>,
    Result,
    RelationName = unknown,
    Relationships = unknown
  > {
    select: <Query extends string = '*'>(
      columns?: Query,
      options?: { 
        head?: boolean; 
        count?: 'exact' | 'planned' | 'estimated' 
      }
    ) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    
    insert: (
      values: Partial<Row> | Partial<Row>[],
      options?: { 
        count?: 'exact' | 'planned' | 'estimated';
        defaultToNull?: boolean;
      }
    ) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    
    update: (
      values: Partial<Row>,
      options?: { 
        count?: 'exact' | 'planned' | 'estimated' 
      }
    ) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    
    delete: (
      options?: { 
        count?: 'exact' | 'planned' | 'estimated' 
      }
    ) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    
    eq: (column: keyof Row, value: any) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    neq: (column: keyof Row, value: any) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    gt: (column: keyof Row, value: any) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    gte: (column: keyof Row, value: any) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    lt: (column: keyof Row, value: any) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    lte: (column: keyof Row, value: any) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    like: (column: keyof Row, pattern: string) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    ilike: (column: keyof Row, pattern: string) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    is: (column: keyof Row, value: any) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    in: (column: keyof Row, values: any[]) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    contains: (column: keyof Row, value: any) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    order: (column: keyof Row, options?: { ascending?: boolean }) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    limit: (count: number) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    range: (from: number, to: number) => PostgrestFilterBuilder<Schema, Row, any, RelationName, Relationships>;
    single: () => Promise<{ data: Row | null; error: any; status: number; statusText: string }>;
    maybeSingle: () => Promise<{ data: Row | null; error: any; status: number; statusText: string }>;
    then: (
      onfulfilled?: (value: { data: Row[] | null; error: any; status: number; statusText: string }) => any
    ) => Promise<any>;
  }

  export interface SupabaseClient<
    Database = any,
    SchemaName extends string & keyof Database = 'public' extends keyof Database
      ? 'public'
      : string & keyof Database,
    Schema extends Record<string, Record<string, unknown>> = Database[SchemaName] extends Record<
      string,
      Record<string, unknown>
    >
      ? Database[SchemaName]
      : any
  > {
    from: <TableName extends string & keyof Schema>(
      relation: TableName
    ) => PostgrestFilterBuilder<Schema, any, any, TableName, any>;
    
    rpc: <FunctionName extends string, Args = any>(
      fn: FunctionName,
      args?: Args,
      options?: any
    ) => Promise<{ data: any; error: any; status: number; statusText: string }>;
  }
}

// Re-export commonly used types with permissive defaults
export type SupabaseResponse<T = any> = {
  data: T | null;
  error: any;
  status: number;
  statusText: string;
};

export type SupabaseArrayResponse<T = any> = {
  data: T[] | null;
  error: any;
  status: number;
  statusText: string;
};

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

type AnyTable = {
  Row: Record<string, any>
  Insert: Record<string, any>
  Update: Record<string, any>
  Relationships: []
}

export interface Database {
  public: {
    Tables: Record<string, AnyTable>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

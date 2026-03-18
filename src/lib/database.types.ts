export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          industry: string | null
          website: string | null
          logo_url: string | null
          brand_primary: string
          brand_accent: string
          subdomain: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          industry?: string | null
          website?: string | null
          logo_url?: string | null
          brand_primary?: string
          brand_accent?: string
          subdomain?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          industry?: string | null
          website?: string | null
          logo_url?: string | null
          brand_primary?: string
          brand_accent?: string
          subdomain?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          org_id: string | null
          role: 'Admin' | 'Editor' | 'Viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          org_id?: string | null
          role?: 'Admin' | 'Editor' | 'Viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          role?: 'Admin' | 'Editor' | 'Viewer'
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          org_id: string
          name: string
          category: 'Policy' | 'Certificate' | 'Report' | 'Legal'
          access_level: 'Public' | 'Registered' | 'NDA Required' | 'Request Access'
          file_path: string
          expiry_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          category: 'Policy' | 'Certificate' | 'Report' | 'Legal'
          access_level: 'Public' | 'Registered' | 'NDA Required' | 'Request Access'
          file_path: string
          expiry_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          category?: 'Policy' | 'Certificate' | 'Report' | 'Legal'
          access_level?: 'Public' | 'Registered' | 'NDA Required' | 'Request Access'
          file_path?: string
          expiry_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      security_answers: {
        Row: {
          id: string
          org_id: string
          section: string
          question_id: string
          answer_value: Json | null
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          section: string
          question_id: string
          answer_value?: Json | null
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          section?: string
          question_id?: string
          answer_value?: Json | null
          updated_at?: string
        }
      }
      subprocessors: {
        Row: {
          id: string
          org_id: string
          name: string
          purpose: string
          location: string
          security_docs: string[]
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          purpose: string
          location: string
          security_docs?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          purpose?: string
          location?: string
          security_docs?: string[]
          created_at?: string
        }
      }
      faqs: {
        Row: {
          id: string
          org_id: string
          question: string
          answer: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          question: string
          answer: string
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          question?: string
          answer?: string
          order_index?: number
          created_at?: string
        }
      }
      access_requests: {
        Row: {
          id: string
          doc_id: string
          org_id: string
          requester_email: string
          reason: string | null
          status: 'Pending' | 'Approved' | 'Rejected'
          nda_signed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          doc_id: string
          org_id: string
          requester_email: string
          reason?: string | null
          status?: 'Pending' | 'Approved' | 'Rejected'
          nda_signed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          doc_id?: string
          org_id?: string
          requester_email?: string
          reason?: string | null
          status?: 'Pending' | 'Approved' | 'Rejected'
          nda_signed?: boolean
          created_at?: string
        }
      }
    }
  }
}

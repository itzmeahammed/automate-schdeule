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
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          profile_image: string | null
          company_name: string | null
          company_address: string | null
          department: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: string
          profile_image?: string | null
          company_name?: string | null
          company_address?: string | null
          department?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          profile_image?: string | null
          company_name?: string | null
          company_address?: string | null
          department?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      machines: {
        Row: {
          id: string
          machine_name: string
          machine_type: string
          capacity: string
          working_hours: number | null
          shift_timing: string
          status: string
          location: string
          efficiency: number
          last_maintenance: string
          next_maintenance: string
          operator_id: string | null
          specifications: Json
          problems: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          machine_name: string
          machine_type: string
          capacity: string
          working_hours?: number | null
          shift_timing: string
          status?: string
          location: string
          efficiency?: number
          last_maintenance: string
          next_maintenance: string
          operator_id?: string | null
          specifications?: Json
          problems?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          machine_name?: string
          machine_type?: string
          capacity?: string
          working_hours?: number | null
          shift_timing?: string
          status?: string
          location?: string
          efficiency?: number
          last_maintenance?: string
          next_maintenance?: string
          operator_id?: string | null
          specifications?: Json
          problems?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          product_name: string
          part_number: string
          drawing_number: string
          process_flow: Json
          priority: string
          category: string
          description: string
          specifications: Json
          quality_standards: string[]
          estimated_cost: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_name: string
          part_number: string
          drawing_number: string
          process_flow?: Json
          priority?: string
          category: string
          description: string
          specifications?: Json
          quality_standards?: string[]
          estimated_cost?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_name?: string
          part_number?: string
          drawing_number?: string
          process_flow?: Json
          priority?: string
          category?: string
          description?: string
          specifications?: Json
          quality_standards?: string[]
          estimated_cost?: number
          created_at?: string
          updated_at?: string
        }
      }
      purchase_orders: {
        Row: {
          id: string
          po_number: string
          po_date: string
          product_id: string
          quantity: number
          delivery_date: string
          remarks: string
          status: string
          customer_name: string
          customer_contact: string
          urgency_level: string
          special_instructions: string
          estimated_value: number
          actual_start_date: string | null
          actual_completion_date: string | null
          quality_approved: boolean
          priority: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          po_number: string
          po_date: string
          product_id: string
          quantity: number
          delivery_date: string
          remarks?: string
          status?: string
          customer_name: string
          customer_contact: string
          urgency_level?: string
          special_instructions?: string
          estimated_value?: number
          actual_start_date?: string | null
          actual_completion_date?: string | null
          quality_approved?: boolean
          priority?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          po_number?: string
          po_date?: string
          product_id?: string
          quantity?: number
          delivery_date?: string
          remarks?: string
          status?: string
          customer_name?: string
          customer_contact?: string
          urgency_level?: string
          special_instructions?: string
          estimated_value?: number
          actual_start_date?: string | null
          actual_completion_date?: string | null
          quality_approved?: boolean
          priority?: string
          created_at?: string
          updated_at?: string
        }
      }
      schedule_items: {
        Row: {
          id: string
          po_id: string
          product_id: string
          machine_id: string
          process_step: number
          start_date: string
          end_date: string
          status: string
          priority: string
          quantity: number
          allocated_time: number
          efficiency: number
          quality_score: number
          progress: number | null
          notes: string | null
          dependencies: string[] | null
          actual_start_time: string | null
          actual_end_time: string | null
          pause_times: Json | null
          action_history: Json | null
          overtime_records: Json | null
          planned_overtime_hours: number | null
          actual_overtime_hours: number | null
          scheduling_mode: string | null
          manual_override: boolean | null
          last_auto_update: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          po_id: string
          product_id: string
          machine_id: string
          process_step: number
          start_date: string
          end_date: string
          status?: string
          priority?: string
          quantity: number
          allocated_time: number
          efficiency?: number
          quality_score?: number
          progress?: number | null
          notes?: string | null
          dependencies?: string[] | null
          actual_start_time?: string | null
          actual_end_time?: string | null
          pause_times?: Json | null
          action_history?: Json | null
          overtime_records?: Json | null
          planned_overtime_hours?: number | null
          actual_overtime_hours?: number | null
          scheduling_mode?: string | null
          manual_override?: boolean | null
          last_auto_update?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          po_id?: string
          product_id?: string
          machine_id?: string
          process_step?: number
          start_date?: string
          end_date?: string
          status?: string
          priority?: string
          quantity?: number
          allocated_time?: number
          efficiency?: number
          quality_score?: number
          progress?: number | null
          notes?: string | null
          dependencies?: string[] | null
          actual_start_time?: string | null
          actual_end_time?: string | null
          pause_times?: Json | null
          action_history?: Json | null
          overtime_records?: Json | null
          planned_overtime_hours?: number | null
          actual_overtime_hours?: number | null
          scheduling_mode?: string | null
          manual_override?: boolean | null
          last_auto_update?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          shift_name: string
          timing: Json
          break_times: Json
          working_days: string[]
          is_active: boolean
          color: string
          description: string | null
          start_time: string | null
          end_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shift_name: string
          timing: Json
          break_times?: Json
          working_days?: string[]
          is_active?: boolean
          color?: string
          description?: string | null
          start_time?: string | null
          end_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shift_name?: string
          timing?: Json
          break_times?: Json
          working_days?: string[]
          is_active?: boolean
          color?: string
          description?: string | null
          start_time?: string | null
          end_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          type: string
          title: string
          message: string
          timestamp: string
          is_read: boolean
          action_required: boolean
          related_entity: Json | null
          completed: boolean | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          title: string
          message: string
          timestamp?: string
          is_read?: boolean
          action_required?: boolean
          related_entity?: Json | null
          completed?: boolean | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          title?: string
          message?: string
          timestamp?: string
          is_read?: boolean
          action_required?: boolean
          related_entity?: Json | null
          completed?: boolean | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          type: string
          severity: string
          message: string
          suggested_actions: string[]
          affected_entities: string[]
          timestamp: string
          is_resolved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          severity: string
          message: string
          suggested_actions?: string[]
          affected_entities?: string[]
          timestamp?: string
          is_resolved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          severity?: string
          message?: string
          suggested_actions?: string[]
          affected_entities?: string[]
          timestamp?: string
          is_resolved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      holidays: {
        Row: {
          id: string
          date: string
          reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

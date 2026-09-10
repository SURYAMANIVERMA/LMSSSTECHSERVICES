export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          summary: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          summary?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          summary?: string | null
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          answer_text: string | null
          assignment_id: string
          course_id: string
          created_at: string
          feedback: string | null
          file_url: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          score: number | null
          student_id: string
          updated_at: string
        }
        Insert: {
          answer_text?: string | null
          assignment_id: string
          course_id: string
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          student_id: string
          updated_at?: string
        }
        Update: {
          answer_text?: string | null
          assignment_id?: string
          course_id?: string
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          course_id: string
          created_at: string
          due_at: string | null
          id: string
          instructions: string | null
          max_score: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          due_at?: string | null
          id?: string
          instructions?: string | null
          max_score?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          due_at?: string | null
          id?: string
          instructions?: string | null
          max_score?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_updates: {
        Row: {
          author_id: string | null
          author_name: string | null
          booking_id: string
          created_at: string
          from_status: Database["public"]["Enums"]["booking_status"] | null
          id: string
          note: string | null
          to_status: Database["public"]["Enums"]["booking_status"] | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          booking_id: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["booking_status"] | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          booking_id?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["booking_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_updates_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "service_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          certificate_no: string
          course_id: string
          course_title: string | null
          created_at: string
          id: string
          issued_at: string
          issued_by: string | null
          status: string
          student_email: string | null
          student_id: string
          student_name: string | null
          student_phone: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          certificate_no?: string
          course_id: string
          course_title?: string | null
          created_at?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          status?: string
          student_email?: string | null
          student_id: string
          student_name?: string | null
          student_phone?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          certificate_no?: string
          course_id?: string
          course_title?: string | null
          created_at?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          status?: string
          student_email?: string | null
          student_id?: string
          student_name?: string | null
          student_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string
          cover_url: string | null
          created_at: string
          description: string | null
          duration_hours: number
          id: string
          instructor: string | null
          is_published: boolean
          level: string
          price_inr: number
          short_description: string | null
          slug: string
          sort_order: number
          status: string
          summary: string | null
          title: string
          trainer_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number
          id?: string
          instructor?: string | null
          is_published?: boolean
          level?: string
          price_inr?: number
          short_description?: string | null
          slug: string
          sort_order?: number
          status?: string
          summary?: string | null
          title: string
          trainer_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number
          id?: string
          instructor?: string | null
          is_published?: boolean
          level?: string
          price_inr?: number
          short_description?: string | null
          slug?: string
          sort_order?: number
          status?: string
          summary?: string | null
          title?: string
          trainer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_health_events: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string | null
          status?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: string
          created_at: string
          id: string
          progress_percent: number
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          progress_percent?: number
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          progress_percent?: number
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string
          service: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone: string
          service: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string
          service?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          last_accessed_at: string | null
          lesson_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          lesson_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          lesson_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_free: boolean
          lesson_type: string
          module_id: string | null
          pdf_url: string | null
          position: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_free?: boolean
          lesson_type?: string
          module_id?: string | null
          pdf_url?: string | null
          position?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_free?: boolean
          lesson_type?: string
          module_id?: string | null
          pdf_url?: string | null
          position?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          body: string | null
          certificate_id: string | null
          channel: string
          created_at: string
          error_message: string | null
          id: string
          recipient: string | null
          status: string
          subject: string | null
        }
        Insert: {
          body?: string | null
          certificate_id?: string | null
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          body?: string | null
          certificate_id?: string | null
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_inr: number
          booking_id: string | null
          course_id: string | null
          created_at: string
          currency: string
          customer_email: string | null
          error_message: string | null
          id: string
          order_id: string
          payment_id: string | null
          provider: string
          purpose: string
          signature: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_inr: number
          booking_id?: string | null
          course_id?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          error_message?: string | null
          id?: string
          order_id: string
          payment_id?: string | null
          provider?: string
          purpose: string
          signature?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_inr?: number
          booking_id?: string | null
          course_id?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          error_message?: string | null
          id?: string
          order_id?: string
          payment_id?: string | null
          provider?: string
          purpose?: string
          signature?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "service_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          mobile_number: string | null
          phone: string | null
          status: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          mobile_number?: string | null
          phone?: string | null
          status?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          mobile_number?: string | null
          phone?: string | null
          status?: string
          username?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          attempt_number: number
          course_id: string
          created_at: string
          id: string
          passed: boolean
          quiz_id: string
          score_percent: number
          student_id: string
        }
        Insert: {
          answers?: Json
          attempt_number?: number
          course_id: string
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id: string
          score_percent?: number
          student_id: string
        }
        Update: {
          answers?: Json
          attempt_number?: number
          course_id?: string
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score_percent?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_index: number
          course_id: string
          created_at: string
          explanation: string | null
          id: string
          marks: number
          options: Json
          position: number
          question: string
          quiz_id: string
          updated_at: string
        }
        Insert: {
          correct_index?: number
          course_id: string
          created_at?: string
          explanation?: string | null
          id?: string
          marks?: number
          options?: Json
          position?: number
          question: string
          quiz_id: string
          updated_at?: string
        }
        Update: {
          correct_index?: number
          course_id?: string
          created_at?: string
          explanation?: string | null
          id?: string
          marks?: number
          options?: Json
          position?: number
          question?: string
          quiz_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          lesson_id: string | null
          pass_percent: number
          retake_limit: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          pass_percent?: number
          retake_limit?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          pass_percent?: number
          retake_limit?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_index_snapshots: {
        Row: {
          created_by: string | null
          id: string
          refreshed_at: string
          routes: Json
          site_url: string
          sitemap: Json | null
        }
        Insert: {
          created_by?: string | null
          id?: string
          refreshed_at?: string
          routes?: Json
          site_url: string
          sitemap?: Json | null
        }
        Update: {
          created_by?: string | null
          id?: string
          refreshed_at?: string
          routes?: Json
          site_url?: string
          sitemap?: Json | null
        }
        Relationships: []
      }
      service_bookings: {
        Row: {
          address: string | null
          admin_notes: string | null
          amount_inr: number
          assigned_to: string | null
          city: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          engineer_name: string | null
          id: string
          notes: string | null
          payment_status: string
          public_ref: string
          scheduled_date: string
          scheduled_slot: string
          service_title: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          amount_inr?: number
          assigned_to?: string | null
          city?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          engineer_name?: string | null
          id?: string
          notes?: string | null
          payment_status?: string
          public_ref: string
          scheduled_date: string
          scheduled_slot: string
          service_title: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          amount_inr?: number
          assigned_to?: string | null
          city?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          engineer_name?: string | null
          id?: string
          notes?: string | null
          payment_status?: string
          public_ref?: string
          scheduled_date?: string
          scheduled_slot?: string
          service_title?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          address: string | null
          admin_notes: string | null
          assigned_to: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          detail: string | null
          engineer_name: string | null
          id: string
          issue_type: string
          public_ref: string
          status: Database["public"]["Enums"]["ticket_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          assigned_to?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          detail?: string | null
          engineer_name?: string | null
          id?: string
          issue_type: string
          public_ref?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          assigned_to?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          detail?: string | null
          engineer_name?: string | null
          id?: string
          issue_type?: string
          public_ref?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          updated_at?: string
        }
        Relationships: []
      }
      ticket_updates: {
        Row: {
          author_id: string | null
          author_name: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["ticket_status"] | null
          id: string
          note: string | null
          ticket_id: string
          to_status: Database["public"]["Enums"]["ticket_status"] | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["ticket_status"] | null
          id?: string
          note?: string | null
          ticket_id: string
          to_status?: Database["public"]["Enums"]["ticket_status"] | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["ticket_status"] | null
          id?: string
          note?: string | null
          ticket_id?: string
          to_status?: Database["public"]["Enums"]["ticket_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_updates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_course_assignments: {
        Row: {
          assigned_by: string | null
          can_grade: boolean
          can_manage_content: boolean
          can_manage_quizzes: boolean
          course_id: string
          created_at: string
          id: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          can_grade?: boolean
          can_manage_content?: boolean
          can_manage_quizzes?: boolean
          course_id: string
          created_at?: string
          id?: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          can_grade?: boolean
          can_manage_content?: boolean
          can_manage_quizzes?: boolean
          course_id?: string
          created_at?: string
          id?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_course: { Args: { _course_id: string }; Returns: boolean }
      get_booking_public: {
        Args: { p_ref: string }
        Returns: {
          amount_inr: number
          created_at: string
          customer_name: string
          engineer_name: string
          payment_status: string
          public_ref: string
          scheduled_date: string
          scheduled_slot: string
          service_title: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }[]
      }
      get_booking_timeline_public: {
        Args: { p_ref: string }
        Returns: {
          author_name: string
          created_at: string
          note: string
          to_status: Database["public"]["Enums"]["booking_status"]
        }[]
      }
      get_course_outline: {
        Args: { p_course_id: string }
        Returns: {
          description: string
          duration_minutes: number
          id: string
          is_free: boolean
          lesson_type: string
          module_id: string
          position: number
          title: string
        }[]
      }
      get_quiz_questions_for_attempt: {
        Args: { p_quiz_id: string }
        Returns: {
          explanation: string
          id: string
          marks: number
          options: Json
          position: number
          question: string
        }[]
      }
      get_ticket_public: {
        Args: { p_ref: string }
        Returns: {
          created_at: string
          customer_name: string
          engineer_name: string
          issue_type: string
          public_ref: string
          status: Database["public"]["Enums"]["ticket_status"]
          updated_at: string
        }[]
      }
      get_ticket_timeline_public: {
        Args: { p_ref: string }
        Returns: {
          author_name: string
          created_at: string
          to_status: Database["public"]["Enums"]["ticket_status"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_assigned_trainer: { Args: { _course_id: string }; Returns: boolean }
      is_enrolled: { Args: { _course_id: string }; Returns: boolean }
      normalize_mobile: { Args: { _raw: string }; Returns: string }
      shares_managed_course: { Args: { _student_id: string }; Returns: boolean }
      submit_quiz_attempt: {
        Args: { p_answers: Json; p_quiz_id: string }
        Returns: {
          attempt_number: number
          passed: boolean
          score_percent: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "engineer" | "student" | "trainer"
      booking_status: "pending" | "in_progress" | "completed" | "cancelled"
      ticket_status: "new" | "assigned" | "in_progress" | "resolved" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "engineer", "student", "trainer"],
      booking_status: ["pending", "in_progress", "completed", "cancelled"],
      ticket_status: ["new", "assigned", "in_progress", "resolved", "closed"],
    },
  },
} as const

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      credentials: {
        Row: {
          created_at: string;
          id: string;
          key_version: number;
          label: string;
          owner_id: string;
          project_id: string;
          secret_ciphertext: string;
          secret_iv: string;
          secret_tag: string;
          url: string | null;
          username: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          key_version?: number;
          label: string;
          owner_id?: string;
          project_id: string;
          secret_ciphertext: string;
          secret_iv: string;
          secret_tag: string;
          url?: string | null;
          username?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          key_version?: number;
          label?: string;
          owner_id?: string;
          project_id?: string;
          secret_ciphertext?: string;
          secret_iv?: string;
          secret_tag?: string;
          url?: string | null;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'credentials_project_id_owner_id_fkey';
            columns: ['project_id', 'owner_id'];
            isOneToOne: false;
            referencedRelation: 'project_summary';
            referencedColumns: ['id', 'owner_id'];
          },
          {
            foreignKeyName: 'credentials_project_id_owner_id_fkey';
            columns: ['project_id', 'owner_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id', 'owner_id'];
          },
        ];
      };
      notes: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          kind: Database['public']['Enums']['note_kind'];
          noted_on: string;
          owner_id: string;
          project_id: string;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          kind: Database['public']['Enums']['note_kind'];
          noted_on?: string;
          owner_id?: string;
          project_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          kind?: Database['public']['Enums']['note_kind'];
          noted_on?: string;
          owner_id?: string;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_project_id_owner_id_fkey';
            columns: ['project_id', 'owner_id'];
            isOneToOne: false;
            referencedRelation: 'project_summary';
            referencedColumns: ['id', 'owner_id'];
          },
          {
            foreignKeyName: 'notes_project_id_owner_id_fkey';
            columns: ['project_id', 'owner_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id', 'owner_id'];
          },
        ];
      };
      payments: {
        Row: {
          amount_pen: number;
          concept: string | null;
          created_at: string;
          id: string;
          owner_id: string;
          paid_on: string;
          project_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount_pen: number;
          concept?: string | null;
          created_at?: string;
          id?: string;
          owner_id?: string;
          paid_on: string;
          project_id: string;
        };
        Update: {
          amount_pen?: number;
          concept?: string | null;
          created_at?: string;
          id?: string;
          owner_id?: string;
          paid_on?: string;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_project_id_owner_id_fkey';
            columns: ['project_id', 'owner_id'];
            isOneToOne: false;
            referencedRelation: 'project_summary';
            referencedColumns: ['id', 'owner_id'];
          },
          {
            foreignKeyName: 'payments_project_id_owner_id_fkey';
            columns: ['project_id', 'owner_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id', 'owner_id'];
          },
        ];
      };
      profiles: {
        Row: {
          accent: string;
          avatar_url: string | null;
          base_path: string | null;
          bg_variant: string;
          created_at: string;
          display_name: string;
          id: string;
          theme: string;
        };
        ComputedFields: never;
        Insert: {
          accent?: string;
          avatar_url?: string | null;
          base_path?: string | null;
          bg_variant?: string;
          created_at?: string;
          display_name: string;
          id: string;
          theme?: string;
        };
        Update: {
          accent?: string;
          avatar_url?: string | null;
          base_path?: string | null;
          bg_variant?: string;
          created_at?: string;
          display_name?: string;
          id?: string;
          theme?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          budget_pen: number | null;
          client: string;
          client_contact: string | null;
          client_country: string | null;
          client_email: string | null;
          client_whatsapp: string | null;
          cms: string | null;
          code: string;
          created_at: string;
          delivery_date: string | null;
          description: string | null;
          domain_expires: string | null;
          domain_name: string | null;
          domain_pending: boolean;
          hosting_expires: string | null;
          id: string;
          is_demo: boolean;
          link_cms: string | null;
          link_deploy: string | null;
          link_design: string | null;
          link_panel: string | null;
          link_repo: string | null;
          local_path: string | null;
          name: string;
          owner_id: string;
          stack_backend: string[];
          stack_db: string[];
          stack_frontend: string[];
          stack_hosting: string[];
          start_date: string | null;
          status: Database['public']['Enums']['project_status'];
          thumbnail_path: string | null;
          type: Database['public']['Enums']['project_type'];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          budget_pen?: number | null;
          client: string;
          client_contact?: string | null;
          client_country?: string | null;
          client_email?: string | null;
          client_whatsapp?: string | null;
          cms?: string | null;
          code: string;
          created_at?: string;
          delivery_date?: string | null;
          description?: string | null;
          domain_expires?: string | null;
          domain_name?: string | null;
          domain_pending?: boolean;
          hosting_expires?: string | null;
          id?: string;
          is_demo?: boolean;
          link_cms?: string | null;
          link_deploy?: string | null;
          link_design?: string | null;
          link_panel?: string | null;
          link_repo?: string | null;
          local_path?: string | null;
          name: string;
          owner_id?: string;
          stack_backend?: string[];
          stack_db?: string[];
          stack_frontend?: string[];
          stack_hosting?: string[];
          start_date?: string | null;
          status?: Database['public']['Enums']['project_status'];
          thumbnail_path?: string | null;
          type: Database['public']['Enums']['project_type'];
          updated_at?: string;
        };
        Update: {
          budget_pen?: number | null;
          client?: string;
          client_contact?: string | null;
          client_country?: string | null;
          client_email?: string | null;
          client_whatsapp?: string | null;
          cms?: string | null;
          code?: string;
          created_at?: string;
          delivery_date?: string | null;
          description?: string | null;
          domain_expires?: string | null;
          domain_name?: string | null;
          domain_pending?: boolean;
          hosting_expires?: string | null;
          id?: string;
          is_demo?: boolean;
          link_cms?: string | null;
          link_deploy?: string | null;
          link_design?: string | null;
          link_panel?: string | null;
          link_repo?: string | null;
          local_path?: string | null;
          name?: string;
          owner_id?: string;
          stack_backend?: string[];
          stack_db?: string[];
          stack_frontend?: string[];
          stack_hosting?: string[];
          start_date?: string | null;
          status?: Database['public']['Enums']['project_status'];
          thumbnail_path?: string | null;
          type?: Database['public']['Enums']['project_type'];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      project_summary: {
        Row: {
          balance_pen: number | null;
          budget_pen: number | null;
          id: string | null;
          owner_id: string | null;
          paid_pen: number | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      project_exists: { Args: { p_id: string }; Returns: boolean };
    };
    Enums: {
      note_kind: 'pedido' | 'cambio' | 'nota';
      project_status: 'en_desarrollo' | 'revision' | 'produccion' | 'mantenimiento' | 'archivado';
      project_type: 'landing' | 'ecommerce' | 'dashboard' | 'institucional' | 'webapp' | 'otro';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      note_kind: ['pedido', 'cambio', 'nota'],
      project_status: ['en_desarrollo', 'revision', 'produccion', 'mantenimiento', 'archivado'],
      project_type: ['landing', 'ecommerce', 'dashboard', 'institucional', 'webapp', 'otro'],
    },
  },
} as const;

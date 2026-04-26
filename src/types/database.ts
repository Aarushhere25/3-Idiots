export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string;
          file_type: string;
          file_url: string;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          file_type: string;
          file_url: string;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          file_type?: string;
          file_url?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      message_reads: {
        Row: {
          created_at: string;
          message_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          message_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          message_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          avatar_url: string | null;
          content: string;
          created_at: string;
          file_url: string | null;
          id: string;
          type: "text" | "image" | "video" | "file";
          user_id: string;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          content?: string;
          created_at?: string;
          file_url?: string | null;
          id?: string;
          type?: "text" | "image" | "video" | "file";
          user_id: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          content?: string;
          created_at?: string;
          file_url?: string | null;
          id?: string;
          type?: "text" | "image" | "video" | "file";
          user_id?: string;
          username?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          updated_at: string;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      typing_status: {
        Row: {
          id: string;
          started_at: string;
          user_id: string;
          username: string;
        };
        Insert: {
          id?: string;
          started_at?: string;
          user_id: string;
          username: string;
        };
        Update: {
          id?: string;
          started_at?: string;
          user_id?: string;
          username?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

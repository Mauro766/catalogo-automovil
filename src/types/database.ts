import type {
  Currency,
  FuelType,
  TransmissionType,
  VehicleStatus,
  VehicleCondition,
  VehicleType,
} from './index';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          full_name: string;
          role: 'admin';
          created_at: string;
        },
        {
          id: string;
          full_name?: string;
          role?: 'admin';
          created_at?: string;
        }
      >;
      vehicle_brands: Table<
        {
          id: string;
          name: string;
          normalized_name: string;
          created_at: string;
        },
        {
          id?: string;
          name: string;
          normalized_name: string;
          created_at?: string;
        }
      >;
      vehicle_models: Table<
        {
          id: string;
          brand_id: string;
          name: string;
          normalized_name: string;
          created_at: string;
        },
        {
          id?: string;
          brand_id: string;
          name: string;
          normalized_name: string;
          created_at?: string;
        }
      >;
      vehicle_versions: Table<
        {
          id: string;
          model_id: string;
          name: string;
          normalized_name: string;
          created_at: string;
        },
        {
          id?: string;
          model_id: string;
          name: string;
          normalized_name: string;
          created_at?: string;
        }
      >;
      dealership_settings: Table<
        {
          id: boolean;
          name: string;
          logo_url: string;
          primary_color: string;
          secondary_color: string;
          whatsapp: string;
          phone: string;
          address: string;
          description: string;
          updated_at: string;
        },
        {
          id?: boolean;
          name?: string;
          logo_url?: string;
          primary_color?: string;
          secondary_color?: string;
          whatsapp?: string;
          phone?: string;
          address?: string;
          description?: string;
          updated_at?: string;
        }
      >;
      vehicles: Table<
        {
          id: string;
          brand: string;
          model: string;
          version: string;
          year: number;
          price: number;
          currency: Currency;
          status: VehicleStatus;
          condition: VehicleCondition;
          featured: boolean;
          type: VehicleType;
          mileage: number | null;
          fuel: FuelType | null;
          transmission: TransmissionType | null;
          engine: string;
          power: number | null;
          drivetrain: string;
          color: string;
          doors: number | null;
          seats: number | null;
          description: string;
          equipment: Json;
          highlights: Json;
          created_at: string;
          published_at: string;
          updated_at: string;
        },
        {
          id?: string;
          brand: string;
          model: string;
          version?: string;
          year: number;
          price: number;
          currency: Currency;
          status?: VehicleStatus;
          condition?: VehicleCondition;
          featured?: boolean;
          type: VehicleType;
          mileage?: number | null;
          fuel?: FuelType | null;
          transmission?: TransmissionType | null;
          engine?: string;
          power?: number | null;
          drivetrain?: string;
          color?: string;
          doors?: number | null;
          seats?: number | null;
          description?: string;
          equipment?: Json;
          highlights?: Json;
          created_at?: string;
          published_at?: string;
          updated_at?: string;
        }
      >;
      vehicle_images: Table<
        {
          id: string;
          vehicle_id: string;
          public_url: string;
          storage_path: string | null;
          alt: string;
          is_primary: boolean;
          sort_order: number;
          created_at: string;
        },
        {
          id?: string;
          vehicle_id: string;
          public_url: string;
          storage_path?: string | null;
          alt?: string;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

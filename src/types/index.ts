export type VehicleStatus = 'Disponible' | 'Reservado' | 'Vendido' | 'Borrador';
export type VehicleCondition = '0km' | 'usado';
export type FuelType = 'Gasolina' | 'Diésel' | 'Híbrido' | 'Eléctrico' | 'Gas';
export type TransmissionType = 'Manual' | 'Automática' | 'Automatizada';
export type VehicleType = 'SUV' | 'Sedán' | 'Hatchback' | 'Pickup' | 'Coupe' | 'Furgón';
export type Currency = 'ARS' | 'USD';

export interface VehicleImage {
  id: string;
  publicUrl: string;
  storagePath: string | null;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Vehicle {
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
  mileage?: number;
  fuel?: FuelType;
  transmission?: TransmissionType;
  engine: string;
  power?: number;
  drivetrain: string;
  color: string;
  doors?: number;
  seats?: number;
  description: string;
  equipment: string[];
  highlights: string[];
  images: VehicleImage[];
  createdAt: string;
  publishedAt: string;
}

export type VehicleCardData = Pick<
  Vehicle,
  | 'id'
  | 'brand'
  | 'model'
  | 'version'
  | 'year'
  | 'price'
  | 'currency'
  | 'status'
  | 'condition'
  | 'type'
  | 'mileage'
  | 'fuel'
  | 'transmission'
  | 'images'
>;

export type CatalogSortOption = 'newest' | 'price-asc' | 'price-desc' | 'year-desc';

export type VehicleFormValues = Omit<Vehicle, 'id' | 'createdAt'>;

export interface Dealership {
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  whatsapp: string;
  phone: string;
  address: string;
  description: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  role: 'admin';
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  profile?: UserProfile;
}

export interface VehicleFilters {
  search: string;
  brand: string;
  status: VehicleStatus | 'Todos';
  condition: VehicleCondition | 'Todas';
  fuel: FuelType | 'Todos';
  currency: Currency | 'Todas';
  minPrice: number | null;
  maxPrice: number | null;
  minYear: number | null;
  maxYear: number | null;
  maxMileage: number | null;
  sortBy: CatalogSortOption;
}

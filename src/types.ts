export type Role = 'admin' | 'pr' | 'host';

export interface ManagedUser {
  id: string;
  email: string;
  password: string;
  role: Role;
  displayName: string;
  lastName: string;
  phone: string;
  profileImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  displayName: string;
  lastName?: string;
  phone?: string;
  profileImage?: string;
}

export interface Table {
  id: string;
  name: string;
  letter?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'rect' | 'circle' | 'bar' | 'consolle';
  area: string;
  capacity: number;
  minSpend: number;
  isFixture?: boolean;
}

export interface StaticArea {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloorPlan {
  id: string;
  name: string;
  canvasWidth?: number;
  canvasHeight?: number;
  staticAreas?: StaticArea[];
  tables: Table[];
  bgImage?: string;
}

export interface Event {
  id: string;
  venueId: string;
  name: string;
  date: string;
  description: string;
  floorPlanId: string;
  status: 'draft' | 'active' | 'completed';
}

export type ReservationStatus = 'confirmed' | 'blocked' | 'free';

export interface Reservation {
  id: string;
  eventId: string;
  tableId: string;
  tableName?: string;
  prId: string;
  prName: string;
  customerName: string;
  customerPhone?: string;
  guestsCount: number;
  bottles: string;
  budget: number;
  notes: string;
  status: ReservationStatus;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  checkedIn?: boolean;
  actualPeople?: number;
  actualBudget?: number;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  floorPlans: FloorPlan[];
}

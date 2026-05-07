export type Role = 'admin' | 'pr';

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  displayName: string;
}

export interface Table {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'rect' | 'circle';
  area: string;
  capacity: number;
  minSpend: number;
}

export interface FloorPlan {
  id: string;
  name: string;
  imageUrl: string;
  tables: Table[];
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

export type ReservationStatus = 'optioned' | 'confirmed' | 'blocked' | 'free';

export interface Reservation {
  id: string;
  eventId: string;
  tableId: string;
  prId: string;
  prName: string;
  customerName: string;
  customerPhone: string;
  guestsCount: number;
  bottles: string;
  budget: number;
  notes: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface Venue {
  id: string;
  name: string;
  ownerId: string;
  address: string;
}

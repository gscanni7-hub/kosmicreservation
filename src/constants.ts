import { Event, FloorPlan, Reservation, Table, UserProfile } from './types';

export const MOCK_PR: UserProfile = {
  id: 'pr_1',
  email: 'pr@nightplan.com',
  role: 'pr',
  displayName: 'Marco PR',
};

export const MOCK_ADMIN: UserProfile = {
  id: 'admin_1',
  email: 'admin@nightplan.com',
  role: 'admin',
  displayName: 'Luca Admin',
};

export const MOCK_FLOOR_PLAN: FloorPlan = {
  id: 'fp_1',
  name: 'Main Room',
  imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=2070&auto=format&fit=crop', // A club-like background
  tables: [
    { id: 't1', name: 'T-01', x: 200, y: 150, width: 60, height: 60, shape: 'rect', area: 'Prive', capacity: 6, minSpend: 500 },
    { id: 't2', name: 'T-02', x: 300, y: 150, width: 60, height: 60, shape: 'rect', area: 'Prive', capacity: 6, minSpend: 500 },
    { id: 't3', name: 'T-03', x: 400, y: 150, width: 60, height: 60, shape: 'rect', area: 'Prive', capacity: 8, minSpend: 800 },
    { id: 't4', name: 'VIP-1', x: 550, y: 100, width: 100, height: 100, shape: 'circle', area: 'Super VIP', capacity: 12, minSpend: 2000 },
  ],
};

export const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    venueId: 'v1',
    name: 'Techno Friday',
    date: '2024-05-10',
    description: 'Special guest DJ from Berlin',
    floorPlanId: 'fp_1',
    status: 'active',
  },
  {
    id: 'e2',
    venueId: 'v1',
    name: 'Saturday Night Fever',
    date: '2024-05-11',
    description: '70s & 80s hits',
    floorPlanId: 'fp_1',
    status: 'active',
  },
];

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'r1',
    eventId: 'e1',
    tableId: 't1',
    prId: 'pr_1',
    prName: 'Marco PR',
    customerName: 'Mario Rossi',
    customerPhone: '3331234567',
    guestsCount: 5,
    bottles: '2 Vodka, 1 Gin',
    budget: 600,
    notes: 'Birthday party',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
];

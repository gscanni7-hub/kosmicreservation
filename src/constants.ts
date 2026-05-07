import { Event, FloorPlan, Reservation, UserProfile, Venue } from './types';

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

const NAIF_FLOOR_PLAN: FloorPlan = {
  id: 'fp_naif_1',
  name: 'NAIF — Main Room',
  canvasWidth: 920,
  canvasHeight: 1210,
  staticAreas: [
    { id: 'sa_bar',     label: 'BAR',     x: 20,  y: 55,  width: 170, height: 350 },
    { id: 'sa_console', label: 'CONSOLE', x: 793, y: 485, width: 115, height: 335 },
  ],
  tables: [
    // ── Top row ───────────────────────────────────────────
    { id: 'n1',  name: '1',  x: 228, y:  72, width:  68, height:  68, shape: 'rect', area: 'Main',        capacity: 6, minSpend: 300 },
    { id: 'n2',  name: '2',  x: 314, y:  72, width:  68, height:  68, shape: 'rect', area: 'Main',        capacity: 6, minSpend: 300 },
    { id: 'n3',  name: '3',  x: 400, y:  72, width:  68, height:  68, shape: 'rect', area: 'Main',        capacity: 6, minSpend: 300 },
    { id: 'n4',  name: '4',  x: 498, y:  72, width:  68, height:  68, shape: 'rect', area: 'Main',        capacity: 6, minSpend: 300 },
    { id: 'n5',  name: '5',  x: 590, y:  52, width:  88, height:  92, shape: 'rect', area: 'VIP',         capacity: 8, minSpend: 500 },
    { id: 'n6',  name: '6',  x: 700, y:  62, width:  78, height:  75, shape: 'rect', area: 'VIP',         capacity: 8, minSpend: 500 },
    // ── Right wall — top section ──────────────────────────
    { id: 'n7',  name: '7',  x: 800, y: 148, width:  82, height:  62, shape: 'rect', area: 'Wall Right',  capacity: 6, minSpend: 400 },
    { id: 'n8',  name: '8',  x: 800, y: 225, width:  82, height:  62, shape: 'rect', area: 'Wall Right',  capacity: 6, minSpend: 400 },
    { id: 'n9',  name: '9',  x: 800, y: 303, width:  82, height:  62, shape: 'rect', area: 'Wall Right',  capacity: 6, minSpend: 400 },
    { id: 'n9a', name: '9A', x: 800, y: 380, width:  82, height:  62, shape: 'rect', area: 'Wall Right',  capacity: 6, minSpend: 400 },
    { id: 'n9b', name: '9B', x: 800, y: 457, width:  82, height:  62, shape: 'rect', area: 'Wall Right',  capacity: 6, minSpend: 400 },
    // ── Center cluster 35–38 ─────────────────────────────
    { id: 'n35', name: '35', x: 343, y: 213, width:  68, height:  68, shape: 'rect', area: 'Center',      capacity: 6, minSpend: 300 },
    { id: 'n36', name: '36', x: 420, y: 213, width:  68, height:  68, shape: 'rect', area: 'Center',      capacity: 6, minSpend: 300 },
    { id: 'n37', name: '37', x: 343, y: 292, width:  68, height:  68, shape: 'rect', area: 'Center',      capacity: 6, minSpend: 300 },
    { id: 'n38', name: '38', x: 420, y: 292, width:  68, height:  68, shape: 'rect', area: 'Center',      capacity: 6, minSpend: 300 },
    // ── Center upper ─────────────────────────────────────
    { id: 'n32', name: '32', x: 600, y: 228, width:  88, height:  90, shape: 'rect', area: 'Center VIP',  capacity: 8, minSpend: 500 },
    { id: 'n42', name: '42', x: 542, y: 340, width:  98, height:  82, shape: 'rect', area: 'Center',      capacity: 8, minSpend: 400 },
    // ── Left wall — middle ───────────────────────────────
    { id: 'n22', name: '22', x:  32, y: 548, width:  73, height:  73, shape: 'rect', area: 'Wall Left',   capacity: 6, minSpend: 300 },
    { id: 'n21', name: '21', x:  32, y: 635, width:  73, height:  73, shape: 'rect', area: 'Wall Left',   capacity: 6, minSpend: 300 },
    { id: 'n20', name: '20', x:  32, y: 742, width:  73, height:  73, shape: 'rect', area: 'Wall Left',   capacity: 6, minSpend: 300 },
    // ── Center row A ─────────────────────────────────────
    { id: 'n23', name: '23', x: 295, y: 655, width:  88, height:  75, shape: 'rect', area: 'Center',      capacity: 6, minSpend: 350 },
    { id: 'n24', name: '24', x: 390, y: 660, width:  73, height:  73, shape: 'rect', area: 'Center',      capacity: 6, minSpend: 300 },
    { id: 'n25', name: '25', x: 468, y: 655, width:  88, height:  75, shape: 'rect', area: 'Center',      capacity: 6, minSpend: 350 },
    // ── Center row B ─────────────────────────────────────
    { id: 'n26', name: '26', x: 478, y: 758, width:  88, height:  72, shape: 'rect', area: 'Center',      capacity: 6, minSpend: 350 },
    { id: 'n27', name: '27', x: 573, y: 758, width:  73, height:  72, shape: 'rect', area: 'Center',      capacity: 6, minSpend: 300 },
    { id: 'n28', name: '28', x: 650, y: 758, width: 100, height:  72, shape: 'rect', area: 'Center',      capacity: 8, minSpend: 400 },
    // ── Center row C ─────────────────────────────────────
    { id: 'n29', name: '29', x: 290, y: 843, width:  78, height:  68, shape: 'rect', area: 'Center',      capacity: 6, minSpend: 300 },
    { id: 'n30', name: '30', x: 375, y: 843, width:  73, height:  68, shape: 'rect', area: 'Center',      capacity: 6, minSpend: 300 },
    { id: 'n31', name: '31', x: 452, y: 843, width:  78, height:  68, shape: 'rect', area: 'Center',      capacity: 6, minSpend: 300 },
    // ── Right wall — lower ───────────────────────────────
    { id: 'n10', name: '10', x: 805, y: 838, width:  78, height:  62, shape: 'rect', area: 'Wall Right',  capacity: 6, minSpend: 400 },
    { id: 'n11', name: '11', x: 805, y: 928, width:  88, height:  62, shape: 'rect', area: 'Wall Right',  capacity: 6, minSpend: 400 },
    { id: 'n12', name: '12', x: 805, y:1018, width:  73, height:  65, shape: 'rect', area: 'Wall Right',  capacity: 6, minSpend: 400 },
    // ── Left wall — lower ────────────────────────────────
    { id: 'n19', name: '19', x:  32, y: 918, width:  88, height:  62, shape: 'rect', area: 'Wall Left',   capacity: 6, minSpend: 300 },
    { id: 'n18', name: '18', x:  32, y:1013, width:  68, height:  68, shape: 'rect', area: 'Wall Left',   capacity: 6, minSpend: 300 },
    // ── Bottom row ───────────────────────────────────────
    { id: 'n17', name: '17', x:  95, y:1105, width:  93, height:  62, shape: 'rect', area: 'Entrance',    capacity: 6, minSpend: 300 },
    { id: 'n16', name: '16', x: 268, y:1105, width:  68, height:  62, shape: 'rect', area: 'Entrance',    capacity: 6, minSpend: 300 },
    { id: 'n15', name: '15', x: 405, y:1105, width:  93, height:  62, shape: 'rect', area: 'Entrance',    capacity: 6, minSpend: 300 },
    { id: 'n14', name: '14', x: 537, y:1105, width:  93, height:  62, shape: 'rect', area: 'Entrance',    capacity: 6, minSpend: 300 },
    { id: 'n13', name: '13', x: 670, y:1105, width:  83, height:  62, shape: 'rect', area: 'Entrance',    capacity: 6, minSpend: 300 },
  ],
};

const DUEL_FLOOR_PLAN: FloorPlan = {
  id: 'fp_duel_1',
  name: 'DUEL CLUB — Main Room',
  canvasWidth: 800,
  canvasHeight: 600,
  staticAreas: [],
  tables: [],
};

export const INITIAL_VENUES: Venue[] = [
  {
    id: 'v_naif',
    name: 'NAIF',
    address: 'Milano',
    floorPlans: [NAIF_FLOOR_PLAN],
  },
  {
    id: 'v_duel',
    name: 'DUEL CLUB',
    address: 'Milano',
    floorPlans: [DUEL_FLOOR_PLAN],
  },
];

export const INITIAL_EVENTS: Event[] = [
  {
    id: 'e1',
    venueId: 'v_naif',
    name: 'Techno Friday',
    date: '2025-05-09',
    description: 'Special guest DJ from Berlin',
    floorPlanId: 'fp_naif_1',
    status: 'active',
  },
  {
    id: 'e2',
    venueId: 'v_naif',
    name: 'Saturday Night Fever',
    date: '2025-05-10',
    description: '70s & 80s hits',
    floorPlanId: 'fp_naif_1',
    status: 'active',
  },
];

export const INITIAL_RESERVATIONS: Reservation[] = [];

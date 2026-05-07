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
  canvasWidth: 940,
  canvasHeight: 1320,
  staticAreas: [
    { id: 'sa_dj',       label: 'DJ',    x: 315, y: 157, width: 187, height:  90 },
    { id: 'sa_bar_main', label: 'Bar',   x: 218, y: 855, width: 505, height:  95 },
    { id: 'sa_regia',    label: 'Regia', x:  25, y: 952, width: 100, height:  62 },
    { id: 'sa_bar_small',label: 'Bar',   x: 383, y:1033, width: 133, height:  55 },
  ],
  tables: [
    // ── P series — top area (P7 rimosso) ──────────────────
    { id: 'dp2',  name: 'P2',    x: 213, y:  73, width:  82, height:  62, shape: 'rect', area: 'VIP Top',  capacity: 6, minSpend: 400 },
    { id: 'dp3',  name: 'P3',    x: 305, y:  73, width:  82, height:  62, shape: 'rect', area: 'VIP Top',  capacity: 6, minSpend: 400 },
    { id: 'dp8',  name: 'P8',    x: 393, y:  73, width:  82, height:  62, shape: 'rect', area: 'VIP Top',  capacity: 6, minSpend: 400 },
    { id: 'dp4',  name: 'P4',    x: 479, y:  73, width:  82, height:  62, shape: 'rect', area: 'VIP Top',  capacity: 6, minSpend: 400 },
    { id: 'dp5',  name: 'P5',    x: 567, y:  73, width:  82, height:  62, shape: 'rect', area: 'VIP Top',  capacity: 6, minSpend: 400 },
    { id: 'dp1',  name: 'P1',    x: 185, y: 157, width:  87, height:  90, shape: 'rect', area: 'VIP Top',  capacity: 8, minSpend: 500 },
    { id: 'dp6',  name: 'P6',    x: 575, y: 157, width:  87, height:  90, shape: 'rect', area: 'VIP Top',  capacity: 8, minSpend: 500 },
    // ── S series — parete sinistra (S1–S9, S10-S12 rimossi) ─
    { id: 'ds9',  name: 'S9',    x:  25, y: 265, width:  73, height:  60, shape: 'rect', area: 'Wall Left', capacity: 6, minSpend: 350 },
    { id: 'ds8',  name: 'S8',    x:  25, y: 335, width:  73, height:  60, shape: 'rect', area: 'Wall Left', capacity: 6, minSpend: 350 },
    { id: 'ds7',  name: 'S7',    x:  25, y: 405, width:  73, height:  60, shape: 'rect', area: 'Wall Left', capacity: 6, minSpend: 350 },
    { id: 'ds6',  name: 'S6',    x:  25, y: 474, width:  73, height:  60, shape: 'rect', area: 'Wall Left', capacity: 6, minSpend: 350 },
    { id: 'ds5',  name: 'S5',    x:  25, y: 543, width:  73, height:  60, shape: 'rect', area: 'Wall Left', capacity: 6, minSpend: 350 },
    { id: 'ds4',  name: 'S4',    x:  25, y: 612, width:  73, height:  60, shape: 'rect', area: 'Wall Left', capacity: 6, minSpend: 350 },
    { id: 'ds3',  name: 'S3',    x:  25, y: 681, width:  73, height:  60, shape: 'rect', area: 'Wall Left', capacity: 6, minSpend: 350 },
    { id: 'ds2',  name: 'S2',    x:  25, y: 750, width:  73, height:  60, shape: 'rect', area: 'Wall Left', capacity: 6, minSpend: 350 },
    { id: 'ds1',  name: 'S1',    x:  25, y: 820, width:  73, height:  60, shape: 'rect', area: 'Wall Left', capacity: 6, minSpend: 350 },
    // ── D series — parete destra (D1–D9, D10-D13 rimossi) ──
    { id: 'dd9',  name: 'D9',    x: 842, y: 265, width:  73, height:  60, shape: 'rect', area: 'Wall Right', capacity: 6, minSpend: 350 },
    { id: 'dd8',  name: 'D8',    x: 842, y: 335, width:  73, height:  60, shape: 'rect', area: 'Wall Right', capacity: 6, minSpend: 350 },
    { id: 'dd7',  name: 'D7',    x: 842, y: 405, width:  73, height:  60, shape: 'rect', area: 'Wall Right', capacity: 6, minSpend: 350 },
    { id: 'dd6',  name: 'D6',    x: 842, y: 474, width:  73, height:  60, shape: 'rect', area: 'Wall Right', capacity: 6, minSpend: 350 },
    { id: 'dd5',  name: 'D5',    x: 842, y: 543, width:  73, height:  60, shape: 'rect', area: 'Wall Right', capacity: 6, minSpend: 350 },
    { id: 'dd4',  name: 'D4',    x: 842, y: 612, width:  73, height:  60, shape: 'rect', area: 'Wall Right', capacity: 6, minSpend: 350 },
    { id: 'dd3',  name: 'D3',    x: 842, y: 681, width:  73, height:  60, shape: 'rect', area: 'Wall Right', capacity: 6, minSpend: 350 },
    { id: 'dd2',  name: 'D2',    x: 842, y: 750, width:  73, height:  60, shape: 'rect', area: 'Wall Right', capacity: 6, minSpend: 350 },
    { id: 'dd1',  name: 'D1',    x: 842, y: 820, width:  73, height:  60, shape: 'rect', area: 'Wall Right', capacity: 6, minSpend: 350 },
    // ── SP series — colonna interna sinistra ─────────────
    { id: 'dsp14',name: 'SP14',  x: 152, y: 323, width:  73, height:  55, shape: 'rect', area: 'Inner Left', capacity: 6, minSpend: 300 },
    { id: 'dsp13',name: 'SP13',  x: 152, y: 390, width:  73, height:  55, shape: 'rect', area: 'Inner Left', capacity: 6, minSpend: 300 },
    { id: 'dsp12',name: 'SP12',  x: 152, y: 458, width:  73, height:  55, shape: 'rect', area: 'Inner Left', capacity: 6, minSpend: 300 },
    { id: 'dsp4', name: 'SP4',   x: 152, y: 527, width:  73, height:  55, shape: 'rect', area: 'Inner Left', capacity: 6, minSpend: 300 },
    { id: 'dsp3', name: 'SP3',   x: 152, y: 596, width:  73, height:  55, shape: 'rect', area: 'Inner Left', capacity: 6, minSpend: 300 },
    { id: 'dsp2', name: 'SP2',   x: 152, y: 664, width:  73, height:  55, shape: 'rect', area: 'Inner Left', capacity: 6, minSpend: 300 },
    { id: 'dsp1', name: 'SP1',   x: 152, y: 733, width:  73, height:  55, shape: 'rect', area: 'Inner Left', capacity: 6, minSpend: 300 },
    // ── SP series — colonna interna destra ───────────────
    { id: 'dsp11',name: 'SP11',  x: 692, y: 323, width:  73, height:  55, shape: 'rect', area: 'Inner Right', capacity: 6, minSpend: 300 },
    { id: 'dsp10',name: 'SP10',  x: 692, y: 390, width:  73, height:  55, shape: 'rect', area: 'Inner Right', capacity: 6, minSpend: 300 },
    { id: 'dsp9', name: 'SP9',   x: 692, y: 458, width:  73, height:  55, shape: 'rect', area: 'Inner Right', capacity: 6, minSpend: 300 },
    { id: 'dsp8', name: 'SP8',   x: 692, y: 527, width:  73, height:  55, shape: 'rect', area: 'Inner Right', capacity: 6, minSpend: 300 },
    { id: 'dsp7', name: 'SP7',   x: 692, y: 596, width:  73, height:  55, shape: 'rect', area: 'Inner Right', capacity: 6, minSpend: 300 },
    { id: 'dsp6', name: 'SP6',   x: 692, y: 664, width:  73, height:  55, shape: 'rect', area: 'Inner Right', capacity: 6, minSpend: 300 },
    { id: 'dsp5', name: 'SP5',   x: 692, y: 733, width:  73, height:  55, shape: 'rect', area: 'Inner Right', capacity: 6, minSpend: 300 },
    // ── T series — fila 1 ────────────────────────────────
    { id: 'dt1',  name: 'T1',    x: 218, y: 958, width:  80, height:  60, shape: 'rect', area: 'Floor',  capacity: 6, minSpend: 250 },
    { id: 'dt2',  name: 'T2',    x: 308, y: 958, width:  80, height:  60, shape: 'rect', area: 'Floor',  capacity: 6, minSpend: 250 },
    { id: 'dt3',  name: 'T3',    x: 395, y: 958, width:  80, height:  60, shape: 'rect', area: 'Floor',  capacity: 6, minSpend: 250 },
    { id: 'dt4',  name: 'T4',    x: 483, y: 958, width:  80, height:  60, shape: 'rect', area: 'Floor',  capacity: 6, minSpend: 250 },
    { id: 'dt5',  name: 'T5',    x: 570, y: 958, width:  80, height:  60, shape: 'rect', area: 'Floor',  capacity: 6, minSpend: 250 },
    { id: 'dt6',  name: 'T6',    x: 812, y: 958, width:  80, height:  60, shape: 'rect', area: 'Floor',  capacity: 6, minSpend: 250 },
    // ── T series — fila 2 ────────────────────────────────
    { id: 'dt11', name: 'T11',   x: 150, y:1030, width:  80, height:  60, shape: 'rect', area: 'Floor',  capacity: 6, minSpend: 250 },
    { id: 'dt10', name: 'T10',   x: 240, y:1030, width:  80, height:  60, shape: 'rect', area: 'Floor',  capacity: 6, minSpend: 250 },
    { id: 'dt9',  name: 'T9',    x: 568, y:1030, width:  80, height:  60, shape: 'rect', area: 'Floor',  capacity: 6, minSpend: 250 },
    { id: 'dt8',  name: 'T8',    x: 655, y:1030, width:  80, height:  60, shape: 'rect', area: 'Floor',  capacity: 6, minSpend: 250 },
    { id: 'dt7',  name: 'T7',    x: 812, y:1030, width:  80, height:  60, shape: 'rect', area: 'Floor',  capacity: 6, minSpend: 250 },
    // ── H series — fila 1 ────────────────────────────────
    { id: 'dh1',  name: 'H1',    x: 193, y:1103, width:  80, height:  60, shape: 'rect', area: 'Garden', capacity: 6, minSpend: 200 },
    { id: 'dh2',  name: 'H2',    x: 283, y:1103, width:  80, height:  60, shape: 'rect', area: 'Garden', capacity: 6, minSpend: 200 },
    { id: 'dh3b', name: 'H3 BIS',x: 376, y:1103, width:  88, height:  60, shape: 'rect', area: 'Garden', capacity: 6, minSpend: 200 },
    { id: 'dh3',  name: 'H3',    x: 472, y:1103, width:  80, height:  60, shape: 'rect', area: 'Garden', capacity: 6, minSpend: 200 },
    { id: 'dh4',  name: 'H4',    x: 560, y:1103, width:  80, height:  60, shape: 'rect', area: 'Garden', capacity: 6, minSpend: 200 },
    { id: 'dh4b', name: 'H4 BIS',x: 650, y:1103, width:  88, height:  60, shape: 'rect', area: 'Garden', capacity: 6, minSpend: 200 },
    { id: 'dh5',  name: 'H5',    x: 810, y:1103, width:  80, height:  60, shape: 'rect', area: 'Garden', capacity: 6, minSpend: 200 },
    // ── H series — colonna destra ────────────────────────
    { id: 'dh6',  name: 'H6',    x: 810, y:1173, width:  80, height:  60, shape: 'rect', area: 'Garden', capacity: 6, minSpend: 200 },
    { id: 'dh7',  name: 'H7',    x: 810, y:1243, width:  80, height:  60, shape: 'rect', area: 'Garden', capacity: 6, minSpend: 200 },
    // ── H series — fila bassa ────────────────────────────
    { id: 'dh11', name: 'H11',   x: 411, y:1173, width:  80, height:  60, shape: 'rect', area: 'Garden', capacity: 6, minSpend: 200 },
    { id: 'dh10', name: 'H10',   x: 500, y:1173, width:  80, height:  60, shape: 'rect', area: 'Garden', capacity: 6, minSpend: 200 },
    { id: 'dh9',  name: 'H9',    x: 587, y:1173, width:  80, height:  60, shape: 'rect', area: 'Garden', capacity: 6, minSpend: 200 },
    { id: 'dh8',  name: 'H8',    x: 673, y:1173, width:  80, height:  60, shape: 'rect', area: 'Garden', capacity: 6, minSpend: 200 },
  ],
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

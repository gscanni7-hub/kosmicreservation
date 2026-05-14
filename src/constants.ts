import { Event, FloorPlan, ManagedUser, Reservation, UserProfile, Venue } from './types';

interface MockCredential {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'pr' | 'host';
  displayName: string;
  lastName?: string;
  phone?: string;
}

export const MOCK_USERS: MockCredential[] = [
  { id: 'admin_1', email: 'g.scanni7@gmail.com',        password: '1234', role: 'admin', displayName: 'Admin' },
  { id: 'pr_1',    email: 'lucavisca@gmail.com',        password: '1234', role: 'pr',    displayName: 'Luca Visca' },
  { id: 'host_1',  email: 'accoglienza@nightplan.it',   password: '1234', role: 'host',  displayName: 'Accoglienza' },
];

export const INITIAL_MANAGED_USERS: ManagedUser[] = [
  { id: 'admin_1', email: 'g.scanni7@gmail.com',      password: '1234', role: 'admin', displayName: 'Admin',        lastName: '',      phone: '', status: 'approved', createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'pr_1',    email: 'lucavisca@gmail.com',      password: '1234', role: 'pr',    displayName: 'Luca',         lastName: 'Visca', phone: '', status: 'approved', createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'host_1',  email: 'accoglienza@nightplan.it', password: '1234', role: 'host',  displayName: 'Accoglienza',  lastName: '',      phone: '', status: 'approved', createdAt: '2025-01-01T00:00:00.000Z' },
];

export const MOCK_PR: UserProfile = {
  id: 'pr_1',
  email: 'lucavisca@gmail.com',
  role: 'pr',
  displayName: 'Luca Visca',
};

export const MOCK_ADMIN: UserProfile = {
  id: 'admin_1',
  email: 'g.scanni7@gmail.com',
  role: 'admin',
  displayName: 'Admin',
};

const NAIF_FLOOR_PLAN: FloorPlan = {
  id: 'fp_naif_1',
  name: 'NAIF — Main Room',
  canvasWidth: 920,
  canvasHeight: 1210,
  staticAreas: [
    { id: 'sa_bar',     label: 'BAR',     x: 20,  y: 55,  width: 170, height: 350 },
    { id: 'sa_console', label: 'CONSOLE', x: 793, y: 566, width: 115, height: 262 },
  ],
  tables: [
    // ── Top row (1–6) ─────────────────────────────────────
    { id: 'n1',  name:  '1', x: 228, y:  72, width: 72, height: 72, shape: 'rect', area: 'Main',       capacity: 10, minSpend: 300 },
    { id: 'n2',  name:  '2', x: 316, y:  72, width: 72, height: 72, shape: 'rect', area: 'Main',       capacity: 10, minSpend: 300 },
    { id: 'n3',  name:  '3', x: 404, y:  72, width: 72, height: 72, shape: 'rect', area: 'Main',       capacity: 10, minSpend: 300 },
    { id: 'n4',  name:  '4', x: 500, y:  72, width: 72, height: 72, shape: 'rect', area: 'Main',       capacity: 10, minSpend: 300 },
    { id: 'n5',  name:  '5', x: 592, y:  72, width: 72, height: 72, shape: 'rect', area: 'Main',       capacity: 10, minSpend: 300 },
    { id: 'n6',  name:  '6', x: 704, y:  72, width: 72, height: 72, shape: 'rect', area: 'Main',       capacity: 10, minSpend: 300 },
    // ── Right wall — top (7–11) ───────────────────────────
    { id: 'n7',  name:  '7', x: 806, y: 148, width: 72, height: 72, shape: 'rect', area: 'Wall Right', capacity: 10, minSpend: 300 },
    { id: 'n8',  name:  '8', x: 806, y: 232, width: 72, height: 72, shape: 'rect', area: 'Wall Right', capacity: 10, minSpend: 300 },
    { id: 'n9',  name:  '9', x: 806, y: 316, width: 72, height: 72, shape: 'rect', area: 'Wall Right', capacity: 10, minSpend: 300 },
    { id: 'n9a', name: '10', x: 806, y: 400, width: 72, height: 72, shape: 'rect', area: 'Wall Right', capacity: 10, minSpend: 300 },
    { id: 'n9b', name: '11', x: 806, y: 484, width: 72, height: 72, shape: 'rect', area: 'Wall Right', capacity: 10, minSpend: 300 },
    // ── Center cluster (12–15) ────────────────────────────
    { id: 'n35', name: '12', x: 343, y: 213, width: 72, height: 72, shape: 'rect', area: 'Center',     capacity: 10, minSpend: 300 },
    { id: 'n36', name: '13', x: 423, y: 213, width: 72, height: 72, shape: 'rect', area: 'Center',     capacity: 10, minSpend: 300 },
    { id: 'n37', name: '14', x: 343, y: 293, width: 72, height: 72, shape: 'rect', area: 'Center',     capacity: 10, minSpend: 300 },
    { id: 'n38', name: '15', x: 423, y: 293, width: 72, height: 72, shape: 'rect', area: 'Center',     capacity: 10, minSpend: 300 },
    // ── Center upper (16–17) ─────────────────────────────
    { id: 'n32', name: '16', x: 602, y: 228, width: 72, height: 72, shape: 'rect', area: 'Center',     capacity: 10, minSpend: 300 },
    { id: 'n42', name: '17', x: 547, y: 340, width: 72, height: 72, shape: 'rect', area: 'Center',     capacity: 10, minSpend: 300 },
    // ── Left wall — middle (18–20) ────────────────────────
    { id: 'n22', name: '18', x:  32, y: 548, width: 72, height: 72, shape: 'rect', area: 'Wall Left',  capacity: 10, minSpend: 300 },
    { id: 'n21', name: '19', x:  32, y: 632, width: 72, height: 72, shape: 'rect', area: 'Wall Left',  capacity: 10, minSpend: 300 },
    { id: 'n20', name: '20', x:  32, y: 716, width: 72, height: 72, shape: 'rect', area: 'Wall Left',  capacity: 10, minSpend: 300 },
    // ── Center row A (21–23) ─────────────────────────────
    { id: 'n23', name: '21', x: 297, y: 658, width: 72, height: 72, shape: 'rect', area: 'Center',     capacity: 10, minSpend: 300 },
    { id: 'n24', name: '22', x: 390, y: 658, width: 72, height: 72, shape: 'rect', area: 'Center',     capacity: 10, minSpend: 300 },
    { id: 'n25', name: '23', x: 472, y: 658, width: 72, height: 72, shape: 'rect', area: 'Center',     capacity: 10, minSpend: 300 },
    // ── Center row B (24–26) ─────────────────────────────
    { id: 'n26', name: '24', x: 480, y: 758, width: 72, height: 72, shape: 'rect', area: 'Center',     capacity: 10, minSpend: 300 },
    { id: 'n27', name: '25', x: 572, y: 758, width: 72, height: 72, shape: 'rect', area: 'Center',     capacity: 10, minSpend: 300 },
    { id: 'n28', name: '26', x: 655, y: 758, width: 72, height: 72, shape: 'rect', area: 'Center',     capacity: 10, minSpend: 300 },
    // ── Center row C (27–29) ─────────────────────────────
    { id: 'n29', name: '27', x: 291, y: 845, width: 72, height: 72, shape: 'rect', area: 'Center',     capacity: 10, minSpend: 300 },
    { id: 'n30', name: '28', x: 375, y: 845, width: 72, height: 72, shape: 'rect', area: 'Center',     capacity: 10, minSpend: 300 },
    { id: 'n31', name: '29', x: 455, y: 845, width: 72, height: 72, shape: 'rect', area: 'Center',     capacity: 10, minSpend: 300 },
    // ── Right wall — lower (30–32) ────────────────────────
    { id: 'n10', name: '30', x: 806, y: 838, width: 72, height: 72, shape: 'rect', area: 'Wall Right', capacity: 10, minSpend: 300 },
    { id: 'n11', name: '31', x: 806, y: 922, width: 72, height: 72, shape: 'rect', area: 'Wall Right', capacity: 10, minSpend: 300 },
    { id: 'n12', name: '32', x: 806, y:1006, width: 72, height: 72, shape: 'rect', area: 'Wall Right', capacity: 10, minSpend: 300 },
    // ── Left wall — lower (33–34) ─────────────────────────
    { id: 'n19', name: '33', x:  32, y: 920, width: 72, height: 72, shape: 'rect', area: 'Wall Left',  capacity: 10, minSpend: 300 },
    { id: 'n18', name: '34', x:  32, y:1014, width: 72, height: 72, shape: 'rect', area: 'Wall Left',  capacity: 10, minSpend: 300 },
    // ── Bottom row (35–39) ────────────────────────────────
    { id: 'n17', name: '35', x: 100, y:1108, width: 72, height: 72, shape: 'rect', area: 'Entrance',   capacity: 10, minSpend: 300 },
    { id: 'n16', name: '36', x: 270, y:1108, width: 72, height: 72, shape: 'rect', area: 'Entrance',   capacity: 10, minSpend: 300 },
    { id: 'n15', name: '37', x: 412, y:1108, width: 72, height: 72, shape: 'rect', area: 'Entrance',   capacity: 10, minSpend: 300 },
    { id: 'n14', name: '38', x: 543, y:1108, width: 72, height: 72, shape: 'rect', area: 'Entrance',   capacity: 10, minSpend: 300 },
    { id: 'n13', name: '39', x: 674, y:1108, width: 72, height: 72, shape: 'rect', area: 'Entrance',   capacity: 10, minSpend: 300 },
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
    { id: 'dsp14',name: 'SP14',  x: 152, y: 323, width:  73, height:  55, shape: 'rect', area: 'Inner Left', capacity: 10, minSpend: 300 },
    { id: 'dsp13',name: 'SP13',  x: 152, y: 390, width:  73, height:  55, shape: 'rect', area: 'Inner Left', capacity: 10, minSpend: 300 },
    { id: 'dsp12',name: 'SP12',  x: 152, y: 458, width:  73, height:  55, shape: 'rect', area: 'Inner Left', capacity: 10, minSpend: 300 },
    { id: 'dsp4', name: 'SP4',   x: 152, y: 527, width:  73, height:  55, shape: 'rect', area: 'Inner Left', capacity: 10, minSpend: 300 },
    { id: 'dsp3', name: 'SP3',   x: 152, y: 596, width:  73, height:  55, shape: 'rect', area: 'Inner Left', capacity: 10, minSpend: 300 },
    { id: 'dsp2', name: 'SP2',   x: 152, y: 664, width:  73, height:  55, shape: 'rect', area: 'Inner Left', capacity: 10, minSpend: 300 },
    { id: 'dsp1', name: 'SP1',   x: 152, y: 733, width:  73, height:  55, shape: 'rect', area: 'Inner Left', capacity: 10, minSpend: 300 },
    // ── SP series — colonna interna destra ───────────────
    { id: 'dsp11',name: 'SP11',  x: 692, y: 323, width:  73, height:  55, shape: 'rect', area: 'Inner Right', capacity: 10, minSpend: 300 },
    { id: 'dsp10',name: 'SP10',  x: 692, y: 390, width:  73, height:  55, shape: 'rect', area: 'Inner Right', capacity: 10, minSpend: 300 },
    { id: 'dsp9', name: 'SP9',   x: 692, y: 458, width:  73, height:  55, shape: 'rect', area: 'Inner Right', capacity: 10, minSpend: 300 },
    { id: 'dsp8', name: 'SP8',   x: 692, y: 527, width:  73, height:  55, shape: 'rect', area: 'Inner Right', capacity: 10, minSpend: 300 },
    { id: 'dsp7', name: 'SP7',   x: 692, y: 596, width:  73, height:  55, shape: 'rect', area: 'Inner Right', capacity: 10, minSpend: 300 },
    { id: 'dsp6', name: 'SP6',   x: 692, y: 664, width:  73, height:  55, shape: 'rect', area: 'Inner Right', capacity: 10, minSpend: 300 },
    { id: 'dsp5', name: 'SP5',   x: 692, y: 733, width:  73, height:  55, shape: 'rect', area: 'Inner Right', capacity: 10, minSpend: 300 },
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
    registrationToken: 'techno-friday-e1',
  },
  {
    id: 'e2',
    venueId: 'v_naif',
    name: 'Saturday Night Fever',
    date: '2025-05-10',
    description: '70s & 80s hits',
    floorPlanId: 'fp_naif_1',
    status: 'active',
    registrationToken: 'saturday-fever-e2',
  },
];

export const INITIAL_RESERVATIONS: Reservation[] = [];

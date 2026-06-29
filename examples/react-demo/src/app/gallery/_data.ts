// Gallery datasets — deterministic (seeded) so server and client render identically.
// Each demo pulls the slice it needs; nothing here is random at runtime.

/* ── seeded PRNG (mulberry32) ─────────────────────────────────────────────── */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pick = <T>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)]!
const between = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1))

/* ── Sales (grouping + pivot) ─────────────────────────────────────────────── */
export interface Sale {
  id: string
  region: string
  category: string
  rep: string
  quarter: string
  units: number
  revenue: number
  margin: number
}
const REGIONS = ['North America', 'EMEA', 'APAC', 'LATAM']
const CATEGORIES = ['Hardware', 'Software', 'Services']
const REPS = ['Avery', 'Blake', 'Casey', 'Devin', 'Emery', 'Finley', 'Gray', 'Harper']
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

export const sales: Sale[] = (() => {
  const r = rng(7)
  const rows: Sale[] = []
  let n = 0
  for (const region of REGIONS) {
    for (const category of CATEGORIES) {
      for (const quarter of QUARTERS) {
        const lines = between(r, 1, 3)
        for (let i = 0; i < lines; i++) {
          const units = between(r, 20, 600)
          const price = category === 'Services' ? between(r, 200, 900) : between(r, 80, 1200)
          rows.push({
            id: `s${n++}`,
            region,
            category,
            rep: pick(r, REPS),
            quarter,
            units,
            revenue: units * price,
            margin: Math.round((0.18 + r() * 0.42) * 100) / 100,
          })
        }
      }
    }
  }
  return rows
})()

/* ── Employees (virtualized + simple directory) ───────────────────────────── */
export interface Employee {
  id: number
  name: string
  email: string
  department: string
  role: string
  level: string
  location: string
  salary: number
  startDate: string
  active: boolean
  performance: number
}
const FIRST = [
  'Avery',
  'Jordan',
  'Riley',
  'Morgan',
  'Quinn',
  'Sage',
  'Taylor',
  'Cameron',
  'Reese',
  'Rowan',
  'Skylar',
  'Emerson',
  'Hayden',
  'Parker',
  'Drew',
  'Elliot',
  'Finley',
  'Marlowe',
  'Noa',
  'Wren',
]
const LAST = [
  'Chen',
  'Patel',
  'Garcia',
  'Kim',
  'Okafor',
  'Silva',
  'Nguyen',
  'Haas',
  'Romano',
  'Ivanov',
  'Larsen',
  'Mwangi',
  'Dubois',
  'Khan',
  'Yamamoto',
  'Costa',
  'Novak',
  'Rossi',
  'Adebayo',
  'Singh',
]
const DEPTS = ['Engineering', 'Design', 'Product', 'Sales', 'Marketing', 'Support', 'Finance']
const LEVELS = ['Intern', 'Junior', 'Mid', 'Senior', 'Staff', 'Principal']
const CITIES = [
  'San Francisco',
  'London',
  'Berlin',
  'Tokyo',
  'Toronto',
  'Austin',
  'Singapore',
  'Lagos',
  'São Paulo',
  'Sydney',
]

export function makeEmployees(count: number): Employee[] {
  const r = rng(42)
  return Array.from({ length: count }, (_, i) => {
    const first = pick(r, FIRST)
    const last = pick(r, LAST)
    const level = pick(r, LEVELS)
    const dept = pick(r, DEPTS)
    const base = { Intern: 60, Junior: 90, Mid: 130, Senior: 175, Staff: 220, Principal: 280 }[
      level
    ]!
    const year = between(r, 2017, 2024)
    return {
      id: i + 1,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@yable.dev`,
      department: dept,
      role: `${level} ${dept === 'Engineering' ? 'Engineer' : dept === 'Design' ? 'Designer' : dept}`,
      level,
      location: pick(r, CITIES),
      salary: (base + between(r, -10, 30)) * 1000,
      startDate: `${year}-${String(between(r, 1, 12)).padStart(2, '0')}-${String(between(r, 1, 28)).padStart(2, '0')}`,
      active: r() > 0.12,
      performance: Math.round((0.5 + r() * 0.5) * 100),
    }
  })
}

/* ── Tickers (trading terminal) ───────────────────────────────────────────── */
export interface Ticker {
  symbol: string
  name: string
  sector: string
  price: number
  prevClose: number
}
export const tickers: Ticker[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', price: 228.5, prevClose: 226.1 },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology', price: 441.2, prevClose: 444.0 },
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Semiconductors', price: 124.3, prevClose: 119.8 },
  { symbol: 'AMZN', name: 'Amazon', sector: 'Consumer', price: 201.9, prevClose: 203.4 },
  { symbol: 'GOOGL', name: 'Alphabet', sector: 'Technology', price: 178.6, prevClose: 176.2 },
  { symbol: 'TSLA', name: 'Tesla', sector: 'Automotive', price: 248.1, prevClose: 255.7 },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Technology', price: 503.4, prevClose: 498.0 },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', price: 212.8, prevClose: 211.3 },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials', price: 289.0, prevClose: 290.6 },
  { symbol: 'WMT', name: 'Walmart', sector: 'Consumer', price: 68.2, prevClose: 67.4 },
  { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', price: 113.5, prevClose: 115.0 },
  { symbol: 'UNH', name: 'UnitedHealth', sector: 'Healthcare', price: 492.7, prevClose: 488.2 },
]

/* ── Projects (master/detail dashboard) ───────────────────────────────────── */
export interface Task {
  name: string
  owner: string
  done: boolean
}
export interface Project {
  id: string
  name: string
  status: 'On track' | 'At risk' | 'Delayed' | 'Done'
  progress: number
  owner: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  due: string
  budget: number
  spent: number
  tasks: Task[]
}
export const projects: Project[] = [
  {
    id: 'P-101',
    name: 'Checkout redesign',
    status: 'On track',
    progress: 72,
    owner: 'Riley Kim',
    priority: 'High',
    due: '2026-08-12',
    budget: 80000,
    spent: 51000,
    tasks: [
      { name: 'Cart audit', owner: 'Riley Kim', done: true },
      { name: 'Payment sheet', owner: 'Sage Okafor', done: true },
      { name: 'A/B test', owner: 'Drew Haas', done: false },
    ],
  },
  {
    id: 'P-102',
    name: 'Mobile app v3',
    status: 'At risk',
    progress: 41,
    owner: 'Jordan Patel',
    priority: 'Critical',
    due: '2026-07-30',
    budget: 220000,
    spent: 138000,
    tasks: [
      { name: 'Offline sync', owner: 'Jordan Patel', done: false },
      { name: 'Push infra', owner: 'Wren Singh', done: true },
      { name: 'Store review', owner: 'Noa Rossi', done: false },
    ],
  },
  {
    id: 'P-103',
    name: 'Data warehouse',
    status: 'On track',
    progress: 88,
    owner: 'Morgan Silva',
    priority: 'Medium',
    due: '2026-09-01',
    budget: 150000,
    spent: 121000,
    tasks: [
      { name: 'Schema', owner: 'Morgan Silva', done: true },
      { name: 'ETL jobs', owner: 'Parker Khan', done: true },
    ],
  },
  {
    id: 'P-104',
    name: 'Billing migration',
    status: 'Delayed',
    progress: 23,
    owner: 'Quinn Garcia',
    priority: 'Critical',
    due: '2026-07-15',
    budget: 95000,
    spent: 47000,
    tasks: [
      { name: 'Stripe port', owner: 'Quinn Garcia', done: false },
      { name: 'Invoice parity', owner: 'Elliot Costa', done: false },
    ],
  },
  {
    id: 'P-105',
    name: 'Design system 2.0',
    status: 'Done',
    progress: 100,
    owner: 'Cameron Yamamoto',
    priority: 'Low',
    due: '2026-06-01',
    budget: 60000,
    spent: 58000,
    tasks: [
      { name: 'Tokens', owner: 'Cameron Yamamoto', done: true },
      { name: 'Docs', owner: 'Hayden Novak', done: true },
    ],
  },
  {
    id: 'P-106',
    name: 'Search relevance',
    status: 'On track',
    progress: 64,
    owner: 'Emerson Dubois',
    priority: 'High',
    due: '2026-08-20',
    budget: 110000,
    spent: 70000,
    tasks: [
      { name: 'Embeddings', owner: 'Emerson Dubois', done: true },
      { name: 'Rerank', owner: 'Marlowe Adebayo', done: false },
    ],
  },
]

/* ── Org tree (tree data) ─────────────────────────────────────────────────── */
export interface OrgNode {
  id: string
  name: string
  title: string
  headcount: number
  budget: number
  subRows?: OrgNode[]
}
export const orgTree: OrgNode[] = [
  {
    id: 'ceo',
    name: 'Dana Cruz',
    title: 'CEO',
    headcount: 240,
    budget: 48000000,
    subRows: [
      {
        id: 'cto',
        name: 'Sam Rivera',
        title: 'CTO',
        headcount: 120,
        budget: 22000000,
        subRows: [
          {
            id: 'eng-platform',
            name: 'Lee Okonkwo',
            title: 'VP Platform',
            headcount: 52,
            budget: 9000000,
            subRows: [
              {
                id: 'eng-core',
                name: 'Ira Donovan',
                title: 'Dir, Core',
                headcount: 24,
                budget: 4200000,
              },
              {
                id: 'eng-infra',
                name: 'Tess Bauer',
                title: 'Dir, Infra',
                headcount: 28,
                budget: 4800000,
              },
            ],
          },
          {
            id: 'eng-product',
            name: 'Mara Vance',
            title: 'VP Product Eng',
            headcount: 68,
            budget: 13000000,
            subRows: [
              {
                id: 'eng-web',
                name: 'Cole Frost',
                title: 'Dir, Web',
                headcount: 34,
                budget: 6500000,
              },
              {
                id: 'eng-mobile',
                name: 'Anya Sokol',
                title: 'Dir, Mobile',
                headcount: 34,
                budget: 6500000,
              },
            ],
          },
        ],
      },
      {
        id: 'cdo',
        name: 'Remy Adler',
        title: 'Chief Design Officer',
        headcount: 34,
        budget: 7000000,
        subRows: [
          {
            id: 'design-brand',
            name: 'Pia Lindqvist',
            title: 'Head of Brand',
            headcount: 14,
            budget: 3000000,
          },
          {
            id: 'design-product',
            name: 'Otto Reyes',
            title: 'Head of Product Design',
            headcount: 20,
            budget: 4000000,
          },
        ],
      },
      {
        id: 'cro',
        name: 'Val Mensah',
        title: 'CRO',
        headcount: 86,
        budget: 19000000,
        subRows: [
          {
            id: 'sales-na',
            name: 'Bree Tanaka',
            title: 'VP Sales, NA',
            headcount: 44,
            budget: 10000000,
          },
          {
            id: 'sales-intl',
            name: 'Hugo Marchetti',
            title: 'VP Sales, Intl',
            headcount: 42,
            budget: 9000000,
          },
        ],
      },
    ],
  },
]

/* ── Pricing plans (comparison table) ─────────────────────────────────────── */
export type PlanCell = boolean | string
export interface PlanRow {
  feature: string
  group: string
  starter: PlanCell
  pro: PlanCell
  enterprise: PlanCell
}
export const planRows: PlanRow[] = [
  { group: 'Core', feature: 'Rows included', starter: '10k', pro: '1M', enterprise: 'Unlimited' },
  { group: 'Core', feature: 'Sorting & filtering', starter: true, pro: true, enterprise: true },
  { group: 'Core', feature: 'Inline editing', starter: true, pro: true, enterprise: true },
  { group: 'Core', feature: 'CSV / JSON export', starter: true, pro: true, enterprise: true },
  {
    group: 'Pro',
    feature: 'Row grouping & aggregation',
    starter: false,
    pro: true,
    enterprise: true,
  },
  { group: 'Pro', feature: 'Pivot row model', starter: false, pro: true, enterprise: true },
  { group: 'Pro', feature: 'Formula engine', starter: false, pro: true, enterprise: true },
  { group: 'Pro', feature: 'Fill handle & clipboard', starter: false, pro: true, enterprise: true },
  {
    group: 'Enterprise',
    feature: 'Async commit pipeline',
    starter: false,
    pro: false,
    enterprise: true,
  },
  { group: 'Enterprise', feature: 'SSO & audit log', starter: false, pro: false, enterprise: true },
  {
    group: 'Enterprise',
    feature: 'Priority support SLA',
    starter: false,
    pro: '48h',
    enterprise: '1h',
  },
]

/* ── Leaderboard (playful read-only) ──────────────────────────────────────── */
export interface Player {
  handle: string
  country: string
  score: number
  winRate: number
  level: number
  streak: number
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'
}
export const players: Player[] = (() => {
  const r = rng(99)
  const handles = [
    'nyxwave',
    'zephyr',
    'pixelorc',
    'quantum',
    'voidstar',
    'mooncat',
    'glitchr',
    'emberfox',
    'sonata',
    'driftkid',
    'aurora',
    'kraken',
    'novaflux',
    'cipher',
    'lumen',
  ]
  const flags = ['🇺🇸', '🇯🇵', '🇰🇷', '🇩🇪', '🇧🇷', '🇬🇧', '🇨🇦', '🇫🇷', '🇸🇪', '🇳🇬']
  const tiers = ['Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'] as const
  return handles
    .map((handle, i) => ({
      handle,
      country: flags[i % flags.length]!,
      score: between(r, 1200, 9800),
      winRate: Math.round((0.4 + r() * 0.55) * 100),
      level: between(r, 18, 99),
      streak: between(r, 0, 24),
      tier: tiers[Math.min(4, Math.floor(i / 3))]!,
    }))
    .sort((a, b) => b.score - a.score)
})()

/* ── Budget rows (spreadsheet / formulas) ─────────────────────────────────── */
export interface BudgetRow {
  id: string
  category: string
  q1: number
  q2: number
  q3: number
  q4: number
}
export const budgetRows: BudgetRow[] = [
  { id: 'r0', category: 'Salaries', q1: 420000, q2: 435000, q3: 448000, q4: 460000 },
  { id: 'r1', category: 'Cloud & infra', q1: 68000, q2: 72000, q3: 81000, q4: 90000 },
  { id: 'r2', category: 'Marketing', q1: 120000, q2: 150000, q3: 110000, q4: 175000 },
  { id: 'r3', category: 'Travel', q1: 24000, q2: 31000, q3: 28000, q4: 36000 },
  { id: 'r4', category: 'Software', q1: 41000, q2: 43000, q3: 45000, q4: 47000 },
  { id: 'r5', category: 'Office', q1: 33000, q2: 33000, q3: 34000, q4: 35000 },
]

/* ── CRM leads (inline edit + async commits) ──────────────────────────────── */
export interface Lead {
  id: string
  company: string
  contact: string
  stage: 'New' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost'
  value: number
  owner: string
  probability: number
  nextStep: string
}
export const leads: Lead[] = [
  {
    id: 'L1',
    company: 'Northwind Traders',
    contact: 'P. Mensah',
    stage: 'Proposal',
    value: 48000,
    owner: 'Avery',
    probability: 60,
    nextStep: 'Send MSA',
  },
  {
    id: 'L2',
    company: 'Acme Robotics',
    contact: 'J. Tanaka',
    stage: 'Negotiation',
    value: 125000,
    owner: 'Blake',
    probability: 80,
    nextStep: 'Legal review',
  },
  {
    id: 'L3',
    company: 'Globex',
    contact: 'R. Silva',
    stage: 'Qualified',
    value: 32000,
    owner: 'Casey',
    probability: 40,
    nextStep: 'Demo call',
  },
  {
    id: 'L4',
    company: 'Initech',
    contact: 'M. Novak',
    stage: 'New',
    value: 18000,
    owner: 'Devin',
    probability: 20,
    nextStep: 'Discovery',
  },
  {
    id: 'L5',
    company: 'Umbrella Co',
    contact: 'A. Kahn',
    stage: 'Won',
    value: 96000,
    owner: 'Emery',
    probability: 100,
    nextStep: 'Kickoff',
  },
  {
    id: 'L6',
    company: 'Soylent',
    contact: 'T. Rossi',
    stage: 'Proposal',
    value: 67000,
    owner: 'Finley',
    probability: 55,
    nextStep: 'Pricing',
  },
  {
    id: 'L7',
    company: 'Hooli',
    contact: 'S. Costa',
    stage: 'Negotiation',
    value: 210000,
    owner: 'Gray',
    probability: 70,
    nextStep: 'Exec sponsor',
  },
  {
    id: 'L8',
    company: 'Vehement Capital',
    contact: 'D. Larsen',
    stage: 'Lost',
    value: 54000,
    owner: 'Harper',
    probability: 0,
    nextStep: 'Nurture',
  },
]
export const STAGES = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'] as const
export const OWNERS = REPS

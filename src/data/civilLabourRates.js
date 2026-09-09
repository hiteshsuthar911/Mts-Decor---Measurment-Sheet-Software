// MTS Decor Official Civil Work Only Labour Rates Master
// Transcribed from official rate sheet dated 23/03/2026 (68 Items)
// Each item includes:
// - sr: Serial number (1 to 68)
// - particulars: Item description on the rate sheet
// - unit: Unit of measurement (RFT, SQFT, NOS, SQFT/RFT, etc.)
// - rate: Standard numeric rate (₹)
// - rateText: Original display string
// - group: Visual trade grouping
// - workCategory: Mapped work category from CATEGORIZED_WORK_TYPES (customizable by Admin)

export const DEFAULT_CIVIL_LABOUR_RATES = [
  // ── Page 1: Items 1 to 35 ──
  {
    id: 'clr-1',
    sr: 1,
    particulars: 'INDIAN MARBLE CILL FITTING',
    unit: 'RFT',
    rate: 55,
    rateText: '55/- per rft',
    group: 'Sills & Marble',
    workCategory: 'Spotted Marble Sill'
  },
  {
    id: 'clr-2',
    sr: 2,
    particulars: 'INDIAN MARBLE FITTING',
    unit: 'SQFT',
    rate: 75,
    rateText: '75/- per sqft',
    group: 'Sills & Marble',
    workCategory: 'Stone Sill'
  },
  {
    id: 'clr-3',
    sr: 3,
    particulars: 'GRANITE/CAMPOSIT/ STONE/ITALIAN MARBLE CILL/SKURTING FITTING WITH ONE SIDE CHAMFERD EDGE',
    unit: 'RFT',
    rate: 115,
    rateText: '115/-per rft',
    group: 'Sills & Marble',
    workCategory: 'Single Shempered Edge Stone Sill'
  },
  {
    id: 'clr-4',
    sr: 4,
    particulars: 'GRANITE/CAMPOSIT/STONE/ITALIAN MARBLE CILL FITTING WITH DOUBLE SIDE CHAMFERD EDGE',
    unit: 'RFT',
    rate: 160,
    rateText: '160/-per rft',
    group: 'Sills & Marble',
    workCategory: 'Double Shempered Edge Stone Sill'
  },
  {
    id: 'clr-5',
    sr: 5,
    particulars: 'ITALIAN MARBLE PATTA , SKURTING & CILL FITTING',
    unit: 'RFT',
    rate: 100,
    rateText: '100/-per rft',
    group: 'Sills & Marble',
    workCategory: 'Patta Tiles'
  },
  {
    id: 'clr-6',
    sr: 6,
    particulars: 'KITCHEN PLATFORM WITH SINK / SIDE VARTICLE/ CHAMFERD EDGE',
    unit: 'RFT',
    rate: 1350,
    rateText: '1350/- per rft',
    group: 'Kitchen & Platforms',
    workCategory: 'Platform'
  },
  {
    id: 'clr-7',
    sr: 7,
    particulars: 'WALL ITALIAN MARBLE & ITALIAN SKURTING/ STONE /GRANITE FITTING',
    unit: 'SQFT',
    rate: 110,
    rateText: '110/-per sqft',
    group: 'Wall Tiles & Slabs',
    workCategory: 'Dado Italian Marble'
  },
  {
    id: 'clr-8',
    sr: 8,
    particulars: 'WALL STONE /GRANITE PATTA FITTING',
    unit: 'RFT',
    rate: 82,
    rateText: '82/-per rft',
    group: 'Wall Tiles & Slabs',
    workCategory: 'Wall Tiles'
  },
  {
    id: 'clr-9',
    sr: 9,
    particulars: 'SINK FITTING (SINGLE BOWL)',
    unit: 'NOS',
    rate: 850,
    rateText: '850/- per nos',
    group: 'Kitchen & Platforms',
    workCategory: 'Platform'
  },
  {
    id: 'clr-10',
    sr: 10,
    particulars: 'SINK FITTING(SINGLE BOWL WITH DRAIN BOARD)',
    unit: 'NOS',
    rate: 1500,
    rateText: '1500/-per nos',
    group: 'Kitchen & Platforms',
    workCategory: 'Platform'
  },
  {
    id: 'clr-11',
    sr: 11,
    particulars: 'WASH BASIN GALA CUTTING IN INDIAN MARBLE',
    unit: 'NOS',
    rate: 600,
    rateText: '600/-per nos',
    group: 'Cutting & Openings',
    workCategory: 'Wash Basin Gala Cut'
  },
  {
    id: 'clr-12',
    sr: 12,
    particulars: 'WALL TILES FITTING 600mm x 600mm',
    unit: 'SQFT',
    rate: 55,
    rateText: '55/-per sqft',
    group: 'Wall Tiles & Slabs',
    workCategory: 'Wall Tiles'
  },
  {
    id: 'clr-13',
    sr: 13,
    particulars: 'WALL TILES FITTING 1200mm x 600mm',
    unit: 'SQFT',
    rate: 60,
    rateText: '60/-per sqft',
    group: 'Wall Tiles & Slabs',
    workCategory: '600 X 1200 Wall Tiles'
  },
  {
    id: 'clr-14',
    sr: 14,
    particulars: 'WALL TILES FITTING 1600mm x 800mm',
    unit: 'SQFT',
    rate: 60,
    rateText: '60/-per sqft',
    group: 'Wall Tiles & Slabs',
    workCategory: '800 X 1600 Wall Tiles'
  },
  {
    id: 'clr-15',
    sr: 15,
    particulars: 'WALL TILES FITTING 1800mm x 1200mm',
    unit: 'SQFT',
    rate: 80,
    rateText: '80/-per sqft',
    group: 'Wall Tiles & Slabs',
    workCategory: '1200 X 1800 Wall Tiles'
  },
  {
    id: 'clr-16',
    sr: 16,
    particulars: 'WALL TILES FITTING 2400mm x 1200mm',
    unit: 'SQFT',
    rate: 90,
    rateText: '90/-per sqft',
    group: 'Wall Tiles & Slabs',
    workCategory: '1200 X 9400 Wall Tiles'
  },
  {
    id: 'clr-17',
    sr: 17,
    particulars: 'WALL TILES FITTING',
    unit: 'RFT',
    rate: 55,
    rateText: '55/- per rft',
    group: 'Wall Tiles & Slabs',
    workCategory: 'Wall Tiles'
  },
  {
    id: 'clr-18',
    sr: 18,
    particulars: 'DESIGN TILES FITTING',
    unit: 'SQFT',
    rate: 100,
    rateText: '100/- per sqft',
    group: 'Wall Tiles & Slabs',
    workCategory: 'Design Wall Tiles'
  },
  {
    id: 'clr-19',
    sr: 19,
    particulars: 'DESIGN TILES FITTING',
    unit: 'RFT',
    rate: 85,
    rateText: '85/- per rft',
    group: 'Wall Tiles & Slabs',
    workCategory: 'Design Wall Tiles'
  },
  {
    id: 'clr-20',
    sr: 20,
    particulars: 'FLOORING TILES FITTING WITH KOBA 600mm x 600mm',
    unit: 'SQFT',
    rate: 86,
    rateText: '86/- per sqft',
    group: 'Flooring & Koba',
    workCategory: 'Floor Tile with Koba 600x1200'
  },
  {
    id: 'clr-21',
    sr: 21,
    particulars: 'FLOORING TILES FITTING WITH KOBA 1200mm x 600mm',
    unit: 'SQFT',
    rate: 86,
    rateText: '86/- per sqft',
    group: 'Flooring & Koba',
    workCategory: 'Floor Tile with Koba 600x1200'
  },
  {
    id: 'clr-22',
    sr: 22,
    particulars: 'FLOORING TILES FITTING WITH KOBA 1600mm x 800mm',
    unit: 'SQFT',
    rate: 90,
    rateText: '90/- per sqft',
    group: 'Flooring & Koba',
    workCategory: 'Floor Tile with Koba 800x1600'
  },
  {
    id: 'clr-23',
    sr: 23,
    particulars: 'FLOORING TILES FITTING WITH KOBA 1800mm x 1200mm',
    unit: 'SQFT',
    rate: 97,
    rateText: '97/- per sqft',
    group: 'Flooring & Koba',
    workCategory: 'Floor Tile with Koba 1200x1800'
  },
  {
    id: 'clr-24',
    sr: 24,
    particulars: 'FLOORING TILES FITTING WITH KOBA 2400mm x 800mm',
    unit: 'SQFT',
    rate: 100,
    rateText: '100/- per sqft',
    group: 'Flooring & Koba',
    workCategory: 'Floor Tile with Koba 1200x9400'
  },
  {
    id: 'clr-25',
    sr: 25,
    particulars: 'FLOORING TILES FITTING',
    unit: 'RFT',
    rate: 55,
    rateText: '55/-per rft',
    group: 'Flooring & Koba',
    workCategory: 'Floor Tiles'
  },
  {
    id: 'clr-26',
    sr: 26,
    particulars: 'FLOORING ITALIAN MARBLE FITTING WITH KOBA',
    unit: 'SQFT/RFT',
    rate: 140,
    rateText: '140 per sqft/rft',
    group: 'Flooring & Koba',
    workCategory: 'Floor Italian Marble'
  },
  {
    id: 'clr-27',
    sr: 27,
    particulars: 'FLOORING ITALIAN MARBLE FITTING',
    unit: 'SQFT',
    rate: 110,
    rateText: '110/-per sqft',
    group: 'Flooring & Koba',
    workCategory: 'Floor Italian Marble'
  },
  {
    id: 'clr-28',
    sr: 28,
    particulars: 'FLOORING ITALIAN MARBLE FITTING',
    unit: 'RFT',
    rate: 95,
    rateText: '95/- per rft',
    group: 'Flooring & Koba',
    workCategory: 'Floor Italian Marble'
  },
  {
    id: 'clr-29',
    sr: 29,
    particulars: 'DOOR FRAME FITTING WITH HOLD PASS CEMENT FILLING',
    unit: 'NOS',
    rate: 1200,
    rateText: '1200/-per nos',
    group: 'Civil, Plaster & Masonry',
    workCategory: 'Block Work'
  },
  {
    id: 'clr-30',
    sr: 30,
    particulars: 'CHEMBER FRAME FITTING',
    unit: 'SQFT',
    rate: 150,
    rateText: '150/- per sqft',
    group: 'Civil, Plaster & Masonry',
    workCategory: 'Block Work'
  },
  {
    id: 'clr-31',
    sr: 31,
    particulars: 'COMPAUND 15MM (600MM X 600MM ) LADI FITTING WITH KOBA & 4MM SPESER',
    unit: 'SQFT/RFT',
    rate: 70,
    rateText: '70/-per sqft/rft',
    group: 'Flooring & Koba',
    workCategory: 'Koba'
  },
  {
    id: 'clr-32',
    sr: 32,
    particulars: 'ITALIAN MARBLE , GRANITE , 2400X 1200 TILES BOX,1200 X 1800 , 2400X800 TILES BOX , 15MM 2400/3000X 800 STONE LIFTING BY STERCAS PER SQFT PER FLOOR RATE',
    unit: 'PER FLOOR PER SQFT',
    rate: 2.5,
    rateText: '2.5/- per sqft per floor',
    group: 'Material Shifting & Labour',
    workCategory: 'Other'
  },
  {
    id: 'clr-33',
    sr: 33,
    particulars: 'WALL NICH CUTTING IN BATHROOM',
    unit: 'SQFT',
    rate: 800,
    rateText: '800/-per sqft',
    group: 'Cutting & Openings',
    workCategory: 'Niche Create'
  },
  {
    id: 'clr-34',
    sr: 34,
    particulars: 'KOTA STONE FLOORING FITTING',
    unit: 'SQFT',
    rate: 60,
    rateText: '60/- per sqft',
    group: 'Flooring & Koba',
    workCategory: 'Floor Tiles'
  },
  {
    id: 'clr-35',
    sr: 35,
    particulars: 'GROUND FAVOUR BLOCK & CHQUER LADI FITTING',
    unit: 'SQFT',
    rate: 35,
    rateText: '35/- per sqft',
    group: 'Flooring & Koba',
    workCategory: 'Floor Tiles'
  },

  // ── Page 2: Items 36 to 68 ──
  {
    id: 'clr-36',
    sr: 36,
    particulars: 'INLAY WORK',
    unit: 'AS PER DESING',
    rate: 0,
    rateText: 'as per desing',
    group: 'Flooring & Koba',
    workCategory: 'Design Floor Tiles'
  },
  {
    id: 'clr-37',
    sr: 37,
    particulars: 'TILES SKURTING FITTING',
    unit: 'RFT',
    rate: 45,
    rateText: '45/-per rft',
    group: 'Sills & Skirting',
    workCategory: 'Skirting'
  },
  {
    id: 'clr-38',
    sr: 38,
    particulars: 'GRANITE SKURTING FITTING',
    unit: 'RFT',
    rate: 110,
    rateText: '110/-per rft',
    group: 'Sills & Skirting',
    workCategory: 'Shempered Edge Skirting'
  },
  {
    id: 'clr-39',
    sr: 39,
    particulars: 'KOTA STONE TAPPA FITTING',
    unit: 'RFT',
    rate: 75,
    rateText: '75/- per rft',
    group: 'Staircase (Treads & Risers)',
    workCategory: 'Tread'
  },
  {
    id: 'clr-40',
    sr: 40,
    particulars: 'KOTA STONE RIZER FITTING',
    unit: 'RFT',
    rate: 70,
    rateText: '70/- per rft',
    group: 'Staircase (Treads & Risers)',
    workCategory: 'Riser'
  },
  {
    id: 'clr-41',
    sr: 41,
    particulars: 'TILES TAPPA FITTING',
    unit: 'RFT',
    rate: 75,
    rateText: '75/- per rft',
    group: 'Staircase (Treads & Risers)',
    workCategory: 'Tread'
  },
  {
    id: 'clr-42',
    sr: 42,
    particulars: 'TILES RIZER FITTING',
    unit: 'RFT',
    rate: 70,
    rateText: '70/- per rft',
    group: 'Staircase (Treads & Risers)',
    workCategory: 'Riser'
  },
  {
    id: 'clr-43',
    sr: 43,
    particulars: 'ITALIAN MARBLE/GRANITE TAPPA FITTING',
    unit: 'RFT',
    rate: 140,
    rateText: '140/-per rft',
    group: 'Staircase (Treads & Risers)',
    workCategory: 'Tread'
  },
  {
    id: 'clr-44',
    sr: 44,
    particulars: 'ITALIAN MARBLE /GRANITE RIZER FITTING',
    unit: 'RFT',
    rate: 100,
    rateText: '100/- per rft',
    group: 'Staircase (Treads & Risers)',
    workCategory: 'Riser'
  },
  {
    id: 'clr-45',
    sr: 45,
    particulars: 'DEMOLITION WORK TILES / WALL/ CILL',
    unit: 'SQFT/RFT',
    rate: 40,
    rateText: '40/-per sqft/rft',
    group: 'Civil, Plaster & Masonry',
    workCategory: 'Tiles Remove'
  },
  {
    id: 'clr-46',
    sr: 46,
    particulars: 'NANI TRAP JALI GAL CUTTING',
    unit: 'NOS',
    rate: 160,
    rateText: '160/-per nos',
    group: 'Cutting & Openings',
    workCategory: 'Nahani Trap'
  },
  {
    id: 'clr-47',
    sr: 47,
    particulars: 'LIGHT BOARD GALA CUTTING',
    unit: 'NOS',
    rate: 45,
    rateText: '45/- per nos',
    group: 'Cutting & Openings',
    workCategory: 'Electric Board Cutting'
  },
  {
    id: 'clr-48',
    sr: 48,
    particulars: 'WASH BASIN COUNTER FITTING STONE / ITALIAN MARBLE',
    unit: 'RFT',
    rate: 1050,
    rateText: '1050/-per rft',
    group: 'Kitchen & Platforms',
    workCategory: 'Basin Counter'
  },
  {
    id: 'clr-49',
    sr: 49,
    particulars: 'PLASTER',
    unit: 'SQFT/RFT',
    rate: 65,
    rateText: '65/- per sqft/rft',
    group: 'Civil, Plaster & Masonry',
    workCategory: 'Plaster'
  },
  {
    id: 'clr-50',
    sr: 50,
    particulars: 'FLOORING KOBA',
    unit: 'SQFT/RFT',
    rate: 30,
    rateText: '30/- per sqft/rft',
    group: 'Flooring & Koba',
    workCategory: 'Koba'
  },
  {
    id: 'clr-51',
    sr: 51,
    particulars: '4MM EPOXI GRAUT FILLING & ACHID WASH',
    unit: 'SQFT/RFT',
    rate: 15,
    rateText: '15/- per sqft/rft',
    group: 'Finishing & Joint Treatments',
    workCategory: 'Epoxy Filling'
  },
  {
    id: 'clr-52',
    sr: 52,
    particulars: 'ONLY ACHID WASH & SADA GRAUT FILLING',
    unit: 'SQFT/RFT',
    rate: 10,
    rateText: '10/-per sqft/rft',
    group: 'Finishing & Joint Treatments',
    workCategory: 'Acid Wash'
  },
  {
    id: 'clr-53',
    sr: 53,
    particulars: 'RE-SAIZ CUTTING CHRGE TILES/ STONE /ITALIAN MARBLE',
    unit: 'SQFT/RFT',
    rate: 8,
    rateText: '8/- per sqft/rft',
    group: 'Cutting & Openings',
    workCategory: 'Core Cut'
  },
  {
    id: 'clr-54',
    sr: 54,
    particulars: 'BRICK WORK',
    unit: 'SQFT/RFT',
    rate: 70,
    rateText: '70/- per sqft/rft',
    group: 'Civil, Plaster & Masonry',
    workCategory: 'Block Work'
  },
  {
    id: 'clr-55',
    sr: 55,
    particulars: 'UNSKILLED LABOUR PER DAY',
    unit: 'PER DAY',
    rate: 900,
    rateText: '900/-per day',
    group: 'Labour Wages',
    workCategory: 'Other'
  },
  {
    id: 'clr-56',
    sr: 56,
    particulars: 'SKILLED LABOUR PER DAY',
    unit: 'PER DAY',
    rate: 1800,
    rateText: '1800/-per day',
    group: 'Labour Wages',
    workCategory: 'Other'
  },
  {
    id: 'clr-57',
    sr: 57,
    particulars: 'TERRES , BAR CUNTER',
    unit: 'RFT',
    rate: 2250,
    rateText: '2250/- per rft',
    group: 'Kitchen & Platforms',
    workCategory: 'Platform'
  },
  {
    id: 'clr-58',
    sr: 58,
    particulars: 'STONE MARBLE SITTING',
    unit: 'RFT',
    rate: 1000,
    rateText: '1000/- per rft',
    group: 'Kitchen & Platforms',
    workCategory: 'Platform'
  },
  {
    id: 'clr-59',
    sr: 59,
    particulars: 'STONE MARBLE SITTING RAUND SHEF',
    unit: 'RFT',
    rate: 1200,
    rateText: '1200/- per rft',
    group: 'Kitchen & Platforms',
    workCategory: 'Platform'
  },
  {
    id: 'clr-60',
    sr: 60,
    particulars: 'CONCRIT FILLING FLOORING/BUND WALL/ LENTIL',
    unit: 'SQFT/RFT',
    rate: 50,
    rateText: '50/-per sqft/rft',
    group: 'Civil, Plaster & Masonry',
    workCategory: 'Brick Bat'
  },
  // Subgroup: MOULDING WORK
  {
    id: 'clr-61',
    sr: 61,
    particulars: '3/8 " HALF ROUND MOULDING IN MARBLE/STONE / GRANITE',
    unit: 'RFT',
    rate: 50,
    rateText: '50/- per rft',
    group: 'Moulding & Edges',
    workCategory: 'Shempered Edge'
  },
  {
    id: 'clr-62',
    sr: 62,
    particulars: 'KANI EDGE',
    unit: 'RFT',
    rate: 50,
    rateText: '50/- per rft',
    group: 'Moulding & Edges',
    workCategory: 'Kani Edge Stone'
  },
  {
    id: 'clr-63',
    sr: 63,
    particulars: 'KATRA CUTTING TILES / STONE/ITALIAN MARBLE',
    unit: 'RFT',
    rate: 50,
    rateText: '50/- per rft',
    group: 'Moulding & Edges',
    workCategory: 'Sharp Edge Tiles'
  },
  {
    id: 'clr-64',
    sr: 64,
    particulars: 'CHAMFERD EDGE STONE / ITALIAN MARBLE / GRANITE',
    unit: 'RFT',
    rate: 50,
    rateText: '50/- per rft',
    group: 'Moulding & Edges',
    workCategory: 'Shempered Edge'
  },
  {
    id: 'clr-65',
    sr: 65,
    particulars: '4MM/6MM U GROUVR IN MARBLE /STONE',
    unit: 'RFT',
    rate: 50,
    rateText: '50/- per rft',
    group: 'Moulding & Edges',
    workCategory: 'Shempered Edge'
  },
  {
    id: 'clr-66',
    sr: 66,
    particulars: 'LIGHT BOARD GALA CUTTING',
    unit: 'NOS',
    rate: 50,
    rateText: '50/- per nos',
    group: 'Cutting & Openings',
    workCategory: 'Electric Board Cutting'
  },
  {
    id: 'clr-67',
    sr: 67,
    particulars: 'PLUMBING POINT HOLE',
    unit: 'NOS',
    rate: 50,
    rateText: '50/- per nos',
    group: 'Cutting & Openings',
    workCategory: 'Plumbing Point Hole'
  },
  {
    id: 'clr-68',
    sr: 68,
    particulars: 'CORE CUTTING 12MM TO 45MM IN MARBLE /STONE/ GRANITE',
    unit: 'NOS',
    rate: 370,
    rateText: '370/- per nos',
    group: 'Cutting & Openings',
    workCategory: 'Core Cut'
  }
];

const STORAGE_KEY = 'mts_civil_labour_rate_list_v1';

export function getCivilLabourRates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading civil labour rates from localStorage:', err);
  }
  return DEFAULT_CIVIL_LABOUR_RATES;
}

export function saveCivilLabourRates(rates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
    return true;
  } catch (err) {
    console.error('Error saving civil labour rates to localStorage:', err);
    return false;
  }
}

export function resetCivilLabourRates() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CIVIL_LABOUR_RATES));
    return DEFAULT_CIVIL_LABOUR_RATES;
  } catch (err) {
    console.error('Error resetting civil labour rates:', err);
    return DEFAULT_CIVIL_LABOUR_RATES;
  }
}

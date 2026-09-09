// Rate Master Library for Contractor & RA Billing
// Manages standard rates for labor & materials per work category

export const DEFAULT_RATES = {
  'Floor Tiles': { rate: 45, unit: 'SFT', description: 'Vitrified / ceramic tile flooring with cement mortar' },
  'Wall Tiles': { rate: 55, unit: 'SFT', description: 'Wall tiles / Dado fixing with tile adhesive' },
  'Dado Tiles': { rate: 50, unit: 'SFT', description: 'Toilet / kitchen dado up to lintel level' },
  'Skirting': { rate: 22, unit: 'RFT', description: 'Tile or marble skirting 3" to 4" high' },
  'Kitchen Platform': { rate: 250, unit: 'RFT', description: 'Granite platform with fascia & molding' },
  'Granite Framing / Jambs': { rate: 180, unit: 'RFT', description: 'Door & window frame cladding in granite' },
  'POP / Gypsum Plaster': { rate: 35, unit: 'SFT', description: 'Gypsum wall finish / punning over brickwork' },
  'Painting & Primer': { rate: 18, unit: 'SFT', description: '2 coats emulsion paint with primer & putty' },
  'False Ceiling (Gypsum)': { rate: 95, unit: 'SFT', description: 'Gypsum board false ceiling with GI framing' },
  'Grid Ceiling (Acoustic)': { rate: 85, unit: 'SFT', description: '2x2 modular grid ceiling tiles' },
  'Waterproofing': { rate: 42, unit: 'SFT', description: 'Brickbat coba / chemical waterproof coating' },
  'Brick Masonry 9"': { rate: 85, unit: 'CFT', description: 'Red brick masonry in 1:6 cement sand mortar' },
  'Brick Masonry 4.5"': { rate: 55, unit: 'SFT', description: 'Half brick partition wall with wire ties' },
  'AAC Block Masonry': { rate: 65, unit: 'CFT', description: 'AAC lightweight block with thin bed adhesive' },
  'Cement Plaster (Internal)': { rate: 24, unit: 'SFT', description: '12mm cement plaster 1:4 with neeru finish' },
  'Cement Plaster (External)': { rate: 32, unit: 'SFT', description: '20mm double coat sand-faced plaster' },
  'Electrical Concealed Point': { rate: 450, unit: 'NOS', description: 'Concealed wiring, box & switch point' },
  'Plumbing Toilet Point': { rate: 1200, unit: 'NOS', description: 'Hot & cold CPVC/UPVC inlet point' },
  'Door Frame Installation': { rate: 650, unit: 'NOS', description: 'Granite / wooden door frame fixing' },
  'Flush Door Shutter': { rate: 110, unit: 'SFT', description: 'Laminated flush door shutter with fittings' }
};

const STORAGE_KEY = 'mts_contractor_rate_master';

export function getRateMaster() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_RATES, ...parsed };
    }
  } catch (err) {
    console.error('Error loading rate master:', err);
  }
  return { ...DEFAULT_RATES };
}

export function saveRateMaster(rates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
  } catch (err) {
    console.error('Error saving rate master:', err);
  }
}

export function getRateForCategory(categoryName, customRates = null) {
  if (!categoryName) return null;
  const rates = customRates || getRateMaster();
  if (rates[categoryName]) {
    return rates[categoryName].rate;
  }
  
  // Fuzzy match fallback
  const catLower = categoryName.toLowerCase();
  for (const [name, entry] of Object.entries(rates)) {
    if (name.toLowerCase() === catLower || catLower.includes(name.toLowerCase()) || name.toLowerCase().includes(catLower)) {
      return entry.rate;
    }
  }
  return null;
}

export function applyRatesToProject(project, rateMaster, overwriteExisting = false) {
  if (!project || !project.areas) return project;
  
  const rates = rateMaster || getRateMaster();
  const updatedAreas = project.areas.map(area => {
    const category = area.parentCategory || 'Floor Tiles';
    const standardRate = getRateForCategory(category, rates);
    
    if (standardRate === null) return area;

    const updatedItems = (area.items || []).map(item => {
      // If overwriteExisting is true OR item has no rate
      if (overwriteExisting || item.rate === undefined || item.rate === null || item.rate === '' || item.rate === 0) {
        return { ...item, rate: standardRate };
      }
      return item;
    });

    return { ...area, items: updatedItems };
  });

  return { ...project, areas: updatedAreas };
}

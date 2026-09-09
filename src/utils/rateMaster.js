// Rate Master Library for Contractor & RA Billing
// Manages standard rates for labor & materials per work category

export const DEFAULT_RATES = {
  // Tiling & Flooring
  'Floor Tiles': { rate: 45, unit: 'SFT', trade: 'Tiling', description: 'Vitrified / ceramic tile flooring with cement mortar' },
  'Wall Tiles': { rate: 55, unit: 'SFT', trade: 'Tiling', description: 'Wall tiles / Dado fixing with tile adhesive' },
  'Dado Tiles': { rate: 50, unit: 'SFT', trade: 'Tiling', description: 'Toilet / kitchen dado up to lintel level' },
  'Skirting': { rate: 22, unit: 'RFT', trade: 'Tiling', description: 'Tile or marble skirting 3" to 4" high' },
  'Kitchen Platform': { rate: 250, unit: 'RFT', trade: 'Stone & Granite', description: 'Granite platform with fascia & molding' },
  'Granite Framing / Jambs': { rate: 180, unit: 'RFT', trade: 'Stone & Granite', description: 'Door & window frame cladding in granite' },
  'Italian Marble Flooring': { rate: 120, unit: 'SFT', trade: 'Stone & Granite', description: 'Italian marble laying, mirror polish & crystallizing' },

  // Ceilings & POP
  'False Ceiling (Gypsum)': { rate: 95, unit: 'SFT', trade: 'Ceilings & POP', description: 'Gypsum board false ceiling with GI framing' },
  'POP / Gypsum Plaster': { rate: 35, unit: 'SFT', trade: 'Ceilings & POP', description: 'Gypsum wall finish / punning over brickwork' },
  'Grid Ceiling (Acoustic)': { rate: 85, unit: 'SFT', trade: 'Ceilings & POP', description: '2x2 modular grid ceiling tiles with T-runner' },
  'POP Molding / Phatti': { rate: 45, unit: 'RFT', trade: 'Ceilings & POP', description: 'Perimeter POP molding / architectural band' },
  'Cove Light Provision': { rate: 55, unit: 'RFT', trade: 'Ceilings & POP', description: 'Concealed LED strip light cove trough' },

  // Painting & Finishes
  'Painting & Primer': { rate: 18, unit: 'SFT', trade: 'Painting', description: '2 coats premium emulsion with primer & putty' },
  'Royal Luxury Emulsion': { rate: 28, unit: 'SFT', trade: 'Painting', description: '3 coats luxury silk finish with 2 coats acrylic putty' },
  'Texture Wall Paint': { rate: 65, unit: 'SFT', trade: 'Painting', description: 'Designer rustic / metallic texture application' },
  'Enamel Painting (Doors/Grills)': { rate: 25, unit: 'SFT', trade: 'Painting', description: 'Synthetic enamel paint on wood or metal' },

  // Civil & Masonry
  'Brick Masonry 9"': { rate: 85, unit: 'CFT', trade: 'Civil & Masonry', description: 'Red brick masonry in 1:6 cement sand mortar' },
  'Brick Masonry 4.5"': { rate: 55, unit: 'SFT', trade: 'Civil & Masonry', description: 'Half brick partition wall with wire ties' },
  'AAC Block Masonry': { rate: 65, unit: 'CFT', trade: 'Civil & Masonry', description: 'AAC lightweight block with thin bed adhesive' },
  'Cement Plaster (Internal)': { rate: 24, unit: 'SFT', trade: 'Civil & Masonry', description: '12mm cement plaster 1:4 with neeru finish' },
  'Cement Plaster (External)': { rate: 32, unit: 'SFT', trade: 'Civil & Masonry', description: '20mm double coat sand-faced plaster' },
  'Waterproofing': { rate: 42, unit: 'SFT', trade: 'Civil & Masonry', description: 'Brickbat coba / chemical waterproof coating' },
  'Demolition / Breaking': { rate: 22, unit: 'SFT', trade: 'Civil & Masonry', description: 'Dismantling partition / tiles and debris disposal' },

  // Electrical & Plumbing
  'Electrical Concealed Point': { rate: 450, unit: 'NOS', trade: 'Electrical', description: 'Concealed wiring, box & switch point' },
  'Power Point 15A/16A': { rate: 650, unit: 'NOS', trade: 'Electrical', description: 'Heavy appliance point for AC / Geyser' },
  'Plumbing Toilet Point': { rate: 1200, unit: 'NOS', trade: 'Plumbing', description: 'Hot & cold CPVC/UPVC inlet point' },
  'Drainage Line Point': { rate: 850, unit: 'NOS', trade: 'Plumbing', description: 'SWR waste & soil pipe line fitting' },

  // Carpentry & Furniture
  'Door Frame Installation': { rate: 650, unit: 'NOS', trade: 'Carpentry', description: 'Granite / wooden door frame fixing' },
  'Flush Door Shutter': { rate: 110, unit: 'SFT', trade: 'Carpentry', description: 'Laminated flush door shutter with fittings' },
  'Modular Kitchen Base Unit': { rate: 1450, unit: 'RFT', trade: 'Carpentry', description: 'Marine ply carcass with soft close drawers' },
  'Wardrobe / Cabinet Work': { rate: 1250, unit: 'SFT', trade: 'Carpentry', description: 'Commercial ply with laminate shutter' }
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
  const catLower = categoryName.toLowerCase().trim();
  for (const [name, entry] of Object.entries(rates)) {
    const nameLower = name.toLowerCase().trim();
    if (nameLower === catLower || catLower.includes(nameLower) || nameLower.includes(catLower)) {
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
      if (overwriteExisting || item.rate === undefined || item.rate === null || item.rate === '' || item.rate === 0) {
        return { ...item, rate: standardRate };
      }
      return item;
    });

    return { ...area, items: updatedItems };
  });

  return { ...project, areas: updatedAreas };
}

/**
 * Updates all line items belonging to a specific category across all areas in the project
 * Used when contractor edits rate directly in the Summary / Abstract Table
 */
export function updateCategoryRateInProject(project, targetCategory, newRate, targetUnit = null) {
  if (!project || !project.areas) return project;
  const numRate = parseFloat(newRate) || 0;

  const cleanTarget = String(targetCategory || '').trim().toLowerCase();

  const updatedAreas = project.areas.map(area => {
    const areaCat = (area.parentCategory === 'Other' && area.customParentCategory)
      ? String(area.customParentCategory).trim().toLowerCase()
      : String(area.parentCategory || '').trim().toLowerCase();

    // Check if this area matches the category
    const isMatch = areaCat === cleanTarget || cleanTarget.includes(areaCat) || areaCat.includes(cleanTarget);
    if (!isMatch) return area;

    const updatedItems = (area.items || []).map(item => {
      // If targetUnit is specified, match unit as well
      if (targetUnit && item.unit && item.unit !== targetUnit) {
        return item;
      }
      return {
        ...item,
        rate: numRate
      };
    });

    return { ...area, items: updatedItems };
  });

  return { ...project, areas: updatedAreas };
}

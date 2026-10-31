// Rate Master Library for Contractor & RA Billing
// Manages standard rates for labor & materials per work category
// Updated with MTS Decor Master Rate Schedule (71 Work Categories)

export const DEFAULT_RATES = {
  // ── Wall Tiles & Slabs ──
  'Design Wall Tiles': { rate: 100, unit: 'SFT', trade: 'Wall Tiles & Slabs', description: 'Design decorative wall tiles fixing' },
  'Subway Wall Tiles': { rate: 100, unit: 'SFT', trade: 'Wall Tiles & Slabs', description: 'Subway wall tiles with spacer joints' },
  '600 X 1200 Wall Tiles': { rate: 60, unit: 'SFT', trade: 'Wall Tiles & Slabs', description: '600x1200 mm large format wall tiles' },
  '800 X 1600 Wall Tiles': { rate: 60, unit: 'SFT', trade: 'Wall Tiles & Slabs', description: '800x1600 mm slab wall tiles' },
  '1200 X 1800 Wall Tiles': { rate: 130, unit: 'SFT', trade: 'Wall Tiles & Slabs', description: '1200x1800 mm jumbo slab wall fixing' },
  '1200 X 9400 Wall Tiles': { rate: 150, unit: 'SFT', trade: 'Wall Tiles & Slabs', description: 'Extra large format wall slab tiles' },
  'Plain Sada Tiles': { rate: 40, unit: 'SFT', trade: 'Wall Tiles & Slabs', description: 'Standard plain ceramic/vitrified wall tiles' },
  'Wall Tiles': { rate: 55, unit: 'RFT', trade: 'Wall Tiles & Slabs', description: 'Wall tiles border / patti fixing' },
  'Dado Italian Marble': { rate: 160, unit: 'SFT', trade: 'Wall Tiles & Slabs', description: 'Italian marble dado fixing with chemical adhesive' },

  // ── Flooring, Koba & Italian Marble ──
  'Floor Tiles': { rate: 45, unit: 'SFT', trade: 'Flooring, Koba & Italian Marble', description: 'Standard vitrified / ceramic floor tile laying' },
  'Floor Tile with Koba 600x1200': { rate: 86, unit: 'SFT', trade: 'Flooring, Koba & Italian Marble', description: '600x1200 floor tile with koba bedding' },
  'Floor Tile with Koba 800x1600': { rate: 97, unit: 'SFT', trade: 'Flooring, Koba & Italian Marble', description: '800x1600 floor tile with koba bedding' },
  'Floor Tile with Koba 1200x1800': { rate: 97, unit: 'SFT', trade: 'Flooring, Koba & Italian Marble', description: '1200x1800 floor tile with koba bedding' },
  'Floor Tile with Koba 1200x9400': { rate: 120, unit: 'SFT', trade: 'Flooring, Koba & Italian Marble', description: 'Large slab floor tile with koba bedding' },
  'Design Floor Tiles': { rate: 120, unit: 'SFT', trade: 'Flooring, Koba & Italian Marble', description: 'Designer patterned floor tiles' },
  'Design Floor Tiles with Koba': { rate: 150, unit: 'SFT', trade: 'Flooring, Koba & Italian Marble', description: 'Designer floor tiles with base koba concrete' },
  'Floor Italian Marble': { rate: 110, unit: 'SFT', trade: 'Flooring, Koba & Italian Marble', description: 'Italian marble flooring laying & polishing' },
  'Flooring Italian Marble with Koba': { rate: 140, unit: 'SFT', trade: 'Flooring, Koba & Italian Marble', description: 'Italian marble flooring with koba base' },
  'Kota Stone Filling': { rate: 80, unit: 'SFT', trade: 'Flooring, Koba & Italian Marble', description: 'Kota stone under-bedding / rough flooring' },
  'Koba': { rate: 30, unit: 'SFT', trade: 'Flooring, Koba & Italian Marble', description: 'Cement concrete koba leveling base' },
  'Patta Tiles': { rate: 70, unit: 'SFT', trade: 'Flooring, Koba & Italian Marble', description: 'Patta border tile strip fitting' },
  'Patta Tile with Koba (4mm space)': { rate: 100, unit: 'SFT', trade: 'Flooring, Koba & Italian Marble', description: 'Patta tile with koba base and 4mm spacer joint' },
  'Patta Tile with (4mm space)': { rate: 70, unit: 'SFT', trade: 'Flooring, Koba & Italian Marble', description: 'Patta tile fixing with 4mm spacer joint' },

  // ── Sills & Skirting ──
  'Spotted Marble Sill': { rate: 55, unit: 'RFT', trade: 'Sills & Skirting', description: 'Window / balcony sill in spotted Indian marble' },
  'Stone Sill': { rate: 82, unit: 'RFT', trade: 'Sills & Skirting', description: 'Natural granite / stone sill fitting' },
  'Single Shempered Edge Stone Sill': { rate: 115, unit: 'RFT', trade: 'Sills & Skirting', description: 'Stone sill with 1-side chamfered edge' },
  'Double Shempered Edge Stone Sill': { rate: 160, unit: 'RFT', trade: 'Sills & Skirting', description: 'Stone sill with 2-side chamfered edge' },
  'Skirting': { rate: 110, unit: 'RFT', trade: 'Sills & Skirting', description: 'Granite / marble wall skirting fitting' },
  'Tiles Skirting': { rate: 45, unit: 'RFT', trade: 'Sills & Skirting', description: 'Tile skirting fitting 3" to 4" high' },
  'Shempered Edge Skirting': { rate: 115, unit: 'RFT', trade: 'Sills & Skirting', description: 'Skirting with chamfered polished top edge' },
  'Italian Marble / Stone Shempered Edge Skirting': { rate: 115, unit: 'RFT', trade: 'Sills & Skirting', description: 'Italian marble / stone chamfered skirting' },

  // ── Door Frames & Fittings ──
  'Main Door Frame Install': { rate: 3000, unit: 'NOS', trade: 'Door Frames & Fittings', description: 'Main entrance heavy door frame installation' },
  'Bedroom Door Frame Install': { rate: 2500, unit: 'NOS', trade: 'Door Frames & Fittings', description: 'Bedroom / toilet door frame installation' },
  'Door Frame Removing': { rate: 1200, unit: 'NOS', trade: 'Door Frames & Fittings', description: 'Dismantling old wooden / stone door frame' },
  'Kadappa Fitting': { rate: 120, unit: 'SFT', trade: 'Door Frames & Fittings', description: 'Black Kadappa stone lining & support' },
  'MS Angle Removing': { rate: 200, unit: 'NOS', trade: 'Door Frames & Fittings', description: 'MS angle / lintel bracket removal' },

  // ── Edges & Chamfers ──
  'Kani Edge Tiles': { rate: 50, unit: 'RFT', trade: 'Edges & Chamfers', description: 'Kani edge pencil molding on tiles' },
  'Kani Edge Stone': { rate: 50, unit: 'RFT', trade: 'Edges & Chamfers', description: 'Kani edge round molding on stone/granite' },
  'Sharp Edge Tiles': { rate: 50, unit: 'RFT', trade: 'Edges & Chamfers', description: 'Sharp 45-degree miter edge on tiles' },
  'Sharp Edge Stone': { rate: 55, unit: 'RFT', trade: 'Edges & Chamfers', description: 'Sharp edge polishing on granite / stone' },
  'Shempered Edge': { rate: 50, unit: 'RFT', trade: 'Edges & Chamfers', description: 'Full chamfer / bevel edge grinding & polish' },

  // ── Kitchen Platforms & Counters ──
  'Platform': { rate: 1350, unit: 'RFT', trade: 'Kitchen Platforms & Counters', description: 'Kitchen platform with sink cut, vertical supports & molding' },
  'Kitchen Platform Remove': { rate: 250, unit: 'RFT', trade: 'Kitchen Platforms & Counters', description: 'Demolition and removal of old kitchen platform' },
  'Basin Counter': { rate: 1050, unit: 'RFT', trade: 'Kitchen Platforms & Counters', description: 'Vanity / wash basin stone counter fabrication' },
  'Basin Counter Remove': { rate: 180, unit: 'RFT', trade: 'Kitchen Platforms & Counters', description: 'Dismantling old basin counter slab' },

  // ── Staircase (Treads & Risers) ──
  'Tread': { rate: 75, unit: 'RFT', trade: 'Staircase (Treads & Risers)', description: 'Staircase step tread laying & nosing' },
  'Riser': { rate: 70, unit: 'RFT', trade: 'Staircase (Treads & Risers)', description: 'Staircase step vertical riser tile / stone' },
  'Landing Tiles': { rate: 97, unit: 'SFT', trade: 'Staircase (Treads & Risers)', description: 'Mid-landing flooring tile laying' },

  // ── Cutting, Openings & Holes ──
  'Nahani Trap': { rate: 160, unit: 'NOS', trade: 'Cutting, Openings & Holes', description: 'Floor drain / nahani trap hole cutting in tile' },
  'Electric Board Cutting': { rate: 50, unit: 'NOS', trade: 'Cutting, Openings & Holes', description: 'Switchboard rectangular cutout in tile / stone' },
  'Wash Basin Gala Cut': { rate: 600, unit: 'NOS', trade: 'Cutting, Openings & Holes', description: 'Oval / round undermount sink gala cut in granite' },
  'Core Cut': { rate: 250, unit: 'NOS', trade: 'Cutting, Openings & Holes', description: 'Diamond circular core cut for plumbing drain pipes' },
  'Plumbing Point Hole': { rate: 50, unit: 'NOS', trade: 'Cutting, Openings & Holes', description: 'Circular hole for water tap / bib cock nozzle' },
  'Niche Create': { rate: 6000, unit: 'NOS', trade: 'Cutting, Openings & Holes', description: 'Wall storage niche fabrication with stone frame' },

  // ── Civil, Plaster & Masonry ──
  'Plaster': { rate: 65, unit: 'SFT', trade: 'Civil, Plaster & Masonry', description: 'Cement sand internal plaster 12-15mm' },
  'Plaster Remove': { rate: 30, unit: 'SFT', trade: 'Civil, Plaster & Masonry', description: 'Hacking / scraping damaged wall plaster' },
  'Plaster Removing': { rate: 30, unit: 'SFT', trade: 'Civil, Plaster & Masonry', description: 'Plaster removal and surface cleaning' },
  'Tiles Remove': { rate: 30, unit: 'SFT', trade: 'Civil, Plaster & Masonry', description: 'Breaking and removing old wall/floor tiles' },
  'Tiles Removing': { rate: 30, unit: 'SFT', trade: 'Civil, Plaster & Masonry', description: 'Chipping old tiles and floor mortar bed' },
  'Block Work': { rate: 70, unit: 'SFT', trade: 'Civil, Plaster & Masonry', description: 'AAC / concrete block masonry wall construction' },
  'Block Work Remove': { rate: 40, unit: 'SFT', trade: 'Civil, Plaster & Masonry', description: 'Demolishing light block partition wall' },
  'Brick Bat': { rate: 250, unit: 'SFT', trade: 'Civil, Plaster & Masonry', description: 'Brick bat waterproofing koba for toilet sunken slab' },
  'Brick Bat Remove': { rate: 170, unit: 'SFT', trade: 'Civil, Plaster & Masonry', description: 'Breaking and removing old brick bat koba' },
  'Brick Bat Removing': { rate: 170, unit: 'SFT', trade: 'Civil, Plaster & Masonry', description: 'Sunken slab clearing and cleaning' },
  'Brick Work Remove': { rate: 170, unit: 'SFT', trade: 'Civil, Plaster & Masonry', description: 'Dismantling 4.5" / 9" red brick wall' },
  'Wall Removing': { rate: 55, unit: 'SFT', trade: 'Civil, Plaster & Masonry', description: 'Demolition of civil partition wall' },
  'Koba Removing': { rate: 20, unit: 'SFT', trade: 'Civil, Plaster & Masonry', description: 'Chipping out thin screed / koba bed' },

  // ── Finishing & Joint Treatments ──
  'Epoxy Filling': { rate: 15, unit: 'SFT', trade: 'Finishing & Joint Treatments', description: 'Two-part epoxy grout filling between tile joints' },
  'Acid Wash': { rate: 10, unit: 'SFT', trade: 'Finishing & Joint Treatments', description: 'Acid wash cleaning of finished tile / marble surfaces' },

  // ── Ceilings & Finishes (Additional Standard Items) ──
  'False Ceiling (Gypsum)': { rate: 95, unit: 'SFT', trade: 'Ceilings & POP', description: 'Gypsum board false ceiling with GI framing' },
  'POP / Gypsum Plaster': { rate: 35, unit: 'SFT', trade: 'Ceilings & POP', description: 'Gypsum wall finish / punning over brickwork' },
  'Painting & Primer': { rate: 18, unit: 'SFT', trade: 'Painting', description: '2 coats premium emulsion with primer & putty' },
  'Royal Luxury Emulsion': { rate: 28, unit: 'SFT', trade: 'Painting', description: '3 coats luxury silk finish with 2 coats acrylic putty' },

  // ── Custom / Other ──
  'Other': { rate: 0, unit: 'L.S.', trade: 'Custom / Other', description: 'Custom contractor line item' }
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

/**
 * Parses a standard rate list JSON exported from rate-list-form.html
 * or similar structure and normalizes into a rate dictionary.
 */
export function importRatesFromJSON(jsonData) {
  if (!jsonData) return null;
  const ratesObj = {};

  // Case 1: Array of { group, category, rate, unit, notes } (exported by rate-list-form.html)
  if (Array.isArray(jsonData.rates)) {
    jsonData.rates.forEach(item => {
      const cat = item.category || item.name;
      if (cat) {
        ratesObj[cat] = {
          rate: parseFloat(item.rate) || 0,
          unit: item.unit || 'SFT',
          trade: item.group || 'Custom',
          description: item.notes || `${item.group || 'Civil'} - ${cat}`
        };
      }
    });
  } else if (typeof jsonData.rates === 'object') {
    // Case 2: Object dictionary { "Design Wall Tiles": { rate, unit, ... } }
    Object.entries(jsonData.rates).forEach(([cat, val]) => {
      ratesObj[cat] = {
        rate: parseFloat(val.rate) || 0,
        unit: val.unit || 'SFT',
        trade: val.group || val.trade || 'Custom',
        description: val.notes || val.description || cat
      };
    });
  } else if (typeof jsonData === 'object') {
    // Case 3: Flat dictionary { "Design Wall Tiles": { rate, unit } }
    Object.entries(jsonData).forEach(([cat, val]) => {
      if (typeof val === 'object' && val !== null) {
        ratesObj[cat] = {
          rate: parseFloat(val.rate) || 0,
          unit: val.unit || 'SFT',
          trade: val.trade || val.group || 'Custom',
          description: val.description || val.notes || cat
        };
      }
    });
  }

  return ratesObj;
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
    const category = (area.parentCategory === 'Other' && area.customParentCategory) 
      ? area.customParentCategory 
      : (area.parentCategory || 'Floor Tiles');
      
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

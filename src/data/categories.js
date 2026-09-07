// Grouped work categories for organized display and easy selection
export const CATEGORIZED_WORK_TYPES = {
  'Flooring & Italian Marble': [
    'Floor Tiles',
    'Floor Italian Marble',
    'Koba',
    'Patta Tiles'
  ],
  'Wall & Dado Tiles': [
    'Wall Tiles',
    'Dado Italian Marble'
  ],
  'Sills & Skirting': [
    'Spotted Marble Sill',
    'Stone Sill',
    'Single Shempered Edge Stone Sill',
    'Double Shempered Edge Stone Sill',
    'Skirting',
    'Shempered Edge Skirting'
  ],
  'Edges & Chamfers': [
    'Kani Edge Tiles',
    'Kani Edge Stone',
    'Sharp Edge Tiles',
    'Sharp Edge Stone',
    'Shempered Edge'
  ],
  'Kitchen Platforms & Counters': [
    'Platform',
    'Kitchen Platform Remove',
    'Basin Counter',
    'Basin Counter Remove'
  ],
  'Staircase (Treads & Risers)': [
    'Tread',
    'Riser',
    'Landing Tiles'
  ],
  'Cutting, Openings & Holes': [
    'Nahani Trap',
    'Electric Board Cutting',
    'Wash Basin Gala Cut',
    'Core Cut',
    'Plumbing Point Hole',
    'Niche Create'
  ],
  'Civil, Plaster & Masonry': [
    'Plaster',
    'Plaster Remove',
    'Tiles Remove',
    'Block Work',
    'Block Work Remove',
    'Brick Bat',
    'Brick Bat Remove',
    'Brick Work Remove'
  ],
  'Finishing & Joint Treatments': [
    'Epoxy Filling',
    'Acid Wash'
  ],
  'Custom / Other': [
    'Other'
  ]
};

// Work categories flat list (Work Detail / Description section data)
export const WORK_CATEGORIES = [
  'Floor Tiles',
  'Floor Italian Marble',
  'Koba',
  'Patta Tiles',
  'Wall Tiles',
  'Dado Italian Marble',
  'Spotted Marble Sill',
  'Stone Sill',
  'Single Shempered Edge Stone Sill',
  'Double Shempered Edge Stone Sill',
  'Skirting',
  'Shempered Edge Skirting',
  'Kani Edge Tiles',
  'Kani Edge Stone',
  'Sharp Edge Tiles',
  'Sharp Edge Stone',
  'Shempered Edge',
  'Platform',
  'Kitchen Platform Remove',
  'Basin Counter',
  'Basin Counter Remove',
  'Tread',
  'Riser',
  'Landing Tiles',
  'Nahani Trap',
  'Electric Board Cutting',
  'Wash Basin Gala Cut',
  'Core Cut',
  'Plumbing Point Hole',
  'Niche Create',
  'Plaster',
  'Plaster Remove',
  'Tiles Remove',
  'Block Work',
  'Block Work Remove',
  'Brick Bat',
  'Brick Bat Remove',
  'Brick Work Remove',
  'Epoxy Filling',
  'Acid Wash',
  'Other'
];

// Room / Location Area options (Between Project and Date)
export const COMMON_ROOM_AREAS = [
  'Living Room',
  'Bedroom 1',
  'Bedroom 2',
  'Bedroom 3',
  'Bedroom 4',
  'Bedroom 5',
  'Bedroom 6',
  'Master Bedroom 1',
  'Master Bedroom 2',
  'Master Bedroom 3',
  'Master Bedroom 4',
  'Master Bedroom 5',
  'Master Bedroom 6',
  'Common Bedroom',
  'Passage',
  'Kitchen',
  'Dining Area',
  'Utility',
  'Deck Area',
  'Toilet',
  'Master Toilet',
  'Common Toilet',
  'Lobby',
  'Terrace',
  'Compound',
  'Other'
];

// Remark section is custom empty by default
export const REMARK_OPTIONS = [];

export const UNIT_OPTIONS = [
  { value: 'SFT', label: 'SFT (Sq. Feet)', type: 'area', description: 'Qty × Length × Height/Width' },
  { value: 'SQM', label: 'SQM (Sq. Meter)', type: 'area', description: 'Qty × Length × Height/Width' },
  { value: 'RFT', label: 'RFT (Running Feet)', type: 'length', description: 'Qty × Length' },
  { value: 'RMT', label: 'RMT (Running Meter)', type: 'length', description: 'Qty × Length' },
  { value: 'NOS', label: 'NOS (Numbers)', type: 'count', description: 'Quantity' },
];

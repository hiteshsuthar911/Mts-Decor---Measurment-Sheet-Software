export const createEmptyItem = (unit = 'SFT') => ({
  id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  remark: '',
  unit,
  quantity: '',
  length: '',
  height: '',
  rate: '',
  isLess: false
});

export const createEmptyArea = () => ({
  id: `area-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  floor: '',
  flat: '',
  room: '',
  parentCategory: 'Floor Tiles',
  customParentCategory: '',
  descriptionHeader: '',
  items: [createEmptyItem('SFT')]
});

export const BLANK_PROJECT = {
  header: {
    contractorName: '',
    clientName: '',
    projectName: '',
    sheetNo: '',
    date: '',
    preparedBy: '',
    checkedBy: '',
    notes: ''
  },
  settings: {
    billingMode: false,
    currencySymbol: '₹',
    taxPercent: '',
  },
  areas: [createEmptyArea()]
};

export const SAMPLE_PROJECT = {
  header: {
    contractorName: 'MTS DECOR',
    clientName: 'Shri R.K. Mehta / Skyline Infra',
    projectName: 'PARK CREST',
    sheetNo: 'MS/PC-08/2025/001',
    date: '2025-07-25',
    preparedBy: 'Hitesh Suthar (Site Engineer)',
    checkedBy: 'M. Sharma (Project Manager)',
    notes: 'Measurements verified on site as per joint inspection with client PMC.'
  },
  settings: {
    billingMode: true,
    currencySymbol: '₹',
    taxPercent: 18,
  },
  areas: [
    {
      id: 'area-1',
      floor: '8th Floor',
      flat: 'Flat 801',
      room: 'Living, Dining & Bedrooms',
      parentCategory: 'Main Floor',
      descriptionHeader: 'ITALIAN MARBLE FLOORING WITH KOBA',
      items: [
        { id: 'item-1', remark: 'MB 1 (Master Bedroom 1)', unit: 'SFT', quantity: 1, length: 17.90, height: 11.05, rate: 420, isLess: false },
        { id: 'item-2', remark: 'MB 2', unit: 'SFT', quantity: 1, length: 3.92, height: 5.24, rate: 420, isLess: false },
        { id: 'item-3', remark: 'MB 2 Passage', unit: 'SFT', quantity: 1, length: 11.06, height: 12.48, rate: 420, isLess: false },
        { id: 'item-4', remark: 'Passage', unit: 'SFT', quantity: 1, length: 3.84, height: 5.46, rate: 420, isLess: false },
        { id: 'item-5', remark: 'Dinning', unit: 'SFT', quantity: 1, length: 15.30, height: 17.48, rate: 420, isLess: false },
        { id: 'item-6', remark: 'Living', unit: 'SFT', quantity: 1, length: 28.24, height: 12.70, rate: 420, isLess: false },
        { id: 'item-7', remark: 'Living Niche', unit: 'SFT', quantity: 1, length: 1.00, height: 7.23, rate: 420, isLess: false },
        { id: 'item-8', remark: 'Passage 2', unit: 'SFT', quantity: 1, length: 10.95, height: 4.00, rate: 420, isLess: false },
        { id: 'item-9', remark: 'MB 3', unit: 'SFT', quantity: 1, length: 11.94, height: 16.34, rate: 420, isLess: false },
        { id: 'item-10', remark: 'Kitchen', unit: 'SFT', quantity: 1, length: 9.73, height: 6.76, rate: 420, isLess: false },
        { id: 'item-11', remark: 'Kitchen Corner', unit: 'SFT', quantity: 1, length: 3.54, height: 1.14, rate: 420, isLess: false },
        { id: 'item-12', remark: 'Utility', unit: 'SFT', quantity: 1, length: 2.86, height: 9.82, rate: 420, isLess: false },
        // Umra (thresholds)
        { id: 'item-13', remark: 'Umra - Living', unit: 'SFT', quantity: 1, length: 6.20, height: 0.33, rate: 420, isLess: false },
        { id: 'item-14', remark: 'Umra - MB 2', unit: 'SFT', quantity: 1, length: 7.47, height: 0.33, rate: 420, isLess: false },
        { id: 'item-15', remark: 'Umra - MB 1', unit: 'SFT', quantity: 1, length: 7.47, height: 0.32, rate: 420, isLess: false },
        { id: 'item-16', remark: 'Umra - Bathroom', unit: 'SFT', quantity: 3, length: 2.20, height: 0.42, rate: 420, isLess: false },
        { id: 'item-17', remark: 'Umra - Kitchen', unit: 'SFT', quantity: 1, length: 2.80, height: 0.68, rate: 420, isLess: false },
        { id: 'item-18', remark: 'Umra - Utility', unit: 'SFT', quantity: 1, length: 2.80, height: 0.68, rate: 420, isLess: false },
        { id: 'item-19', remark: 'Umra - Bedroom', unit: 'SFT', quantity: 3, length: 2.70, height: 0.50, rate: 420, isLess: false },
        { id: 'item-20', remark: 'Umra - Main Door', unit: 'SFT', quantity: 1, length: 3.47, height: 0.58, rate: 420, isLess: false },
        // Deductions (LESS)
        { id: 'item-21', remark: 'Living - Duct Deduction', unit: 'SFT', quantity: 1, length: 6.00, height: 0.75, rate: 420, isLess: true },
        { id: 'item-22', remark: 'Living - Column Cutout', unit: 'SFT', quantity: 1, length: 1.40, height: 1.85, rate: 420, isLess: true },
        { id: 'item-23', remark: 'Dinning - Opening Cutout', unit: 'SFT', quantity: 1, length: 10.47, height: 0.25, rate: 420, isLess: true },
        { id: 'item-24', remark: 'MB 2 - Wardrobe Niche', unit: 'SFT', quantity: 1, length: 2.18, height: 0.42, rate: 420, isLess: true },
        { id: 'item-25', remark: 'MB 2 - Door Cutout', unit: 'SFT', quantity: 1, length: 2.18, height: 0.33, rate: 420, isLess: true },
        { id: 'item-26', remark: 'MB 1 - Column Notch', unit: 'SFT', quantity: 1, length: 2.78, height: 0.25, rate: 420, isLess: true },
        { id: 'item-27', remark: 'MB 1 - Door Opening Cutout', unit: 'SFT', quantity: 1, length: 2.20, height: 0.25, rate: 420, isLess: true },
      ]
    },
    {
      id: 'area-2',
      floor: '8th Floor',
      flat: 'Flat 801',
      room: 'Master Toilet',
      parentCategory: 'Toilet',
      descriptionHeader: 'CERAMIC DADO WALL TILES (UPTO CEILING)',
      items: [
        { id: 'item-201', remark: 'Long Wall A', unit: 'SFT', quantity: 1, length: 10.50, height: 8.50, rate: 110, isLess: false },
        { id: 'item-202', remark: 'Long Wall B', unit: 'SFT', quantity: 1, length: 10.50, height: 8.50, rate: 110, isLess: false },
        { id: 'item-203', remark: 'Short Wall C', unit: 'SFT', quantity: 1, length: 6.25, height: 8.50, rate: 110, isLess: false },
        { id: 'item-204', remark: 'Short Wall D (Door Wall)', unit: 'SFT', quantity: 1, length: 6.25, height: 8.50, rate: 110, isLess: false },
        // Less door & ventilator opening
        { id: 'item-205', remark: 'Door Opening Deduction', unit: 'SFT', quantity: 1, length: 2.50, height: 7.00, rate: 110, isLess: true },
        { id: 'item-206', remark: 'Ventilator Opening', unit: 'SFT', quantity: 1, length: 2.00, height: 2.00, rate: 110, isLess: true }
      ]
    },
    {
      id: 'area-3',
      floor: '8th Floor',
      flat: 'Flat 801',
      room: 'Windows & Openings',
      parentCategory: 'Spotted Marble Sill',
      descriptionHeader: 'SPOTTED MARBLE SILL WORK (RUNNING LENGTH)',
      items: [
        { id: 'item-301', remark: 'Living Room French Window Sill', unit: 'RFT', quantity: 2, length: 8.50, height: 0, rate: 280, isLess: false },
        { id: 'item-302', remark: 'Master Bedroom Window Sill', unit: 'RFT', quantity: 2, length: 6.00, height: 0, rate: 280, isLess: false },
        { id: 'item-303', remark: 'Kitchen Window Sill', unit: 'RFT', quantity: 2, length: 4.50, height: 0, rate: 280, isLess: false }
      ]
    }
  ]
};

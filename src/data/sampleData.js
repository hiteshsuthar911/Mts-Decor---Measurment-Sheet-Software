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

// Aliased to BLANK_PROJECT so no mock dummy data is ever loaded
export const SAMPLE_PROJECT = BLANK_PROJECT;

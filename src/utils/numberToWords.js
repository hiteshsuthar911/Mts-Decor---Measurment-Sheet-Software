// Converts numbers into standard Indian currency words (e.g. ₹5,40,750 => "Rupees Five Lakh Forty Thousand Seven Hundred and Fifty Only")

const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertLessThanThousand(num) {
  let str = '';
  if (num >= 100) {
    str += units[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 20) {
    str += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  }
  if (num > 0) {
    str += units[num] + ' ';
  }
  return str.trim();
}

export function numberToIndianWords(amount) {
  const num = Math.round(parseFloat(amount) || 0);
  if (num === 0) return 'Zero Rupees Only';
  if (num < 0) return 'Negative ' + numberToIndianWords(Math.abs(num));

  let remaining = num;
  let words = '';

  // Crores (1,00,00,000)
  const crores = Math.floor(remaining / 10000000);
  if (crores > 0) {
    words += convertLessThanThousand(crores) + ' Crore ';
    remaining %= 10000000;
  }

  // Lakhs (1,00,000)
  const lakhs = Math.floor(remaining / 100000);
  if (lakhs > 0) {
    words += convertLessThanThousand(lakhs) + ' Lakh ';
    remaining %= 100000;
  }

  // Thousands (1,00,00)
  const thousands = Math.floor(remaining / 1000);
  if (thousands > 0) {
    words += convertLessThanThousand(thousands) + ' Thousand ';
    remaining %= 1000;
  }

  // Hundreds & Remaining
  if (remaining > 0) {
    words += convertLessThanThousand(remaining) + ' ';
  }

  return 'Rupees ' + words.trim() + ' Only';
}

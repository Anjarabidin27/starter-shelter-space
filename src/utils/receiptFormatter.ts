import { Receipt } from '@/types/pos';

export const formatReceiptId = (receipt: Receipt): string => {
  // Extract counter and date from invoice ID
  const id = receipt.id;
  
  if (id.startsWith('INV-') || id.startsWith('MNL-')) {
    // For new format like INV-1070925 or MNL-1070925
    const parts = id.split('-');
    if (parts.length === 2) {
      const numberPart = parts[1];
      // Extract date (last 6 digits) and counter (remaining digits)
      if (numberPart.length >= 7) {
        const counter = numberPart.slice(0, -6);
        const dateStr = numberPart.slice(-6);
        const day = dateStr.slice(0, 2);
        const month = dateStr.slice(2, 4);
        const year = dateStr.slice(4, 6);
        
        const prefix = parts[0];
        return `${prefix}-${counter} (${day}/${month}/${year})`;
      }
    }
  }
  
  // Return original ID if format doesn't match
  return id;
};

export const formatReceiptDetailedInfo = (receipt: Receipt): string => {
  const formattedId = formatReceiptId(receipt);
  const date = receipt.timestamp.toLocaleDateString('id-ID');
  const time = receipt.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  
  return `${formattedId} - ${date} ${time}`;
};

export const formatReceiptForDisplay = (receipt: Receipt): {
  displayId: string;
  dateTime: string;
  shortDate: string;
  shortTime: string;
} => {
  const displayId = formatReceiptId(receipt);
  const date = receipt.timestamp.toLocaleDateString('id-ID');
  const time = receipt.timestamp.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return {
    displayId,
    dateTime: `${date} ${time}`,
    shortDate: date,
    shortTime: time
  };
};
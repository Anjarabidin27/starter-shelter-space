import { Receipt as ReceiptType } from '@/types/pos';
import { Store } from '@/types/store';

export const formatThermalReceipt = (
  receipt: ReceiptType, 
  formatPrice: (price: number) => string,
  store?: Store | null
): string => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  // ESC/POS Commands
  const ESC = '\x1B';
  const BOLD_ON = ESC + 'E\x01';
  const BOLD_OFF = ESC + 'E\x00';
  const CENTER = ESC + 'a\x01';
  const LEFT = ESC + 'a\x00';
  const CUT = '\x1D' + 'V\x42\x00';
  
  // Format harga tanpa simbol currency karena kita tulis manual
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('id-ID').format(amount);
  };

  const storeName = store?.name?.toUpperCase() || 'TOKO';
  const storeAddress = store?.address || '';
  const storePhone = store?.phone || '';
  const storeHours = (store?.opening_hours && store?.closing_hours) 
    ? `Buka: ${store.opening_hours} - ${store.closing_hours}` 
    : '';

  const paymentInfo = receipt.paymentMethod?.toLowerCase() === 'transfer' && store?.bank_name
    ? `\nTransfer ke:
${store.bank_name}
No. Rek: ${store.bank_account_number || ''}
a.n. ${store.bank_account_holder || ''}`
    : receipt.paymentMethod?.toLowerCase() === 'qris'
    ? `\nQRIS: Lihat gambar QRIS di struk`
    : '';

  return `${ESC}@${CENTER}${BOLD_ON}================================${BOLD_OFF}
${BOLD_ON}${storeName}${BOLD_OFF}
${BOLD_ON}================================${BOLD_OFF}
${storeAddress ? storeAddress + '\n' : ''}${storePhone ? 'Telp/WA: ' + storePhone + '\n' : ''}${storeHours ? storeHours + '\n' : ''}

${BOLD_ON}================================${BOLD_OFF}
${BOLD_ON}STRUK PENJUALAN${BOLD_OFF}
${BOLD_ON}================================${BOLD_OFF}
Invoice: ${BOLD_ON}${receipt.id}${BOLD_OFF}
Tanggal: ${formatDate(receipt.timestamp)}
${BOLD_ON}--------------------------------${BOLD_OFF}
${LEFT}
${receipt.items.map(item => {
  const price = item.finalPrice || item.product.sellPrice;
  const total = price * item.quantity;
  const itemName = item.product.name;
  const qtyPrice = `${item.quantity} x Rp ${formatAmount(price)}`;
  const totalPrice = `Rp ${formatAmount(total)}`;
  
  // Untuk kertas kecil (32 karakter)
  return `${itemName}
${qtyPrice}
${' '.repeat(Math.max(0, 32 - totalPrice.length))}${BOLD_ON}${totalPrice}${BOLD_OFF}`;
}).join('\n\n')}

${BOLD_ON}--------------------------------${BOLD_OFF}
Subtotal: ${' '.repeat(Math.max(0, 15 - `Rp ${formatAmount(receipt.subtotal)}`.length))}${BOLD_ON}Rp ${formatAmount(receipt.subtotal)}${BOLD_OFF}${receipt.discount > 0 ? `
Diskon: ${' '.repeat(Math.max(0, 17 - `Rp ${formatAmount(receipt.discount)}`.length))}${BOLD_ON}Rp ${formatAmount(receipt.discount)}${BOLD_OFF}` : ''}
${BOLD_ON}--------------------------------${BOLD_OFF}
${BOLD_ON}TOTAL: ${' '.repeat(Math.max(0, 18 - `Rp ${formatAmount(receipt.total)}`.length))}Rp ${formatAmount(receipt.total)}${BOLD_OFF}

Metode: ${BOLD_ON}${receipt.paymentMethod?.toUpperCase() || 'CASH'}${BOLD_OFF}${paymentInfo}

${CENTER}${BOLD_ON}================================${BOLD_OFF}
${BOLD_ON}TERIMA KASIH ATAS${BOLD_OFF}
${BOLD_ON}KUNJUNGAN ANDA!${BOLD_OFF}
    
${BOLD_ON}Semoga Hari Anda Menyenangkan${BOLD_OFF}
${BOLD_ON}================================${BOLD_OFF}

${CUT}`;
};

export const formatMobileA4ThermalReceipt = (
  receipt: ReceiptType, 
  formatPrice: (price: number) => string,
  store?: Store | null
): string => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  // ESC/POS Commands for A4 thermal
  const ESC = '\x1B';
  const BOLD_ON = ESC + 'E\x01';
  const BOLD_OFF = ESC + 'E\x00';
  const CENTER = ESC + 'a\x01';
  const LEFT = ESC + 'a\x00';
  const CUT = '\x1D' + 'V\x42\x00';
  const DOUBLE_HEIGHT = ESC + '!\x10';
  const NORMAL_SIZE = ESC + '!\x00';
  
  // Format harga untuk A4 thermal (48 karakter lebar)
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('id-ID').format(amount);
  };

  const lineWidth = 48; // A4 thermal paper width
  const storeName = store?.name?.toUpperCase() || 'TOKO';
  const storeAddress = store?.address || '';
  const storePhone = store?.phone || '';
  const storeHours = (store?.opening_hours && store?.closing_hours) 
    ? `Buka: ${store.opening_hours} - ${store.closing_hours}` 
    : '';

  const paymentInfoA4 = receipt.paymentMethod?.toLowerCase() === 'transfer' && store?.bank_name
    ? `\n\nTransfer ke: ${store.bank_name}
No. Rekening: ${store.bank_account_number || ''}
Atas Nama: ${store.bank_account_holder || ''}`
    : receipt.paymentMethod?.toLowerCase() === 'qris'
    ? `\nQRIS: Lihat gambar QRIS di struk`
    : '';

  return `${ESC}@${CENTER}${BOLD_ON}${DOUBLE_HEIGHT}================================================${BOLD_OFF}${NORMAL_SIZE}
${BOLD_ON}${DOUBLE_HEIGHT}      ${storeName}      ${BOLD_OFF}${NORMAL_SIZE}
${BOLD_ON}${DOUBLE_HEIGHT}================================================${BOLD_OFF}${NORMAL_SIZE}
${CENTER}${storeAddress ? storeAddress + '\n' : ''}${storePhone ? 'Telp/WA: ' + storePhone + '\n' : ''}${storeHours ? storeHours + '\n' : ''}

${BOLD_ON}================================================${BOLD_OFF}
${BOLD_ON}${CENTER}           STRUK PENJUALAN           ${BOLD_OFF}
${BOLD_ON}================================================${BOLD_OFF}
${LEFT}Invoice: ${BOLD_ON}${receipt.id}${BOLD_OFF}
Tanggal: ${formatDate(receipt.timestamp)}
${BOLD_ON}------------------------------------------------${BOLD_OFF}

${receipt.items.map(item => {
  const price = item.finalPrice || item.product.sellPrice;
  const total = price * item.quantity;
  const itemName = item.product.name;
  const qtyPrice = `${item.quantity} x Rp ${formatAmount(price)}`;
  const totalPrice = `Rp ${formatAmount(total)}`;
  
  // Untuk A4 thermal (48 karakter)
  const nameSpacing = Math.max(0, lineWidth - itemName.length);
  const qtyPriceSpacing = Math.max(0, lineWidth - qtyPrice.length - totalPrice.length);
  
  return `${itemName}${' '.repeat(nameSpacing)}
${qtyPrice}${' '.repeat(qtyPriceSpacing)}${BOLD_ON}${totalPrice}${BOLD_OFF}`;
}).join('\n\n')}

${BOLD_ON}------------------------------------------------${BOLD_OFF}
Subtotal:${' '.repeat(Math.max(0, lineWidth - 9 - `Rp ${formatAmount(receipt.subtotal)}`.length))}${BOLD_ON}Rp ${formatAmount(receipt.subtotal)}${BOLD_OFF}${receipt.discount > 0 ? `
Diskon:${' '.repeat(Math.max(0, lineWidth - 7 - `Rp ${formatAmount(receipt.discount)}`.length))}${BOLD_ON}Rp ${formatAmount(receipt.discount)}${BOLD_OFF}` : ''}
${BOLD_ON}------------------------------------------------${BOLD_OFF}
${BOLD_ON}${DOUBLE_HEIGHT}TOTAL:${' '.repeat(Math.max(0, (lineWidth/2) - 6 - `Rp ${formatAmount(receipt.total)}`.length))}Rp ${formatAmount(receipt.total)}${BOLD_OFF}${NORMAL_SIZE}

Metode Pembayaran: ${BOLD_ON}${receipt.paymentMethod?.toUpperCase() || 'CASH'}${BOLD_OFF}${paymentInfoA4}

${CENTER}${BOLD_ON}================================================${BOLD_OFF}
${BOLD_ON}${DOUBLE_HEIGHT}        TERIMA KASIH ATAS        ${BOLD_OFF}${NORMAL_SIZE}
${BOLD_ON}${DOUBLE_HEIGHT}        KUNJUNGAN ANDA!          ${BOLD_OFF}${NORMAL_SIZE}

${BOLD_ON}      Semoga Hari Anda Menyenangkan      ${BOLD_OFF}
${BOLD_ON}================================================${BOLD_OFF}


${CUT}`;
};

export const formatPrintReceipt = (
  receipt: ReceiptType, 
  formatPrice: (price: number) => string,
  store?: Store | null
): string => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  const storeName = store?.name || 'Toko';
  const storeAddress = store?.address || '';
  const storePhone = store?.phone || '';
  const storeHours = (store?.opening_hours && store?.closing_hours) 
    ? `Buka: ${store.opening_hours} - ${store.closing_hours}` 
    : '';

  const paymentDetails = receipt.paymentMethod?.toLowerCase() === 'transfer' && store?.bank_name
    ? `
        <div style="border-top: 1px solid #e5e7eb; margin: 16px 0; padding-top: 16px;">
          <div style="font-size: 14px; color: #666; margin-bottom: 8px; font-weight: 500;">Informasi Transfer:</div>
          <div style="font-size: 14px;">
            <div style="margin-bottom: 4px;">Bank: <strong>${store.bank_name}</strong></div>
            <div style="margin-bottom: 4px;">No. Rekening: <strong>${store.bank_account_number || ''}</strong></div>
            <div>Atas Nama: <strong>${store.bank_account_holder || ''}</strong></div>
          </div>
        </div>
      `
    : receipt.paymentMethod?.toLowerCase() === 'qris'
    ? `
        <div style="border-top: 1px solid #e5e7eb; margin: 16px 0; padding-top: 16px;">
          <div style="font-size: 14px; color: #666; text-align: center;">
            QRIS: <strong>Lihat gambar QRIS di struk</strong>
          </div>
        </div>
      `
    : '';

  return `
      <div style="font-family: -ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; max-width: 380px; margin: 0 auto; padding: 20px; background: white;">
        <div style="text-align: center; padding-bottom: 16px;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">${storeName}</h2>
          ${storeAddress ? `<p style="font-size: 14px; color: #666; margin-bottom: 4px;">${storeAddress}</p>` : ''}
          ${storePhone ? `<p style="font-size: 14px; color: #666; margin-bottom: 4px;">Telp/WA: ${storePhone}</p>` : ''}
          ${storeHours ? `<p style="font-size: 14px; color: #666; margin-bottom: 0;">${storeHours}</p>` : ''}
        </div>

        <div style="border-top: 1px solid #e5e7eb; margin: 16px 0;"></div>

        <div style="text-center; margin: 16px 0;">
          <div style="font-family: monospace; font-size: 18px; font-weight: bold; margin-bottom: 8px;">STRUK PENJUALAN</div>
          <div style="font-size: 14px; color: #666; margin-bottom: 4px;">
            ${receipt.id}
          </div>
          <div style="font-size: 14px; color: #666;">
            ${formatDate(receipt.timestamp)}
          </div>
        </div>

        <div style="border-top: 1px solid #e5e7eb; margin: 16px 0;"></div>

        <div style="margin: 16px 0;">
          ${receipt.items.map(item => `
            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
              <div style="flex: 1;">
                <div style="font-weight: 500; margin-bottom: 4px;">${item.product.name}</div>
                <div style="color: #666; font-size: 12px;">
                  ${formatPrice(item.finalPrice || item.product.sellPrice)} × ${item.quantity}
                </div>
              </div>
              <div style="font-weight: 500; min-width: 80px; text-align: right;">
                ${formatPrice((item.finalPrice || item.product.sellPrice) * item.quantity)}
              </div>
            </div>
          `).join('')}
        </div>

        <div style="border-top: 1px solid #e5e7eb; margin: 16px 0;"></div>

        <div style="font-size: 14px; margin: 4px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Subtotal</span>
            <span>${formatPrice(receipt.subtotal)}</span>
          </div>
          ${receipt.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; color: #dc2626; margin-bottom: 4px;">
              <span>Diskon</span>
              <span>-${formatPrice(receipt.discount)}</span>
            </div>
          ` : ''}
          <div style="border-top: 1px solid #e5e7eb; margin: 4px 0;"></div>
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
            <span>TOTAL</span>
            <span>${formatPrice(receipt.total)}</span>
          </div>
        </div>

        <div style="border-top: 1px solid #e5e7eb; margin: 16px 0;"></div>

        <div style="font-size: 14px; margin: 8px 0;">
          <p style="margin-bottom: 4px;">Metode Pembayaran: <strong>${receipt.paymentMethod?.toUpperCase() || 'CASH'}</strong></p>
        </div>

        ${paymentDetails}

        <div style="border-top: 1px solid #e5e7eb; margin: 16px 0;"></div>

        <div style="text-align: center; font-size: 14px; color: #666;">
          <p style="margin-bottom: 8px;">Terima kasih atas kunjungan Anda!</p>
          <p style="margin-bottom: 8px;">Semoga Hari Anda Menyenangkan</p>
        </div>
      </div>
    `;
};

export const formatMobileA4PrintReceipt = (
  receipt: ReceiptType, 
  formatPrice: (price: number) => string,
  store?: Store | null
): string => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  // Format harga tanpa simbol currency karena kita tulis manual
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('id-ID').format(amount);
  };

  const storeName = store?.name?.toUpperCase() || 'TOKO';
  const storeAddress = store?.address || '';
  const storePhone = store?.phone || '';

  const paymentDetailsA4Mobile = receipt.paymentMethod?.toLowerCase() === 'transfer' && store?.bank_name
    ? `
        <div style="border-top: 2px solid #000; margin: 30px 0; padding-top: 20px;">
          <div style="font-size: 18px; margin-bottom: 15px; font-weight: bold;">Informasi Transfer:</div>
          <div style="font-size: 16px;">
            <div style="margin-bottom: 8px;">Bank: <strong>${store.bank_name}</strong></div>
            <div style="margin-bottom: 8px;">No. Rekening: <strong>${store.bank_account_number || ''}</strong></div>
            <div>Atas Nama: <strong>${store.bank_account_holder || ''}</strong></div>
          </div>
        </div>
      `
    : receipt.paymentMethod?.toLowerCase() === 'qris'
    ? `
        <div style="border-top: 2px solid #000; margin: 30px 0; padding-top: 20px; text-align: center;">
          <div style="font-size: 16px;">
            QRIS: <strong>Lihat gambar QRIS di struk</strong>
          </div>
        </div>
      `
    : '';

  return `
      <div style="font-family: monospace; width: 100%; max-width: 100%; margin: 0; padding: 20px; box-sizing: border-box;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">${storeName}</h1>
          ${storeAddress ? `<p style="font-size: 16px; margin-bottom: 5px;">${storeAddress}</p>` : ''}
          ${storePhone ? `<p style="font-size: 16px; margin-bottom: 0;">Telp/WA: ${storePhone}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">STRUK PENJUALAN</h2>
          <p style="font-size: 16px; margin-bottom: 5px;">${receipt.id}</p>
          <p style="font-size: 16px; margin-bottom: 0;">${formatDate(receipt.timestamp)}</p>
        </div>
        
        <div style="border-top: 2px solid #000; margin: 30px 0; padding-top: 20px;">
          ${receipt.items.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; align-items: flex-start;">
              <div style="flex: 1;">
                <div style="font-weight: bold; font-size: 18px; margin-bottom: 5px;">${item.product.name}</div>
                <div style="font-size: 14px; color: #666;">Rp ${formatAmount(item.finalPrice || item.product.sellPrice)} × ${item.quantity}</div>
              </div>
              <div style="font-weight: bold; font-size: 18px; text-align: right; min-width: 120px;">
                Rp ${formatAmount((item.finalPrice || item.product.sellPrice) * item.quantity)}
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="border-top: 2px solid #000; margin: 30px 0; padding-top: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 16px;">
            <span>Subtotal:</span>
            <span style="min-width: 120px; text-align: right;">Rp ${formatAmount(receipt.subtotal)}</span>
          </div>
          ${receipt.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #dc2626; font-size: 16px;">
              <span>Diskon:</span>
              <span style="min-width: 120px; text-align: right;">-Rp ${formatAmount(receipt.discount)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 24px; margin-top: 20px; border-top: 2px solid #000; padding-top: 20px;">
            <span>TOTAL:</span>
            <span style="min-width: 120px; text-align: right;">Rp ${formatAmount(receipt.total)}</span>
          </div>
        </div>
        
        <div style="border-top: 2px solid #000; margin: 30px 0; padding-top: 20px;">
          <div style="font-size: 16px; margin-bottom: 10px;">
            Metode Pembayaran: <strong>${receipt.paymentMethod?.toUpperCase() || 'CASH'}</strong>
          </div>
        </div>

        ${paymentDetailsA4Mobile}
        
        <div style="text-align: center; margin-top: 40px; font-size: 16px;">
          <p style="margin-bottom: 10px; font-weight: bold;">Terima kasih atas kunjungan Anda!</p>
          <p style="margin-bottom: 10px; font-weight: bold;">Semoga Hari Anda Menyenangkan</p>
        </div>
      </div>
    `;
};
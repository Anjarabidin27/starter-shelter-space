import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search } from 'lucide-react';
import { TransactionHistory } from '@/components/Reports/TransactionHistory';
import { Receipt as ReceiptComponent } from '@/components/POS/Receipt';
import { usePOSContext } from '@/contexts/POSContext';
import { Receipt } from '@/types/pos';
import { Link } from 'react-router-dom';

export const ReportsPage = () => {
  const { receipts, formatPrice } = usePOSContext();
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleViewReceipt = (receipt: Receipt) => {
    setViewingReceipt(receipt);
  };

  const handlePrintReceipt = (receipt: Receipt) => {
    // Print functionality - you can implement actual printing here
    console.log('Print receipt:', receipt);
    window.print();
  };

  const handleBackToReports = () => {
    setViewingReceipt(null);
  };

  if (viewingReceipt) {
    return (
      <div className="min-h-screen w-full bg-background">
        <div className="container mx-auto p-2 sm:p-4 max-w-4xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToReports}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Kembali</span>
              </Button>
              <h1 className="text-lg sm:text-2xl font-bold">Detail Transaksi</h1>
            </div>

            <ReceiptComponent
              receipt={viewingReceipt}
              formatPrice={formatPrice}
              onBack={handleBackToReports}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto p-2 sm:p-4 md:p-6 max-w-7xl">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold">Laporan Penjualan</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Kelola dan pantau riwayat transaksi Anda
              </p>
            </div>
            <div className="flex w-full sm:w-auto items-center gap-3">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari invoice, produk, atau tanggal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Link to="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2 w-auto">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">POS</span>
                </Button>
              </Link>
            </div>
          </div>


          <div className="overflow-x-auto">
            <TransactionHistory
              receipts={receipts.filter(receipt => {
                if (receipt.isManual || receipt.id.startsWith('MNL-')) return false;
                if (!searchQuery) return true;
                
                const query = searchQuery.toLowerCase();
                const matchesId = receipt.id.toLowerCase().includes(query);
                const matchesDate = new Date(receipt.timestamp).toLocaleDateString('id-ID').includes(query);
                const matchesProducts = receipt.items.some(item => 
                  item.product.name.toLowerCase().includes(query)
                );
                
                return matchesId || matchesDate || matchesProducts;
              })}
              formatPrice={formatPrice}
              onViewReceipt={handleViewReceipt}
              onPrintReceipt={handlePrintReceipt}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Product, CartItem, Receipt } from '@/types/pos';
import { toast } from 'sonner';

export const useSupabasePOS = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load products from database
  useEffect(() => {
    loadProducts();
    loadReceipts();

    // Set up real-time subscriptions
    const productsSubscription = supabase
      .channel('products_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' }, 
        () => loadProducts()
      )
      .subscribe();

    const receiptsSubscription = supabase
      .channel('receipts_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'receipts' }, 
        () => loadReceipts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsSubscription);
      supabase.removeChannel(receiptsSubscription);
    };
  }, [user]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;

      const formattedProducts: Product[] = data.map(item => ({
        id: item.id,
        name: item.name,
        costPrice: Number(item.cost_price),
        sellPrice: Number(item.sell_price),
        stock: item.stock,
        barcode: item.barcode,
        category: item.category,
        isPhotocopy: item.is_photocopy
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  };

  const loadReceipts = async () => {
    if (!user) return;

    try {
      const { data: receiptsData, error } = await supabase
        .from('receipts')
        .select(`
          *,
          receipt_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReceipts: Receipt[] = receiptsData.map(receipt => ({
        id: receipt.id,
        items: receipt.receipt_items.map((item: any) => ({
          product: item.products ? {
            id: item.products.id,
            name: item.products.name,
            costPrice: Number(item.products.cost_price),
            sellPrice: Number(item.products.sell_price),
            stock: item.products.stock,
            barcode: item.products.barcode,
            category: item.products.category,
            isPhotocopy: item.products.is_photocopy
          } : {
            id: 'manual',
            name: item.product_name,
            costPrice: Number(item.cost_price),
            sellPrice: Number(item.unit_price),
            stock: 0,
            barcode: null,
            category: null,
            isPhotocopy: false
          },
          quantity: item.quantity
        })),
        subtotal: Number(receipt.subtotal),
        discount: Number(receipt.discount),
        total: Number(receipt.total),
        profit: Number(receipt.profit),
        photocopyRevenue: 0, // Legacy field, not used
        timestamp: new Date(receipt.created_at),
        paymentMethod: receipt.payment_method,
        isManual: (receipt.invoice_number?.startsWith('MNL-') ?? false)
      }));

      setReceipts(formattedReceipts);
    } catch (error) {
      console.error('Error loading receipts:', error);
      toast.error('Gagal memuat riwayat transaksi');
    }
  };

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          price: productData.sellPrice, // Keep price for compatibility
          cost_price: productData.costPrice,
          sell_price: productData.sellPrice,
          stock: productData.stock,
          barcode: productData.barcode,
          category: productData.category || 'General',
          is_photocopy: productData.isPhotocopy || false
        });

      if (error) throw error;
      toast.success('Produk berhasil ditambahkan');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Gagal menambahkan produk');
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.costPrice !== undefined) updateData.cost_price = updates.costPrice;
      if (updates.sellPrice !== undefined) {
        updateData.sell_price = updates.sellPrice;
        updateData.price = updates.sellPrice; // Keep price in sync
      }
      if (updates.stock !== undefined) updateData.stock = updates.stock;
      if (updates.barcode !== undefined) updateData.barcode = updates.barcode;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.isPhotocopy !== undefined) updateData.is_photocopy = updates.isPhotocopy;

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) throw error;
      toast.success('Produk berhasil diperbarui');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Gagal memperbarui produk');
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      // Also remove from cart if it exists
      setCart(prev => prev.filter(item => item.product.id !== productId));
      
      toast.success('Produk berhasil dihapus');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Gagal menghapus produk');
    }
  };

  const processTransaction = async (cart: CartItem[], paymentMethod?: string, discount: number = 0): Promise<Receipt | null> => {
    if (!user || cart.length === 0) return null;

    try {
      const subtotal = cart.reduce((sum, item) => 
        sum + (item.finalPrice || item.product.sellPrice) * item.quantity, 0
      );
      const total = subtotal - discount;
      const profit = cart.reduce((sum, item) => 
        sum + ((item.finalPrice || item.product.sellPrice) - item.product.costPrice) * item.quantity, 0
      );

      // Generate counter-based invoice number
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const dateStr = `${day}${month}${year}`;
      
      // Get current count of receipts for today to create counter
      const { data: existingReceipts, error: countError } = await supabase
        .from('receipts')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())
        .lt('created_at', new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString());

      if (countError) throw countError;

      const counter = (existingReceipts?.length || 0) + 1;
      const invoiceNumber = `INV-${counter}${dateStr}`;

      // Create receipt with generated invoice number
      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          invoice_number: invoiceNumber,
          user_id: user.id,
          subtotal,
          discount,
          total,
          profit,
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

      // Create receipt items
      const receiptItems = cart.map(item => ({
        receipt_id: receiptData.id,
        product_id: item.product.isPhotocopy ? null : item.product.id, // Skip product_id for photocopy services
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.finalPrice || item.product.sellPrice,
        cost_price: item.product.costPrice,
        total_price: (item.finalPrice || item.product.sellPrice) * item.quantity,
        profit: ((item.finalPrice || item.product.sellPrice) - item.product.costPrice) * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('receipt_items')
        .insert(receiptItems);

      if (itemsError) throw itemsError;

      // Update product stock (skip for photocopy as it's service-based)
      for (const item of cart) {
        if (!item.product.isPhotocopy) {
          const newStock = item.product.stock - item.quantity;
          await updateProduct(item.product.id, { stock: newStock });
        }
      }

      const receipt: Receipt = {
        id: receiptData.id,
        items: cart,
        subtotal,
        discount,
        total,
        profit,
        timestamp: new Date(receiptData.created_at),
        paymentMethod,
        isManual: false
      };

      // Immediately update local state for instant UI update
      setReceipts(prev => [receipt, ...prev]);

      toast.success('Transaksi berhasil disimpan');
      return receipt;
    } catch (error) {
      console.error('Error processing transaction:', error);
      toast.error('Gagal memproses transaksi');
      return null;
    }
  };

  const addToCart = (product: Product, quantity: number = 1, customPrice?: number) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      updateCartQuantity(product.id, existingItem.quantity + quantity, customPrice);
    } else {
      const newItem: CartItem = {
        product,
        quantity,
        finalPrice: customPrice
      };
      setCart(prev => [...prev, newItem]);
    }
  };

  const updateCartQuantity = (productId: string, quantity: number, finalPrice?: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, quantity, finalPrice }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const processTransactionWrapper = async (paymentMethod?: string, discount: number = 0): Promise<Receipt | null> => {
    const receipt = await processTransaction(cart, paymentMethod, discount);
    if (receipt) {
      clearCart();
    }
    return receipt;
  };

  const addManualReceipt = async (receipt: Receipt): Promise<void> => {
    if (!user) return;

    try {
      // Generate counter-based manual invoice number
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const dateStr = `${day}${month}${year}`;
      
      // Get current count of manual receipts for today to create counter
      const { data: existingReceipts, error: countError } = await supabase
        .from('receipts')
        .select('invoice_number')
        .eq('user_id', user.id)
        .like('invoice_number', 'MNL-%')
        .gte('created_at', new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())
        .lt('created_at', new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString());

      if (countError) throw countError;

      const counter = (existingReceipts?.length || 0) + 1;
      const invoiceNumber = `MNL-${counter}${dateStr}`;

      // Create manual receipt with generated invoice number
      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          invoice_number: invoiceNumber,
          user_id: user.id,
          subtotal: receipt.subtotal,
          discount: receipt.discount,
          total: receipt.total,
          profit: receipt.profit,
          payment_method: receipt.paymentMethod,
          created_at: receipt.timestamp.toISOString()
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

      // Save receipt items
      const receiptItems = receipt.items.map(item => ({
        receipt_id: receiptData.id,
        product_id: (item.product.id === 'manual' || item.product.isPhotocopy) ? null : item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.finalPrice || item.product.sellPrice,
        cost_price: item.product.costPrice,
        total_price: (item.finalPrice || item.product.sellPrice) * item.quantity,
        profit: ((item.finalPrice || item.product.sellPrice) - item.product.costPrice) * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('receipt_items')
        .insert(receiptItems);

      if (itemsError) throw itemsError;

      // Immediately update local state for instant UI update
      const newReceipt: Receipt = {
        id: receiptData.id,
        items: receipt.items,
        subtotal: receipt.subtotal,
        discount: receipt.discount,
        total: receipt.total,
        profit: receipt.profit,
        timestamp: new Date(receiptData.created_at),
        paymentMethod: receipt.paymentMethod,
        isManual: true
      };
      
      setReceipts(prev => [newReceipt, ...prev]);
      
      toast.success(`Nota manual ${invoiceNumber} berhasil disimpan ke database`);
    } catch (error) {
      console.error('Error saving manual receipt:', error);
      toast.error('Gagal menyimpan nota manual ke database');
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return {
    products,
    cart,
    receipts,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    processTransaction: processTransactionWrapper,
    addManualReceipt,
    formatPrice,
  };
};
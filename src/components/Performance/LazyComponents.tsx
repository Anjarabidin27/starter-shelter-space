import { lazy } from 'react';

// Lazy load heavy components to improve initial load time
export const LazyProductGrid = lazy(() => import('../POS/ProductGrid').then(module => ({ default: module.ProductGrid })));
export const LazyShoppingCart = lazy(() => import('../POS/ShoppingCart').then(module => ({ default: module.ShoppingCart })));
export const LazyReceipt = lazy(() => import('../POS/Receipt').then(module => ({ default: module.Receipt })));
export const LazyAddProductForm = lazy(() => import('../POS/AddProductForm').then(module => ({ default: module.AddProductForm })));
export const LazySalesReport = lazy(() => import('../POS/SalesReport').then(module => ({ default: module.SalesReport })));
export const LazyStockManagement = lazy(() => import('../POS/StockManagement').then(module => ({ default: module.StockManagement })));
export const LazyReceiptHistory = lazy(() => import('../POS/ReceiptHistory').then(module => ({ default: module.ReceiptHistory })));
export const LazyQuickInvoice = lazy(() => import('../POS/QuickInvoice').then(module => ({ default: module.QuickInvoice })));
export const LazyShoppingList = lazy(() => import('../POS/ShoppingList').then(module => ({ default: module.ShoppingList })));
export const LazyBluetoothManager = lazy(() => import('../POS/BluetoothManager').then(module => ({ default: module.BluetoothManager })));

// Loading fallback component
export const ComponentLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);
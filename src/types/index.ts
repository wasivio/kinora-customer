export interface ProductImage {
  id?: string;
  url: string;
  publicId?: string;
  isPrimary?: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: string[];
  price?: number;
  stock?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryId?: string;
  subcategory?: string;
  price: number;
  discount?: number; // Discount percentage or flat amount
  stock: number;
  SKU: string;
  images: ProductImage[];
  variants?: ProductVariant[];
  status: 'active' | 'draft' | 'out_of_stock';
  featured?: boolean;
  brand?: string;
  material?: string;
  tags?: string[];
  specifications?: Record<string, string> | Array<{ key: string; value: string }>;
  deliveryCharge?: number;
  shippingFee?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  subcategories?: string[];
  productCount?: number;
  status?: 'active' | 'inactive';
  createdAt?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  publicId?: string;
  linkUrl?: string;
  position: 'hero' | 'top_strip' | 'sidebar' | 'promotional';
  status: 'active' | 'inactive';
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  startDate?: string;
  expiryDate?: string;
  usageLimit?: number;
  usageCount?: number;
  status: 'active' | 'expired' | 'disabled';
  createdAt?: string;
}

export interface StoreSettings {
  storeName: string;
  storeEmail?: string;
  storePhone?: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  shippingFee: number;
  freeShippingThreshold: number;
  address?: string;
  maintenanceMode?: boolean;
  supportEmail?: string;
}

export interface CartItem {
  id: string; // Unique combination of productId and selected variants
  productId: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  quantity: number;
  selectedVariants?: Record<string, string>;
  maxStock: number;
  sku?: string;
  deliveryCharge?: number;
  shippingFee?: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
  sku?: string;
}

export interface OrderAddress {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'RAZORPAY' | 'COD' | string;
  shippingAddress: OrderAddress;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phone?: string;
  addresses?: OrderAddress[];
  createdAt?: string;
}

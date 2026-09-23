import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Category, Banner, Coupon, StoreSettings } from '../types';

const defaultSettings: StoreSettings = {
  storeName: 'KINORA',
  storeEmail: 'contact@kinora.com',
  storePhone: '+91 8810519646',
  currency: 'INR',
  currencySymbol: '₹',
  taxRate: 0,
  shippingFee: 0,
  freeShippingThreshold: 0,
  address: 'Mumbai, India',
  maintenanceMode: false,
};

interface StoreContextType {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  coupons: Coupon[];
  settings: StoreSettings;
  isLoading: boolean;
  error: string | null;
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (categorySlugOrName: string) => Product[];
  featuredProducts: Product[];
  trendingProducts: Product[];
  newArrivals: Product[];
  heroBanners: Banner[];
  getCouponByCode: (code: string) => Coupon | undefined;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    let unsubProducts: () => void = () => {};
    let unsubCategories: () => void = () => {};
    let unsubBanners: () => void = () => {};
    let unsubCoupons: () => void = () => {};
    let unsubSettings: () => void = () => {};

    try {
      // 1. Subscribe to Products
      const productsQuery = collection(db, 'products');
      unsubProducts = onSnapshot(
        productsQuery,
        (snapshot) => {
          const items: Product[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as Omit<Product, 'id'>;
            // Only include active products (or products with status undefined/active)
            if (!data.status || data.status === 'active' || data.status === 'out_of_stock') {
              items.push({ id: d.id, ...data });
            }
          });
          setProducts(items);
          setIsLoading(false);
        },
        (err) => {
          console.error('Products listener error:', err);
          setError(err.message);
          setIsLoading(false);
        }
      );

      // 2. Subscribe to Categories
      const categoriesQuery = collection(db, 'categories');
      unsubCategories = onSnapshot(
        categoriesQuery,
        (snapshot) => {
          const cats: Category[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as Omit<Category, 'id'>;
            if (!data.status || data.status === 'active') {
              cats.push({ id: d.id, ...data });
            }
          });
          setCategories(cats);
        },
        (err) => console.error('Categories listener error:', err)
      );

      // 3. Subscribe to Banners
      const bannersQuery = collection(db, 'banners');
      unsubBanners = onSnapshot(
        bannersQuery,
        (snapshot) => {
          const bans: Banner[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as Omit<Banner, 'id'>;
            if (!data.status || data.status === 'active') {
              bans.push({ id: d.id, ...data });
            }
          });
          setBanners(bans);
        },
        (err) => console.error('Banners listener error:', err)
      );

      // 4. Subscribe to Coupons
      const couponsQuery = collection(db, 'coupons');
      unsubCoupons = onSnapshot(
        couponsQuery,
        (snapshot) => {
          const coups: Coupon[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as Omit<Coupon, 'id'>;
            if (!data.status || data.status === 'active') {
              coups.push({ id: d.id, ...data });
            }
          });
          setCoupons(coups);
        },
        (err) => console.error('Coupons listener error:', err)
      );

      // 5. Subscribe to Settings
      const settingsDocRef = doc(db, 'settings', 'store');
      unsubSettings = onSnapshot(
        settingsDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setSettings({ ...defaultSettings, ...(snapshot.data() as Partial<StoreSettings>) });
          }
        },
        (err) => console.error('Settings listener error:', err)
      );

    } catch (err: any) {
      console.error('StoreProvider initialization error:', err);
      setError(err?.message || 'Failed to initialize store data');
      setIsLoading(false);
    }

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBanners();
      unsubCoupons();
      unsubSettings();
    };
  }, []);

  const getProductById = (id: string) => {
    return products.find((p) => p.id === id);
  };

  const getProductsByCategory = (categorySlugOrName: string) => {
    const term = categorySlugOrName.toLowerCase();
    return products.filter((p) => {
      const catMatch = p.category?.toLowerCase() === term || p.categoryId?.toLowerCase() === term;
      const subMatch = p.subcategory?.toLowerCase() === term;
      return catMatch || subMatch;
    });
  };

  const featuredProducts = products.filter((p) => p.featured);
  
  // Trending products: featured or first 8 active products
  const trendingProducts = products.slice(0, 8);

  // New arrivals: sorted by createdAt descending
  const newArrivals = [...products].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  }).slice(0, 8);

  const heroBanners = banners.filter(
    (b) => b.position === 'hero' || !b.position
  );

  const getCouponByCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    return coupons.find((c) => c.code.toUpperCase() === clean && c.status === 'active');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        banners,
        coupons,
        settings,
        isLoading,
        error,
        getProductById,
        getProductsByCategory,
        featuredProducts,
        trendingProducts,
        newArrivals,
        heroBanners,
        getCouponByCode,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

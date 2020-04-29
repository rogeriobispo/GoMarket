import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id?: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const STORAGE_KEY = '@GoMarketplace:products';
const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsFromStorage = await AsyncStorage.getItem(STORAGE_KEY);
      if (productsFromStorage)
        await setProducts(JSON.parse(productsFromStorage));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const [existsProduct] = products.filter(
        (prod: Product) => prod.id === product.id,
      );

      if (!existsProduct) {
        const prod = product;
        prod.quantity = 1;
        setProducts(prevState => {
          return [...prevState, prod];
        });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        return;
      }

      existsProduct.quantity = Number(existsProduct.quantity) + 1;
      const productsLeft = products.filter(prod => prod.id !== product.id);
      setProducts([...productsLeft, existsProduct]);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const prods = products.map(product => {
        const prod = product;
        if (prod.id === id) {
          prod.quantity += 1;
        }
        return prod;
      });

      setProducts(prods);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const prods = products.map(product => {
        const prod = product;
        if (prod.id === id && prod.quantity > 0) {
          prod.quantity -= 1;
        }
        return prod;
      });

      setProducts(prods);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };

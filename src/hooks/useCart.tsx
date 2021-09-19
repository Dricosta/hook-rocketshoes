import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO

      const verifyProductExistCart: Product | any = cart.find(
        (product: Product) => product.id === productId
      );

      const productStock: Stock = await api
        .get(`stock/${productId}`)
        .then((response) => response.data);

      if (verifyProductExistCart?.amount >= productStock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (verifyProductExistCart) {
        const productsFormattedAmount = cart.map((product: Product) =>
          product.id === productId
            ? { ...product, amount: product.amount ? product.amount + 1 : 1 }
            : product
        );

        setCart(productsFormattedAmount);

        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(productsFormattedAmount)
        );

        return;
      }

      // Adiciona o produto no carrinho quando nunca foi adicionado
      const dataProduct = await api
        .get(`products/${productId}`)
        .then((response) => response.data);

      setCart([...cart, { ...dataProduct, amount: 1 }]);

      localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify([...cart, { ...dataProduct, amount: 1 }])
      );
    } catch {
      // TODO
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const productExists = cart.find((product) => product.id === productId);

      if (!productExists) {
        toast.error("Erro na remoção do produto");
        return;
      }

      const productDeleted = cart.filter(
        (product: Product) => product.id !== productId
      );

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(productDeleted));

      setCart(productDeleted);
    } catch {
      // TODO
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount <= 0) return;

      const stockProduct: Stock = await api
        .get(`stock/${productId}`)
        .then((response) => response.data);

      if (amount > stockProduct.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const cartUpdated = [...cart];

      const productExist = cartUpdated.find(
        (product) => product.id === productId
      );

      if (productExist) {
        productExist.amount =
          amount > stockProduct.amount ? stockProduct.amount : amount;

        setCart(cartUpdated);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartUpdated));
      } else {
        throw Error();
      }
    } catch {
      // TODO
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

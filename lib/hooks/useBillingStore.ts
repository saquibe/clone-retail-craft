// lib/hooks/useBillingStore.ts
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Customer } from "@/lib/api/customers";
import { Product } from "@/lib/api/products";
import {
  createBilling,
  addProductToBilling,
  removeProductFromBilling,
  updateProductQuantity,
  completeBilling,
  deleteBilling,
  getBillingById,
} from "@/lib/api/billing";
import toast from "react-hot-toast";

interface BillingItem extends Product {
  cartQuantity: number;
}

interface BillingSession {
  selectedCustomer: Customer | null;
  cart: BillingItem[];
  discountPercentage: number;
  paymentMethod: "cash" | "card" | "upi";
  paidAmount: number;
  billingId?: string;
  invoiceDate?: string;
  lastUpdated: string;
}

const BILLING_SESSION_KEY = "current_billing_session";

export const useBillingStore = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [cart, setCart] = useState<BillingItem[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">(
    "cash",
  );
  const [paidAmount, setPaidAmount] = useState(0);
  const [billingId, setBillingId] = useState<string | undefined>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );

  const [updatingProductId, setUpdatingProductId] = useState<string | null>(
    null,
  );
  const [addingProduct, setAddingProduct] = useState(false);

  // Use ref to track if we're currently creating a billing
  const isCreatingRef = useRef(false);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(BILLING_SESSION_KEY);
    if (savedSession) {
      try {
        const session: BillingSession = JSON.parse(savedSession);
        setSelectedCustomer(session.selectedCustomer);
        setCart(session.cart || []);
        setDiscountPercentage(session.discountPercentage || 0);
        setPaymentMethod(session.paymentMethod || "cash");
        setPaidAmount(session.paidAmount || 0);
        setBillingId(session.billingId);
        setInvoiceDate(session.invoiceDate || format(new Date(), "yyyy-MM-dd"));
      } catch (error) {
        console.error("Error loading billing session:", error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!isLoaded) return;

    const session: BillingSession = {
      selectedCustomer,
      cart,
      discountPercentage,
      paymentMethod,
      paidAmount,
      billingId,
      invoiceDate,
      lastUpdated: new Date().toISOString(),
    };

    if (selectedCustomer || cart.length > 0) {
      localStorage.setItem(BILLING_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(BILLING_SESSION_KEY);
    }
  }, [
    selectedCustomer,
    cart,
    discountPercentage,
    paymentMethod,
    paidAmount,
    billingId,
    invoiceDate,
    isLoaded,
  ]);

  // Create billing draft when customer is selected
  useEffect(() => {
    const createDraftBilling = async () => {
      // Prevent multiple concurrent creations
      if (isCreatingRef.current) return;

      if (selectedCustomer && !billingId && !isLoading) {
        isCreatingRef.current = true;
        setIsLoading(true);
        try {
          const response = await createBilling(
            selectedCustomer._id,
            invoiceDate,
          );
          if (response.success && response.data) {
            setBillingId(response.data._id);
            toast.success("Billing session created");
          }
        } catch (error: any) {
          console.error("Error creating billing draft:", error);
          toast.error(
            error.response?.data?.message || "Failed to create billing",
          );
        } finally {
          setIsLoading(false);
          isCreatingRef.current = false;
        }
      }
    };

    createDraftBilling();
  }, [selectedCustomer, billingId, isLoading, invoiceDate]);

  // Update invoice date on existing draft if it changes
  useEffect(() => {
    const updateDraftInvoiceDate = async () => {
      if (!billingId || isCreatingRef.current || isLoading) return;
      if (!selectedCustomer) return;

      try {
        // Get current billing to check if date is different
        const response = await getBillingById(billingId);
        if (response.success && response.data) {
          const currentDate = response.data.invoiceDate
            ? format(new Date(response.data.invoiceDate), "yyyy-MM-dd")
            : null;

          // If the date in the database is different from our selected date
          if (currentDate !== invoiceDate) {
            if (cart.length === 0) {
              // Only recreate if cart is empty to avoid losing items
              try {
                await deleteBilling(billingId);
                setBillingId(undefined);
                // The effect above will create a new one with the updated date
              } catch (error) {
                console.error("Error updating invoice date:", error);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking invoice date:", error);
      }
    };

    updateDraftInvoiceDate();
  }, [invoiceDate, billingId, isLoading, selectedCustomer, cart.length]);

  // Clear session
  const clearSession = async () => {
    if (billingId) {
      try {
        await deleteBilling(billingId);
      } catch (error) {
        console.error("Error deleting billing:", error);
      }
    }

    setSelectedCustomer(null);
    setCart([]);
    setDiscountPercentage(0);
    setPaymentMethod("cash");
    setPaidAmount(0);
    setBillingId(undefined);
    setInvoiceDate(format(new Date(), "yyyy-MM-dd"));
    localStorage.removeItem(BILLING_SESSION_KEY);
  };

  // Update customer
  const updateCustomer = async (customer: Customer | null) => {
    if (billingId) {
      try {
        await deleteBilling(billingId);
      } catch (error) {
        console.error("Error deleting previous billing:", error);
      }
    }

    setSelectedCustomer(customer);
    setBillingId(undefined);
    if (!customer) {
      setCart([]);
    }
  };

  // Add to cart
  const addToCart = async (
    product: Product,
    selectedProductId?: string,
  ): Promise<boolean> => {
    if (!billingId) {
      toast.error("Billing session not initialized");
      return false;
    }

    if (addingProduct) {
      return false;
    }

    setAddingProduct(true);

    try {
      const response = await addProductToBilling(
        billingId,
        product.barCode,
        1,
        selectedProductId,
      );

      if (response.multiple && response.data && Array.isArray(response.data)) {
        throw { response, multiple: true };
      }

      if (response.success && response.data) {
        setCart((prev) => {
          const existing = prev.find((item) => item._id === product._id);

          if (existing) {
            return prev.map((item) =>
              item._id === product._id
                ? { ...item, cartQuantity: (existing.cartQuantity || 0) + 1 }
                : item,
            );
          }

          return [...prev, { ...product, cartQuantity: 1 }];
        });

        toast.success(`${product.productName} added to cart`);
        return true;
      }

      return false;
    } catch (error: any) {
      if (error.multiple && error.response) {
        throw error.response;
      }
      toast.error(error.response?.data?.message || "Failed to add product");
      return false;
    } finally {
      setAddingProduct(false);
    }
  };

  // Update quantity
  const updateQuantity = async (productId: string, quantity: number) => {
    if (!billingId) return;
    if (updatingProductId === productId) return;

    const product = cart.find((item) => item._id === productId);
    if (!product) return;

    if (quantity < 1) {
      await removeFromCart(productId);
      return;
    }

    if (quantity > product.quantity) {
      toast.error(`Only ${product.quantity} units available in stock`);
      return;
    }

    setUpdatingProductId(productId);

    try {
      const response = await updateProductQuantity(
        billingId,
        productId,
        quantity,
      );

      if (response.success) {
        setCart((prev) =>
          prev.map((item) =>
            item._id === productId ? { ...item, cartQuantity: quantity } : item,
          ),
        );
      }
    } catch (error: any) {
      console.error("Error updating quantity:", error);
      toast.error(error.response?.data?.message || "Failed to update quantity");
    } finally {
      setUpdatingProductId(null);
    }
  };

  // Remove from cart
  const removeFromCart = async (productId: string) => {
    if (!billingId) {
      toast.error("No active billing session");
      return;
    }

    if (updatingProductId === productId) return;

    setUpdatingProductId(productId);

    try {
      const response = await removeProductFromBilling(billingId, productId);

      if (response.success) {
        setCart((prev) => prev.filter((item) => item._id !== productId));
        toast.success("Item removed from cart");
      }
    } catch (error: any) {
      console.error("Error removing item:", error);
      toast.error(error.response?.data?.message || "Failed to remove item");
    } finally {
      setUpdatingProductId(null);
    }
  };

  const deleteBillingDraft = async (billingIdToDelete: string) => {
    try {
      const response = await deleteBilling(billingIdToDelete);
      if (response.success) {
        toast.success(response.message || "Billing deleted successfully");
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error deleting billing:", error);
      toast.error(error.response?.data?.message || "Failed to delete billing");
      return false;
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!billingId || cart.length === 0) return;

    for (const item of cart) {
      try {
        await removeProductFromBilling(billingId, item._id);
      } catch (error) {
        console.error("Error removing item:", error);
      }
    }

    setCart([]);
    toast.success("Cart cleared");
  };

  // Generate invoice (complete billing)
  const generateInvoice = async (
    paymentMode: string,
    discountAmount: number = 0,
    freightCharge: number = 0,
    remarks?: string,
    invoiceType: "J1" | "J2" = "J1",
    invoiceDateValue?: string,
  ): Promise<string | null> => {
    if (!billingId) {
      toast.error("No active billing session");
      return null;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return null;
    }

    if (!paymentMode) {
      toast.error("Please select payment mode");
      return null;
    }

    if (!invoiceType) {
      toast.error("Please select invoice type");
      return null;
    }

    if (paymentMode === "Pay Later" && (!remarks || remarks.trim() === "")) {
      toast.error("Please enter remarks for Pay Later payment");
      return null;
    }

    setIsLoading(true);
    try {
      const response = await completeBilling(
        billingId,
        paymentMode,
        discountPercentage,
        freightCharge,
        remarks,
        invoiceType,
        invoiceDateValue || invoiceDate,
      );

      if (response.success) {
        toast.success(response.message || "Invoice generated successfully");
        setSelectedCustomer(null);
        setCart([]);
        setDiscountPercentage(0);
        setPaymentMethod("cash");
        setPaidAmount(0);
        setBillingId(undefined);
        setInvoiceDate(format(new Date(), "yyyy-MM-dd"));
        localStorage.removeItem(BILLING_SESSION_KEY);

        return billingId;
      }
      return null;
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      toast.error(
        error.response?.data?.message || "Failed to generate invoice",
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    selectedCustomer,
    cart,
    discountPercentage,
    paymentMethod,
    paidAmount,
    billingId,
    isLoaded,
    isLoading,
    updatingProductId,
    addingProduct,
    invoiceDate,
    setSelectedCustomer: updateCustomer,
    setDiscountPercentage,
    setPaymentMethod,
    setPaidAmount,
    setInvoiceDate,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    clearSession,
    generateInvoice,
    deleteBillingDraft,
  };
};

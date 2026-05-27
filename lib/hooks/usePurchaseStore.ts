import { useState, useEffect, useCallback } from "react";
import { Supplier } from "@/lib/api/suppliers";
import {
  createPurchase,
  addProductToPurchase,
  removeProductFromPurchase,
  updatePurchaseQuantity,
  completePurchase,
  deletePurchase,
  PurchaseInvoice,
  PurchaseItem,
} from "@/lib/api/purchases";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface PurchaseSession {
  selectedSupplier: Supplier | null;
  items: PurchaseItem[];
  invoiceNumber: string;
  invoiceDate: string;
  placeOfSupply: string;
  reverseCharge: string;
  discount: number;
  freightCharge: number;
  purchaseId?: string;
  referenceInvoiceNumber?: string;
  lastUpdated: string;
}

const PURCHASE_SESSION_KEY = "current_purchase_session";

export const usePurchaseStore = () => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [placeOfSupply, setPlaceOfSupply] = useState("Karnataka");
  const [reverseCharge, setReverseCharge] = useState("No");
  const [purchaseId, setPurchaseId] = useState<string | undefined>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseData, setPurchaseData] = useState<PurchaseInvoice | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [freightCharge, setFreightCharge] = useState(0);
  const [referenceInvoiceNumber, setReferenceInvoiceNumber] = useState("");
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(
    null,
  );
  const [updatingAction, setUpdatingAction] = useState<
    "increment" | "decrement" | "remove" | null
  >(null);
  const [discountPercentage, setDiscountPercentage] = useState(0);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(PURCHASE_SESSION_KEY);
    if (savedSession) {
      try {
        const session: PurchaseSession = JSON.parse(savedSession);
        setSelectedSupplier(session.selectedSupplier);
        setItems(session.items || []);
        setInvoiceNumber(session.invoiceNumber || "");
        setInvoiceDate(session.invoiceDate || format(new Date(), "yyyy-MM-dd"));
        setPlaceOfSupply(session.placeOfSupply || "");
        setReverseCharge(session.reverseCharge || "No");
        setDiscount(session.discount || 0);
        setFreightCharge(session.freightCharge || 0);
        setPurchaseId(session.purchaseId);
        setReferenceInvoiceNumber(session.referenceInvoiceNumber || "");
      } catch (error) {
        console.error("🔴 [STORE] Error loading purchase session:", error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!isLoaded) return;

    const session: PurchaseSession = {
      selectedSupplier,
      items: items || [],
      invoiceNumber,
      invoiceDate,
      placeOfSupply,
      reverseCharge,
      discount,
      freightCharge,
      purchaseId,
      referenceInvoiceNumber,
      lastUpdated: new Date().toISOString(),
    };

    if (
      selectedSupplier ||
      (items && items.length > 0) ||
      invoiceNumber ||
      invoiceDate ||
      placeOfSupply ||
      discount > 0 ||
      freightCharge > 0
    ) {
      localStorage.setItem(PURCHASE_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(PURCHASE_SESSION_KEY);
    }
  }, [
    selectedSupplier,
    items,
    invoiceNumber,
    invoiceDate,
    placeOfSupply,
    reverseCharge,
    discount,
    freightCharge,
    purchaseId,
    referenceInvoiceNumber,
    isLoaded,
  ]);

  // Create purchase ONLY when ALL required fields are filled
  // useEffect(() => {
  //   const createPurchaseWhenReady = async () => {
  //     const hasAllFields =
  //       selectedSupplier &&
  //       invoiceNumber &&
  //       invoiceNumber.trim() !== "" &&
  //       invoiceDate &&
  //       placeOfSupply &&
  //       placeOfSupply.trim() !== "" &&
  //       reverseCharge;

  //     if (hasAllFields && !purchaseId && !isCreating && !isLoading) {
  //       setIsCreating(true);
  //       setIsLoading(true);

  //       try {
  //         const response = await createPurchase({
  //           supplierId: selectedSupplier._id,
  //           invoiceNumber: invoiceNumber,
  //           invoiceDate: invoiceDate,
  //           placeOfSupply: placeOfSupply,
  //           reverseCharge: reverseCharge,
  //         });

  //         if (response.success && response.data) {
  //           setPurchaseId(response.data._id);
  //           setPurchaseData(response.data);
  //           toast.success("Purchase session created");
  //         } else {
  //           toast.error(response.message || "Failed to create purchase");
  //         }
  //       } catch (error: any) {
  //         console.error("🔴 [STORE] Error creating purchase:", error);
  //         if (
  //           error.response?.status === 400 &&
  //           error.response?.data?.message?.includes(
  //             "Invoice number already exists",
  //           )
  //         ) {
  //           toast.error(
  //             `Invoice number "${invoiceNumber}" already exists. Please use a different invoice number.`,
  //           );
  //           setInvoiceNumber("");
  //         } else {
  //           toast.error(
  //             error.response?.data?.message ||
  //               "Failed to create purchase session",
  //           );
  //         }
  //       } finally {
  //         setIsCreating(false);
  //         setIsLoading(false);
  //       }
  //     }
  //   };

  //   createPurchaseWhenReady();
  // }, [
  //   selectedSupplier,
  //   invoiceNumber,
  //   invoiceDate,
  //   placeOfSupply,
  //   reverseCharge,
  //   purchaseId,
  //   isCreating,
  //   isLoading,
  // ]);

  // Add this function to usePurchaseStore
  const createPurchaseSession = useCallback(async () => {
    // Validate all fields
    if (!selectedSupplier) {
      toast.error("Please select a supplier");
      return false;
    }

    if (!invoiceNumber || invoiceNumber.trim() === "") {
      toast.error("Please enter invoice number");
      return false;
    }

    if (!invoiceDate) {
      toast.error("Please select invoice date");
      return false;
    }

    if (!placeOfSupply || placeOfSupply.trim() === "") {
      toast.error("Please enter place of supply");
      return false;
    }

    if (!reverseCharge) {
      toast.error("Please select reverse charge");
      return false;
    }

    // Check if already has purchaseId
    if (purchaseId) {
      toast("Purchase session already created");
      return true;
    }

    setIsCreating(true);
    setIsLoading(true);

    try {
      const response = await createPurchase({
        supplierId: selectedSupplier._id,
        invoiceNumber: invoiceNumber,
        invoiceDate: invoiceDate,
        placeOfSupply: placeOfSupply,
        reverseCharge: reverseCharge,
      });

      if (response.success && response.data) {
        setPurchaseId(response.data._id);
        setReferenceInvoiceNumber(response.data.referenceInvoiceNumber || "");
        setPurchaseData(response.data);
        // toast.success("Purchase session created");
        return true;
      } else {
        toast.error(response.message || "Failed to create purchase");
        return false;
      }
    } catch (error: any) {
      console.error("🔴 [STORE] Error creating purchase:", error);
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("Invoice number already exists")
      ) {
        toast.error(
          `Invoice number "${invoiceNumber}" already exists. Please use a different invoice number.`,
        );
        setInvoiceNumber("");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to create purchase session",
        );
      }
      return false;
    } finally {
      setIsCreating(false);
      setIsLoading(false);
    }
  }, [
    selectedSupplier,
    invoiceNumber,
    invoiceDate,
    placeOfSupply,
    reverseCharge,
    purchaseId,
  ]);

  // Clear session - ALWAYS delete the draft from database
  const clearSession = useCallback(async () => {
    if (purchaseId) {
      try {
        const response = await deletePurchase(purchaseId);
        if (response.success) {
          toast.success("Draft deleted successfully");
        }
      } catch (error: any) {
        console.error("🔴 [STORE] Error deleting purchase:", error);
        if (error.response?.status !== 404) {
          console.error("Delete error details:", error.response?.data);
          toast.error("Failed to delete draft");
        }
      }
    }

    // Reset all state
    setSelectedSupplier(null);
    setItems([]);
    setInvoiceNumber("");
    setInvoiceDate(format(new Date(), "yyyy-MM-dd"));
    setPlaceOfSupply("Karnataka");
    setReverseCharge("No");
    setDiscount(0);
    setFreightCharge(0);
    setPurchaseId(undefined);
    setReferenceInvoiceNumber("");
    setPurchaseData(null);
    setIsCreating(false);
    setIsLoading(false);
    localStorage.removeItem(PURCHASE_SESSION_KEY);

    toast.success("New purchase session started");
  }, [purchaseId]);

  // Update supplier
  const updateSupplier = useCallback(
    async (supplier: Supplier | null) => {
      if (purchaseId && items && items.length === 0) {
        try {
          await deletePurchase(purchaseId);
        } catch (error) {
          console.error("🔴 [STORE] Error deleting previous purchase:", error);
        }
      }

      setSelectedSupplier(supplier);
      setPurchaseId(undefined);
      setPurchaseData(null);
      if (!supplier) {
        setItems([]);
        setInvoiceNumber("");
        setInvoiceDate(format(new Date(), "yyyy-MM-dd"));
        setPlaceOfSupply("");
        setReverseCharge("No");
        setDiscount(0);
        setFreightCharge(0);
      }
    },
    [purchaseId, items],
  );

  // Scan barcode to add product
  const scanBarcode = useCallback(
    async (barcode: string, quantity: number = 1, productId?: string) => {
      if (!purchaseId) {
        toast.error("Please complete all supplier details first");
        return false;
      }

      if (!barcode.trim()) {
        toast.error("Please enter barcode");
        return false;
      }

      setIsLoading(true);
      try {
        const response = await addProductToPurchase({
          purchaseId: purchaseId!,
          barCode: barcode,
          quantity,
          productId,
        });

        if (productId) {
          if (response.success && response.data) {
            setItems(response.data.items);
            setPurchaseData(response.data);
            setIsLoading(false);
            return true;
          }
          setIsLoading(false);
          return false;
        }

        if (response.multiple) {
          setIsLoading(false);
          return response;
        }

        // Single product added successfully
        if (response.success && response.data) {
          setItems(response.data.items);
          setPurchaseData(response.data);
          setIsLoading(false);
          return true;
        }

        setIsLoading(false);
        return false;
      } catch (error: any) {
        console.error("🔴 [STORE] Error adding product:", error);

        if (error.response?.data?.multiple) {
          setIsLoading(false);
          return error.response.data;
        }

        toast.error(error.response?.data?.message || "Failed to add product");
        setIsLoading(false);
        return false;
      }
    },
    [purchaseId],
  );

  const updateQuantity = useCallback(
    async (
      productId: string,
      newQuantity: number,
      action: "increment" | "decrement",
    ) => {
      if (!purchaseId) {
        toast.error("No active purchase session");
        return false;
      }

      if (updatingProductId === productId) {
        return false; // Prevent concurrent updates
      }

      if (newQuantity < 1) {
        return await removeProduct(productId);
      }

      setUpdatingProductId(productId);
      setUpdatingAction(action);

      try {
        const response = await updatePurchaseQuantity({
          purchaseId,
          productId,
          quantity: newQuantity,
        });

        if (response.success && response.data) {
          setItems(response.data.items);
          setPurchaseData(response.data);
          return true;
        }
        return false;
      } catch (error: any) {
        console.error("Error updating quantity:", error);
        toast.error(
          error.response?.data?.message || "Failed to update quantity",
        );
        return false;
      } finally {
        setUpdatingProductId(null);
        setUpdatingAction(null);
      }
    },
    [purchaseId, updatingProductId],
  );

  // Remove product with loading prevention
  const removeProduct = useCallback(
    async (productId: string) => {
      if (!purchaseId) {
        toast.error("No active purchase session");
        return false;
      }

      if (updatingProductId === productId) {
        return false; // Prevent concurrent updates
      }

      setUpdatingProductId(productId);
      setUpdatingAction("remove");

      try {
        const response = await removeProductFromPurchase({
          purchaseId,
          productId,
        });

        if (response.success && response.data) {
          setItems(response.data.items);
          setPurchaseData(response.data);
          toast.success("Product removed from purchase");
          return true;
        }
        return false;
      } catch (error: any) {
        console.error("Error removing product:", error);
        toast.error(
          error.response?.data?.message || "Failed to remove product",
        );
        return false;
      } finally {
        setUpdatingProductId(null);
        setUpdatingAction(null);
      }
    },
    [purchaseId, updatingProductId],
  );

  // Complete purchase with payment details
  // Complete purchase with payment details
  const completePurchaseInvoice = useCallback(
    async (
      discountPercentage: number = 0,
      freightChargeValue: number = 0,
      paymentMode: string = "Cash",
      remarks?: string,
    ): Promise<boolean> => {
      if (!purchaseId) {
        toast.error("No active purchase session");
        return false;
      }

      if (!items || items.length === 0) {
        toast.error("No items in purchase invoice");
        return false;
      }
      if (!invoiceNumber || !invoiceNumber.trim()) {
        toast.error("Please enter invoice number");
        return false;
      }

      if (!placeOfSupply || !placeOfSupply.trim()) {
        toast.error("Please enter place of supply");
        return false;
      }

      if (!invoiceDate) {
        toast.error("Please select invoice date");
        return false;
      }

      if (!paymentMode) {
        toast.error("Please select payment mode");
        return false;
      }

      if (paymentMode === "Pay Later" && (!remarks || !remarks.trim())) {
        toast.error("Remarks is required for Pay Later payment");
        return false;
      }

      setIsLoading(true);
      try {
        const response = await completePurchase(
          purchaseId,
          discountPercentage,
          freightChargeValue,
          paymentMode,
          remarks,
        );
        if (response.success) {
          toast.success("Purchase invoice completed successfully");

          // Clear session after completion
          setSelectedSupplier(null);
          setItems([]);
          setInvoiceNumber("");
          setInvoiceDate(format(new Date(), "yyyy-MM-dd"));
          setPlaceOfSupply("Telangana");
          setDiscountPercentage(0);
          setFreightCharge(0);
          setPurchaseId(undefined);
          setPurchaseData(null);
          localStorage.removeItem(PURCHASE_SESSION_KEY);

          return true;
        }
        return false;
      } catch (error: any) {
        console.error("🔴 [STORE] Error completing purchase:", error);
        toast.error(
          error.response?.data?.message || "Failed to complete purchase",
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [purchaseId, items, invoiceNumber, invoiceDate, placeOfSupply],
  );

  // Calculate totals with discount
  const calculateFinalTotal = () => {
    const baseTotal =
      items?.reduce(
        (sum, item) => sum + item.purchasePrice * item.quantity,
        0,
      ) || 0;

    const totalTax = items?.reduce((sum, item) => sum + item.taxAmount, 0) || 0;

    const discountAmountCalculated = (baseTotal * discountPercentage) / 100;
    const afterDiscount = baseTotal - discountAmountCalculated;
    const finalTotal = afterDiscount + totalTax + freightCharge;
    const roundedFinalTotal = Math.round(finalTotal);
    const roundOffAmount = roundedFinalTotal - finalTotal;

    return {
      subTotal: baseTotal,
      totalTax,
      grandTotal: baseTotal + totalTax,
      discountAmount: discountAmountCalculated,
      afterDiscount,
      finalTotal,
      roundedFinalTotal,
      roundOffAmount,
    };
  };

  const totals = calculateFinalTotal();

  return {
    selectedSupplier,
    items: items || [],
    invoiceNumber,
    invoiceDate,
    placeOfSupply,
    reverseCharge,
    discount: discountPercentage,
    freightCharge,
    purchaseId,
    referenceInvoiceNumber,
    isLoaded,
    isLoading,
    purchaseData,
    totals,
    isCreating,
    updatingProductId,
    updatingAction,
    setSelectedSupplier: updateSupplier,
    setInvoiceNumber,
    setInvoiceDate,
    setPlaceOfSupply,
    setReverseCharge,
    setDiscount: setDiscountPercentage,
    setFreightCharge,
    scanBarcode,
    updateQuantity,
    removeProduct,
    completePurchaseInvoice,
    clearSession,
    createPurchaseSession,
  };
};

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { format } from "date-fns";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  Package,
  Loader2,
  X,
  Check,
  AlertCircle,
  User,
  Building2,
  Lock,
  RefreshCw,
  Calendar, // Add this
} from "lucide-react";
import toast from "react-hot-toast";
import { getProducts, Product, searchProducts } from "@/lib/api/products";
import {
  getCustomers,
  createCustomer,
  Customer,
  CustomerFormData,
} from "@/lib/api/customers";
import CustomerForm from "@/components/forms/CustomerForm";
import { useBillingStore } from "@/lib/hooks/useBillingStore";
import {
  addProductToBilling,
  completeBilling,
  getBillingById,
} from "@/lib/api/billing";
import BillingPageSkeleton from "@/components/skeletons/BillingPageSkeleton";
import { A4Invoice } from "@/components/billing/A4Invoice";

interface BillingItem extends Product {
  cartQuantity: number;
}

export default function BillingPage() {
  const { user } = useAuth();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const {
    selectedCustomer,
    cart,
    discountPercentage,
    paidAmount,
    isLoaded,
    billingId,
    updatingProductId,
    addingProduct,
    invoiceDate, // Add this
    setSelectedCustomer,
    setDiscountPercentage,
    setInvoiceDate, // Add this
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    clearSession,
    generateInvoice,
  } = useBillingStore();

  // Local state (non-persistent)
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [billingData, setBillingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState<string>("");
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [multipleProducts, setMultipleProducts] = useState<any[]>([]);
  const [showProductSelectionDialog, setShowProductSelectionDialog] =
    useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState("");
  const [freightCharge, setFreightCharge] = useState(0);
  const [payLaterRemarks, setPayLaterRemarks] = useState("");
  const [showRemarksInput, setShowRemarksInput] = useState(false);
  const [isAddingFromEnter, setIsAddingFromEnter] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [invoiceType, setInvoiceType] = useState<"J1" | "J2">("J1");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  // Focus barcode input when customer is selected
  useEffect(() => {
    if (selectedCustomer && isLoaded) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [selectedCustomer, isLoaded]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadProducts = async () => {
    try {
      const response = await getProducts("All");
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products");
    }
  };

  const loadCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const response = await getCustomers();
      if (response.success && response.data) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer) => {
    if (!customerSearch.trim()) return false;

    const searchLower = customerSearch.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.mobile?.includes(customerSearch) ||
      (customer.customerType === "B2B" &&
        (customer.companyName?.toLowerCase().includes(searchLower) ||
          customer.gstIn?.toLowerCase().includes(searchLower) ||
          customer.contactName?.toLowerCase().includes(searchLower)))
    );
  });

  // Get customer type badge color
  const getTypeBadge = (type: string) => {
    return type === "B2B"
      ? "bg-purple-100 text-purple-800"
      : "bg-green-100 text-green-800";
  };

  // Handle customer selection
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch("");
    setShowCustomerResults(false);
  };

  // Add product from selection dialog
  const handleAddSelectedProduct = async (product: any) => {
    if (!selectedCustomer) {
      toast.error("Please select a customer first");
      return;
    }

    if (!billingId) {
      toast.error("Billing session not initialized");
      return;
    }

    setLoading(true);

    try {
      const fullProduct = products.find((p) => p._id === product._id);
      if (fullProduct) {
        const success = await addToCart(fullProduct, product._id);
        if (success) {
          setShowProductSelectionDialog(false);
          setMultipleProducts([]);
          setProductSearch("");

          setTimeout(() => {
            barcodeInputRef.current?.focus();
          }, 100);
        }
      }
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast.error(error?.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  // Handle barcode scan when Enter key is pressed
  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    e.preventDefault();

    if (!selectedCustomer) {
      toast.error("Please select a customer first");
      return;
    }

    if (!billingId) {
      toast.error("Billing session not initialized");
      return;
    }

    const cleanInput = productSearch.trim();

    if (!cleanInput) return;

    if (isAddingFromEnter) return;

    setIsAddingFromEnter(true);
    setLoading(true);

    try {
      const searchResponse = await searchProducts(cleanInput);

      if (
        !searchResponse.success ||
        !searchResponse.data ||
        searchResponse.data.length === 0
      ) {
        toast.error("Product not found");
        setProductSearch("");
        setTimeout(() => {
          barcodeInputRef.current?.focus();
        }, 100);
        return;
      }

      const foundProducts = searchResponse.data;

      if (foundProducts.length > 1) {
        setMultipleProducts(foundProducts);
        setSelectedBarcode(cleanInput);
        setShowProductSelectionDialog(true);
        setProductSearch("");
        setTimeout(() => {
          barcodeInputRef.current?.focus();
        }, 100);
        return;
      }

      const product = foundProducts[0];
      const result = await addToCart(product);

      if (result) {
        setProductSearch("");
        setTimeout(() => {
          barcodeInputRef.current?.focus();
        }, 100);
      }
    } catch (error: any) {
      console.error("Error in handleKeyPress:", error);
      toast.error(error?.message || "Failed to add product");
      setProductSearch("");
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setIsAddingFromEnter(false);
      }, 500);
    }
  };

  // Handle search result click
  const handleSearchResultClick = async (product: Product) => {
    if (!selectedCustomer) {
      toast.error("Please select a customer first");
      return;
    }

    if (!billingId) {
      toast.error("Billing session not initialized");
      return;
    }

    setLoading(true);

    try {
      const result = await addToCart(product);
      if (result) {
        setProductSearch("");
        setShowSearchResults(false);

        setTimeout(() => {
          barcodeInputRef.current?.focus();
        }, 100);
      }
    } catch (error: any) {
      if (error.multiple && error.data && Array.isArray(error.data)) {
        setMultipleProducts(error.data);
        setSelectedBarcode(product.barCode);
        setShowProductSelectionDialog(true);
        setProductSearch("");
        setShowSearchResults(false);
      } else {
        toast.error(error?.message || "Failed to add product");
        setProductSearch("");
        setShowSearchResults(false);

        setTimeout(() => {
          barcodeInputRef.current?.focus();
        }, 100);
      }
    } finally {
      setLoading(false);
    }
  };

  // Search products by name or barcode
  const handleProductSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchProducts(searchTerm);
      if (response.success && response.data) {
        setSearchResults(response.data);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (productSearch) {
        handleProductSearch(productSearch);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [productSearch]);

  // Handle new customer creation
  const handleCreateCustomer = async (data: CustomerFormData) => {
    try {
      const response = await createCustomer(data as any);
      if (response.success) {
        toast.success("Customer created successfully!");
        setShowNewCustomerDialog(false);
        await loadCustomers();

        if (response.data) {
          setSelectedCustomer(response.data);
        }
      }
    } catch (error: any) {
      console.error("Create customer error:", error);
      toast.error(error.response?.data?.message || "Failed to create customer");
    }
  };

  // Calculate totals
  const subtotal = useMemo(() => {
    if (!selectedCustomer) return 0;
    return cart.reduce((sum, item) => {
      const price =
        selectedCustomer.customerType === "B2B"
          ? item.b2bSalePrice || 0
          : item.b2cSalePrice || 0;
      return sum + price * (item.cartQuantity || 0);
    }, 0);
  }, [cart, selectedCustomer]);

  const taxTotal = useMemo(() => {
    if (!selectedCustomer) return 0;
    return cart.reduce((sum, item) => {
      const price =
        selectedCustomer.customerType === "B2B"
          ? item.b2bSalePrice || 0
          : item.b2cSalePrice || 0;
      const tax = item.salesTax || 0;
      const priceWithQty = price * (item.cartQuantity || 0);
      const baseAmount = priceWithQty / (1 + tax / 100);
      const taxAmount = priceWithQty - baseAmount;
      return sum + taxAmount;
    }, 0);
  }, [cart, selectedCustomer]);

  const baseTotal = useMemo(() => {
    if (!selectedCustomer) return 0;
    return cart.reduce((sum, item) => {
      const price =
        selectedCustomer.customerType === "B2B"
          ? item.b2bSalePrice || 0
          : item.b2cSalePrice || 0;
      const tax = item.salesTax || 0;
      const priceWithQty = price * (item.cartQuantity || 0);
      const baseAmount = priceWithQty / (1 + tax / 100);
      return sum + baseAmount;
    }, 0);
  }, [cart, selectedCustomer]);

  const discountAmountCalculated = (baseTotal * discountPercentage) / 100;
  const grandTotal =
    baseTotal - discountAmountCalculated + taxTotal + freightCharge;
  const roundedGrandTotal = Math.round(grandTotal);
  const roundOffAmount = roundedGrandTotal - grandTotal;
  const balance = paidAmount - roundedGrandTotal;

  // Handle generate invoice
  const handleGenerateInvoice = async () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer first");
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!paymentMode) {
      toast.error("Please select payment mode");
      return;
    }

    if (!invoiceType) {
      toast.error("Please select invoice type");
      return;
    }

    if (!invoiceDate) {
      toast.error("Please select invoice date");
      return;
    }

    if (
      paymentMode === "Pay Later" &&
      (!payLaterRemarks || payLaterRemarks.trim() === "")
    ) {
      toast.error("Please enter remarks for Pay Later payment");
      return;
    }

    setIsLoading(true);

    try {
      // Pass invoiceDate to generateInvoice
      const billingId = await generateInvoice(
        paymentMode,
        discountPercentage,
        freightCharge,
        payLaterRemarks,
        invoiceType,
        invoiceDate, // Pass the invoice date here
      );

      if (billingId) {
        const response = await getBillingById(billingId);
        if (response.success && response.data) {
          setBillingData(response.data);
          setPaymentMode("");
          setFreightCharge(0);
          setPayLaterRemarks("");
          setShowRemarksInput(false);
          setInvoiceType("J1");
        }
      }
    } catch (error) {
      console.error("Invoice generation error:", error);
      toast.error("Failed to generate invoice");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while restoring session
  if (!isLoaded) {
    return <BillingPageSkeleton />;
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 print:p-0">
      {/* Header with Reset Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
          Billing to Customer
        </h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Badge
            variant="outline"
            className="text-xs md:text-sm font-mono tabular-nums"
            style={{
              minWidth: "210px",
              display: "inline-flex",
              justifyContent: "center",
              whiteSpace: "nowrap",
            }}
          >
            {format(currentTime, "dd MMM yyyy, hh:mm:ss a")}
          </Badge>
          {(selectedCustomer || cart.length > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (
                  window.confirm(
                    "Clear current billing session? This will delete the draft.",
                  )
                ) {
                  await clearSession();
                  toast.success("Session cleared");
                }
              }}
              className="text-red-600 hover:text-red-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Bill
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column - Customer & Products */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Invoice Type Selection - Show by default */}
          <div className="space-y-2">
            <Label className="text-xs md:text-sm font-bold text-gray-800">
              Invoice Type <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="invoiceType"
                  value="J1"
                  checked={invoiceType === "J1"}
                  onChange={() => setInvoiceType("J1")}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm font-medium text-gray-700">J1</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="invoiceType"
                  value="J2"
                  checked={invoiceType === "J2"}
                  onChange={() => setInvoiceType("J2")}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm font-medium text-gray-700">J2</span>
              </label>
            </div>
          </div>

          {/* Customer Selection Card */}
          <Card
            className={`print:hidden border-2 ${
              !selectedCustomer ? "border-red-200 bg-red-50/50" : ""
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
                  Customer Details
                  {!selectedCustomer && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Required
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              {/* Customer Search */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search customer by name, email, phone, company, GST..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerResults(true);
                    }}
                    onFocus={() => setShowCustomerResults(true)}
                    className="pl-10 text-sm"
                    disabled={!!selectedCustomer}
                  />

                  {showCustomerResults &&
                    customerSearch.trim() !== "" &&
                    !selectedCustomer && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto">
                        {isLoadingCustomers ? (
                          <div className="p-4 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                          </div>
                        ) : filteredCustomers.length > 0 ? (
                          filteredCustomers.map((customer) => (
                            <div
                              key={customer._id}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                              onClick={() => handleSelectCustomer(customer)}
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {customer.customerType === "B2B" ? (
                                    <Building2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                  ) : (
                                    <User className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <span className="font-medium text-sm truncate block">
                                      {customer.name}
                                    </span>
                                    {customer.customerType === "B2B" &&
                                      customer.companyName && (
                                        <span className="text-xs text-gray-500 block truncate">
                                          {customer.companyName}
                                        </span>
                                      )}
                                  </div>
                                </div>
                                <Badge
                                  className={getTypeBadge(
                                    customer.customerType,
                                  )}
                                >
                                  {customer.customerType}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 mt-1 truncate">
                                {customer.email && (
                                  <span>{customer.email} • </span>
                                )}
                                {customer.mobile && (
                                  <span>{customer.mobile}</span>
                                )}
                              </div>
                              {customer.customerType === "B2B" &&
                                customer.gstIn && (
                                  <div className="text-xs text-gray-400 mt-1 truncate">
                                    GST: {customer.gstIn}
                                  </div>
                                )}
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            <p className="text-sm mb-2">No customers found.</p>
                            <button
                              onClick={() => {
                                setShowCustomerResults(false);
                                setShowNewCustomerDialog(true);
                              }}
                              className="text-indigo-600 hover:underline text-sm"
                            >
                              Create new customer
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                </div>

                <Button
                  onClick={() => setShowNewCustomerDialog(true)}
                  disabled={!!selectedCustomer}
                  variant={selectedCustomer ? "outline" : "default"}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Customer
                </Button>
              </div>

              {/* Selected Customer Display */}
              {selectedCustomer && (
                <div className="bg-green-50 p-3 md:p-4 rounded-lg border border-green-200">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
                      <div
                        className={`p-1.5 md:p-2 rounded-full flex-shrink-0 ${
                          selectedCustomer.customerType === "B2B"
                            ? "bg-purple-100"
                            : "bg-green-100"
                        }`}
                      >
                        {selectedCustomer.customerType === "B2B" ? (
                          <Building2 className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                        ) : (
                          <User className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-base md:text-lg truncate">
                            {selectedCustomer.name}
                          </p>
                          <Badge
                            className={getTypeBadge(
                              selectedCustomer.customerType,
                            )}
                          >
                            {selectedCustomer.customerType}
                          </Badge>
                        </div>
                        {selectedCustomer.customerType === "B2B" && (
                          <>
                            <p className="text-xs md:text-sm text-gray-600 truncate">
                              {selectedCustomer.companyName}
                            </p>
                            <p className="text-xs md:text-sm text-gray-500 truncate">
                              GST: {selectedCustomer.gstIn}
                            </p>
                          </>
                        )}
                        <p className="text-xs md:text-sm text-gray-500 mt-1 truncate">
                          {selectedCustomer.email} • {selectedCustomer.mobile}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {selectedCustomer.address}, {selectedCustomer.city},{" "}
                          {selectedCustomer.state}, {selectedCustomer.country}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (
                          window.confirm(
                            "Changing customer will delete the current draft. Continue?",
                          )
                        ) {
                          await setSelectedCustomer(null);
                          clearCart();
                        }
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Customer Required Message */}
              {!selectedCustomer && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs md:text-sm">
                    Please select a customer to start billing
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Date Input - Add this card */}
          <Card
            className={`print:hidden border-2 ${
              !invoiceDate ? "border-red-200 bg-red-50/50" : ""
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                Invoice Date
                {!invoiceDate && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Required
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-xs md:text-sm font-medium text-gray-700">
                  Select Invoice Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={invoiceDate || format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  disabled={!selectedCustomer}
                  className={!selectedCustomer ? "bg-gray-50" : ""}
                />
                <p className="text-xs text-gray-500">
                  Select the invoice date. Defaults to today.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Combined Search & Scan Card */}
          <Card
            className={`print:hidden ${!selectedCustomer ? "opacity-50" : ""}`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Search className="w-4 h-4 md:w-5 md:h-5" />
                Search or Scan Product
                {!selectedCustomer && (
                  <Lock className="w-4 h-4 text-gray-400 ml-2" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative" ref={searchContainerRef}>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder={
                      selectedCustomer
                        ? "Search by name/barcode or scan barcode... (Press Enter to add)"
                        : "Select a customer first"
                    }
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onFocus={() =>
                      selectedCustomer && setShowSearchResults(true)
                    }
                    className="pl-10 text-sm"
                    disabled={!selectedCustomer || loading}
                  />
                  {(isSearching || loading) && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>

                {showSearchResults &&
                  selectedCustomer &&
                  productSearch.trim() !== "" && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 md:max-h-80 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((product) => (
                          <div
                            key={product._id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => handleSearchResultClick(product)}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="font-medium text-sm truncate">
                                    {product.productName}
                                  </span>
                                  {product.quantity <= 0 && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      Out of Stock
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="break-all">
                                    Item Code:{" "}
                                    {product.itemCode || product.barCode}
                                  </span>
                                  {product.color && (
                                    <span className="ml-2">
                                      Color: {product.color}
                                    </span>
                                  )}
                                  {product.size && (
                                    <span className="ml-2">
                                      Size: {product.size}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Stock: {product.quantity} units
                                </div>
                              </div>
                              <div className="text-left sm:text-right">
                                <div className="text-sm font-medium text-indigo-600">
                                  ₹
                                  {selectedCustomer?.customerType === "B2B"
                                    ? (product.b2bSalePrice || 0).toFixed(2)
                                    : (product.b2cSalePrice || 0).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          <p className="text-sm">
                            No products found matching "{productSearch}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Type to search by name/barcode or scan barcode. Click on any
                product or press Enter to add to cart.
              </p>
            </CardContent>
          </Card>

          {/* Cart Table Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <CardTitle className="text-base md:text-lg">
                  Current Bill
                </CardTitle>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            {cart.length > 0 && (
              <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg mx-4 md:mx-6">
                <div>
                  <span className="text-xs md:text-sm text-gray-600">
                    Total Products:
                  </span>
                  <span className="ml-2 font-semibold text-sm md:text-base">
                    {cart.length}
                  </span>
                </div>
                <div>
                  <span className="text-xs md:text-sm text-gray-600">
                    Total Quantity:
                  </span>
                  <span className="ml-2 font-semibold text-sm md:text-base">
                    {cart.reduce(
                      (sum, item) => sum + (item.cartQuantity || 0),
                      0,
                    )}
                  </span>
                </div>
              </div>
            )}
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm md:text-base">No items in cart</p>
                  <p className="text-xs md:text-sm mt-1">
                    {selectedCustomer
                      ? "Search or scan barcode to add products"
                      : "Select a customer to start"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <div className="min-w-[640px] md:min-w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs md:text-sm">
                            Product
                          </TableHead>
                          <TableHead className="text-right text-xs md:text-sm">
                            Barcode
                          </TableHead>
                          <TableHead className="text-right text-xs md:text-sm">
                            Price
                          </TableHead>
                          <TableHead className="text-center text-xs md:text-sm">
                            Qty
                          </TableHead>
                          <TableHead className="text-right text-xs md:text-sm hidden sm:table-cell">
                            Unit
                          </TableHead>
                          <TableHead className="text-right text-xs md:text-sm hidden md:table-cell">
                            SGST
                          </TableHead>
                          <TableHead className="text-right text-xs md:text-sm hidden md:table-cell">
                            CGST
                          </TableHead>
                          <TableHead className="text-right text-xs md:text-sm hidden lg:table-cell">
                            Base Amt
                          </TableHead>
                          <TableHead className="text-right text-xs md:text-sm">
                            Total
                          </TableHead>
                          <TableHead className="text-right w-[70px] md:w-[100px]">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item) => {
                          const price =
                            selectedCustomer?.customerType === "B2B"
                              ? item.b2bSalePrice || 0
                              : item.b2cSalePrice || 0;
                          const tax = item.salesTax || 0;
                          const priceWithQty = price * (item.cartQuantity || 0);
                          const taxAmount = (priceWithQty * tax) / (100 + tax);
                          const baseAmount = priceWithQty - taxAmount;
                          const itemTotal = priceWithQty;

                          return (
                            <TableRow key={item._id}>
                              <TableCell className="py-2">
                                <div>
                                  <p className="font-medium text-sm">
                                    {item.productName}
                                  </p>
                                  <p className="text-xs text-gray-500 hidden sm:block">
                                    Item Code: {item.itemCode || item.barCode}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs">
                                {item.barCode}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                ₹{price.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-1 md:gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 md:h-8 md:w-8"
                                    onClick={() =>
                                      updateQuantity(
                                        item._id,
                                        (item.cartQuantity || 0) - 1,
                                      )
                                    }
                                    disabled={
                                      updatingProductId === item._id ||
                                      (item.cartQuantity || 0) <= 1
                                    }
                                  >
                                    {updatingProductId === item._id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Minus className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <span className="w-6 md:w-8 text-center text-sm">
                                    {item.cartQuantity || 0}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 md:h-8 md:w-8"
                                    onClick={() =>
                                      updateQuantity(
                                        item._id,
                                        (item.cartQuantity || 0) + 1,
                                      )
                                    }
                                    disabled={
                                      updatingProductId === item._id ||
                                      (item.cartQuantity || 0) >=
                                        (item.quantity || 0)
                                    }
                                  >
                                    {updatingProductId === item._id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Plus className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-xs hidden sm:table-cell">
                                Pcs.
                              </TableCell>
                              <TableCell className="text-right text-xs hidden md:table-cell">
                                ₹{(taxAmount / 2).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-xs hidden md:table-cell">
                                ₹{(taxAmount / 2).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-xs hidden lg:table-cell">
                                ₹{baseAmount.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-sm">
                                ₹{itemTotal.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 md:h-8 md:w-8 text-red-600"
                                  onClick={() => removeFromCart(item._id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Payment Summary */}
        <div className="space-y-4 md:space-y-6">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              {selectedCustomer && (
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-gray-600">
                    Customer Type:
                  </span>
                  <Badge
                    className={
                      selectedCustomer.customerType === "B2B"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-green-100 text-green-800"
                    }
                  >
                    {selectedCustomer.customerType}
                  </Badge>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-medium">₹{baseTotal.toFixed(2)}</span>
                </div>

                {/* Discount on Base Amount - Percentage */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs md:text-sm text-gray-600">
                      Discount (%):
                    </span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={discountPercentage}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 0 && val <= 100) {
                          setDiscountPercentage(val);
                        } else if (val > 100) {
                          toast.error("Discount cannot exceed 100%");
                        }
                      }}
                      className="w-20 h-8 text-sm"
                      disabled={cart.length === 0}
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  {discountPercentage > 0 && (
                    <div className="text-right">
                      <span className="ml-2 font-medium text-red-600 text-xs md:text-sm">
                        -₹{discountAmountCalculated.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Amount after Discount */}
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Amount after Discount:</span>
                  <span className="font-medium">
                    ₹{(baseTotal - discountAmountCalculated).toFixed(2)}
                  </span>
                </div>

                {/* Tax Breakdown */}
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">SGST:</span>
                    <span className="font-medium">
                      ₹{(taxTotal / 2).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">CGST:</span>
                    <span className="font-medium">
                      ₹{(taxTotal / 2).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Total Tax:</span>
                    <span className="font-medium">₹{taxTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Freight Charge */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm text-gray-600">
                      Freight Charge:
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={freightCharge}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 0) {
                          setFreightCharge(val);
                        }
                      }}
                      className="w-24 h-8 text-sm"
                      disabled={cart.length === 0}
                    />
                    <span className="text-xs text-gray-500">₹</span>
                  </div>
                  {freightCharge > 0 && (
                    <div className="text-right">
                      <span className="ml-2 font-medium text-blue-600 text-xs md:text-sm">
                        +₹{freightCharge.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <Separator className="my-2" />

                {/* Grand Total */}
                <div className="flex justify-between font-bold text-base md:text-lg">
                  <span>Grand Total:</span>
                  <span className="text-indigo-600">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>

                {/* Rounded Off */}
                {roundOffAmount !== 0 && (
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Rounded Off:</span>
                    <span
                      className={`font-medium ${
                        roundOffAmount > 0 ? "text-blue-600" : "text-red-600"
                      }`}
                    >
                      {roundOffAmount > 0
                        ? `+₹${roundOffAmount.toFixed(2)}`
                        : `-₹${Math.abs(roundOffAmount).toFixed(2)}`}
                    </span>
                  </div>
                )}

                {/* Final Rounded Total */}
                <div className="flex justify-between font-bold text-lg md:text-xl pt-2 border-t-2 border-gray-200">
                  <span>Rounded Total:</span>
                  <span className="text-green-600">
                    ₹{roundedGrandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-2">
                <Label className="text-xs md:text-sm font-medium text-gray-700">
                  Payment Mode <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    type="button"
                    variant={paymentMode === "Cash" ? "default" : "outline"}
                    className={`cursor-pointer text-xs md:text-sm ${
                      paymentMode === "Cash"
                        ? "bg-green-600 hover:bg-green-700"
                        : "hover:bg-green-50"
                    }`}
                    onClick={() => {
                      setPaymentMode("Cash");
                      setShowRemarksInput(false);
                      setPayLaterRemarks("");
                    }}
                    disabled={cart.length === 0}
                  >
                    Cash
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMode === "UPI" ? "default" : "outline"}
                    className={`cursor-pointer text-xs md:text-sm ${
                      paymentMode === "UPI"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "hover:bg-blue-50"
                    }`}
                    onClick={() => {
                      setPaymentMode("UPI");
                      setShowRemarksInput(false);
                      setPayLaterRemarks("");
                    }}
                    disabled={cart.length === 0}
                  >
                    UPI
                  </Button>
                  <Button
                    type="button"
                    variant={
                      paymentMode === "Debit/Credit Card"
                        ? "default"
                        : "outline"
                    }
                    className={`cursor-pointer text-xs md:text-sm ${
                      paymentMode === "Debit/Credit Card"
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "hover:bg-purple-50"
                    }`}
                    onClick={() => {
                      setPaymentMode("Debit/Credit Card");
                      setShowRemarksInput(false);
                      setPayLaterRemarks("");
                    }}
                    disabled={cart.length === 0}
                  >
                    Card
                  </Button>
                  <Button
                    type="button"
                    variant={
                      paymentMode === "Pay Later" ? "default" : "outline"
                    }
                    className={`cursor-pointer text-xs md:text-sm ${
                      paymentMode === "Pay Later"
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "hover:bg-orange-50"
                    }`}
                    onClick={() => {
                      setPaymentMode("Pay Later");
                      setShowRemarksInput(true);
                    }}
                    disabled={cart.length === 0}
                  >
                    Pay Later
                  </Button>
                </div>

                {showRemarksInput && paymentMode === "Pay Later" && (
                  <div className="mt-3">
                    <Label className="text-xs md:text-sm font-medium text-gray-700 mb-1 block">
                      Remarks <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Enter reason for Pay Later..."
                      value={payLaterRemarks}
                      onChange={(e) => setPayLaterRemarks(e.target.value)}
                      className="w-full text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required: Please provide remarks for this Pay Later
                      transaction
                    </p>
                  </div>
                )}

                {cart.length > 0 && !paymentMode && (
                  <p className="text-xs text-amber-600">
                    Please select payment mode
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <Button
                  className="w-full cursor-pointer print:hidden"
                  size="lg"
                  onClick={handleGenerateInvoice}
                  disabled={
                    !selectedCustomer ||
                    cart.length === 0 ||
                    !paymentMode ||
                    !invoiceType ||
                    !invoiceDate ||
                    isLoading ||
                    (paymentMode === "Pay Later" && !payLaterRemarks.trim())
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Generate Invoice
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Customer Dialog */}
      <Dialog
        open={showNewCustomerDialog}
        onOpenChange={setShowNewCustomerDialog}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm
            onSubmit={handleCreateCustomer}
            isLoading={isLoadingCustomers}
            onCancel={() => setShowNewCustomerDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Product Selection Dialog for Multiple Products */}
      <Dialog
        open={showProductSelectionDialog}
        onOpenChange={setShowProductSelectionDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Multiple products found with barcode "{selectedBarcode}". Please
              select one:
            </p>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {multipleProducts.map((product) => (
                <div
                  key={product._id}
                  className={`p-3 border rounded-lg transition-colors ${
                    product.quantity <= 0
                      ? "bg-gray-100 opacity-60 cursor-not-allowed"
                      : "hover:bg-gray-50 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (product.quantity > 0) {
                      handleAddSelectedProduct(product);
                    }
                  }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {product.productName}
                      </p>
                      <div className="text-xs text-gray-500 mt-1">
                        {product.color && <span>Color: {product.color}</span>}
                        {product.size && (
                          <span className="ml-2">Size: {product.size}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Stock: {product.quantity} units
                      </div>
                      <div className="text-xs text-gray-500 mt-1 break-all">
                        Barcode: {product.barCode}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-indigo-600 text-sm">
                        ₹
                        {selectedCustomer?.customerType === "B2B"
                          ? (product.b2bSalePrice || 0).toFixed(2)
                          : (product.b2cSalePrice || 0).toFixed(2)}
                      </p>

                      {product.quantity <= 0 ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled
                          variant="secondary"
                          className="mt-2 w-full sm:w-auto cursor-not-allowed bg-red-600 text-white hover:bg-red-700"
                        >
                          Out of Stock
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full sm:w-auto cursor-pointer"
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* A4 Invoice Dialog */}
      {billingData && (
        <Dialog open={!!billingData} onOpenChange={() => setBillingData(null)}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice {billingData?.invoiceNumber}</DialogTitle>
            </DialogHeader>
            <A4Invoice
              billing={billingData}
              onPrinted={() => {
                setBillingData(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

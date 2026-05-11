"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
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
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Package,
  Loader2,
  X,
  Check,
  AlertCircle,
  Building2,
  RefreshCw,
  Truck,
  UserPlus,
  Calendar,
  MapPin,
  Repeat,
  Layers,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { getSuppliers, Supplier } from "@/lib/api/suppliers";
import { createSupplier, SupplierFormData } from "@/lib/api/suppliers";
import { usePurchaseStore } from "@/lib/hooks/usePurchaseStore";
import CreateProductDialog from "@/components/purchases/CreateProductDialog";
import SupplierForm from "@/components/forms/SupplierForm";
import { getProducts, Product, searchProducts } from "@/lib/api/products";
import PurchasePageSkeleton from "@/components/skeletons/PurchasePageSkeleton";

export default function PurchasesPage() {
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const {
    selectedSupplier,
    items,
    invoiceNumber,
    invoiceDate,
    placeOfSupply,
    reverseCharge,
    purchaseId,
    referenceInvoiceNumber,
    isLoaded,
    isLoading,
    totals,
    discount,
    freightCharge,
    isCreating,
    updatingProductId,
    updatingAction,
    setSelectedSupplier,
    setInvoiceNumber,
    setInvoiceDate,
    setPlaceOfSupply,
    setReverseCharge,
    setDiscount,
    setFreightCharge,
    scanBarcode,
    updateQuantity,
    removeProduct,
    completePurchaseInvoice,
    clearSession,
    createPurchaseSession,
  } = usePurchaseStore();

  // Local state
  const [supplierSearch, setSupplierSearch] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierResults, setShowSupplierResults] = useState(false);
  const [showNewSupplierDialog, setShowNewSupplierDialog] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [showCreateProductDialog, setShowCreateProductDialog] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [multipleProducts, setMultipleProducts] = useState<any[]>([]);
  const [showProductSelectionDialog, setShowProductSelectionDialog] =
    useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState("");
  const [showBulkAddDialog, setShowBulkAddDialog] = useState(false);
  const [bulkQuantity, setBulkQuantity] = useState(1);
  const [bulkProduct, setBulkProduct] = useState<Product | null>(null);
  const [paymentMode, setPaymentMode] = useState<string>("");
  const [payLaterRemarks, setPayLaterRemarks] = useState("");
  const [showRemarksInput, setShowRemarksInput] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load suppliers and products on mount
  useEffect(() => {
    loadSuppliers();
    loadProducts();
  }, []);
  // Set default place of supply if not set
  useEffect(() => {
    if (!placeOfSupply) {
      setPlaceOfSupply("Telangana");
    }
  }, []);

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

  const loadSuppliers = async () => {
    setIsLoadingSuppliers(true);
    try {
      const response = await getSuppliers();
      if (response.success && response.data) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error("Error loading suppliers:", error);
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter((supplier) => {
    if (!supplierSearch.trim()) return false;

    const searchLower = supplierSearch.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(searchLower) ||
      supplier.email?.toLowerCase().includes(searchLower) ||
      supplier.mobile?.includes(supplierSearch) ||
      supplier.gstIn?.toLowerCase().includes(searchLower) ||
      supplier.city.toLowerCase().includes(searchLower)
    );
  });

  // Handle supplier selection
  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierSearch("");
    setShowSupplierResults(false);
  };

  // Handle create new supplier
  const handleCreateSupplier = async (data: SupplierFormData) => {
    try {
      const response = await createSupplier(data);
      if (response.success) {
        toast.success("Supplier created successfully!");
        setShowNewSupplierDialog(false);
        await loadSuppliers();

        if (response.data) {
          setSelectedSupplier(response.data);
        }
      }
    } catch (error: any) {
      console.error("Create supplier error:", error);
      toast.error(error.response?.data?.message || "Failed to create supplier");
    }
  };

  // Check if all fields are filled (for enabling search)
  const allDetailsFilled =
    selectedSupplier &&
    invoiceNumber &&
    invoiceNumber.trim() !== "" &&
    invoiceDate &&
    placeOfSupply &&
    placeOfSupply.trim() !== "" &&
    reverseCharge &&
    purchaseId;

  const handleAddSelectedProduct = async (product: any) => {
    if (!selectedSupplier) {
      toast.error("Please select a supplier first");
      return;
    }

    if (!purchaseId) {
      toast.error("Please complete all supplier details first");
      return;
    }

    // Prevent multiple clicks
    if (isAddingProduct) return;

    setIsAddingProduct(true);
    setIsScanning(true);

    try {
      const result = await scanBarcode(product.barCode, quantity, product._id);

      if (result === true) {
        toast.success("Product added to purchase");
        setShowProductSelectionDialog(false);
        setMultipleProducts([]);
        setSearchTerm("");
        setQuantity(1);
      } else {
        toast.error("Failed to add product");
      }
    } catch (error: any) {
      console.error("🔴 [PAGE] Error adding selected product:", error);
      toast.error(error.response?.data?.message || "Failed to add product");
    } finally {
      setIsScanning(false);
      setIsAddingProduct(false);
    }
  };

  // Update handleBulkAdd similarly
  const handleBulkAdd = async () => {
    if (!bulkProduct) return;

    // Prevent multiple clicks
    if (isAddingProduct) return;

    setIsAddingProduct(true);
    setIsScanning(true);

    try {
      const result = await scanBarcode(
        bulkProduct.barCode,
        bulkQuantity,
        bulkProduct._id,
      );

      if (result === true) {
        toast.success(
          `${bulkQuantity} x ${bulkProduct.productName} added to purchase`,
        );
        setShowBulkAddDialog(false);
        setBulkQuantity(1);
        setBulkProduct(null);
        setSearchTerm("");
        setShowSearchResults(false);
      } else {
        toast.error("Failed to add product");
      }
    } catch (error: any) {
      console.error("Error in bulk add:", error);
      toast.error(error.response?.data?.message || "Failed to add product");
    } finally {
      setIsScanning(false);
      setIsAddingProduct(false);
    }
  };

  // Handle search result click - check for multiple products first
  const handleSearchResultClick = async (product: Product) => {
    if (!selectedSupplier) {
      toast.error("Please select a supplier first");
      return;
    }

    if (!purchaseId) {
      toast.error("Please complete all supplier details first");
      return;
    }

    setIsScanning(true);

    try {
      const result = await scanBarcode(product.barCode, quantity);

      if (result && typeof result === "object" && result.multiple === true) {
        setMultipleProducts(result.data);
        setSelectedBarcode(product.barCode);
        setShowProductSelectionDialog(true);
        setSearchTerm("");
        setShowSearchResults(false);
        return;
      }

      if (result === true) {
        toast.success("Product added to purchase");
        setSearchTerm("");
        setShowSearchResults(false);
        setQuantity(1);
      }
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast.error(error.response?.data?.message || "Failed to add product");
    } finally {
      setIsScanning(false);
    }
  };

  // Search products by name or barcode
  const handleProductSearch = async (searchValue: string) => {
    if (!searchValue.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchProducts(searchValue);
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
      if (searchTerm) {
        handleProductSearch(searchTerm);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle barcode scan (combined input)
  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplier) {
      toast.error("Please select a supplier first");
      return;
    }

    if (!invoiceNumber.trim()) {
      toast.error("Please enter invoice number");
      return;
    }

    if (!invoiceDate) {
      toast.error("Please select invoice date");
      return;
    }

    if (!placeOfSupply.trim()) {
      toast.error("Please enter place of supply");
      return;
    }

    if (!reverseCharge) {
      toast.error("Please select reverse charge");
      return;
    }

    if (!searchTerm.trim()) return;

    setIsScanning(true);

    try {
      const result = await scanBarcode(searchTerm, quantity);

      if (result && typeof result === "object" && result.multiple === true) {
        setMultipleProducts(result.data);
        setSelectedBarcode(searchTerm);
        setShowProductSelectionDialog(true);
        setSearchTerm("");
        return;
      }

      if (result === true) {
        toast.success("Product added to purchase");
        setSearchTerm("");
        setQuantity(1);
      }
    } catch (error: any) {
      console.error("Error in handleBarcodeScan:", error);

      if (error.response?.status === 404) {
        setScannedBarcode(searchTerm);
        setShowCreateProductDialog(true);
      } else {
        toast.error(error.response?.data?.message || "Failed to add product");
      }
      setSearchTerm("");
    } finally {
      setIsScanning(false);
    }
  };

  // Handle complete purchase with payment details
  const handleCompletePurchase = async () => {
    if (items.length === 0) {
      toast.error("No items in purchase invoice");
      return;
    }

    if (!paymentMode) {
      toast.error("Please select payment mode");
      return;
    }

    if (paymentMode === "Pay Later" && !payLaterRemarks.trim()) {
      toast.error("Please enter remarks for Pay Later payment");
      return;
    }

    const success = await completePurchaseInvoice(
      discount, // Send percentage value
      freightCharge,
      paymentMode,
      payLaterRemarks,
    );

    if (success) {
      // Reset payment mode and remarks after successful completion
      setPaymentMode("");
      setPayLaterRemarks("");
      setShowRemarksInput(false);
    }
  };

  // Handle new purchase
  const handleNewPurchase = async () => {
    if (items.length > 0) {
      if (
        !window.confirm(
          "Clear current purchase session? This will delete the draft and cannot be undone.",
        )
      ) {
        return;
      }
    }
    await clearSession();
    setQuantity(1);
    setSupplierSearch("");
    setSearchTerm("");
    setMultipleProducts([]);
    setShowProductSelectionDialog(false);
  };

  // Show loading while restoring session
  if (!isLoaded) {
    return <PurchasePageSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Reset Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Purchase Invoice</h1>
          <p className="text-gray-500">Receive stock from suppliers</p>
        </div>
        <div className="flex items-center gap-2">
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
          {(selectedSupplier || items.length > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewPurchase}
              className="text-red-600 hover:text-red-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Purchase
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Supplier & Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Selection Card */}
          <Card
            className={`border-2 ${
              !selectedSupplier ? "border-red-200 bg-red-50/50" : ""
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Supplier Details
                  {!selectedSupplier && (
                    <Badge variant="destructive" className="ml-2">
                      Required
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Supplier Search */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search supplier by name, email, phone, GST..."
                    value={supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setShowSupplierResults(true);
                    }}
                    onFocus={() => setShowSupplierResults(true)}
                    className="pl-10"
                    disabled={!!selectedSupplier}
                  />

                  {/* Search Results Dropdown */}
                  {showSupplierResults &&
                    supplierSearch.trim() !== "" &&
                    !selectedSupplier && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto">
                        {isLoadingSuppliers ? (
                          <div className="p-4 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                          </div>
                        ) : filteredSuppliers.length > 0 ? (
                          <>
                            {filteredSuppliers.map((supplier) => (
                              <div
                                key={supplier._id}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                onClick={() => handleSelectSupplier(supplier)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Building2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <span className="font-medium truncate block">
                                        {supplier.name}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-500 mt-1 truncate">
                                  {supplier.email && (
                                    <span>{supplier.email} • </span>
                                  )}
                                  {supplier.mobile && (
                                    <span>{supplier.mobile}</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1 truncate">
                                  GST: {supplier.gstIn} • {supplier.city},{" "}
                                  {supplier.state}
                                </div>
                              </div>
                            ))}
                            {/* Create New Supplier Option */}
                            <div
                              className="p-3 hover:bg-indigo-50 cursor-pointer border-t-2 border-indigo-200 bg-indigo-50/50"
                              onClick={() => {
                                setShowSupplierResults(false);
                                setShowNewSupplierDialog(true);
                              }}
                            >
                              <div className="flex items-center gap-2 text-indigo-600">
                                <UserPlus className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium truncate">
                                  Create new supplier "{supplierSearch}"
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-gray-500 mb-2 break-words">
                              No suppliers found matching "{supplierSearch}"
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowSupplierResults(false);
                                setShowNewSupplierDialog(true);
                              }}
                              className="text-indigo-600 border-indigo-200"
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Create New Supplier
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
              {/* Selected Supplier Display */}
              {selectedSupplier && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-full bg-purple-100 flex-shrink-0">
                        <Building2 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-lg truncate">
                          {selectedSupplier.name}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {selectedSupplier.email} • {selectedSupplier.mobile}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          GST: {selectedSupplier.gstIn}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {selectedSupplier.address}, {selectedSupplier.city},{" "}
                          {selectedSupplier.state}, {selectedSupplier.country} -{" "}
                          {selectedSupplier.pincode}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (
                          window.confirm(
                            "Changing supplier will delete the current draft. Continue?",
                          )
                        ) {
                          await setSelectedSupplier(null);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Change
                    </Button>
                  </div>
                </div>
              )}
              {/* Invoice Number Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <span>Invoice Number</span>
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter supplier invoice number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  disabled={!selectedSupplier}
                  className={!selectedSupplier ? "bg-gray-50" : ""}
                />
              </div>
              {/* Place of Supply Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>Place of Supply</span>
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter place of supply (e.g., State name)"
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  disabled={!selectedSupplier}
                  className={!selectedSupplier ? "bg-gray-50" : ""}
                />
              </div>
              {/* Invoice Date Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Invoice Date</span>
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  disabled={!selectedSupplier}
                  className={!selectedSupplier ? "bg-gray-50" : ""}
                />
              </div>
              {selectedSupplier &&
                invoiceNumber &&
                invoiceDate &&
                placeOfSupply &&
                reverseCharge &&
                !purchaseId && (
                  <div className="pt-4">
                    <Button
                      className="w-full cursor-pointer"
                      onClick={async () => {
                        const success = await createPurchaseSession();
                        if (success) {
                          toast.success(
                            "Session created! You can now add products.",
                          );
                          setTimeout(() => {
                            barcodeInputRef.current?.focus();
                          }, 100);
                        }
                      }}
                      disabled={isLoading || isCreating}
                    >
                      {isLoading || isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Session...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Create Purchase Session
                        </>
                      )}
                    </Button>
                  </div>
                )}
              {/* Show message when all fields are filled but session not created */}
              {selectedSupplier &&
                invoiceNumber &&
                invoiceDate &&
                placeOfSupply &&
                reverseCharge &&
                !purchaseId &&
                !isLoading && (
                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm">
                      All details filled. Click "Create Purchase Session" to
                      start adding products.
                    </p>
                  </div>
                )}
              {/* Show session created message */}
              {purchaseId && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">
                    Purchase session active. You can now add products.
                  </p>
                </div>
              )}
              {/* Show Reference Invoice Number */}
              {purchaseId && referenceInvoiceNumber && (
                <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg mt-2">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">
                    Reference Invoice:{" "}
                    <span className="font-semibold">
                      {referenceInvoiceNumber}
                    </span>
                  </p>
                </div>
              )}
              {/* Required Message */}
              {(!selectedSupplier ||
                !invoiceNumber ||
                !invoiceDate ||
                !placeOfSupply ||
                !reverseCharge) &&
                !purchaseId && (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm">
                      {!selectedSupplier
                        ? "Please select a supplier to start"
                        : !invoiceNumber
                        ? "Please enter invoice number"
                        : !invoiceDate
                        ? "Please select invoice date"
                        : !placeOfSupply
                        ? "Please enter place of supply"
                        : "Please select reverse charge"}
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Combined Search & Scan Card */}
          <Card className={`${!allDetailsFilled ? "opacity-50" : ""}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search or Scan Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative" ref={searchContainerRef}>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      ref={barcodeInputRef}
                      type="text"
                      placeholder={
                        allDetailsFilled
                          ? "Search by name/barcode or scan barcode..."
                          : "Complete all supplier details first"
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() =>
                        allDetailsFilled && setShowSearchResults(true)
                      }
                      className="pl-10"
                      disabled={!allDetailsFilled || isLoading || isScanning}
                    />
                    {(isSearching || isScanning) && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                    )}
                  </div>
                  <Button
                    type="button"
                    disabled={
                      !allDetailsFilled ||
                      isLoading ||
                      isScanning ||
                      !searchTerm.trim()
                    }
                    variant={
                      allDetailsFilled && searchTerm.trim()
                        ? "default"
                        : "outline"
                    }
                    onClick={handleBarcodeScan}
                  >
                    Add
                  </Button>
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults &&
                  allDetailsFilled &&
                  searchTerm.trim() !== "" && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((product) => (
                          <div
                            key={product._id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="font-medium truncate">
                                    {product.productName}
                                  </span>
                                  {product.quantity <= 0 && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs flex-shrink-0"
                                    >
                                      Out of Stock
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  <span className="text-xs break-all">
                                    Barcode: {product.barCode}
                                  </span>
                                  {product.color && (
                                    <span className="ml-2 text-xs">
                                      Color: {product.color}
                                    </span>
                                  )}
                                  {product.size && (
                                    <span className="ml-2 text-xs">
                                      Size: {product.size}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Stock: {product.quantity} units
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-sm font-medium text-indigo-600">
                                  ₹{product.purchasePrice}
                                </div>
                                <div className="flex gap-1 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setBulkProduct(product);
                                      setShowBulkAddDialog(true);
                                      setShowSearchResults(false);
                                    }}
                                    className="h-7 text-xs"
                                  >
                                    <Layers className="w-3 h-3 mr-1" />
                                    Bulk
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleSearchResultClick(product)
                                    }
                                    className="h-7 text-xs"
                                  >
                                    Add
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-gray-500 mb-2 break-words">
                            No products found matching "{searchTerm}"
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setScannedBarcode(searchTerm);
                              setShowCreateProductDialog(true);
                              setShowSearchResults(false);
                            }}
                            className="text-indigo-600 border-indigo-200"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Product
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Type to search by name/barcode or scan barcode. If multiple
                products found, you'll be prompted to select one. Click "Bulk"
                to add multiple quantities at once.
              </p>
            </CardContent>
          </Card>

          {/* Items Table Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Received Items</CardTitle>
                {/* <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Total Qty:{" "}
                    {items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                  </span>
                </div> */}
              </div>
            </CardHeader>
            {/* Total Products and Quantity */}
            {items && items.length > 0 && (
              <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg mx-6">
                <div>
                  <span className="text-sm text-gray-600">Total Products:</span>
                  <span className="ml-2 font-semibold">{items.length}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Total Quantity:</span>
                  <span className="ml-2 font-semibold">
                    {items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
              </div>
            )}
            <CardContent>
              {!items || items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No items added</p>
                  <p className="text-sm">
                    {allDetailsFilled
                      ? "Search or scan barcode to add products"
                      : "Complete all supplier details first"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Barcode</TableHead>
                        <TableHead className="text-right">
                          Purchase Price
                        </TableHead>
                        <TableHead className="text-right">MRP</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-center">Unit</TableHead>
                        <TableHead className="text-right">SGST</TableHead>
                        <TableHead className="text-right">CGST</TableHead>
                        <TableHead className="text-right">Base Amt</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right w-[100px]">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const priceWithQty = item.purchasePrice * item.quantity;
                        const taxAmount =
                          (priceWithQty * item.taxPercent) / 100;
                        const baseAmount = priceWithQty;
                        const totalAmount = priceWithQty + taxAmount;

                        return (
                          <TableRow key={item.productId}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {item.productName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Item Code: {item.itemCode || item.barCode}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-mono text-sm">
                              {item.barCode}
                            </TableCell>
                            <TableCell className="text-center">
                              ₹{item.purchasePrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              ₹
                              {products
                                .find((p) => p._id === item.productId)
                                ?.b2cSalePrice?.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    updateQuantity(
                                      item.productId,
                                      item.quantity - 1,
                                      "decrement",
                                    )
                                  }
                                  disabled={
                                    updatingProductId === item.productId ||
                                    item.quantity <= 1
                                  }
                                >
                                  {updatingProductId === item.productId &&
                                  updatingAction === "decrement" ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Minus className="h-3 w-3" />
                                  )}
                                </Button>
                                <span className="w-8 text-center font-medium">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    updateQuantity(
                                      item.productId,
                                      item.quantity + 1,
                                      "increment",
                                    )
                                  }
                                  disabled={
                                    updatingProductId === item.productId
                                  }
                                >
                                  {updatingProductId === item.productId &&
                                  updatingAction === "increment" ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Plus className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">Pcs.</TableCell>
                            <TableCell className="text-right">
                              ₹{(taxAmount / 2).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              ₹{(taxAmount / 2).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              ₹{baseAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ₹{totalAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600"
                                onClick={() => removeProduct(item.productId)}
                                disabled={updatingProductId === item.productId}
                              >
                                {updatingProductId === item.productId &&
                                updatingAction === "remove" ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Purchase Summary */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Purchase Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price Breakdown */}
              <div className="space-y-2">
                {/* 1. Base Amount */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-medium">
                    ₹{totals.subTotal.toFixed(2)}
                  </span>
                </div>

                {/* Discount on Base Amount - Percentage */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm text-gray-600">Discount (%):</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={discount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 0 && val <= 100) {
                          setDiscount(val);
                        } else if (val > 100) {
                          toast.error("Discount cannot exceed 100%");
                        }
                      }}
                      className="w-20 h-8 text-sm"
                      disabled={items.length === 0}
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  {discount > 0 && (
                    <div className="text-right">
                      <span className="ml-2 font-medium text-red-600">
                        -₹{totals.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Amount after Discount */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount after Discount:</span>
                  <span className="font-medium">
                    ₹{totals.afterDiscount.toFixed(2)}
                  </span>
                </div>

                {/* 4. Tax Breakdown (SGST & CGST) */}
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">SGST:</span>
                    <span className="font-medium">
                      ₹{(totals.totalTax / 2).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">CGST:</span>
                    <span className="font-medium">
                      ₹{(totals.totalTax / 2).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Tax (GST):</span>
                    <span className="font-medium">
                      ₹{totals.totalTax.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 5. Freight Charge */}
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm text-gray-600">
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
                      disabled={items.length === 0}
                    />
                    <span className="text-sm text-gray-500">₹</span>
                  </div>
                  {freightCharge > 0 && (
                    <div className="text-right">
                      <span className="ml-2 font-medium text-blue-600">
                        +₹{freightCharge.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <Separator className="my-2" />

                {/* 6. Grand Total (Before Rounding) */}
                <div className="flex justify-between font-bold text-lg">
                  <span>Grand Total:</span>
                  <span className="text-indigo-600">
                    ₹{totals.finalTotal.toFixed(2)}
                  </span>
                </div>

                {/* 7. Rounded Off */}
                {totals.roundOffAmount !== 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rounded Off:</span>
                    <span
                      className={`font-medium ${
                        totals.roundOffAmount > 0
                          ? "text-blue-600"
                          : "text-red-600"
                      }`}
                    >
                      {totals.roundOffAmount > 0
                        ? `+₹${totals.roundOffAmount.toFixed(2)}`
                        : `-₹${Math.abs(totals.roundOffAmount).toFixed(2)}`}
                    </span>
                  </div>
                )}

                {/* 8. Final Rounded Total */}
                <div className="flex justify-between font-bold text-xl pt-2 border-t-2 border-gray-200">
                  <span>Rounded Total:</span>
                  <span className="text-green-600">
                    ₹{totals.roundedFinalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    type="button"
                    variant={paymentMode === "Cash" ? "default" : "outline"}
                    className={`cursor-pointer ${
                      paymentMode === "Cash"
                        ? "bg-green-600 hover:bg-green-700"
                        : "hover:bg-green-50"
                    }`}
                    onClick={() => {
                      setPaymentMode("Cash");
                      setShowRemarksInput(false);
                      setPayLaterRemarks("");
                    }}
                    disabled={items.length === 0}
                  >
                    Cash
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMode === "UPI" ? "default" : "outline"}
                    className={`cursor-pointer ${
                      paymentMode === "UPI"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "hover:bg-blue-50"
                    }`}
                    onClick={() => {
                      setPaymentMode("UPI");
                      setShowRemarksInput(false);
                      setPayLaterRemarks("");
                    }}
                    disabled={items.length === 0}
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
                    className={`cursor-pointer ${
                      paymentMode === "Debit/Credit Card"
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "hover:bg-purple-50"
                    }`}
                    onClick={() => {
                      setPaymentMode("Debit/Credit Card");
                      setShowRemarksInput(false);
                      setPayLaterRemarks("");
                    }}
                    disabled={items.length === 0}
                  >
                    Card
                  </Button>
                  <Button
                    type="button"
                    variant={
                      paymentMode === "Pay Later" ? "default" : "outline"
                    }
                    className={`cursor-pointer ${
                      paymentMode === "Pay Later"
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "hover:bg-orange-50"
                    }`}
                    onClick={() => {
                      setPaymentMode("Pay Later");
                      setShowRemarksInput(true);
                    }}
                    disabled={items.length === 0}
                  >
                    Pay Later
                  </Button>
                </div>

                {/* Remarks Input for Pay Later */}
                {showRemarksInput && paymentMode === "Pay Later" && (
                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Remarks <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Enter reason for Pay Later (e.g., Credit purchase, Due payment, etc.)"
                      value={payLaterRemarks}
                      onChange={(e) => setPayLaterRemarks(e.target.value)}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required: Please provide remarks for this Pay Later
                      transaction
                    </p>
                  </div>
                )}

                {items.length > 0 && !paymentMode && (
                  <p className="text-xs text-amber-600">
                    Please select payment mode
                  </p>
                )}
                {paymentMode === "Pay Later" &&
                  showRemarksInput &&
                  !payLaterRemarks.trim() && (
                    <p className="text-xs text-red-500">
                      Remarks is required for Pay Later
                    </p>
                  )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <Button
                  className="w-full cursor-pointer"
                  size="lg"
                  onClick={handleCompletePurchase} // Change from direct call to handleCompletePurchase
                  disabled={
                    !selectedSupplier ||
                    !invoiceNumber ||
                    !invoiceDate ||
                    !placeOfSupply ||
                    !items ||
                    items.length === 0 ||
                    isLoading ||
                    !purchaseId ||
                    !paymentMode ||
                    (paymentMode === "Pay Later" && !payLaterRemarks.trim())
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Complete Purchase
                    </>
                  )}
                </Button>
              </div>

              {/* Items Count */}
              {/* <div className="text-center text-sm text-gray-500 pt-2">
                Total Items: {items?.length || 0}
              </div> */}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Supplier Dialog */}
      <Dialog
        open={showNewSupplierDialog}
        onOpenChange={setShowNewSupplierDialog}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <SupplierForm
            // initialData={supplierSearch ? { name: supplierSearch } : undefined}
            onSubmit={handleCreateSupplier}
            isLoading={isLoadingSuppliers}
            onCancel={() => setShowNewSupplierDialog(false)}
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

            {/* Add quantity selector */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium">Quantity:</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {multipleProducts.map((product) => (
                <div
                  key={product._id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleAddSelectedProduct(product)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {product.productName}
                      </p>
                      <div className="text-sm text-gray-500 mt-1">
                        {product.color && <span>Color: {product.color}</span>}
                        {product.size && (
                          <span className="ml-2">Size: {product.size}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Stock: {product.quantity} units
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-indigo-600">
                        ₹{product.purchasePrice}
                      </p>
                      <Button size="sm" variant="outline" className="mt-2">
                        Select
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={showBulkAddDialog} onOpenChange={setShowBulkAddDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Multiple Quantities</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-lg font-medium">{bulkProduct?.productName}</p>
              <p className="text-sm text-gray-500 mt-1">
                Purchase Price: ₹{bulkProduct?.purchasePrice}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity:</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setBulkQuantity(Math.max(1, bulkQuantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={bulkQuantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      setBulkQuantity(val);
                    } else if (e.target.value === "") {
                      setBulkQuantity(1);
                    }
                  }}
                  className="flex-1 text-center text-lg"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setBulkQuantity(bulkQuantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Use +/- buttons or type quantity directly
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>
                  ₹
                  {((bulkProduct?.purchasePrice || 0) * bulkQuantity).toFixed(
                    2,
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Tax ({bulkProduct?.purchaseTax || 0}%):</span>
                <span>
                  ₹
                  {(
                    ((bulkProduct?.purchasePrice || 0) *
                      bulkQuantity *
                      (bulkProduct?.purchaseTax || 0)) /
                    100
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                <span>Total:</span>
                <span className="text-indigo-600">
                  ₹
                  {(
                    (bulkProduct?.purchasePrice || 0) * bulkQuantity +
                    ((bulkProduct?.purchasePrice || 0) *
                      bulkQuantity *
                      (bulkProduct?.purchaseTax || 0)) /
                      100
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowBulkAddDialog(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleBulkAdd}>
                Add {bulkQuantity} Items
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Product Dialog */}
      <CreateProductDialog
        open={showCreateProductDialog}
        onOpenChange={setShowCreateProductDialog}
        barcode={scannedBarcode}
        onProductCreated={() => {
          setTimeout(() => {
            scanBarcode(scannedBarcode, quantity);
          }, 500);
        }}
      />
    </div>
  );
}

//app/(dashboard)/user/suppliers/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  Supplier,
} from "@/lib/api/suppliers";
import SupplierForm, {
  SupplierFormData,
} from "@/components/forms/SupplierForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import SuppliersSkeleton from "@/components/skeletons/SuppliersSkeleton";

export default function SuppliersPage() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const response = await getSuppliers();
      if (response.success && response.data) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error("Fetch suppliers error:", error);
      toast.error("Failed to load suppliers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter((supplier: Supplier) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(searchLower) ||
      supplier.email?.toLowerCase().includes(searchLower) ||
      supplier.mobile?.includes(searchTerm) ||
      supplier.city.toLowerCase().includes(searchLower) ||
      supplier.gstIn.toLowerCase().includes(searchLower) ||
      supplier.pincode.includes(searchTerm)
    );
  });

  // Handle create supplier
  const handleCreateSupplier = async (data: SupplierFormData) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const response = await createSupplier(data);

      if (response.success) {
        toast.success("Supplier created successfully!");
        setIsCreateOpen(false);
        fetchSuppliers();
      }
    } catch (error: any) {
      console.error("Create supplier error:", error);
      toast.error(error.response?.data?.message || "Failed to create supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update supplier
  const handleUpdateSupplier = async (data: SupplierFormData) => {
    if (!selectedSupplier || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const response = await updateSupplier(selectedSupplier._id, data);

      if (response.success) {
        toast.success("Supplier updated successfully!");
        setIsEditOpen(false);
        setSelectedSupplier(null);
        fetchSuppliers();
      }
    } catch (error: any) {
      console.error("Update supplier error:", error);
      toast.error(error.response?.data?.message || "Failed to update supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete supplier
  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    try {
      const response = await deleteSupplier(selectedSupplier._id);
      if (response.success) {
        toast.success("Supplier deleted successfully!");
        setIsDeleteOpen(false);
        setSelectedSupplier(null);
        fetchSuppliers();
      }
    } catch (error: any) {
      console.error("Delete supplier error:", error);
      toast.error(error.response?.data?.message || "Failed to delete supplier");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-gray-500">
            Manage your suppliers and their information
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search suppliers by name, email, phone, city, GST, pincode..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
            className="pl-10"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      {isLoading ? (
        <SuppliersSkeleton count={6} />
      ) : filteredSuppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg mb-2">No suppliers found</p>
            <p className="text-gray-400 text-sm">
              {searchTerm
                ? "Try adjusting your search"
                : "Click the button above to add your first supplier"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredSuppliers.map((supplier: Supplier) => (
            <Card
              key={supplier._id}
              className="hover:shadow-lg transition-shadow flex flex-col h-full"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {/* <Building2 className="w-5 h-5 text-blue-600" /> */}
                    <div>
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <div className="flex items-center gap-1 mt-1">
                        <CreditCard className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          GST: {supplier.gstIn}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                {/* Contact Info */}
                <div className="space-y-2">
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{supplier.email}</span>
                    </div>
                  )}
                  {supplier.mobile && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{supplier.mobile}</span>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span>
                    {[
                      supplier.address,
                      supplier.city,
                      supplier.state,
                      supplier.country,
                      supplier.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>

                <p className="text-xs text-gray-400 mt-auto pt-2">
                  Added: {format(new Date(supplier.createdAt), "dd MMM yyyy")}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 mt-auto border-t pt-4">
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSupplier(supplier);
                    setIsEditOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  className="cursor-pointer"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setSelectedSupplier(supplier);
                    setIsDeleteOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Supplier Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <SupplierForm
            onSubmit={handleCreateSupplier}
            isLoading={isSubmitting}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <SupplierForm
              initialData={{
                name: selectedSupplier.name,
                email: selectedSupplier.email,
                mobile: selectedSupplier.mobile,
                address: selectedSupplier.address,
                country: selectedSupplier.country,
                state: selectedSupplier.state,
                city: selectedSupplier.city,
                pincode: selectedSupplier.pincode,
                gstIn: selectedSupplier.gstIn,
              }}
              onSubmit={handleUpdateSupplier}
              isLoading={isSubmitting}
              onCancel={() => {
                setIsEditOpen(false);
                setSelectedSupplier(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              supplier "{selectedSupplier?.name}" and remove all associated
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSupplier(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSupplier}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

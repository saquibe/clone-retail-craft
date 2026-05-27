"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  CreditCard,
  Loader2,
} from "lucide-react";
import CountryStateCitySelector from "../common/CountryStateCitySelector";

// Supplier schema
const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  mobile: z
    .string()
    .regex(/^\d{10}$/, "Mobile must be 10 digits")
    .optional()
    .or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  pincode: z
    .string()
    .min(1, "Pincode is required")
    .regex(/^\d{6}$/, "Pincode must be 6 digits"),
  gstIn: z.string().min(1, "GST number is required"),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  initialData?: Partial<SupplierFormData>;
  onSubmit: (data: SupplierFormData) => Promise<void> | void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export default function SupplierForm({
  initialData,
  onSubmit,
  isLoading = false,
  onCancel,
}: SupplierFormProps) {
  const methods = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      mobile: initialData?.mobile || "",
      address: initialData?.address || "",
      country: initialData?.country || "",
      state: initialData?.state || "",
      city: initialData?.city || "",
      pincode: initialData?.pincode || "",
      gstIn: initialData?.gstIn || "",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = methods;

  const handleFormSubmit = (data: SupplierFormData) => {
    onSubmit(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supplier Name with Icon */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Supplier Name *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  {...register("name")}
                  error={errors.name?.message}
                  placeholder="Enter supplier name"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Email with Icon */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="email"
                  {...register("email")}
                  error={errors.email?.message}
                  placeholder="Enter email address"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Mobile with Icon */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Mobile
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  {...register("mobile")}
                  error={errors.mobile?.message}
                  placeholder="Enter 10 digit mobile number"
                  className="pl-10"
                  maxLength={10}
                  inputMode="numeric"
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(
                      /\D/g,
                      "",
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Address *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              {...register("address")}
              error={errors.address?.message}
              placeholder="Enter supplier address"
              className="pl-10"
            />
          </div>
        </div>

        {/* Location Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CountryStateCitySelector
              countryField="country"
              stateField="state"
              cityField="city"
              required
            />
          </div>

          {/* Pincode - Full width on mobile, 1/3 on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Pincode *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  {...register("pincode")}
                  error={errors.pincode?.message}
                  placeholder="Enter 6 digit pincode"
                  className="pl-10"
                  maxLength={6}
                  inputMode="numeric"
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(
                      /\D/g,
                      "",
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* GST Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GST Number with Icon */}
            <div className="md:col-span-1">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                GST Number *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  {...register("gstIn")}
                  error={errors.gstIn?.message}
                  placeholder="Enter GST number"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="cursor-pointer"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer min-w-[140px]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </div>
            ) : initialData ? (
              "Update Supplier"
            ) : (
              "Create Supplier"
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

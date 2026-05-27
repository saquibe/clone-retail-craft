"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Building2, User, Mail, Phone, Briefcase, Loader2 } from "lucide-react";
import CountryStateCitySelector from "../common/CountryStateCitySelector";

// Base schema for common fields
const baseCustomerSchema = {
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .regex(/^\d{10}$/, "Mobile must be 10 digits"),
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
};

// B2B specific schema
const b2bSchema = z.object({
  customerType: z.literal("B2B"),
  ...baseCustomerSchema,
  companyName: z.string().min(1, "Company name is required"),
  GstRegistrationType: z.string().min(1, "GST registration type is required"),
  gstIn: z.string().min(1, "GST number is required"),
  contactName: z.string().optional(),
  contactNumber: z
    .string()
    .regex(/^\d{10}$/, "Contact number must be 10 digits")
    .optional()
    .or(z.literal("")),
  contactEmail: z
    .string()
    .email("Invalid contact email")
    .optional()
    .or(z.literal("")),
});

// B2C specific schema
const b2cSchema = z.object({
  customerType: z.literal("B2C"),
  ...baseCustomerSchema,
});

// Combined schema with discriminated union
const customerSchema = z.discriminatedUnion("customerType", [
  b2bSchema,
  b2cSchema,
]);

export type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  initialData?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => Promise<void> | void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export default function CustomerForm({
  initialData,
  onSubmit,
  isLoading = false,
  onCancel,
}: CustomerFormProps) {
  const [customerType, setCustomerType] = useState<"B2B" | "B2C">(
    initialData?.customerType || "B2C",
  );

  // Narrowed view for B2B-specific initial fields
  const b2bInitial = initialData as
    | Partial<z.infer<typeof b2bSchema>>
    | undefined;

  const methods = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerType: customerType,
      name: initialData?.name || "",
      email: initialData?.email || "",
      mobile: initialData?.mobile || "",
      address: initialData?.address || "Kukatpally",
      country: initialData?.country || "India",
      state: initialData?.state || "Telangana",
      city: initialData?.city || "Hyderabad",
      ...(customerType === "B2B" && {
        companyName: b2bInitial?.companyName || "",
        GstRegistrationType: b2bInitial?.GstRegistrationType || "",
        gstIn: b2bInitial?.gstIn || "",
        contactName: b2bInitial?.contactName || "",
        contactNumber: b2bInitial?.contactNumber || "",
        contactEmail: b2bInitial?.contactEmail || "",
      }),
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  // Update customer type when tab changes
  useEffect(() => {
    setValue("customerType", customerType);
  }, [customerType, setValue]);

  const handleFormSubmit = (data: CustomerFormData) => {
    onSubmit(data);
  };

  useEffect(() => {
    if (!initialData) {
      setValue("country", "India");
      setValue("state", "Telangana");
      setValue("city", "Hyderabad");
    }
  }, []);

  // GST Registration Type options
  const gstRegistrationTypes = [
    { value: "Regular", label: "Regular" },
    { value: "Composition", label: "Composition" },
    { value: "Casual", label: "Casual" },
    { value: "Non-Resident", label: "Non-Resident" },
    { value: "Input Service Distributor", label: "Input Service Distributor" },
  ];

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Customer Type Tabs */}
        <Tabs
          value={customerType}
          onValueChange={(value) => setCustomerType(value as "B2B" | "B2C")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="B2C"
              className="flex items-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4" />
              B2C Customer
            </TabsTrigger>
            <TabsTrigger
              value="B2B"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              B2B Customer
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Hidden field for customerType */}
        <input
          type="hidden"
          {...register("customerType")}
          value={customerType}
        />

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Name with Icon */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Customer Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  {...register("name")}
                  error={errors.name?.message}
                  placeholder="Enter customer name"
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
                Mobile *
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
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Address *
          </label>
          <Input
            {...register("address")}
            error={errors.address?.message}
            placeholder="Enter customer address"
          />
        </div>

        {/* Location Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">
            Location Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CountryStateCitySelector
              countryField="country"
              stateField="state"
              cityField="city"
              required
            />
          </div>
        </div>

        {/* B2B Specific Fields */}
        {customerType === "B2B" && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">
              Business Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name with Icon */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Company Name *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    {...register("companyName")}
                    error={(errors as any).companyName?.message}
                    placeholder="Enter company name"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* GST Registration Type */}
              <div className="space-y-2">
                <Label htmlFor="GstRegistrationType">
                  GST Registration Type <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="GstRegistrationType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="GstRegistrationType"
                        className={`w-full ${
                          (errors as any).GstRegistrationType?.message
                            ? "border-red-500"
                            : ""
                        }`}
                      >
                        <SelectValue placeholder="Select registration type" />
                      </SelectTrigger>
                      <SelectContent>
                        {gstRegistrationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {(errors as any).GstRegistrationType && (
                  <p className="text-sm text-red-500">
                    {(errors as any).GstRegistrationType?.message}
                  </p>
                )}
              </div>

              {/* GST Number */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  GST Number *
                </label>
                <Input
                  {...register("gstIn")}
                  error={(errors as any).gstIn?.message}
                  placeholder="Enter GST number"
                />
              </div>

              {/* Contact Person Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Contact Person Name
                </label>
                <Input
                  {...register("contactName")}
                  error={(errors as any).contactName?.message}
                  placeholder="Enter contact person name"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Contact Number
                </label>
                <Input
                  {...register("contactNumber")}
                  error={(errors as any).contactNumber?.message}
                  placeholder="Enter contact number"
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

              {/* Contact Email */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Contact Email
                </label>
                <Input
                  type="email"
                  {...register("contactEmail")}
                  error={(errors as any).contactEmail?.message}
                  placeholder="Enter contact email"
                />
              </div>
            </div>
          </div>
        )}

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
              "Update Customer"
            ) : (
              "Create Customer"
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

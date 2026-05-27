"use client";

import { useEffect, useState } from "react";
import { Country, State } from "country-state-city";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";

interface StateSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  defaultCountry?: string;
  defaultState?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function StateSelector({
  value,
  onChange,
  label = "State",
  defaultCountry = "India",
  defaultState = "Karnataka",
  required = true,
  disabled = false,
}: StateSelectorProps) {
  const [states, setStates] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const country = Country.getAllCountries().find(
      (c) => c.name === defaultCountry,
    );

    if (!country) return;

    const statesData = State.getStatesOfCountry(country.isoCode).map(
      (state) => ({
        value: state.name,
        label: state.name,
      }),
    );

    setStates(statesData);

    if (!value) {
      onChange(defaultState);
    }
  }, []);

  return (
    <div className="space-y-2">
      {/* <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label> */}

      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select state" />
        </SelectTrigger>

        <SelectContent>
          {states.map((state) => (
            <SelectItem key={state.value} value={state.value}>
              {state.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

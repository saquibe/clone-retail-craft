"use client";

import { useState, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Country, State, City } from "country-state-city";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

// Default values
const DEFAULT_COUNTRY = "India";
const DEFAULT_STATE = "Telangana";
const DEFAULT_CITY = "Hyderabad";
const DEFAULT_TIMEZONE = "Asia/Kolkata";

// Get all countries with their ISO codes for matching
const countries = Country.getAllCountries().map((country) => ({
  value: country.name,
  label: country.name,
  isoCode: country.isoCode,
}));

// Create a map for easy lookup
const countryByCode = new Map(countries.map((c) => [c.isoCode, c.value]));

interface CountryStateCitySelectorProps {
  countryField: string;
  stateField: string;
  cityField: string;
  timeZoneField?: string;
  required?: boolean;
}

interface LocationData {
  country: string;
  state: string;
  city: string;
  timezone: string;
}

export default function CountryStateCitySelector({
  countryField,
  stateField,
  cityField,
  timeZoneField,
  required = true,
}: CountryStateCitySelectorProps) {
  const [states, setStates] = useState<{ value: string; label: string }[]>([]);
  const [cities, setCities] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(
    null,
  );

  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const selectedCountry = watch(countryField);
  const selectedState = watch(stateField);
  const currentTimezone = timeZoneField ? watch(timeZoneField) : null;

  // Fetch location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");

        if (!response.ok) {
          throw new Error("Failed to fetch location");
        }

        const data = await response.json();

        // Match country using country code (IN -> India)
        let countryName = DEFAULT_COUNTRY;
        if (data.country_code) {
          const matchedCountry = countryByCode.get(data.country_code);
          if (matchedCountry) {
            countryName = matchedCountry;
          }
        }

        const location = {
          country: countryName,
          state: data.region || DEFAULT_STATE,
          city: data.city || DEFAULT_CITY,
          timezone: data.timezone || DEFAULT_TIMEZONE,
        };

        setDetectedLocation(location);

        // Set timezone if field is provided and not already set
        if (timeZoneField && !currentTimezone) {
          setValue(timeZoneField, location.timezone, {
            shouldValidate: true,
            shouldDirty: false,
          });
        }
      } catch (error) {
        console.error("Error detecting location:", error);
        // Set default values on error
        const defaultLocation = {
          country: DEFAULT_COUNTRY,
          state: DEFAULT_STATE,
          city: DEFAULT_CITY,
          timezone: DEFAULT_TIMEZONE,
        };

        setDetectedLocation(defaultLocation);

        // Set default timezone if field is provided and not already set
        if (timeZoneField && !currentTimezone) {
          setValue(timeZoneField, defaultLocation.timezone, {
            shouldValidate: true,
            shouldDirty: false,
          });
        }
      } finally {
        setIsLoadingLocation(false);
      }
    };

    fetchLocation();
  }, [timeZoneField, setValue, currentTimezone]);

  // Set country once detected
  useEffect(() => {
    if (detectedLocation && !selectedCountry) {
      setValue(countryField, detectedLocation.country, {
        shouldValidate: true,
        shouldDirty: false,
      });
    }
  }, [detectedLocation, countryField, setValue, selectedCountry]);

  // Update states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const countryObj = Country.getAllCountries().find(
        (c) => c.name === selectedCountry,
      );

      if (!countryObj) return;

      const countryStates = State.getStatesOfCountry(countryObj.isoCode).map(
        (state) => ({
          value: state.name,
          label: state.name,
          isoCode: state.isoCode,
        }),
      );

      setStates(countryStates);

      // If we have detected location and country matches, set the state
      if (detectedLocation && detectedLocation.country === selectedCountry) {
        // Check if detected state exists in the states list
        const stateExists = countryStates.some(
          (s) => s.value === detectedLocation.state,
        );
        if (stateExists && !selectedState) {
          setValue(stateField, detectedLocation.state, {
            shouldValidate: true,
            shouldDirty: false,
          });
        } else if (!selectedState && countryStates.length > 0) {
          // Fallback to first state if detected state doesn't exist
          setValue(stateField, countryStates[0]?.value || "", {
            shouldValidate: true,
            shouldDirty: false,
          });
        }
      } else if (!selectedState && countryStates.length > 0) {
        // For other countries, leave empty
        setValue(stateField, "", {
          shouldValidate: true,
          shouldDirty: false,
        });
      }
    } else {
      setStates([]);
      setCities([]);
    }
  }, [selectedCountry, detectedLocation, stateField, setValue, selectedState]);

  // Update cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const countryObj = Country.getAllCountries().find(
        (c) => c.name === selectedCountry,
      );

      if (!countryObj) return;

      const stateObj = State.getStatesOfCountry(countryObj.isoCode).find(
        (s) => s.name === selectedState,
      );

      if (!stateObj) return;

      const stateCities = City.getCitiesOfState(
        countryObj.isoCode,
        stateObj.isoCode,
      ).map((city) => ({
        value: city.name,
        label: city.name,
      }));

      setCities(stateCities);

      // If we have detected location and country/state match, set the city
      if (
        detectedLocation &&
        detectedLocation.country === selectedCountry &&
        detectedLocation.state === selectedState &&
        stateCities.length > 0
      ) {
        // normalize for safe comparison
        const normalize = (str: string) => str.toLowerCase().trim();

        const matchedCity = stateCities.find(
          (c) => normalize(c.value) === normalize(detectedLocation.city),
        );

        if (!watch(cityField)) {
          setValue(cityField, matchedCity?.value || stateCities[0].value, {
            shouldValidate: true,
            shouldDirty: false,
          });
        }
      }
    } else {
      setCities([]);
    }
  }, [selectedCountry, selectedState, detectedLocation, cityField, setValue]);

  if (isLoadingLocation) {
    return (
      <div className="flex items-center justify-center py-4 text-sm text-gray-500 col-span-3">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Detecting your location...
      </div>
    );
  }

  return (
    <>
      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor={countryField}>
          Country {required && <span className="text-red-500">*</span>}
        </Label>
        <Controller
          name={countryField}
          control={control}
          render={({ field, fieldState }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={!countries.length}
            >
              <SelectTrigger
                id={countryField}
                className={`w-full cursor-pointer ${
                  fieldState.error ? "border-red-500" : ""
                }`}
              >
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors[countryField] && (
          <p className="text-sm text-red-500">
            {errors[countryField]?.message as string}
          </p>
        )}
      </div>

      {/* State */}
      <div className="space-y-2">
        <Label htmlFor={stateField}>
          State {required && <span className="text-red-500">*</span>}
        </Label>
        <Controller
          name={stateField}
          control={control}
          render={({ field, fieldState }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={!selectedCountry || !states.length}
            >
              <SelectTrigger
                id={stateField}
                className={`w-full cursor-pointer ${
                  fieldState.error ? "border-red-500" : ""
                }`}
              >
                <SelectValue
                  placeholder={
                    selectedCountry ? "Select state" : "Select country first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors[stateField] && (
          <p className="text-sm text-red-500">
            {errors[stateField]?.message as string}
          </p>
        )}
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor={cityField}>
          City {required && <span className="text-red-500">*</span>}
        </Label>
        <Controller
          name={cityField}
          control={control}
          render={({ field, fieldState }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={!selectedState || !cities.length}
            >
              <SelectTrigger
                id={cityField}
                className={`w-full cursor-pointer ${
                  fieldState.error ? "border-red-500" : ""
                }`}
              >
                <SelectValue
                  placeholder={
                    selectedState ? "Select city" : "Select state first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors[cityField] && (
          <p className="text-sm text-red-500">
            {errors[cityField]?.message as string}
          </p>
        )}
      </div>
    </>
  );
}

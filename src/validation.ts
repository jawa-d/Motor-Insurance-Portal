import { z } from "zod";
import type { FormState } from "./types";

const currentYear = new Date().getFullYear() + 1;

const optionalNumber = (messages: { valueInvalid: string }, min?: number, max?: number) =>
  z
    .string()
    .trim()
    .refine((value) => {
      if (!value) return true;

      const numberValue = Number(value);
      if (!Number.isFinite(numberValue)) return false;
      if (min !== undefined && numberValue < min) return false;
      if (max !== undefined && numberValue > max) return false;

      return true;
    }, messages.valueInvalid);

export const createSchema = (messages: {
  fieldRequired: string;
  emailInvalid: string;
  phoneInvalid: string;
  yearInvalid: string;
  valueInvalid: string;
  confirmRequired: string;
}) =>
  z.object({
    fullName: z.string(),
    phone: z
      .string()
      .trim()
      .refine((value) => !value || value.replace(/\D/g, "").length >= 10, messages.phoneInvalid),
    email: z.union([z.literal(""), z.string().email(messages.emailInvalid)]),
    nationalId: z.string(),
    address: z.string(),
    city: z.string(),
    vehicleType: z.string(),
    manufacturer: z.string(),
    model: z.string(),
    year: optionalNumber({ valueInvalid: messages.yearInvalid }, 1950, currentYear),
    color: z.string(),
    plateNumber: z.string(),
    chassisNumber: z.string(),
    engineNumber: z.string(),
    estimatedValue: optionalNumber({ valueInvalid: messages.valueInvalid }, 1),
    notes: z.string(),
    confirmed: z.boolean(),
  });

export const initialForm: FormState = {
  fullName: "",
  phone: "",
  email: "",
  nationalId: "",
  address: "",
  city: "",
  vehicleType: "",
  manufacturer: "",
  model: "",
  year: "",
  color: "",
  plateNumber: "",
  chassisNumber: "",
  engineNumber: "",
  estimatedValue: "",
  notes: "",
  confirmed: false,
};

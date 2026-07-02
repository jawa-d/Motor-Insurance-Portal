import { z } from "zod";
import type { FormState } from "./types";

const currentYear = new Date().getFullYear() + 1;

export const createSchema = (messages: {
  fieldRequired: string;
  emailInvalid: string;
  phoneInvalid: string;
  yearInvalid: string;
  valueInvalid: string;
  confirmRequired: string;
}) =>
  z.object({
    fullName: z.string().trim().min(1, messages.fieldRequired),
    phone: z
      .string()
      .trim()
      .refine((value) => value.replace(/\D/g, "").length >= 10, messages.phoneInvalid),
    email: z.union([z.literal(""), z.string().email(messages.emailInvalid)]),
    nationalId: z.string().trim().min(1, messages.fieldRequired),
    address: z.string().trim().min(1, messages.fieldRequired),
    city: z.string().trim().min(1, messages.fieldRequired),
    vehicleType: z.string().trim().min(1, messages.fieldRequired),
    manufacturer: z.string().trim().min(1, messages.fieldRequired),
    model: z.string().trim().min(1, messages.fieldRequired),
    year: z.coerce
      .number({ error: messages.yearInvalid })
      .int(messages.yearInvalid)
      .min(1950, messages.yearInvalid)
      .max(currentYear, messages.yearInvalid),
    color: z.string().trim().min(1, messages.fieldRequired),
    plateNumber: z.string().trim().min(1, messages.fieldRequired),
    chassisNumber: z.string().trim().min(1, messages.fieldRequired),
    engineNumber: z.string().trim().min(1, messages.fieldRequired),
    estimatedValue: z.coerce.number({ error: messages.valueInvalid }).positive(messages.valueInvalid),
    notes: z.string(),
    confirmed: z.literal(true, { error: messages.confirmRequired }),
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

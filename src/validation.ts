import { z } from "zod";
import type { FormState } from "./types";

const requiredText = (message: string) => z.string().trim().min(1, message);

export const createSchema = (messages: {
  fieldRequired: string;
}) =>
  z.object({
    fullName: requiredText(messages.fieldRequired),
    phone: requiredText(messages.fieldRequired),
    email: z.string(),
    nationalId: requiredText(messages.fieldRequired),
    address: requiredText(messages.fieldRequired),
    city: requiredText(messages.fieldRequired),
    vehicleType: requiredText(messages.fieldRequired),
    manufacturer: requiredText(messages.fieldRequired),
    model: requiredText(messages.fieldRequired),
    year: requiredText(messages.fieldRequired),
    color: requiredText(messages.fieldRequired),
    plateNumber: requiredText(messages.fieldRequired),
    chassisNumber: requiredText(messages.fieldRequired),
    engineNumber: requiredText(messages.fieldRequired),
    estimatedValue: requiredText(messages.fieldRequired),
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

import { z } from "zod";
import type { EngineeringFormState, FormState } from "./types";

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

export const createEngineeringSchema = (messages: {
  fieldRequired: string;
}) =>
  z.object({
    fullName: requiredText(messages.fieldRequired),
    mobile: requiredText(messages.fieldRequired),
    email: z.string(),
    nationalId: z.string(),
    address: z.string(),
    city: z.string(),
    projectName: requiredText(messages.fieldRequired),
    projectType: requiredText(messages.fieldRequired),
    projectLocation: requiredText(messages.fieldRequired),
    contractValue: requiredText(messages.fieldRequired),
    currency: requiredText(messages.fieldRequired),
    insuranceType: requiredText(messages.fieldRequired),
    startDate: z.string(),
    endDate: z.string(),
    contractorName: z.string(),
    ownerName: z.string(),
    riskDetails: z.string(),
    notes: z.string(),
    confirmed: z.boolean(),
  });

export const initialEngineeringForm: EngineeringFormState = {
  fullName: "",
  mobile: "",
  email: "",
  nationalId: "",
  address: "",
  city: "Baghdad",
  projectName: "",
  projectType: "",
  projectLocation: "",
  contractValue: "",
  currency: "IQD",
  insuranceType: "Contractors All Risks",
  startDate: "",
  endDate: "",
  contractorName: "",
  ownerName: "",
  riskDetails: "",
  notes: "",
  confirmed: false,
};

import type { EngineeringFormState } from "../types";
import { postJson } from "./api";

type EngineeringRequestResponse = {
  success?: boolean;
  requestId?: string;
  requestNumber?: string;
  trackingNumber?: string;
  status?: string;
  message?: string;
  details?: Array<{
    path?: string;
    message?: string;
  }>;
};

const localizedDigitMap: Record<string, string> = {
  "Ù ": "0",
  "Ù¡": "1",
  "Ù¢": "2",
  "Ù£": "3",
  "Ù¤": "4",
  "Ù¥": "5",
  "Ù¦": "6",
  "Ù§": "7",
  "Ù¨": "8",
  "Ù©": "9",
  "Û°": "0",
  "Û±": "1",
  "Û²": "2",
  "Û³": "3",
  "Û´": "4",
  "Ûµ": "5",
  "Û¶": "6",
  "Û·": "7",
  "Û¸": "8",
  "Û¹": "9",
};

function normalizeNumericInput(value: string) {
  return value
    .trim()
    .replace(/[Ù -Ù©Û°-Û¹]/g, (digit) => localizedDigitMap[digit] ?? digit)
    .replace(/[\u066B\uFF0E]/g, ".")
    .replace(/[\u066C,_\s\u00A0\u202F]/g, "")
    .replace(/[^\d.+-]/g, "");
}

function toRequiredNumber(value: string, fieldName: string) {
  const numberValue = Number(normalizeNumericInput(value));

  if (!Number.isFinite(numberValue)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }

  return numberValue;
}

function toIsoDate(value: string) {
  return value ? new Date(value).toISOString() : "";
}

function cleanOptional(value: string) {
  return value.trim() || undefined;
}

export async function submitEngineeringRequest(form: EngineeringFormState, agentCode?: string) {
  const optionalCustomerFields = {
    ...(cleanOptional(form.email) ? { email: cleanOptional(form.email) } : {}),
    ...(cleanOptional(form.nationalId) ? { nationalId: cleanOptional(form.nationalId) } : {}),
    ...(cleanOptional(form.address) ? { address: cleanOptional(form.address) } : {}),
    ...(cleanOptional(form.city) ? { city: cleanOptional(form.city) } : {}),
  };
  const optionalProjectFields = {
    ...(form.startDate ? { startDate: new Date(form.startDate).toISOString() } : {}),
    ...(form.endDate ? { endDate: new Date(form.endDate).toISOString() } : {}),
    ...(cleanOptional(form.contractorName) ? { contractorName: cleanOptional(form.contractorName) } : {}),
    ...(cleanOptional(form.ownerName) ? { ownerName: cleanOptional(form.ownerName) } : {}),
    ...(cleanOptional(form.riskDetails) ? { riskDetails: cleanOptional(form.riskDetails) } : {}),
  };

  const payload = {
    submissionToken: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : undefined,
    customer: {
      fullName: form.fullName.trim(),
      mobile: form.mobile.trim(),
      ...optionalCustomerFields,
    },
    project: {
      name: form.projectName.trim(),
      type: form.projectType.trim(),
      location: form.projectLocation.trim(),
      contractValue: toRequiredNumber(form.contractValue, "project.contractValue"),
      currency: form.currency.trim() || "IQD",
      insuranceType: form.insuranceType.trim(),
      ...optionalProjectFields,
    },
    documents: [],
    ...(cleanOptional(form.notes) ? { notes: cleanOptional(form.notes) } : {}),
    agentCode: agentCode || "external-engineering-form",
  };

  const response = await postJson<EngineeringRequestResponse>("/api/v1/public/engineering-requests", payload);

  if (response.success === false) {
    const details = response.details
      ?.map((detail) => [detail.path, detail.message].filter(Boolean).join(": "))
      .filter(Boolean)
      .join("، ");

    throw new Error(details || response.message || "Failed to submit request.");
  }

  if (!response.requestNumber && !response.trackingNumber) {
    throw new Error("Request number was not returned.");
  }

  return {
    requestId: response.requestId,
    requestNumber: response.requestNumber ?? response.trackingNumber ?? "",
    trackingNumber: response.trackingNumber ?? response.requestNumber ?? "",
    status: response.status ?? "SUBMITTED",
    message: response.message,
  };
}

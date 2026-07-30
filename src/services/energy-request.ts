import type { EnergyFormState } from "../types";
import { postJson } from "./api";

type EnergyRequestResponse = {
  success?: boolean;
  requestId?: string;
  requestNumber?: string;
  trackingNumber?: string;
  status?: string;
  message?: string;
  details?: Array<{ path?: string; message?: string }>;
};

const localizedDigitMap: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

function normalizeNumericInput(value: string) {
  return value
    .trim()
    .replace(/[٠-٩۰-۹]/g, (digit) => localizedDigitMap[digit] ?? digit)
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

function toOptionalNumber(value: string, fieldName: string) {
  return value.trim() ? toRequiredNumber(value, fieldName) : undefined;
}

function cleanOptional(value: string) {
  return value.trim() || undefined;
}

function createSubmissionToken() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function submitEnergyRequest(form: EnergyFormState, agentCode?: string) {
  const capacityMw = toOptionalNumber(form.capacityMw, "energy.capacityMw");
  const businessInterruptionLimit = toOptionalNumber(form.businessInterruptionLimit, "energy.businessInterruptionLimit");
  const liabilityLimit = toOptionalNumber(form.liabilityLimit, "energy.liabilityLimit");

  const payload = {
    submissionToken: createSubmissionToken(),
    customer: {
      fullName: form.fullName.trim(),
      mobile: form.mobile.trim(),
      ...(cleanOptional(form.email) ? { email: cleanOptional(form.email) } : {}),
      nationalId: form.nationalId.trim(),
      ...(cleanOptional(form.address) ? { address: cleanOptional(form.address) } : {}),
      city: form.city.trim(),
    },
    energy: {
      insuredName: form.insuredName.trim(),
      projectName: form.projectName.trim(),
      energyType: form.energyType.trim(),
      facilityType: form.facilityType.trim(),
      projectLocation: form.projectLocation.trim(),
      projectCity: form.projectCity.trim(),
      ...(cleanOptional(form.operatorName) ? { operatorName: cleanOptional(form.operatorName) } : {}),
      ...(cleanOptional(form.contractorName) ? { contractorName: cleanOptional(form.contractorName) } : {}),
      ...(capacityMw !== undefined ? { capacityMw } : {}),
      assetValue: toRequiredNumber(form.assetValue, "energy.assetValue"),
      ...(businessInterruptionLimit !== undefined ? { businessInterruptionLimit } : {}),
      ...(liabilityLimit !== undefined ? { liabilityLimit } : {}),
      totalSumInsured: toRequiredNumber(form.totalSumInsured, "energy.totalSumInsured"),
      currency: form.currency.trim() || "IQD",
      coverageScope: form.coverageScope.trim(),
      ...(cleanOptional(form.riskDetails) ? { riskDetails: cleanOptional(form.riskDetails) } : {}),
      hasFireProtection: form.hasFireProtection,
      hasMaintenancePlan: form.hasMaintenancePlan,
      previousLosses: form.previousLosses,
    },
    documents: [],
    ...(cleanOptional(form.notes) ? { notes: cleanOptional(form.notes) } : {}),
    agentCode: agentCode || "external-energy-form",
  };

  const response = await postJson<EnergyRequestResponse>("/api/v1/public/energy-requests", payload);

  if (response.success === false) {
    const details = response.details
      ?.map((detail) => [detail.path, detail.message].filter(Boolean).join(": "))
      .filter(Boolean)
      .join(", ");

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

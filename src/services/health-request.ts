import type { HealthFormState } from "../types";
import { postJson } from "./api";

type HealthRequestResponse = {
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

function toIsoDate(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

export async function submitHealthRequest(form: HealthFormState, agentCode?: string) {
  const payload = {
    submissionToken: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : undefined,
    customer: {
      fullName: form.fullName.trim(),
      mobile: form.mobile.trim(),
      ...(cleanOptional(form.email) ? { email: cleanOptional(form.email) } : {}),
      nationalId: form.nationalId.trim(),
      ...(cleanOptional(form.address) ? { address: cleanOptional(form.address) } : {}),
      city: form.city.trim(),
      age: toRequiredNumber(form.age, "customer.age"),
      gender: form.gender.trim(),
    },
    health: {
      planType: form.planType.trim(),
      coverageScope: form.coverageScope.trim(),
      insuredMembersCount: toRequiredNumber(form.insuredMembersCount, "health.insuredMembersCount"),
      ...(cleanOptional(form.companyName) ? { companyName: cleanOptional(form.companyName) } : {}),
      ...(cleanOptional(form.occupation) ? { occupation: cleanOptional(form.occupation) } : {}),
      hasChronicConditions: form.hasChronicConditions,
      ...(cleanOptional(form.chronicConditions) ? { chronicConditions: cleanOptional(form.chronicConditions) } : {}),
      previousInsurance: form.previousInsurance,
      ...(cleanOptional(form.previousInsurer) ? { previousInsurer: cleanOptional(form.previousInsurer) } : {}),
      ...(cleanOptional(form.preferredHospitals) ? { preferredHospitals: cleanOptional(form.preferredHospitals) } : {}),
      ...(toIsoDate(form.coverageStartDate) ? { coverageStartDate: toIsoDate(form.coverageStartDate) } : {}),
      ...(toIsoDate(form.coverageEndDate) ? { coverageEndDate: toIsoDate(form.coverageEndDate) } : {}),
      ...(toOptionalNumber(form.estimatedAnnualPremium, "health.estimatedAnnualPremium") !== undefined
        ? { estimatedAnnualPremium: toOptionalNumber(form.estimatedAnnualPremium, "health.estimatedAnnualPremium") }
        : {}),
      currency: form.currency.trim() || "IQD",
    },
    documents: [],
    ...(cleanOptional(form.notes) ? { notes: cleanOptional(form.notes) } : {}),
    agentCode: agentCode || "external-health-form",
  };

  const response = await postJson<HealthRequestResponse>("/api/v1/public/health-requests", payload);

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

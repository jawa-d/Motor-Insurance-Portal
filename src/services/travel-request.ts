import type { TravelFormState } from "../types";
import { postJson } from "./api";

type TravelRequestResponse = {
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

function createSubmissionToken() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function submitTravelRequest(form: TravelFormState, agentCode?: string) {
  const estimatedPremium = toOptionalNumber(form.estimatedPremium, "travel.estimatedPremium");

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
    travel: {
      passportNumber: form.passportNumber.trim(),
      dateOfBirth: toIsoDate(form.dateOfBirth),
      destinationCountry: form.destinationCountry.trim(),
      departureDate: toIsoDate(form.departureDate),
      returnDate: toIsoDate(form.returnDate),
      travelersCount: toRequiredNumber(form.travelersCount, "travel.travelersCount"),
      tripPurpose: form.tripPurpose.trim(),
      coverageType: form.coverageType.trim(),
      coverageScope: form.coverageScope.trim(),
      hasMedicalConditions: form.hasMedicalConditions,
      medicalConditions: form.medicalConditions.trim(),
      emergencyContactName: form.emergencyContactName.trim(),
      emergencyContactPhone: form.emergencyContactPhone.trim(),
      ...(estimatedPremium !== undefined ? { estimatedPremium } : {}),
      currency: form.currency.trim() || "IQD",
    },
    documents: [],
    ...(cleanOptional(form.notes) ? { notes: cleanOptional(form.notes) } : {}),
    agentCode: agentCode || "external-travel-form",
  };

  const response = await postJson<TravelRequestResponse>("/api/v1/public/travel-requests", payload);

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

import type { TransportFormState } from "../types";
import { postJson } from "./api";

type TransportRequestResponse = {
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

function toIsoDate(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function createSubmissionToken() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function submitTransportRequest(form: TransportFormState, agentCode?: string) {
  const estimatedPremium = toOptionalNumber(form.estimatedPremium, "transport.estimatedPremium");

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
    transport: {
      transportMode: form.transportMode.trim(),
      cargoDescription: form.cargoDescription.trim(),
      cargoValue: toRequiredNumber(form.cargoValue, "transport.cargoValue"),
      currency: form.currency.trim() || "IQD",
      originCountry: form.originCountry.trim(),
      originCity: form.originCity.trim(),
      destinationCountry: form.destinationCountry.trim(),
      destinationCity: form.destinationCity.trim(),
      departureDate: toIsoDate(form.departureDate),
      arrivalDate: toIsoDate(form.arrivalDate),
      carrierName: form.carrierName.trim(),
      vesselOrFlightNumber: form.vesselOrFlightNumber.trim(),
      vehicleOrContainerNo: form.vehicleOrContainerNo.trim(),
      packingType: form.packingType.trim(),
      coverageScope: form.coverageScope.trim(),
      hasWarRisk: form.hasWarRisk,
      hasStrikeRisk: form.hasStrikeRisk,
      ...(estimatedPremium !== undefined ? { estimatedPremium } : {}),
    },
    documents: [],
    ...(cleanOptional(form.notes) ? { notes: cleanOptional(form.notes) } : {}),
    agentCode: agentCode || "external-transport-form",
  };

  const response = await postJson<TransportRequestResponse>("/api/v1/public/transport-requests", payload);

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

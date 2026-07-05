import { upload } from "@vercel/blob/client";
import type { DocumentKey, FormState, UploadFile } from "../types";
import { getJson, getPublicApiConfig, getSameOriginJson, postJson } from "./api";

const uploadEndpoint = "/api/public/motor-request-uploads";

const documentPayloadKeyMap: Record<DocumentKey, string> = {
  frontNationalId: "nationalIdFront",
  backNationalId: "nationalIdBack",
  drivingLicense: "drivingLicense",
  vehicleRegistration: "vehicleRegistration",
  frontResidenceCard: "residenceCardFront",
  backResidenceCard: "residenceCardBack",
};

type MotorRequestResponse = {
  trackingNumber?: string;
  requestNumber?: string;
  data?: {
    trackingNumber?: string;
    requestNumber?: string;
    motorRequest?: {
      trackingNumber?: string;
      requestNumber?: string;
    };
  };
  motorRequest?: {
    trackingNumber?: string;
    requestNumber?: string;
  };
};

export type PublicMotorRequestStatus =
  | "RECEIVED"
  | "UNDER_REVIEW"
  | "DOCUMENTS_CHECK"
  | "QUOTE_PREPARATION"
  | "CONTACTING_CUSTOMER"
  | "COMPLETED"
  | "REJECTED";

export type MotorRequestTracking = {
  trackingNumber: string;
  requestNumber: string;
  status: PublicMotorRequestStatus;
  statusLabel: string;
  updatedAt: string;
  customerName: string;
  vehicle: string;
};

export type MotorRequestInput = {
  form: FormState;
  vehicleImages: UploadFile[];
  documents: Partial<Record<DocumentKey, UploadFile>>;
  agentCode?: string;
};

type UploadedFilePayload = {
  url: string;
  pathname: string;
  filename: string;
  contentType: string;
  size: number;
};

function toRequiredNumber(value: string, fieldName: string) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }

  return numberValue;
}

function buildPayload({ form, agentCode }: Pick<MotorRequestInput, "form" | "agentCode">) {
  const manufacturingYear = toRequiredNumber(form.year, "vehicle.manufacturingYear");
  const estimatedVehicleValue = toRequiredNumber(form.estimatedValue, "vehicle.estimatedVehicleValue");

  return {
    customer: {
      fullName: form.fullName.trim(),
      mobile: form.phone.trim(),
      email: form.email.trim() || undefined,
      nationalId: form.nationalId.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
    },
    vehicle: {
      vehicleType: form.vehicleType.trim(),
      manufacturer: form.manufacturer.trim(),
      model: form.model.trim(),
      manufacturingYear,
      color: form.color.trim(),
      plateNumber: form.plateNumber.trim(),
      chassisNumber: form.chassisNumber.trim(),
      engineNumber: form.engineNumber.trim(),
      estimatedVehicleValue,
    },
    notes: form.notes.trim(),
    ...(agentCode ? { agentCode } : {}),
  };
}

function sanitizeFilename(filename: string) {
  const cleanFilename = filename
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleanFilename || "upload";
}

function createUploadPath(kind: "vehicle-image" | "document", file: File, documentKey?: DocumentKey) {
  const randomId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const safeFilename = sanitizeFilename(file.name);
  const directory = documentKey ? `documents/${documentPayloadKeyMap[documentKey]}` : "vehicle-images";

  return `motor-requests/${directory}/${randomId}-${kind}-${safeFilename}`;
}

async function uploadMotorRequestFile(file: File, kind: "vehicle-image" | "document", documentKey?: DocumentKey): Promise<UploadedFilePayload> {
  const config = getPublicApiConfig();
  const blob = await upload(createUploadPath(kind, file, documentKey), file, {
    access: "public",
    handleUploadUrl: `${config.baseUrl}${uploadEndpoint}`,
    headers: {
      "x-api-key": config.apiKey,
    },
    contentType: file.type || "application/octet-stream",
    clientPayload: JSON.stringify({
      kind,
      documentKey,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    }),
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    filename: file.name,
    contentType: blob.contentType || file.type || "application/octet-stream",
    size: file.size,
  };
}

function extractRequestNumber(response: MotorRequestResponse) {
  return (
    response.requestNumber ??
    response.data?.requestNumber ??
    response.data?.motorRequest?.requestNumber ??
    response.motorRequest?.requestNumber
  );
}

function extractTrackingNumber(response: MotorRequestResponse) {
  return (
    response.trackingNumber ??
    response.data?.trackingNumber ??
    response.data?.motorRequest?.trackingNumber ??
    response.motorRequest?.trackingNumber
  );
}

export async function submitMotorRequest(input: MotorRequestInput) {
  const payload = buildPayload(input);

  if (import.meta.env.DEV) {
    console.log("Base Payload:", payload);
  }

  const vehicleImages: UploadedFilePayload[] = [];

  for (const image of input.vehicleImages) {
    vehicleImages.push(await uploadMotorRequestFile(image.file, "vehicle-image"));
  }

  const documents: Record<string, UploadedFilePayload> = {};

  for (const [key, payloadKey] of Object.entries(documentPayloadKeyMap) as Array<[DocumentKey, string]>) {
    const document = input.documents[key];
    if (document) {
      documents[payloadKey] = await uploadMotorRequestFile(document.file, "document", key);
    }
  }

  const finalPayload = {
    ...payload,
    vehicleImages,
    documents,
  };

  if (import.meta.env.DEV) {
    console.log("Final Payload:", finalPayload);
  }

  const response = await postJson<MotorRequestResponse>("/api/public/motor-requests", finalPayload);
  const trackingNumber = extractTrackingNumber(response);
  const requestNumber = extractRequestNumber(response);

  if (!requestNumber) {
    throw new Error("Request number was not returned.");
  }

  if (!trackingNumber) {
    throw new Error("Tracking number was not returned.");
  }

  return { requestNumber, trackingNumber };
}

export async function trackMotorRequest(trackingNumber: string) {
  const encodedTrackingNumber = encodeURIComponent(trackingNumber.trim());

  if (import.meta.env.DEV) {
    return getJson<MotorRequestTracking>(`/api/public/motor-requests/track/${encodedTrackingNumber}`);
  }

  return getSameOriginJson<MotorRequestTracking>(`/api/motor-request-track?trackingNumber=${encodedTrackingNumber}`);
}

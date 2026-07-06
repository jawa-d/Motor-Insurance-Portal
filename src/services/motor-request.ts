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

export type MotorRequestUploadProgress = {
  completedFiles: number;
  currentFile: number;
  totalFiles: number;
  percent: number;
  phase: "uploading" | "submitting";
};

type MotorRequestSubmitOptions = {
  onProgress?: (progress: MotorRequestUploadProgress) => void;
};

type UploadedFilePayload = {
  url: string;
  pathname: string;
  filename: string;
  contentType: string;
  size: number;
};

type SubmittedFilePayload = {
  url: string;
  name: string;
  type: string;
  size: number;
};

type SubmittedDocumentPayload = SubmittedFilePayload & {
  key: string;
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

function createUploadPath(file: File) {
  const randomId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const safeFilename = sanitizeFilename(file.name);

  return `public-motor-requests/uploads/${randomId}-${safeFilename}`;
}

async function uploadMotorRequestFile(file: File, kind: "vehicleImage" | "document", key?: string): Promise<UploadedFilePayload> {
  const config = getPublicApiConfig();
  const contentType = file.type || "application/octet-stream";
  const blob = await upload(createUploadPath(file), file, {
    access: "public",
    handleUploadUrl: `${config.baseUrl}${uploadEndpoint}`,
    headers: {
      "x-api-key": config.apiKey,
    },
    contentType,
    clientPayload: JSON.stringify({
      kind,
      key,
      name: file.name,
      type: contentType,
      size: file.size,
    }),
    multipart: true,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    filename: file.name,
    contentType: blob.contentType || contentType,
    size: file.size,
  };
}

function toSubmittedFilePayload(file: UploadedFilePayload): SubmittedFilePayload {
  return {
    url: file.url,
    name: file.filename,
    type: file.contentType,
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

export async function submitMotorRequest(input: MotorRequestInput, options: MotorRequestSubmitOptions = {}) {
  const payload = buildPayload(input);
  const totalFiles = input.vehicleImages.length + Object.keys(documentPayloadKeyMap).filter((key) => input.documents[key as DocumentKey]).length;
  let completedFiles = 0;

  const reportProgress = (phase: MotorRequestUploadProgress["phase"], currentFile = Math.min(completedFiles + 1, totalFiles)) => {
    options.onProgress?.({
      completedFiles,
      currentFile,
      totalFiles,
      percent: totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 100,
      phase,
    });
  };

  if (import.meta.env.DEV) {
    console.log("Base Payload:", payload);
  }

  const vehicleImages: SubmittedFilePayload[] = [];

  for (const image of input.vehicleImages) {
    reportProgress("uploading");
    vehicleImages.push(toSubmittedFilePayload(await uploadMotorRequestFile(image.file, "vehicleImage")));
    completedFiles += 1;
    reportProgress("uploading", Math.min(completedFiles + 1, totalFiles));
  }

  const documents: SubmittedDocumentPayload[] = [];

  for (const [key, payloadKey] of Object.entries(documentPayloadKeyMap) as Array<[DocumentKey, string]>) {
    const document = input.documents[key];
    if (document) {
      reportProgress("uploading");
      documents.push({
        key: payloadKey,
        ...toSubmittedFilePayload(await uploadMotorRequestFile(document.file, "document", payloadKey)),
      });
      completedFiles += 1;
      reportProgress("uploading", Math.min(completedFiles + 1, totalFiles));
    }
  }

  const finalPayload = {
    payload,
    vehicleImages,
    documents,
  };

  if (import.meta.env.DEV) {
    console.log("Final Payload:", finalPayload);
  }

  reportProgress("submitting", totalFiles);
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

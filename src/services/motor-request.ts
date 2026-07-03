import type { DocumentKey, FormState, UploadFile } from "../types";
import { getJson, postMultipart } from "./api";

const documentFieldMap: Record<DocumentKey, string> = {
  frontNationalId: "documents.nationalIdFront",
  backNationalId: "documents.nationalIdBack",
  drivingLicense: "documents.drivingLicense",
  vehicleRegistration: "documents.vehicleRegistration",
  frontResidenceCard: "documents.residenceCardFront",
  backResidenceCard: "documents.residenceCardBack",
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
  const formData = new FormData();
  const payload = buildPayload(input);

  if (import.meta.env.DEV) {
    console.log("Final Payload:", payload);
  }

  formData.append("payload", JSON.stringify(payload));

  for (const image of input.vehicleImages) {
    formData.append("vehicleImages", image.file, image.file.name);
  }

  for (const [key, fieldName] of Object.entries(documentFieldMap) as Array<[DocumentKey, string]>) {
    const document = input.documents[key];
    if (document) {
      formData.append(fieldName, document.file, document.file.name);
    }
  }

  const response = await postMultipart<MotorRequestResponse>("/api/public/motor-requests", formData);
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

  return getJson<MotorRequestTracking>(`/api/public/motor-requests/track/${encodedTrackingNumber}`);
}

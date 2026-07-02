import type { DocumentKey, FormState, UploadFile } from "../types";
import { postMultipart } from "./api";

const documentFieldMap: Record<DocumentKey, string> = {
  frontNationalId: "documents.nationalIdFront",
  backNationalId: "documents.nationalIdBack",
  drivingLicense: "documents.drivingLicense",
  vehicleRegistration: "documents.vehicleRegistration",
  frontResidenceCard: "documents.residenceCardFront",
  backResidenceCard: "documents.residenceCardBack",
};

type MotorRequestResponse = {
  requestNumber?: string;
  data?: {
    requestNumber?: string;
    motorRequest?: {
      requestNumber?: string;
    };
  };
  motorRequest?: {
    requestNumber?: string;
  };
};

export type MotorRequestInput = {
  form: FormState;
  vehicleImages: UploadFile[];
  documents: Partial<Record<DocumentKey, UploadFile>>;
  agentCode?: string;
};

function buildPayload({ form, agentCode }: Pick<MotorRequestInput, "form" | "agentCode">) {
  return {
    customer: {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      nationalId: form.nationalId.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
    },
    vehicle: {
      type: form.vehicleType.trim(),
      manufacturer: form.manufacturer.trim(),
      model: form.model.trim(),
      year: Number(form.year),
      color: form.color.trim(),
      plateNumber: form.plateNumber.trim(),
      chassisNumber: form.chassisNumber.trim(),
      engineNumber: form.engineNumber.trim(),
      estimatedValue: Number(form.estimatedValue),
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

export async function submitMotorRequest(input: MotorRequestInput) {
  const formData = new FormData();

  formData.append("payload", JSON.stringify(buildPayload(input)));

  for (const image of input.vehicleImages) {
    formData.append("vehicleImages", image.file, image.file.name);
  }

  for (const [key, fieldName] of Object.entries(documentFieldMap) as Array<[DocumentKey, string]>) {
    const document = input.documents[key];
    if (document) {
      formData.append(fieldName, document.file, document.file.name);
    }
  }

  const response = await postMultipart<MotorRequestResponse>("/api/v1/public/motor-requests", formData);
  const requestNumber = extractRequestNumber(response);

  if (!requestNumber) {
    throw new Error("Request number was not returned.");
  }

  return { requestNumber };
}

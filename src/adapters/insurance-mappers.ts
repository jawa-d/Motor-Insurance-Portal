import type { DocumentKey, FormState, UploadFile } from "../types";
import type {
  CashInsuranceRequestDto,
  ContractorsAllRisksRequestDto,
  CoverageLineDto,
  CustomerDto,
  FidelityGuaranteeRequestDto,
  FireRequestDto,
  GlassItemDto,
  GlassRequestDto,
  HealthRequestDto,
  InsuranceHistoryDto,
  KeyedAttachmentDto,
  MotorRequestDto,
  PropertyRequestDto,
  PublicLiabilityRequestDto,
  QuestionAnswerDto,
  TravelRequestDto,
  UploadedAttachmentDto,
  WorkersCompensationRequestDto,
} from "./insurance-dtos";

const documentPayloadKeyMap: Record<DocumentKey, string> = {
  frontNationalId: "nationalIdFront",
  backNationalId: "nationalIdBack",
  drivingLicense: "drivingLicense",
  vehicleRegistration: "vehicleRegistration",
  frontResidenceCard: "residenceCardFront",
  backResidenceCard: "residenceCardBack",
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

type PortalAttachment = UploadedAttachmentDto | UploadFile;

export type MapperOptions = {
  agentCode?: string;
  attachments?: KeyedAttachmentDto[];
};

export type MotorForm = {
  form: FormState;
  vehicleImages: PortalAttachment[];
  documents: Partial<Record<DocumentKey, PortalAttachment>>;
  agentCode?: string;
};

export type TravelForm = {
  applicant: CustomerDto;
  nationality: string;
  passportOrNationalId: string;
  dateOfBirth: string;
  destination: string;
  startDate: string;
  returnDate: string;
  durationDays: string | number;
  purposes: string[];
  otherPurpose?: string;
  coverageTypes: string[];
  coverageAmount?: string | number;
  coverageCurrency?: "USD" | "EUR";
  hasChronicDisease?: boolean;
  chronicDiseaseDetails?: string;
  hadTravelInsurance?: boolean;
  previousInsuranceCompany?: string;
  declarationAccepted: boolean;
  notes?: string;
};

export type PublicLiabilityForm = {
  applicant: CustomerDto;
  applicantType: string;
  nationality?: string;
  dateOfBirthOrEstablishment?: string;
  postalCode?: string;
  activityType: string;
  yearsInBusiness: string;
  employeeCount: string | number;
  hasHighRiskActivities?: boolean;
  highRiskDetails?: string;
  liabilityTypes: string[];
  otherLiabilityType?: string;
  perOccurrenceLimit: string | number;
  annualAggregateLimit: string | number;
  startDate: string;
  duration: string;
  insuranceHistory: InsuranceHistoryDto;
  declarationAccepted: boolean;
  notes?: string;
};

export type FireForm = {
  applicant: CustomerDto;
  riskLocation: string;
  occupancy?: string;
  buildingValue?: string | number;
  contentsValue?: string | number;
  stockValue?: string | number;
  requestedCovers: string[];
  declarationAccepted: boolean;
  notes?: string;
};

export type ContractorsAllRisksForm = {
  applicant: CustomerDto;
  proposerType: string;
  projectName: string;
  projectOwner: string;
  contractorName: string;
  projectLocation: string;
  projectDescription: string;
  startDate: string;
  duration: string;
  maintenancePeriod?: string;
  contractValue: string | number;
  materialsSupplied?: string | number;
  constructionPlant?: string | number;
  thirdPartyLiabilityLimit?: string | number;
  riskQuestions: QuestionAnswerDto[];
  additionalCovers: string[];
  declarationAccepted: boolean;
  notes?: string;
};

export type WorkersCompensationForm = {
  applicant: CustomerDto;
  businessActivity: string;
  commercialRegistrationNumber: string;
  workers: Array<{
    category: string;
    count: string | number;
    averageMonthlySalary?: string | number;
    duties?: string;
  }>;
  coverage: CoverageLineDto[];
  workplaceLocation: string;
  dailyHours: string | number;
  weeklyDays: string | number;
  hasDangerousWork?: boolean;
  dangerousWorkDetails?: string;
  claimsHistory: QuestionAnswerDto[];
  declarationAccepted: boolean;
  notes?: string;
};

export type GlassForm = {
  applicant: CustomerDto;
  buildingAddress: string;
  buildingTypes: string[];
  otherBuildingType?: string;
  floorCount: string | number;
  yearBuilt: string | number;
  sumInsured: string | number;
  ownership?: "owned" | "leased";
  glassItems: Array<Omit<GlassItemDto, "pieceCount" | "estimatedValue"> & { pieceCount: string | number; estimatedValue: string | number }>;
  hasProtectiveTreatment?: boolean;
  protectiveTreatmentDetails?: string;
  hadPreviousBreakage?: boolean;
  previousBreakageDetails?: string;
  insuranceDuration: string;
  declarationAccepted: boolean;
  notes?: string;
};

export type FidelityGuaranteeForm = {
  applicant: CustomerDto;
  businessActivity: string;
  commercialRegistrationNumber: string;
  policyTypes: string[];
  employees: Array<{
    fullName: string;
    jobTitle: string;
    monthlySalary: string | number;
    servicePeriod: string;
    requestedCoverageAmount: string | number;
  }>;
  perLossLimit: string | number;
  perEmployeeLimit: string | number;
  discoveryPeriods: string[];
  internalControls: QuestionAnswerDto[];
  priorLosses: QuestionAnswerDto[];
  declaration: FidelityGuaranteeRequestDto["declaration"];
  declarationAccepted: boolean;
  notes?: string;
};

export type CashInsuranceForm = {
  applicant: CustomerDto;
  applicantType: string;
  businessActivity: string;
  registrationOrLicense: string;
  cashInSafe: string | number;
  safeDamage: string | number;
  holidayCover?: string;
  safeCount: string | number;
  safeLocation: string;
  safeTypes: string[];
  otherSafeType?: string;
  lockTypes: string[];
  isSafeFixed?: boolean;
  isInStrongRoom?: boolean;
  hasAlarm?: boolean;
  alarmType?: string;
  maximumAtAnyTime: string | number;
  averageDailyCash: string | number;
  maximumWeekendOrHoliday: string | number;
  priorLosses: QuestionAnswerDto[];
  currentPolicies: CashInsuranceRequestDto["currentPolicies"];
  declarationAccepted: boolean;
  notes?: string;
};

export type HealthForm = {
  applicant: CustomerDto;
  members: HealthRequestDto["members"];
  coveragePlan: string;
  declarationAccepted: boolean;
  notes?: string;
};

export type PropertyForm = {
  applicant: CustomerDto;
  propertyAddress: string;
  propertyType: string;
  occupancy: string;
  buildingValue?: string | number;
  contentsValue?: string | number;
  declarationAccepted: boolean;
  notes?: string;
};

function normalizeNumericInput(value: string | number | undefined) {
  return String(value ?? "")
    .trim()
    .replace(/[Ù -Ù©Û°-Û¹]/g, (digit) => localizedDigitMap[digit] ?? digit)
    .replace(/[\u066B\uFF0E]/g, ".")
    .replace(/[\u066C,_\s\u00A0\u202F]/g, "")
    .replace(/[^\d.+-]/g, "");
}

function toNumber(value: string | number | undefined, fieldName: string) {
  const numberValue = Number(normalizeNumericInput(value));

  if (!Number.isFinite(numberValue)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }

  return numberValue;
}

function toOptionalNumber(value: string | number | undefined, fieldName: string) {
  if (value === undefined || String(value).trim() === "") return undefined;
  return toNumber(value, fieldName);
}

function cleanCustomer(applicant: CustomerDto): CustomerDto {
  return {
    fullName: applicant.fullName.trim(),
    mobile: applicant.mobile.trim(),
    email: applicant.email?.trim() || undefined,
    nationalId: applicant.nationalId?.trim() || undefined,
    address: applicant.address?.trim() || undefined,
    city: applicant.city?.trim() || undefined,
  };
}

function toAttachmentPayload(attachment: PortalAttachment): UploadedAttachmentDto {
  if ("file" in attachment) {
    return {
      url: attachment.url,
      name: attachment.file.name,
      type: attachment.file.type || "application/octet-stream",
      size: attachment.file.size,
    };
  }

  return attachment;
}

function basePayload<TProduct extends string>(
  product: TProduct,
  form: { applicant: CustomerDto; declarationAccepted: boolean; notes?: string },
  options: MapperOptions,
) {
  return {
    product,
    applicant: cleanCustomer(form.applicant),
    declarationAccepted: form.declarationAccepted,
    attachments: options.attachments ?? [],
    ...(options.agentCode ? { agentCode: options.agentCode } : {}),
    notes: form.notes?.trim() || undefined,
  };
}

export function mapMotorFormToMotorRequestDto(input: MotorForm): MotorRequestDto {
  const { form } = input;

  return {
    payload: {
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
        manufacturingYear: toNumber(form.year, "vehicle.manufacturingYear"),
        color: form.color.trim(),
        plateNumber: form.plateNumber.trim(),
        chassisNumber: form.chassisNumber.trim(),
        engineNumber: form.engineNumber.trim(),
        estimatedVehicleValue: toNumber(form.estimatedValue, "vehicle.estimatedVehicleValue"),
      },
      notes: form.notes.trim(),
      ...(input.agentCode ? { agentCode: input.agentCode } : {}),
    },
    vehicleImages: input.vehicleImages.map(toAttachmentPayload),
    documents: Object.entries(documentPayloadKeyMap).flatMap(([formKey, dtoKey]) => {
      const document = input.documents[formKey as DocumentKey];
      return document ? [{ key: dtoKey, ...toAttachmentPayload(document) }] : [];
    }),
  };
}

export function mapTravelFormToTravelRequestDto(form: TravelForm, options: MapperOptions = {}): TravelRequestDto {
  return {
    ...basePayload("travel", form, options),
    traveler: {
      nationality: form.nationality.trim(),
      passportOrNationalId: form.passportOrNationalId.trim(),
      dateOfBirth: form.dateOfBirth,
    },
    trip: {
      destination: form.destination.trim(),
      startDate: form.startDate,
      returnDate: form.returnDate,
      durationDays: toNumber(form.durationDays, "trip.durationDays"),
      purposes: form.purposes,
      otherPurpose: form.otherPurpose?.trim() || undefined,
    },
    coverage: {
      types: form.coverageTypes,
      amount: toOptionalNumber(form.coverageAmount, "coverage.amount"),
      currency: form.coverageCurrency,
    },
    medical: {
      hasChronicDisease: form.hasChronicDisease,
      chronicDiseaseDetails: form.chronicDiseaseDetails?.trim() || undefined,
    },
    previousInsurance: {
      hadTravelInsurance: form.hadTravelInsurance,
      companyName: form.previousInsuranceCompany?.trim() || undefined,
    },
  };
}

export function mapFireFormToFireRequestDto(form: FireForm, options: MapperOptions = {}): FireRequestDto {
  return {
    ...basePayload("fireBurglary", form, options),
    riskLocation: form.riskLocation.trim(),
    occupancy: form.occupancy?.trim() || undefined,
    buildingValue: toOptionalNumber(form.buildingValue, "buildingValue"),
    contentsValue: toOptionalNumber(form.contentsValue, "contentsValue"),
    stockValue: toOptionalNumber(form.stockValue, "stockValue"),
    requestedCovers: form.requestedCovers,
  };
}

export function mapContractorsAllRisksFormToContractorsAllRisksRequestDto(
  form: ContractorsAllRisksForm,
  options: MapperOptions = {},
): ContractorsAllRisksRequestDto {
  return {
    ...basePayload("contractorsAllRisks", form, options),
    proposerType: form.proposerType,
    project: {
      name: form.projectName.trim(),
      owner: form.projectOwner.trim(),
      contractor: form.contractorName.trim(),
      location: form.projectLocation.trim(),
      description: form.projectDescription.trim(),
      startDate: form.startDate,
      duration: form.duration.trim(),
      maintenancePeriod: form.maintenancePeriod?.trim() || undefined,
    },
    sumsInsured: {
      contractValue: toNumber(form.contractValue, "sumsInsured.contractValue"),
      materialsSupplied: toOptionalNumber(form.materialsSupplied, "sumsInsured.materialsSupplied"),
      constructionPlant: toOptionalNumber(form.constructionPlant, "sumsInsured.constructionPlant"),
      thirdPartyLiabilityLimit: toOptionalNumber(form.thirdPartyLiabilityLimit, "sumsInsured.thirdPartyLiabilityLimit"),
    },
    riskQuestions: form.riskQuestions,
    additionalCovers: form.additionalCovers,
  };
}

export function mapPublicLiabilityFormToPublicLiabilityRequestDto(
  form: PublicLiabilityForm,
  options: MapperOptions = {},
): PublicLiabilityRequestDto {
  return {
    ...basePayload("publicLiability", form, options),
    applicantType: form.applicantType,
    nationality: form.nationality?.trim() || undefined,
    dateOfBirthOrEstablishment: form.dateOfBirthOrEstablishment,
    postalCode: form.postalCode?.trim() || undefined,
    business: {
      activityType: form.activityType.trim(),
      yearsInBusiness: form.yearsInBusiness.trim(),
      employeeCount: toNumber(form.employeeCount, "business.employeeCount"),
      hasHighRiskActivities: form.hasHighRiskActivities,
      highRiskDetails: form.highRiskDetails?.trim() || undefined,
    },
    coverage: {
      liabilityTypes: form.liabilityTypes,
      otherLiabilityType: form.otherLiabilityType?.trim() || undefined,
      perOccurrenceLimit: toNumber(form.perOccurrenceLimit, "coverage.perOccurrenceLimit"),
      annualAggregateLimit: toNumber(form.annualAggregateLimit, "coverage.annualAggregateLimit"),
      startDate: form.startDate,
      duration: form.duration.trim(),
    },
    insuranceHistory: form.insuranceHistory,
  };
}

export function mapWorkersCompensationFormToWorkersCompensationRequestDto(
  form: WorkersCompensationForm,
  options: MapperOptions = {},
): WorkersCompensationRequestDto {
  return {
    ...basePayload("workersCompensation", form, options),
    company: {
      businessActivity: form.businessActivity.trim(),
      commercialRegistrationNumber: form.commercialRegistrationNumber.trim(),
    },
    workers: form.workers.map((worker) => ({
      category: worker.category,
      count: toNumber(worker.count, `workers.${worker.category}.count`),
      averageMonthlySalary: toOptionalNumber(worker.averageMonthlySalary, `workers.${worker.category}.averageMonthlySalary`),
      duties: worker.duties?.trim() || undefined,
    })),
    coverage: form.coverage,
    workplace: {
      location: form.workplaceLocation.trim(),
      dailyHours: toNumber(form.dailyHours, "workplace.dailyHours"),
      weeklyDays: toNumber(form.weeklyDays, "workplace.weeklyDays"),
      hasDangerousWork: form.hasDangerousWork,
      dangerousWorkDetails: form.dangerousWorkDetails?.trim() || undefined,
    },
    claimsHistory: form.claimsHistory,
  };
}

export function mapGlassFormToGlassRequestDto(form: GlassForm, options: MapperOptions = {}): GlassRequestDto {
  return {
    ...basePayload("glass", form, options),
    building: {
      address: form.buildingAddress.trim(),
      types: form.buildingTypes,
      otherType: form.otherBuildingType?.trim() || undefined,
      floorCount: toNumber(form.floorCount, "building.floorCount"),
      yearBuilt: toNumber(form.yearBuilt, "building.yearBuilt"),
      sumInsured: toNumber(form.sumInsured, "building.sumInsured"),
      ownership: form.ownership,
    },
    glassItems: form.glassItems.map((item, index) => ({
      location: item.location.trim(),
      pieceCount: toNumber(item.pieceCount, `glassItems.${index}.pieceCount`),
      dimensions: item.dimensions.trim(),
      glassType: item.glassType.trim(),
      estimatedValue: toNumber(item.estimatedValue, `glassItems.${index}.estimatedValue`),
    })),
    hasProtectiveTreatment: form.hasProtectiveTreatment,
    protectiveTreatmentDetails: form.protectiveTreatmentDetails?.trim() || undefined,
    hadPreviousBreakage: form.hadPreviousBreakage,
    previousBreakageDetails: form.previousBreakageDetails?.trim() || undefined,
    insuranceDuration: form.insuranceDuration.trim(),
  };
}

export function mapHealthFormToHealthRequestDto(form: HealthForm, options: MapperOptions = {}): HealthRequestDto {
  return {
    ...basePayload("health", form, options),
    members: form.members,
    coveragePlan: form.coveragePlan.trim(),
  };
}

export function mapPropertyFormToPropertyRequestDto(form: PropertyForm, options: MapperOptions = {}): PropertyRequestDto {
  return {
    ...basePayload("property", form, options),
    property: {
      address: form.propertyAddress.trim(),
      type: form.propertyType.trim(),
      occupancy: form.occupancy.trim(),
      buildingValue: toOptionalNumber(form.buildingValue, "property.buildingValue"),
      contentsValue: toOptionalNumber(form.contentsValue, "property.contentsValue"),
    },
  };
}

export function mapFidelityGuaranteeFormToFidelityGuaranteeRequestDto(
  form: FidelityGuaranteeForm,
  options: MapperOptions = {},
): FidelityGuaranteeRequestDto {
  return {
    ...basePayload("fidelityGuarantee", form, options),
    company: {
      businessActivity: form.businessActivity.trim(),
      commercialRegistrationNumber: form.commercialRegistrationNumber.trim(),
    },
    policyTypes: form.policyTypes,
    employees: form.employees.map((employee, index) => ({
      fullName: employee.fullName.trim(),
      jobTitle: employee.jobTitle.trim(),
      monthlySalary: toNumber(employee.monthlySalary, `employees.${index}.monthlySalary`),
      servicePeriod: employee.servicePeriod.trim(),
      requestedCoverageAmount: toNumber(employee.requestedCoverageAmount, `employees.${index}.requestedCoverageAmount`),
    })),
    coverage: {
      perLossLimit: toNumber(form.perLossLimit, "coverage.perLossLimit"),
      perEmployeeLimit: toNumber(form.perEmployeeLimit, "coverage.perEmployeeLimit"),
      discoveryPeriods: form.discoveryPeriods,
    },
    internalControls: form.internalControls,
    priorLosses: form.priorLosses,
    declaration: form.declaration,
  };
}

export function mapCashInsuranceFormToCashInsuranceRequestDto(
  form: CashInsuranceForm,
  options: MapperOptions = {},
): CashInsuranceRequestDto {
  return {
    ...basePayload("cashInsurance", form, options),
    applicantType: form.applicantType,
    company: {
      businessActivity: form.businessActivity.trim(),
      registrationOrLicense: form.registrationOrLicense.trim(),
    },
    coverage: {
      cashInSafe: toNumber(form.cashInSafe, "coverage.cashInSafe"),
      safeDamage: toNumber(form.safeDamage, "coverage.safeDamage"),
      holidayCover: form.holidayCover?.trim() || undefined,
    },
    safe: {
      count: toNumber(form.safeCount, "safe.count"),
      location: form.safeLocation.trim(),
      types: form.safeTypes,
      otherType: form.otherSafeType?.trim() || undefined,
      lockTypes: form.lockTypes,
      isFixed: form.isSafeFixed,
      isInStrongRoom: form.isInStrongRoom,
      hasAlarm: form.hasAlarm,
      alarmType: form.alarmType?.trim() || undefined,
    },
    cashAmounts: {
      maximumAtAnyTime: toNumber(form.maximumAtAnyTime, "cashAmounts.maximumAtAnyTime"),
      averageDailyCash: toNumber(form.averageDailyCash, "cashAmounts.averageDailyCash"),
      maximumWeekendOrHoliday: toNumber(form.maximumWeekendOrHoliday, "cashAmounts.maximumWeekendOrHoliday"),
    },
    priorLosses: form.priorLosses,
    currentPolicies: form.currentPolicies,
  };
}

export const insuranceMappers = {
  motor: mapMotorFormToMotorRequestDto,
  travel: mapTravelFormToTravelRequestDto,
  fireBurglary: mapFireFormToFireRequestDto,
  contractorsAllRisks: mapContractorsAllRisksFormToContractorsAllRisksRequestDto,
  publicLiability: mapPublicLiabilityFormToPublicLiabilityRequestDto,
  workersCompensation: mapWorkersCompensationFormToWorkersCompensationRequestDto,
  glass: mapGlassFormToGlassRequestDto,
  health: mapHealthFormToHealthRequestDto,
  property: mapPropertyFormToPropertyRequestDto,
  fidelityGuarantee: mapFidelityGuaranteeFormToFidelityGuaranteeRequestDto,
  cashInsurance: mapCashInsuranceFormToCashInsuranceRequestDto,
};

export type UploadedAttachmentDto = {
  url: string;
  name: string;
  type: string;
  size: number;
};

export type KeyedAttachmentDto = UploadedAttachmentDto & {
  key: string;
};

export type CustomerDto = {
  fullName: string;
  mobile: string;
  email?: string;
  nationalId?: string;
  address?: string;
  city?: string;
};

export type YesNo = "yes" | "no";

export type InsuranceRequestDtoBase = {
  product: InsuranceProduct;
  applicant: CustomerDto;
  declarationAccepted: boolean;
  attachments: KeyedAttachmentDto[];
  agentCode?: string;
  notes?: string;
};

export type InsuranceProduct =
  | "motor"
  | "travel"
  | "fireBurglary"
  | "contractorsAllRisks"
  | "publicLiability"
  | "workersCompensation"
  | "glass"
  | "health"
  | "property"
  | "fidelityGuarantee"
  | "cashInsurance";

export type MotorRequestDto = {
  payload: {
    customer: Required<Pick<CustomerDto, "fullName" | "mobile" | "nationalId" | "address" | "city">> &
      Pick<CustomerDto, "email">;
    vehicle: {
      vehicleType: string;
      manufacturer: string;
      model: string;
      manufacturingYear: number;
      color: string;
      plateNumber: string;
      chassisNumber: string;
      engineNumber: string;
      estimatedVehicleValue: number;
    };
    notes: string;
    agentCode?: string;
  };
  vehicleImages: UploadedAttachmentDto[];
  documents: KeyedAttachmentDto[];
};

export type TravelRequestDto = InsuranceRequestDtoBase & {
  product: "travel";
  traveler: {
    nationality: string;
    passportOrNationalId: string;
    dateOfBirth: string;
  };
  trip: {
    destination: string;
    startDate: string;
    returnDate: string;
    durationDays: number;
    purposes: string[];
    otherPurpose?: string;
  };
  coverage: {
    types: string[];
    amount?: number;
    currency?: "USD" | "EUR";
  };
  medical: {
    hasChronicDisease?: boolean;
    chronicDiseaseDetails?: string;
  };
  previousInsurance?: {
    hadTravelInsurance?: boolean;
    companyName?: string;
  };
};

export type FireRequestDto = InsuranceRequestDtoBase & {
  product: "fireBurglary";
  riskLocation: string;
  occupancy?: string;
  buildingValue?: number;
  contentsValue?: number;
  stockValue?: number;
  requestedCovers: string[];
};

export type ContractorsAllRisksRequestDto = InsuranceRequestDtoBase & {
  product: "contractorsAllRisks";
  proposerType: string;
  project: {
    name: string;
    owner: string;
    contractor: string;
    location: string;
    description: string;
    startDate: string;
    duration: string;
    maintenancePeriod?: string;
  };
  sumsInsured: {
    contractValue: number;
    materialsSupplied?: number;
    constructionPlant?: number;
    thirdPartyLiabilityLimit?: number;
  };
  riskQuestions: QuestionAnswerDto[];
  additionalCovers: string[];
};

export type PublicLiabilityRequestDto = InsuranceRequestDtoBase & {
  product: "publicLiability";
  applicantType: string;
  nationality?: string;
  dateOfBirthOrEstablishment?: string;
  postalCode?: string;
  business: {
    activityType: string;
    yearsInBusiness: string;
    employeeCount: number;
    hasHighRiskActivities?: boolean;
    highRiskDetails?: string;
  };
  coverage: {
    liabilityTypes: string[];
    otherLiabilityType?: string;
    perOccurrenceLimit: number;
    annualAggregateLimit: number;
    startDate: string;
    duration: string;
  };
  insuranceHistory: InsuranceHistoryDto;
};

export type WorkersCompensationRequestDto = InsuranceRequestDtoBase & {
  product: "workersCompensation";
  company: {
    businessActivity: string;
    commercialRegistrationNumber: string;
  };
  workers: WorkerCategoryDto[];
  coverage: CoverageLineDto[];
  workplace: {
    location: string;
    dailyHours: number;
    weeklyDays: number;
    hasDangerousWork?: boolean;
    dangerousWorkDetails?: string;
  };
  claimsHistory: QuestionAnswerDto[];
};

export type GlassRequestDto = InsuranceRequestDtoBase & {
  product: "glass";
  building: {
    address: string;
    types: string[];
    otherType?: string;
    floorCount: number;
    yearBuilt: number;
    sumInsured: number;
    ownership?: "owned" | "leased";
  };
  glassItems: GlassItemDto[];
  hasProtectiveTreatment?: boolean;
  protectiveTreatmentDetails?: string;
  hadPreviousBreakage?: boolean;
  previousBreakageDetails?: string;
  insuranceDuration: string;
};

export type HealthRequestDto = InsuranceRequestDtoBase & {
  product: "health";
  members: HealthMemberDto[];
  coveragePlan: string;
};

export type PropertyRequestDto = InsuranceRequestDtoBase & {
  product: "property";
  property: {
    address: string;
    type: string;
    occupancy: string;
    buildingValue?: number;
    contentsValue?: number;
  };
};

export type FidelityGuaranteeRequestDto = InsuranceRequestDtoBase & {
  product: "fidelityGuarantee";
  company: {
    businessActivity: string;
    commercialRegistrationNumber: string;
  };
  policyTypes: string[];
  employees: FidelityEmployeeDto[];
  coverage: {
    perLossLimit: number;
    perEmployeeLimit: number;
    discoveryPeriods: string[];
  };
  internalControls: QuestionAnswerDto[];
  priorLosses: QuestionAnswerDto[];
  declaration: SignatureDto;
};

export type CashInsuranceRequestDto = InsuranceRequestDtoBase & {
  product: "cashInsurance";
  applicantType: string;
  company: {
    businessActivity: string;
    registrationOrLicense: string;
  };
  coverage: {
    cashInSafe: number;
    safeDamage: number;
    holidayCover?: string;
  };
  safe: {
    count: number;
    location: string;
    types: string[];
    otherType?: string;
    lockTypes: string[];
    isFixed?: boolean;
    isInStrongRoom?: boolean;
    hasAlarm?: boolean;
    alarmType?: string;
  };
  cashAmounts: {
    maximumAtAnyTime: number;
    averageDailyCash: number;
    maximumWeekendOrHoliday: number;
  };
  priorLosses: QuestionAnswerDto[];
  currentPolicies: CurrentPolicyDto[];
};

export type QuestionAnswerDto = {
  question: string;
  answer?: boolean;
  details?: string;
};

export type InsuranceHistoryDto = {
  hasCurrentInsurance?: boolean;
  companyName?: string;
  policyNumber?: string;
  expiryDate?: string;
  hadDeclinedPolicy?: boolean;
  declinedPolicyDetails?: string;
  hadPreviousClaims?: boolean;
  previousClaimsDetails?: string;
};

export type WorkerCategoryDto = {
  category: string;
  count: number;
  averageMonthlySalary?: number;
  duties?: string;
};

export type CoverageLineDto = {
  name: string;
  amount?: number;
  required: boolean;
};

export type GlassItemDto = {
  location: string;
  pieceCount: number;
  dimensions: string;
  glassType: string;
  estimatedValue: number;
};

export type HealthMemberDto = {
  fullName: string;
  dateOfBirth?: string;
  relationship?: string;
};

export type FidelityEmployeeDto = {
  fullName: string;
  jobTitle: string;
  monthlySalary: number;
  servicePeriod: string;
  requestedCoverageAmount: number;
};

export type SignatureDto = {
  fullName?: string;
  title?: string;
  signature?: string;
  date?: string;
};

export type CurrentPolicyDto = {
  policyType: string;
  insurer: string;
  policyNumber: string;
  expiryDate: string;
};

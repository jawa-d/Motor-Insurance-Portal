export type FormState = {
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  address: string;
  city: string;
  vehicleType: string;
  manufacturer: string;
  model: string;
  year: string;
  color: string;
  plateNumber: string;
  chassisNumber: string;
  engineNumber: string;
  estimatedValue: string;
  notes: string;
  confirmed: boolean;
};

export type UploadFile = {
  id: string;
  file: File;
  url: string;
};

export type DocumentKey =
  | "frontNationalId"
  | "backNationalId"
  | "drivingLicense"
  | "vehicleRegistration"
  | "frontResidenceCard"
  | "backResidenceCard";

export type Errors = Record<string, string | undefined>;

export type EngineeringFormState = {
  fullName: string;
  mobile: string;
  email: string;
  nationalId: string;
  address: string;
  city: string;
  projectName: string;
  projectType: string;
  projectLocation: string;
  contractValue: string;
  currency: string;
  insuranceType: string;
  startDate: string;
  endDate: string;
  contractorName: string;
  ownerName: string;
  riskDetails: string;
  notes: string;
  confirmed: boolean;
};

export type HealthFormState = {
  fullName: string;
  mobile: string;
  email: string;
  nationalId: string;
  address: string;
  city: string;
  age: string;
  gender: string;
  planType: string;
  coverageScope: string;
  insuredMembersCount: string;
  companyName: string;
  occupation: string;
  hasChronicConditions: boolean;
  chronicConditions: string;
  previousInsurance: boolean;
  previousInsurer: string;
  preferredHospitals: string;
  coverageStartDate: string;
  coverageEndDate: string;
  estimatedAnnualPremium: string;
  currency: string;
  notes: string;
  confirmed: boolean;
};

export type FireTheftFormState = {
  fullName: string;
  mobile: string;
  email: string;
  nationalId: string;
  address: string;
  city: string;
  propertyType: string;
  propertyUsage: string;
  propertyAddress: string;
  buildingValue: string;
  contentsValue: string;
  stockValue: string;
  totalSumInsured: string;
  currency: string;
  coverageScope: string;
  hasFireAlarm: boolean;
  hasFireExtinguishers: boolean;
  hasSecuritySystem: boolean;
  notes: string;
  confirmed: boolean;
};

# Portal Compatibility Report

Scope: Portal form surfaces were reviewed against adapter DTOs prepared for Admin integration. No Admin API calls were added.

Important finding: this repo does not contain authoritative Admin DTO source files. The Motor DTO is based on the existing public motor submission payload. The other DTOs are explicit Portal-side contracts inferred from the visible application forms and should be reconciled with Admin before API wiring.

| Module | Compatibility | Status |
| --- | ---: | --- |
| Motor | 90% | Form state, validation, documents, and mapper are ready. Numeric validation is deferred to mapper/API path rather than field schema. |
| Travel | 55% | Form fields exist visually, mapper is ready, but inputs are not bound to state and attachments are absent. |
| Fire & Burglary | 0% | No active Portal form exists. Navigation item is disabled. Mapper stub contract is prepared for future form data. |
| Contractors All Risks | 55% | Form fields exist visually and mapper is ready, but inputs are not bound to state and attachments are absent. |
| Public Liability | 55% | Form fields exist visually and mapper is ready, but inputs are not bound to state and attachments are absent. |
| Workers Compensation | 55% | Form fields exist visually and mapper is ready, but inputs are not bound to state and attachments are absent. |
| Glass | 55% | Form fields exist visually and mapper is ready, but inputs are not bound to state and attachments are absent. |
| Health | 0% | No active Portal form exists. Navigation item is disabled. Mapper stub contract is prepared for future form data. |
| Property | 0% | No active Portal form exists. Navigation item is disabled. Mapper stub contract is prepared for future form data. |
| Fidelity Guarantee | 55% | Form fields exist visually and mapper is ready, but inputs are not bound to state and attachments are absent. |
| Cash Insurance | 50% | Form fields exist visually and mapper is ready. There is duplicated/stray Cash form markup before the full form, inputs are not bound to state, and attachments are absent. |

## Mapper Inventory

Added in `src/adapters/insurance-mappers.ts`:

| Portal form | Admin DTO adapter |
| --- | --- |
| `MotorForm` | `mapMotorFormToMotorRequestDto` -> `MotorRequestDto` |
| `TravelForm` | `mapTravelFormToTravelRequestDto` -> `TravelRequestDto` |
| `FireForm` | `mapFireFormToFireRequestDto` -> `FireRequestDto` |
| `ContractorsAllRisksForm` | `mapContractorsAllRisksFormToContractorsAllRisksRequestDto` -> `ContractorsAllRisksRequestDto` |
| `PublicLiabilityForm` | `mapPublicLiabilityFormToPublicLiabilityRequestDto` -> `PublicLiabilityRequestDto` |
| `WorkersCompensationForm` | `mapWorkersCompensationFormToWorkersCompensationRequestDto` -> `WorkersCompensationRequestDto` |
| `GlassForm` | `mapGlassFormToGlassRequestDto` -> `GlassRequestDto` |
| `HealthForm` | `mapHealthFormToHealthRequestDto` -> `HealthRequestDto` |
| `PropertyForm` | `mapPropertyFormToPropertyRequestDto` -> `PropertyRequestDto` |
| `FidelityGuaranteeForm` | `mapFidelityGuaranteeFormToFidelityGuaranteeRequestDto` -> `FidelityGuaranteeRequestDto` |
| `CashInsuranceForm` | `mapCashInsuranceFormToCashInsuranceRequestDto` -> `CashInsuranceRequestDto` |

DTO types are declared in `src/adapters/insurance-dtos.ts`.

## Field Mapping Summary

### Motor

- Customer: `fullName -> payload.customer.fullName`, `phone -> payload.customer.mobile`, `email -> payload.customer.email`, `nationalId -> payload.customer.nationalId`, `address -> payload.customer.address`, `city -> payload.customer.city`.
- Vehicle: `vehicleType`, `manufacturer`, `model`, `color`, `plateNumber`, `chassisNumber`, and `engineNumber` map directly under `payload.vehicle`.
- Numeric conversions: `year -> payload.vehicle.manufacturingYear`, `estimatedValue -> payload.vehicle.estimatedVehicleValue`.
- Notes: `notes -> payload.notes`.
- Attachments: vehicle images map to `vehicleImages`; document keys map as `frontNationalId -> nationalIdFront`, `backNationalId -> nationalIdBack`, `drivingLicense -> drivingLicense`, `vehicleRegistration -> vehicleRegistration`, `frontResidenceCard -> residenceCardFront`, `backResidenceCard -> residenceCardBack`.
- Missing required fields: none found in the current Portal motor contract.
- DTO-extra fields: `confirmed` is UI-only and intentionally not sent.
- Validation differences: schema only requires non-empty strings; mapper enforces numeric parsing for year/value. The form enforces six documents and at least five vehicle images in submit logic, not in the Zod schema.

### Travel

- Applicant fields map to `applicant`; nationality/passport/date of birth map to `traveler`.
- Destination, travel dates, duration, purposes, and other purpose map to `trip`.
- Coverage type, amount, and currency map to `coverage`.
- Chronic disease fields map to `medical`; previous travel insurer maps to `previousInsurance`.
- Missing required fields: no state capture for any visible field yet; no attachment upload fields.
- Fields not in DTO: declaration/signature UI text is represented only as `declarationAccepted`.
- Validation differences: visible form has no validation or state-backed submit path.

### Fire & Burglary

- No Portal form exists to map. Prepared mapper accepts applicant, risk location, occupancy, values, and requested covers.
- Missing required fields: all, until a form is added.
- Attachment mapping: none available.

### Contractors All Risks

- Applicant fields map to `applicant`; entity type maps to `proposerType`.
- Project name/owner/contractor/location/description/start/duration/maintenance map to `project`.
- Contract value and related sums map to `sumsInsured`.
- Yes/no project risk rows map to `riskQuestions`; extra cover checkboxes map to `additionalCovers`.
- Missing required fields: no state capture for visible fields; no attachment upload fields.
- Validation differences: visible form has no validation or state-backed submit path.

### Public Liability

- Applicant fields map to `applicant`, `applicantType`, `nationality`, date, and postal code.
- Activity, duration, employee count, and high-risk details map to `business`.
- Liability checkboxes, limits, start date, and duration map to `coverage`.
- Current insurance, declined policy, and previous claims map to `insuranceHistory`.
- Missing required fields: no state capture for visible fields; no attachment upload fields.
- Validation differences: visible form has no validation or state-backed submit path.

### Workers Compensation

- Applicant/company fields map to `applicant` and `company`.
- Worker table rows map to `workers`.
- Coverage rows map to `coverage`.
- Location, hours, days, dangerous work, and details map to `workplace`.
- Prior claims rows map to `claimsHistory`.
- Missing required fields: no state capture for visible fields; no attachment upload fields.
- Validation differences: visible form has no validation or state-backed submit path.

### Glass

- Applicant fields map to `applicant`.
- Building address/type/floors/year/sum/ownership map to `building`.
- Glass table rows map to `glassItems`.
- Protection, previous breakage, and insurance duration map to top-level DTO fields.
- Missing required fields: no state capture for visible fields; no attachment upload fields.
- Validation differences: visible form has no validation or state-backed submit path.

### Health

- No Portal form exists to map. Prepared mapper accepts applicant, members, and coverage plan.
- Missing required fields: all, until a form is added.
- Attachment mapping: none available.

### Property

- No Portal form exists to map. Prepared mapper accepts applicant and property details.
- Missing required fields: all, until a form is added.
- Attachment mapping: none available.

### Fidelity Guarantee

- Applicant/company fields map to `applicant` and `company`.
- Policy type checkboxes map to `policyTypes`.
- Employee table rows map to `employees`.
- Per-loss, per-employee, and discovery period fields map to `coverage`.
- Internal control and prior loss question rows map to `internalControls` and `priorLosses`.
- Signature fields map to `declaration`.
- Missing required fields: no state capture for visible fields; no attachment upload field for the extra employee list mentioned by the UI note.
- Validation differences: visible form has no validation or state-backed submit path.

### Cash Insurance

- Applicant/company fields map to `applicant`, `applicantType`, and `company`.
- Cash in safe, safe damage, and holiday cover map to `coverage`.
- Safe count/location/types/locks/fixed room/alarm fields map to `safe`.
- Maximum, average daily, and weekend/holiday cash amounts map to `cashAmounts`.
- Prior loss rows and current policy table rows map to `priorLosses` and `currentPolicies`.
- Missing required fields: no state capture for visible fields; no attachment upload fields.
- Fields not in DTO: duplicated/partial Cash markup appears before the full Cash form and should not be wired.
- Validation differences: visible form has no validation or state-backed submit path.

## Attachment Mapping Issues

- Only Motor currently has actual upload controls and document key mapping.
- Non-motor products have no reusable attachment section in the visible forms, even where insurance workflows normally require supporting documents.
- Fidelity Guarantee explicitly mentions attaching an additional employee list later, but no upload field exists.

## Integration Readiness Notes

- Network requests were intentionally not implemented.
- The next integration step should compare `src/adapters/insurance-dtos.ts` against Admin's authoritative DTO files and adjust names/enums before wiring submit handlers.
- Before non-motor API integration, each static form needs a state model and validation schema using these mapper input types.

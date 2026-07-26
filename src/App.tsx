import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  CarFront,
  CheckCircle2,
  ClipboardList,
  Copy,
  Clock3,
  Download,
  ExternalLink,
  FileSearch,
  Flame,
  Globe2,
  HeartPulse,
  Home,
  Info,
  Mail,
  MapPin,
  MapPinned,
  MessageCircle,
  Moon,
  Phone,
  Plane,
  ShieldCheck,
  ShieldAlert,
  Sun,
  X,
} from "lucide-react";
import { type CSSProperties, type ChangeEvent, useEffect, useMemo, useState } from "react";
import { DocumentUpload } from "./components/DocumentUpload";
import { FloatingField } from "./components/FloatingField";
import { ProgressSteps } from "./components/ProgressSteps";
import { UploadZone } from "./components/UploadZone";
import { translations, type Language } from "./i18n";
import { ApiError } from "./services/api";
import { submitEngineeringRequest } from "./services/engineering-request";
import { submitFireTheftRequest } from "./services/fire-theft-request";
import { submitGeneralAccidentRequest } from "./services/general-accident-request";
import { submitHealthRequest } from "./services/health-request";
import { submitTravelRequest } from "./services/travel-request";
import {
  submitMotorRequest,
  trackMotorRequest,
  type MotorRequestTracking,
  type MotorRequestUploadProgress,
  type PublicMotorRequestStatus,
} from "./services/motor-request";
import type { DocumentKey, EngineeringFormState, Errors, FireTheftFormState, FormState, GeneralAccidentFormState, HealthFormState, TravelFormState, UploadFile } from "./types";
import {
  createEngineeringSchema,
  createFireTheftSchema,
  createGeneralAccidentSchema,
  createHealthSchema,
  createSchema,
  createTravelSchema,
  initialEngineeringForm,
  initialFireTheftForm,
  initialForm,
  initialGeneralAccidentForm,
  initialHealthForm,
  initialTravelForm,
} from "./validation";

const documentKeys: DocumentKey[] = [
  "frontNationalId",
  "backNationalId",
  "drivingLicense",
  "vehicleRegistration",
  "frontResidenceCard",
  "backResidenceCard",
];

const isDevelopment = import.meta.env.DEV;

const sectionAnimation = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.45 },
};

const supportPhones = ["+964 770 483 9994", "+964 781 104 0003", "+964 790 612 3541"];
const supportWhatsApp = [
  { number: "+964 770 483 9994", href: "https://wa.me/9647704839994" },
  { number: "+964 790 612 3541", href: "https://wa.me/9647906123541" },
  { number: "+964 781 104 0003", href: "https://wa.me/9647811040003" },
];
const fallbackFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSc_xrj87VpZj0VRte-KCnaidxUUIVx1t5brl7NaBVJXRls_qA/viewform?usp=publish-editor";

type Page = "home" | "motor" | "engineering" | "health" | "fire-theft" | "general-accident" | "travel" | "track" | "support";

const getCurrentPage = (): Page => {
  const path = window.location.pathname.replace(/\/+$/, "");

  if (path === "/track") return "track";
  if (path === "/support") return "support";
  if (path === "/motor") return "motor";
  if (path === "/engineering") return "engineering";
  if (path === "/health") return "health";
  if (path === "/fire-theft") return "fire-theft";
  if (path === "/general-accident") return "general-accident";
  if (path === "/travel") return "travel";

  return "home";
};

const trackingStatusIndex: Record<PublicMotorRequestStatus, number> = {
  SUBMITTED: 0,
  RECEIVED: 0,
  UNDER_REVIEW: 1,
  DOCUMENTS_CHECK: 2,
  QUOTE_PREPARATION: 3,
  CONTACTING_CUSTOMER: 4,
  COMPLETED: 4,
  REJECTED: 4,
};

const trackingStatusTheme: Record<PublicMotorRequestStatus, { color: string; name: string }> = {
  SUBMITTED: { color: "#0f8a4b", name: "received" },
  RECEIVED: { color: "#0f8a4b", name: "received" },
  UNDER_REVIEW: { color: "#1b8b8f", name: "review" },
  DOCUMENTS_CHECK: { color: "#b7791f", name: "documents" },
  QUOTE_PREPARATION: { color: "#5b5fc7", name: "quote" },
  CONTACTING_CUSTOMER: { color: "#2563eb", name: "contact" },
  COMPLETED: { color: "#15803d", name: "completed" },
  REJECTED: { color: "#b42318", name: "rejected" },
};

const trackingStatusDescription: Record<Language, Record<PublicMotorRequestStatus, string>> = {
  ar: {
    SUBMITTED: "تم استلام الطلب بنجاح وهو الآن ضمن قائمة المتابعة لدى فريق التأمين.",
    RECEIVED: "تم استلام الطلب بنجاح وهو الآن ضمن قائمة المتابعة لدى فريق التأمين.",
    UNDER_REVIEW: "الطلب قيد المراجعة، ويتم تدقيق المعلومات الأساسية قبل الانتقال للخطوة التالية.",
    DOCUMENTS_CHECK: "الفريق يتحقق من المستندات المرفوعة ويتأكد من وضوحها واكتمالها.",
    QUOTE_PREPARATION: "يتم تجهيز العرض التأميني المناسب حسب بيانات المركبة والطلب.",
    CONTACTING_CUSTOMER: "سيتم التواصل معك قريباً لإكمال التفاصيل أو مشاركة العرض.",
    COMPLETED: "اكتملت معالجة الطلب، ويمكنك التواصل مع فريق الدعم لأي متابعة إضافية.",
    REJECTED: "تم رفض الطلب. يرجى التواصل مع فريق الدعم لمعرفة السبب والخطوات الممكنة.",
  },
  en: {
    SUBMITTED: "Your application was received successfully and is now queued with the insurance team.",
    RECEIVED: "Your application was received successfully and is now queued with the insurance team.",
    UNDER_REVIEW: "The application is under review while the team checks the core details.",
    DOCUMENTS_CHECK: "Uploaded documents are being checked for clarity and completeness.",
    QUOTE_PREPARATION: "The insurance quote is being prepared based on the vehicle and request details.",
    CONTACTING_CUSTOMER: "The team will contact you soon to complete details or share the quote.",
    COMPLETED: "The application has been completed. Support can help with any additional follow-up.",
    REJECTED: "The application was rejected. Please contact support for the reason and possible next steps.",
  },
};

function App() {
  const [language, setLanguage] = useState<Language>("ar");
  const [darkMode, setDarkMode] = useState(false);
  const [page, setPage] = useState<Page>(getCurrentPage);
  const [form, setForm] = useState<FormState>(initialForm);
  const [engineeringForm, setEngineeringForm] = useState<EngineeringFormState>(initialEngineeringForm);
  const [healthForm, setHealthForm] = useState<HealthFormState>(initialHealthForm);
  const [fireTheftForm, setFireTheftForm] = useState<FireTheftFormState>(initialFireTheftForm);
  const [generalAccidentForm, setGeneralAccidentForm] = useState<GeneralAccidentFormState>(initialGeneralAccidentForm);
  const [travelForm, setTravelForm] = useState<TravelFormState>(initialTravelForm);
  const [vehicleImages, setVehicleImages] = useState<UploadFile[]>([]);
  const [documents, setDocuments] = useState<Partial<Record<DocumentKey, UploadFile>>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [requestNumber, setRequestNumber] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [submittedForm, setSubmittedForm] = useState<FormState | null>(null);
  const [copiedRequestNumber, setCopiedRequestNumber] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingLookup, setTrackingLookup] = useState<MotorRequestTracking | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [engineeringErrors, setEngineeringErrors] = useState<Errors>({});
  const [engineeringSubmitError, setEngineeringSubmitError] = useState<string | null>(null);
  const [engineeringRequest, setEngineeringRequest] = useState<{ requestNumber: string; trackingNumber: string; status: string } | null>(null);
  const [isEngineeringSubmitting, setIsEngineeringSubmitting] = useState(false);
  const [healthErrors, setHealthErrors] = useState<Errors>({});
  const [healthSubmitError, setHealthSubmitError] = useState<string | null>(null);
  const [healthRequest, setHealthRequest] = useState<{ requestNumber: string; trackingNumber: string; status: string } | null>(null);
  const [isHealthSubmitting, setIsHealthSubmitting] = useState(false);
  const [fireTheftErrors, setFireTheftErrors] = useState<Errors>({});
  const [fireTheftSubmitError, setFireTheftSubmitError] = useState<string | null>(null);
  const [fireTheftRequest, setFireTheftRequest] = useState<{ requestNumber: string; trackingNumber: string; status: string } | null>(null);
  const [isFireTheftSubmitting, setIsFireTheftSubmitting] = useState(false);
  const [generalAccidentErrors, setGeneralAccidentErrors] = useState<Errors>({});
  const [generalAccidentSubmitError, setGeneralAccidentSubmitError] = useState<string | null>(null);
  const [generalAccidentRequest, setGeneralAccidentRequest] = useState<{ requestNumber: string; trackingNumber: string; status: string } | null>(null);
  const [isGeneralAccidentSubmitting, setIsGeneralAccidentSubmitting] = useState(false);
  const [travelErrors, setTravelErrors] = useState<Errors>({});
  const [travelSubmitError, setTravelSubmitError] = useState<string | null>(null);
  const [travelRequest, setTravelRequest] = useState<{ requestNumber: string; trackingNumber: string; status: string } | null>(null);
  const [isTravelSubmitting, setIsTravelSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<MotorRequestUploadProgress | null>(null);

  const t = translations[language];
  const direction = language === "ar" ? "rtl" : "ltr";
  const isFormLocked = isSubmitting || Boolean(uploadProgress);
  const showHome = page === "home";
  const showMotorPage = page === "motor";
  const showEngineeringPage = page === "engineering";
  const showHealthPage = page === "health";
  const showFireTheftPage = page === "fire-theft";
  const showGeneralAccidentPage = page === "general-accident";
  const showTravelPage = page === "travel";
  const showTrackingPage = page === "track";
  const showSupportPage = page === "support";

  const steps = [t.customer, t.vehicle, t.images, t.documents, t.notes, t.submitStep];
  const trackingSteps = [t.trackReceived, t.trackReview, t.trackDocuments, t.trackPricing, t.trackContact];
  const completed = [
    ["fullName", "phone", "nationalId", "address", "city"].every((key) => form[key as keyof FormState]),
    [
      "vehicleType",
      "manufacturer",
      "model",
      "year",
      "color",
      "plateNumber",
      "chassisNumber",
      "engineNumber",
      "estimatedValue",
    ].every((key) => form[key as keyof FormState]),
    vehicleImages.length >= 5,
    documentKeys.every((key) => documents[key]),
    form.notes.trim().length > 0,
    Boolean(requestNumber && trackingNumber),
  ];

  const uploadLabels = {
    replace: t.replace,
    remove: t.remove,
    selectFile: t.selectFile,
    fileType: t.fileType,
  };

  const agentCode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("agentCode") ??
      params.get("agent_code") ??
      params.get("agent") ??
      import.meta.env.VITE_AGENT_CODE ??
      undefined
    );
  }, []);

  const schema = useMemo(
    () =>
      createSchema({
        fieldRequired: t.fieldRequired,
      }),
    [t],
  );
  const engineeringSchema = useMemo(
    () =>
      createEngineeringSchema({
        fieldRequired: t.fieldRequired,
      }),
    [t],
  );
  const healthSchema = useMemo(
    () =>
      createHealthSchema({
        fieldRequired: t.fieldRequired,
      }),
    [t],
  );
  const fireTheftSchema = useMemo(
    () =>
      createFireTheftSchema({
        fieldRequired: t.fieldRequired,
      }),
    [t],
  );
  const generalAccidentSchema = useMemo(
    () =>
      createGeneralAccidentSchema({
        fieldRequired: t.fieldRequired,
      }),
    [t],
  );
  const travelSchema = useMemo(
    () =>
      createTravelSchema({
        fieldRequired: t.fieldRequired,
      }),
    [t],
  );

  useEffect(() => {
    const updatePage = () => {
      const nextPage = getCurrentPage();
      setPage(nextPage);

      if (nextPage === "track") {
        setTrackingInput(new URLSearchParams(window.location.search).get("trackingNumber") ?? "");
      }
    };

    window.addEventListener("popstate", updatePage);
    updatePage();

    return () => window.removeEventListener("popstate", updatePage);
  }, []);

  const navigate = (nextPage: Page) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const nextPath = nextPage === "home" ? "/" : `/${nextPage}`;

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }

    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navClass = (navPage: Page) => `icon-button${page === navPage ? " active" : ""}`;

  const openTrackingRequest = (nextTrackingNumber: string) => {
    const encodedTrackingNumber = encodeURIComponent(nextTrackingNumber.trim());
    const nextPath = `/track?trackingNumber=${encodedTrackingNumber}`;

    window.history.pushState({}, "", nextPath);
    setPage("track");
    setTrackingInput(nextTrackingNumber);
    setTrackingError(null);
    setTrackingLookup(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setValue = (key: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const setEngineeringValue = (key: keyof EngineeringFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value;
    setEngineeringForm((current) => ({ ...current, [key]: value }));
    setEngineeringErrors((current) => ({ ...current, [key]: undefined }));
  };

  const setHealthValue = (key: keyof HealthFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value;
    setHealthForm((current) => ({ ...current, [key]: value }));
    setHealthErrors((current) => ({ ...current, [key]: undefined }));
  };

  const setFireTheftValue = (key: keyof FireTheftFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value;
    setFireTheftForm((current) => ({ ...current, [key]: value }));
    setFireTheftErrors((current) => ({ ...current, [key]: undefined }));
  };

  const setGeneralAccidentValue = (key: keyof GeneralAccidentFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value;
    setGeneralAccidentForm((current) => ({ ...current, [key]: value }));
    setGeneralAccidentErrors((current) => ({ ...current, [key]: undefined }));
  };

  const setTravelValue = (key: keyof TravelFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value;
    setTravelForm((current) => ({ ...current, [key]: value }));
    setTravelErrors((current) => ({ ...current, [key]: undefined }));
  };

  const getTrackingErrorMessage = (error: unknown) => {
    if (isDevelopment && error instanceof Error) {
      if (error instanceof ApiError && error.responseBody) {
        return `${error.message} Response: ${error.responseBody}`;
      }

      return error.message;
    }

    if (error instanceof ApiError) {
      if (error.status === 400) return t.trackingError400;
      if (error.status === 401) return t.trackingError401;
      if (error.status === 404) return t.trackingError404;
      if (error.status >= 500) return t.trackingError500;
    }

    return t.trackingErrorGeneric;
  };

  const lookupTracking = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = trackingInput.trim();

    if (!code) return;

    try {
      setIsTracking(true);
      setTrackingError(null);
      setTrackingLookup(null);
      const result = await trackMotorRequest(code);
      setTrackingLookup(result);
    } catch (error) {
      setTrackingError(getTrackingErrorMessage(error));
    } finally {
      setIsTracking(false);
    }
  };

  const updateDocument = (key: DocumentKey, file?: UploadFile) => {
    setDocuments((current) => ({ ...current, [key]: file }));
    setErrors((current) => ({ ...current, documents: undefined }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setVehicleImages([]);
    setDocuments({});
    setErrors({});
  };

  const copyRequestNumber = async () => {
    if (!requestNumber) return;

    try {
      await navigator.clipboard.writeText(requestNumber);
      setCopiedRequestNumber(true);
      window.setTimeout(() => setCopiedRequestNumber(false), 1800);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = requestNumber;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedRequestNumber(true);
      window.setTimeout(() => setCopiedRequestNumber(false), 1800);
    }
  };

  const downloadRequestPdf = () => {
    if (!requestNumber || !trackingNumber) return;

    const snapshot = submittedForm ?? form;
    const submittedAt = new Intl.DateTimeFormat(language === "ar" ? "ar-IQ" : "en", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date());
    const value = (text: string | boolean | undefined) => (typeof text === "string" && text.trim() ? text : "-");
    const rows = [
      [t.requestNumber, requestNumber],
      [t.trackingNumber, trackingNumber],
      [language === "ar" ? "حالة الطلب" : "Request status", t.trackReceived],
      [language === "ar" ? "وقت الإرسال" : "Submitted at", submittedAt],
      [t.fullName, value(snapshot.fullName)],
      [t.phone, value(snapshot.phone)],
      [t.email, value(snapshot.email)],
      [t.nationalId, value(snapshot.nationalId)],
      [t.city, value(snapshot.city)],
      [t.address, value(snapshot.address)],
      [t.vehicleType, value(snapshot.vehicleType)],
      [t.manufacturer, value(snapshot.manufacturer)],
      [t.model, value(snapshot.model)],
      [t.year, value(snapshot.year)],
      [t.color, value(snapshot.color)],
      [t.plateNumber, value(snapshot.plateNumber)],
      [t.chassisNumber, value(snapshot.chassisNumber)],
      [t.engineNumber, value(snapshot.engineNumber)],
      [t.estimatedValue, value(snapshot.estimatedValue)],
      [t.notes, value(snapshot.notes)],
    ];
    const escapeHtml = (text: string) =>
      text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
    const printable = window.open("", "_blank", "width=900,height=1100");

    if (!printable) return;

    printable.document.write(`<!doctype html>
<html lang="${language}" dir="${direction}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(t.requestNumber)} ${escapeHtml(requestNumber)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #14231b; font-family: "Segoe UI", Tahoma, Arial, sans-serif; background: #fff; }
    .sheet { min-height: 100vh; border: 1px solid #d9e6dc; padding: 24px; }
    .head { display: flex; justify-content: space-between; gap: 18px; border-bottom: 3px solid #0f8a4b; padding-bottom: 18px; }
    .brand { color: #0b5d3b; font-size: 22px; font-weight: 900; }
    .title { margin: 10px 0 0; font-size: 28px; font-weight: 900; }
    .status { align-self: start; border: 1px solid #bfe3cc; background: #eefaf2; color: #0b5d3b; padding: 12px 16px; border-radius: 8px; font-weight: 900; }
    .numbers { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 22px 0; }
    .number { border: 1px solid #d9e6dc; background: #f7fbf8; padding: 14px; border-radius: 8px; }
    .number span, dt { color: #64736a; font-size: 12px; font-weight: 800; }
    .number strong { display: block; margin-top: 6px; color: #0b5d3b; font-size: 18px; }
    h2 { margin: 22px 0 12px; color: #14231b; font-size: 18px; }
    dl { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 0; }
    .item { border: 1px solid #e3ece6; padding: 11px 12px; border-radius: 8px; min-height: 66px; }
    dd { margin: 5px 0 0; font-size: 15px; font-weight: 800; overflow-wrap: anywhere; }
    .foot { margin-top: 24px; padding-top: 14px; border-top: 1px solid #d9e6dc; color: #64736a; line-height: 1.8; }
  </style>
</head>
<body>
  <main class="sheet">
    <section class="head">
      <div>
        <div class="brand">${escapeHtml(t.brand)}</div>
        <div class="title">${escapeHtml(language === "ar" ? "استمارة طلب تأمين مركبة" : "Motor Insurance Application")}</div>
      </div>
      <div class="status">${escapeHtml(t.trackReceived)}</div>
    </section>
    <section class="numbers">
      <div class="number"><span>${escapeHtml(t.requestNumber)}</span><strong>${escapeHtml(requestNumber)}</strong></div>
      <div class="number"><span>${escapeHtml(t.trackingNumber)}</span><strong>${escapeHtml(trackingNumber)}</strong></div>
    </section>
    <h2>${escapeHtml(language === "ar" ? "معلومات الإرسال وحالة الطلب" : "Submission and Status")}</h2>
    <dl>${rows
      .map(([label, text]) => `<div class="item"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(text))}</dd></div>`)
      .join("")}</dl>
    <p class="foot">${escapeHtml(t.successBody)}</p>
  </main>
  <script>window.addEventListener("load", () => { window.print(); });</script>
</body>
</html>`);
    printable.document.close();
  };

  const getSubmitErrorMessage = (error: unknown) => {
    if (isDevelopment && error instanceof Error) {
      if (error instanceof ApiError && error.responseBody) {
        return `${error.message} Response: ${error.responseBody}`;
      }

      return error.message;
    }

    if (error instanceof ApiError) {
      if (error.status === 400) return t.submitError400;
      if (error.status === 401) return t.submitError401;
      if (error.status === 404) return t.submitError404;
      if (error.status === 413) return t.submitError413;
      if (error.status >= 500) return t.submitError500;
    }

    return t.submitErrorGeneric;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isFormLocked) return;

    const parsed = schema.safeParse(form);
    const nextErrors: Errors = {};
    setSubmitError(null);
    setRequestNumber(null);
    setTrackingNumber(null);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        nextErrors[String(issue.path[0])] = issue.message;
      }
    }

    if (vehicleImages.length < 5) nextErrors.vehicleImages = t.imagesMin;
    if (!documentKeys.every((key) => documents[key])) nextErrors.documents = t.documentsRequired;

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      try {
        setIsSubmitting(true);
        const result = await submitMotorRequest(
          { form, vehicleImages, documents, agentCode },
          {
            onProgress: setUploadProgress,
          },
        );
        setSubmittedForm(form);
        resetForm();
        setRequestNumber(result.requestNumber);
        setTrackingNumber(result.trackingNumber);
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      } catch (error) {
        setSubmitError(getSubmitErrorMessage(error));
      } finally {
        setUploadProgress(null);
        setIsSubmitting(false);
      }
    }
  };

  const submitEngineering = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isEngineeringSubmitting) return;

    const parsed = engineeringSchema.safeParse(engineeringForm);
    const nextErrors: Errors = {};
    setEngineeringSubmitError(null);
    setEngineeringRequest(null);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        nextErrors[String(issue.path[0])] = issue.message;
      }
    }

    if (!engineeringForm.confirmed) {
      nextErrors.confirmed = t.fieldRequired;
    }

    setEngineeringErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      setIsEngineeringSubmitting(true);
      const result = await submitEngineeringRequest(engineeringForm, agentCode);
      setEngineeringRequest(result);
      setEngineeringForm(initialEngineeringForm);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (error) {
      setEngineeringSubmitError(getSubmitErrorMessage(error));
    } finally {
      setIsEngineeringSubmitting(false);
    }
  };

  const submitHealth = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isHealthSubmitting) return;

    const parsed = healthSchema.safeParse(healthForm);
    const nextErrors: Errors = {};
    setHealthSubmitError(null);
    setHealthRequest(null);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        nextErrors[String(issue.path[0])] = issue.message;
      }
    }

    if (!healthForm.confirmed) {
      nextErrors.confirmed = t.fieldRequired;
    }

    if (healthForm.hasChronicConditions && !healthForm.chronicConditions.trim()) {
      nextErrors.chronicConditions = t.fieldRequired;
    }

    if (healthForm.previousInsurance && !healthForm.previousInsurer.trim()) {
      nextErrors.previousInsurer = t.fieldRequired;
    }

    setHealthErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      setIsHealthSubmitting(true);
      const result = await submitHealthRequest(healthForm, agentCode);
      setHealthRequest(result);
      setHealthForm(initialHealthForm);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (error) {
      setHealthSubmitError(getSubmitErrorMessage(error));
    } finally {
      setIsHealthSubmitting(false);
    }
  };

  const submitFireTheft = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isFireTheftSubmitting) return;

    const parsed = fireTheftSchema.safeParse(fireTheftForm);
    const nextErrors: Errors = {};
    setFireTheftSubmitError(null);
    setFireTheftRequest(null);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        nextErrors[String(issue.path[0])] = issue.message;
      }
    }

    if (!fireTheftForm.confirmed) {
      nextErrors.confirmed = t.fieldRequired;
    }

    setFireTheftErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      setIsFireTheftSubmitting(true);
      const result = await submitFireTheftRequest(fireTheftForm, agentCode);
      setFireTheftRequest(result);
      setFireTheftForm(initialFireTheftForm);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : getSubmitErrorMessage(error);
      setFireTheftSubmitError(message || getSubmitErrorMessage(error));
      window.setTimeout(() => {
        document.getElementById("fire-theft-submit-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
    } finally {
      setIsFireTheftSubmitting(false);
    }
  };

  const submitGeneralAccident = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isGeneralAccidentSubmitting) return;

    const parsed = generalAccidentSchema.safeParse(generalAccidentForm);
    const nextErrors: Errors = {};
    setGeneralAccidentSubmitError(null);
    setGeneralAccidentRequest(null);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        nextErrors[String(issue.path[0])] = issue.message;
      }
    }

    if (!generalAccidentForm.confirmed) {
      nextErrors.confirmed = t.fieldRequired;
    }

    setGeneralAccidentErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      setIsGeneralAccidentSubmitting(true);
      const result = await submitGeneralAccidentRequest(generalAccidentForm, agentCode);
      setGeneralAccidentRequest(result);
      setGeneralAccidentForm(initialGeneralAccidentForm);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : getSubmitErrorMessage(error);
      setGeneralAccidentSubmitError(message || getSubmitErrorMessage(error));
      window.setTimeout(() => {
        document.getElementById("general-accident-submit-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
    } finally {
      setIsGeneralAccidentSubmitting(false);
    }
  };

  const submitTravel = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isTravelSubmitting) return;

    const parsed = travelSchema.safeParse(travelForm);
    const nextErrors: Errors = {};
    setTravelSubmitError(null);
    setTravelRequest(null);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        nextErrors[String(issue.path[0])] = issue.message;
      }
    }

    if (!travelForm.confirmed) {
      nextErrors.confirmed = t.fieldRequired;
    }

    if (travelForm.hasMedicalConditions && !travelForm.medicalConditions.trim()) {
      nextErrors.medicalConditions = t.fieldRequired;
    }

    setTravelErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstErrorKey = Object.keys(nextErrors)[0];
      window.setTimeout(() => {
        document.getElementById(`travel-${firstErrorKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      return;
    }

    try {
      setIsTravelSubmitting(true);
      const result = await submitTravelRequest(travelForm, agentCode);
      setTravelRequest(result);
      setTravelForm(initialTravelForm);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : getSubmitErrorMessage(error);
      setTravelSubmitError(message || getSubmitErrorMessage(error));
      window.setTimeout(() => {
        document.getElementById("travel-submit-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
    } finally {
      setIsTravelSubmitting(false);
    }
  };

  const trackingActiveIndex = trackingLookup ? trackingStatusIndex[trackingLookup.status] : 0;
  const trackingUpdatedAt = trackingLookup
    ? new Intl.DateTimeFormat(language === "ar" ? "ar-IQ" : "en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(trackingLookup.updatedAt))
    : "";
  const trackingTheme = trackingLookup ? trackingStatusTheme[trackingLookup.status] : trackingStatusTheme.RECEIVED;
  const trackingThemeStyle = { "--status-accent": trackingTheme.color } as CSSProperties;
  const trackingDialogTitle = language === "ar" ? "تفاصيل تتبع الطلب" : "Application Tracking Details";
  const trackingDialogSubtitle =
    language === "ar"
      ? "ملخص الحالة الحالية وآخر تفاصيل الطلب المسجلة في النظام."
      : "A summary of the current status and the latest request details in the system.";
  const closeTrackingLabel = language === "ar" ? "إغلاق" : "Close";
  const trackingSubjectLabel =
    trackingLookup?.requestType === "engineering"
      ? language === "ar"
        ? "المشروع"
        : "Project"
      : trackingLookup?.requestType === "health"
        ? language === "ar"
          ? "الخطة الصحية"
          : "Health plan"
      : trackingLookup?.requestType === "fireTheft"
        ? language === "ar"
          ? "العقار"
          : "Property"
      : trackingLookup?.requestType === "generalAccident"
        ? language === "ar"
          ? "المؤمن له"
          : "Insured"
      : trackingLookup?.requestType === "travel"
        ? language === "ar"
          ? "الوجهة"
          : "Destination"
      : t.vehicle;
  const trackingSubjectValue = trackingLookup?.subject ?? trackingLookup?.vehicle ?? trackingLookup?.health?.planType ?? trackingLookup?.property?.type ?? trackingLookup?.accident?.insuredName ?? trackingLookup?.travel?.destinationCountry ?? "-";

  return (
    <div className={`${darkMode ? "app dark" : "app"} ${isFormLocked ? "app-busy" : ""}`} dir={direction} lang={language}>
      {uploadProgress ? (
        <motion.div
          className="upload-overlay"
          role="alertdialog"
          aria-modal="true"
          aria-live="assertive"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.24 }}
        >
          <motion.div className="upload-overlay-card" initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.32 }}>
            <div className="upload-progress-ring" style={{ "--upload-progress": `${uploadProgress.percent * 3.6}deg` } as CSSProperties}>
              <span>{uploadProgress.percent}%</span>
            </div>
            <div className="upload-overlay-copy">
              <strong>{uploadProgress.phase === "submitting" ? "تم رفع الملفات بنجاح..." : "Uploading your files..."}</strong>
              <span>{uploadProgress.phase === "submitting" ? "جاري إرسال الطلب..." : `Uploading file ${uploadProgress.currentFile} of ${uploadProgress.totalFiles}...`}</span>
              <p>
                يرجى الانتظار...
                <br />
                يتم الآن رفع الملفات بشكل آمن.
              </p>
              <p>لا تغلق الصفحة ولا تقم بتحديثها حتى يكتمل رفع الطلب.</p>
            </div>
            <div className="upload-progress-bar" aria-hidden="true">
              <span style={{ width: `${uploadProgress.percent}%` }} />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
      <header className="site-header">
        <a className="brand" href="/" onClick={navigate("home")} aria-label={t.brand}>
          <img src="/brand/iraq-takaful-logo.png" alt={t.brand} />
          <span>{t.portal}</span>
        </a>
        <nav className="header-actions" aria-label="روابط الصفحات">
          <a className={navClass("home")} href="/" onClick={navigate("home")}>
            <Home size={18} aria-hidden="true" />
            الرئيسية
          </a>
          <a className={navClass("motor")} href="/motor" onClick={navigate("motor")}>
            <CarFront size={18} aria-hidden="true" />
            طلب مركبات
          </a>
          <a className={navClass("engineering")} href="/engineering" onClick={navigate("engineering")}>
            <Building2 size={18} aria-hidden="true" />
            تأمين هندسي
          </a>
          <a className={navClass("health")} href="/health" onClick={navigate("health")}>
            <HeartPulse size={18} aria-hidden="true" />
            تأمين صحي
          </a>
          <a className={navClass("fire-theft")} href="/fire-theft" onClick={navigate("fire-theft")}>
            <Flame size={18} aria-hidden="true" />
            حريق وسرقة
          </a>
          <a className={navClass("general-accident")} href="/general-accident" onClick={navigate("general-accident")}>
            <ShieldAlert size={18} aria-hidden="true" />
            حوادث عامة
          </a>
          <a className={navClass("travel")} href="/travel" onClick={navigate("travel")}>
            <Plane size={18} aria-hidden="true" />
            سفر
          </a>
          <a className={navClass("track")} href="/track" onClick={navigate("track")}>
            <MapPinned size={18} aria-hidden="true" />
            تتبع
          </a>
          <a className={navClass("support")} href="/support" onClick={navigate("support")}>
            <Phone size={18} aria-hidden="true" />
            {t.support}
          </a>
          <button className="icon-button" type="button" disabled={isFormLocked} onClick={() => setLanguage(language === "ar" ? "en" : "ar")}>
            <Globe2 size={18} aria-hidden="true" />
            {t.language}
          </button>
          <button className="icon-button" type="button" disabled={isFormLocked} onClick={() => setDarkMode((value) => !value)}>
            {darkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            {darkMode ? t.light : t.dark}
          </button>
        </nav>
      </header>

      <main id="top">
        {showHome ? (
          <>
        <motion.section
          className="intro-banner"
          initial={{ opacity: 0, y: -18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          aria-label={t.headline}
        >
          <motion.div
            className="intro-glow"
            animate={{ x: ["-18%", "18%", "-18%"], opacity: [0.55, 0.9, 0.55] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          />
          <motion.p
            className="intro-title"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {t.headline}
          </motion.p>
        </motion.section>

        <section className="hero">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="eyebrow">
              <ShieldCheck size={18} aria-hidden="true" />
              {t.brand}
            </span>
            <h1>بوابة طلبات التأمين</h1>
            <p>قدّم طلب تأمين المركبات أو التأمين الهندسي، تابع حالة طلبك، وتواصل مع فريق الدعم من مكان واحد.</p>
            <a className="primary-link" href="/motor" onClick={navigate("motor")}>
              <CarFront size={20} aria-hidden="true" />
              طلب تأمين مركبات
            </a>
            <a className="ghost-link" href="/engineering" onClick={navigate("engineering")}>
              <Building2 size={20} aria-hidden="true" />
              طلب تأمين هندسي
            </a>
            <a className="ghost-link" href="/health" onClick={navigate("health")}>
              <HeartPulse size={20} aria-hidden="true" />
              طلب تأمين صحي
            </a>
            <a className="ghost-link" href="/fire-theft" onClick={navigate("fire-theft")}>
              <Flame size={20} aria-hidden="true" />
              طلب تأمين حريق وسرقة
            </a>
            <a className="ghost-link" href="/general-accident" onClick={navigate("general-accident")}>
              <ShieldAlert size={20} aria-hidden="true" />
              طلب تأمين حوادث عامة
            </a>
            <a className="ghost-link" href="/travel" onClick={navigate("travel")}>
              <Plane size={20} aria-hidden="true" />
              طلب تأمين سفر
            </a>
            <a className="ghost-link" href="/track" onClick={navigate("track")}>
              <MapPinned size={20} aria-hidden="true" />
              {t.trackRequest}
            </a>
            <a className="ghost-link" href="/support" onClick={navigate("support")}>
              <Phone size={20} aria-hidden="true" />
              {t.support}
            </a>
          </motion.div>
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            aria-hidden="true"
          >
            <div className="car-scene">
              <div className="sun-disc" />
              <div className="road" />
              <svg viewBox="0 0 620 320" role="img">
                <path className="car-shadow" d="M109 245C172 222 458 221 520 245C474 273 167 274 109 245Z" />
                <path className="car-body" d="M95 199C126 160 171 139 226 135L274 83H405C454 90 492 128 522 174L555 185C576 192 588 211 584 234H64C62 219 72 205 95 199Z" />
                <path className="car-window" d="M246 132L286 93H397C429 98 455 123 477 154H214L246 132Z" />
                <path className="car-accent" d="M115 194H538" />
                <circle className="wheel" cx="183" cy="235" r="42" />
                <circle className="wheel" cx="475" cy="235" r="42" />
                <circle className="wheel-inner" cx="183" cy="235" r="18" />
                <circle className="wheel-inner" cx="475" cy="235" r="18" />
              </svg>
            </div>
          </motion.div>
        </section>

        <section className="home-actions" aria-label="خدمات بوابة التأمين">
          <article>
            <span><CarFront size={22} aria-hidden="true" /></span>
            <h2>تأمين المركبات</h2>
            <p>املأ بيانات العميل والمركبة وارفع الصور والمستندات المطلوبة لإرسال الطلب إلى النظام.</p>
            <a href="/motor" onClick={navigate("motor")}>ابدأ الطلب</a>
          </article>
          <article>
            <span><Building2 size={22} aria-hidden="true" /></span>
            <h2>التأمين الهندسي</h2>
            <p>قدّم تفاصيل المشروع وقيمة العقد ونوع التغطية ليتم تسجيل طلب هندسي جديد.</p>
            <a href="/engineering" onClick={navigate("engineering")}>فتح الفورمة</a>
          </article>
          <article>
            <span><HeartPulse size={22} aria-hidden="true" /></span>
            <h2>التأمين الصحي</h2>
            <p>قدّم بيانات العميل وخطة التغطية وعدد المؤمنين والحالة الصحية لإرسال طلب صحي جديد إلى النظام.</p>
            <a href="/health" onClick={navigate("health")}>فتح الفورمة</a>
          </article>
          <article>
            <span><Flame size={22} aria-hidden="true" /></span>
            <h2>تأمين الحريق والسرقة</h2>
            <p>سجّل بيانات العقار وقيمة المبنى والمحتويات وأنظمة السلامة لإرسال طلب تأمين جديد.</p>
            <a href="/fire-theft" onClick={navigate("fire-theft")}>فتح الفورمة</a>
          </article>
          <article>
            <span><ShieldAlert size={22} aria-hidden="true" /></span>
            <h2>تأمين الحوادث العامة</h2>
            <p>سجّل نشاط العمل وموقع الخطر وحدود التغطية لإرسال طلب حوادث عامة ومسؤولية طرف ثالث.</p>
            <a href="/general-accident" onClick={navigate("general-accident")}>فتح الفورمة</a>
          </article>
          <article>
            <span><Plane size={22} aria-hidden="true" /></span>
            <h2>تأمين السفر</h2>
            <p>سجّل بيانات المسافر والوجهة وتواريخ الرحلة ونوع التغطية لإرسال طلب تأمين سفر.</p>
            <a href="/travel" onClick={navigate("travel")}>فتح الفورمة</a>
          </article>
          <article>
            <span><MapPinned size={22} aria-hidden="true" /></span>
            <h2>تتبع الطلب</h2>
            <p>استخدم رقم التتبع لمعرفة مرحلة معالجة الطلب وآخر تحديث مسجل.</p>
            <a href="/track" onClick={navigate("track")}>تتبع الآن</a>
          </article>
          <article>
            <span><Phone size={22} aria-hidden="true" /></span>
            <h2>الدعم</h2>
            <p>تواصل مع فريق عراق تكافل عبر الهاتف أو واتساب أو البريد الإلكتروني.</p>
            <a href="/support" onClick={navigate("support")}>معلومات الدعم</a>
          </article>
        </section>
          </>
        ) : null}

        {showTrackingPage ? (
        <motion.section id="track-request" className="panel tracking-panel" {...sectionAnimation}>
          <div className="tracking-header">
            <span className="eyebrow">
              <FileSearch size={18} aria-hidden="true" />
              {t.trackEyebrow}
            </span>
            <h2>{t.trackTitle}</h2>
            <p>{t.trackSubtitle}</p>
          </div>

          <form className="tracking-form" onSubmit={lookupTracking}>
            <FloatingField
              id="tracking-code"
              label={t.trackingNumber}
              value={trackingInput}
              required
              onChange={(event) => setTrackingInput(event.target.value)}
            />
            <button className="submit-button" type="submit" disabled={isTracking || isFormLocked}>
              {isTracking ? <span className="spinner" aria-hidden="true" /> : <MapPinned size={20} aria-hidden="true" />}
              {isTracking ? t.trackingLoading : t.trackButton}
            </button>
          </form>

          {trackingError ? <p className="submit-error" role="alert">{trackingError}</p> : null}

          <ol
            className={`tracking-timeline status-${trackingTheme.name}`}
            style={trackingThemeStyle}
            aria-label={t.trackTitle}
          >
            {trackingSteps.map((step, index) => {
              const isDone = trackingLookup ? index <= trackingActiveIndex : index === 0;
              const isActive = trackingLookup ? index === trackingActiveIndex : index === 0;

              return (
                <li key={step} className={`${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                  <span className="timeline-dot">
                    {isDone ? <CheckCircle2 size={20} aria-hidden="true" /> : <Clock3 size={18} aria-hidden="true" />}
                  </span>
                  <strong>{step}</strong>
                  <small>{isDone ? t.completed : t.pending}</small>
                </li>
              );
            })}
          </ol>

          {trackingLookup ? (
            <motion.div
              className="tracking-modal-backdrop"
              role="presentation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onMouseDown={() => setTrackingLookup(null)}
            >
              <motion.div
                className={`tracking-modal status-${trackingTheme.name}`}
                style={trackingThemeStyle}
                role="dialog"
                aria-modal="true"
                aria-labelledby="tracking-modal-title"
                initial={{ opacity: 0, y: 22, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22 }}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <button className="modal-close" type="button" onClick={() => setTrackingLookup(null)} aria-label={closeTrackingLabel}>
                  <X size={20} aria-hidden="true" />
                </button>

                <div className="tracking-modal-head">
                  <span className="status-mark">
                    {trackingLookup.status === "REJECTED" ? <AlertTriangle size={26} aria-hidden="true" /> : <ClipboardList size={26} aria-hidden="true" />}
                  </span>
                  <div>
                    <span className="modal-eyebrow">{t.trackEyebrow}</span>
                    <h3 id="tracking-modal-title">{trackingDialogTitle}</h3>
                    <p>{trackingDialogSubtitle}</p>
                  </div>
                </div>

                <section className="status-hero" aria-label={t.currentStatus}>
                  <span>{t.currentStatus}</span>
                  <strong>{trackingLookup.statusLabel}</strong>
                  <p>{trackingStatusDescription[language][trackingLookup.status]}</p>
                </section>

                <dl className="tracking-modal-details">
                  <div>
                    <dt>{t.trackingNumber}</dt>
                    <dd>{trackingLookup.trackingNumber}</dd>
                  </div>
                  <div>
                    <dt>{t.requestNumber}</dt>
                    <dd>{trackingLookup.requestNumber}</dd>
                  </div>
                  <div>
                    <dt>{t.customer}</dt>
                    <dd>{trackingLookup.customerName}</dd>
                  </div>
                  <div>
                    <dt>{trackingSubjectLabel}</dt>
                    <dd>{trackingSubjectValue}</dd>
                  </div>
                  {trackingLookup.requestType === "engineering" && trackingLookup.project?.type ? (
                    <div>
                      <dt>{language === "ar" ? "نوع المشروع" : "Project type"}</dt>
                      <dd>{trackingLookup.project.type}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "engineering" && trackingLookup.project?.insuranceType ? (
                    <div>
                      <dt>{language === "ar" ? "نوع التأمين" : "Insurance type"}</dt>
                      <dd>{trackingLookup.project.insuranceType}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "engineering" && trackingLookup.project?.location ? (
                    <div>
                      <dt>{language === "ar" ? "موقع المشروع" : "Project location"}</dt>
                      <dd>{trackingLookup.project.location}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "health" && trackingLookup.health?.coverageScope ? (
                    <div>
                      <dt>{language === "ar" ? "نطاق التغطية" : "Coverage scope"}</dt>
                      <dd>{trackingLookup.health.coverageScope}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "health" && trackingLookup.health?.insuredMembersCount ? (
                    <div>
                      <dt>{language === "ar" ? "عدد المؤمنين" : "Insured members"}</dt>
                      <dd>{trackingLookup.health.insuredMembersCount}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "fireTheft" && trackingLookup.property?.address ? (
                    <div>
                      <dt>{language === "ar" ? "عنوان العقار" : "Property address"}</dt>
                      <dd>{trackingLookup.property.address}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "fireTheft" && trackingLookup.property?.totalSumInsured ? (
                    <div>
                      <dt>{language === "ar" ? "مبلغ التأمين" : "Sum insured"}</dt>
                      <dd>{`${trackingLookup.property.totalSumInsured} ${trackingLookup.property.currency ?? ""}`.trim()}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "generalAccident" && trackingLookup.accident?.accidentType ? (
                    <div>
                      <dt>{language === "ar" ? "نوع الحادث" : "Accident type"}</dt>
                      <dd>{trackingLookup.accident.accidentType}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "generalAccident" && trackingLookup.accident?.riskLocation ? (
                    <div>
                      <dt>{language === "ar" ? "موقع الخطر" : "Risk location"}</dt>
                      <dd>{trackingLookup.accident.riskLocation}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "generalAccident" && trackingLookup.accident?.coverageLimit ? (
                    <div>
                      <dt>{language === "ar" ? "حد التغطية" : "Coverage limit"}</dt>
                      <dd>{`${trackingLookup.accident.coverageLimit} ${trackingLookup.accident.currency ?? ""}`.trim()}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "travel" && trackingLookup.travel?.coverageType ? (
                    <div>
                      <dt>{language === "ar" ? "نوع التغطية" : "Coverage type"}</dt>
                      <dd>{trackingLookup.travel.coverageType}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "travel" && trackingLookup.travel?.travelersCount ? (
                    <div>
                      <dt>{language === "ar" ? "عدد المسافرين" : "Travelers"}</dt>
                      <dd>{trackingLookup.travel.travelersCount}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>{t.updatedAt}</dt>
                    <dd>{trackingUpdatedAt}</dd>
                  </div>
                  <div>
                    <dt>{t.statusCode}</dt>
                    <dd>{trackingLookup.status}</dd>
                  </div>
                </dl>

                <ol className="tracking-modal-steps" aria-label={t.trackTitle}>
                  {trackingSteps.map((step, index) => {
                    const isDone = index <= trackingActiveIndex;
                    const isActive = index === trackingActiveIndex;

                    return (
                      <li key={step} className={`${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                        <span>{isDone ? <CheckCircle2 size={18} aria-hidden="true" /> : <Clock3 size={17} aria-hidden="true" />}</span>
                        <div>
                          <strong>{step}</strong>
                          <small>{isDone ? t.completed : t.pending}</small>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </motion.div>
            </motion.div>
          ) : null}
        </motion.section>
        ) : null}

        {showEngineeringPage ? (
          <>
            <motion.section className="engineering-hero" {...sectionAnimation}>
              <div>
                <span className="eyebrow">
                  <Building2 size={18} aria-hidden="true" />
                  تأمين المشاريع الهندسية
                </span>
                <h1>طلب تأمين هندسي</h1>
                <p>أدخل بيانات العميل والمشروع حتى يتم إرسال الطلب مباشرة إلى نظام TRINSU.</p>
              </div>
              <div className="engineering-metrics" aria-hidden="true">
                <span>CAR</span>
                <strong>Contractors All Risks</strong>
                <small>Engineering request</small>
              </div>
            </motion.section>

            <form id="engineering-request-form" className="request-form" onSubmit={submitEngineering} noValidate>
              <fieldset className="form-fieldset" disabled={isEngineeringSubmitting}>
                <motion.section className="panel" {...sectionAnimation}>
                  <h2>معلومات العميل</h2>
                  <div className="grid two">
                    <FloatingField id="eng-fullName" label="الاسم الكامل" value={engineeringForm.fullName} error={engineeringErrors.fullName} required onChange={setEngineeringValue("fullName")} />
                    <FloatingField id="eng-mobile" label="رقم الموبايل" value={engineeringForm.mobile} error={engineeringErrors.mobile} required inputMode="tel" onChange={setEngineeringValue("mobile")} />
                    <FloatingField id="eng-email" label="البريد الإلكتروني" value={engineeringForm.email} error={engineeringErrors.email} type="email" onChange={setEngineeringValue("email")} />
                    <FloatingField id="eng-nationalId" label="الرقم الوطني" value={engineeringForm.nationalId} error={engineeringErrors.nationalId} onChange={setEngineeringValue("nationalId")} />
                    <FloatingField id="eng-city" label="المدينة" value={engineeringForm.city} error={engineeringErrors.city} onChange={setEngineeringValue("city")} />
                    <FloatingField id="eng-address" label="العنوان" value={engineeringForm.address} error={engineeringErrors.address} onChange={setEngineeringValue("address")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>معلومات المشروع</h2>
                  <div className="grid three">
                    <FloatingField id="eng-projectName" label="اسم المشروع" value={engineeringForm.projectName} error={engineeringErrors.projectName} required onChange={setEngineeringValue("projectName")} />
                    <FloatingField id="eng-projectType" label="نوع المشروع" value={engineeringForm.projectType} error={engineeringErrors.projectType} required onChange={setEngineeringValue("projectType")} />
                    <FloatingField id="eng-projectLocation" label="موقع المشروع" value={engineeringForm.projectLocation} error={engineeringErrors.projectLocation} required onChange={setEngineeringValue("projectLocation")} />
                    <FloatingField id="eng-contractValue" label="قيمة العقد" value={engineeringForm.contractValue} error={engineeringErrors.contractValue} required inputMode="decimal" onChange={setEngineeringValue("contractValue")} />
                    <FloatingField id="eng-currency" label="العملة" value={engineeringForm.currency} error={engineeringErrors.currency} required onChange={setEngineeringValue("currency")} />
                    <FloatingField id="eng-insuranceType" label="نوع التأمين" value={engineeringForm.insuranceType} error={engineeringErrors.insuranceType} required onChange={setEngineeringValue("insuranceType")} />
                    <FloatingField id="eng-startDate" label="تاريخ بداية المشروع" value={engineeringForm.startDate} error={engineeringErrors.startDate} type="date" onChange={setEngineeringValue("startDate")} />
                    <FloatingField id="eng-endDate" label="تاريخ نهاية المشروع" value={engineeringForm.endDate} error={engineeringErrors.endDate} type="date" onChange={setEngineeringValue("endDate")} />
                    <FloatingField id="eng-contractorName" label="اسم المقاول" value={engineeringForm.contractorName} error={engineeringErrors.contractorName} onChange={setEngineeringValue("contractorName")} />
                    <FloatingField id="eng-ownerName" label="اسم مالك المشروع" value={engineeringForm.ownerName} error={engineeringErrors.ownerName} onChange={setEngineeringValue("ownerName")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>تفاصيل إضافية</h2>
                  <div className="grid two">
                    <FloatingField id="eng-riskDetails" label="تفاصيل المخاطر" value={engineeringForm.riskDetails} error={engineeringErrors.riskDetails} multiline rows={6} onChange={setEngineeringValue("riskDetails")} />
                    <FloatingField id="eng-notes" label="ملاحظات" value={engineeringForm.notes} error={engineeringErrors.notes} multiline rows={6} onChange={setEngineeringValue("notes")} />
                  </div>
                </motion.section>

                <motion.section className="panel review-panel" {...sectionAnimation}>
                  <h2>مراجعة الطلب</h2>
                  <div className="review-grid">
                    <span>العميل</span>
                    <strong>{engineeringForm.fullName || "-"}</strong>
                    <span>المشروع</span>
                    <strong>{engineeringForm.projectName || "-"}</strong>
                    <span>نوع التأمين</span>
                    <strong>{engineeringForm.insuranceType || "-"}</strong>
                    <span>قيمة العقد</span>
                    <strong>{engineeringForm.contractValue ? `${engineeringForm.contractValue} ${engineeringForm.currency}` : "-"}</strong>
                  </div>
                  <label className={`confirm ${engineeringErrors.confirmed ? "field-error" : ""}`}>
                    <input type="checkbox" checked={engineeringForm.confirmed} onChange={setEngineeringValue("confirmed")} />
                    <span>أؤكد صحة المعلومات وأوافق على إرسال الطلب إلى TRINSU.</span>
                  </label>
                  {engineeringErrors.confirmed ? <p className="error-text">{engineeringErrors.confirmed}</p> : null}
                  {engineeringSubmitError ? <p className="submit-error" role="alert">{engineeringSubmitError}</p> : null}
                  <button className="submit-button" type="submit" disabled={isEngineeringSubmitting}>
                    {isEngineeringSubmitting ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
                    {isEngineeringSubmitting ? "جاري الإرسال" : "إرسال طلب التأمين"}
                  </button>
                </motion.section>

                {engineeringRequest ? (
                  <motion.section className="success-panel" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <CheckCircle2 size={42} aria-hidden="true" />
                    <h2>تم إرسال طلب التأمين الهندسي</h2>
                    <p>تم تسجيل الطلب في نظام TRINSU بنجاح.</p>
                    <div className="success-numbers">
                      <div>
                        <span>رقم الطلب</span>
                        <strong>{engineeringRequest.requestNumber}</strong>
                      </div>
                      <div>
                        <span>رقم التتبع</span>
                        <strong>{engineeringRequest.trackingNumber}</strong>
                      </div>
                    </div>
                    <div className="success-status">
                      <span>الحالة</span>
                      <strong>{engineeringRequest.status}</strong>
                    </div>
                  </motion.section>
                ) : null}
              </fieldset>
            </form>
          </>
        ) : null}

        {showHealthPage ? (
          <>
            <motion.section className="engineering-hero health-hero" {...sectionAnimation}>
              <div>
                <span className="eyebrow">
                  <HeartPulse size={18} aria-hidden="true" />
                  طلبات التأمين الصحي
                </span>
                <h1>طلب تأمين صحي</h1>
                <p>أدخل بيانات العميل وخطة التغطية الصحية ليتم تسجيل الطلب ومتابعته داخل النظام.</p>
              </div>
              <div className="engineering-metrics health-metrics" aria-hidden="true">
                <span>HLT</span>
                <strong>Health Insurance</strong>
                <small>Medical coverage request</small>
              </div>
            </motion.section>

            <form id="health-request-form" className="request-form" onSubmit={submitHealth} noValidate>
              <fieldset className="form-fieldset" disabled={isHealthSubmitting}>
                <motion.section className="panel" {...sectionAnimation}>
                  <h2>معلومات العميل</h2>
                  <div className="grid three">
                    <FloatingField id="health-fullName" label="الاسم الكامل" value={healthForm.fullName} error={healthErrors.fullName} required onChange={setHealthValue("fullName")} />
                    <FloatingField id="health-mobile" label="رقم الموبايل" value={healthForm.mobile} error={healthErrors.mobile} required inputMode="tel" onChange={setHealthValue("mobile")} />
                    <FloatingField id="health-email" label="البريد الإلكتروني" value={healthForm.email} error={healthErrors.email} type="email" onChange={setHealthValue("email")} />
                    <FloatingField id="health-nationalId" label="الرقم الوطني" value={healthForm.nationalId} error={healthErrors.nationalId} required onChange={setHealthValue("nationalId")} />
                    <FloatingField id="health-age" label="العمر" value={healthForm.age} error={healthErrors.age} required inputMode="numeric" onChange={setHealthValue("age")} />
                    <FloatingField id="health-gender" label="الجنس" value={healthForm.gender} error={healthErrors.gender} required onChange={setHealthValue("gender")} />
                    <FloatingField id="health-city" label="المدينة" value={healthForm.city} error={healthErrors.city} required onChange={setHealthValue("city")} />
                    <FloatingField id="health-address" label="العنوان" value={healthForm.address} error={healthErrors.address} onChange={setHealthValue("address")} />
                    <FloatingField id="health-occupation" label="المهنة" value={healthForm.occupation} error={healthErrors.occupation} onChange={setHealthValue("occupation")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>تفاصيل التغطية الصحية</h2>
                  <div className="grid three">
                    <FloatingField id="health-planType" label="نوع الخطة" value={healthForm.planType} error={healthErrors.planType} required onChange={setHealthValue("planType")} />
                    <FloatingField id="health-coverageScope" label="نطاق التغطية" value={healthForm.coverageScope} error={healthErrors.coverageScope} required onChange={setHealthValue("coverageScope")} />
                    <FloatingField id="health-insuredMembersCount" label="عدد المؤمنين" value={healthForm.insuredMembersCount} error={healthErrors.insuredMembersCount} required inputMode="numeric" onChange={setHealthValue("insuredMembersCount")} />
                    <FloatingField id="health-companyName" label="اسم الشركة" value={healthForm.companyName} error={healthErrors.companyName} onChange={setHealthValue("companyName")} />
                    <FloatingField id="health-coverageStartDate" label="تاريخ بداية التغطية" value={healthForm.coverageStartDate} error={healthErrors.coverageStartDate} type="date" onChange={setHealthValue("coverageStartDate")} />
                    <FloatingField id="health-coverageEndDate" label="تاريخ نهاية التغطية" value={healthForm.coverageEndDate} error={healthErrors.coverageEndDate} type="date" onChange={setHealthValue("coverageEndDate")} />
                    <FloatingField id="health-estimatedAnnualPremium" label="القسط السنوي المتوقع" value={healthForm.estimatedAnnualPremium} error={healthErrors.estimatedAnnualPremium} inputMode="decimal" onChange={setHealthValue("estimatedAnnualPremium")} />
                    <FloatingField id="health-currency" label="العملة" value={healthForm.currency} error={healthErrors.currency} required onChange={setHealthValue("currency")} />
                    <FloatingField id="health-preferredHospitals" label="المستشفيات المفضلة" value={healthForm.preferredHospitals} error={healthErrors.preferredHospitals} onChange={setHealthValue("preferredHospitals")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>الحالة الصحية والتأمين السابق</h2>
                  <div className="grid two">
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={healthForm.hasChronicConditions} onChange={setHealthValue("hasChronicConditions")} />
                      <span>يوجد أمراض أو حالات مزمنة</span>
                    </label>
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={healthForm.previousInsurance} onChange={setHealthValue("previousInsurance")} />
                      <span>يوجد تأمين صحي سابق</span>
                    </label>
                    <FloatingField id="health-chronicConditions" label="تفاصيل الحالات المزمنة" value={healthForm.chronicConditions} error={healthErrors.chronicConditions} multiline rows={5} onChange={setHealthValue("chronicConditions")} />
                    <FloatingField id="health-previousInsurer" label="شركة التأمين السابقة" value={healthForm.previousInsurer} error={healthErrors.previousInsurer} onChange={setHealthValue("previousInsurer")} />
                    <FloatingField id="health-notes" label="ملاحظات" value={healthForm.notes} error={healthErrors.notes} multiline rows={5} onChange={setHealthValue("notes")} />
                  </div>
                </motion.section>

                <motion.section className="panel review-panel" {...sectionAnimation}>
                  <h2>مراجعة الطلب</h2>
                  <div className="review-grid">
                    <span>العميل</span>
                    <strong>{healthForm.fullName || "-"}</strong>
                    <span>الخطة</span>
                    <strong>{healthForm.planType || "-"}</strong>
                    <span>عدد المؤمنين</span>
                    <strong>{healthForm.insuredMembersCount || "-"}</strong>
                    <span>القسط المتوقع</span>
                    <strong>{healthForm.estimatedAnnualPremium ? `${healthForm.estimatedAnnualPremium} ${healthForm.currency}` : "-"}</strong>
                  </div>
                  <label className={`confirm ${healthErrors.confirmed ? "field-error" : ""}`}>
                    <input type="checkbox" checked={healthForm.confirmed} onChange={setHealthValue("confirmed")} />
                    <span>أؤكد صحة المعلومات وأوافق على إرسال طلب التأمين الصحي إلى TRINSU.</span>
                  </label>
                  {healthErrors.confirmed ? <p className="error-text">{healthErrors.confirmed}</p> : null}
                  {healthSubmitError ? <p className="submit-error" role="alert">{healthSubmitError}</p> : null}
                  <button className="submit-button" type="submit" disabled={isHealthSubmitting}>
                    {isHealthSubmitting ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
                    {isHealthSubmitting ? "جاري الإرسال" : "إرسال طلب التأمين الصحي"}
                  </button>
                </motion.section>

                {healthRequest ? (
                  <motion.section className="success-panel" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <CheckCircle2 size={42} aria-hidden="true" />
                    <h2>تم إرسال طلب التأمين الصحي</h2>
                    <p>تم تسجيل الطلب الصحي في نظام TRINSU بنجاح.</p>
                    <div className="success-numbers">
                      <div>
                        <span>رقم الطلب</span>
                        <strong>{healthRequest.requestNumber}</strong>
                      </div>
                      <div>
                        <span>رقم التتبع</span>
                        <strong>{healthRequest.trackingNumber}</strong>
                      </div>
                    </div>
                    <div className="success-status">
                      <span>الحالة</span>
                      <strong>{healthRequest.status}</strong>
                    </div>
                  </motion.section>
                ) : null}
              </fieldset>
            </form>
          </>
        ) : null}

        {showFireTheftPage ? (
          <>
            <motion.section className="engineering-hero fire-theft-hero" {...sectionAnimation}>
              <div>
                <span className="eyebrow">
                  <Flame size={18} aria-hidden="true" />
                  تأمين الحريق والسرقة
                </span>
                <h1>طلب تأمين حريق وسرقة</h1>
                <p>أدخل بيانات العميل والعقار ومبالغ التأمين وأنظمة الحماية ليتم تسجيل الطلب ومتابعته داخل النظام.</p>
              </div>
              <div className="engineering-metrics fire-theft-metrics" aria-hidden="true">
                <span>FTH</span>
                <strong>Fire & Theft</strong>
                <small>Property request</small>
              </div>
            </motion.section>

            <form id="fire-theft-request-form" className="request-form" onSubmit={submitFireTheft} noValidate>
              <fieldset className="form-fieldset" disabled={isFireTheftSubmitting}>
                <motion.section className="panel" {...sectionAnimation}>
                  <h2>معلومات العميل</h2>
                  <div className="grid three">
                    <FloatingField id="fire-fullName" label="الاسم الكامل" value={fireTheftForm.fullName} error={fireTheftErrors.fullName} required onChange={setFireTheftValue("fullName")} />
                    <FloatingField id="fire-mobile" label="رقم الموبايل" value={fireTheftForm.mobile} error={fireTheftErrors.mobile} required inputMode="tel" onChange={setFireTheftValue("mobile")} />
                    <FloatingField id="fire-email" label="البريد الإلكتروني" value={fireTheftForm.email} error={fireTheftErrors.email} type="email" onChange={setFireTheftValue("email")} />
                    <FloatingField id="fire-nationalId" label="الرقم الوطني" value={fireTheftForm.nationalId} error={fireTheftErrors.nationalId} required onChange={setFireTheftValue("nationalId")} />
                    <FloatingField id="fire-city" label="المدينة" value={fireTheftForm.city} error={fireTheftErrors.city} required onChange={setFireTheftValue("city")} />
                    <FloatingField id="fire-address" label="عنوان العميل" value={fireTheftForm.address} error={fireTheftErrors.address} onChange={setFireTheftValue("address")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>معلومات العقار</h2>
                  <div className="grid three">
                    <FloatingField id="fire-propertyType" label="نوع العقار" value={fireTheftForm.propertyType} error={fireTheftErrors.propertyType} required onChange={setFireTheftValue("propertyType")} />
                    <FloatingField id="fire-propertyUsage" label="استخدام العقار" value={fireTheftForm.propertyUsage} error={fireTheftErrors.propertyUsage} required onChange={setFireTheftValue("propertyUsage")} />
                    <FloatingField id="fire-propertyAddress" label="عنوان العقار" value={fireTheftForm.propertyAddress} error={fireTheftErrors.propertyAddress} required onChange={setFireTheftValue("propertyAddress")} />
                    <FloatingField id="fire-coverageScope" label="نطاق التغطية" value={fireTheftForm.coverageScope} error={fireTheftErrors.coverageScope} required onChange={setFireTheftValue("coverageScope")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>مبالغ التأمين وأنظمة السلامة</h2>
                  <div className="grid three">
                    <FloatingField id="fire-buildingValue" label="قيمة المبنى" value={fireTheftForm.buildingValue} error={fireTheftErrors.buildingValue} required inputMode="decimal" onChange={setFireTheftValue("buildingValue")} />
                    <FloatingField id="fire-contentsValue" label="قيمة المحتويات" value={fireTheftForm.contentsValue} error={fireTheftErrors.contentsValue} inputMode="decimal" onChange={setFireTheftValue("contentsValue")} />
                    <FloatingField id="fire-stockValue" label="قيمة المخزون" value={fireTheftForm.stockValue} error={fireTheftErrors.stockValue} inputMode="decimal" onChange={setFireTheftValue("stockValue")} />
                    <FloatingField id="fire-totalSumInsured" label="إجمالي مبلغ التأمين" value={fireTheftForm.totalSumInsured} error={fireTheftErrors.totalSumInsured} required inputMode="decimal" onChange={setFireTheftValue("totalSumInsured")} />
                    <FloatingField id="fire-currency" label="العملة" value={fireTheftForm.currency} error={fireTheftErrors.currency} required onChange={setFireTheftValue("currency")} />
                  </div>
                  <div className="grid three">
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={fireTheftForm.hasFireAlarm} onChange={setFireTheftValue("hasFireAlarm")} />
                      <span>يوجد نظام إنذار حريق</span>
                    </label>
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={fireTheftForm.hasFireExtinguishers} onChange={setFireTheftValue("hasFireExtinguishers")} />
                      <span>تتوفر مطافئ حريق</span>
                    </label>
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={fireTheftForm.hasSecuritySystem} onChange={setFireTheftValue("hasSecuritySystem")} />
                      <span>يوجد نظام حماية أو مراقبة</span>
                    </label>
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>ملاحظات</h2>
                  <FloatingField id="fire-notes" label="ملاحظات إضافية" value={fireTheftForm.notes} error={fireTheftErrors.notes} multiline rows={6} onChange={setFireTheftValue("notes")} />
                </motion.section>

                <motion.section className="panel review-panel" {...sectionAnimation}>
                  <h2>مراجعة الطلب</h2>
                  <div className="review-grid">
                    <span>العميل</span>
                    <strong>{fireTheftForm.fullName || "-"}</strong>
                    <span>العقار</span>
                    <strong>{fireTheftForm.propertyType || "-"}</strong>
                    <span>عنوان العقار</span>
                    <strong>{fireTheftForm.propertyAddress || "-"}</strong>
                    <span>إجمالي مبلغ التأمين</span>
                    <strong>{fireTheftForm.totalSumInsured ? `${fireTheftForm.totalSumInsured} ${fireTheftForm.currency}` : "-"}</strong>
                  </div>
                  <label className={`confirm ${fireTheftErrors.confirmed ? "field-error" : ""}`}>
                    <input type="checkbox" checked={fireTheftForm.confirmed} onChange={setFireTheftValue("confirmed")} />
                    <span>أؤكد صحة المعلومات وأوافق على إرسال طلب تأمين الحريق والسرقة إلى TRINSU.</span>
                  </label>
                  {fireTheftErrors.confirmed ? <p className="error-text">{fireTheftErrors.confirmed}</p> : null}
                  {fireTheftSubmitError ? <p id="fire-theft-submit-error" className="submit-error" role="alert">{fireTheftSubmitError}</p> : null}
                  <button className="submit-button" type="submit" disabled={isFireTheftSubmitting}>
                    {isFireTheftSubmitting ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
                    {isFireTheftSubmitting ? "جاري الإرسال" : "إرسال طلب تأمين الحريق والسرقة"}
                  </button>
                </motion.section>

                {fireTheftRequest ? (
                  <motion.section className="success-panel" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <CheckCircle2 size={42} aria-hidden="true" />
                    <h2>تم إرسال طلب تأمين الحريق والسرقة</h2>
                    <p>تم تسجيل الطلب في نظام TRINSU بنجاح.</p>
                    <div className="success-numbers">
                      <div>
                        <span>رقم الطلب</span>
                        <strong>{fireTheftRequest.requestNumber}</strong>
                      </div>
                      <div>
                        <span>رقم التتبع</span>
                        <strong>{fireTheftRequest.trackingNumber}</strong>
                      </div>
                    </div>
                    <div className="success-status">
                      <span>الحالة</span>
                      <strong>{fireTheftRequest.status}</strong>
                    </div>
                  </motion.section>
                ) : null}
              </fieldset>
            </form>
          </>
        ) : null}

        {showGeneralAccidentPage ? (
          <>
            <motion.section className="engineering-hero general-accident-hero" {...sectionAnimation}>
              <div>
                <span className="eyebrow">
                  <ShieldAlert size={18} aria-hidden="true" />
                  تأمين الحوادث العامة
                </span>
                <h1>طلب تأمين حوادث عامة</h1>
                <p>أدخل بيانات العميل والنشاط وموقع الخطر وحدود التغطية ليتم تسجيل الطلب ومتابعته داخل النظام.</p>
              </div>
              <div className="engineering-metrics general-accident-metrics" aria-hidden="true">
                <span>GAC</span>
                <strong>General Accident</strong>
                <small>Liability request</small>
              </div>
            </motion.section>

            <form id="general-accident-request-form" className="request-form" onSubmit={submitGeneralAccident} noValidate>
              <fieldset className="form-fieldset" disabled={isGeneralAccidentSubmitting}>
                <motion.section className="panel" {...sectionAnimation}>
                  <h2>معلومات العميل</h2>
                  <div className="grid three">
                    <FloatingField id="gac-fullName" label="الاسم الكامل" value={generalAccidentForm.fullName} error={generalAccidentErrors.fullName} required onChange={setGeneralAccidentValue("fullName")} />
                    <FloatingField id="gac-mobile" label="رقم الموبايل" value={generalAccidentForm.mobile} error={generalAccidentErrors.mobile} required inputMode="tel" onChange={setGeneralAccidentValue("mobile")} />
                    <FloatingField id="gac-email" label="البريد الإلكتروني" value={generalAccidentForm.email} error={generalAccidentErrors.email} type="email" onChange={setGeneralAccidentValue("email")} />
                    <FloatingField id="gac-nationalId" label="الرقم الوطني" value={generalAccidentForm.nationalId} error={generalAccidentErrors.nationalId} required onChange={setGeneralAccidentValue("nationalId")} />
                    <FloatingField id="gac-city" label="المدينة" value={generalAccidentForm.city} error={generalAccidentErrors.city} required onChange={setGeneralAccidentValue("city")} />
                    <FloatingField id="gac-address" label="عنوان العميل" value={generalAccidentForm.address} error={generalAccidentErrors.address} onChange={setGeneralAccidentValue("address")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>تفاصيل النشاط والخطر</h2>
                  <div className="grid three">
                    <FloatingField id="gac-insuredName" label="اسم المؤمن له" value={generalAccidentForm.insuredName} error={generalAccidentErrors.insuredName} required onChange={setGeneralAccidentValue("insuredName")} />
                    <FloatingField id="gac-businessActivity" label="نشاط العمل" value={generalAccidentForm.businessActivity} error={generalAccidentErrors.businessActivity} required onChange={setGeneralAccidentValue("businessActivity")} />
                    <FloatingField id="gac-accidentType" label="نوع الحادث" value={generalAccidentForm.accidentType} error={generalAccidentErrors.accidentType} required onChange={setGeneralAccidentValue("accidentType")} />
                    <FloatingField id="gac-coverageScope" label="نطاق التغطية" value={generalAccidentForm.coverageScope} error={generalAccidentErrors.coverageScope} required onChange={setGeneralAccidentValue("coverageScope")} />
                    <FloatingField id="gac-riskLocation" label="موقع الخطر" value={generalAccidentForm.riskLocation} error={generalAccidentErrors.riskLocation} required onChange={setGeneralAccidentValue("riskLocation")} />
                    <FloatingField id="gac-riskCity" label="مدينة الخطر" value={generalAccidentForm.riskCity} error={generalAccidentErrors.riskCity} required onChange={setGeneralAccidentValue("riskCity")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>حدود التغطية والأعداد</h2>
                  <div className="grid three">
                    <FloatingField id="gac-employeesCount" label="عدد الموظفين" value={generalAccidentForm.employeesCount} error={generalAccidentErrors.employeesCount} required inputMode="numeric" onChange={setGeneralAccidentValue("employeesCount")} />
                    <FloatingField id="gac-beneficiariesCount" label="عدد المستفيدين" value={generalAccidentForm.beneficiariesCount} error={generalAccidentErrors.beneficiariesCount} inputMode="numeric" onChange={setGeneralAccidentValue("beneficiariesCount")} />
                    <FloatingField id="gac-coverageLimit" label="حد التغطية" value={generalAccidentForm.coverageLimit} error={generalAccidentErrors.coverageLimit} required inputMode="decimal" onChange={setGeneralAccidentValue("coverageLimit")} />
                    <FloatingField id="gac-deductibleAmount" label="مبلغ التحمل" value={generalAccidentForm.deductibleAmount} error={generalAccidentErrors.deductibleAmount} inputMode="decimal" onChange={setGeneralAccidentValue("deductibleAmount")} />
                    <FloatingField id="gac-estimatedAnnualWages" label="الأجور السنوية المقدرة" value={generalAccidentForm.estimatedAnnualWages} error={generalAccidentErrors.estimatedAnnualWages} inputMode="decimal" onChange={setGeneralAccidentValue("estimatedAnnualWages")} />
                    <FloatingField id="gac-currency" label="العملة" value={generalAccidentForm.currency} error={generalAccidentErrors.currency} required onChange={setGeneralAccidentValue("currency")} />
                  </div>
                  <div className="grid two">
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={generalAccidentForm.hasSafetyProgram} onChange={setGeneralAccidentValue("hasSafetyProgram")} />
                      <span>يوجد برنامج سلامة</span>
                    </label>
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={generalAccidentForm.previousClaims} onChange={setGeneralAccidentValue("previousClaims")} />
                      <span>توجد مطالبات سابقة</span>
                    </label>
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>تفاصيل إضافية</h2>
                  <div className="grid two">
                    <FloatingField id="gac-riskDetails" label="تفاصيل الخطر" value={generalAccidentForm.riskDetails} error={generalAccidentErrors.riskDetails} multiline rows={6} onChange={setGeneralAccidentValue("riskDetails")} />
                    <FloatingField id="gac-notes" label="ملاحظات" value={generalAccidentForm.notes} error={generalAccidentErrors.notes} multiline rows={6} onChange={setGeneralAccidentValue("notes")} />
                  </div>
                </motion.section>

                <motion.section className="panel review-panel" {...sectionAnimation}>
                  <h2>مراجعة الطلب</h2>
                  <div className="review-grid">
                    <span>العميل</span>
                    <strong>{generalAccidentForm.fullName || "-"}</strong>
                    <span>المؤمن له</span>
                    <strong>{generalAccidentForm.insuredName || "-"}</strong>
                    <span>نوع الحادث</span>
                    <strong>{generalAccidentForm.accidentType || "-"}</strong>
                    <span>حد التغطية</span>
                    <strong>{generalAccidentForm.coverageLimit ? `${generalAccidentForm.coverageLimit} ${generalAccidentForm.currency}` : "-"}</strong>
                  </div>
                  <label className={`confirm ${generalAccidentErrors.confirmed ? "field-error" : ""}`}>
                    <input type="checkbox" checked={generalAccidentForm.confirmed} onChange={setGeneralAccidentValue("confirmed")} />
                    <span>أؤكد صحة المعلومات وأوافق على إرسال طلب تأمين الحوادث العامة إلى TRINSU.</span>
                  </label>
                  {generalAccidentErrors.confirmed ? <p className="error-text">{generalAccidentErrors.confirmed}</p> : null}
                  {generalAccidentSubmitError ? <p id="general-accident-submit-error" className="submit-error" role="alert">{generalAccidentSubmitError}</p> : null}
                  <button className="submit-button" type="submit" disabled={isGeneralAccidentSubmitting}>
                    {isGeneralAccidentSubmitting ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
                    {isGeneralAccidentSubmitting ? "جاري الإرسال" : "إرسال طلب تأمين الحوادث العامة"}
                  </button>
                </motion.section>

                {generalAccidentRequest ? (
                  <motion.section className="success-panel" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <CheckCircle2 size={42} aria-hidden="true" />
                    <h2>تم إرسال طلب تأمين الحوادث العامة</h2>
                    <p>تم تسجيل الطلب في نظام TRINSU بنجاح.</p>
                    <div className="success-numbers">
                      <div>
                        <span>رقم الطلب</span>
                        <strong>{generalAccidentRequest.requestNumber}</strong>
                      </div>
                      <div>
                        <span>رقم التتبع</span>
                        <strong>{generalAccidentRequest.trackingNumber}</strong>
                      </div>
                    </div>
                    <div className="success-status">
                      <span>الحالة</span>
                      <strong>{generalAccidentRequest.status}</strong>
                    </div>
                  </motion.section>
                ) : null}
              </fieldset>
            </form>
          </>
        ) : null}

        {showTravelPage ? (
          <>
            <motion.section className="engineering-hero travel-hero" {...sectionAnimation}>
              <div>
                <span className="eyebrow">
                  <Plane size={18} aria-hidden="true" />
                  تأمين السفر
                </span>
                <h1>طلب تأمين سفر</h1>
                <p>أدخل بيانات المسافر والوجهة وتواريخ الرحلة ونطاق التغطية ليتم تسجيل الطلب ومتابعته داخل النظام.</p>
              </div>
              <div className="engineering-metrics travel-metrics" aria-hidden="true">
                <span>TRV</span>
                <strong>Travel Insurance</strong>
                <small>Trip coverage request</small>
              </div>
            </motion.section>

            <form id="travel-request-form" className="request-form" onSubmit={submitTravel} noValidate>
              <fieldset className="form-fieldset" disabled={isTravelSubmitting}>
                <motion.section className="panel" {...sectionAnimation}>
                  <h2>معلومات المسافر</h2>
                  <div className="grid three">
                    <FloatingField id="travel-fullName" label="الاسم الكامل" value={travelForm.fullName} error={travelErrors.fullName} required onChange={setTravelValue("fullName")} />
                    <FloatingField id="travel-mobile" label="رقم الموبايل" value={travelForm.mobile} error={travelErrors.mobile} required inputMode="tel" onChange={setTravelValue("mobile")} />
                    <FloatingField id="travel-email" label="البريد الإلكتروني" value={travelForm.email} error={travelErrors.email} type="email" onChange={setTravelValue("email")} />
                    <FloatingField id="travel-nationalId" label="الرقم الوطني" value={travelForm.nationalId} error={travelErrors.nationalId} required onChange={setTravelValue("nationalId")} />
                    <FloatingField id="travel-passportNumber" label="رقم الجواز" value={travelForm.passportNumber} error={travelErrors.passportNumber} required onChange={setTravelValue("passportNumber")} />
                    <FloatingField id="travel-dateOfBirth" label="تاريخ الميلاد" value={travelForm.dateOfBirth} error={travelErrors.dateOfBirth} required type="date" onChange={setTravelValue("dateOfBirth")} />
                    <FloatingField id="travel-city" label="المدينة" value={travelForm.city} error={travelErrors.city} required onChange={setTravelValue("city")} />
                    <FloatingField id="travel-address" label="العنوان" value={travelForm.address} error={travelErrors.address} onChange={setTravelValue("address")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>تفاصيل الرحلة</h2>
                  <div className="grid three">
                    <FloatingField id="travel-destinationCountry" label="بلد الوجهة" value={travelForm.destinationCountry} error={travelErrors.destinationCountry} required onChange={setTravelValue("destinationCountry")} />
                    <FloatingField id="travel-departureDate" label="تاريخ المغادرة" value={travelForm.departureDate} error={travelErrors.departureDate} required type="date" onChange={setTravelValue("departureDate")} />
                    <FloatingField id="travel-returnDate" label="تاريخ العودة" value={travelForm.returnDate} error={travelErrors.returnDate} required type="date" onChange={setTravelValue("returnDate")} />
                    <FloatingField id="travel-travelersCount" label="عدد المسافرين" value={travelForm.travelersCount} error={travelErrors.travelersCount} required inputMode="numeric" onChange={setTravelValue("travelersCount")} />
                    <FloatingField id="travel-tripPurpose" label="غرض السفر" value={travelForm.tripPurpose} error={travelErrors.tripPurpose} required onChange={setTravelValue("tripPurpose")} />
                    <FloatingField id="travel-coverageType" label="نوع التغطية" value={travelForm.coverageType} error={travelErrors.coverageType} required onChange={setTravelValue("coverageType")} />
                    <FloatingField id="travel-coverageScope" label="نطاق التغطية" value={travelForm.coverageScope} error={travelErrors.coverageScope} required onChange={setTravelValue("coverageScope")} />
                    <FloatingField id="travel-estimatedPremium" label="القسط المتوقع" value={travelForm.estimatedPremium} error={travelErrors.estimatedPremium} inputMode="decimal" onChange={setTravelValue("estimatedPremium")} />
                    <FloatingField id="travel-currency" label="العملة" value={travelForm.currency} error={travelErrors.currency} required onChange={setTravelValue("currency")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>الصحة والطوارئ</h2>
                  <div className="grid two">
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={travelForm.hasMedicalConditions} onChange={setTravelValue("hasMedicalConditions")} />
                      <span>توجد حالات طبية أو أمراض مزمنة</span>
                    </label>
                    <FloatingField id="travel-emergencyContactName" label="اسم جهة الطوارئ" value={travelForm.emergencyContactName} error={travelErrors.emergencyContactName} onChange={setTravelValue("emergencyContactName")} />
                    <FloatingField id="travel-emergencyContactPhone" label="هاتف جهة الطوارئ" value={travelForm.emergencyContactPhone} error={travelErrors.emergencyContactPhone} inputMode="tel" onChange={setTravelValue("emergencyContactPhone")} />
                    <FloatingField id="travel-medicalConditions" label="تفاصيل الحالات الطبية" value={travelForm.medicalConditions} error={travelErrors.medicalConditions} multiline rows={5} onChange={setTravelValue("medicalConditions")} />
                    <FloatingField id="travel-notes" label="ملاحظات" value={travelForm.notes} error={travelErrors.notes} multiline rows={5} onChange={setTravelValue("notes")} />
                  </div>
                </motion.section>

                <motion.section className="panel review-panel" {...sectionAnimation}>
                  <h2>مراجعة الطلب</h2>
                  <div className="review-grid">
                    <span>المسافر</span>
                    <strong>{travelForm.fullName || "-"}</strong>
                    <span>الوجهة</span>
                    <strong>{travelForm.destinationCountry || "-"}</strong>
                    <span>مدة الرحلة</span>
                    <strong>{[travelForm.departureDate, travelForm.returnDate].filter(Boolean).join(" - ") || "-"}</strong>
                    <span>نوع التغطية</span>
                    <strong>{travelForm.coverageType || "-"}</strong>
                  </div>
                  <label className={`confirm ${travelErrors.confirmed ? "field-error" : ""}`}>
                    <input type="checkbox" checked={travelForm.confirmed} onChange={setTravelValue("confirmed")} />
                    <span>أؤكد صحة المعلومات وأوافق على إرسال طلب تأمين السفر إلى TRINSU.</span>
                  </label>
                  {travelErrors.confirmed ? <p className="error-text">{travelErrors.confirmed}</p> : null}
                  {travelSubmitError ? <p id="travel-submit-error" className="submit-error" role="alert">{travelSubmitError}</p> : null}
                  <button className="submit-button" type="submit" disabled={isTravelSubmitting}>
                    {isTravelSubmitting ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
                    {isTravelSubmitting ? "جاري الإرسال" : "إرسال طلب تأمين السفر"}
                  </button>
                </motion.section>

                {travelRequest ? (
                  <motion.section className="success-panel" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <CheckCircle2 size={42} aria-hidden="true" />
                    <h2>تم إرسال طلب تأمين السفر</h2>
                    <p>تم تسجيل الطلب في نظام TRINSU بنجاح.</p>
                    <div className="success-numbers">
                      <div>
                        <span>رقم الطلب</span>
                        <strong>{travelRequest.requestNumber}</strong>
                      </div>
                      <div>
                        <span>رقم التتبع</span>
                        <strong>{travelRequest.trackingNumber}</strong>
                      </div>
                    </div>
                    <div className="success-status">
                      <span>الحالة</span>
                      <strong>{travelRequest.status}</strong>
                    </div>
                    <div className="success-actions">
                      <button className="submit-button" type="button" onClick={() => openTrackingRequest(travelRequest.trackingNumber)}>
                        <MapPinned size={18} aria-hidden="true" />
                        تتبع الطلب
                      </button>
                    </div>
                  </motion.section>
                ) : null}
              </fieldset>
            </form>
          </>
        ) : null}

        {showSupportPage ? (
        <motion.section id="support" className="support-page" {...sectionAnimation}>
          <div className="support-hero">
            <span className="eyebrow">
              <Building2 size={18} aria-hidden="true" />
              {t.supportEyebrow}
            </span>
            <h2>{t.supportTitle}</h2>
            <p>{t.supportSubtitle}</p>
            <strong>{t.supportTagline}</strong>
          </div>

          <div className="support-grid">
            <article className="support-card contact-card">
              <span className="support-icon">
                <Phone size={22} aria-hidden="true" />
              </span>
              <h3>{t.contactNumbers}</h3>
              <div className="contact-list">
                {supportPhones.map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`}>
                    {phone}
                  </a>
                ))}
              </div>
            </article>

            <article className="support-card">
              <span className="support-icon">
                <MessageCircle size={22} aria-hidden="true" />
              </span>
              <h3>{t.whatsappFollowup}</h3>
              <div className="whatsapp-list">
                {supportWhatsApp.map((item) => (
                  <a key={item.href} className="whatsapp-link" href={item.href} target="_blank" rel="noreferrer">
                    <MessageCircle size={18} aria-hidden="true" />
                    {item.number}
                  </a>
                ))}
              </div>
            </article>

            <article className="support-card">
              <span className="support-icon">
                <Globe2 size={22} aria-hidden="true" />
              </span>
              <h3>{t.website}</h3>
              <a className="support-action" href="https://iraq-takaful.com/" target="_blank" rel="noreferrer">
                iraq-takaful.com
                <ExternalLink size={18} aria-hidden="true" />
              </a>
            </article>

            <article className="support-card">
              <span className="support-icon">
                <Mail size={22} aria-hidden="true" />
              </span>
              <h3>{t.supportEmail}</h3>
              <a className="support-action" href="mailto:info@iraq-takaful.com">
                info@iraq-takaful.com
                <Mail size={18} aria-hidden="true" />
              </a>
            </article>

            <article className="support-card address-card">
              <span className="support-icon">
                <MapPin size={22} aria-hidden="true" />
              </span>
              <h3>{t.addressTitle}</h3>
              <p>{t.supportAddress}</p>
            </article>
          </div>
        </motion.section>
        ) : null}

        {showMotorPage ? (
          <>
        <motion.section className="motor-page-head" {...sectionAnimation}>
          <span className="eyebrow">
            <CarFront size={18} aria-hidden="true" />
            طلب تأمين المركبات
          </span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </motion.section>

        <ProgressSteps steps={steps} completed={completed} labels={{ completed: t.completed, pending: t.pending }} />

        <form id="request-form" className="request-form" onSubmit={submit} noValidate aria-busy={isFormLocked}>
          <fieldset className="form-fieldset" disabled={isFormLocked}>
            <motion.section className="panel" {...sectionAnimation}>
            <h2>{t.customer}</h2>
            <div className="grid two">
              <FloatingField id="fullName" label={t.fullName} value={form.fullName} error={errors.fullName} required onChange={setValue("fullName")} />
              <FloatingField id="phone" label={t.phone} value={form.phone} error={errors.phone} required inputMode="tel" onChange={setValue("phone")} />
              <FloatingField id="email" label={t.email} value={form.email} error={errors.email} type="email" onChange={setValue("email")} />
              <FloatingField id="nationalId" label={t.nationalId} value={form.nationalId} error={errors.nationalId} required onChange={setValue("nationalId")} />
              <FloatingField id="address" label={t.address} value={form.address} error={errors.address} required onChange={setValue("address")} />
              <FloatingField id="city" label={t.city} value={form.city} error={errors.city} required onChange={setValue("city")} />
            </div>
          </motion.section>

          <motion.section className="panel" {...sectionAnimation}>
            <h2>{t.vehicle}</h2>
            <div className="grid three">
              <FloatingField id="vehicleType" label={t.vehicleType} value={form.vehicleType} error={errors.vehicleType} required onChange={setValue("vehicleType")} />
              <FloatingField id="manufacturer" label={t.manufacturer} value={form.manufacturer} error={errors.manufacturer} required onChange={setValue("manufacturer")} />
              <FloatingField id="model" label={t.model} value={form.model} error={errors.model} required onChange={setValue("model")} />
              <FloatingField id="year" label={t.year} value={form.year} error={errors.year} required inputMode="numeric" onChange={setValue("year")} />
              <FloatingField id="color" label={t.color} value={form.color} error={errors.color} required onChange={setValue("color")} />
              <FloatingField id="plateNumber" label={t.plateNumber} value={form.plateNumber} error={errors.plateNumber} required onChange={setValue("plateNumber")} />
              <FloatingField id="chassisNumber" label={t.chassisNumber} value={form.chassisNumber} error={errors.chassisNumber} required onChange={setValue("chassisNumber")} />
              <FloatingField id="engineNumber" label={t.engineNumber} value={form.engineNumber} error={errors.engineNumber} required onChange={setValue("engineNumber")} />
              <FloatingField id="estimatedValue" label={t.estimatedValue} value={form.estimatedValue} error={errors.estimatedValue} required inputMode="decimal" onChange={setValue("estimatedValue")} />
            </div>
          </motion.section>

          <motion.section className="panel" {...sectionAnimation}>
            <h2>{t.images}</h2>
            <UploadZone
              title={t.uploadImages}
              hint={t.uploadHint}
              rule={t.imageRule}
              files={vehicleImages}
              onChange={(files) => {
                setVehicleImages(files);
                setErrors((current) => ({ ...current, vehicleImages: undefined }));
              }}
              error={errors.vehicleImages}
              labels={uploadLabels}
            />
          </motion.section>

          <motion.section className="panel" {...sectionAnimation}>
            <h2>{t.documents}</h2>
            {errors.documents ? <p className="error-text section-error">{errors.documents}</p> : null}
            <div className="grid two">
              {documentKeys.map((key) => (
                <DocumentUpload key={key} documentKey={key} label={t[key]} file={documents[key]} onChange={updateDocument} hint={t.uploadHint} labels={uploadLabels} />
              ))}
            </div>
          </motion.section>

          <motion.section className="panel" {...sectionAnimation}>
            <h2>{t.notes}</h2>
            <FloatingField id="notes" label={t.notes} value={form.notes} multiline rows={7} placeholder={t.notesPlaceholder} onChange={setValue("notes")} />
          </motion.section>

          <motion.section className="panel review-panel" {...sectionAnimation}>
            <h2>{t.finalReview}</h2>
            <p>{t.reviewHint}</p>
            <div className="review-grid">
              <span>{t.customer}</span>
              <strong>{form.fullName || "-"}</strong>
              <span>{t.vehicle}</span>
              <strong>{[form.manufacturer, form.model, form.year].filter(Boolean).join(" ") || "-"}</strong>
              <span>{t.images}</span>
              <strong>{vehicleImages.length}</strong>
              <span>{t.documents}</span>
              <strong>{Object.values(documents).filter(Boolean).length} / 6</strong>
            </div>
            <label className={`confirm ${errors.confirmed ? "field-error" : ""}`}>
              <input type="checkbox" checked={form.confirmed} onChange={setValue("confirmed")} />
              <span>{t.confirm}</span>
            </label>
            {errors.confirmed ? <p className="error-text">{errors.confirmed}</p> : null}
            {submitError ? <p className="submit-error" role="alert">{submitError}</p> : null}
            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
              {isSubmitting ? t.submitLoading : t.submit}
            </button>
            <aside className="fallback-card" aria-label="رابط بديل لتقديم طلب تأمين المركبات">
              <span className="fallback-icon">
                <Info size={20} aria-hidden="true" />
              </span>
              <div className="fallback-content">
                <p>في حال تعذر إرسال طلب التأمين عبر هذه الصفحة، يمكنك تقديم الطلب من خلال الرابط التالي:</p>
                <a className="fallback-link" href={fallbackFormUrl} target="_blank" rel="noopener noreferrer">
                  طلبات تأمين المركبات
                </a>
              </div>
            </aside>
          </motion.section>

            {requestNumber && trackingNumber ? (
              <motion.section className="success-panel" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <CheckCircle2 size={42} aria-hidden="true" />
              <h2>{t.apiSuccessTitle}</h2>
              <p>{t.successBody}</p>
              <div className="success-status">
                <span>{t.currentStatus}</span>
                <strong>{t.trackReceived}</strong>
                <p>{trackingStatusDescription[language].RECEIVED}</p>
              </div>
              <div className="success-numbers">
                <div>
                  <span>{t.trackingNumber}</span>
                  <strong>{trackingNumber}</strong>
                </div>
                <div>
                  <span>{t.requestNumber}</span>
                  <strong>{requestNumber}</strong>
                </div>
              </div>
              <div className="success-actions">
                <button className="ghost-button" type="button" onClick={copyRequestNumber}>
                  <Copy size={18} aria-hidden="true" />
                  {copiedRequestNumber ? (language === "ar" ? "تم النسخ" : "Copied") : language === "ar" ? "نسخ رقم الطلب" : "Copy request number"}
                </button>
                <button className="submit-button" type="button" onClick={downloadRequestPdf}>
                  <Download size={18} aria-hidden="true" />
                  {language === "ar" ? "تنزيل الاستمارة PDF" : "Download PDF form"}
                </button>
              </div>
              </motion.section>
            ) : null}
          </fieldset>
        </form>
          </>
        ) : null}
      </main>
    </div>
  );
}

export default App;

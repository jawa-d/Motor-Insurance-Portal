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
  Truck,
  X,
  Zap,
} from "lucide-react";
import { type CSSProperties, type ChangeEvent, useEffect, useMemo, useState } from "react";
import { DocumentUpload } from "./components/DocumentUpload";
import { FloatingField } from "./components/FloatingField";
import { ProgressSteps } from "./components/ProgressSteps";
import { UploadZone } from "./components/UploadZone";
import { translations, type Language } from "./i18n";
import { ApiError } from "./services/api";
import { submitEnergyRequest } from "./services/energy-request";
import { submitEngineeringRequest } from "./services/engineering-request";
import { submitFireTheftRequest } from "./services/fire-theft-request";
import { submitGeneralAccidentRequest } from "./services/general-accident-request";
import { submitHealthRequest } from "./services/health-request";
import { submitTravelRequest } from "./services/travel-request";
import { submitTransportRequest } from "./services/transport-request";
import {
  submitMotorRequest,
  trackMotorRequest,
  type MotorRequestTracking,
  type MotorRequestUploadProgress,
  type PublicMotorRequestStatus,
} from "./services/motor-request";
import type { DocumentKey, EnergyFormState, EngineeringFormState, Errors, FireTheftFormState, FormState, GeneralAccidentFormState, HealthFormState, TransportFormState, TravelFormState, UploadFile } from "./types";
import {
  createEnergySchema,
  createEngineeringSchema,
  createFireTheftSchema,
  createGeneralAccidentSchema,
  createHealthSchema,
  createSchema,
  createTransportSchema,
  createTravelSchema,
  initialEnergyForm,
  initialEngineeringForm,
  initialFireTheftForm,
  initialForm,
  initialGeneralAccidentForm,
  initialHealthForm,
  initialTransportForm,
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

type Page = "home" | "motor" | "engineering" | "health" | "fire-theft" | "general-accident" | "energy" | "travel" | "transport" | "track" | "support";

const getCurrentPage = (): Page => {
  const path = window.location.pathname.replace(/\/+$/, "");

  if (path === "/track") return "track";
  if (path === "/support") return "support";
  if (path === "/motor") return "motor";
  if (path === "/engineering") return "engineering";
  if (path === "/health") return "health";
  if (path === "/fire-theft") return "fire-theft";
  if (path === "/general-accident") return "general-accident";
  if (path === "/energy") return "energy";
  if (path === "/travel") return "travel";
  if (path === "/transport") return "transport";

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
    SUBMITTED: "ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø§Ù„Ø·Ù„Ø¨ Ø¨Ù†Ø¬Ø§Ø­ ÙˆÙ‡Ùˆ Ø§Ù„Ø¢Ù† Ø¶Ù…Ù† Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ù„Ø¯Ù‰ ÙØ±ÙŠÙ‚ Ø§Ù„ØªØ£Ù…ÙŠÙ†.",
    RECEIVED: "ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø§Ù„Ø·Ù„Ø¨ Ø¨Ù†Ø¬Ø§Ø­ ÙˆÙ‡Ùˆ Ø§Ù„Ø¢Ù† Ø¶Ù…Ù† Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ù„Ø¯Ù‰ ÙØ±ÙŠÙ‚ Ø§Ù„ØªØ£Ù…ÙŠÙ†.",
    UNDER_REVIEW: "Ø§Ù„Ø·Ù„Ø¨ Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©ØŒ ÙˆÙŠØªÙ… ØªØ¯Ù‚ÙŠÙ‚ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© Ù‚Ø¨Ù„ Ø§Ù„Ø§Ù†ØªÙ‚Ø§Ù„ Ù„Ù„Ø®Ø·ÙˆØ© Ø§Ù„ØªØ§Ù„ÙŠØ©.",
    DOCUMENTS_CHECK: "Ø§Ù„ÙØ±ÙŠÙ‚ ÙŠØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª Ø§Ù„Ù…Ø±ÙÙˆØ¹Ø© ÙˆÙŠØªØ£ÙƒØ¯ Ù…Ù† ÙˆØ¶ÙˆØ­Ù‡Ø§ ÙˆØ§ÙƒØªÙ…Ø§Ù„Ù‡Ø§.",
    QUOTE_PREPARATION: "ÙŠØªÙ… ØªØ¬Ù‡ÙŠØ² Ø§Ù„Ø¹Ø±Ø¶ Ø§Ù„ØªØ£Ù…ÙŠÙ†ÙŠ Ø§Ù„Ù…Ù†Ø§Ø³Ø¨ Ø­Ø³Ø¨ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø±ÙƒØ¨Ø© ÙˆØ§Ù„Ø·Ù„Ø¨.",
    CONTACTING_CUSTOMER: "Ø³ÙŠØªÙ… Ø§Ù„ØªÙˆØ§ØµÙ„ Ù…Ø¹Ùƒ Ù‚Ø±ÙŠØ¨Ø§Ù‹ Ù„Ø¥ÙƒÙ…Ø§Ù„ Ø§Ù„ØªÙØ§ØµÙŠÙ„ Ø£Ùˆ Ù…Ø´Ø§Ø±ÙƒØ© Ø§Ù„Ø¹Ø±Ø¶.",
    COMPLETED: "Ø§ÙƒØªÙ…Ù„Øª Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø·Ù„Ø¨ØŒ ÙˆÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„ØªÙˆØ§ØµÙ„ Ù…Ø¹ ÙØ±ÙŠÙ‚ Ø§Ù„Ø¯Ø¹Ù… Ù„Ø£ÙŠ Ù…ØªØ§Ø¨Ø¹Ø© Ø¥Ø¶Ø§ÙÙŠØ©.",
    REJECTED: "ØªÙ… Ø±ÙØ¶ Ø§Ù„Ø·Ù„Ø¨. ÙŠØ±Ø¬Ù‰ Ø§Ù„ØªÙˆØ§ØµÙ„ Ù…Ø¹ ÙØ±ÙŠÙ‚ Ø§Ù„Ø¯Ø¹Ù… Ù„Ù…Ø¹Ø±ÙØ© Ø§Ù„Ø³Ø¨Ø¨ ÙˆØ§Ù„Ø®Ø·ÙˆØ§Øª Ø§Ù„Ù…Ù…ÙƒÙ†Ø©.",
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
  const [energyForm, setEnergyForm] = useState<EnergyFormState>(initialEnergyForm);
  const [travelForm, setTravelForm] = useState<TravelFormState>(initialTravelForm);
  const [transportForm, setTransportForm] = useState<TransportFormState>(initialTransportForm);
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
  const [energyErrors, setEnergyErrors] = useState<Errors>({});
  const [energySubmitError, setEnergySubmitError] = useState<string | null>(null);
  const [energyRequest, setEnergyRequest] = useState<{ requestNumber: string; trackingNumber: string; status: string } | null>(null);
  const [isEnergySubmitting, setIsEnergySubmitting] = useState(false);
  const [travelErrors, setTravelErrors] = useState<Errors>({});
  const [travelSubmitError, setTravelSubmitError] = useState<string | null>(null);
  const [travelRequest, setTravelRequest] = useState<{ requestNumber: string; trackingNumber: string; status: string } | null>(null);
  const [isTravelSubmitting, setIsTravelSubmitting] = useState(false);
  const [transportErrors, setTransportErrors] = useState<Errors>({});
  const [transportSubmitError, setTransportSubmitError] = useState<string | null>(null);
  const [transportRequest, setTransportRequest] = useState<{ requestNumber: string; trackingNumber: string; status: string } | null>(null);
  const [isTransportSubmitting, setIsTransportSubmitting] = useState(false);
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
  const showEnergyPage = page === "energy";
  const showTravelPage = page === "travel";
  const showTransportPage = page === "transport";
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
  const energySchema = useMemo(
    () =>
      createEnergySchema({
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
  const transportSchema = useMemo(
    () =>
      createTransportSchema({
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

  const setEnergyValue = (key: keyof EnergyFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value;
    setEnergyForm((current) => ({ ...current, [key]: value }));
    setEnergyErrors((current) => ({ ...current, [key]: undefined }));
  };

  const setTravelValue = (key: keyof TravelFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value;
    setTravelForm((current) => ({ ...current, [key]: value }));
    setTravelErrors((current) => ({ ...current, [key]: undefined }));
  };

  const setTransportValue = (key: keyof TransportFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value;
    setTransportForm((current) => ({ ...current, [key]: value }));
    setTransportErrors((current) => ({ ...current, [key]: undefined }));
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
      [language === "ar" ? "Ø­Ø§Ù„Ø© Ø§Ù„Ø·Ù„Ø¨" : "Request status", t.trackReceived],
      [language === "ar" ? "ÙˆÙ‚Øª Ø§Ù„Ø¥Ø±Ø³Ø§Ù„" : "Submitted at", submittedAt],
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
        <div class="title">${escapeHtml(language === "ar" ? "Ø§Ø³ØªÙ…Ø§Ø±Ø© Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ù…Ø±ÙƒØ¨Ø©" : "Motor Insurance Application")}</div>
      </div>
      <div class="status">${escapeHtml(t.trackReceived)}</div>
    </section>
    <section class="numbers">
      <div class="number"><span>${escapeHtml(t.requestNumber)}</span><strong>${escapeHtml(requestNumber)}</strong></div>
      <div class="number"><span>${escapeHtml(t.trackingNumber)}</span><strong>${escapeHtml(trackingNumber)}</strong></div>
    </section>
    <h2>${escapeHtml(language === "ar" ? "Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¥Ø±Ø³Ø§Ù„ ÙˆØ­Ø§Ù„Ø© Ø§Ù„Ø·Ù„Ø¨" : "Submission and Status")}</h2>
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

  const submitEnergy = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isEnergySubmitting) return;

    const parsed = energySchema.safeParse(energyForm);
    const nextErrors: Errors = {};
    setEnergySubmitError(null);
    setEnergyRequest(null);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        nextErrors[String(issue.path[0])] = issue.message;
      }
    }

    if (!energyForm.confirmed) {
      nextErrors.confirmed = t.fieldRequired;
    }

    setEnergyErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstErrorKey = Object.keys(nextErrors)[0];
      window.setTimeout(() => {
        document.getElementById(`energy-${firstErrorKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      return;
    }

    try {
      setIsEnergySubmitting(true);
      const result = await submitEnergyRequest(energyForm, agentCode);
      setEnergyRequest(result);
      setEnergyForm(initialEnergyForm);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (error) {
      const message = error instanceof Error ? error.message : getSubmitErrorMessage(error);
      setEnergySubmitError(message || getSubmitErrorMessage(error));
      window.setTimeout(() => {
        document.getElementById("energy-submit-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
    } finally {
      setIsEnergySubmitting(false);
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

  const submitTransport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isTransportSubmitting) return;

    const parsed = transportSchema.safeParse(transportForm);
    const nextErrors: Errors = {};
    setTransportSubmitError(null);
    setTransportRequest(null);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        nextErrors[String(issue.path[0])] = issue.message;
      }
    }

    if (!transportForm.confirmed) {
      nextErrors.confirmed = t.fieldRequired;
    }

    setTransportErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstErrorKey = Object.keys(nextErrors)[0];
      window.setTimeout(() => {
        document.getElementById(`transport-${firstErrorKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      return;
    }

    try {
      setIsTransportSubmitting(true);
      const result = await submitTransportRequest(transportForm, agentCode);
      setTransportRequest(result);
      setTransportForm(initialTransportForm);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : getSubmitErrorMessage(error);
      setTransportSubmitError(message || getSubmitErrorMessage(error));
      window.setTimeout(() => {
        document.getElementById("transport-submit-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
    } finally {
      setIsTransportSubmitting(false);
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
  const trackingDialogTitle = language === "ar" ? "ØªÙØ§ØµÙŠÙ„ ØªØªØ¨Ø¹ Ø§Ù„Ø·Ù„Ø¨" : "Application Tracking Details";
  const trackingDialogSubtitle =
    language === "ar"
      ? "Ù…Ù„Ø®Øµ Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ© ÙˆØ¢Ø®Ø± ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„Ù…Ø³Ø¬Ù„Ø© ÙÙŠ Ø§Ù„Ù†Ø¸Ø§Ù…."
      : "A summary of the current status and the latest request details in the system.";
  const closeTrackingLabel = language === "ar" ? "Ø¥ØºÙ„Ø§Ù‚" : "Close";
  const trackingSubjectLabel =
    trackingLookup?.requestType === "engineering"
      ? language === "ar"
        ? "Ø§Ù„Ù…Ø´Ø±ÙˆØ¹"
        : "Project"
      : trackingLookup?.requestType === "health"
        ? language === "ar"
          ? "Ø§Ù„Ø®Ø·Ø© Ø§Ù„ØµØ­ÙŠØ©"
          : "Health plan"
      : trackingLookup?.requestType === "fireTheft"
        ? language === "ar"
          ? "Ø§Ù„Ø¹Ù‚Ø§Ø±"
          : "Property"
      : trackingLookup?.requestType === "generalAccident"
        ? language === "ar"
          ? "Ø§Ù„Ù…Ø¤Ù…Ù† Ù„Ù‡"
          : "Insured"
      : trackingLookup?.requestType === "energy"
        ? language === "ar"
          ? "مشروع الطاقة"
          : "Energy project"
      : trackingLookup?.requestType === "travel"
        ? language === "ar"
          ? "Ø§Ù„ÙˆØ¬Ù‡Ø©"
          : "Destination"
      : trackingLookup?.requestType === "transport"
        ? language === "ar"
          ? "Ø§Ù„Ø´Ø­Ù†Ø©"
          : "Cargo"
      : t.vehicle;
  const trackingSubjectValue = trackingLookup?.subject ?? trackingLookup?.vehicle ?? trackingLookup?.health?.planType ?? trackingLookup?.property?.type ?? trackingLookup?.accident?.insuredName ?? trackingLookup?.travel?.destinationCountry ?? trackingLookup?.transport?.cargoDescription ?? trackingLookup?.energy?.projectName ?? "-";

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
              <strong>{uploadProgress.phase === "submitting" ? "ØªÙ… Ø±ÙØ¹ Ø§Ù„Ù…Ù„ÙØ§Øª Ø¨Ù†Ø¬Ø§Ø­..." : "Uploading your files..."}</strong>
              <span>{uploadProgress.phase === "submitting" ? "Ø¬Ø§Ø±ÙŠ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨..." : `Uploading file ${uploadProgress.currentFile} of ${uploadProgress.totalFiles}...`}</span>
              <p>
                ÙŠØ±Ø¬Ù‰ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±...
                <br />
                ÙŠØªÙ… Ø§Ù„Ø¢Ù† Ø±ÙØ¹ Ø§Ù„Ù…Ù„ÙØ§Øª Ø¨Ø´ÙƒÙ„ Ø¢Ù…Ù†.
              </p>
              <p>Ù„Ø§ ØªØºÙ„Ù‚ Ø§Ù„ØµÙØ­Ø© ÙˆÙ„Ø§ ØªÙ‚Ù… Ø¨ØªØ­Ø¯ÙŠØ«Ù‡Ø§ Ø­ØªÙ‰ ÙŠÙƒØªÙ…Ù„ Ø±ÙØ¹ Ø§Ù„Ø·Ù„Ø¨.</p>
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
        <nav className="header-actions" aria-label="Ø±ÙˆØ§Ø¨Ø· Ø§Ù„ØµÙØ­Ø§Øª">
          <a className={navClass("home")} href="/" onClick={navigate("home")}>
            <Home size={18} aria-hidden="true" />
            Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©
          </a>
          <a className={navClass("motor")} href="/motor" onClick={navigate("motor")}>
            <CarFront size={18} aria-hidden="true" />
            Ø·Ù„Ø¨ Ù…Ø±ÙƒØ¨Ø§Øª
          </a>
          <a className={navClass("engineering")} href="/engineering" onClick={navigate("engineering")}>
            <Building2 size={18} aria-hidden="true" />
            ØªØ£Ù…ÙŠÙ† Ù‡Ù†Ø¯Ø³ÙŠ
          </a>
          <a className={navClass("health")} href="/health" onClick={navigate("health")}>
            <HeartPulse size={18} aria-hidden="true" />
            ØªØ£Ù…ÙŠÙ† ØµØ­ÙŠ
          </a>
          <a className={navClass("fire-theft")} href="/fire-theft" onClick={navigate("fire-theft")}>
            <Flame size={18} aria-hidden="true" />
            Ø­Ø±ÙŠÙ‚ ÙˆØ³Ø±Ù‚Ø©
          </a>
          <a className={navClass("general-accident")} href="/general-accident" onClick={navigate("general-accident")}>
            <ShieldAlert size={18} aria-hidden="true" />
            Ø­ÙˆØ§Ø¯Ø« Ø¹Ø§Ù…Ø©
          </a>
          <a className={navClass("energy")} href="/energy" onClick={navigate("energy")}>
            <Zap size={18} aria-hidden="true" />
            طلب تأمين طاقة
          </a>
          <a className={navClass("travel")} href="/travel" onClick={navigate("travel")}>
            <Plane size={18} aria-hidden="true" />
            Ø³ÙØ±
          </a>
          <a className={navClass("transport")} href="/transport" onClick={navigate("transport")}>
            <Truck size={18} aria-hidden="true" />
            Ù†Ù‚Ù„
          </a>
          <a className={navClass("track")} href="/track" onClick={navigate("track")}>
            <MapPinned size={18} aria-hidden="true" />
            ØªØªØ¨Ø¹
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
            <h1>{t.portal}</h1>
            <p>Ù‚Ø¯Ù‘Ù… Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø§Ù„Ù…Ø±ÙƒØ¨Ø§Øª Ø£Ùˆ Ø§Ù„ØªØ£Ù…ÙŠÙ† Ø§Ù„Ù‡Ù†Ø¯Ø³ÙŠØŒ ØªØ§Ø¨Ø¹ Ø­Ø§Ù„Ø© Ø·Ù„Ø¨ÙƒØŒ ÙˆØªÙˆØ§ØµÙ„ Ù…Ø¹ ÙØ±ÙŠÙ‚ Ø§Ù„Ø¯Ø¹Ù… Ù…Ù† Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯.</p>
            <a className="primary-link" href="/motor" onClick={navigate("motor")}>
              <CarFront size={20} aria-hidden="true" />
              Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ù…Ø±ÙƒØ¨Ø§Øª
            </a>
            <a className="ghost-link" href="/engineering" onClick={navigate("engineering")}>
              <Building2 size={20} aria-hidden="true" />
              Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ù‡Ù†Ø¯Ø³ÙŠ
            </a>
            <a className="ghost-link" href="/health" onClick={navigate("health")}>
              <HeartPulse size={20} aria-hidden="true" />
              Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† ØµØ­ÙŠ
            </a>
            <a className="ghost-link" href="/fire-theft" onClick={navigate("fire-theft")}>
              <Flame size={20} aria-hidden="true" />
              Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø­Ø±ÙŠÙ‚ ÙˆØ³Ø±Ù‚Ø©
            </a>
            <a className="ghost-link" href="/general-accident" onClick={navigate("general-accident")}>
              <ShieldAlert size={20} aria-hidden="true" />
              Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø­ÙˆØ§Ø¯Ø« Ø¹Ø§Ù…Ø©
            </a>
            <a className="ghost-link" href="/energy" onClick={navigate("energy")}>
              <Zap size={20} aria-hidden="true" />
              طلب تأمين طاقة
            </a>
            <a className="ghost-link" href="/travel" onClick={navigate("travel")}>
              <Plane size={20} aria-hidden="true" />
              Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø³ÙØ±
            </a>
            <a className="ghost-link" href="/transport" onClick={navigate("transport")}>
              <Truck size={20} aria-hidden="true" />
              Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ù†Ù‚Ù„
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

        <section className="home-actions" aria-label="Ø®Ø¯Ù…Ø§Øª Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„ØªØ£Ù…ÙŠÙ†">
          <article>
            <span><CarFront size={22} aria-hidden="true" /></span>
            <h2>ØªØ£Ù…ÙŠÙ† Ø§Ù„Ù…Ø±ÙƒØ¨Ø§Øª</h2>
            <p>Ø§Ù…Ù„Ø£ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„ ÙˆØ§Ù„Ù…Ø±ÙƒØ¨Ø© ÙˆØ§Ø±ÙØ¹ Ø§Ù„ØµÙˆØ± ÙˆØ§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø© Ù„Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨ Ø¥Ù„Ù‰ Ø§Ù„Ù†Ø¸Ø§Ù….</p>
            <a href="/motor" onClick={navigate("motor")}>Ø§Ø¨Ø¯Ø£ Ø§Ù„Ø·Ù„Ø¨</a>
          </article>
          <article>
            <span><Building2 size={22} aria-hidden="true" /></span>
            <h2>Ø§Ù„ØªØ£Ù…ÙŠÙ† Ø§Ù„Ù‡Ù†Ø¯Ø³ÙŠ</h2>
            <p>Ù‚Ø¯Ù‘Ù… ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ ÙˆÙ‚ÙŠÙ…Ø© Ø§Ù„Ø¹Ù‚Ø¯ ÙˆÙ†ÙˆØ¹ Ø§Ù„ØªØºØ·ÙŠØ© Ù„ÙŠØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø·Ù„Ø¨ Ù‡Ù†Ø¯Ø³ÙŠ Ø¬Ø¯ÙŠØ¯.</p>
            <a href="/engineering" onClick={navigate("engineering")}>ÙØªØ­ Ø§Ù„ÙÙˆØ±Ù…Ø©</a>
          </article>
          <article>
            <span><HeartPulse size={22} aria-hidden="true" /></span>
            <h2>Ø§Ù„ØªØ£Ù…ÙŠÙ† Ø§Ù„ØµØ­ÙŠ</h2>
            <p>Ù‚Ø¯Ù‘Ù… Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„ ÙˆØ®Ø·Ø© Ø§Ù„ØªØºØ·ÙŠØ© ÙˆØ¹Ø¯Ø¯ Ø§Ù„Ù…Ø¤Ù…Ù†ÙŠÙ† ÙˆØ§Ù„Ø­Ø§Ù„Ø© Ø§Ù„ØµØ­ÙŠØ© Ù„Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ ØµØ­ÙŠ Ø¬Ø¯ÙŠØ¯ Ø¥Ù„Ù‰ Ø§Ù„Ù†Ø¸Ø§Ù….</p>
            <a href="/health" onClick={navigate("health")}>ÙØªØ­ Ø§Ù„ÙÙˆØ±Ù…Ø©</a>
          </article>
          <article>
            <span><Flame size={22} aria-hidden="true" /></span>
            <h2>ØªØ£Ù…ÙŠÙ† Ø§Ù„Ø­Ø±ÙŠÙ‚ ÙˆØ§Ù„Ø³Ø±Ù‚Ø©</h2>
            <p>Ø³Ø¬Ù‘Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¹Ù‚Ø§Ø± ÙˆÙ‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø¨Ù†Ù‰ ÙˆØ§Ù„Ù…Ø­ØªÙˆÙŠØ§Øª ÙˆØ£Ù†Ø¸Ù…Ø© Ø§Ù„Ø³Ù„Ø§Ù…Ø© Ù„Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø¬Ø¯ÙŠØ¯.</p>
            <a href="/fire-theft" onClick={navigate("fire-theft")}>ÙØªØ­ Ø§Ù„ÙÙˆØ±Ù…Ø©</a>
          </article>
          <article>
            <span><ShieldAlert size={22} aria-hidden="true" /></span>
            <h2>ØªØ£Ù…ÙŠÙ† Ø§Ù„Ø­ÙˆØ§Ø¯Ø« Ø§Ù„Ø¹Ø§Ù…Ø©</h2>
            <p>Ø³Ø¬Ù‘Ù„ Ù†Ø´Ø§Ø· Ø§Ù„Ø¹Ù…Ù„ ÙˆÙ…ÙˆÙ‚Ø¹ Ø§Ù„Ø®Ø·Ø± ÙˆØ­Ø¯ÙˆØ¯ Ø§Ù„ØªØºØ·ÙŠØ© Ù„Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø­ÙˆØ§Ø¯Ø« Ø¹Ø§Ù…Ø© ÙˆÙ…Ø³Ø¤ÙˆÙ„ÙŠØ© Ø·Ø±Ù Ø«Ø§Ù„Ø«.</p>
            <a href="/general-accident" onClick={navigate("general-accident")}>ÙØªØ­ Ø§Ù„ÙÙˆØ±Ù…Ø©</a>
          </article>
          <article>
            <span><Zap size={22} aria-hidden="true" /></span>
            <h2>تأمين الطاقة</h2>
            <p>سجّل بيانات مشروع الطاقة ونوع المنشأة وقيم الأصول وحدود التغطية لإرسال طلب تأمين طاقة جديد.</p>
            <a href="/energy" onClick={navigate("energy")}>فتح الفورمة</a>
          </article>
          <article>
            <span><Plane size={22} aria-hidden="true" /></span>
            <h2>ØªØ£Ù…ÙŠÙ† Ø§Ù„Ø³ÙØ±</h2>
            <p>Ø³Ø¬Ù‘Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³Ø§ÙØ± ÙˆØ§Ù„ÙˆØ¬Ù‡Ø© ÙˆØªÙˆØ§Ø±ÙŠØ® Ø§Ù„Ø±Ø­Ù„Ø© ÙˆÙ†ÙˆØ¹ Ø§Ù„ØªØºØ·ÙŠØ© Ù„Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø³ÙØ±.</p>
            <a href="/travel" onClick={navigate("travel")}>ÙØªØ­ Ø§Ù„ÙÙˆØ±Ù…Ø©</a>
          </article>
          <article>
            <span><Truck size={22} aria-hidden="true" /></span>
            <h2>ØªØ£Ù…ÙŠÙ† Ø§Ù„Ù†Ù‚Ù„</h2>
            <p>Ø³Ø¬Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø´Ø­Ù†Ø© ÙˆÙ…Ø³Ø§Ø± Ø§Ù„Ù†Ù‚Ù„ ÙˆÙ‚ÙŠÙ…Ø© Ø§Ù„Ø¨Ø¶Ø§Ø¹Ø© ÙˆÙ†Ø·Ø§Ù‚ Ø§Ù„ØªØºØ·ÙŠØ© Ù„Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ù†Ù‚Ù„ Ø¬Ø¯ÙŠØ¯.</p>
            <a href="/transport" onClick={navigate("transport")}>ÙØªØ­ Ø§Ù„ÙÙˆØ±Ù…Ø©</a>
          </article>
          <article>
            <span><MapPinned size={22} aria-hidden="true" /></span>
            <h2>ØªØªØ¨Ø¹ Ø§Ù„Ø·Ù„Ø¨</h2>
            <p>Ø§Ø³ØªØ®Ø¯Ù… Ø±Ù‚Ù… Ø§Ù„ØªØªØ¨Ø¹ Ù„Ù…Ø¹Ø±ÙØ© Ù…Ø±Ø­Ù„Ø© Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø·Ù„Ø¨ ÙˆØ¢Ø®Ø± ØªØ­Ø¯ÙŠØ« Ù…Ø³Ø¬Ù„.</p>
            <a href="/track" onClick={navigate("track")}>ØªØªØ¨Ø¹ Ø§Ù„Ø¢Ù†</a>
          </article>
          <article>
            <span><Phone size={22} aria-hidden="true" /></span>
            <h2>Ø§Ù„Ø¯Ø¹Ù…</h2>
            <p>ØªÙˆØ§ØµÙ„ Ù…Ø¹ ÙØ±ÙŠÙ‚ Ø¹Ø±Ø§Ù‚ ØªÙƒØ§ÙÙ„ Ø¹Ø¨Ø± Ø§Ù„Ù‡Ø§ØªÙ Ø£Ùˆ ÙˆØ§ØªØ³Ø§Ø¨ Ø£Ùˆ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ.</p>
            <a href="/support" onClick={navigate("support")}>Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¯Ø¹Ù…</a>
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
                      <dt>{language === "ar" ? "Ù†ÙˆØ¹ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹" : "Project type"}</dt>
                      <dd>{trackingLookup.project.type}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "engineering" && trackingLookup.project?.insuranceType ? (
                    <div>
                      <dt>{language === "ar" ? "Ù†ÙˆØ¹ Ø§Ù„ØªØ£Ù…ÙŠÙ†" : "Insurance type"}</dt>
                      <dd>{trackingLookup.project.insuranceType}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "engineering" && trackingLookup.project?.location ? (
                    <div>
                      <dt>{language === "ar" ? "Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹" : "Project location"}</dt>
                      <dd>{trackingLookup.project.location}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "health" && trackingLookup.health?.coverageScope ? (
                    <div>
                      <dt>{language === "ar" ? "Ù†Ø·Ø§Ù‚ Ø§Ù„ØªØºØ·ÙŠØ©" : "Coverage scope"}</dt>
                      <dd>{trackingLookup.health.coverageScope}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "health" && trackingLookup.health?.insuredMembersCount ? (
                    <div>
                      <dt>{language === "ar" ? "Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ø¤Ù…Ù†ÙŠÙ†" : "Insured members"}</dt>
                      <dd>{trackingLookup.health.insuredMembersCount}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "fireTheft" && trackingLookup.property?.address ? (
                    <div>
                      <dt>{language === "ar" ? "Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø¹Ù‚Ø§Ø±" : "Property address"}</dt>
                      <dd>{trackingLookup.property.address}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "fireTheft" && trackingLookup.property?.totalSumInsured ? (
                    <div>
                      <dt>{language === "ar" ? "Ù…Ø¨Ù„Øº Ø§Ù„ØªØ£Ù…ÙŠÙ†" : "Sum insured"}</dt>
                      <dd>{`${trackingLookup.property.totalSumInsured} ${trackingLookup.property.currency ?? ""}`.trim()}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "generalAccident" && trackingLookup.accident?.accidentType ? (
                    <div>
                      <dt>{language === "ar" ? "Ù†ÙˆØ¹ Ø§Ù„Ø­Ø§Ø¯Ø«" : "Accident type"}</dt>
                      <dd>{trackingLookup.accident.accidentType}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "generalAccident" && trackingLookup.accident?.riskLocation ? (
                    <div>
                      <dt>{language === "ar" ? "Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø®Ø·Ø±" : "Risk location"}</dt>
                      <dd>{trackingLookup.accident.riskLocation}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "generalAccident" && trackingLookup.accident?.coverageLimit ? (
                    <div>
                      <dt>{language === "ar" ? "Ø­Ø¯ Ø§Ù„ØªØºØ·ÙŠØ©" : "Coverage limit"}</dt>
                      <dd>{`${trackingLookup.accident.coverageLimit} ${trackingLookup.accident.currency ?? ""}`.trim()}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "energy" && trackingLookup.energy?.energyType ? (
                    <>
                      <dt>نوع الطاقة</dt>
                      <dd>{trackingLookup.energy.energyType}</dd>
                    </>
                  ) : null}
                  {trackingLookup.requestType === "energy" && trackingLookup.energy?.facilityType ? (
                    <>
                      <dt>نوع المنشأة</dt>
                      <dd>{trackingLookup.energy.facilityType}</dd>
                    </>
                  ) : null}
                  {trackingLookup.requestType === "energy" && trackingLookup.energy?.totalSumInsured ? (
                    <>
                      <dt>مبلغ التأمين</dt>
                      <dd>{`${trackingLookup.energy.totalSumInsured} ${trackingLookup.energy.currency ?? ""}`.trim()}</dd>
                    </>
                  ) : null}
                  {trackingLookup.requestType === "travel" && trackingLookup.travel?.coverageType ? (
                    <div>
                      <dt>{language === "ar" ? "Ù†ÙˆØ¹ Ø§Ù„ØªØºØ·ÙŠØ©" : "Coverage type"}</dt>
                      <dd>{trackingLookup.travel.coverageType}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "travel" && trackingLookup.travel?.travelersCount ? (
                    <div>
                      <dt>{language === "ar" ? "Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ø³Ø§ÙØ±ÙŠÙ†" : "Travelers"}</dt>
                      <dd>{trackingLookup.travel.travelersCount}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "transport" && trackingLookup.transport?.transportMode ? (
                    <div>
                      <dt>{language === "ar" ? "Ù†ÙˆØ¹ Ø§Ù„Ù†Ù‚Ù„" : "Transport mode"}</dt>
                      <dd>{trackingLookup.transport.transportMode}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "transport" && trackingLookup.transport?.cargoValue ? (
                    <div>
                      <dt>{language === "ar" ? "Ù‚ÙŠÙ…Ø© Ø§Ù„Ø´Ø­Ù†Ø©" : "Cargo value"}</dt>
                      <dd>{`${trackingLookup.transport.cargoValue} ${trackingLookup.transport.currency ?? ""}`.trim()}</dd>
                    </div>
                  ) : null}
                  {trackingLookup.requestType === "transport" && (trackingLookup.transport?.originCity || trackingLookup.transport?.destinationCity) ? (
                    <div>
                      <dt>{language === "ar" ? "Ø§Ù„Ù…Ø³Ø§Ø±" : "Route"}</dt>
                      <dd>{[trackingLookup.transport.originCity, trackingLookup.transport.destinationCity].filter(Boolean).join(" - ")}</dd>
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
                  ØªØ£Ù…ÙŠÙ† Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„Ù‡Ù†Ø¯Ø³ÙŠØ©
                </span>
                <h1>Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ù‡Ù†Ø¯Ø³ÙŠ</h1>
                <p>Ø£Ø¯Ø®Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„ ÙˆØ§Ù„Ù…Ø´Ø±ÙˆØ¹ Ø­ØªÙ‰ ÙŠØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨ Ù…Ø¨Ø§Ø´Ø±Ø© Ø¥Ù„Ù‰ Ù†Ø¸Ø§Ù… TRINSU.</p>
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
                  <h2>Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„</h2>
                  <div className="grid two">
                    <FloatingField id="eng-fullName" label="Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„" value={engineeringForm.fullName} error={engineeringErrors.fullName} required onChange={setEngineeringValue("fullName")} />
                    <FloatingField id="eng-mobile" label="Ø±Ù‚Ù… Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„" value={engineeringForm.mobile} error={engineeringErrors.mobile} required inputMode="tel" onChange={setEngineeringValue("mobile")} />
                    <FloatingField id="eng-email" label="Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ" value={engineeringForm.email} error={engineeringErrors.email} type="email" onChange={setEngineeringValue("email")} />
                    <FloatingField id="eng-nationalId" label="Ø§Ù„Ø±Ù‚Ù… Ø§Ù„ÙˆØ·Ù†ÙŠ" value={engineeringForm.nationalId} error={engineeringErrors.nationalId} onChange={setEngineeringValue("nationalId")} />
                    <FloatingField id="eng-city" label="Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©" value={engineeringForm.city} error={engineeringErrors.city} onChange={setEngineeringValue("city")} />
                    <FloatingField id="eng-address" label="Ø§Ù„Ø¹Ù†ÙˆØ§Ù†" value={engineeringForm.address} error={engineeringErrors.address} onChange={setEngineeringValue("address")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</h2>
                  <div className="grid three">
                    <FloatingField id="eng-projectName" label="Ø§Ø³Ù… Ø§Ù„Ù…Ø´Ø±ÙˆØ¹" value={engineeringForm.projectName} error={engineeringErrors.projectName} required onChange={setEngineeringValue("projectName")} />
                    <FloatingField id="eng-projectType" label="Ù†ÙˆØ¹ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹" value={engineeringForm.projectType} error={engineeringErrors.projectType} required onChange={setEngineeringValue("projectType")} />
                    <FloatingField id="eng-projectLocation" label="Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹" value={engineeringForm.projectLocation} error={engineeringErrors.projectLocation} required onChange={setEngineeringValue("projectLocation")} />
                    <FloatingField id="eng-contractValue" label="Ù‚ÙŠÙ…Ø© Ø§Ù„Ø¹Ù‚Ø¯" value={engineeringForm.contractValue} error={engineeringErrors.contractValue} required inputMode="decimal" onChange={setEngineeringValue("contractValue")} />
                    <FloatingField id="eng-currency" label="Ø§Ù„Ø¹Ù…Ù„Ø©" value={engineeringForm.currency} error={engineeringErrors.currency} required onChange={setEngineeringValue("currency")} />
                    <FloatingField id="eng-insuranceType" label="Ù†ÙˆØ¹ Ø§Ù„ØªØ£Ù…ÙŠÙ†" value={engineeringForm.insuranceType} error={engineeringErrors.insuranceType} required onChange={setEngineeringValue("insuranceType")} />
                    <FloatingField id="eng-startDate" label="ØªØ§Ø±ÙŠØ® Ø¨Ø¯Ø§ÙŠØ© Ø§Ù„Ù…Ø´Ø±ÙˆØ¹" value={engineeringForm.startDate} error={engineeringErrors.startDate} type="date" onChange={setEngineeringValue("startDate")} />
                    <FloatingField id="eng-endDate" label="ØªØ§Ø±ÙŠØ® Ù†Ù‡Ø§ÙŠØ© Ø§Ù„Ù…Ø´Ø±ÙˆØ¹" value={engineeringForm.endDate} error={engineeringErrors.endDate} type="date" onChange={setEngineeringValue("endDate")} />
                    <FloatingField id="eng-contractorName" label="Ø§Ø³Ù… Ø§Ù„Ù…Ù‚Ø§ÙˆÙ„" value={engineeringForm.contractorName} error={engineeringErrors.contractorName} onChange={setEngineeringValue("contractorName")} />
                    <FloatingField id="eng-ownerName" label="Ø§Ø³Ù… Ù…Ø§Ù„Ùƒ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹" value={engineeringForm.ownerName} error={engineeringErrors.ownerName} onChange={setEngineeringValue("ownerName")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>ØªÙØ§ØµÙŠÙ„ Ø¥Ø¶Ø§ÙÙŠØ©</h2>
                  <div className="grid two">
                    <FloatingField id="eng-riskDetails" label="ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ù…Ø®Ø§Ø·Ø±" value={engineeringForm.riskDetails} error={engineeringErrors.riskDetails} multiline rows={6} onChange={setEngineeringValue("riskDetails")} />
                    <FloatingField id="eng-notes" label="Ù…Ù„Ø§Ø­Ø¸Ø§Øª" value={engineeringForm.notes} error={engineeringErrors.notes} multiline rows={6} onChange={setEngineeringValue("notes")} />
                  </div>
                </motion.section>

                <motion.section className="panel review-panel" {...sectionAnimation}>
                  <h2>Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø·Ù„Ø¨</h2>
                  <div className="review-grid">
                    <span>Ø§Ù„Ø¹Ù…ÙŠÙ„</span>
                    <strong>{engineeringForm.fullName || "-"}</strong>
                    <span>Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</span>
                    <strong>{engineeringForm.projectName || "-"}</strong>
                    <span>Ù†ÙˆØ¹ Ø§Ù„ØªØ£Ù…ÙŠÙ†</span>
                    <strong>{engineeringForm.insuranceType || "-"}</strong>
                    <span>Ù‚ÙŠÙ…Ø© Ø§Ù„Ø¹Ù‚Ø¯</span>
                    <strong>{engineeringForm.contractValue ? `${engineeringForm.contractValue} ${engineeringForm.currency}` : "-"}</strong>
                  </div>
                  <label className={`confirm ${engineeringErrors.confirmed ? "field-error" : ""}`}>
                    <input type="checkbox" checked={engineeringForm.confirmed} onChange={setEngineeringValue("confirmed")} />
                    <span>Ø£Ø¤ÙƒØ¯ ØµØ­Ø© Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ÙˆØ£ÙˆØ§ÙÙ‚ Ø¹Ù„Ù‰ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨ Ø¥Ù„Ù‰ TRINSU.</span>
                  </label>
                  {engineeringErrors.confirmed ? <p className="error-text">{engineeringErrors.confirmed}</p> : null}
                  {engineeringSubmitError ? <p className="submit-error" role="alert">{engineeringSubmitError}</p> : null}
                  <button className="submit-button" type="submit" disabled={isEngineeringSubmitting}>
                    {isEngineeringSubmitting ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
                    {isEngineeringSubmitting ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„" : "Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„ØªØ£Ù…ÙŠÙ†"}
                  </button>
                </motion.section>

                {engineeringRequest ? (
                  <motion.section className="success-panel" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <CheckCircle2 size={42} aria-hidden="true" />
                    <h2>ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„ØªØ£Ù…ÙŠÙ† Ø§Ù„Ù‡Ù†Ø¯Ø³ÙŠ</h2>
                    <p>ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨ ÙÙŠ Ù†Ø¸Ø§Ù… TRINSU Ø¨Ù†Ø¬Ø§Ø­.</p>
                    <div className="success-numbers">
                      <div>
                        <span>Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨</span>
                        <strong>{engineeringRequest.requestNumber}</strong>
                      </div>
                      <div>
                        <span>Ø±Ù‚Ù… Ø§Ù„ØªØªØ¨Ø¹</span>
                        <strong>{engineeringRequest.trackingNumber}</strong>
                      </div>
                    </div>
                    <div className="success-status">
                      <span>Ø§Ù„Ø­Ø§Ù„Ø©</span>
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
                  Ø·Ù„Ø¨Ø§Øª Ø§Ù„ØªØ£Ù…ÙŠÙ† Ø§Ù„ØµØ­ÙŠ
                </span>
                <h1>Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† ØµØ­ÙŠ</h1>
                <p>Ø£Ø¯Ø®Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„ ÙˆØ®Ø·Ø© Ø§Ù„ØªØºØ·ÙŠØ© Ø§Ù„ØµØ­ÙŠØ© Ù„ÙŠØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨ ÙˆÙ…ØªØ§Ø¨Ø¹ØªÙ‡ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù†Ø¸Ø§Ù….</p>
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
                  <h2>Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„</h2>
                  <div className="grid three">
                    <FloatingField id="health-fullName" label="Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„" value={healthForm.fullName} error={healthErrors.fullName} required onChange={setHealthValue("fullName")} />
                    <FloatingField id="health-mobile" label="Ø±Ù‚Ù… Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„" value={healthForm.mobile} error={healthErrors.mobile} required inputMode="tel" onChange={setHealthValue("mobile")} />
                    <FloatingField id="health-email" label="Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ" value={healthForm.email} error={healthErrors.email} type="email" onChange={setHealthValue("email")} />
                    <FloatingField id="health-nationalId" label="Ø§Ù„Ø±Ù‚Ù… Ø§Ù„ÙˆØ·Ù†ÙŠ" value={healthForm.nationalId} error={healthErrors.nationalId} required onChange={setHealthValue("nationalId")} />
                    <FloatingField id="health-age" label="Ø§Ù„Ø¹Ù…Ø±" value={healthForm.age} error={healthErrors.age} required inputMode="numeric" onChange={setHealthValue("age")} />
                    <FloatingField id="health-gender" label="Ø§Ù„Ø¬Ù†Ø³" value={healthForm.gender} error={healthErrors.gender} required onChange={setHealthValue("gender")} />
                    <FloatingField id="health-city" label="Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©" value={healthForm.city} error={healthErrors.city} required onChange={setHealthValue("city")} />
                    <FloatingField id="health-address" label="Ø§Ù„Ø¹Ù†ÙˆØ§Ù†" value={healthForm.address} error={healthErrors.address} onChange={setHealthValue("address")} />
                    <FloatingField id="health-occupation" label="Ø§Ù„Ù…Ù‡Ù†Ø©" value={healthForm.occupation} error={healthErrors.occupation} onChange={setHealthValue("occupation")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>ØªÙØ§ØµÙŠÙ„ Ø§Ù„ØªØºØ·ÙŠØ© Ø§Ù„ØµØ­ÙŠØ©</h2>
                  <div className="grid three">
                    <FloatingField id="health-planType" label="Ù†ÙˆØ¹ Ø§Ù„Ø®Ø·Ø©" value={healthForm.planType} error={healthErrors.planType} required onChange={setHealthValue("planType")} />
                    <FloatingField id="health-coverageScope" label="Ù†Ø·Ø§Ù‚ Ø§Ù„ØªØºØ·ÙŠØ©" value={healthForm.coverageScope} error={healthErrors.coverageScope} required onChange={setHealthValue("coverageScope")} />
                    <FloatingField id="health-insuredMembersCount" label="Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ø¤Ù…Ù†ÙŠÙ†" value={healthForm.insuredMembersCount} error={healthErrors.insuredMembersCount} required inputMode="numeric" onChange={setHealthValue("insuredMembersCount")} />
                    <FloatingField id="health-companyName" label="Ø§Ø³Ù… Ø§Ù„Ø´Ø±ÙƒØ©" value={healthForm.companyName} error={healthErrors.companyName} onChange={setHealthValue("companyName")} />
                    <FloatingField id="health-coverageStartDate" label="ØªØ§Ø±ÙŠØ® Ø¨Ø¯Ø§ÙŠØ© Ø§Ù„ØªØºØ·ÙŠØ©" value={healthForm.coverageStartDate} error={healthErrors.coverageStartDate} type="date" onChange={setHealthValue("coverageStartDate")} />
                    <FloatingField id="health-coverageEndDate" label="ØªØ§Ø±ÙŠØ® Ù†Ù‡Ø§ÙŠØ© Ø§Ù„ØªØºØ·ÙŠØ©" value={healthForm.coverageEndDate} error={healthErrors.coverageEndDate} type="date" onChange={setHealthValue("coverageEndDate")} />
                    <FloatingField id="health-estimatedAnnualPremium" label="Ø§Ù„Ù‚Ø³Ø· Ø§Ù„Ø³Ù†ÙˆÙŠ Ø§Ù„Ù…ØªÙˆÙ‚Ø¹" value={healthForm.estimatedAnnualPremium} error={healthErrors.estimatedAnnualPremium} inputMode="decimal" onChange={setHealthValue("estimatedAnnualPremium")} />
                    <FloatingField id="health-currency" label="Ø§Ù„Ø¹Ù…Ù„Ø©" value={healthForm.currency} error={healthErrors.currency} required onChange={setHealthValue("currency")} />
                    <FloatingField id="health-preferredHospitals" label="Ø§Ù„Ù…Ø³ØªØ´ÙÙŠØ§Øª Ø§Ù„Ù…ÙØ¶Ù„Ø©" value={healthForm.preferredHospitals} error={healthErrors.preferredHospitals} onChange={setHealthValue("preferredHospitals")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„ØµØ­ÙŠØ© ÙˆØ§Ù„ØªØ£Ù…ÙŠÙ† Ø§Ù„Ø³Ø§Ø¨Ù‚</h2>
                  <div className="grid two">
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={healthForm.hasChronicConditions} onChange={setHealthValue("hasChronicConditions")} />
                      <span>ÙŠÙˆØ¬Ø¯ Ø£Ù…Ø±Ø§Ø¶ Ø£Ùˆ Ø­Ø§Ù„Ø§Øª Ù…Ø²Ù…Ù†Ø©</span>
                    </label>
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={healthForm.previousInsurance} onChange={setHealthValue("previousInsurance")} />
                      <span>ÙŠÙˆØ¬Ø¯ ØªØ£Ù…ÙŠÙ† ØµØ­ÙŠ Ø³Ø§Ø¨Ù‚</span>
                    </label>
                    <FloatingField id="health-chronicConditions" label="ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø­Ø§Ù„Ø§Øª Ø§Ù„Ù…Ø²Ù…Ù†Ø©" value={healthForm.chronicConditions} error={healthErrors.chronicConditions} multiline rows={5} onChange={setHealthValue("chronicConditions")} />
                    <FloatingField id="health-previousInsurer" label="Ø´Ø±ÙƒØ© Ø§Ù„ØªØ£Ù…ÙŠÙ† Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©" value={healthForm.previousInsurer} error={healthErrors.previousInsurer} onChange={setHealthValue("previousInsurer")} />
                    <FloatingField id="health-notes" label="Ù…Ù„Ø§Ø­Ø¸Ø§Øª" value={healthForm.notes} error={healthErrors.notes} multiline rows={5} onChange={setHealthValue("notes")} />
                  </div>
                </motion.section>

                <motion.section className="panel review-panel" {...sectionAnimation}>
                  <h2>Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø·Ù„Ø¨</h2>
                  <div className="review-grid">
                    <span>Ø§Ù„Ø¹Ù…ÙŠÙ„</span>
                    <strong>{healthForm.fullName || "-"}</strong>
                    <span>Ø§Ù„Ø®Ø·Ø©</span>
                    <strong>{healthForm.planType || "-"}</strong>
                    <span>Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ø¤Ù…Ù†ÙŠÙ†</span>
                    <strong>{healthForm.insuredMembersCount || "-"}</strong>
                    <span>Ø§Ù„Ù‚Ø³Ø· Ø§Ù„Ù…ØªÙˆÙ‚Ø¹</span>
                    <strong>{healthForm.estimatedAnnualPremium ? `${healthForm.estimatedAnnualPremium} ${healthForm.currency}` : "-"}</strong>
                  </div>
                  <label className={`confirm ${healthErrors.confirmed ? "field-error" : ""}`}>
                    <input type="checkbox" checked={healthForm.confirmed} onChange={setHealthValue("confirmed")} />
                    <span>Ø£Ø¤ÙƒØ¯ ØµØ­Ø© Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ÙˆØ£ÙˆØ§ÙÙ‚ Ø¹Ù„Ù‰ Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„ØªØ£Ù…ÙŠÙ† Ø§Ù„ØµØ­ÙŠ Ø¥Ù„Ù‰ TRINSU.</span>
                  </label>
                  {healthErrors.confirmed ? <p className="error-text">{healthErrors.confirmed}</p> : null}
                  {healthSubmitError ? <p className="submit-error" role="alert">{healthSubmitError}</p> : null}
                  <button className="submit-button" type="submit" disabled={isHealthSubmitting}>
                    {isHealthSubmitting ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
                    {isHealthSubmitting ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„" : "Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„ØªØ£Ù…ÙŠÙ† Ø§Ù„ØµØ­ÙŠ"}
                  </button>
                </motion.section>

                {healthRequest ? (
                  <motion.section className="success-panel" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <CheckCircle2 size={42} aria-hidden="true" />
                    <h2>ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„ØªØ£Ù…ÙŠÙ† Ø§Ù„ØµØ­ÙŠ</h2>
                    <p>ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„ØµØ­ÙŠ ÙÙŠ Ù†Ø¸Ø§Ù… TRINSU Ø¨Ù†Ø¬Ø§Ø­.</p>
                    <div className="success-numbers">
                      <div>
                        <span>Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨</span>
                        <strong>{healthRequest.requestNumber}</strong>
                      </div>
                      <div>
                        <span>Ø±Ù‚Ù… Ø§Ù„ØªØªØ¨Ø¹</span>
                        <strong>{healthRequest.trackingNumber}</strong>
                      </div>
                    </div>
                    <div className="success-status">
                      <span>Ø§Ù„Ø­Ø§Ù„Ø©</span>
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
                  ØªØ£Ù…ÙŠÙ† Ø§Ù„Ø­Ø±ÙŠÙ‚ ÙˆØ§Ù„Ø³Ø±Ù‚Ø©
                </span>
                <h1>Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø­Ø±ÙŠÙ‚ ÙˆØ³Ø±Ù‚Ø©</h1>
                <p>Ø£Ø¯Ø®Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„ ÙˆØ§Ù„Ø¹Ù‚Ø§Ø± ÙˆÙ…Ø¨Ø§Ù„Øº Ø§Ù„ØªØ£Ù…ÙŠÙ† ÙˆØ£Ù†Ø¸Ù…Ø© Ø§Ù„Ø­Ù…Ø§ÙŠØ© Ù„ÙŠØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨ ÙˆÙ…ØªØ§Ø¨Ø¹ØªÙ‡ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù†Ø¸Ø§Ù….</p>
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
                  <h2>Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„</h2>
                  <div className="grid three">
                    <FloatingField id="fire-fullName" label="Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„" value={fireTheftForm.fullName} error={fireTheftErrors.fullName} required onChange={setFireTheftValue("fullName")} />
                    <FloatingField id="fire-mobile" label="Ø±Ù‚Ù… Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„" value={fireTheftForm.mobile} error={fireTheftErrors.mobile} required inputMode="tel" onChange={setFireTheftValue("mobile")} />
                    <FloatingField id="fire-email" label="Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ" value={fireTheftForm.email} error={fireTheftErrors.email} type="email" onChange={setFireTheftValue("email")} />
                    <FloatingField id="fire-nationalId" label="Ø§Ù„Ø±Ù‚Ù… Ø§Ù„ÙˆØ·Ù†ÙŠ" value={fireTheftForm.nationalId} error={fireTheftErrors.nationalId} required onChange={setFireTheftValue("nationalId")} />
                    <FloatingField id="fire-city" label="Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©" value={fireTheftForm.city} error={fireTheftErrors.city} required onChange={setFireTheftValue("city")} />
                    <FloatingField id="fire-address" label="Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø¹Ù…ÙŠÙ„" value={fireTheftForm.address} error={fireTheftErrors.address} onChange={setFireTheftValue("address")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¹Ù‚Ø§Ø±</h2>
                  <div className="grid three">
                    <FloatingField id="fire-propertyType" label="Ù†ÙˆØ¹ Ø§Ù„Ø¹Ù‚Ø§Ø±" value={fireTheftForm.propertyType} error={fireTheftErrors.propertyType} required onChange={setFireTheftValue("propertyType")} />
                    <FloatingField id="fire-propertyUsage" label="Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø¹Ù‚Ø§Ø±" value={fireTheftForm.propertyUsage} error={fireTheftErrors.propertyUsage} required onChange={setFireTheftValue("propertyUsage")} />
                    <FloatingField id="fire-propertyAddress" label="Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø¹Ù‚Ø§Ø±" value={fireTheftForm.propertyAddress} error={fireTheftErrors.propertyAddress} required onChange={setFireTheftValue("propertyAddress")} />
                    <FloatingField id="fire-coverageScope" label="Ù†Ø·Ø§Ù‚ Ø§Ù„ØªØºØ·ÙŠØ©" value={fireTheftForm.coverageScope} error={fireTheftErrors.coverageScope} required onChange={setFireTheftValue("coverageScope")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>Ù…Ø¨Ø§Ù„Øº Ø§Ù„ØªØ£Ù…ÙŠÙ† ÙˆØ£Ù†Ø¸Ù…Ø© Ø§Ù„Ø³Ù„Ø§Ù…Ø©</h2>
                  <div className="grid three">
                    <FloatingField id="fire-buildingValue" label="Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø¨Ù†Ù‰" value={fireTheftForm.buildingValue} error={fireTheftErrors.buildingValue} required inputMode="decimal" onChange={setFireTheftValue("buildingValue")} />
                    <FloatingField id="fire-contentsValue" label="Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø­ØªÙˆÙŠØ§Øª" value={fireTheftForm.contentsValue} error={fireTheftErrors.contentsValue} inputMode="decimal" onChange={setFireTheftValue("contentsValue")} />
                    <FloatingField id="fire-stockValue" label="Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø®Ø²ÙˆÙ†" value={fireTheftForm.stockValue} error={fireTheftErrors.stockValue} inputMode="decimal" onChange={setFireTheftValue("stockValue")} />
                    <FloatingField id="fire-totalSumInsured" label="Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ù…Ø¨Ù„Øº Ø§Ù„ØªØ£Ù…ÙŠÙ†" value={fireTheftForm.totalSumInsured} error={fireTheftErrors.totalSumInsured} required inputMode="decimal" onChange={setFireTheftValue("totalSumInsured")} />
                    <FloatingField id="fire-currency" label="Ø§Ù„Ø¹Ù…Ù„Ø©" value={fireTheftForm.currency} error={fireTheftErrors.currency} required onChange={setFireTheftValue("currency")} />
                  </div>
                  <div className="grid three">
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={fireTheftForm.hasFireAlarm} onChange={setFireTheftValue("hasFireAlarm")} />
                      <span>ÙŠÙˆØ¬Ø¯ Ù†Ø¸Ø§Ù… Ø¥Ù†Ø°Ø§Ø± Ø­Ø±ÙŠÙ‚</span>
                    </label>
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={fireTheftForm.hasFireExtinguishers} onChange={setFireTheftValue("hasFireExtinguishers")} />
                      <span>ØªØªÙˆÙØ± Ù…Ø·Ø§ÙØ¦ Ø­Ø±ÙŠÙ‚</span>
                    </label>
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={fireTheftForm.hasSecuritySystem} onChange={setFireTheftValue("hasSecuritySystem")} />
                      <span>ÙŠÙˆØ¬Ø¯ Ù†Ø¸Ø§Ù… Ø­Ù…Ø§ÙŠØ© Ø£Ùˆ Ù…Ø±Ø§Ù‚Ø¨Ø©</span>
                    </label>
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>Ù…Ù„Ø§Ø­Ø¸Ø§Øª</h2>
                  <FloatingField id="fire-notes" label="Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø¥Ø¶Ø§ÙÙŠØ©" value={fireTheftForm.notes} error={fireTheftErrors.notes} multiline rows={6} onChange={setFireTheftValue("notes")} />
                </motion.section>

                <motion.section className="panel review-panel" {...sectionAnimation}>
                  <h2>Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø·Ù„Ø¨</h2>
                  <div className="review-grid">
                    <span>Ø§Ù„Ø¹Ù…ÙŠÙ„</span>
                    <strong>{fireTheftForm.fullName || "-"}</strong>
                    <span>Ø§Ù„Ø¹Ù‚Ø§Ø±</span>
                    <strong>{fireTheftForm.propertyType || "-"}</strong>
                    <span>Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø¹Ù‚Ø§Ø±</span>
                    <strong>{fireTheftForm.propertyAddress || "-"}</strong>
                    <span>Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ù…Ø¨Ù„Øº Ø§Ù„ØªØ£Ù…ÙŠÙ†</span>
                    <strong>{fireTheftForm.totalSumInsured ? `${fireTheftForm.totalSumInsured} ${fireTheftForm.currency}` : "-"}</strong>
                  </div>
                  <label className={`confirm ${fireTheftErrors.confirmed ? "field-error" : ""}`}>
                    <input type="checkbox" checked={fireTheftForm.confirmed} onChange={setFireTheftValue("confirmed")} />
                    <span>Ø£Ø¤ÙƒØ¯ ØµØ­Ø© Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ÙˆØ£ÙˆØ§ÙÙ‚ Ø¹Ù„Ù‰ Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø§Ù„Ø­Ø±ÙŠÙ‚ ÙˆØ§Ù„Ø³Ø±Ù‚Ø© Ø¥Ù„Ù‰ TRINSU.</span>
                  </label>
                  {fireTheftErrors.confirmed ? <p className="error-text">{fireTheftErrors.confirmed}</p> : null}
                  {fireTheftSubmitError ? <p id="fire-theft-submit-error" className="submit-error" role="alert">{fireTheftSubmitError}</p> : null}
                  <button className="submit-button" type="submit" disabled={isFireTheftSubmitting}>
                    {isFireTheftSubmitting ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
                    {isFireTheftSubmitting ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„" : "Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø§Ù„Ø­Ø±ÙŠÙ‚ ÙˆØ§Ù„Ø³Ø±Ù‚Ø©"}
                  </button>
                </motion.section>

                {fireTheftRequest ? (
                  <motion.section className="success-panel" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <CheckCircle2 size={42} aria-hidden="true" />
                    <h2>ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø§Ù„Ø­Ø±ÙŠÙ‚ ÙˆØ§Ù„Ø³Ø±Ù‚Ø©</h2>
                    <p>ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨ ÙÙŠ Ù†Ø¸Ø§Ù… TRINSU Ø¨Ù†Ø¬Ø§Ø­.</p>
                    <div className="success-numbers">
                      <div>
                        <span>Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨</span>
                        <strong>{fireTheftRequest.requestNumber}</strong>
                      </div>
                      <div>
                        <span>Ø±Ù‚Ù… Ø§Ù„ØªØªØ¨Ø¹</span>
                        <strong>{fireTheftRequest.trackingNumber}</strong>
                      </div>
                    </div>
                    <div className="success-status">
                      <span>Ø§Ù„Ø­Ø§Ù„Ø©</span>
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
                <p>أدخل بيانات العميل ونشاط العمل وموقع الخطر وحدود التغطية ليتم تسجيل الطلب ومتابعته داخل نظام TRINSU.</p>
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
                  <h2>تفاصيل المؤمن له والخطر</h2>
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
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>السلامة والملاحظات</h2>
                  <div className="grid two">
                    <label className="confirm compact-confirm"><input type="checkbox" checked={generalAccidentForm.hasSafetyProgram} onChange={setGeneralAccidentValue("hasSafetyProgram")} /><span>يوجد برنامج سلامة</span></label>
                    <label className="confirm compact-confirm"><input type="checkbox" checked={generalAccidentForm.previousClaims} onChange={setGeneralAccidentValue("previousClaims")} /><span>توجد مطالبات سابقة</span></label>
                    <FloatingField id="gac-riskDetails" label="تفاصيل الخطر" value={generalAccidentForm.riskDetails} error={generalAccidentErrors.riskDetails} multiline rows={6} onChange={setGeneralAccidentValue("riskDetails")} />
                    <FloatingField id="gac-notes" label="ملاحظات" value={generalAccidentForm.notes} error={generalAccidentErrors.notes} multiline rows={6} onChange={setGeneralAccidentValue("notes")} />
                  </div>
                </motion.section>

                <motion.section className="panel review-panel" {...sectionAnimation}>
                  <h2>مراجعة الطلب</h2>
                  <div className="review-grid">
                    <span>العميل</span><strong>{generalAccidentForm.fullName || "-"}</strong>
                    <span>المؤمن له</span><strong>{generalAccidentForm.insuredName || "-"}</strong>
                    <span>نوع الحادث</span><strong>{generalAccidentForm.accidentType || "-"}</strong>
                    <span>حد التغطية</span><strong>{generalAccidentForm.coverageLimit ? generalAccidentForm.coverageLimit + " " + generalAccidentForm.currency : "-"}</strong>
                  </div>
                  <label className={"confirm " + (generalAccidentErrors.confirmed ? "field-error" : "")}>
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
                    <div className="success-numbers"><div><span>رقم الطلب</span><strong>{generalAccidentRequest.requestNumber}</strong></div><div><span>رقم التتبع</span><strong>{generalAccidentRequest.trackingNumber}</strong></div></div>
                    <div className="success-status"><span>الحالة</span><strong>{generalAccidentRequest.status}</strong></div>
                    <div className="success-actions"><button className="submit-button" type="button" onClick={() => openTrackingRequest(generalAccidentRequest.trackingNumber)}><MapPinned size={18} aria-hidden="true" />تتبع الطلب</button></div>
                  </motion.section>
                ) : null}
              </fieldset>
            </form>
          </>
        ) : null}

        {showEnergyPage ? (
          <>
            <motion.section className="engineering-hero" {...sectionAnimation}>
              <div>
                <span className="eyebrow">
                  <Zap size={18} aria-hidden="true" />
                  تأمين مشاريع الطاقة
                </span>
                <h1>طلب تأمين طاقة</h1>
                <p>أدخل بيانات العميل ومشروع الطاقة وقيم الأصول وحدود التغطية ليتم تسجيل الطلب ومتابعته داخل نظام TRINSU.</p>
              </div>
              <div className="engineering-metrics" aria-hidden="true">
                <span>ENR</span>
                <strong>Energy Insurance</strong>
                <small>Power and energy request</small>
              </div>
            </motion.section>

            <form id="energy-request-form" className="request-form" onSubmit={submitEnergy} noValidate>
              <fieldset className="form-fieldset" disabled={isEnergySubmitting}>
                <motion.section className="panel" {...sectionAnimation}>
                  <h2>معلومات العميل</h2>
                  <div className="grid three">
                    <FloatingField id="energy-fullName" label="الاسم الكامل" value={energyForm.fullName} error={energyErrors.fullName} required onChange={setEnergyValue("fullName")} />
                    <FloatingField id="energy-mobile" label="رقم الموبايل" value={energyForm.mobile} error={energyErrors.mobile} required inputMode="tel" onChange={setEnergyValue("mobile")} />
                    <FloatingField id="energy-email" label="البريد الإلكتروني" value={energyForm.email} error={energyErrors.email} type="email" onChange={setEnergyValue("email")} />
                    <FloatingField id="energy-nationalId" label="الرقم الوطني" value={energyForm.nationalId} error={energyErrors.nationalId} required onChange={setEnergyValue("nationalId")} />
                    <FloatingField id="energy-city" label="المدينة" value={energyForm.city} error={energyErrors.city} required onChange={setEnergyValue("city")} />
                    <FloatingField id="energy-address" label="العنوان" value={energyForm.address} error={energyErrors.address} onChange={setEnergyValue("address")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>تفاصيل مشروع الطاقة</h2>
                  <div className="grid three">
                    <FloatingField id="energy-insuredName" label="اسم المؤمن له" value={energyForm.insuredName} error={energyErrors.insuredName} required onChange={setEnergyValue("insuredName")} />
                    <FloatingField id="energy-projectName" label="اسم المشروع" value={energyForm.projectName} error={energyErrors.projectName} required onChange={setEnergyValue("projectName")} />
                    <FloatingField id="energy-energyType" label="نوع الطاقة" value={energyForm.energyType} error={energyErrors.energyType} required onChange={setEnergyValue("energyType")} />
                    <FloatingField id="energy-facilityType" label="نوع المنشأة" value={energyForm.facilityType} error={energyErrors.facilityType} required onChange={setEnergyValue("facilityType")} />
                    <FloatingField id="energy-projectLocation" label="موقع المشروع" value={energyForm.projectLocation} error={energyErrors.projectLocation} required onChange={setEnergyValue("projectLocation")} />
                    <FloatingField id="energy-projectCity" label="مدينة المشروع" value={energyForm.projectCity} error={energyErrors.projectCity} required onChange={setEnergyValue("projectCity")} />
                    <FloatingField id="energy-operatorName" label="اسم المشغل" value={energyForm.operatorName} error={energyErrors.operatorName} onChange={setEnergyValue("operatorName")} />
                    <FloatingField id="energy-contractorName" label="اسم المقاول" value={energyForm.contractorName} error={energyErrors.contractorName} onChange={setEnergyValue("contractorName")} />
                    <FloatingField id="energy-capacityMw" label="الطاقة الإنتاجية MW" value={energyForm.capacityMw} error={energyErrors.capacityMw} inputMode="decimal" onChange={setEnergyValue("capacityMw")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>القيم وحدود التغطية</h2>
                  <div className="grid three">
                    <FloatingField id="energy-assetValue" label="قيمة الأصول" value={energyForm.assetValue} error={energyErrors.assetValue} required inputMode="decimal" onChange={setEnergyValue("assetValue")} />
                    <FloatingField id="energy-businessInterruptionLimit" label="حد توقف الأعمال" value={energyForm.businessInterruptionLimit} error={energyErrors.businessInterruptionLimit} inputMode="decimal" onChange={setEnergyValue("businessInterruptionLimit")} />
                    <FloatingField id="energy-liabilityLimit" label="حد المسؤولية" value={energyForm.liabilityLimit} error={energyErrors.liabilityLimit} inputMode="decimal" onChange={setEnergyValue("liabilityLimit")} />
                    <FloatingField id="energy-totalSumInsured" label="إجمالي مبلغ التأمين" value={energyForm.totalSumInsured} error={energyErrors.totalSumInsured} required inputMode="decimal" onChange={setEnergyValue("totalSumInsured")} />
                    <FloatingField id="energy-currency" label="العملة" value={energyForm.currency} error={energyErrors.currency} required onChange={setEnergyValue("currency")} />
                    <FloatingField id="energy-coverageScope" label="نطاق التغطية" value={energyForm.coverageScope} error={energyErrors.coverageScope} required onChange={setEnergyValue("coverageScope")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>المخاطر والملاحظات</h2>
                  <div className="grid two">
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={energyForm.hasFireProtection} onChange={setEnergyValue("hasFireProtection")} />
                      <span>توجد أنظمة حماية من الحريق</span>
                    </label>
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={energyForm.hasMaintenancePlan} onChange={setEnergyValue("hasMaintenancePlan")} />
                      <span>توجد خطة صيانة دورية</span>
                    </label>
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={energyForm.previousLosses} onChange={setEnergyValue("previousLosses")} />
                      <span>توجد خسائر سابقة</span>
                    </label>
                    <FloatingField id="energy-riskDetails" label="تفاصيل المخاطر" value={energyForm.riskDetails} error={energyErrors.riskDetails} multiline rows={5} onChange={setEnergyValue("riskDetails")} />
                    <FloatingField id="energy-notes" label="ملاحظات" value={energyForm.notes} error={energyErrors.notes} multiline rows={5} onChange={setEnergyValue("notes")} />
                  </div>
                </motion.section>

                <motion.section className="panel review-panel" {...sectionAnimation}>
                  <h2>مراجعة الطلب</h2>
                  <div className="review-grid">
                    <span>العميل</span>
                    <strong>{energyForm.fullName || "-"}</strong>
                    <span>المشروع</span>
                    <strong>{energyForm.projectName || "-"}</strong>
                    <span>نوع الطاقة</span>
                    <strong>{energyForm.energyType || "-"}</strong>
                    <span>مبلغ التأمين</span>
                    <strong>{energyForm.totalSumInsured ? `${energyForm.totalSumInsured} ${energyForm.currency}` : "-"}</strong>
                  </div>
                  <label className={`confirm ${energyErrors.confirmed ? "field-error" : ""}`}>
                    <input type="checkbox" checked={energyForm.confirmed} onChange={setEnergyValue("confirmed")} />
                    <span>أؤكد صحة المعلومات وأوافق على إرسال طلب تأمين الطاقة إلى TRINSU.</span>
                  </label>
                  {energyErrors.confirmed ? <p className="error-text">{energyErrors.confirmed}</p> : null}
                  {energySubmitError ? <p id="energy-submit-error" className="submit-error" role="alert">{energySubmitError}</p> : null}
                  <button className="submit-button" type="submit" disabled={isEnergySubmitting}>
                    {isEnergySubmitting ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
                    {isEnergySubmitting ? "جاري الإرسال" : "إرسال طلب تأمين الطاقة"}
                  </button>
                </motion.section>

                {energyRequest ? (
                  <motion.section className="success-panel" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <CheckCircle2 size={42} aria-hidden="true" />
                    <h2>تم إرسال طلب تأمين الطاقة</h2>
                    <p>تم تسجيل الطلب في نظام TRINSU بنجاح.</p>
                    <div className="success-numbers">
                      <div>
                        <span>رقم الطلب</span>
                        <strong>{energyRequest.requestNumber}</strong>
                      </div>
                      <div>
                        <span>رقم التتبع</span>
                        <strong>{energyRequest.trackingNumber}</strong>
                      </div>
                    </div>
                    <div className="success-status">
                      <span>الحالة</span>
                      <strong>{energyRequest.status}</strong>
                    </div>
                    <div className="success-actions">
                      <button className="submit-button" type="button" onClick={() => openTrackingRequest(energyRequest.trackingNumber)}>
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
        {showTravelPage ? (
          <>
            <motion.section className="engineering-hero travel-hero" {...sectionAnimation}>
              <div>
                <span className="eyebrow">
                  <Plane size={18} aria-hidden="true" />
                  ØªØ£Ù…ÙŠÙ† Ø§Ù„Ø³ÙØ±
                </span>
                <h1>Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø³ÙØ±</h1>
                <p>Ø£Ø¯Ø®Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³Ø§ÙØ± ÙˆØ§Ù„ÙˆØ¬Ù‡Ø© ÙˆØªÙˆØ§Ø±ÙŠØ® Ø§Ù„Ø±Ø­Ù„Ø© ÙˆÙ†Ø·Ø§Ù‚ Ø§Ù„ØªØºØ·ÙŠØ© Ù„ÙŠØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨ ÙˆÙ…ØªØ§Ø¨Ø¹ØªÙ‡ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù†Ø¸Ø§Ù….</p>
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
                  <h2>Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ù…Ø³Ø§ÙØ±</h2>
                  <div className="grid three">
                    <FloatingField id="travel-fullName" label="Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„" value={travelForm.fullName} error={travelErrors.fullName} required onChange={setTravelValue("fullName")} />
                    <FloatingField id="travel-mobile" label="Ø±Ù‚Ù… Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„" value={travelForm.mobile} error={travelErrors.mobile} required inputMode="tel" onChange={setTravelValue("mobile")} />
                    <FloatingField id="travel-email" label="Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ" value={travelForm.email} error={travelErrors.email} type="email" onChange={setTravelValue("email")} />
                    <FloatingField id="travel-nationalId" label="Ø§Ù„Ø±Ù‚Ù… Ø§Ù„ÙˆØ·Ù†ÙŠ" value={travelForm.nationalId} error={travelErrors.nationalId} required onChange={setTravelValue("nationalId")} />
                    <FloatingField id="travel-passportNumber" label="Ø±Ù‚Ù… Ø§Ù„Ø¬ÙˆØ§Ø²" value={travelForm.passportNumber} error={travelErrors.passportNumber} required onChange={setTravelValue("passportNumber")} />
                    <FloatingField id="travel-dateOfBirth" label="ØªØ§Ø±ÙŠØ® Ø§Ù„Ù…ÙŠÙ„Ø§Ø¯" value={travelForm.dateOfBirth} error={travelErrors.dateOfBirth} required type="date" onChange={setTravelValue("dateOfBirth")} />
                    <FloatingField id="travel-city" label="Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©" value={travelForm.city} error={travelErrors.city} required onChange={setTravelValue("city")} />
                    <FloatingField id="travel-address" label="Ø§Ù„Ø¹Ù†ÙˆØ§Ù†" value={travelForm.address} error={travelErrors.address} onChange={setTravelValue("address")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø±Ø­Ù„Ø©</h2>
                  <div className="grid three">
                    <FloatingField id="travel-destinationCountry" label="Ø¨Ù„Ø¯ Ø§Ù„ÙˆØ¬Ù‡Ø©" value={travelForm.destinationCountry} error={travelErrors.destinationCountry} required onChange={setTravelValue("destinationCountry")} />
                    <FloatingField id="travel-departureDate" label="ØªØ§Ø±ÙŠØ® Ø§Ù„Ù…ØºØ§Ø¯Ø±Ø©" value={travelForm.departureDate} error={travelErrors.departureDate} required type="date" onChange={setTravelValue("departureDate")} />
                    <FloatingField id="travel-returnDate" label="ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¹ÙˆØ¯Ø©" value={travelForm.returnDate} error={travelErrors.returnDate} required type="date" onChange={setTravelValue("returnDate")} />
                    <FloatingField id="travel-travelersCount" label="Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ø³Ø§ÙØ±ÙŠÙ†" value={travelForm.travelersCount} error={travelErrors.travelersCount} required inputMode="numeric" onChange={setTravelValue("travelersCount")} />
                    <FloatingField id="travel-tripPurpose" label="ØºØ±Ø¶ Ø§Ù„Ø³ÙØ±" value={travelForm.tripPurpose} error={travelErrors.tripPurpose} required onChange={setTravelValue("tripPurpose")} />
                    <FloatingField id="travel-coverageType" label="Ù†ÙˆØ¹ Ø§Ù„ØªØºØ·ÙŠØ©" value={travelForm.coverageType} error={travelErrors.coverageType} required onChange={setTravelValue("coverageType")} />
                    <FloatingField id="travel-coverageScope" label="Ù†Ø·Ø§Ù‚ Ø§Ù„ØªØºØ·ÙŠØ©" value={travelForm.coverageScope} error={travelErrors.coverageScope} required onChange={setTravelValue("coverageScope")} />
                    <FloatingField id="travel-estimatedPremium" label="Ø§Ù„Ù‚Ø³Ø· Ø§Ù„Ù…ØªÙˆÙ‚Ø¹" value={travelForm.estimatedPremium} error={travelErrors.estimatedPremium} inputMode="decimal" onChange={setTravelValue("estimatedPremium")} />
                    <FloatingField id="travel-currency" label="Ø§Ù„Ø¹Ù…Ù„Ø©" value={travelForm.currency} error={travelErrors.currency} required onChange={setTravelValue("currency")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>Ø§Ù„ØµØ­Ø© ÙˆØ§Ù„Ø·ÙˆØ§Ø±Ø¦</h2>
                  <div className="grid two">
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={travelForm.hasMedicalConditions} onChange={setTravelValue("hasMedicalConditions")} />
                      <span>ØªÙˆØ¬Ø¯ Ø­Ø§Ù„Ø§Øª Ø·Ø¨ÙŠØ© Ø£Ùˆ Ø£Ù…Ø±Ø§Ø¶ Ù…Ø²Ù…Ù†Ø©</span>
                    </label>
                    <FloatingField id="travel-emergencyContactName" label="Ø§Ø³Ù… Ø¬Ù‡Ø© Ø§Ù„Ø·ÙˆØ§Ø±Ø¦" value={travelForm.emergencyContactName} error={travelErrors.emergencyContactName} onChange={setTravelValue("emergencyContactName")} />
                    <FloatingField id="travel-emergencyContactPhone" label="Ù‡Ø§ØªÙ Ø¬Ù‡Ø© Ø§Ù„Ø·ÙˆØ§Ø±Ø¦" value={travelForm.emergencyContactPhone} error={travelErrors.emergencyContactPhone} inputMode="tel" onChange={setTravelValue("emergencyContactPhone")} />
                    <FloatingField id="travel-medicalConditions" label="ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø­Ø§Ù„Ø§Øª Ø§Ù„Ø·Ø¨ÙŠØ©" value={travelForm.medicalConditions} error={travelErrors.medicalConditions} multiline rows={5} onChange={setTravelValue("medicalConditions")} />
                    <FloatingField id="travel-notes" label="Ù…Ù„Ø§Ø­Ø¸Ø§Øª" value={travelForm.notes} error={travelErrors.notes} multiline rows={5} onChange={setTravelValue("notes")} />
                  </div>
                </motion.section>

                <motion.section className="panel review-panel" {...sectionAnimation}>
                  <h2>Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø·Ù„Ø¨</h2>
                  <div className="review-grid">
                    <span>Ø§Ù„Ù…Ø³Ø§ÙØ±</span>
                    <strong>{travelForm.fullName || "-"}</strong>
                    <span>Ø§Ù„ÙˆØ¬Ù‡Ø©</span>
                    <strong>{travelForm.destinationCountry || "-"}</strong>
                    <span>Ù…Ø¯Ø© Ø§Ù„Ø±Ø­Ù„Ø©</span>
                    <strong>{[travelForm.departureDate, travelForm.returnDate].filter(Boolean).join(" - ") || "-"}</strong>
                    <span>Ù†ÙˆØ¹ Ø§Ù„ØªØºØ·ÙŠØ©</span>
                    <strong>{travelForm.coverageType || "-"}</strong>
                  </div>
                  <label className={`confirm ${travelErrors.confirmed ? "field-error" : ""}`}>
                    <input type="checkbox" checked={travelForm.confirmed} onChange={setTravelValue("confirmed")} />
                    <span>Ø£Ø¤ÙƒØ¯ ØµØ­Ø© Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ÙˆØ£ÙˆØ§ÙÙ‚ Ø¹Ù„Ù‰ Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø§Ù„Ø³ÙØ± Ø¥Ù„Ù‰ TRINSU.</span>
                  </label>
                  {travelErrors.confirmed ? <p className="error-text">{travelErrors.confirmed}</p> : null}
                  {travelSubmitError ? <p id="travel-submit-error" className="submit-error" role="alert">{travelSubmitError}</p> : null}
                  <button className="submit-button" type="submit" disabled={isTravelSubmitting}>
                    {isTravelSubmitting ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
                    {isTravelSubmitting ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„" : "Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø§Ù„Ø³ÙØ±"}
                  </button>
                </motion.section>

                {travelRequest ? (
                  <motion.section className="success-panel" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <CheckCircle2 size={42} aria-hidden="true" />
                    <h2>ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø§Ù„Ø³ÙØ±</h2>
                    <p>ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨ ÙÙŠ Ù†Ø¸Ø§Ù… TRINSU Ø¨Ù†Ø¬Ø§Ø­.</p>
                    <div className="success-numbers">
                      <div>
                        <span>Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨</span>
                        <strong>{travelRequest.requestNumber}</strong>
                      </div>
                      <div>
                        <span>Ø±Ù‚Ù… Ø§Ù„ØªØªØ¨Ø¹</span>
                        <strong>{travelRequest.trackingNumber}</strong>
                      </div>
                    </div>
                    <div className="success-status">
                      <span>Ø§Ù„Ø­Ø§Ù„Ø©</span>
                      <strong>{travelRequest.status}</strong>
                    </div>
                    <div className="success-actions">
                      <button className="submit-button" type="button" onClick={() => openTrackingRequest(travelRequest.trackingNumber)}>
                        <MapPinned size={18} aria-hidden="true" />
                        ØªØªØ¨Ø¹ Ø§Ù„Ø·Ù„Ø¨
                      </button>
                    </div>
                  </motion.section>
                ) : null}
              </fieldset>
            </form>
          </>
        ) : null}

        {showTransportPage ? (
          <>
            <motion.section className="engineering-hero" {...sectionAnimation}>
              <div>
                <span className="eyebrow">
                  <Truck size={18} aria-hidden="true" />
                  ØªØ£Ù…ÙŠÙ† Ø§Ù„Ù†Ù‚Ù„
                </span>
                <h1>Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ù†Ù‚Ù„</h1>
                <p>Ø£Ø¯Ø®Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„ ÙˆØ§Ù„Ø´Ø­Ù†Ø© ÙˆÙ…Ø³Ø§Ø± Ø§Ù„Ù†Ù‚Ù„ ÙˆÙ†Ø·Ø§Ù‚ Ø§Ù„ØªØºØ·ÙŠØ© Ù„ÙŠØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨ ÙˆÙ…ØªØ§Ø¨Ø¹ØªÙ‡ Ø¯Ø§Ø®Ù„ Ù†Ø¸Ø§Ù… TRINSU.</p>
              </div>
              <div className="engineering-metrics" aria-hidden="true">
                <span>TRN</span>
                <strong>Transport Insurance</strong>
                <small>Cargo transit request</small>
              </div>
            </motion.section>

            <form id="transport-request-form" className="request-form" onSubmit={submitTransport} noValidate>
              <fieldset className="form-fieldset" disabled={isTransportSubmitting}>
                <motion.section className="panel" {...sectionAnimation}>
                  <h2>Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„</h2>
                  <div className="grid three">
                    <FloatingField id="transport-fullName" label="Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„" value={transportForm.fullName} error={transportErrors.fullName} required onChange={setTransportValue("fullName")} />
                    <FloatingField id="transport-mobile" label="Ø±Ù‚Ù… Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„" value={transportForm.mobile} error={transportErrors.mobile} required inputMode="tel" onChange={setTransportValue("mobile")} />
                    <FloatingField id="transport-email" label="Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ" value={transportForm.email} error={transportErrors.email} type="email" onChange={setTransportValue("email")} />
                    <FloatingField id="transport-nationalId" label="Ø§Ù„Ø±Ù‚Ù… Ø§Ù„ÙˆØ·Ù†ÙŠ" value={transportForm.nationalId} error={transportErrors.nationalId} required onChange={setTransportValue("nationalId")} />
                    <FloatingField id="transport-city" label="Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©" value={transportForm.city} error={transportErrors.city} required onChange={setTransportValue("city")} />
                    <FloatingField id="transport-address" label="Ø§Ù„Ø¹Ù†ÙˆØ§Ù†" value={transportForm.address} error={transportErrors.address} onChange={setTransportValue("address")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø´Ø­Ù†Ø©</h2>
                  <div className="grid three">
                    <label className="floating-field">
                      <select id="transport-transportMode" value={transportForm.transportMode} onChange={setTransportValue("transportMode")} required>
                        <option value="SEA">SEA</option>
                        <option value="AIR">AIR</option>
                        <option value="LAND">LAND</option>
                      </select>
                      <span>Ù†ÙˆØ¹ Ø§Ù„Ù†Ù‚Ù„</span>
                    </label>
                    <FloatingField id="transport-cargoDescription" label="ÙˆØµÙ Ø§Ù„Ø´Ø­Ù†Ø©" value={transportForm.cargoDescription} error={transportErrors.cargoDescription} required onChange={setTransportValue("cargoDescription")} />
                    <FloatingField id="transport-cargoValue" label="Ù‚ÙŠÙ…Ø© Ø§Ù„Ø´Ø­Ù†Ø©" value={transportForm.cargoValue} error={transportErrors.cargoValue} required inputMode="decimal" onChange={setTransportValue("cargoValue")} />
                    <FloatingField id="transport-currency" label="Ø§Ù„Ø¹Ù…Ù„Ø©" value={transportForm.currency} error={transportErrors.currency} required onChange={setTransportValue("currency")} />
                    <FloatingField id="transport-packingType" label="Ù†ÙˆØ¹ Ø§Ù„ØªØºÙ„ÙŠÙ" value={transportForm.packingType} error={transportErrors.packingType} onChange={setTransportValue("packingType")} />
                    <FloatingField id="transport-coverageScope" label="Ù†Ø·Ø§Ù‚ Ø§Ù„ØªØºØ·ÙŠØ©" value={transportForm.coverageScope} error={transportErrors.coverageScope} required onChange={setTransportValue("coverageScope")} />
                    <FloatingField id="transport-estimatedPremium" label="Ø§Ù„Ù‚Ø³Ø· Ø§Ù„Ù…ØªÙˆÙ‚Ø¹" value={transportForm.estimatedPremium} error={transportErrors.estimatedPremium} inputMode="decimal" onChange={setTransportValue("estimatedPremium")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>Ù…Ø³Ø§Ø± Ø§Ù„Ù†Ù‚Ù„</h2>
                  <div className="grid three">
                    <FloatingField id="transport-originCountry" label="Ø¨Ù„Ø¯ Ø§Ù„Ø§Ù†Ø·Ù„Ø§Ù‚" value={transportForm.originCountry} error={transportErrors.originCountry} required onChange={setTransportValue("originCountry")} />
                    <FloatingField id="transport-originCity" label="Ù…Ø¯ÙŠÙ†Ø© Ø§Ù„Ø§Ù†Ø·Ù„Ø§Ù‚" value={transportForm.originCity} error={transportErrors.originCity} required onChange={setTransportValue("originCity")} />
                    <FloatingField id="transport-destinationCountry" label="Ø¨Ù„Ø¯ Ø§Ù„ÙˆØµÙˆÙ„" value={transportForm.destinationCountry} error={transportErrors.destinationCountry} required onChange={setTransportValue("destinationCountry")} />
                    <FloatingField id="transport-destinationCity" label="Ù…Ø¯ÙŠÙ†Ø© Ø§Ù„ÙˆØµÙˆÙ„" value={transportForm.destinationCity} error={transportErrors.destinationCity} required onChange={setTransportValue("destinationCity")} />
                    <FloatingField id="transport-departureDate" label="ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ù†Ø·Ù„Ø§Ù‚" value={transportForm.departureDate} error={transportErrors.departureDate} required type="date" onChange={setTransportValue("departureDate")} />
                    <FloatingField id="transport-arrivalDate" label="ØªØ§Ø±ÙŠØ® Ø§Ù„ÙˆØµÙˆÙ„" value={transportForm.arrivalDate} error={transportErrors.arrivalDate} type="date" onChange={setTransportValue("arrivalDate")} />
                    <FloatingField id="transport-carrierName" label="Ø§Ø³Ù… Ø§Ù„Ù†Ø§Ù‚Ù„" value={transportForm.carrierName} error={transportErrors.carrierName} onChange={setTransportValue("carrierName")} />
                    <FloatingField id="transport-vesselOrFlightNumber" label="Ø±Ù‚Ù… Ø§Ù„Ø³ÙÙŠÙ†Ø©/Ø§Ù„Ø±Ø­Ù„Ø©" value={transportForm.vesselOrFlightNumber} error={transportErrors.vesselOrFlightNumber} onChange={setTransportValue("vesselOrFlightNumber")} />
                    <FloatingField id="transport-vehicleOrContainerNo" label="Ø±Ù‚Ù… Ø§Ù„Ù…Ø±ÙƒØ¨Ø©/Ø§Ù„Ø­Ø§ÙˆÙŠØ©" value={transportForm.vehicleOrContainerNo} error={transportErrors.vehicleOrContainerNo} onChange={setTransportValue("vehicleOrContainerNo")} />
                  </div>
                </motion.section>

                <motion.section className="panel" {...sectionAnimation}>
                  <h2>Ø§Ù„Ù…Ø®Ø§Ø·Ø± ÙˆØ§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª</h2>
                  <div className="grid two">
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={transportForm.hasWarRisk} onChange={setTransportValue("hasWarRisk")} />
                      <span>Ø¥Ø¶Ø§ÙØ© Ø®Ø·Ø± Ø§Ù„Ø­Ø±Ø¨</span>
                    </label>
                    <label className="confirm compact-confirm">
                      <input type="checkbox" checked={transportForm.hasStrikeRisk} onChange={setTransportValue("hasStrikeRisk")} />
                      <span>Ø¥Ø¶Ø§ÙØ© Ø®Ø·Ø± Ø§Ù„Ø¥Ø¶Ø±Ø§Ø¨Ø§Øª</span>
                    </label>
                    <FloatingField id="transport-notes" label="Ù…Ù„Ø§Ø­Ø¸Ø§Øª" value={transportForm.notes} error={transportErrors.notes} multiline rows={5} onChange={setTransportValue("notes")} />
                  </div>
                </motion.section>

                <motion.section className="panel review-panel" {...sectionAnimation}>
                  <h2>Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø·Ù„Ø¨</h2>
                  <div className="review-grid">
                    <span>Ø§Ù„Ø¹Ù…ÙŠÙ„</span>
                    <strong>{transportForm.fullName || "-"}</strong>
                    <span>Ø§Ù„Ø´Ø­Ù†Ø©</span>
                    <strong>{transportForm.cargoDescription || "-"}</strong>
                    <span>Ø§Ù„Ù…Ø³Ø§Ø±</span>
                    <strong>{[transportForm.originCity, transportForm.destinationCity].filter(Boolean).join(" - ") || "-"}</strong>
                    <span>Ù†ÙˆØ¹ Ø§Ù„Ù†Ù‚Ù„</span>
                    <strong>{transportForm.transportMode || "-"}</strong>
                  </div>
                  <label className={`confirm ${transportErrors.confirmed ? "field-error" : ""}`}>
                    <input type="checkbox" checked={transportForm.confirmed} onChange={setTransportValue("confirmed")} />
                    <span>Ø£Ø¤ÙƒØ¯ ØµØ­Ø© Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ÙˆØ£ÙˆØ§ÙÙ‚ Ø¹Ù„Ù‰ Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø§Ù„Ù†Ù‚Ù„ Ø¥Ù„Ù‰ TRINSU.</span>
                  </label>
                  {transportErrors.confirmed ? <p className="error-text">{transportErrors.confirmed}</p> : null}
                  {transportSubmitError ? <p id="transport-submit-error" className="submit-error" role="alert">{transportSubmitError}</p> : null}
                  <button className="submit-button" type="submit" disabled={isTransportSubmitting}>
                    {isTransportSubmitting ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
                    {isTransportSubmitting ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„" : "Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø§Ù„Ù†Ù‚Ù„"}
                  </button>
                </motion.section>

                {transportRequest ? (
                  <motion.section className="success-panel" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <CheckCircle2 size={42} aria-hidden="true" />
                    <h2>ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø§Ù„Ù†Ù‚Ù„</h2>
                    <p>ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨ ÙÙŠ Ù†Ø¸Ø§Ù… TRINSU Ø¨Ù†Ø¬Ø§Ø­.</p>
                    <div className="success-numbers">
                      <div>
                        <span>Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨</span>
                        <strong>{transportRequest.requestNumber}</strong>
                      </div>
                      <div>
                        <span>Ø±Ù‚Ù… Ø§Ù„ØªØªØ¨Ø¹</span>
                        <strong>{transportRequest.trackingNumber}</strong>
                      </div>
                    </div>
                    <div className="success-status">
                      <span>Ø§Ù„Ø­Ø§Ù„Ø©</span>
                      <strong>{transportRequest.status}</strong>
                    </div>
                    <div className="success-actions">
                      <button className="submit-button" type="button" onClick={() => openTrackingRequest(transportRequest.trackingNumber)}>
                        <MapPinned size={18} aria-hidden="true" />
                        ØªØªØ¨Ø¹ Ø§Ù„Ø·Ù„Ø¨
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
            Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø§Ù„Ù…Ø±ÙƒØ¨Ø§Øª
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
            <aside className="fallback-card" aria-label="Ø±Ø§Ø¨Ø· Ø¨Ø¯ÙŠÙ„ Ù„ØªÙ‚Ø¯ÙŠÙ… Ø·Ù„Ø¨ ØªØ£Ù…ÙŠÙ† Ø§Ù„Ù…Ø±ÙƒØ¨Ø§Øª">
              <span className="fallback-icon">
                <Info size={20} aria-hidden="true" />
              </span>
              <div className="fallback-content">
                <p>ÙÙŠ Ø­Ø§Ù„ ØªØ¹Ø°Ø± Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„ØªØ£Ù…ÙŠÙ† Ø¹Ø¨Ø± Ù‡Ø°Ù‡ Ø§Ù„ØµÙØ­Ø©ØŒ ÙŠÙ…ÙƒÙ†Ùƒ ØªÙ‚Ø¯ÙŠÙ… Ø§Ù„Ø·Ù„Ø¨ Ù…Ù† Ø®Ù„Ø§Ù„ Ø§Ù„Ø±Ø§Ø¨Ø· Ø§Ù„ØªØ§Ù„ÙŠ:</p>
                <a className="fallback-link" href={fallbackFormUrl} target="_blank" rel="noopener noreferrer">
                  Ø·Ù„Ø¨Ø§Øª ØªØ£Ù…ÙŠÙ† Ø§Ù„Ù…Ø±ÙƒØ¨Ø§Øª
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
                  {copiedRequestNumber ? (language === "ar" ? "ØªÙ… Ø§Ù„Ù†Ø³Ø®" : "Copied") : language === "ar" ? "Ù†Ø³Ø® Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨" : "Copy request number"}
                </button>
                <button className="submit-button" type="button" onClick={downloadRequestPdf}>
                  <Download size={18} aria-hidden="true" />
                  {language === "ar" ? "ØªÙ†Ø²ÙŠÙ„ Ø§Ù„Ø§Ø³ØªÙ…Ø§Ø±Ø© PDF" : "Download PDF form"}
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





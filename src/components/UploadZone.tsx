import { ImagePlus, Replace, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import type { UploadFile } from "../types";

const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const maxFileSize = 10 * 1024 * 1024;
const uploadTargetSize = 320 * 1024;
const uploadMaxDimension = 1400;

type UploadZoneProps = {
  title: string;
  hint: string;
  rule?: string;
  files: UploadFile[];
  onChange: (files: UploadFile[]) => void;
  multiple?: boolean;
  error?: string;
  labels: {
    replace: string;
    remove: string;
    selectFile: string;
    fileType: string;
    fileSize: string;
  };
};

const createUploadFile = (file: File): UploadFile => ({
  id: crypto.randomUUID(),
  file,
  url: URL.createObjectURL(file),
});

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
  });

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image."));
    };
    image.src = url;
  });

const compressImage = async (file: File) => {
  const image = await loadImage(file);
  const scale = Math.min(1, uploadMaxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) return file;

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  let bestBlob: Blob | null = null;

  for (const quality of [0.72, 0.62, 0.52, 0.44, 0.36]) {
    const blob = await canvasToBlob(canvas, quality);
    if (!blob) continue;
    bestBlob = blob;
    if (blob.size <= uploadTargetSize) break;
  }

  if (!bestBlob) return file;

  const cleanName = file.name.replace(/\.[^.]+$/, "");
  return new File([bestBlob], `${cleanName}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
};

export function UploadZone({ title, hint, rule, files, onChange, multiple = true, error, labels }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const validate = (file: File) => {
    if (!allowedTypes.includes(file.type)) return labels.fileType;
    if (file.size > maxFileSize) return labels.fileSize;
    return null;
  };

  const addFiles = async (selected: FileList | null) => {
    if (!selected?.length) return;
    const next: UploadFile[] = [];
    setIsProcessing(true);

    try {
      for (const file of Array.from(selected)) {
        const invalid = validate(file);
        if (invalid) {
          setLocalError(invalid);
          return;
        }
        next.push(createUploadFile(await compressImage(file)));
      }

      setLocalError(null);
      onChange(multiple ? [...files, ...next] : [next[0]]);
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const replaceFile = async (selected: FileList | null) => {
    if (!selected?.length || !replaceId) return;
    const invalid = validate(selected[0]);
    if (invalid) {
      setLocalError(invalid);
      return;
    }
    setIsProcessing(true);
    try {
      setLocalError(null);
      const compressed = await compressImage(selected[0]);
      onChange(files.map((item) => (item.id === replaceId ? createUploadFile(compressed) : item)));
      setReplaceId(null);
    } finally {
      setIsProcessing(false);
      if (replaceRef.current) replaceRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    onChange(files.filter((item) => item.id !== id));
  };

  return (
    <div className={`upload-group ${error || localError ? "upload-error" : ""}`}>
      <div
        className="upload-drop"
        role="button"
        tabIndex={isProcessing ? -1 : 0}
        aria-busy={isProcessing}
        onClick={() => {
          if (!isProcessing) inputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (!isProcessing && (event.key === "Enter" || event.key === " ")) inputRef.current?.click();
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (!isProcessing) void addFiles(event.dataTransfer.files);
        }}
      >
        <UploadCloud aria-hidden="true" />
        <div>
          <strong>{title}</strong>
          <span>{hint}</span>
          {rule ? <small>{rule}</small> : null}
        </div>
        <button className="ghost-button" type="button" disabled={isProcessing}>
          <ImagePlus size={18} aria-hidden="true" />
          {labels.selectFile}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple={multiple}
          onChange={(event) => void addFiles(event.target.files)}
        />
      </div>

      {(error || localError) && <p className="error-text">{localError ?? error}</p>}

      {files.length > 0 ? (
        <div className="preview-grid">
          {files.map((item) => (
            <article className="preview-card" key={item.id}>
              <img src={item.url} alt={item.file.name} />
              <div className="preview-meta">
                <span>{item.file.name}</span>
                <div>
                  <button
                    type="button"
                    aria-label={labels.replace}
                    title={labels.replace}
                    disabled={isProcessing}
                    onClick={() => {
                      setReplaceId(item.id);
                      replaceRef.current?.click();
                    }}
                  >
                    <Replace size={16} aria-hidden="true" />
                  </button>
                  <button type="button" aria-label={labels.remove} title={labels.remove} disabled={isProcessing} onClick={() => removeFile(item.id)}>
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <input
        ref={replaceRef}
        className="hidden-input"
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={(event) => void replaceFile(event.target.files)}
      />
    </div>
  );
}

import type { DocumentKey, UploadFile } from "../types";
import { UploadZone } from "./UploadZone";

type DocumentUploadProps = {
  documentKey: DocumentKey;
  label: string;
  file?: UploadFile;
  onChange: (key: DocumentKey, file?: UploadFile) => void;
  hint: string;
  labels: {
    replace: string;
    remove: string;
    selectFile: string;
    fileType: string;
    fileSize: string;
  };
};

export function DocumentUpload({ documentKey, label, file, onChange, hint, labels }: DocumentUploadProps) {
  return (
    <UploadZone
      title={label}
      hint={hint}
      files={file ? [file] : []}
      multiple={false}
      labels={labels}
      onChange={(files) => onChange(documentKey, files[0])}
    />
  );
}

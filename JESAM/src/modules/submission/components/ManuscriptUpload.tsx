import { Upload, FileText, AlertCircle } from "lucide-react";
import { useSubmissionWizard } from "../context/SubmissionWizardContext";

export function ManuscriptUpload() {
  const { manuscriptFile, setManuscriptFile, setChecks } = useSubmissionWizard();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setManuscriptFile(file);
    setChecks({
      formatting: { status: "pending", message: "" },
      assets: { status: "pending", message: "" },
      plagiarism: { status: "pending", message: "" },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Manuscript Upload</h2>
        <p className="text-gray-600">
          Upload your manuscript file. Editorial screening starts after submission; automated
          similarity and format checks are handled later by the Production Editor.
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={handleFileUpload}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          {manuscriptFile ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-900">
                <FileText className="w-4 h-4" />
                <span>{manuscriptFile.name}</span>
              </div>
              <p className="text-xs text-gray-500">
                {(manuscriptFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("file-upload")?.click();
                }}
              >
                Upload different file
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Click to upload manuscript</p>
              <p className="text-xs text-gray-500">PDF, DOC, or DOCX (Max 50MB)</p>
            </div>
          )}
        </label>
      </div>

      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Checks happen after screening</p>
          <p>
            You can submit as soon as the file is uploaded and declarations are complete.
          </p>
        </div>
      </div>
    </div>
  );
}

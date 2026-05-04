import { Plus, X, User, Mail, Building2 } from "lucide-react";
import type { Author } from "../types";
import { useSubmissionWizard } from "../context/SubmissionWizardContext";

export function AuthorInformation() {
  const { authors, setAuthors } = useSubmissionWizard();

  const addAuthor = () => {
    const newAuthor: Author = {
      id: Date.now().toString(),
      name: "",
      email: "",
      orcid: "",
      affiliation: "",
      isCorresponding: false,
    };
    setAuthors((prev) => [...prev, newAuthor]);
  };

  const removeAuthor = (id: string) => {
    setAuthors((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((author) => author.id !== id);
      if (!next.some((a) => a.isCorresponding) && next[0]) {
        next[0] = { ...next[0], isCorresponding: true };
      }
      return next;
    });
  };

  const updateAuthor = (id: string, field: keyof Author, value: string | boolean) => {
    setAuthors((prev) =>
      prev.map((author) => (author.id === id ? { ...author, [field]: value } : author))
    );
  };

  const setCorrespondingAuthor = (id: string) => {
    setAuthors((prev) =>
      prev.map((author) => ({
        ...author,
        isCorresponding: author.id === id,
      }))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Author Information</h2>
        <p className="text-gray-600">
          Provide complete information for all authors. ORCID iDs are required for transparency and proper attribution.
        </p>
      </div>

      <div className="space-y-6">
        {authors.map((author, index) => (
          <div
            key={author.id}
            className="p-6 border-2 border-gray-200 rounded-lg bg-gray-50 relative"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {author.isCorresponding ? "Corresponding Author" : `Co-Author ${index}`}
                  </h3>
                  <p className="text-sm text-gray-500">Author #{index + 1}</p>
                </div>
              </div>
              {authors.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAuthor(author.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={author.name}
                  onChange={(e) => updateAuthor(author.id, "name", e.target.value)}
                  placeholder="e.g., Dr. Jane Smith"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={author.email}
                    onChange={(e) => updateAuthor(author.id, "email", e.target.value)}
                    placeholder="jane.smith@university.edu"
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ORCID iD <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={author.orcid}
                  onChange={(e) => updateAuthor(author.id, "orcid", e.target.value)}
                  placeholder="0000-0000-0000-0000"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-shadow"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Don&apos;t have an ORCID?{" "}
                  <a
                    href="https://orcid.org/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Register here
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Affiliation <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={author.affiliation}
                    onChange={(e) => updateAuthor(author.id, "affiliation", e.target.value)}
                    placeholder="Department, Institution, City, Country"
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-shadow"
                  />
                </div>
              </div>

              {!author.isCorresponding && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setCorrespondingAuthor(author.id)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    Set as corresponding author
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addAuthor}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors font-medium"
      >
        <Plus className="w-5 h-5" />
        Add Co-Author
      </button>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h4 className="font-medium text-amber-900 mb-2">Important Notes:</h4>
        <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
          <li>All authors must have a valid ORCID iD</li>
          <li>The corresponding author will receive all editorial communications</li>
          <li>Author order reflects contribution level (first author = primary contributor)</li>
          <li>Affiliations should include full institutional details</li>
        </ul>
      </div>
    </div>
  );
}

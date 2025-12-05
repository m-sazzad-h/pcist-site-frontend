// src/pages/Admin-Panel/PadGeneration.jsx
import React, { useState } from "react";
import axios from "axios";
import { ClipLoader } from "react-spinners";
import { FiUpload, FiDownload, FiPlusCircle, FiTrash2 } from "react-icons/fi";
import { motion } from "framer-motion";

const PadGeneration = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [authorizers, setAuthorizers] = useState([{ name: "", role: "" }]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const url = import.meta.env.VITE_BACKEND_URL;
  const slug = localStorage.getItem("slug");
  const token = localStorage.getItem("token");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setMessage({ type: "", text: "" });
    } else {
      setPdfFile(null);
      setMessage({ type: "error", text: "Please select a valid PDF file" });
    }
  };

  const handleAuthorizerChange = (index, field, value) => {
    const updated = [...authorizers];
    updated[index][field] = value;
    setAuthorizers(updated);
  };

  const addAuthorizer = () => {
    if (authorizers.length < 3) {
      setAuthorizers([...authorizers, { name: "", role: "" }]);
    }
  };

  const removeAuthorizer = (index) => {
    if (authorizers.length > 1) {
      setAuthorizers(authorizers.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!pdfFile) {
      setMessage({ type: "error", text: "Please upload a PDF file" });
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("slug", slug);
      formData.append("statementPdf", pdfFile);

      // Add authorizers (filter out empty ones)
      const validAuthorizers = authorizers.filter(
        (auth) => auth.name.trim() || auth.role.trim()
      );
      if (validAuthorizers.length > 0) {
        formData.append("authorizers", JSON.stringify(validAuthorizers));
      }

      if (contactEmail) formData.append("contactEmail", contactEmail);
      if (contactPhone) formData.append("contactPhone", contactPhone);
      if (address) formData.append("address", address);

      const res = await axios.post(`${url}/user/pad/download`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob",
      });

      // Create download link
      const blob = new Blob([res.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      // Extract filename from response headers or use default
      const contentDisposition = res.headers["content-disposition"];
      let filename = "pcIST-PAD.pdf";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setMessage({
        type: "success",
        text: "PAD generated and downloaded successfully!",
      });

      // Reset form
      setPdfFile(null);
      setAuthorizers([{ name: "", role: "" }]);
      setContactEmail("");
      setContactPhone("");
      setAddress("");
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Failed to generate PAD. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow mt-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold">
          Academic PAD Generation
        </h2>
        <p className="text-sm text-black mt-1">
          Upload your PDF statement to generate an official pcIST PAD
        </p>
      </div>

      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3 rounded ${message.type === "success"
            ? "bg-green-50 text-green-800"
            : "bg-red-50 text-red-700"
            }`}
        >
          {message.text}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* PDF Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statement PDF <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-3">
            <label className="flex-1 cursor-pointer">
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition ${pdfFile
                  ? "border-green-400 bg-green-50"
                  : "border-gray-300 hover:border-orange-400"
                  }`}
              >
                <FiUpload className="mx-auto text-2xl text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {pdfFile ? (
                    <span className="text-green-600 font-medium">
                      {pdfFile.name}
                    </span>
                  ) : (
                    "Click to upload PDF"
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF files only, max 10MB
                </p>
              </div>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                required
              />
            </label>
          </div>
        </div>

        {/* Authorizers */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Authorizers (Optional, max 3)
            </label>
            {authorizers.length < 3 && (
              <button
                type="button"
                onClick={addAuthorizer}
                className="text-xs inline-flex items-center gap-1 px-2 py-1 bg-green-50 border rounded hover:bg-green-100"
              >
                <FiPlusCircle /> Add
              </button>
            )}
          </div>

          <div className="space-y-2">
            {authorizers.map((auth, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-center p-3"
              >
                <div className="col-span-12 sm:col-span-5">
                  <input
                    type="text"
                    value={auth.name}
                    onChange={(e) =>
                      handleAuthorizerChange(idx, "name", e.target.value)
                    }
                    placeholder="Name"
                    className="w-full border rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div className="col-span-10 sm:col-span-6">
                  <input
                    type="text"
                    value={auth.role}
                    onChange={(e) =>
                      handleAuthorizerChange(idx, "role", e.target.value)
                    }
                    placeholder="Role/Designation"
                    className="w-full border rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 flex justify-end">
                  {authorizers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAuthorizer(idx)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      aria-label="Remove authorizer"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Contact Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@example.com"
              className="mt-1 w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Contact Phone
            </label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+880 123-456-7890"
              className="mt-1 w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="text-sm font-medium text-gray-700">Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Institute of Science & Technology (IST), Dhaka"
            rows="2"
            className="mt-1 w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <ClipLoader size={16} color="#fff" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FiDownload />
                <span>Generate & Download PAD</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PadGeneration;
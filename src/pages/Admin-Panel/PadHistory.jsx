// src/components/admin/PadHistory.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { ClipLoader } from "react-spinners";
import { FiRefreshCcw, FiSearch, FiDownload, FiEye } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const dateFmt = (iso) => {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const PadHistory = () => {
  const [pads, setPads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const url = import.meta.env.VITE_BACKEND_URL;
  const slug = localStorage.getItem("slug");
  const token = localStorage.getItem("token");

  const fetchPads = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${url}/user/pad/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-slug": slug,
          "x-slug": slug,
        },
        params: {
          slug,
        },
      });
      setPads(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Unable to load pad history. Please check console or try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPads = useMemo(() => {
    if (!search.trim()) return pads;
    const q = search.toLowerCase();
    return pads.filter((p) => {
      const subject = (p.subject || "").toLowerCase();
      const receiver = (p.receiverEmail || "").toLowerCase();
      const serial = (p.serial || "").toLowerCase();
      return subject.includes(q) || receiver.includes(q) || serial.includes(q);
    });
  }, [pads, search]);

  const openDetails = (pad) => {
    setSelected(pad);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelected(null);
  };

  // Export currently visible (filtered) pads for convenience
  const exportCSV = () => {
    const list = filteredPads.length ? filteredPads : pads;
    if (!list.length) return;
    const headers = [
      "Serial",
      "Subject",
      "Receiver Email",
      "Authorizers",
      "Contact Email",
      "Contact Phone",
      "Address",
      "Sent",
      "SentAt",
      "DownloadedAt",
      "CreatedAt",
      "UpdatedAt",
    ];
    const rows = list.map((p) => [
      p.serial || "",
      (p.subject || "").replaceAll('"', '""'),
      p.receiverEmail || "",
      (p.authorizers || [])
        .map((a) => `${a.name} (${a.role})`)
        .join("; ")
        .replaceAll('"', '""'),
      p.contactEmail || "",
      p.contactPhone || "",
      p.address || "",
      p.sent ? "Yes" : "No",
      p.sentAt || "",
      p.downloadedAt || "",
      p.createdAt || "",
      p.updatedAt || "",
    ]);
    const csvContent =
      [headers, ...rows]
        .map((r) => r.map((c) => `"${c}"`).join(","))
        .join("\n") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `pad_history_${new Date().toISOString()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // small helper to render truncated statement safely
  const shortStatement = (s, n = 80) =>
    !s ? "" : s.length > n ? `${s.slice(0, n)}...` : s;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow mt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-lg sm:text-xl font-semibold">PAD History</h3>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by subject, receiver or serial..."
              className="pl-9 pr-3 py-2 border rounded w-full sm:w-72 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              aria-label="Search pads"
            />
            <FiSearch className="absolute left-2 top-2.5 text-gray-400" />
          </div>

          <button
            onClick={fetchPads}
            className="flex items-center gap-2 px-3 py-2 border rounded text-sm hover:bg-gray-50"
            title="Refresh"
            aria-label="Refresh"
          >
            <FiRefreshCcw />
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
            title="Export CSV"
            aria-label="Export CSV"
          >
            <FiDownload />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {loading ? (
        <div className="w-full flex justify-center items-center py-12">
          <ClipLoader size={36} />
        </div>
      ) : error ? (
        <div className="text-red-600 bg-red-50 p-3 rounded">{error}</div>
      ) : (
        <>
          {/* Desktop/Table view (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="py-2 px-3 border-b">Serial</th>
                  <th className="py-2 px-3 border-b">Subject</th>
                  <th className="py-2 px-3 border-b">Receiver</th>
                  <th className="py-2 px-3 border-b">Authorizers</th>
                  <th className="py-2 px-3 border-b">Contact</th>
                  <th className="py-2 px-3 border-b">Sent</th>
                  <th className="py-2 px-3 border-b">Sent At</th>
                  <th className="py-2 px-3 border-b">Downloaded</th>
                  <th className="py-2 px-3 border-b">Created</th>
                  <th className="py-2 px-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {filteredPads.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-6 text-center text-gray-500">
                      No PAD records found.
                    </td>
                  </tr>
                ) : (
                  filteredPads.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 align-top">
                      <td className="py-3 px-3 border-b align-top">
                        <div className="text-sm font-medium">
                          {p.serial || "-"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {p.dateStr || ""}
                        </div>
                      </td>

                      <td className="py-3 px-3 border-b w-64">
                        <div className="truncate" title={p.subject}>
                          {p.subject}
                        </div>
                        {p.statement && (
                          <div className="text-xs text-gray-400 mt-1">
                            {shortStatement(p.statement)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 border-b">
                        {p.receiverEmail || "-"}
                      </td>

                      <td className="py-3 px-3 border-b max-w-xs">
                        <div className="text-xs text-gray-600">
                          {(p.authorizers || [])
                            .map((a) => `${a.name} (${a.role})`)
                            .join(", ")}
                        </div>
                      </td>

                      <td className="py-3 px-3 border-b">
                        <div className="text-xs">
                          <div>{p.contactEmail || "-"}</div>
                          <div>{p.contactPhone || "-"}</div>
                        </div>
                      </td>

                      <td className="py-3 px-3 border-b">
                        {p.sent ? (
                          <span className="inline-block px-2 py-0.5 text-xs rounded bg-green-100 text-green-800">
                            Sent
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                            Not sent
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 border-b text-xs">
                        {dateFmt(p.sentAt)}
                      </td>
                      <td className="py-3 px-3 border-b text-xs">
                        {dateFmt(p.downloadedAt)}
                      </td>
                      <td className="py-3 px-3 border-b text-xs">
                        {dateFmt(p.createdAt)}
                      </td>

                      <td className="py-3 px-3 border-b">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openDetails(p)}
                            className="flex items-center gap-2 px-2 py-1 border rounded text-sm hover:bg-gray-50"
                            title="View details"
                          >
                            <FiEye />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile/Card view (smaller screens) */}
          <div className="md:hidden flex flex-col gap-3">
            {filteredPads.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                No PAD records found.
              </div>
            ) : (
              filteredPads.map((p) => (
                <article
                  key={p._id}
                  className="border rounded-lg p-3 bg-white shadow-sm"
                  aria-labelledby={`pad-${p._id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 id={`pad-${p._id}`} className="text-sm font-semibold">
                        {p.subject}
                      </h4>
                      <div className="text-xs text-gray-500 mt-1">
                        {p.serial
                          ? `Serial: ${p.serial}`
                          : dateFmt(p.createdAt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetails(p)}
                        className="p-2 border rounded text-sm hover:bg-gray-50"
                        aria-label="View details"
                      >
                        <FiEye />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-600">
                    <div className="mb-1">
                      <span className="font-medium text-gray-700">
                        Receiver:{" "}
                      </span>
                      {p.receiverEmail || "-"}
                    </div>

                    {p.statement && (
                      <div className="mb-1 text-gray-700 whitespace-pre-wrap">
                        {shortStatement(p.statement, 140)}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      <div>Sent: {p.sent ? "Yes" : "No"}</div>
                      <div>Created: {dateFmt(p.createdAt)}</div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Showing <strong>{filteredPads.length}</strong> of{" "}
            <strong>{pads.length}</strong> records.
          </div>
        </>
      )}

      {/* Modal for details */}
      <AnimatePresence>
        {modalOpen && selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="absolute inset-0 bg-black/40"
              onClick={closeModal}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full z-50 p-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-semibold">{selected.subject}</h4>
                  <div className="text-xs text-gray-500 mt-1">
                    Serial: {selected.serial || "-"} • Created:{" "}
                    {dateFmt(selected.createdAt)}
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-500 text-xl font-bold px-2 py-1 hover:text-gray-700"
                  aria-label="Close details"
                >
                  ×
                </button>
              </div>

              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-600">Statement</h5>
                <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
                  {selected.statement || (
                    <span className="text-gray-400">No statement.</span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-600">
                  Authorizers
                </h5>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {(selected.authorizers || []).length === 0 ? (
                    <li className="text-gray-400">No authorizers recorded.</li>
                  ) : (
                    selected.authorizers.map((a, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{a.name}</span> —{" "}
                        <span>{a.role}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                <div>
                  <div className="text-xs text-gray-500">Receiver</div>
                  <div>{selected.receiverEmail || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Contact</div>
                  <div>
                    {selected.contactEmail || "-"}{" "}
                    {selected.contactPhone ? ` • ${selected.contactPhone}` : ""}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs text-gray-500">Address</div>
                  <div>{selected.address || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Sent</div>
                  <div>
                    {selected.sent ? `Yes • ${dateFmt(selected.sentAt)}` : "No"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Downloaded</div>
                  <div>
                    {selected.downloadedAt
                      ? dateFmt(selected.downloadedAt)
                      : "-"}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (selected.serial) {
                      navigator.clipboard?.writeText(selected.serial);
                    }
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                >
                  Copy Serial
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PadHistory;

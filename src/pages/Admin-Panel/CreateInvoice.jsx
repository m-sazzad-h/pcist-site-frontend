// src/components/admin/InvoiceSend.jsx
import React, { useMemo, useState } from "react";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import axios from "axios";
import { ClipLoader } from "react-spinners";
import { FiPlusCircle, FiTrash2, FiSend } from "react-icons/fi";
import { motion } from "framer-motion";

const currencyFmt = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0.00";
  return num.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const defaultProduct = { description: "", quantity: 1, unitPrice: "" };

const InvoiceSend = () => {
  const url = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");
  const slug = localStorage.getItem("slug");

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      receiverEmail: "",
      subject: "Invoice from pcIST",
      products: [defaultProduct],
      authorizerName: "",
      authorizerDesignation: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "products",
  });

  // useWatch subscribes to changes and is reliable for nested arrays
  const products = useWatch({ control, name: "products" }) || [];

  // totals recomputed whenever products change
  const totals = useMemo(() => {
    let subtotal = 0;
    for (const p of products) {
      // be resilient to empty values
      const qty = Number(p?.quantity);
      const up = Number(p?.unitPrice);
      const q = Number.isFinite(qty) ? qty : 0;
      const u = Number.isFinite(up) ? up : 0;
      subtotal += q * u;
    }
    const tax = 0;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [products]);

  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const addProduct = () => append(defaultProduct);

  const onSubmit = async (data) => {
    setApiError("");
    setApiSuccess(null);

    if (!data.products || data.products.length === 0) {
      setApiError("Add at least one product/item.");
      return;
    }

    const payload = {
      slug,
      receiverEmail: data.receiverEmail,
      subject: data.subject || "Invoice from pcIST",
      products: data.products.map((p) => ({
        description: p.description,
        quantity: p.quantity ? Number(p.quantity) : 1,
        unitPrice: Number(p.unitPrice),
      })),
      authorizerName: data.authorizerName || undefined,
      authorizerDesignation: data.authorizerDesignation || undefined,
      contactEmail: data.contactEmail || undefined,
      contactPhone: data.contactPhone || undefined,
      address: data.address || undefined,
    };

    try {
      const res = await axios.post(`${url}/user/invoice/send`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-user-slug": slug,
          "x-slug": slug,
        },
      });

      const d = res.data || {};
      setApiSuccess({
        message: d.message || "Invoice email sent successfully",
        invoiceId: d.invoiceId,
        serial: d.serial,
        issueDate: d.issueDate,
        total: d.total,
      });

      reset({
        receiverEmail: "",
        subject: "Invoice from pcIST",
        products: [defaultProduct],
        authorizerName: "",
        authorizerDesignation: "",
        contactEmail: "",
        contactPhone: "",
        address: "",
      });
    } catch (err) {
      console.error(err);
      setApiError(
        err?.response?.data?.message || "Failed to send invoice. Try again."
      );
    }
  };

  // helper for showing line total safely
  const lineTotal = (p) => {
    const q = Number(p?.quantity);
    const u = Number(p?.unitPrice);
    return (Number.isFinite(q) ? q : 0) * (Number.isFinite(u) ? u : 0);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow mt-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-semibold">Send Invoice</h3>
      </div>

      {apiSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-3 rounded bg-green-50 text-green-800"
        >
          <div className="font-medium">{apiSuccess.message}</div>
          <div className="text-xs mt-1">
            Serial: <strong>{apiSuccess.serial}</strong> • Issue Date:{" "}
            {apiSuccess.issueDate} • Total: ৳{currencyFmt(apiSuccess.total)}
          </div>
        </motion.div>
      )}

      {apiError && (
        <div className="mb-3 p-3 rounded bg-red-50 text-red-700">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Receiver Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              {...register("receiverEmail", {
                required: "Receiver email is required",
              })}
              className={`mt-1 block w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                errors.receiverEmail ? "border-red-300" : ""
              }`}
              placeholder="recipient@example.com"
            />
            {errors.receiverEmail && (
              <p className="text-xs text-red-600 mt-1">
                {errors.receiverEmail.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Subject
            </label>
            <input
              type="text"
              {...register("subject")}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="Invoice from pcIST"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Products / Items</h4>
            <button
              type="button"
              onClick={addProduct}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border rounded text-sm hover:bg-green-100"
            >
              <FiPlusCircle /> Add item
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-2 items-center border rounded p-3"
              >
                <div className="col-span-12 sm:col-span-6">
                  <label className="text-xs text-gray-600">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    {...register(`products.${idx}.description`, {
                      required: "Description required",
                    })}
                    className="mt-1 block w-full border rounded px-2 py-2 text-sm focus:outline-none"
                    placeholder="Item description"
                  />
                  {errors.products?.[idx]?.description && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.products[idx].description.message}
                    </p>
                  )}
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label className="text-xs text-gray-600">Qty</label>
                  <Controller
                    control={control}
                    name={`products.${idx}.quantity`}
                    defaultValue={field.quantity || 1}
                    rules={{
                      min: { value: 1, message: "Quantity must be at least 1" },
                    }}
                    render={({ field: f }) => (
                      <input
                        type="number"
                        {...f}
                        className="mt-1 block w-full border rounded px-2 py-2 text-sm focus:outline-none"
                        min="1"
                      />
                    )}
                  />
                  {errors.products?.[idx]?.quantity && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.products[idx].quantity.message}
                    </p>
                  )}
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label className="text-xs text-gray-600">
                    Unit Price (৳) *
                  </label>
                  <Controller
                    control={control}
                    name={`products.${idx}.unitPrice`}
                    defaultValue={field.unitPrice || ""}
                    rules={{
                      required: "Unit price required",
                      min: { value: 0, message: "Invalid price" },
                    }}
                    render={({ field: f }) => (
                      <input
                        type="number"
                        step="0.01"
                        {...f}
                        className="mt-1 block w-full border rounded px-2 py-2 text-sm focus:outline-none"
                        placeholder="0.00"
                      />
                    )}
                  />
                  {errors.products?.[idx]?.unitPrice && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.products[idx].unitPrice.message}
                    </p>
                  )}
                </div>

                <div className="col-span-8 sm:col-span-1 text-xs text-gray-700">
                  <div>Line</div>
                  <div className="font-medium mt-1">
                    ৳{currencyFmt(lineTotal(products[idx] || {}))}
                  </div>
                </div>

                <div className="col-span-4 sm:col-span-0 flex justify-end sm:justify-start">
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="inline-flex items-center gap-2 px-2 py-1 text-xs text-red-600 border rounded hover:bg-red-50"
                    aria-label={`Remove item ${idx + 1}`}
                  >
                    <FiTrash2 />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Authorizer Name
            </label>
            <input
              type="text"
              {...register("authorizerName")}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Authorizer Designation
            </label>
            <input
              type="text"
              {...register("authorizerDesignation")}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Contact Email
            </label>
            <input
              type="email"
              {...register("contactEmail")}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Contact Phone
            </label>
            <input
              type="text"
              {...register("contactPhone")}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Address</label>
            <textarea
              {...register("address")}
              rows="2"
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="bg-gray-50 border rounded p-3 text-sm w-full sm:w-auto">
            <div className="text-xs text-gray-500">Subtotal</div>
            <div className="text-lg font-medium">
              ৳{currencyFmt(totals.subtotal)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total</div>
            <div className="text-lg font-semibold">
              ৳{currencyFmt(totals.total)}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setPreviewOpen((s) => !s)}
              className="px-3 py-2 border rounded text-sm hover:bg-gray-50"
            >
              Preview
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              {isSubmitting ? <ClipLoader size={16} /> : <FiSend />}
              <span>{isSubmitting ? "Sending..." : "Send Invoice"}</span>
            </button>
          </div>
        </div>
      </form>

      {previewOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 border rounded p-4 bg-white"
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-semibold">Invoice Preview</h4>
              <div className="text-xs text-gray-500">
                This is a client-side preview (not the final PDF).
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Total: ৳{currencyFmt(totals.total)}
            </div>
          </div>

          <div className="mt-3">
            <div className="text-sm font-medium">Items</div>
            <div className="mt-2 space-y-2">
              {products.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <div>
                    <div className="font-medium">
                      {p.description || (
                        <span className="text-gray-400">No desc</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Qty: {p.quantity || 0} • Unit: ৳
                      {currencyFmt(Number(p.unitPrice) || 0)}
                    </div>
                  </div>
                  <div className="font-medium">
                    ৳{currencyFmt(lineTotal(p))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-700">
            {(watch("authorizerName") || watch("authorizerDesignation")) && (
              <div className="mb-2">
                <div className="text-xs text-gray-500">Authorizer</div>
                <div>
                  {watch("authorizerName")}{" "}
                  {watch("authorizerDesignation")
                    ? `• ${watch("authorizerDesignation")}`
                    : ""}
                </div>
              </div>
            )}

            {(watch("contactEmail") || watch("contactPhone")) && (
              <div>
                <div className="text-xs text-gray-500">Contact</div>
                <div>
                  {watch("contactEmail")}{" "}
                  {watch("contactPhone") ? `• ${watch("contactPhone")}` : ""}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default InvoiceSend;

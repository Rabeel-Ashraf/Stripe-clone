"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { processPayment } from "@/lib/checkout";
import { extractBrand } from "@/lib/card-validation";
import CardInput from "./CardInput";
import ThreeDSModal from "./ThreeDSModal";

interface BillingDetails {
  fullName: string;
  email: string;
}

export interface StripeCheckoutFormProps {
  intentId: string;
  clientSecret: string;
  onSuccess?: (intentId: string) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
  buttonText?: string;
  currency?: string;
  amount?: number;
  description?: string;
  style?: {
    primaryColor?: string;
    fontFamily?: string;
  };
}

const formatAmount = (amount: number) => {
  return (amount / 100).toFixed(2);
};

export default function StripeCheckoutForm({
  intentId,
  clientSecret,
  onSuccess,
  onError,
  onComplete,
  buttonText = "Pay",
  currency = "USD",
  amount,
  description,
  style = {},
}: StripeCheckoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show3ds, setShow3ds] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  // Validation state
  const [cardBrand, setCardBrand] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const primaryColor = style.primaryColor || "#635BFF";
  const fontFamily = style.fontFamily || "system-ui, -apple-system, sans-serif";

  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);

    if (cleaned.length > 0) {
      setCardBrand(extractBrand(cleaned));
    } else {
      setCardBrand("");
    }

    if (formErrors.cardNumber) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.cardNumber;
        return newErrors;
      });
    }
  };

  const handleExpiryChange = (value: string) => {
    let cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      cleaned = cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    setExpiry(cleaned);

    if (formErrors.expiry) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.expiry;
        return newErrors;
      });
    }
  };

  const handleCvcChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const maxLength = cardBrand === "amex" ? 4 : 3;
    setCvc(cleaned.slice(0, maxLength));

    if (formErrors.cvc) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.cvc;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Valid email is required";
    }

    const cardDigits = cardNumber.replace(/\D/g, "");
    if (!cardDigits) {
      newErrors.cardNumber = "Card number is required";
    }

    if (!expiry || expiry.length < 5) {
      newErrors.expiry = "Expiry date is required";
    }

    if (!cvc) {
      newErrors.cvc = "CVC is required";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormComplete = (): boolean => {
    return (
      fullName.trim() !== "" &&
      email.trim() !== "" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      cardNumber.replace(/\D/g, "").length >= 13 &&
      expiry.length === 5 &&
      cvc.length >= 3
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const errorMsg = Object.values(formErrors)[0];
      if (onError) onError(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await processPayment(
        intentId,
        clientSecret,
        cardNumber.replace(/\s+/g, ""),
        expiry,
        cvc,
        {
          fullName,
          email,
        }
      );

      if (result.requires3ds) {
        setShow3ds(true);
        setLoading(false);
      } else if (result.success) {
        if (onSuccess) onSuccess(result.intentId || intentId);
        if (onComplete) onComplete();
      } else {
        const errorMsg = result.error || "Payment failed";
        setError(errorMsg);
        if (onError) onError(errorMsg);
        setLoading(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMsg);
      if (onError) onError(errorMsg);
      setLoading(false);
    }
  };

  const inlineStyles = `
    * {
      font-family: ${fontFamily};
    }
    input {
      border-color: #e5e7eb;
    }
    input:focus {
      border-color: ${primaryColor};
      box-shadow: 0 0 0 3px ${primaryColor}33;
    }
    button:not(:disabled) {
      background-color: ${primaryColor};
    }
    button:not(:disabled):hover {
      opacity: 0.9;
    }
  `;

  return (
    <>
      <style>{inlineStyles}</style>
      <form onSubmit={handleSubmit} className="space-y-4" style={{ fontFamily }}>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        {description && (
          <div className="text-sm text-gray-600">
            <p>{description}</p>
            {amount && (
              <p className="font-semibold text-lg text-gray-900 mt-1">
                ${formatAmount(amount)}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2"
          />
          {formErrors.fullName && (
            <p className="mt-1 text-xs text-red-600">{formErrors.fullName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2"
          />
          {formErrors.email && (
            <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
          )}
        </div>

        <CardInput
          cardNumber={cardNumber}
          onCardNumberChange={handleCardNumberChange}
          expiry={expiry}
          onExpiryChange={handleExpiryChange}
          cvc={cvc}
          onCvcChange={handleCvcChange}
          cardBrand={cardBrand}
          errors={formErrors}
          onBlur={() => {}}
        />

        <button
          type="submit"
          disabled={loading || !isFormComplete()}
          className={`w-full px-4 py-2 rounded font-semibold text-white transition-colors ${
            loading || !isFormComplete()
              ? "bg-gray-400 cursor-not-allowed"
              : ""
          }`}
          style={{
            backgroundColor: primaryColor,
            opacity: loading || !isFormComplete() ? 0.6 : 1,
          }}
        >
          {loading ? "Processing..." : buttonText}
        </button>
      </form>

      <ThreeDSModal
        isOpen={show3ds}
        intentId={intentId}
        clientSecret={clientSecret}
        onSuccess={() => {
          if (onSuccess) onSuccess(intentId);
          if (onComplete) onComplete();
        }}
        onCancel={() => {
          setShow3ds(false);
          setLoading(false);
        }}
      />
    </>
  );
}

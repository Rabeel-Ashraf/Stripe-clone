"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { processPayment } from "@/lib/checkout";
import { extractBrand } from "@/lib/card-validation";
import CardInput from "./CardInput";
import ThreeDSModal from "./ThreeDSModal";

interface PaymentIntentData {
  id: string;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  metadata?: Record<string, any>;
}

interface CheckoutFormProps {
  intentId: string;
  clientSecret: string;
  paymentIntent: PaymentIntentData;
}

const formatAmount = (amount: number) => {
  return (amount / 100).toFixed(2);
};

export default function CheckoutForm({
  intentId,
  clientSecret,
  paymentIntent,
}: CheckoutFormProps) {
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
  const [showAddress, setShowAddress] = useState(false);
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });

  // Validation state
  const [cardBrand, setCardBrand] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});

  const handleCardNumberChange = (value: string) => {
    // Remove spaces and non-digits
    const cleaned = value.replace(/\D/g, "");
    // Add spaces every 4 digits for display
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);

    if (cleaned.length > 0) {
      const brand = extractBrand(cleaned);
      setCardBrand(brand);
    } else {
      setCardBrand("");
    }

    // Clear error when user starts correcting
    if (formErrors.cardNumber) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.cardNumber;
        return newErrors;
      });
    }
  };

  const handleExpiryChange = (value: string) => {
    // Format MM/YY
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
          address: showAddress ? address : undefined,
        }
      );

      if (result.requires3ds) {
        setShow3ds(true);
        setLoading(false);
      } else if (result.success) {
        router.push(`/checkout/success?payment_intent=${intentId}`);
      } else {
        setError(result.error || "Payment failed");
        setLoading(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setLoading(false);
    }
  };

  const handleFieldBlur = (fieldName: string) => {
    setFieldTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment</h1>
        <p className="text-gray-600">Enter your payment details below</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="font-medium text-red-900">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Billing Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Billing Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => handleFieldBlur("fullName")}
                placeholder="John Doe"
                className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.fullName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.fullName && (
                <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleFieldBlur("email")}
                placeholder="john@example.com"
                className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowAddress(!showAddress)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showAddress ? "Hide" : "Add"} Address (Optional)
              </button>
            </div>

            {showAddress && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) =>
                      setAddress({ ...address, street: e.target.value })
                    }
                    placeholder="123 Main St"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) =>
                        setAddress({ ...address, city: e.target.value })
                      }
                      placeholder="New York"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) =>
                        setAddress({ ...address, state: e.target.value })
                      }
                      placeholder="NY"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={address.postalCode}
                      onChange={(e) =>
                        setAddress({ ...address, postalCode: e.target.value })
                      }
                      placeholder="10001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      value={address.country}
                      onChange={(e) =>
                        setAddress({ ...address, country: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Information
          </h2>

          <div className="space-y-4">
            <CardInput
              cardNumber={cardNumber}
              onCardNumberChange={handleCardNumberChange}
              expiry={expiry}
              onExpiryChange={handleExpiryChange}
              cvc={cvc}
              onCvcChange={handleCvcChange}
              cardBrand={cardBrand}
              errors={formErrors}
              onBlur={handleFieldBlur}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading || !isFormComplete()}
          className={`w-full px-4 py-3 rounded-lg font-semibold text-white text-lg transition-colors ${
            loading || !isFormComplete()
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            `Pay $${formatAmount(paymentIntent.amount)}`
          )}
        </button>

        {/* Cancel Link */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* 3DS Modal */}
      <ThreeDSModal
        isOpen={show3ds}
        intentId={intentId}
        clientSecret={clientSecret}
        onSuccess={() => router.push(`/checkout/success?payment_intent=${intentId}`)}
        onCancel={() => {
          setShow3ds(false);
          setLoading(false);
        }}
      />
    </>
  );
}

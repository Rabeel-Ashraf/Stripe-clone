"use client";

import { useMemo } from "react";

interface CardInputProps {
  cardNumber: string;
  onCardNumberChange: (value: string) => void;
  expiry: string;
  onExpiryChange: (value: string) => void;
  cvc: string;
  onCvcChange: (value: string) => void;
  cardBrand: string;
  errors: Record<string, string>;
  onBlur: (fieldName: string) => void;
}

const BRAND_COLORS: Record<string, string> = {
  visa: "#1A1F71",
  mastercard: "#EB001B",
  amex: "#006FCF",
  discover: "#FF6000",
  unknown: "#6B7280",
};

const BRAND_LOGOS: Record<string, string> = {
  visa: "VISA",
  mastercard: "MC",
  amex: "AMEX",
  discover: "DISC",
};

export default function CardInput({
  cardNumber,
  onCardNumberChange,
  expiry,
  onExpiryChange,
  cvc,
  onCvcChange,
  cardBrand,
  errors,
  onBlur,
}: CardInputProps) {
  const displayBrand = cardBrand || "unknown";

  return (
    <div className="space-y-4">
      {/* Card Number */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Card Number *
          </label>
          {displayBrand !== "unknown" && (
            <span
              className="text-xs font-bold text-white px-2 py-1 rounded"
              style={{ backgroundColor: BRAND_COLORS[displayBrand] }}
            >
              {BRAND_LOGOS[displayBrand] || displayBrand.toUpperCase()}
            </span>
          )}
        </div>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => onCardNumberChange(e.target.value)}
          onBlur={() => onBlur("cardNumber")}
          placeholder="4242 4242 4242 4242"
          maxLength={23}
          autoComplete="cc-number"
          className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.cardNumber ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.cardNumber && (
          <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
        )}
      </div>

      {/* Expiry and CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date *
          </label>
          <input
            type="text"
            value={expiry}
            onChange={(e) => onExpiryChange(e.target.value)}
            onBlur={() => onBlur("expiry")}
            placeholder="MM/YY"
            maxLength={5}
            autoComplete="cc-exp"
            className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.expiry ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.expiry && (
            <p className="mt-1 text-sm text-red-600">{errors.expiry}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CVC *
          </label>
          <input
            type="text"
            value={cvc}
            onChange={(e) => onCvcChange(e.target.value)}
            onBlur={() => onBlur("cvc")}
            placeholder={displayBrand === "amex" ? "1234" : "123"}
            maxLength={displayBrand === "amex" ? 4 : 3}
            autoComplete="cc-csc"
            className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.cvc ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.cvc && (
            <p className="mt-1 text-sm text-red-600">{errors.cvc}</p>
          )}
        </div>
      </div>

      {/* Security Info */}
      <div className="flex items-center gap-2 text-xs text-gray-600 pt-2">
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>Your card information is encrypted and secure</span>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import OrderSummary from "@/components/OrderSummary";
import { logger } from "@/lib/logger";

interface PaymentIntentData {
  id: string;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export default function CheckoutPage({
  params,
}: {
  params: { intentId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientSecret = searchParams.get("client_secret");
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        if (!clientSecret) {
          setError("Missing client secret");
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/payment-intents/${params.intentId}`, {
          headers: {
            "x-client-secret": clientSecret,
          },
        });

        if (!response.ok) {
          setError("Payment intent not found");
          setLoading(false);
          return;
        }

        const data = await response.json();
        setPaymentIntent(data);
        setLoading(false);
      } catch (err) {
        logger.error("Failed to fetch payment intent", { error: err });
        setError("Failed to load payment details");
        setLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [params.intentId, clientSecret]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !paymentIntent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Payment Error
          </h1>
          <p className="text-gray-600 mb-6">{error || "Unable to load payment"}</p>
          <button
            onClick={() => router.back()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row">
        {/* Left side: Form (66% on desktop) */}
        <div className="w-full lg:w-2/3 bg-white">
          <div className="max-w-2xl mx-auto px-6 py-8 lg:py-12">
            <CheckoutForm
              intentId={params.intentId}
              clientSecret={clientSecret!}
              paymentIntent={paymentIntent}
            />
          </div>
        </div>

        {/* Right side: Order Summary (33% on desktop) */}
        <div className="w-full lg:w-1/3 bg-gray-100 lg:bg-gray-50">
          <div className="sticky top-0 px-6 py-8 lg:py-12 lg:border-l lg:border-gray-200">
            <OrderSummary paymentIntent={paymentIntent} />
          </div>
        </div>
      </div>
    </div>
  );
}

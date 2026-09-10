import { supabase } from "@/integrations/supabase/client";

type OrderResponse = {
  key_id: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  booking_ref?: string;
  prefill?: { name?: string; email?: string; contact?: string };
};

export type CoursePayload = { purpose: "course"; course_id: string };
export type BookingPayload = {
  purpose: "booking";
  service_title: string;
  amount_inr: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  city?: string;
  address?: string;
  scheduled_date: string;
  scheduled_slot: string;
  notes?: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadSdk(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export type PayResult =
  | { status: "success"; purpose: "course" | "booking"; booking_ref?: string | null }
  | { status: "dismissed" }
  | { status: "error"; message: string };

/** Creates a Razorpay order server-side, opens checkout and verifies the payment. */
export async function payWithRazorpay(payload: CoursePayload | BookingPayload): Promise<PayResult> {
  const ok = await loadSdk();
  if (!ok) return { status: "error", message: "Could not load the payment window. Check your connection." };

  const { data, error } = await supabase.functions.invoke<OrderResponse | { error: unknown }>(
    "razorpay-create-order",
    { body: payload },
  );
  if (error || !data || "error" in data) {
    const msg =
      (data && "error" in data && typeof data.error === "string" && data.error) ||
      error?.message ||
      "Could not start the payment.";
    return { status: "error", message: msg };
  }
  const order = data as OrderResponse;

  return new Promise<PayResult>((resolve) => {
    const rzp = new window.Razorpay!({
      key: order.key_id,
      order_id: order.order_id,
      amount: order.amount,
      currency: order.currency,
      name: order.name,
      description: order.description,
      theme: { color: "#0f2244" },
      prefill: order.prefill ?? {},
      modal: { ondismiss: () => resolve({ status: "dismissed" }) },
      handler: async (resp: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        const { data: v, error: vErr } = await supabase.functions.invoke<{
          ok?: boolean;
          purpose?: "course" | "booking";
          booking_ref?: string | null;
          error?: unknown;
        }>("razorpay-verify", { body: resp });
        if (vErr || !v?.ok) {
          resolve({ status: "error", message: "Payment captured but confirmation failed. Contact support with your payment id." });
          return;
        }
        resolve({
          status: "success",
          purpose: v.purpose ?? (payload.purpose as "course" | "booking"),
          booking_ref: v.booking_ref ?? order.booking_ref ?? null,
        });
      },
    });
    rzp.open();
  });
}

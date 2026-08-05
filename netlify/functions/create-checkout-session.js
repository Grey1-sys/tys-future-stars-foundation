/**
 * Ty's Future Stars Foundation — Stripe Checkout Session (Netlify Functions)
 *
 * Creates a Stripe Checkout Session for one-time or monthly donations of
 * an arbitrary amount, then returns the hosted checkout URL.
 *
 * Requires env var: STRIPE_SECRET_KEY  (sk_test_... or sk_live_...)
 * Optional env var: SITE_URL           (e.g. https://tysfuturestars.org)
 */

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return json(500, { error: "Stripe secret key not configured on the server." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "Invalid JSON." });
  }

  const amount = parseInt(body.amount, 10);            // cents
  const frequency = body.frequency === "monthly" ? "monthly" : "once";
  const email = typeof body.email === "string" ? body.email : undefined;

  if (!Number.isInteger(amount) || amount < 100) {
    return json(400, { error: "Amount must be at least $1.00." });
  }
  if (amount > 100000000) {
    return json(400, { error: "Amount exceeds the maximum allowed." });
  }

  const origin =
    process.env.SITE_URL ||
    (event.headers && (event.headers.origin || `https://${event.headers.host}`)) ||
    "";

  try {
    const params = {
      mode: frequency === "monthly" ? "subscription" : "payment",
      success_url: `${origin}/donate.html?status=success`,
      cancel_url: `${origin}/donate.html?status=cancelled`,
      submit_type: "donate",
      billing_address_collection: "auto",
      metadata: {
        source: "tys-future-stars-website",
        donor_first_name: body.firstName || "",
        donor_last_name: body.lastName || "",
      },
    };

    if (email) params.customer_email = email;

    const productName =
      frequency === "monthly" ? "Monthly donation — Ty's Future Stars Foundation"
                              : "Donation — Ty's Future Stars Foundation";

    if (frequency === "monthly") {
      params.line_items = [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amount,
          recurring: { interval: "month" },
          product_data: { name: productName },
        },
      }];
    } else {
      params.line_items = [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amount,
          product_data: { name: productName },
        },
      }];
    }

    const session = await stripe.checkout.sessions.create(params);
    return json(200, { id: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return json(500, { error: "Unable to create checkout session." });
  }
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { ...CORS, "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}

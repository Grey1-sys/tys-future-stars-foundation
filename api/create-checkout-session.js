/**
 * Ty's Future Stars Foundation — Stripe Checkout Session (Vercel Serverless Function)
 *
 * Identical behavior to the Netlify function, in Vercel's req/res style.
 * If you deploy to Vercel, set donate.html's checkoutEndpoint to
 * "/api/create-checkout-session".
 *
 * Requires env var: STRIPE_SECRET_KEY
 * Optional env var: SITE_URL
 */

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "");

module.exports = async function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Stripe secret key not configured on the server." });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : (req.body || {});

  const amount = parseInt(body.amount, 10);
  const frequency = body.frequency === "monthly" ? "monthly" : "once";
  const email = typeof body.email === "string" ? body.email : undefined;

  if (!Number.isInteger(amount) || amount < 100) {
    return res.status(400).json({ error: "Amount must be at least $1.00." });
  }
  if (amount > 100000000) {
    return res.status(400).json({ error: "Amount exceeds the maximum allowed." });
  }

  const origin =
    process.env.SITE_URL ||
    (req.headers && req.headers.origin) ||
    (req.headers && req.headers.host ? `https://${req.headers.host}` : "");

  try {
    const productName =
      frequency === "monthly" ? "Monthly donation — Ty's Future Stars Foundation"
                              : "Donation — Ty's Future Stars Foundation";

    const price_data =
      frequency === "monthly"
        ? { currency: "usd", unit_amount: amount, recurring: { interval: "month" }, product_data: { name: productName } }
        : { currency: "usd", unit_amount: amount, product_data: { name: productName } };

    const params = {
      mode: frequency === "monthly" ? "subscription" : "payment",
      success_url: `${origin}/donate.html?status=success`,
      cancel_url: `${origin}/donate.html?status=cancelled`,
      submit_type: "donate",
      billing_address_collection: "auto",
      line_items: [{ quantity: 1, price_data }],
      metadata: {
        source: "tys-future-stars-website",
        donor_first_name: body.firstName || "",
        donor_last_name: body.lastName || "",
      },
    };
    if (email) params.customer_email = email;

    const session = await stripe.checkout.sessions.create(params);
    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: "Unable to create checkout session." });
  }
};

function safeParse(s) { try { return JSON.parse(s); } catch (e) { return {}; } }

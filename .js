
const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  "SENEN-SHOES <onboarding@resend.dev>";

// ==================== SEND ONE EMAIL ====================

async function sendEmail({ to, subject, html }) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    console.log(`Resend email sent to ${to}`);
    return true;
  } catch (error) {
    console.error(
      `Resend email failed for ${to}:`,
      error.message
    );

    return false;
  }
}

// ==================== SEND ORDER EMAILS ====================

async function SendEmail(order) {
  try {
    const itemsHTML = order.items
      .map(function (item) {
        return `
          <tr>
            <td style="padding:12px;border-bottom:1px solid #ddd;">
              ${item.company} ${item.shoename}
            </td>
            <td style="padding:12px;border-bottom:1px solid #ddd;">
              ${item.color || "N/A"}
            </td>
            <td style="padding:12px;border-bottom:1px solid #ddd;">
              UK ${item.size}
            </td>
            <td style="padding:12px;border-bottom:1px solid #ddd;">
              ${item.quantity}
            </td>
            <td style="padding:12px;border-bottom:1px solid #ddd;">
              Rs. ${item.price}
            </td>
          </tr>
        `;
      })
      .join("");

    // ==================== CUSTOMER EMAIL ====================

    const emailHTML = `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;color:#222;">
        <div style="background:#111;color:white;padding:25px;text-align:center;">
          <h1 style="margin:0;">Your Order is Confirmed</h1>
          <p style="margin:8px 0 0;">Thank you for shopping with us!</p>
        </div>

        <div style="padding:25px;">
          <h2>Hello ${order.customer.name},</h2>

          <p>
            Thank you for your order. We have received your
            order successfully.
          </p>

          <h3>Order Details</h3>

          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f3f3f3;">
                <th style="padding:12px;text-align:left;">Product</th>
                <th style="padding:12px;text-align:left;">Color</th>
                <th style="padding:12px;text-align:left;">Size</th>
                <th style="padding:12px;text-align:left;">Qty</th>
                <th style="padding:12px;text-align:left;">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHTML}</tbody>
          </table>

          <div style="margin-top:25px;padding:20px;background:#f7f7f7;">
            <p>
              <strong>Payment Method:</strong>
              ${order.paymentMethod}
            </p>

            <h2 style="margin-bottom:0;">
              Total: Rs. ${order.totalCost}
            </h2>
          </div>

          <h3>Delivery Information</h3>

          <p>
            <strong>Name:</strong> ${order.customer.name}<br>
            <strong>Phone:</strong> ${order.customer.phone}<br>
            <strong>Address:</strong> ${order.customer.address}
          </p>

          <p style="margin-top:30px;">
            We will process your order and contact you regarding delivery.
          </p>

          <p>Thank you for choosing us!</p>
        </div>

        <div style="background:#111;color:#aaa;padding:15px;text-align:center;">
          <small>This is an automated order confirmation email.</small>
        </div>
      </div>
    `;

    // ==================== ADMIN EMAIL ====================

    const adminEmailHTML = `
      <div style="font-family:Arial,sans-serif;max-width:750px;margin:auto;color:#222;">
        <div style="background:#111;color:white;padding:25px;">
          <h1 style="margin:0;">New Order Received</h1>
          <p style="margin:8px 0 0;color:#ccc;">
            A new order has been placed on your store.
          </p>
        </div>

        <div style="padding:25px;">
          <div style="background:#f3f3f3;padding:18px;border-radius:8px;margin-bottom:25px;">
            <h2 style="margin-top:0;">Order Information</h2>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Order Date:</strong> ${order.createdAt}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            <p><strong>Order Status:</strong> NEW ORDER</p>
          </div>

          <h2>Customer Information</h2>

          <div style="border:1px solid #ddd;padding:18px;border-radius:8px;margin-bottom:25px;">
            <p><strong>Name:</strong> ${order.customer.name}</p>
            <p><strong>Email:</strong> ${order.customer.email}</p>
            <p><strong>Phone:</strong> ${order.customer.phone}</p>
            <p><strong>Address:</strong> ${order.customer.address}</p>
          </div>

          <h2>Ordered Products</h2>

          <table style="width:100%;border-collapse:collapse;margin-top:15px;">
            <thead>
              <tr style="background:#111;color:white;">
                <th style="padding:12px;text-align:left;">Product</th>
                <th style="padding:12px;text-align:left;">Color</th>
                <th style="padding:12px;text-align:left;">Size</th>
                <th style="padding:12px;text-align:center;">Qty</th>
                <th style="padding:12px;text-align:right;">Price</th>
              </tr>
            </thead>

            <tbody>
              ${order.items.map(function (item) {
                return `
                  <tr>
                    <td style="padding:12px;border-bottom:1px solid #ddd;">
                      <strong>${item.company}</strong><br>
                      ${item.shoename}
                    </td>

                    <td style="padding:12px;border-bottom:1px solid #ddd;">
                      ${item.color || "N/A"}
                    </td>

                    <td style="padding:12px;border-bottom:1px solid #ddd;">
                      UK ${item.size}
                    </td>

                    <td style="padding:12px;border-bottom:1px solid #ddd;text-align:center;">
                      ${item.quantity}
                    </td>

                    <td style="padding:12px;border-bottom:1px solid #ddd;text-align:right;">
                      Rs. ${item.price * item.quantity}
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>

          <div style="margin-top:25px;padding:20px;background:#f5f5f5;border-radius:8px;text-align:right;">
            <h2 style="margin:0;">
              Total Order Value: Rs. ${order.totalCost}
            </h2>
          </div>

          <div style="margin-top:30px;padding:15px;border-left:4px solid #111;background:#fafafa;">
            <strong>Admin Action Required</strong>
            <p style="margin-bottom:0;">
              Review this order and begin the fulfillment process.
            </p>
          </div>
        </div>

        <div style="background:#111;color:#aaa;padding:18px;text-align:center;">
          <small>This is an automated notification from your e-commerce store.</small>
        </div>
      </div>
    `;

    console.log("Sending emails for order:", order._id);

    // Send both emails concurrently.
    const [adminSent, customerSent] = await Promise.all([
      sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: "New Order Received - SENEN-SHOES",
        html: adminEmailHTML,
      }),

      sendEmail({
        to: order.customer.email,
        subject: "Order Confirmation - SENEN-SHOES",
        html: emailHTML,
      }),
    ]);

    console.log("Email results:", {
      adminSent,
      customerSent,
      orderId: order._id,
    });

    return { adminSent, customerSent };
  } catch (error) {
    console.error(
      "Error preparing order emails:",
      error.message
    );

    return {
      adminSent: false,
      customerSent: false,
    };
  }
}

module.exports = { SendEmail };

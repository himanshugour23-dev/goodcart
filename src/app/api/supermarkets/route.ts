import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { invalidBody, isUniqueError, serverError } from "@/lib/api";
import { newApiKey } from "@/lib/keys";

const input = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  city: z.string().trim().min(2).max(80),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = input.safeParse(body);

  if (!result.success) return invalidBody(result.error);

  const { name, email, city } = result.data;
  const apiKey = newApiKey();

  try {
    const sql = getDb();
    const [shop] = await sql`
      INSERT INTO supermarkets (name, email, city, api_key_hash)
      VALUES (${name}, ${email.toLowerCase()}, ${city}, ${apiKey.hash})
      RETURNING id, name, email, city, created_at AS "createdAt"
    `;

    return NextResponse.json(
      {
        supermarket: shop,
        apiKey: apiKey.key,
        note: "Save this API key now. It will not be shown again.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueError(error)) {
      return NextResponse.json(
        { error: "A supermarket with this email is already registered." },
        { status: 409 },
      );
    }

    console.error("Could not register supermarket:", error);
    return serverError();
  }
}

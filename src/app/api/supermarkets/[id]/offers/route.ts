import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { invalidBody, serverError } from "@/lib/api";
import { hashKey } from "@/lib/keys";

const input = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().max(500).optional().default(""),
    discountPercent: z.number().int().min(1).max(100),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine((offer) => offer.endsAt > offer.startsAt, {
    path: ["endsAt"],
    message: "End date must be after start date.",
  });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid supermarket id." }, { status: 400 });
  }

  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return NextResponse.json(
      { error: "Add your API key in the Authorization: Bearer header." },
      { status: 401 },
    );
  }

  const keyHash = hashKey(match[1]);
  const body = await request.json().catch(() => null);
  const result = input.safeParse(body);

  if (!result.success) return invalidBody(result.error);

  try {
    const sql = getDb();
    const [shop] = await sql`
      SELECT id FROM supermarkets
      WHERE id = ${id}::uuid AND api_key_hash = ${keyHash}
      LIMIT 1
    `;

    if (!shop) {
      return NextResponse.json({ error: "API key or supermarket id is incorrect." }, { status: 401 });
    }

    const offer = result.data;
    const [saved] = await sql`
      INSERT INTO offers (
        supermarket_id, title, description, discount_percent, starts_at, ends_at
      )
      VALUES (
        ${id}::uuid,
        ${offer.title},
        ${offer.description || null},
        ${offer.discountPercent},
        ${offer.startsAt.toISOString()},
        ${offer.endsAt.toISOString()}
      )
      RETURNING
        id,
        supermarket_id AS "supermarketId",
        title,
        description,
        discount_percent AS "discountPercent",
        starts_at AS "startsAt",
        ends_at AS "endsAt",
        created_at AS "createdAt"
    `;

    return NextResponse.json({ offer: saved }, { status: 201 });
  } catch (error) {
    console.error("Could not create offer:", error);
    return serverError();
  }
}

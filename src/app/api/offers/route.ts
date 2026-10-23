import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { serverError } from "@/lib/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  const city = (url.searchParams.get("city") ?? "").trim().slice(0, 80);
  const askedPage = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const askedLimit = Number.parseInt(url.searchParams.get("limit") ?? "12", 10);
  const page = Number.isSafeInteger(askedPage) && askedPage > 0 && askedPage <= 1_000_000 ? askedPage : 1;
  const limit = Number.isFinite(askedLimit) ? Math.min(Math.max(askedLimit, 1), 30) : 12;
  const offset = (page - 1) * limit;
  const search = `%${q}%`;
  const place = `%${city}%`;

  try {
    const sql = getDb();
    const [count] = await sql`
      SELECT COUNT(*)::int AS total
      FROM offers o
      JOIN supermarkets s ON s.id = o.supermarket_id
      WHERE o.starts_at <= NOW()
        AND o.ends_at > NOW()
        AND (${q} = '' OR o.title ILIKE ${search} OR COALESCE(o.description, '') ILIKE ${search})
        AND (${city} = '' OR s.city ILIKE ${place})
    `;

    const offers = await sql`
      SELECT
        o.id,
        o.title,
        o.description,
        o.discount_percent AS "discountPercent",
        o.starts_at AS "startsAt",
        o.ends_at AS "endsAt",
        s.id AS "supermarketId",
        s.name AS "supermarketName",
        s.city
      FROM offers o
      JOIN supermarkets s ON s.id = o.supermarket_id
      WHERE o.starts_at <= NOW()
        AND o.ends_at > NOW()
        AND (${q} = '' OR o.title ILIKE ${search} OR COALESCE(o.description, '') ILIKE ${search})
        AND (${city} = '' OR s.city ILIKE ${place})
      ORDER BY o.ends_at ASC, o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = Number(count?.total ?? 0);

    return NextResponse.json({
      offers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Could not load offers:", error);
    return serverError();
  }
}

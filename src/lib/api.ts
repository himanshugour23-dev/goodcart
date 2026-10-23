import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function invalidBody(error: ZodError) {
  return NextResponse.json(
    {
      error: "Please check the submitted fields.",
      details: error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      })),
    },
    { status: 400 },
  );
}

export function serverError() {
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}

export function isUniqueError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

import { NextRequest } from "next/server";

export function isAuthorized(request: NextRequest): boolean {
  const required = process.env.APP_PASSWORD;
  if (!required) return true;
  return request.headers.get("x-app-password") === required;
}

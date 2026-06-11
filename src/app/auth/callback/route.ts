import { NextResponse } from "next/server";

// Hand off to the client-side processing page which handles PKCE exchange
// natively in the browser — avoids the server-side cookie-forwarding problem.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role = searchParams.get("role") ?? "student";
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const url = new URL(`${origin}/auth/processing`);
  url.searchParams.set("code", code);
  url.searchParams.set("role", role);
  return NextResponse.redirect(url.toString());
}

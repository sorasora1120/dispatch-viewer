"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(fd: FormData) {
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  if (!email || password.length < 8) redirect("/login?error=" + encodeURIComponent("Enter your email and password (8+ characters)."));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  // Do not reveal whether the email exists.
  if (error) redirect("/login?error=" + encodeURIComponent("Email or password is incorrect."));
  await supabase.from("activity_logs").insert({ action: "auth.login" });
  redirect("/");
}

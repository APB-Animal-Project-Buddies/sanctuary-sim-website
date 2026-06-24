"use server";

import { getServiceClient } from "@/lib/supabase";

export type WaitlistState = {
  status: "idle" | "success" | "already" | "error";
  message: string;
};

// Pragmatic email check — good enough for a waitlist, not RFC-perfect.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const raw = formData.get("email");
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";

  if (!email || !EMAIL_RE.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return {
      status: "error",
      message:
        "The waitlist isn't connected yet. Add your Supabase keys to .env.local to enable signups.",
    };
  }

  const { error } = await supabase.from("waitlist").insert({ email });

  if (error) {
    // 23505 = unique_violation → they're already signed up.
    if (error.code === "23505") {
      return {
        status: "already",
        message: "You're already on the list — we'll be in touch! 🐾",
      };
    }
    return {
      status: "error",
      message: "Something went wrong on our end. Please try again in a moment.",
    };
  }

  return {
    status: "success",
    message: "You're on the list! Keep an eye on your inbox. 🐾",
  };
}

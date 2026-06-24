import TimeOfDayHero from "./time-of-day-hero";
import { getWaitlistCount } from "@/lib/supabase";

// Re-fetch the waitlist count at most once a minute.
export const revalidate = 60;

export default async function Home() {
  const initialCount = await getWaitlistCount();

  return (
    <main className="page">
      <TimeOfDayHero initialCount={initialCount} />
    </main>
  );
}

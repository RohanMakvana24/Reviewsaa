import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main
      className="mx-auto max-w-5xl px-5 py-12"
      aria-label="Loading your setup"
    >
      <Skeleton className="mb-7 h-9 w-48" />
      <Skeleton className="mb-5 h-20 w-full" />
      <Skeleton className="h-96 w-full" />
    </main>
  );
}

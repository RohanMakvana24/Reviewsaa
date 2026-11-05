import { requireSession } from "@/lib/auth";
import { getContactInquiries } from "@/lib/workspace";
import { MessageSquareText } from "lucide-react";
export const metadata = { title: "Contact inquiries" };
export default async function Inquiries() {
  await requireSession("SUPER_ADMIN");
  const inquiries = await getContactInquiries();
  return (
    <>
      <div className="mb-7">
        <p className="market-eyebrow">DIRECT FROM THE WEBSITE</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Contact inquiries
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Actual contact-form submissions, newest first. No automatic emails or
          replies are sent.
        </p>
      </div>
      {inquiries.length === 0 ? (
        <section className="grid min-h-64 place-items-center rounded-lg border bg-card p-8 text-center">
          <div>
            <MessageSquareText className="mx-auto size-7 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">
              No contact inquiries yet
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Messages from the public contact form will appear here.
            </p>
          </div>
        </section>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <article
              key={inquiry.id}
              className="rounded-lg border bg-card p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="break-words text-base font-semibold">
                    {inquiry.name}
                  </h2>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {inquiry.email}
                    {inquiry.business ? ` · ${inquiry.business}` : ""}
                  </p>
                </div>
                <time
                  className="text-[11px] text-muted-foreground"
                  dateTime={inquiry.createdAt}
                >
                  {new Date(inquiry.createdAt).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}{" "}
                  IST
                </time>
              </div>
              <p className="mt-5 whitespace-pre-wrap break-words border-t pt-4 text-sm leading-relaxed">
                {inquiry.message}
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

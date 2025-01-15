import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CandidStance",
  description: "Political stance analyzer",
}

export default function RootLayout({
  children,
}: {
  children: any
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

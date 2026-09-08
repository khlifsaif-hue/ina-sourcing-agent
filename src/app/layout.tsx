import "./globals.css";

export const metadata = {
  title: "INA Sourcing Agent",
  description: "AI-assisted sourcing, supplier qualification, RFQ and procurement intelligence",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

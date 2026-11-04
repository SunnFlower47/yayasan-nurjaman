import Image from "next/image";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="flex max-w-md flex-col items-center space-y-6">
        <div className="relative h-28 w-28 overflow-hidden rounded-full border border-border p-2 shadow-sm">
          <Image
            src="/brand/logo-yayasan-nurjaman.png"
            alt="Logo Yayasan Nurjaman Bongas Purwakarta"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Yayasan Nurjaman Bongas Purwakarta
          </h1>
          <p className="inline-block rounded-md border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
            Dalam pengembangan
          </p>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Sistem informasi resmi dan tata kelola kelembagaan nirlaba berbasis transparansi
          dan akuntabilitas.
        </p>
      </div>
    </main>
  );
}

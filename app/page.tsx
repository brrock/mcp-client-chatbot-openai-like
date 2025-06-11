import { ProviderManager } from "@/components/ProviderManager";
import { ModeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="container mx-auto py-10">
      <h1 className="mb-4 text-4xl font-bold">
        AI Provider Configurator <ModeToggle />
      </h1>
      <p className="mb-8 text-muted-foreground">
        Use the form below to manage your provider configurations.
      </p>
      <ProviderManager />
    </main>
  );
}

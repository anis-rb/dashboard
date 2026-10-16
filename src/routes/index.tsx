import { createFileRoute } from "@tanstack/react-router";
import { DeskRoot } from "@/components/desk/root";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <DeskRoot />;
}

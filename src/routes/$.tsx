import { createFileRoute } from "@tanstack/react-router";
import LegacyApp from "../legacy-app";

export const Route = createFileRoute("/$")({
  component: () => <LegacyApp />,
  ssr: false,
});

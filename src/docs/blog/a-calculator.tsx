import { createFileRoute } from "@tanstack/react-router";
import MDX from "./a-calculator.mdx";

export const Route = createFileRoute("/blog/a-calculator")({
  component: RouteComponent,
});

function RouteComponent() {
  return <MDX />;
}

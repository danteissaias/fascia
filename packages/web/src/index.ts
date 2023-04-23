import "../node_modules/@reactants/core/dist/index.css";

export * from "./app";
export * from "./config";
export { Badge } from "@reactants/core";
import ms from "ms";

export function formatDate(date: Date) {
  return ms(Date.now() - date.getTime()) + " ago";
}

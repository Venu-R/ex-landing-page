import plan from "../data/page-plan.json";
import { FigmaPage } from "@bdmg/ui";
import type { PagePlan } from "@bdmg/types";

export default function Page() {
  return <FigmaPage plan={plan as unknown as PagePlan} />;
}

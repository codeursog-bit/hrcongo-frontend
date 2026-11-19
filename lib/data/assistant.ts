import { DEMO_MODE } from "@/lib/demo/config";
import { assistantApi } from "./assistant.api";
import { assistantDemo } from "./assistant.demo";
import type { FeatureActor } from "@/types/contracts/tasks";
export const assistantAvailable =
  DEMO_MODE || process.env.NEXT_PUBLIC_FEATURE_ASSISTANT_API !== "false";
export const getAssistant = (actor: FeatureActor) =>
  DEMO_MODE ? assistantDemo(actor) : assistantApi;

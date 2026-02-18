import type { WOPRPlugin, WOPRPluginContext } from "@wopr-network/plugin-types";
import { buildNotifyA2ATools } from "./notify-a2a-tools.js";

const plugin: WOPRPlugin = {
  name: "wopr-plugin-notify",
  version: "1.0.0",
  description: "Notification plugin — sends notifications to configured channels via A2A tool",

  async init(ctx: WOPRPluginContext) {
    if (ctx.registerA2AServer) {
      ctx.registerA2AServer(buildNotifyA2ATools(ctx));
    }
    ctx.log.info("Notify plugin initialized");
  },

  async shutdown() {
    // No resources to clean up
  },
};

export default plugin;

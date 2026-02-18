import { vi, describe, it, expect, beforeEach } from "vitest";

const mockCtx = {
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  registerA2AServer: vi.fn(),
  events: {
    emitCustom: vi.fn().mockResolvedValue(undefined),
  },
};

describe("wopr-plugin-notify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("plugin init and shutdown", () => {
    it("should export a valid plugin with name, version, and description", async () => {
      const { default: plugin } = await import("../src/index.js");
      expect(plugin.name).toBe("wopr-plugin-notify");
      expect(plugin.version).toBe("1.0.0");
      expect(plugin.description).toContain("Notification");
    });

    it("should register A2A server on init", async () => {
      const { default: plugin } = await import("../src/index.js");
      await plugin.init(mockCtx as any);
      expect(mockCtx.registerA2AServer).toHaveBeenCalledTimes(1);
      const serverConfig = mockCtx.registerA2AServer.mock.calls[0][0];
      expect(serverConfig.name).toBe("notify");
      expect(serverConfig.version).toBe("1.0.0");
    });

    it("should skip A2A registration when registerA2AServer is undefined", async () => {
      const ctxNoA2A = { ...mockCtx, registerA2AServer: undefined };
      const { default: plugin } = await import("../src/index.js");
      await plugin.init(ctxNoA2A as any);
      // Should not throw
    });

    it("should log info on init", async () => {
      const { default: plugin } = await import("../src/index.js");
      await plugin.init(mockCtx as any);
      expect(mockCtx.log.info).toHaveBeenCalledWith("Notify plugin initialized");
    });

    it("should shutdown without errors", async () => {
      const { default: plugin } = await import("../src/index.js");
      await expect(plugin.shutdown()).resolves.toBeUndefined();
    });
  });

  describe("notify A2A tools", () => {
    it("should register one tool: notify", async () => {
      const { buildNotifyA2ATools } = await import("../src/notify-a2a-tools.js");
      const config = buildNotifyA2ATools(mockCtx as any);
      expect(config.tools).toHaveLength(1);
      expect(config.tools[0].name).toBe("notify");
    });

    it("should have valid tool schema", async () => {
      const { buildNotifyA2ATools } = await import("../src/notify-a2a-tools.js");
      const config = buildNotifyA2ATools(mockCtx as any);
      const tool = config.tools[0];

      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema.type).toBe("object");
      expect(tool.inputSchema.properties).toHaveProperty("message");
      expect(tool.inputSchema.properties).toHaveProperty("level");
      expect(tool.inputSchema.properties).toHaveProperty("channel");
      expect(tool.inputSchema.required).toContain("message");
      expect(typeof tool.handler).toBe("function");
    });
  });

  describe("notify handler", () => {
    it("should send notification with default level 'info'", async () => {
      const { buildNotifyA2ATools } = await import("../src/notify-a2a-tools.js");
      const config = buildNotifyA2ATools(mockCtx as any);
      const handler = config.tools[0].handler;

      const result = await handler({ message: "Test notification" });
      expect(mockCtx.log.info).toHaveBeenCalledWith("[NOTIFY] Test notification");
      expect(mockCtx.events.emitCustom).toHaveBeenCalledWith("notification:send", {
        message: "Test notification",
        level: "info",
        channel: undefined,
      });
      expect(result.content[0].text).toBe(
        "Notification sent: [INFO] Test notification",
      );
    });

    it("should use warn log level for warn notifications", async () => {
      const { buildNotifyA2ATools } = await import("../src/notify-a2a-tools.js");
      const config = buildNotifyA2ATools(mockCtx as any);
      const handler = config.tools[0].handler;

      const result = await handler({ message: "Warning!", level: "warn" });
      expect(mockCtx.log.warn).toHaveBeenCalledWith("[NOTIFY] Warning!");
      expect(result.content[0].text).toBe("Notification sent: [WARN] Warning!");
    });

    it("should use error log level for error notifications", async () => {
      const { buildNotifyA2ATools } = await import("../src/notify-a2a-tools.js");
      const config = buildNotifyA2ATools(mockCtx as any);
      const handler = config.tools[0].handler;

      const result = await handler({ message: "Something broke", level: "error" });
      expect(mockCtx.log.error).toHaveBeenCalledWith(
        "[NOTIFY] Something broke",
      );
      expect(result.content[0].text).toBe(
        "Notification sent: [ERROR] Something broke",
      );
    });

    it("should default unknown levels to info", async () => {
      const { buildNotifyA2ATools } = await import("../src/notify-a2a-tools.js");
      const config = buildNotifyA2ATools(mockCtx as any);
      const handler = config.tools[0].handler;

      const result = await handler({ message: "Debug msg", level: "debug" });
      expect(mockCtx.log.info).toHaveBeenCalledWith("[NOTIFY] Debug msg");
      expect(result.content[0].text).toBe("Notification sent: [DEBUG] Debug msg");
    });

    it("should pass channel to event emission", async () => {
      const { buildNotifyA2ATools } = await import("../src/notify-a2a-tools.js");
      const config = buildNotifyA2ATools(mockCtx as any);
      const handler = config.tools[0].handler;

      await handler({
        message: "Channel test",
        level: "info",
        channel: "discord-general",
      });
      expect(mockCtx.events.emitCustom).toHaveBeenCalledWith("notification:send", {
        message: "Channel test",
        level: "info",
        channel: "discord-general",
      });
    });

    it("should emit notification:send event with correct payload", async () => {
      const { buildNotifyA2ATools } = await import("../src/notify-a2a-tools.js");
      const config = buildNotifyA2ATools(mockCtx as any);
      const handler = config.tools[0].handler;

      await handler({ message: "Event test", level: "error", channel: "alerts" });
      expect(mockCtx.events.emitCustom).toHaveBeenCalledTimes(1);
      expect(mockCtx.events.emitCustom).toHaveBeenCalledWith("notification:send", {
        message: "Event test",
        level: "error",
        channel: "alerts",
      });
    });

    it("should return content array with text type", async () => {
      const { buildNotifyA2ATools } = await import("../src/notify-a2a-tools.js");
      const config = buildNotifyA2ATools(mockCtx as any);
      const handler = config.tools[0].handler;

      const result = await handler({ message: "Format test" });
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
    });
  });
});

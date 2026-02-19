# @wopr-network/wopr-plugin-notify

> Notification plugin for WOPR — agents can push alerts and updates to configured notification channels.

## Install

```bash
npm install @wopr-network/wopr-plugin-notify
```

## Usage

```bash
wopr plugin install github:wopr-network/wopr-plugin-notify
```

Then configure via `wopr configure --plugin @wopr-network/wopr-plugin-notify`.

## Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `channels` | array | Yes | List of notification channels to send to |
| `default_channel` | string | No | Default channel when none is specified |

## What it does

The notify plugin registers a `notify` A2A tool that allows WOPR agents to proactively send notifications to users through configured channels (Discord, Slack, webhooks, etc.). Agents can trigger notifications mid-task to alert users about completed work, errors, or time-sensitive events without waiting for the user to check in.

## License

MIT

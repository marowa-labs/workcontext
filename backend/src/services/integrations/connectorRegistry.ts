/**
 * Connector Registry — central registry of all available tool connectors.
 * Provides lookup by tool type and handles the OAuth callback routing.
 */

import { ConnectorBase, ToolType } from "./connectorBase";
import { SlackConnector } from "./slackConnector";
import { NotionConnector } from "./notionConnector";
import { JiraConnector } from "./jiraConnector";
import { GitHubConnector } from "./githubConnector";
import { GitHubAppConnector } from "./githubAppConnector";
import { FigmaConnector } from "./figmaConnector";

const connectors = new Map<ToolType, ConnectorBase>();

export function registerConnectors(): void {
  const instances: ConnectorBase[] = [
    new SlackConnector(),
    new NotionConnector(),
    new JiraConnector(),
    new GitHubConnector(),
    new GitHubAppConnector(),
    new FigmaConnector(),
  ];
  for (const c of instances) {
    connectors.set(c.toolType, c);
  }
}

export function getConnector(toolType: ToolType): ConnectorBase | undefined {
  return connectors.get(toolType);
}

export function getAllConnectors(): ConnectorBase[] {
  return Array.from(connectors.values());
}

export function getToolTypes(): ToolType[] {
  return Array.from(connectors.keys());
}

// Initialize on import
registerConnectors();

import React from "react";
import { AppConfig } from "@/lib/config";
import { WidgetType } from "@/types";

export interface WidgetDefinition<TProps = any> {
  type: WidgetType;
  component: React.ComponentType<TProps>;
  isEnabled: (config: AppConfig) => boolean;
  getProps: (config: AppConfig) => TProps;
  grid: {
    w: number;
    h: number;
    minW?: number;
    minH?: number;
  };
  options?: {
    defaultX?: number;
    defaultY?: number;
    defaultId?: string;
  };
}

export class WidgetRegistry {
  private static widgets: Map<WidgetType, WidgetDefinition> = new Map();

  static register(definition: WidgetDefinition) {
    this.widgets.set(definition.type, definition);
  }

  static get(type: WidgetType): WidgetDefinition | undefined {
    return this.widgets.get(type);
  }

  static getAll(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }
}

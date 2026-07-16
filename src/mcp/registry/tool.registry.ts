export interface MCPTool<TArgs = unknown, TResult = unknown> {

    name: string;

    description: string;

    execute(args: TArgs): Promise<TResult>;

}

export class ToolRegistry {

    private tools = new Map<string, MCPTool>();

    register(tool: MCPTool): void {

        this.tools.set(tool.name, tool);

    }

    get(name: string): MCPTool | undefined {

        return this.tools.get(name);

    }

    getAll(): MCPTool[] {

        return [...this.tools.values()];

    }

}

export const toolRegistry = new ToolRegistry();

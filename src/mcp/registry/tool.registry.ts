export interface MCPTool {

    name: string;

    description: string;

    execute(args: any): Promise<any>;

}

export class ToolRegistry {

    private tools = new Map<string, MCPTool>();

    register(tool: MCPTool) {

        this.tools.set(tool.name, tool);

    }

    get(name: string) {

        return this.tools.get(name);

    }

    getAll() {

        return [...this.tools.values()];

    }

}

export const toolRegistry = new ToolRegistry();
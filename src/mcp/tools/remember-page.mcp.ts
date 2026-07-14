import { MCPTool } from "../registry/tool.registry.js";
import { rememberPage } from "../../tools/remember-page.tool.js";

export const RememberPageTool: MCPTool = {

    name: "remember_page",

    description: "Remember the current application page.",

    async execute(args) {

        return await rememberPage(args.url);

    }

};
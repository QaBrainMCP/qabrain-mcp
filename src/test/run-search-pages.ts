import { SearchPagesTool } from "../mcp/tools/search-pages.tool.js";

async function main() {
    const resp = await SearchPagesTool.execute({ query: "Login" } as any);
    console.log(JSON.stringify(resp, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });

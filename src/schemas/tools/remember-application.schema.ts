export const RememberApplicationSchema = {
    name: "remember_application",

    description:
        "Remember an application by scanning it and storing its knowledge.",

    inputSchema: {
        type: "object",

        properties: {

            applicationName: {
                type: "string",
                description: "Application name"
            },

            url: {
                type: "string",
                description: "Application URL"
            }

        },

        required: [
            "applicationName",
            "url"
        ]
    }
};
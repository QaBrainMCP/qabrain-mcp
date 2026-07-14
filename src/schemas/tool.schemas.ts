export const OpenUrlSchema = {
    type: "object",
    properties: {
        url: {
            type: "string"
        }
    },
    required: ["url"]
};
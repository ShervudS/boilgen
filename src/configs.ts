export const MESSAGES = {
  ERROR_NOT_FOUND_TEMPLATES:
    "No templates found. A default template file has been created in .vscode.",
  ERROR_NOT_SELECTED_FOLDER: "No folder selected and no workspace open.",
  ERROR_NOT_OPEN_WORKSPACE: "No workspace folder open",
  ERROR_INVALID_JSON: "Invalid JSON in templates.",
} as const;

export const COMMAND = {
  GENERATE_FROM_TEMPLATE: "boilgen.generateFromTemplate",
} as const;

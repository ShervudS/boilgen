# Boilgen

**Boilgen** is a powerful VS Code extension that helps you instantly generate folders, files, and boilerplate structures using customizable JSON templates.

Whether you're working with components, hooks, pages, or anything else — Boilgen lets you scaffold your project with a single right-click.

---

## 🚀 Features

- 🧱 Generate entire folder structures from templates
- ⚡ Trigger with right-click in the Explorer or via hotkey
- 🧩 Use placeholder variables like `$TM_FILENAME_BASE` in filenames and file contents
- 📁 Supports nested folders like `styles/$TM_FILENAME_BASE.scss`, `ui/$TM_FILENAME_BASE.tsx`
- 📄 Auto-creates `.vscode/component-generator.templates.json` if missing
- ✨ Customizable via project-level or global configuration
- 🧠 Fallback to built-in templates (no setup required)

> Tip: You can define multiple entity types like `Component`, `Page`, `Hook` and use different templates for each.

---

## ⚙️ Requirements

None — Boilgen works out of the box with any project.

---

## 🛠 Extension Settings

This extension contributes the following settings:

| Setting                              | Description                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `componentGenerator.templatesPath`   | Path to the JSON file with templates (default: `.vscode/component-generator.templates.json`) |
| `componentGenerator.defaultTemplate` | Default template name to use if not selected manually                                        |
| `componentGenerator.componentsPath`  | (optional) Path where components should be generated                                         |

---

## 🧩 Template Variables

Boilgen supports snippet-style variables, similar to VS Code User Snippets.

You can use the following variables inside your template files and filenames:

- `$TM_FILENAME`
- `$TM_FILENAME_BASE`
- `$TM_DIRECTORY`
- `$TM_FILEPATH`
- `$RELATIVE_FILEPATH`
- `$WORKSPACE_NAME`
- `$WORKSPACE_FOLDER`
- `$CURRENT_YEAR`, `$CURRENT_YEAR_SHORT`
- `$CURRENT_MONTH`, `$CURRENT_MONTH_NAME`, `$CURRENT_MONTH_NAME_SHORT`
- `$CURRENT_DATE`
- `$CURRENT_DAY_NAME`, `$CURRENT_DAY_NAME_SHORT`
- `$CURRENT_HOUR`, `$CURRENT_MINUTE`, `$CURRENT_SECOND`
- `$CURRENT_SECONDS_UNIX`
- `$CURRENT_TIMEZONE_OFFSET`

## 📦 Template Format

Create or edit the JSON template file at:

```json
{
  "Component": {
    "default": {
      "index.ts": ["export * from './ui/$TM_FILENAME_BASE.tsx';"],
      "ui/$TM_FILENAME_BASE.tsx": [
        "import React from 'react';",
        "",
        "export const $TM_FILENAME_BASE = () => <div>$TM_FILENAME_BASE</div>;"
      ],
      "styles/$TM_FILENAME_BASE.module.scss": [".wrapper { display: flex; }"]
    }
  }
}
```

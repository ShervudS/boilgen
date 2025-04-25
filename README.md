# Boilgen

**Boilgen** is a powerful VS Code extension that helps you instantly generate folders, files, and boilerplate structures using customizable JSON templates.

Whether you're working with components, hooks, pages, or anything else — Boilgen lets you scaffold your project with a single right-click.

---

## 🚀 Features

- 🧱 Generate entire folder structures from templates
- ⚡ Trigger with right-click in the Explorer or via hotkey
- 🧩 Use placeholder variables like `{name}` in filenames and file contents
- 📁 Supports nested folders like `styles/{name}.scss`, `ui/{name}.tsx`
- 📄 Auto-creates `.vscode/component-generator.templates.json` if missing
- ✨ Customizable via project-level or global configuration
- 🧠 Fallback to built-in templates (no setup required)

<!-- ![Boilgen Example](images/boilgen-demo.gif) -->

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

## 📦 Template Format

Create or edit the JSON template file at:

```json
{
  "Component": {
    "default": {
      "index.ts": ["export * from './ui/{name}';"],
      "ui/{name}.tsx": [
        "import React from 'react';",
        "",
        "export const {name} = () => <div>{name}</div>;"
      ],
      "styles/{name}.module.scss": [".wrapper { display: flex; }"]
    }
  }
}
```

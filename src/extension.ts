import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

type Template = Record<string, string[]>;
type TemplateGroup = Record<string, Template>;

function getTemplates(templatesPath: string): TemplateGroup | null {
  if (!fs.existsSync(templatesPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(templatesPath, "utf-8");
    return JSON.parse(raw) as TemplateGroup;
  } catch (error) {
    vscode.window.showErrorMessage("Invalid JSON in templates.");
    return null;
  }
}

function createDefaultTemplatesFile(targetPath: string) {
  const defaultContent = `{
  "Component": {
    "default": {
      "styles.module.scss": [
        ""
      ],
      "{name}.tsx": [
        "import React from 'react';",
        "",
        "import styles from './styles.module.scss'",
        "",
        "export const {name} = () => {",
        "  return <div>{name}</div>;",
        "};"
      ],
      "__tests__/buildName.spec.ts":[
        ""
      ],
      "types.ts": [
        ""
      ],
      "index.ts": [
        "export \{{name}\} from './{name}';"
      ]
    }
  }
}`;
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, defaultContent, "utf-8");
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "boilgen.generateFromTemplate",
    async (uri: vscode.Uri) => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder open");
        return;
      }

      const config = vscode.workspace.getConfiguration("boilgen");
      const userTemplatesPath = config.get<string>("templatesPath");

      const defaultTemplatesPath = path.join(
        context.extensionPath,
        "templates",
        "boilgen.templates.json"
      );

      const templatesPath = userTemplatesPath
        ? path.isAbsolute(userTemplatesPath)
          ? userTemplatesPath
          : path.join(workspaceFolder, userTemplatesPath)
        : defaultTemplatesPath;

      let templates = getTemplates(templatesPath);

      if (!templates) {
        if (templatesPath.includes(".vscode")) {
          createDefaultTemplatesFile(templatesPath);
          vscode.window.showWarningMessage(
            "No templates found. A default template file has been created in .vscode."
          );
          const doc = await vscode.workspace.openTextDocument(templatesPath);
          await vscode.window.showTextDocument(doc);
          return;
        } else {
          vscode.window.showErrorMessage(
            `No templates found at ${templatesPath}`
          );
          return;
        }
      }

      const entityType = await vscode.window.showQuickPick(
        Object.keys(templates),
        {
          placeHolder:
            "What do you want to generate? (e.g. Component, Page, Hook)",
        }
      );
      if (!entityType) {
        return;
      }

      const typeTemplates = templates[entityType];
      const selectedTemplateName = await vscode.window.showQuickPick(
        Object.keys(typeTemplates),
        {
          placeHolder: `Choose a ${entityType} template`,
        }
      );
      if (!selectedTemplateName) {
        return;
      }

      const componentName = await vscode.window.showInputBox({
        prompt: `Enter ${entityType} name`,
        placeHolder: `My${entityType}`,
      });
      if (!componentName) {
        return;
      }

      const selectedTemplate = typeTemplates[
        selectedTemplateName
      ] as unknown as Template;
      const targetDir = path.join(uri.fsPath, componentName);

      if (fs.existsSync(targetDir)) {
        vscode.window.showWarningMessage(
          `${entityType} '${componentName}' already exists.`
        );
        return;
      }

      fs.mkdirSync(targetDir, { recursive: true });

      for (const [fileNameTemplate, contentLines] of Object.entries(
        selectedTemplate
      )) {
        const parsedFileName = fileNameTemplate.replace(
          "{name}",
          componentName
        );
        const parsedContent = contentLines
          .map((line: string) => line.replace(/{name}/g, componentName))
          .join("\n");

        const filePath = path.join(targetDir, parsedFileName);
        const fileDir = path.dirname(filePath);

        fs.mkdirSync(fileDir, { recursive: true }); // 💥 создаём вложенные папки
        fs.writeFileSync(filePath, parsedContent);
      }

      vscode.window.showInformationMessage(
        `${entityType} '${componentName}' created using '${selectedTemplateName}' template.`
      );

      vscode.window.showInformationMessage(
        `${entityType} '${componentName}' created using '${selectedTemplateName}' template.`
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

type Template = Record<string, string[]>;
type TemplateGroup = Record<string, Template>;

/**
 * Reads and parses the templates JSON file.
 * @param templatesPath - Absolute path to the templates file.
 * @returns Parsed templates object or null if the file doesn't exist or is invalid.
 */
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

/**
 * Replaces snippet-style variables in a template string with actual values.
 * @param input - String containing snippet variables.
 * @param context - Context containing the target directory path.
 * @returns A string with replaced variables.
 */
async function replaceSnippetVars(
  input: string,
  context: { targetDir: string }
): Promise<string> {
  const now = new Date();

  const workspaceFolder =
    vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? "";
  const workspaceName = vscode.workspace.name ?? "";

  const targetDir = context.targetDir;
  const filename = path.basename(targetDir);
  const filepath = path.join(targetDir, filename);

  const vars: Record<string, string> = {
    TM_FILENAME: filename,
    TM_FILENAME_BASE: filename.replace(path.extname(filename), ""),
    TM_DIRECTORY: targetDir,
    TM_FILEPATH: filepath,
    RELATIVE_FILEPATH: path.relative(workspaceFolder, filepath),
    WORKSPACE_NAME: workspaceName,
    WORKSPACE_FOLDER: workspaceFolder,
    CURRENT_YEAR: `${now.getFullYear()}`,
    CURRENT_YEAR_SHORT: `${now.getFullYear()}`.slice(-2),
    CURRENT_MONTH: `${now.getMonth() + 1}`.padStart(2, "0"),
    CURRENT_MONTH_NAME: now.toLocaleDateString(undefined, { month: "long" }),
    CURRENT_MONTH_NAME_SHORT: now.toLocaleDateString(undefined, {
      month: "short",
    }),
    CURRENT_DATE: `${now.getDate()}`.padStart(2, "0"),
    CURRENT_DAY_NAME: now.toLocaleDateString(undefined, { weekday: "long" }),
    CURRENT_DAY_NAME_SHORT: now.toLocaleDateString(undefined, {
      weekday: "short",
    }),
    CURRENT_HOUR: `${now.getHours()}`.padStart(2, "0"),
    CURRENT_MINUTE: `${now.getMinutes()}`.padStart(2, "0"),
    CURRENT_SECOND: `${now.getSeconds()}`.padStart(2, "0"),
    CURRENT_SECONDS_UNIX: Math.floor(now.getTime() / 1000).toString(),
    CURRENT_TIMEZONE_OFFSET: now.toString().match(/GMT([+-]\d+)/)?.[1] ?? "",
  };

  return input.replace(/\$([A-Z_]+)/g, (_, varName) => vars[varName] ?? "");
}

/**
 * Creates a default template file with sample content.
 * @param targetPath - Path where the template file should be created.
 */

function createDefaultTemplatesFile(targetPath: string) {
  const defaultContent = `{
  "Component": {
    "default": {
      "styles.module.scss": [
        ""
      ],
      "$TM_FILENAME_BASE.tsx": [
        "import React from 'react';",
        "",
        "import styles from './styles.module.scss'",
        "",
        "export const $TM_FILENAME_BASE = () => {",
        "  return <div>$TM_FILENAME_BASE</div>;",
        "};"
      ],
      "__tests__/buildName.spec.ts":[
        ""
      ],
      "types.ts": [
        ""
      ],
      "index.ts": [
        "export {$TM_FILENAME_BASE} from './$TM_FILENAME_BASE';"
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

      /**
       * Read extension configuration from settings
       */
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

      /**
       * Load and parse templates
       */
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

      /**
       *  Ask the user to select the type of entity to generate (Component, Page, etc.)
       */
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
      /**
       *  Ask the user to select one of the available templates for that type
       */
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

      const baseDir =
        uri?.fsPath ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

      if (!baseDir) {
        vscode.window.showErrorMessage(
          "No folder selected and no workspace open."
        );
        return;
      }

      const targetDir = path.join(baseDir, componentName);

      if (fs.existsSync(targetDir)) {
        vscode.window.showWarningMessage(
          `${entityType} '${componentName}' already exists.`
        );
        return;
      }

      /**
       *  Create the base directory for the new entity
       */
      fs.mkdirSync(targetDir, { recursive: true });
      /**
       * Loop to create template file, replace variables, and write to disk
       */
      for (const [fileNameTemplate, contentLines] of Object.entries(
        selectedTemplate
      )) {
        const parsedFileName = (
          await replaceSnippetVars(fileNameTemplate, {
            targetDir,
          })
        ).replace(/\\/g, "/");

        const parsedLines = await Promise.all(
          contentLines.map((line) =>
            replaceSnippetVars(line, {
              targetDir,
            })
          )
        );

        const parsedContent = parsedLines.join("\n");

        const filePath = path.join(targetDir, parsedFileName);
        const fileDir = path.dirname(filePath);

        fs.mkdirSync(fileDir, { recursive: true });
        fs.writeFileSync(filePath, parsedContent);
      }

      vscode.window.showInformationMessage(
        `${entityType} '${componentName}' created using '${selectedTemplateName}' template.`
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

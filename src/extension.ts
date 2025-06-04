import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import {
  createDefaultTemplatesFile,
  getBaseDirPath,
  getResolvedTargetFilePath,
  getTemplateContent,
  getTemplates,
  isValidFilePath,
  resolveTemplatesPath,
  writeFileWithDirsExtended,
} from "./utils";

import { COMMAND, MESSAGES } from "./configs";

import type { Template } from "./types";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    COMMAND.GENERATE_FROM_TEMPLATE,
    async (uri: vscode.Uri) => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

      if (!workspaceFolder) {
        vscode.window.showErrorMessage(MESSAGES.ERROR_NOT_OPEN_WORKSPACE);
        return;
      }

      const templatesPath = resolveTemplatesPath(context, workspaceFolder);

      /**
       * Load and parse templates
       */
      let templates = getTemplates(templatesPath);

      if (!templates) {
        if (templatesPath.includes(".vscode")) {
          createDefaultTemplatesFile(templatesPath);
          vscode.window.showWarningMessage(MESSAGES.ERROR_NOT_FOUND_TEMPLATES);

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

      const baseDir = await getBaseDirPath(uri);

      if (!baseDir) {
        vscode.window.showErrorMessage(MESSAGES.ERROR_NOT_SELECTED_FOLDER);
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
        if (!isValidFilePath(fileNameTemplate)) {
          vscode.window.showErrorMessage(
            `Invalid file path in template: ${fileNameTemplate}`
          );
          continue;
        }

        const targetFilePath = await getResolvedTargetFilePath(
          fileNameTemplate,
          targetDir
        );

        const compiledTemplateContent = await getTemplateContent(contentLines, {
          targetDir,
        });

        writeFileWithDirsExtended(targetFilePath, (finalPath) => {
          fs.writeFileSync(finalPath, compiledTemplateContent);
        });
      }

      vscode.window.showInformationMessage(
        `${entityType} '${componentName}' created using '${selectedTemplateName}' template.`
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

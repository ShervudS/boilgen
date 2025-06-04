import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

import { MESSAGES } from "../configs";

import type { TemplateGroup } from "../types";

/**
 * Replaces snippet-style variables in a template string with actual values.
 * @param input - String containing snippet variables.
 * @param context - Context containing the target directory path.
 * @returns A string with replaced variables.
 */
export const replaceSnippetVars = async (
  input: string,
  context: { targetDir: string }
): Promise<string> => {
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
};

/**
 * Creates a default template file with sample content.
 * @param targetPath - Path where the template file should be created.
 */
export const createDefaultTemplatesFile = (targetPath: string) => {
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
        "export { $TM_FILENAME_BASE } from './$TM_FILENAME_BASE';"
      ]
    }
  }
}`;
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, defaultContent, "utf-8");
};

export const isValidFilePath = (name: string): boolean =>
  typeof name === "string" && !/[<>:"|?*]/.test(name);

export const writeFileWithDirsExtended = (
  fullPath: string,
  onFile: (filePath: string) => void
) => {
  const segments = fullPath.split(path.sep);

  function walk(segments: string[], index = 0, currentPath = "") {
    if (index >= segments.length) {
      return;
    }

    const segment = segments[index];
    currentPath = path.join(currentPath, segment);

    if (path.extname(segment) !== "") {
      onFile(currentPath);
      return;
    }

    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
    }

    walk(segments, index + 1, currentPath);
  }

  walk(segments);
};

/**
 * Resolves the full path to the templates file, based on user config or defaults.
 *
 * @param context - The extension context.
 * @param workspaceFolder - The root workspace folder path.
 * @returns Absolute path to the templates JSON file.
 */
export const resolveTemplatesPath = (
  context: vscode.ExtensionContext,
  workspaceFolder: string
): string => {
  const config = vscode.workspace.getConfiguration("boilgen");
  const userTemplatesPath = config.get<string>("templatesPath");

  const defaultTemplatesPath = path.join(
    context.extensionPath,
    "templates",
    "boilgen.templates.json"
  );

  if (!userTemplatesPath) {
    return defaultTemplatesPath;
  }

  return path.isAbsolute(userTemplatesPath)
    ? userTemplatesPath
    : path.join(workspaceFolder, userTemplatesPath);
};

export const getBaseDirPath = async (uri: vscode.Uri | undefined) => {
  if (uri?.fsPath) {
    return uri.fsPath;
  }

  const userClipboardData = await vscode.env.clipboard.readText();

  await vscode.commands.executeCommand("copyFilePath");

  const filePath = await vscode.env.clipboard.readText();

  await vscode.env.clipboard.writeText(userClipboardData);

  return filePath;
};

/**
 * Reads and parses the templates JSON file.
 * @param templatesPath - Absolute path to the templates file.
 * @returns Parsed templates object or null if the file doesn't exist or is invalid.
 */
export const getTemplates = (templatesPath: string): TemplateGroup | null => {
  if (!fs.existsSync(templatesPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(templatesPath, "utf-8");
    return JSON.parse(raw) as TemplateGroup;
  } catch (error) {
    vscode.window.showErrorMessage(MESSAGES.ERROR_INVALID_JSON);
    return null;
  }
};

export const getTemplateContent = async (
  contentLines: string[],
  context: { targetDir: string }
) => {
  const parsedLines = await Promise.all(
    contentLines.map((line) => replaceSnippetVars(line, context))
  );
  return parsedLines.join("\n");
};

export const getResolvedTargetFilePath = (
  fileNameTemplate: string,
  targetDir: string
): Promise<string> =>
  replaceSnippetVars(fileNameTemplate, { targetDir })
    .then((relPath) => relPath.replace(/\\/g, "/"))
    .then((relPath) => path.join(targetDir, relPath));

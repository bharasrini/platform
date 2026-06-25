import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";


export default defineConfig([
	{
	ignores: [".vscode/**", "node_modules/**", "dist/**", "eslint.config.mjs", "package-lock.json"]
	},	
	// Base JS config
  	{
		files: ["**/*.{js,mjs,cjs}"], 
		plugins: { js, "@typescript-eslint": tseslint.plugin }, 
		extends: ["js/recommended"], 
		languageOptions: 
		{
			globals: 
			{
				...globals.node,
    			...globals.browser
			},
			ecmaVersion: 2022, 
			sourceType: "commonjs",
			parser: tseslint.parser,
			parserOptions:
			{
				project: "./tsconfig.json"
			}
		},
		rules:
		{
			"@typescript-eslint/no-floating-promises": "error",
			"no-useless-assignment": "off",
			"no-unused-vars": 
			["error", 
			{
				"argsIgnorePattern": "^_",
				"varsIgnorePattern": "^_",
				"caughtErrorsIgnorePattern": "^_"
			}]
		}
	},
	{
		files: ["**/*.json"],
		plugins: { json },
		language: "json/json",
		extends: ["json/recommended"] 
	},
	{
		files: ["**/*.jsonc"],
		plugins: { json },
		language: "json/jsonc",
		extends: ["json/recommended"] 
	},
	{
		files: ["**/*.json5"],
		plugins: { json },
		language: "json/json5",
		extends: ["json/recommended"] 
	},
	{
		files: ["**/*.md"],
		plugins: { markdown },
		language: "markdown/commonmark",
		extends: ["markdown/recommended"] 
	},
	{
		files: ["**/*.css"],
		plugins: { css },
		language: "css/css",
		extends: ["css/recommended"] 
	},
]);


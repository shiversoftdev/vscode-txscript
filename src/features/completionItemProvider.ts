"use strict";
import * as vscode from "vscode";

import * as funcDefs from "../defs/defs";
import * as fieldDefs from "../defs/field";
import * as keywordDefs from "../defs/keyword";

// provides function completion
export class FunctionProvider {
	functions: vscode.CompletionItem[];

	// generate completion items for the hardcoded functions
	constructor (extensionPath: string) {
		this.functions = new Array<vscode.CompletionItem>();

		for (let idef of funcDefs.defs) {
			let def: vscode.CompletionItem = new vscode.CompletionItem(idef.name);
			def.detail = idef.decl;
			def.insertText = new vscode.SnippetString(idef.insert);
			def.documentation = idef.desc + "\r\n\r\n" + idef.example;
			def.kind = vscode.CompletionItemKind.Function;
			this.functions.push(def);
		}
	}

	provideCompletionItems(document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext): Thenable<vscode.CompletionItem[]> | vscode.CompletionItem[] {
		//
		// present the user with a list of common GSC / CSC functions
		//
		return new Promise<vscode.CompletionItem[]>((resolve, reject) => {
			// dynamically resolved completion items
			let funcItems: vscode.CompletionItem[] = [];

			if (vscode.workspace.getConfiguration("vscode-codscript").get("use_builtin_completionItems", true)) {
				// fallback to just using the built-in completion items if no dynamic ones were found
				if (!funcItems.length) {
					resolve(this.functions);
				}

				resolve(this.functions.concat(funcItems));
			}

			// use the non-builtin results (current none)
			resolve(funcItems);
		});
	}
}

export class NamespaceProvider {
	props: vscode.CompletionItem[];

	// generate completion items for the hardcoded functions
	constructor (extensionPath : string) {
		this.props = new Array<vscode.CompletionItem>();

		let namespaces = new Set<string>();
		for (let imp of funcDefs.defImports)
		{
			namespaces.add(imp._namespace);
		}
		
		for (let space of namespaces) {
			let def: vscode.CompletionItem = new vscode.CompletionItem(space);
			def.kind = vscode.CompletionItemKind.Class;
			this.props.push(def);
		}
	}

	provideCompletionItems(document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext): Thenable<vscode.CompletionItem[]> | vscode.CompletionItem[] {

		//
		// namespaces
		//
		return new Promise<vscode.CompletionItem[]>((resolve, reject) => {
			// don't provide completion unless it's enabled
			if (!vscode.workspace.getConfiguration("vscode-codscript").get("use_builtin_completionItems", true)) {
				reject();
				return;
			}

			// dynamically resolved completion items
			let propItems: vscode.CompletionItem[] = [];
			if (propItems.length) {
				resolve(this.props.concat(propItems));
			}
			resolve(this.props);
		});
	}
}

export class ImportProvider {
	functions: vscode.CompletionItem[];
	importDefs: { [key: string]: vscode.CompletionItem[]; } = {};

	// generate completion items for the hardcoded functions
	constructor (extensionPath: string) {
		this.functions = new Array<vscode.CompletionItem>();

		for(let idef of funcDefs.defImports)
		{
			if(this.importDefs[idef._namespace] == undefined)
			{
				this.importDefs[idef._namespace] = [];
			}

			let def: vscode.CompletionItem = new vscode.CompletionItem(idef.name);
			def.detail = idef.header;
			def.insertText = new vscode.SnippetString(idef.insert);
			def.documentation = "#using " + idef.script + ";";
			def.kind = vscode.CompletionItemKind.Function;
			this.importDefs[idef._namespace].push(def);
		}
	}

	isAlphaNumeric(str: string) {
		var code, i, len;
	  
		for (i = 0, len = str.length; i < len; i++) {
		  code = str.charCodeAt(i);
		  if (!(code > 47 && code < 58) && // numeric (0-9)
			  !(code > 64 && code < 91) && // upper alpha (A-Z)
			  !(code > 96 && code < 123) && code != 95) { // lower alpha (a-z) and _
			return false;
		  }
		}
		return true;
	  };

	provideCompletionItems(document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext): Thenable<vscode.CompletionItem[]> | vscode.CompletionItem[] {
		//
		// present the user with a list of common GSC / CSC functions
		//
		return new Promise<vscode.CompletionItem[]>((resolve, reject) => {
			// dynamically resolved completion items

			// don't provide the property completionItems unless we were activated by the trigger character
			if (context.triggerKind !== vscode.CompletionTriggerKind.TriggerCharacter) 
			{
				reject();
				return;
			}

			if (vscode.workspace.getConfiguration("vscode-codscript").get("use_builtin_completionItems", true)) 
			{
				if(position.character < 1)
				{
					reject();
					return;
				}

				let currentLine = document.lineAt(position.line).text;
				let end = position.character;

				if(end < 1 || currentLine.charAt(end) != ":" && currentLine.charAt(end - 1) != ":" && !this.isAlphaNumeric(currentLine.charAt(end)))
				{
					reject();
					return;
				}

				if(!this.isAlphaNumeric(currentLine.charAt(end)) && currentLine.charAt(end - 1) == ":")
				{
					end--;
				}

				while(end > 0 && this.isAlphaNumeric(currentLine.charAt(end)))
				{
					end--;
				}

				if(end <= 1 || currentLine.charAt(end) != ':' || currentLine.charAt(end - 1) != ':')
				{
					reject();
					return;
				}

				let start = end - 2;
				while(start > -1 && this.isAlphaNumeric(currentLine.charAt(start)))
				{
					start--;
				}

				if(start < 0)
				{
					start = 0;
				}

				if(start >= end - 1)
				{
					reject();
					return;
				}

				if(!this.isAlphaNumeric(currentLine.charAt(start)))
				{
					start++;
				}

				var ns = currentLine.substring(start, end - 1).toLowerCase();

				if(ns in this.importDefs)
				{
					resolve(this.importDefs[ns]);
				}

				reject();
			}

			reject();
		});
	}
}

export class PropertyProvider {
	props: vscode.CompletionItem[];

	// generate completion items for the hardcoded functions
	constructor (extensionPath : string) {
		this.props = new Array<vscode.CompletionItem>();

		for (let fdef of fieldDefs.fields) {
			let def: vscode.CompletionItem = new vscode.CompletionItem(fdef.toString());
			def.kind = vscode.CompletionItemKind.Field;
			this.props.push(def);
		}
	}

	provideCompletionItems(document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext): Thenable<vscode.CompletionItem[]> | vscode.CompletionItem[] {


		//
		// present the user with a list of common GSC / CSC functions
		//
		return new Promise<vscode.CompletionItem[]>((resolve, reject) => {
			// don't provide completion unless it's enabled
			if (!vscode.workspace.getConfiguration("vscode-codscript").get("use_builtin_completionItems", true)) {
				reject();
				return;
			}

			// don't provide the property completionItems unless we were activated by the trigger character
			if (context.triggerKind !== vscode.CompletionTriggerKind.TriggerCharacter) {
				reject();
				return;
			}

			// dynamically resolved completion items
			let propItems: vscode.CompletionItem[] = [];
			if (propItems.length) {
				resolve(this.props.concat(propItems));
			}
			resolve(this.props);
		});
	}
}

export class KeywordProvider {
	props: vscode.CompletionItem[];

	// generate completion items for the hardcoded functions
	constructor (extensionPath : string) {
		this.props = new Array<vscode.CompletionItem>();

		for (let kw of keywordDefs.keywords) {
			let def: vscode.CompletionItem = new vscode.CompletionItem(kw.toString());
			def.kind = vscode.CompletionItemKind.Keyword;
			this.props.push(def);
		}
	}

	provideCompletionItems(document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext): Thenable<vscode.CompletionItem[]> | vscode.CompletionItem[] {


		//
		// keywords
		//
		return new Promise<vscode.CompletionItem[]>((resolve, reject) => {
			// don't provide completion unless it's enabled
			if (!vscode.workspace.getConfiguration("vscode-codscript").get("use_builtin_completionItems", true)) {
				reject();
				return;
			}

			// dynamically resolved completion items
			let propItems: vscode.CompletionItem[] = [];
			if (propItems.length) {
				resolve(this.props.concat(propItems));
			}
			resolve(this.props);
		});
	}
}
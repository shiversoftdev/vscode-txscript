// defs.ts generator
// Data pulled from https://docs.raid-gaming.net source code
// Ignore this if you're not an internal developer

const fs = require('fs')
const api = require('./api').categories.cod4

const escapeString = (str) => {
	return str.replace(/\\/g, '\\\\')
}

console.log('Collecting metadata...')

let functionNames = [];
let functions = {};

// Loop over every namespace
for (let namespace in api.namespaces) {
	// Loop over every method/function
	for (let method in api.namespaces[namespace].methods) {
		functionNames.push(method)
		functions[method] = api.namespaces[namespace].methods[method]
	}
}

let template = `/* tslint:disable:max-line-length */

export class DefFunction {
	name: string;
	decl: string;
	callon: string;
	desc: string;
	reqArgs: string[];
	optArgs: string[];
	example: string;

	constructor () {
		this.name = "";
		this.decl = "";
		this.callon = "";
		this.desc = "";
		this.reqArgs = [];
		this.optArgs = [];
		this.example = "";
	}
}

export let defs: Array<DefFunction> = new Array<DefFunction>();

let funcDef: DefFunction;
`

functionNames = functionNames.sort()
for (let name of functionNames) {
	let func = functions[name]
	// Omitted unused metadata like "callon", "reqArgs" etc.
	template += `
funcDef = new DefFunction;
funcDef.name = \`${escapeString(name)}\`;
funcDef.decl = \`${escapeString(func.usage)}\`;
funcDef.desc = \`${escapeString(func.description)}\`;
funcDef.example = \`${escapeString(func.example)}\`;
defs.push(funcDef);
`
}

fs.writeFile('../src/defs/defs.ts', template, (err) => {
	if (err) throw err
	console.log('Wrote metadata to /src/defs/defs.ts')
})

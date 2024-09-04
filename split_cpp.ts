/**
My uni uses a stupid structure for cpp where classes have to be defined in individual files and declared in another set of files.

But I want to do it all in one file to keep track of everything.

This function should split it up into separate files.


cpp files must be formatted as 

```cpp

// filename.extension
content;
// end
// filename.extension
content;
// end

```
etc...

It doesn't account for includes or imports unless you put them in one of the sections.
Also, if a header file requires another header file, the import will not be added.

It is recommmended to go thorugh all your generated files and fix them after running.

*/

import { ensureDirSync } from "https://deno.land/std@0.110.0/fs/ensure_dir.ts";

export function splitCPP(file: string, outputFolder?: string) {
	let src = Deno.readTextFileSync(file).replaceAll("\r\n", " ");
	if (outputFolder) {
		ensureDirSync(outputFolder);
	}

	// Get the sections
	const sections: string[][] = [];
	while (src.length > 1) {
		const start = new RegExp(/\/\/ \w*\.\w+/).exec(src);
		const end = new RegExp(/\/\/ end/).exec(src);
		const content = src
			.slice(start?.index ?? 0, end?.index ? end.index + 6 : 1)
			.replaceAll(new RegExp(/\/\/ \w*\.\w+\s{2}/, "g"), "")
			.replaceAll(new RegExp(/\s{2}\/\/ end/, "g"), "");
		if (content.length > 1) {
			sections.push([(start?.[0] ?? "").replace("// ", ""), content]);
		}
		const arr = Array.from(src);
		arr.splice(start?.index ?? 0, end?.index ? end.index + 6 - (start?.index ?? 0) : 1);
		src = arr.join("");
	}

	// Get header files and add imports
	const hfiles: string[] = [];
	for (let i = 0; i < sections.length; i++) {
		// header guards
		if (/.*\.h/.test(sections[i][0])) {
			const defName = sections[i][0].toLocaleUpperCase().replace(".", "_");
			sections[i][1] = "#ifndef " + defName + "\n" + "#define " + defName + "\n" + sections[i][1] + "\n" + "#endif";
			hfiles.push(sections[i][0]);
		}
	}
	// Add imports to non-header files
	for (let i = 0; i < sections.length; i++) {
		if (!/.*\.h/.test(sections[i][0])) {
			for (let j = 0; j < hfiles.length; j++) {
				sections[i][1] = "#include " + `\"${hfiles[j]}\"` + "\n" + sections[i][1];
			}
		}
		Deno.writeTextFileSync(outputFolder ? outputFolder + "/" + sections[i][0] : sections[i][0], sections[i][1]);
	}
}

splitCPP(Deno.args[0], Deno.args[1]);

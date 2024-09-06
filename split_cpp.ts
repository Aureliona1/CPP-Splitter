import { ensureDirSync } from "https://deno.land/std@0.110.0/fs/ensure_dir.ts";
export function splitCPP(file: string, outputFolder?: string) {
	let src = Deno.readTextFileSync(file).replaceAll("\r\n", " ");
	if (outputFolder) {
		ensureDirSync(outputFolder);
	}
	// Get the sections
	const sections: string[][] = [];
	while (src.length > 1) {
		const start = /\/\/ \w*\.(?:cpp|h)\s+/.exec(src);
		const end = /\/\/ end/.exec(src);
		// If there are no start points in the script then we can just stop the function.
		if (!start) break;
		// If the endpoint is somehow before a valid startpoint (i.e., startpoint formatted wrong), remove the endpoint and move on
		if ((end?.index ?? 0) + 6 < start.index) {
			const arr = Array.from(src);
			arr.splice(end?.index ?? 0, (end?.index ?? 0) + 6);
			src = arr.join("");
		} else {
			// In the case that we have a valid start and end
			const content = src
				.slice(start?.index ?? 0, end?.index ? end.index + 6 : 1) // Get src section
				.replaceAll(new RegExp(/\/\/ \w*\.(?:cpp|h)\s*/, "g"), "") // Remove start comment
				.replaceAll(new RegExp(/\s*\/\/ end/, "g"), ""); // Remove end comment
			if (content.length > 1) {
				sections.push([(start?.[0] ?? "").replace("// ", "").trim(), content]); // For a while there wasn't a .trim() here which kept making files with a space at the end of the name :(
			}
			const arr = Array.from(src);
			arr.splice(start?.index ?? 0, end?.index ? end.index + 6 - (start?.index ?? 0) : 1); // Remove the content from src
			src = arr.join("");
		}
	}
	// Get header files and add imports
	const hfiles: string[] = [];
	for (let i = 0; i < sections.length; i++) {
		// header guards
		if (/.*\.h/.test(sections[i][0])) {
			const defName = sections[i][0].toLocaleUpperCase().replace(".", "_");
			sections[i][1] = "#ifndef " + defName + "\n#define " + defName + "\n" + sections[i][1] + "\n#endif";
			hfiles.push(sections[i][0]);
		}
	}
	// Add imports to non-header files
	for (let i = 0; i < sections.length; i++) {
		if (!/.*\.h/.test(sections[i][0])) {
			for (let j = 0; j < hfiles.length; j++) {
				sections[i][1] = `#include \"${hfiles[j]}\"\n` + sections[i][1];
			}
		}
		Deno.writeTextFileSync(outputFolder ? outputFolder + "/" + sections[i][0] : sections[i][0], sections[i][1]);
	}
}

splitCPP(Deno.args[0], Deno.args[1]);

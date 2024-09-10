import { ensureDirSync } from "https://deno.land/std@0.110.0/fs/ensure_dir.ts";
export function splitCPP(file: string, outputFolder?: string) {
	let src = Deno.readTextFileSync(file).replaceAll("\r\n", " ");
	if (outputFolder) {
		ensureDirSync(outputFolder);
	}
	let headerContent = "";
	if (/\/\/\s*Headers\s+/.test(src)) {
		const start = /\/\/\s*Headers\s+/.exec(src);
		const end = /\/\/\s*end/.exec(src);
		if (!start) {
			console.error("How tf did we get here...");
		}
		if ((end?.index ?? 0) + 6 < (start?.index ?? 0)) {
			console.log("Header section must be at the top of your script!");
		} else {
			headerContent = src
				.slice(start?.index ?? 0, end?.index ? end.index + 6 : 0)
				.replaceAll(new RegExp(/\/\/\s*Headers\s*/, "g"), "")
				.replaceAll(new RegExp(/\s*\/\/\s*end/, "g"), "");
			const arr = Array.from(src);
			arr.splice(start?.index ?? 0, end?.index ? end.index + 6 - (start?.index ?? 0) : 1);
			src = arr.join("");
		}
	}
	// Get the sections
	const sections: string[][] = [];
	while (src.length > 1) {
		const start = /\/\/\s*\w*\.(?:cpp|h)\s+/.exec(src);
		const end = /\/\/\s*end/.exec(src);
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
				.replaceAll(new RegExp(/\/\/\s*\w*\.(?:cpp|h)\s*/, "g"), "") // Remove start comment
				.replaceAll(new RegExp(/\s*\/\/\s*end/, "g"), ""); // Remove end comment
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
			sections[i][1] = "#ifndef " + defName + "\n#define " + defName + "\n" + headerContent + "\n" + sections[i][1] + "\n#endif";
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

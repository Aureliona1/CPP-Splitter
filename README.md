# CPP-Splitter

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

## Installation

You must have deno installed on your system (or subsystem for wsl users).

Then run:

```bash
deno install -r --allow-all -g -n split_cpp "https://raw.githubusercontent.com/Aureliona1/CPP-Splitter/main/split_cpp.ts"
```

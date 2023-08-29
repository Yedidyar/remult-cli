export const toPascalCase = (str: string) => {
	return str
		.replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
		.replace(/^\w/, (c) => c.toUpperCase());
};

export function toCamelCase(str: string) {
	let words = toPascalCase(str).split("");
	if (words[0]) {
		words[0] = words[0].toLowerCase();
	}
	return words.join("");
}

export const toTitleCase = (str: string) => {
	return str
		.toLowerCase()
		.replace(/_/g, " ")
		.replace(/\w+/g, (match) => match.charAt(0).toUpperCase() + match.slice(1));
};

export const kababToConstantCase = (str: string) => {
	return str.toUpperCase().replace(/-/g, "_");
};

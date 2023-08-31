export const toPascalCase = (str: string) => {
	return str
		.replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
		.replace(/^\w/, (c) => c.toUpperCase());
};

export function toCamelCase(str: string) {
	const words = toPascalCase(str).split("");
	if (words[0]) {
		words[0] = words[0].toLowerCase();
	}
	return words.join("");
}

export const toTitleCase = (str: string) => {
	// Replace dashes and underscores with spaces
	const stringWithSpaces = str.replace(/[-_]/g, " ");

	// Add a space before each capital letter (for camelCase)
	const titleCaseString = stringWithSpaces.replace(/([a-z])([A-Z])/g, "$1 $2");

	// Capitalize the first letter of each word and join them back
	const words = titleCaseString.split(" ");
	const titleCaseWords = words.map(
		(word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
	);

	return titleCaseWords.join(" ");
};

export const kababToConstantCase = (str: string) => {
	return str
		.replace(/([a-z\d])([A-Z])/g, "$1_$2")
		.toUpperCase()
		.replace(/-/g, "_");
};

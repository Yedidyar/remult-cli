export const genId = (prefix = "") => {
	let count = 0;
	return () => {
		count++;
		return `${prefix}${count}`;
	};
};

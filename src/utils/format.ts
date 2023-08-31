// can be this shape : "@KitFields.string" => "@KitFields.string#@kitql/remult"
export const toFnAndImport = (str: string) => {
	const splited = str.split("#");
	const str_fn = splited[0] ?? "";
	const str_fn_base = str_fn.replace("@", "").split(".")[0];
	const str_import =
		splited.length > 1
			? `import { ${str_fn_base} } from '${splited[1] ?? ""}'`
			: null;

	return {
		str_fn,
		str_import,
	};
};

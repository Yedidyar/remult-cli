export interface Field {
	defaultValue?: string;
	type: string;
	name: string;
	allowNull: boolean;
}

export interface EntitySchema {
	fields: Field[];
}

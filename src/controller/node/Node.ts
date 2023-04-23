export interface Node {
	kind: string;
	value: any;
	validate(): void;
	interpret(filter: any, dataset: any[]): any[];
}

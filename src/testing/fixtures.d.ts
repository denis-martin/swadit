// YAML fixtures are imported as text: `import x from '...yaml' with { loader: 'text' }`
declare module "*.yaml" {
	const content: string;
	export default content;
}

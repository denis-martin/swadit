import { Component, Input, OnInit } from '@angular/core';

import * as YAML from 'js-yaml';

@Component({
	selector: 'swadit-extensions-view',
	templateUrl: './extensions-view.component.html',
	styleUrls: ['./../schema-view.component.scss']
})
export class ExtensionsViewComponent implements OnInit {
	@Input() obj: any;

	constructor() { }

	ngOnInit() {
	}

	getAdditionalKeys(obj: Object): Array<string>
	{
		if (obj == null) return null;
		let res: Array<string> = [];
		Object.keys(obj).forEach(k => {
			if (k.startsWith("x-")) {
				res.push(k);
			}
		});
		if (res.length > 0) {
			return res;
		} else {
			return null;
		}
	}

	isComplex(obj: any): boolean
	{
		return !(typeof obj == 'number' || typeof obj == 'string');
	}

	toYaml(obj: Object): string
	{
		return YAML.dump(obj);
	}
}

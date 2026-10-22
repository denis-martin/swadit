/*
 * Copyright 2017 Denis Martin.  This file is part of swadit.
 *
 * swadit is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * swadit is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with swadit.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, AfterViewInit, Output, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';

// provided as a global by the ace-builds scripts in angular.json
declare const ace: any;

/**
 * Minimal wrapper around the Ace editor (ace-builds).
 */
@Component({
    selector: 'ace',
    template: '',
    styles: [':host { display: block; }'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AceEditorComponent implements AfterViewInit, OnChanges, OnDestroy
{
	@Input() value: string = "";
	@Input() mode: string = "text";
	@Input() theme: string = "textmate";
	@Input() config: any = {};
	@Input() readOnly: boolean = false;
	@Output() valueChange = new EventEmitter<string>();

	private editor: any;

	constructor(private elementRef: ElementRef, private zone: NgZone)
	{
	}

	ngAfterViewInit(): void
	{
		this.zone.runOutsideAngular(() => {
			this.editor = ace.edit(this.elementRef.nativeElement, this.config);
		});
		this.applyOptions();
		this.setValue(this.value);
		this.editor.on('change', () => {
			const value = this.editor.getValue();
			if (value !== this.value) {
				this.zone.run(() => {
					this.value = value;
					this.valueChange.emit(value);
				});
			}
		});
	}

	ngOnChanges(changes: SimpleChanges): void
	{
		if (!this.editor) {
			return;
		}
		if (changes['value'] && this.editor.getValue() !== this.value) {
			this.setValue(this.value);
		}
		if (changes['mode'] || changes['theme'] || changes['config'] || changes['readOnly']) {
			this.applyOptions();
		}
	}

	ngOnDestroy(): void
	{
		if (this.editor) {
			this.editor.destroy();
			this.editor = null;
		}
	}

	private applyOptions(): void
	{
		this.editor.setOptions(this.config || {});
		this.editor.session.setMode('ace/mode/' + this.mode);
		this.editor.setTheme('ace/theme/' + this.theme);
		this.editor.setReadOnly(this.readOnly);
	}

	private setValue(value: string): void
	{
		this.editor.session.setValue(value || "");
	}
}

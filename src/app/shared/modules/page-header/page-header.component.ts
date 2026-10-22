import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-page-header',
    templateUrl: './page-header.component.html',
    styleUrls: ['./page-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PageHeaderComponent {
    @Input() heading: string;
    @Input() icon: string;
}

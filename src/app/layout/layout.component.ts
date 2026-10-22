import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LayoutComponent implements OnInit {

    constructor(public router: Router) { }

    ngOnInit() {
        if (this.router.url === '/') {
            this.router.navigate(['/api-info']);
        }
    }

}

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SignupComponent implements OnInit {

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() { }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    ngOnInit() { }
}

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LoginComponent implements OnInit {

    constructor(public router: Router) {
    }

    ngOnInit() {
    }

    onLoggedin() {
        localStorage.setItem('isLoggedin', 'true');
    }

}

import { Component, ChangeDetectionStrategy } from '@angular/core';

import { ApisService } from '../../services';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SidebarComponent {
    isActive = false;
    showMenu = '';
    filterText: string;

    constructor(public apis: ApisService) {
        
    }

    eventCalled() {
        this.isActive = !this.isActive;
    }
    addExpandClass(element: any) {
        if (element === this.showMenu) {
            this.showMenu = '0';
        } else {
            this.showMenu = element;
        }
    }
}

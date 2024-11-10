import { Component } from '@angular/core';

@Component({
  selector: 'app-options-menu',
  templateUrl: './options-menu.component.html',
  styleUrls: ['./options-menu.component.css']
})
export class OptionsMenuComponent {
  activeMenu: string | null = null;

  handleMouseEnter(menu: string): void {
    this.activeMenu = menu;
  }

  handleMouseLeave(): void {
    this.activeMenu = null;
  }
}

import { Component } from '@angular/core';

@Component({
  selector: 'app-options-menu',
  imports: [],
  templateUrl: './options-menu.html',
  styleUrl: './options-menu.scss',
})
export class OptionsMenu {
  activeMenu: string | null = null;

  handleMouseEnter(menu: string): void {
    this.activeMenu = menu;
  }

  handleMouseLeave(): void {
    this.activeMenu = null;
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-options-menu',
  standalone: true,
  imports: [CommonModule],
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

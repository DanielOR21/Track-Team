import { Component, HostListener, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { LocalStorageService } from './services/local-storage.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, 
    RouterLink, 
    CommonModule, 
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'pokeapp-angular';
  currentLanguage: 'en' | 'es' = 'en';
  isSmallScreen: boolean = false;

  navDropdown: boolean = false;
  isRotated: boolean = false;

  constructor(private router: Router, private localStorageService: LocalStorageService, @Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreenSize(); // Verificar tamaño solo en el navegador
    }
  }

  ngOnInit() {
    this.localStorageService.language$.subscribe((language) => {
      this.currentLanguage = language;
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreenSize(); // Solo en el cliente
    }
  }

  private checkScreenSize(): void {
    this.isSmallScreen = window.innerWidth <= 1250;
  }

  setLanguage(newLng: 'en' | 'es'): void {
    this.localStorageService.setLanguageLS(newLng);
  }

  toggleDropdown(): void {
    this.navDropdown = !this.navDropdown;
    this.isRotated = !this.isRotated;
  }
}

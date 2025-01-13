import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  constructor(private router: Router, private localStorageService: LocalStorageService) {}

  ngOnInit() {
    this.localStorageService.language$.subscribe((language) => {
      this.currentLanguage = language;
    });
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        localStorage.setItem('main-url', event.urlAfterRedirects);
      }
    });

    const lastUrl = localStorage.getItem('main-url');
    if (lastUrl) {
      this.router.navigateByUrl(lastUrl).catch(() => {
        this.router.navigate(['/default']);
      });
    }
  }

  setLanguage(newLng: 'en' | 'es'): void {
    this.localStorageService.setLanguageLS(newLng);
  }
}
